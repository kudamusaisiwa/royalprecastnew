import { create } from 'zustand';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { useActivityStore } from './activityStore';
import { useNotificationStore } from './notificationStore';
import { createProtectedStore } from './baseStore';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import type { Task, TaskAssignee } from '../types';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  addTask: (task: Partial<Task>) => Promise<string>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (taskId: string, userId: string, userName: string) => Promise<void>;
  removeAssignee: (taskId: string, userId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>(
  createProtectedStore((set, get) => ({
    tasks: [],
    loading: false,
    error: null,

    initialize: async () => {
      try {
        const { user } = useAuthStore.getState();
        if (!user) {
          console.log('No user logged in, skipping task initialization');
          return;
        }

        console.log('Initializing tasks for user:', user.id);
        set({ loading: true });

        // Query all tasks - we'll filter on the client side
        const tasksQuery = query(
          collection(db, 'tasks'),
          orderBy('createdAt', 'desc')
        );

        // Subscribe to tasks
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
          const newTasks = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt || null,
              completedAt: data.completedAt || null,
              deletedAt: data.deletedAt || null,
              dueDate: data.dueDate || Timestamp.now(),
              assignees: Array.isArray(data.assignees) ? data.assignees : [],
              metadata: data.metadata || null
            } as Task;
          });

          console.log('Fetched tasks:', newTasks.length);
          set({ tasks: newTasks, loading: false, error: null });
        }, (error) => {
          console.error('Error in task subscription:', error);
          set({ error: error.message, loading: false });
        });

        return unsubscribe;
      } catch (error: any) {
        console.error('Error in initialize:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addTask: async (taskData: Partial<Task>) => {
      console.log('Starting task creation...', { taskData });
      
      const currentUser = useAuthStore.getState().user;
      console.log('Current user state:', currentUser);
      
      if (!currentUser) {
        console.error('No user found in addTask');
        throw new Error('User must be logged in to create tasks');
      }

      try {
        console.log('Preparing task data...');
        const newTaskData = {
          title: taskData.title,
          createdBy: currentUser.id,
          createdAt: Timestamp.now(),
          dueDate: taskData.dueDate instanceof Date 
            ? Timestamp.fromDate(taskData.dueDate)
            : taskData.dueDate || Timestamp.fromDate(new Date()),
          status: taskData.status || 'pending',
          completedAt: null,
          deletedAt: null,
          assignees: [{
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email || '',
            assignedAt: Timestamp.now()
          }],
          priority: taskData.priority || 'medium',
          orderId: taskData.orderId || null,
          orderNumber: taskData.orderNumber || null,
          customerId: taskData.customerId || null,
          customerName: taskData.customerName || null,
          metadata: taskData.metadata || null
        };

        console.log('Prepared task data:', newTaskData);

        // Add to Firestore
        console.log('Adding to Firestore...');
        const docRef = await addDoc(collection(db, 'tasks'), newTaskData);
        console.log('Successfully added to Firestore with ID:', docRef.id);

        // Log activity after successful creation
        console.log('Logging activity...');
        const { logActivity } = useActivityStore.getState();
        await logActivity({
          type: 'task_created',
          userId: currentUser.id,
          userName: currentUser.name || currentUser.email,
          message: `Created task: ${taskData.title}`,
          metadata: {
            taskId: docRef.id,
            title: taskData.title
          }
        });
        console.log('Activity logged successfully');

        return docRef.id;
      } catch (error: any) {
        console.error('Error in addTask:', error);
        console.error('Error stack:', error.stack);
        set({ error: error.message });
        throw error;
      }
    },

    updateTask: async (id: string, taskData: Partial<Task>) => {
      try {
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();

        if (!user) {
          throw new Error('User must be logged in to update tasks');
        }

        const taskRef = doc(db, 'tasks', id);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }

        const currentTask = taskDoc.data() as Task;

        // Ensure dates are Timestamps
        const updatedData = { ...taskData };
        if (updatedData.dueDate && !(updatedData.dueDate instanceof Timestamp)) {
          updatedData.dueDate = Timestamp.fromDate(
            updatedData.dueDate instanceof Date ? updatedData.dueDate : new Date(updatedData.dueDate)
          );
        }
        if (updatedData.completedAt && !(updatedData.completedAt instanceof Timestamp)) {
          updatedData.completedAt = Timestamp.fromDate(
            updatedData.completedAt instanceof Date ? updatedData.completedAt : new Date(updatedData.completedAt)
          );
        }

        // Update Firestore
        await updateDoc(taskRef, updatedData);

        // Update local state
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === id
              ? { ...task, ...updatedData }
              : task
          )
        }));

        // Log activity if status changes
        if (taskData.status && taskData.status !== currentTask.status) {
          await logActivity({
            type: `task_${taskData.status}`,
            userId: user.id,
            userName: user.name || user.email,
            message: `Changed task status to ${taskData.status}: ${currentTask.title}`,
            metadata: {
              taskId: id,
              oldStatus: currentTask.status,
              newStatus: taskData.status
            }
          });
        }

        return;
      } catch (error: any) {
        console.error('Error in updateTask:', error);
        set({ error: error.message });
        throw error;
      }
    },

    assignTask: async (taskId: string, userId: string, userName: string) => {
      try {
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();
        const { addNotification } = useNotificationStore.getState();
        
        if (!user) {
          throw new Error('User must be logged in to assign tasks');
        }

        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }

        const taskData = taskDoc.data() as Task;
        const newAssignee = {
          userId,
          userName,
          assignedAt: Timestamp.now()
        };

        // Check if user is already assigned
        const isAlreadyAssigned = taskData.assignees?.some(
          assignee => assignee.userId === userId
        );

        if (!isAlreadyAssigned) {
          // Update Firestore
          const updatedAssignees = [...(taskData.assignees || []), newAssignee];
          await updateDoc(taskRef, {
            assignees: updatedAssignees
          });

          // Update local state immediately
          set((state) => ({
            tasks: state.tasks.map(task => 
              task.id === taskId 
                ? { ...task, assignees: updatedAssignees }
                : task
            )
          }));

          // Log activity
          await logActivity({
            type: 'task_assigned',
            userId: user.id,
            userName: user.name || user.email,
            message: `Assigned ${userName} to task: ${taskData.title}`,
            metadata: {
              taskId,
              assigneeId: userId,
              assigneeName: userName
            }
          });

          // Send notification to the newly assigned user
          if (userId !== user.id) {
            addNotification({
              message: `You have been assigned to task: ${taskData.title}`,
              type: 'info',
              link: `/tasks/${taskId}`,
              metadata: {
                userId,
                userName
              }
            });
          }
        }

        return;
      } catch (error: any) {
        console.error('Error in assignTask:', error);
        set({ error: error.message });
        throw error;
      }
    },

    removeAssignee: async (taskId: string, userId: string) => {
      try {
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();
        const state = get();
        
        if (!user) {
          throw new Error('User must be logged in to remove assignees');
        }

        // Get current task data
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }

        const taskData = taskDoc.data() as Task;
        const removedAssignee = taskData.assignees?.find(a => a.userId === userId);
        
        if (!removedAssignee) {
          console.log('User was not assigned to this task');
          return;
        }

        // Create new assignees array without the removed user
        const updatedAssignees = taskData.assignees.filter(
          assignee => assignee.userId !== userId
        );

        // Update Firestore first
        await updateDoc(taskRef, {
          assignees: updatedAssignees
        });

        // Update local state
        const updatedTasks = state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, assignees: updatedAssignees }
            : task
        );

        set({ tasks: updatedTasks });

        // Log the activity
        await logActivity({
          type: 'task_unassigned',
          userId: user.id,
          userName: user.name || user.email,
          message: `Removed ${removedAssignee.userName} from task: ${taskData.title}`,
          metadata: {
            taskId,
            removedUserId: userId,
            removedUserName: removedAssignee.userName
          }
        });

        return;
      } catch (error: any) {
        console.error('Error in removeAssignee:', error);
        set({ error: error.message });
        throw error;
      }
    },

    deleteTask: async (id: string) => {
      try {
        console.log('Starting deleteTask with ID:', id);
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();
        
        if (!user) {
          throw new Error('User must be logged in to delete tasks');
        }

        // First check if the document exists
        const taskRef = doc(db, 'tasks', id);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
          throw new Error(`Task with ID ${id} does not exist`);
        }

        const existingTask = taskSnap.data();
        console.log('Existing task data:', existingTask);

        // Update task to mark as deleted
        const updateData = {
          status: 'deleted',
          deletedAt: Timestamp.fromDate(new Date())
        };

        console.log('Update data prepared:', updateData);
        
        await updateDoc(taskRef, updateData);
        console.log('Task marked as deleted, ID:', id);

        // Update local state
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...updateData,
                  deletedAt: updateData.deletedAt
                }
              : task
          ),
        }));

        // Log activity
        await logActivity({
          type: 'task_deleted',
          userId: user.id,
          userName: user.name || user.email,
          message: `Deleted task: ${existingTask.title}`,
          metadata: {
            taskId: id,
            title: existingTask.title
          }
        });
      } catch (error: any) {
        console.error('Error in deleteTask:', error);
        set({ error: error.message });
        throw error;
      }
    },
  }))
);
