# Task Management System Documentation

This document outlines how tasks are created and managed in the Royal Precast CRM system, both manually and automatically.

## Task Data Structure

```typescript
interface Task {
  id: string;                 // Auto-generated Firestore ID
  title: string;             // Task title
  status: TaskStatus;        // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: TaskPriority;    // 'low' | 'medium' | 'high' | 'urgent'
  
  // Timestamps
  createdAt: Timestamp;      // Creation timestamp
  createdBy: string;         // User ID who created the task
  completedAt: Timestamp | null;
  deletedAt: Timestamp | null;
  dueDate: Timestamp;
  
  // Assignments
  assignees: TaskAssignee[]; // List of assigned users
  
  // Related Records
  orderId?: string | null;   // Related order ID
  orderNumber?: string | null; // Related order number
  customerId?: string | null; // Related customer ID
  customerName?: string | null; // Related customer name
  
  // Additional Data
  metadata?: any | null;     // Additional task metadata
}

interface TaskAssignee {
  userId: string;
  userName: string;
  assignedAt: Timestamp;
}

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

## Manual Task Creation

### 1. Basic Task Creation
```typescript
const createTask = async (taskData: Partial<Task>) => {
  // Validate user authentication
  if (!currentUser) {
    throw new Error('User must be logged in to create tasks');
  }

  // Prepare task data
  const newTaskData = {
    title: taskData.title,
    createdBy: currentUser.id,
    createdAt: Timestamp.now(),
    dueDate: taskData.dueDate || Timestamp.now(),
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

  // Add to Firestore
  const docRef = await addDoc(collection(db, 'tasks'), newTaskData);

  // Log activity
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

  return docRef.id;
};
```

### 2. Task Assignment
```typescript
const assignTask = async (taskId: string, userId: string) => {
  await updateDoc(doc(db, 'tasks', taskId), {
    assignees: arrayUnion({
      userId,
      userName: getUser(userId).name || getUser(userId).email || '',
      assignedAt: Timestamp.now()
    }),
    updatedAt: serverTimestamp()
  });
  
  // Notify assignee
  await notifyTaskAssignment(taskId, userId);
};
```

### 3. Task Updates
```typescript
const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  progress: number
) => {
  const updates: any = {
    status,
    progress,
    updatedAt: serverTimestamp()
  };
  
  if (status === 'completed') {
    updates.completedAt = serverTimestamp();
  }
  
  await updateDoc(doc(db, 'tasks', taskId), updates);
};
```

## Automatic Task Creation

### 1. Order-Related Tasks

#### Production Tasks
```typescript
const createProductionTasks = async (orderId: string, items: OrderItem[]) => {
  const tasks = items.map(item => ({
    title: `Produce ${item.quantity}x ${item.productName}`,
    status: 'pending',
    priority: 'medium',
    dueDate: calculateProductionDueDate(item.quantity),
    orderId,
    orderNumber: getOrder(orderId).orderNumber,
    customerId: getOrder(orderId).customerId,
    customerName: getOrder(orderId).customerName,
    metadata: {
      orderItem: item
    }
  }));
  
  return await Promise.all(tasks.map(createTask));
};
```

#### Delivery Tasks
```typescript
const createDeliveryTask = async (orderId: string, deliveryAddress: Address) => {
  return await createTask({
    title: `Delivery for Order #${getOrder(orderId).orderNumber}`,
    status: 'pending',
    priority: 'medium',
    dueDate: calculateDeliveryDate(deliveryAddress),
    orderId,
    orderNumber: getOrder(orderId).orderNumber,
    customerId: getOrder(orderId).customerId,
    customerName: getOrder(orderId).customerName,
    metadata: {
      deliveryAddress
    }
  });
};
```

#### Payment Follow-up Tasks
```typescript
const createPaymentFollowUpTask = async (orderId: string, dueAmount: number) => {
  return await createTask({
    title: `Payment Follow-up: $${dueAmount}`,
    status: 'pending',
    priority: 'high',
    dueDate: addBusinessDays(new Date(), 3),
    orderId,
    orderNumber: getOrder(orderId).orderNumber,
    customerId: getOrder(orderId).customerId,
    customerName: getOrder(orderId).customerName,
    metadata: {
      dueAmount
    }
  });
};
```

### 2. Order Creation Workflow

```typescript
const handleOrderTasks = async (order: Order) => {
  // 1. Create production tasks
  const productionTaskIds = await createProductionTasks(
    order.id,
    order.items
  );
  
  // 2. Create delivery task if delivery is required
  if (order.deliveryAddress) {
    const deliveryTaskId = await createDeliveryTask(
      order.id,
      order.deliveryAddress
    );
  }
  
  // 3. Create payment follow-up if not fully paid
  if (order.balance > 0) {
    const paymentTaskId = await createPaymentFollowUpTask(
      order.id,
      order.balance
    );
  }
  
  // 4. Link tasks to order
  await updateDoc(doc(db, 'orders', order.id), {
    tasks: {
      production: productionTaskIds,
      delivery: deliveryTaskId,
      payment: paymentTaskId
    }
  });
};
```

## Task Notifications

### 1. Email Notifications
```typescript
const sendTaskEmail = async (taskId: string, action: string) => {
  const task = await getTask(taskId);
  const assignee = await getUser(task.assignees[0].userId);
  
  await sendEmail({
    to: assignee.email,
    template: 'task_notification',
    data: {
      action,
      task,
      assignee
    }
  });
};
```

### 2. Push Notifications
```typescript
const sendTaskPushNotification = async (taskId: string, action: string) => {
  const task = await getTask(taskId);
  const assignee = await getUser(task.assignees[0].userId);
  
  await sendPush({
    userId: assignee.id,
    title: `Task ${action}`,
    body: task.title,
    data: {
      taskId,
      action
    }
  });
};
```

## Task Dependencies

```typescript
interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  blockedTasks: string[];
}

const addTaskDependency = async (taskId: string, dependsOnTaskId: string) => {
  const batch = writeBatch(db);
  
  // Update dependent task
  batch.update(doc(db, 'tasks', taskId), {
    'dependencies.dependsOn': arrayUnion(dependsOnTaskId)
  });
  
  // Update blocking task
  batch.update(doc(db, 'tasks', dependsOnTaskId), {
    'dependencies.blockedTasks': arrayUnion(taskId)
  });
  
  await batch.commit();
};
```

## Task Monitoring

### 1. Due Date Tracking
```typescript
const checkOverdueTasks = async () => {
  const overdueTasks = await getDocs(
    query(
      collection(db, 'tasks'),
      where('status', 'in', ['pending', 'in_progress']),
      where('dueDate', '<', new Date())
    )
  );
  
  // Send notifications for overdue tasks
  overdueTasks.forEach(task => {
    notifyOverdueTask(task.id);
  });
};
```

### 2. Progress Updates
```typescript
const updateTaskProgress = async (taskId: string, progress: number) => {
  await updateDoc(doc(db, 'tasks', taskId), {
    progress,
    updatedAt: serverTimestamp(),
    status: progress === 100 ? 'completed' : 'in_progress'
  });
};
```

## Best Practices

1. **Task Creation**
   - Set realistic due dates
   - Assign to specific individuals
   - Include detailed descriptions
   - Set appropriate priorities

2. **Task Management**
   - Regular status updates
   - Clear communication
   - Document progress
   - Track dependencies

3. **Automation**
   - Standard tasks for common processes
   - Automated assignments
   - Due date calculations
   - Priority setting

4. **Monitoring**
   - Regular progress checks
   - Overdue task alerts
   - Workload balancing
   - Performance metrics

## Security Rules

```javascript
match /tasks/{taskId} {
  allow read: if isAuthenticated() && (
    resource == null ||
    resource.data.assignees[0].userId == request.auth.uid ||
    hasRole(['admin', 'manager'])
  );
  
  allow create: if isAuthenticated();
  
  allow update: if isAuthenticated() && (
    resource.data.assignees[0].userId == request.auth.uid ||
    hasRole(['admin', 'manager'])
  );
  
  allow delete: if isAuthenticated() && (
    resource.data.assignees[0].userId == request.auth.uid ||
    hasRole(['admin', 'manager'])
  );
}
