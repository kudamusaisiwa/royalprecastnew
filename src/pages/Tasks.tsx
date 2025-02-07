import React, { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Timestamp, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../lib/firebase';
import { 
  CalendarIcon, 
  Search, 
  Trash2, 
  UserPlus, 
  Plus, 
  Clock, 
  Filter, 
  X, 
  Check, 
  Pencil, 
  LayoutGrid, 
  List, 
  ShoppingCart, 
  User 
} from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { useToast } from "../components/ui/use-toast";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type LinkedItem = {
  id: string;
  type: 'order';
  label: string;
  customerName: string;
  orderNumber: string;
  searchableOrderNumber: string;
  searchableCustomerName: string;
};

const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const getContrastText = (bgColor: string) => {
  const [h, s, l] = bgColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/).slice(1).map(Number);
  return l > 50 ? 'text-black' : 'text-white';
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, initialize: initTasks, addTask, updateTask, deleteTask, assignTask, removeAssignee } = useTaskStore();
  const { toast } = useToast();
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'deleted'>('pending');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'all' | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [selectedLink, setSelectedLink] = useState<LinkedItem | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchOpen, setLinkSearchOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<string>('medium');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState<Partial<Task> | null>(null);
  const [editDueDate, setEditDueDate] = useState<Date>(new Date());

  const playAssignSound = () => {
    try {
      // Use the correct path relative to the public directory
      const soundPath = '/assets/sounds/notification.mp3';
      const assignSound = new Audio(soundPath);
      assignSound.currentTime = 0;
      assignSound.play().catch(error => {
        // Silently handle audio playback errors
        console.debug('Could not play notification sound:', error);
      });
    } catch (error) {
      // Silently handle audio creation errors
      console.debug('Could not create audio object:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    console.log('Initializing tasks for user:', user);
    const cleanup = initTasks();
    return () => {
      if (cleanup) {
        cleanup.then(unsubscribe => unsubscribe && unsubscribe());
      }
    };
  }, [initTasks, user]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    console.log('Current tasks:', tasks);
  }, [tasks]);

  useEffect(() => {
    const fetchLinkedItems = async () => {
      if (!user) {
        console.log('No user found, skipping fetch');
        return;
      }

      try {
        console.log('Starting to fetch orders...');
        
        // Fetch orders
        const ordersRef = collection(db, 'orders');
        console.log('Fetching orders...');
        const ordersSnap = await getDocs(ordersRef);
        console.log('Orders snapshot:', ordersSnap.size, 'documents');

        const orderItems: LinkedItem[] = [];

        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          console.log('Order data:', data);
          
          // Extract order details, ensuring we have values
          const orderNumber = data.orderNumber || doc.id;
          const customerName = data.customerName || 'Unknown Customer';
          const searchableOrderNumber = orderNumber.toString().toLowerCase();
          const searchableCustomerName = customerName.toString().toLowerCase();
          
          orderItems.push({
            id: doc.id,
            type: 'order',
            label: `Order #${orderNumber} - ${customerName}`,
            customerName: customerName,
            orderNumber: orderNumber,
            searchableOrderNumber,
            searchableCustomerName
          });
        });

        console.log('Processed orders:', orderItems);
        setLinkedItems(orderItems);

      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders. " + (error as Error).message,
          variant: "destructive",
        });
      }
    };

    fetchLinkedItems();
  }, [user]);

  useEffect(() => {
    console.log('linkedItems changed:', linkedItems);
  }, [linkedItems]);

  const filteredOrders = useMemo(() => {
    console.log('Filtering orders with query:', linkSearchQuery);
    if (!linkSearchQuery) return linkedItems;
    
    const searchTerms = linkSearchQuery.toLowerCase().trim().split(/\s+/);
    
    return linkedItems.filter(item => {
      const orderNumber = item.orderNumber.toString().toLowerCase();
      const customerName = item.customerName.toString().toLowerCase();
      
      return searchTerms.every(term => 
        orderNumber.includes(term) || customerName.includes(term)
      );
    });
  }, [linkedItems, linkSearchQuery]);

  useEffect(() => {
    console.log('Filtered orders:', filteredOrders);
  }, [filteredOrders]);

  const handleSelect = (item: LinkedItem) => {
    console.log('Selected item:', item);
    setSelectedLink(item);
    setLinkSearchOpen(false);
    setLinkSearchQuery('');
  };

  const handleOrderSelect = (order: LinkedItem) => {
    console.log('Order selected:', order);
    setSelectedLink({
      id: order.id,
      type: 'order',
      label: `Order #${order.orderNumber}`,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      searchableOrderNumber: order.searchableOrderNumber,
      searchableCustomerName: order.searchableCustomerName
    });
    setLinkSearchOpen(false);
    setLinkSearchQuery('');
  };

  const handleTaskComplete = async (taskId: string, isComplete: boolean) => {
    try {
      const now = new Date();
      await updateTask(taskId, {
        status: isComplete ? 'completed' : 'pending',
        completedAt: isComplete ? Timestamp.fromDate(now) : null,
      });

      toast({
        title: isComplete ? "Task Completed" : "Task Reopened",
        description: isComplete ? "Task marked as complete" : "Task marked as pending",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = { ...updates };
      
      // Convert Date objects to Timestamps
      if (updates.completedAt instanceof Date) {
        updatedTask.completedAt = Timestamp.fromDate(updates.completedAt);
      }
      if (updates.dueDate instanceof Date) {
        updatedTask.dueDate = Timestamp.fromDate(updates.dueDate);
      }
      if (updates.createdAt instanceof Date) {
        updatedTask.createdAt = Timestamp.fromDate(updates.createdAt);
      }

      updateTask(taskId, updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getDateFromField = (dateField: any): Date => {
    if (!dateField) return new Date();
    // Handle both Firestore Timestamp and regular Date objects
    return dateField.toDate ? dateField.toDate() : new Date(dateField);
  };

  const formatDate = (dateField: any): string => {
    const date = getDateFromField(dateField);
    return format(date, 'MMM d, yyyy');
  };

  const isToday = (dateField: any) => {
    const date = getDateFromField(dateField);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isPastDue = (dateField: any) => {
    const date = getDateFromField(dateField);
    const today = new Date();
    return date < today && !isToday(dateField);
  };

  const formatTime = (date: Date | Timestamp | null) => {
    if (!date) return '';
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return format(dateObj, 'p');
  };

  const prepareTaskCreation = () => {
    if (!newTask.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive"
      });
      return;
    }

    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create tasks",
        variant: "destructive"
      });
      return;
    }

    const taskData: Partial<Task> = {
      title: newTask,
      priority,
      dueDate: Timestamp.fromDate(dueDate),
      status: 'pending',
      createdBy: currentUser.uid,
      createdAt: Timestamp.fromDate(new Date()),
      assignees: []
    };

    if (selectedLink) {
      console.log('Adding selected order to task:', selectedLink);
      taskData.orderId = selectedLink.id;
      taskData.orderNumber = selectedLink.orderNumber;
      taskData.customerName = selectedLink.customerName;
    }

    setPendingTaskData(taskData);
    setConfirmDialogOpen(true);
  };

  const handleAddTask = async () => {
    try {
      if (!pendingTaskData) {
        console.error('No pending task data found');
        return;
      }

      const taskId = await addTask(pendingTaskData);
      console.log('Task created successfully with ID:', taskId);
      
      setNewTask('');
      setPriority('medium');
      setSelectedLink(null);
      setIsAddTaskOpen(false);
      setConfirmDialogOpen(false);
      setPendingTaskData(null);
      setDueDate(new Date());

      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;

    try {
      const updates: Partial<Task> = {
        title: editTitle,
        priority: editPriority,
        dueDate: Timestamp.fromDate(editDueDate)
      };

      await updateTask(editingTask.id, updates);
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const openAssignDialog = (task: Task) => {
    setSelectedTask(task);
    setAssignDialogOpen(true);
  };

  const handleAssignTask = async (taskId: string, userId: string, userName: string) => {
    try {
      // Don't proceed if this is a new task that hasn't been created yet
      if (taskId === 'new') {
        toast({
          title: "Error",
          description: "Please save the task before assigning users",
          variant: "destructive",
        });
        return;
      }

      await assignTask(taskId, userId, userName);
      
      // Play sound
      playAssignSound();
      
      const task = tasks.find(t => t.id === taskId);
      const isUnassigning = task?.assignees.some(a => a.userId === userId);
      
      // Show toast
      toast({
        title: "Task Assignment Updated",
        description: `Successfully ${isUnassigning ? 'removed' : 'assigned'} ${userName}`,
        variant: "default",
      });

      // Close dialog after successful assignment
      setAssignDialogOpen(false);
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to update task assignment",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignee = async (taskId: string, userId: string) => {
    try {
      await removeAssignee(taskId, userId);

      // Get the task and assignee info for the toast message
      const task = tasks.find(t => t.id === taskId);
      const assignee = task?.assignees.find(a => a.userId === userId);
      
      toast({
        title: "Success",
        description: assignee 
          ? `Removed ${assignee.userName} from task`
          : "Assignee removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing assignee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove assignee",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await updateTask(id, {
        status: 'deleted',
        deletedAt: Timestamp.fromDate(new Date())
      });

      toast({
        title: "Task Deleted",
        description: "Task moved to deleted tasks",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const renderSelectedLinkDisplay = () => {
    if (!selectedLink) return "Link to Order";
    return (
      <div className="flex flex-col">
        <span>Order #{selectedLink.orderNumber}</span>
        <span className="text-sm text-muted-foreground">
          {selectedLink.customerName}
        </span>
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCardBorderColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-destructive/20';
      case 'medium':
        return 'border-warning/20';
      case 'low':
        return 'border-secondary/20';
      default:
        return 'border-border';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getTaskStatusBadge = (task: Task) => {
    try {
      const now = new Date();
      const dueDate = getDateFromField(task.dueDate);
      const isOverdue = task.status === 'pending' && dueDate < now;

      if (task.status === 'completed') {
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800">Completed</Badge>;
      }
      if (task.status === 'deleted') {
        return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">Deleted</Badge>;
      }
      if (isOverdue) {
        return <Badge variant="destructive" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-800">Overdue</Badge>;
      }
      return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800">Pending</Badge>;
    } catch (error) {
      console.error('Error in getTaskStatusBadge:', error);
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTaskPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-800',
      medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800',
      low: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800'
    };
    return (
      <Badge variant="outline" className={colors[priority.toLowerCase()] || colors.medium}>
        {priority}
      </Badge>
    );
  };

  const filteredTasks = useMemo(() => {
    const { user } = useAuthStore.getState();
    if (!user) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filtered = tasks.filter(task => {
      // Filter by status
      if (filter !== 'all' && task.status !== filter) return false;

      // Filter by assignee
      if (assigneeFilter) {
        if (assigneeFilter === 'all') {
          return true;
        }
        return task.assignees.some(assignee => assignee.userId === assigneeFilter);
      } else {
        // By default, show tasks where user is creator or assignee
        return task.createdBy === user.id || 
               task.assignees.some(assignee => assignee.userId === user.id);
      }
    });

    // Sort tasks by status and due date
    return filtered.sort((a, b) => {
      const aDate = getDateFromField(a.dueDate);
      const bDate = getDateFromField(b.dueDate);
      aDate.setHours(0, 0, 0, 0);
      bDate.setHours(0, 0, 0, 0);
      
      // First, handle completed and deleted tasks (move to bottom)
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      if (a.status === 'deleted' && b.status !== 'deleted') return 1;
      if (b.status === 'deleted' && a.status !== 'deleted') return -1;
      
      // For pending tasks, sort by overdue, today, and future
      if (a.status === 'pending' && b.status === 'pending') {
        const aOverdue = aDate < now;
        const bOverdue = bDate < now;
        const aToday = aDate.getTime() === now.getTime();
        const bToday = bDate.getTime() === now.getTime();

        // Overdue tasks first
        if (aOverdue && !bOverdue) return -1;
        if (bOverdue && !aOverdue) return 1;

        // Today's tasks next
        if (aToday && !bToday && !bOverdue) return -1;
        if (bToday && !aToday && !aOverdue) return 1;

        // Then sort by priority for same-day tasks
        if ((aOverdue && bOverdue) || (aToday && bToday) || (!aOverdue && !aToday && !bOverdue && !bToday)) {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const aPriority = priorityOrder[a.priority?.toLowerCase()] || 1;
          const bPriority = priorityOrder[b.priority?.toLowerCase()] || 1;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
        }

        // Finally, sort by date
        return aDate.getTime() - bDate.getTime();
      }

      // For non-pending tasks of same status, sort by date
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks, filter, assigneeFilter]);

  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter(task => task.status === 'pending'),
      completed: filteredTasks.filter(task => task.status === 'completed'),
      deleted: filteredTasks.filter(task => task.status === 'deleted')
    };
  }, [filteredTasks]);

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate.toDate());
    setEditDialogOpen(true);
  };

  const renderTaskRow = (task: Task) => {
    const now = new Date();
    const dueDate = getDateFromField(task.dueDate);
    const isOverdue = task.status === 'pending' && dueDate < now;
    const rowKey = `${task.id}-${task.status}`;

    return (
      <TableRow key={rowKey} className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted",
        isOverdue && task.status === 'pending' ? 'bg-red-50/10' : ''
      )}>
        <TableCell className="w-[50px]">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={(checked) => handleTaskComplete(task.id, !!checked)}
          />
        </TableCell>
        <TableCell className="min-w-[300px]">
          <div className="flex flex-col gap-1">
            <div className="font-medium dark:text-gray-200 text-gray-900">{task.title}</div>
            <div className="flex items-center gap-2">
              {getTaskStatusBadge(task)}
              {getTaskPriorityBadge(task.priority || 'medium')}
              {isOverdue && task.status === 'pending' && (
                <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">Overdue</Badge>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="w-[120px]">
          <div className="flex -space-x-2">
            {task.assignees.map((assignee, index) => (
              <Avatar 
                key={`${task.id}-${assignee.userId}-${index}`}  
                style={{ 
                  backgroundColor: `var(--avatar-${index % 10})`,
                  color: 'white'
                }}
                className="h-6 w-6 border-2 border-background"
              >
                <AvatarFallback style={{ 
                  backgroundColor: 'inherit',
                  color: 'inherit'
                }}>
                  {assignee.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </TableCell>
        <TableCell className="w-[150px]">
          <div className="flex items-center text-sm dark:text-gray-200 text-gray-900">
            <CalendarIcon className="h-4 w-4 mr-1 dark:text-gray-200 text-gray-900" />
            <span className={cn(
              "dark:text-gray-200 text-gray-900",
              isOverdue && task.status === 'pending' && "text-destructive font-medium",
              isToday(dueDate) && task.status === 'pending' && "text-warning font-medium"
            )}>
              {formatDate(task.dueDate)}
              {isToday(dueDate) && " (Today)"}
              {isOverdue && task.status === 'pending' && " (Past Due)"}
            </span>
          </div>
        </TableCell>
        <TableCell className="min-w-[200px]">
          <div className="flex flex-col gap-1">
            {task.customerName && (
              <Link
                to={`/customers/${task.customerId}`}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
              >
                <User className="h-3 w-3 mr-1" />
                {task.customerName}
              </Link>
            )}
            {task.orderNumber && (
              <Link
                to={`/orders/${task.orderId}`}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                #{task.orderNumber}
              </Link>
            )}
          </div>
        </TableCell>
        <TableCell className="w-[100px] text-right dark:text-gray-200 text-gray-900">
          {task.status !== 'deleted' && (
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick(task)}
                className="dark:text-gray-200 text-gray-900"
              >
                <Pencil className="h-4 w-4 dark:text-gray-200 text-gray-900" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTask(task);
                  setAssignDialogOpen(true);
                }}
                className="dark:text-gray-200 text-gray-900"
              >
                <UserPlus className="h-4 w-4 dark:text-gray-200 text-gray-900" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTask(task.id)}
                className="dark:text-gray-200 text-gray-900"
              >
                <Trash2 className="h-4 w-4 dark:text-gray-200 text-gray-900" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const getAssigneeDisplayValue = () => {
    if (assigneeFilter === 'all') return 'All Assignees';
    if (!assigneeFilter || assigneeFilter === user?.id) return 'My Tasks';
    const selectedUser = users.find(u => u.id === assigneeFilter);
    return selectedUser ? (selectedUser.name || selectedUser.email) : 'Select Assignee';
  };

  const handleAssigneeFilterChange = (value: string) => {
    if (value === 'all') {
      setAssigneeFilter('all');
    } else if (!value || value === 'my') {
      setAssigneeFilter(null);
    } else {
      setAssigneeFilter(value);
    }
  };

  const handleDateSelect = (date: Date) => {
    setDueDate(date);
    setCalendarOpen(false); // Close calendar after selection
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Tasks</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Select
          value={filter}
          onValueChange={(value: 'all' | 'pending' | 'completed' | 'deleted') => setFilter(value)}
        >
          <SelectTrigger className="w-[180px] bg-background text-gray-900 dark:text-gray-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="pending">
              <span className="text-gray-900 dark:text-gray-200">Pending Tasks</span>
            </SelectItem>
            <SelectItem value="completed">
              <span className="text-gray-900 dark:text-gray-200">Completed Tasks</span>
            </SelectItem>
            <SelectItem value="deleted">
              <span className="text-gray-900 dark:text-gray-200">Deleted Tasks</span>
            </SelectItem>
            <SelectItem value="all">
              <span className="text-gray-900 dark:text-gray-200">All Tasks</span>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-900 dark:text-gray-200" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-gray-900 dark:text-gray-200"
          />
        </div>

        <Select 
          value={assigneeFilter || 'my'} 
          onValueChange={handleAssigneeFilterChange}
        >
          <SelectTrigger className="w-[180px] bg-background text-gray-900 dark:text-gray-200">
            <SelectValue>
              {getAssigneeDisplayValue()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="my">
              <span className="text-gray-900 dark:text-gray-200">My Tasks</span>
            </SelectItem>
            <SelectItem value="all">
              <span className="text-gray-900 dark:text-gray-200">All Assignees</span>
            </SelectItem>
            {users
              .filter(u => u.id !== user?.id)
              .map(u => (
                <SelectItem key={u.id} value={u.id}>
                  <span className="text-gray-900 dark:text-gray-200">
                    {u.name || u.email || 'Unknown User'}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 mb-4">
        <Button
          variant={viewMode === 'card' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('card')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filter === 'deleted' ? (
            <div className="col-span-full">
              <h2 className="text-lg font-semibold mb-4">Deleted Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasksByStatus.deleted.map((task) => (
                  <Card key={task.id} className="bg-gray-50 dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="line-through text-gray-500">{task.title}</CardTitle>
                      <CardDescription>
                        Deleted on: {formatDate(task.deletedAt?.toDate())}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Due Date:</span>
                          <span className="line-through text-gray-500">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                        {task.customerName && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Customer:</span>
                            <span className="line-through text-gray-500">{task.customerName}</span>
                          </div>
                        )}
                        {task.orderNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Order:</span>
                            <span className="line-through text-gray-500">#{task.orderNumber}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="col-span-full">
                <h2 className="text-lg font-semibold mb-4">Pending Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus.pending.map((task) => (
                    <Card
                      key={task.id}
                      className={cn(
                        "transition-all duration-200 border-2",
                        getCardBorderColor(task.priority),
                        task.completedAt ? "opacity-60" : "hover:shadow-lg",
                        isPastDue(getDateFromField(task.dueDate)) && !task.completedAt && "bg-destructive/5",
                        isToday(getDateFromField(task.dueDate)) && !task.completedAt && "bg-warning/5"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={task.status === 'completed'}
                              onCheckedChange={(checked) => handleTaskComplete(task.id, !!checked)}
                            />
                            <CardTitle className={cn(
                              "text-base font-medium",
                              task.completedAt && "line-through"
                            )}>
                              {task.title}
                            </CardTitle>
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority || 'No Priority'}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-3 space-y-1">
                          {task.orderId && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">Order</Badge>
                              <Button
                                variant="link"
                                className="h-auto p-0 font-medium text-primary hover:text-primary/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${task.orderId}`);
                                }}
                              >
                                <span className="flex items-center">
                                  Order #{task.orderNumber}
                                </span>
                              </Button>
                            </div>
                          )}
                          {task.customerId && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">Customer</Badge>
                              <Button
                                variant="link"
                                className="h-auto p-0 font-medium text-primary hover:text-primary/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/customers/${task.customerId}`);
                                }}
                              >
                                <span className="flex items-center">
                                  {task.customerName}
                                </span>
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm mt-2">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span className={cn(
                            isPastDue(getDateFromField(task.dueDate)) && !task.completedAt && "text-destructive font-medium",
                            isToday(getDateFromField(task.dueDate)) && !task.completedAt && "text-warning font-medium"
                          )}>
                            Due {formatDate(task.dueDate)}
                            {isToday(getDateFromField(task.dueDate)) && " (Today)"}
                            {isPastDue(getDateFromField(task.dueDate)) && " (Past Due)"}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-2">
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Assigned to:</div>
                              <div className="flex flex-wrap gap-2">
                                {task.assignees.map((assignee) => (
                                  <div
                                    key={assignee.userId}
                                    className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{assignee.userName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {assignee.userName}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAssignee(task.id, assignee.userId);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => openAssignDialog(task)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Users
                            </Button>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="flex justify-between pt-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Created {formatDate(task.createdAt)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="col-span-full mt-8">
                <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasksByStatus.completed.map((task) => (
                    <Card
                      key={task.id}
                      className={cn(
                        "transition-all duration-200 border-2",
                        getCardBorderColor(task.priority),
                        task.completedAt ? "opacity-60" : "hover:shadow-lg",
                        isPastDue(getDateFromField(task.dueDate)) && !task.completedAt && "bg-destructive/5",
                        isToday(getDateFromField(task.dueDate)) && !task.completedAt && "bg-warning/5"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={task.status === 'completed'}
                              onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                            />
                            <CardTitle className={cn(
                              "text-base font-medium",
                              task.completedAt && "line-through"
                            )}>
                              {task.title}
                            </CardTitle>
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority || 'No Priority'}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-3 space-y-1">
                          {task.orderId && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">Order</Badge>
                              <Button
                                variant="link"
                                className="h-auto p-0 font-medium text-primary hover:text-primary/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${task.orderId}`);
                                }}
                              >
                                <span className="flex items-center">
                                  Order #{task.orderNumber}
                                </span>
                              </Button>
                            </div>
                          )}
                          {task.customerId && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">Customer</Badge>
                              <Button
                                variant="link"
                                className="h-auto p-0 font-medium text-primary hover:text-primary/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/customers/${task.customerId}`);
                                }}
                              >
                                <span className="flex items-center">
                                  {task.customerName}
                                </span>
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm mt-2">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span className={cn(
                            isPastDue(getDateFromField(task.dueDate)) && !task.completedAt && "text-destructive font-medium",
                            isToday(getDateFromField(task.dueDate)) && !task.completedAt && "text-warning font-medium"
                          )}>
                            Due {formatDate(task.dueDate)}
                            {isToday(getDateFromField(task.dueDate)) && " (Today)"}
                            {isPastDue(getDateFromField(task.dueDate)) && " (Past Due)"}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-2">
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Assigned to:</div>
                              <div className="flex flex-wrap gap-2">
                                {task.assignees.map((assignee) => (
                                  <div
                                    key={assignee.userId}
                                    className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{assignee.userName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {assignee.userName}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAssignee(task.id, assignee.userId);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => openAssignDialog(task)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign Users
                            </Button>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="flex justify-between pt-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Created {formatDate(task.createdAt)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] dark:text-gray-200 text-gray-900">Done</TableHead>
                <TableHead className="min-w-[300px] dark:text-gray-200 text-gray-900">Task</TableHead>
                <TableHead className="w-[120px] dark:text-gray-200 text-gray-900">Assignees</TableHead>
                <TableHead className="w-[150px] dark:text-gray-200 text-gray-900">Due Date</TableHead>
                <TableHead className="min-w-[200px] dark:text-gray-200 text-gray-900">Links</TableHead>
                <TableHead className="w-[100px] text-right dark:text-gray-200 text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => renderTaskRow(task))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new task and assign it to team members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="task-title" className="text-sm font-medium text-foreground">
                Task Title
              </label>
              <Input
                id="task-title"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="text-foreground"
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="priority" className="text-sm font-medium text-foreground">
                Priority
              </label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                <SelectTrigger className="text-foreground">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-foreground">Low</SelectItem>
                  <SelectItem value="medium" className="text-foreground">Medium</SelectItem>
                  <SelectItem value="high" className="text-foreground">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="link-order" className="text-sm font-medium text-foreground">
                Link to Order (Optional)
              </label>
              <Popover open={linkSearchOpen} onOpenChange={setLinkSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={linkSearchOpen}
                    className="justify-between text-foreground"
                  >
                    {selectedLink ? (
                      <div className="flex flex-col items-start">
                        <span>Order #{selectedLink.orderNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedLink.customerName}
                        </span>
                      </div>
                    ) : (
                      "Link to Order"
                    )}
                    <ShoppingCart className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search orders..." 
                      value={linkSearchQuery}
                      onValueChange={setLinkSearchQuery}
                      className="text-foreground"
                    />
                    <CommandList>
                      <CommandEmpty className="text-muted-foreground">No orders found.</CommandEmpty>
                      <CommandGroup className="text-foreground">
                        {filteredOrders.map((order) => (
                          <CommandItem
                            key={order.id}
                            value={order.id}
                            onSelect={() => handleOrderSelect(order)}
                            className="text-foreground"
                          >
                            <div className="flex flex-col">
                              <span>Order #{order.orderNumber}</span>
                              <span className="text-sm text-muted-foreground">
                                {order.customerName}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label htmlFor="due-date" className="text-sm font-medium text-foreground">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-foreground",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Task Creation</DialogTitle>
            <DialogDescription>
              Please review the task details below before creating.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-semibold mb-2">Task Details:</h3>
            {pendingTaskData && (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Title:</span> {pendingTaskData.title}</p>
                <p><span className="font-medium">Priority:</span> {pendingTaskData.priority}</p>
                <p><span className="font-medium">Due Date:</span> {formatDate(pendingTaskData.dueDate)}</p>
                {pendingTaskData.orderNumber && (
                  <p><span className="font-medium">Linked Order:</span> {pendingTaskData.orderNumber}</p>
                )}
                {pendingTaskData.customerName && (
                  <p><span className="font-medium">Customer:</span> {pendingTaskData.customerName}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDialogOpen(false);
                setPendingTaskData(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTask}>
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Select a user to assign this task to.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="grid gap-2 py-4">
              {users.map((user) => {
                const isAssigned = selectedTask.assignees?.some(
                  (assignee) => assignee.userId === user.id
                );
                
                return (
                  <Button
                    key={user.id}
                    variant={isAssigned ? "secondary" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleAssignTask(selectedTask.id, user.id, user.name)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.name}
                    {isAssigned && <Check className="ml-auto h-4 w-4" />}
                  </Button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Modify the task details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="block text-sm font-medium" htmlFor="title">Title</label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <label className="block text-sm font-medium" htmlFor="priority">Priority</label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="block text-sm font-medium" htmlFor="dueDate">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDueDate ? format(editDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDueDate}
                    onSelect={(date) => date && setEditDueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
