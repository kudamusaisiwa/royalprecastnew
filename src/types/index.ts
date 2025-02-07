export type OperationalStatus = 
  | 'quotation'
  | 'production'
  | 'quality_control'
  | 'dispatch'
  | 'installation'
  | 'completed';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'ecocash' | 'innbucks';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: OperationalStatus;
  deliveryMethod: 'delivery' | 'collection' | 'site_visit';
  deliveryDate?: Date;
  collectionDate?: Date;
  siteVisitDate?: Date;
  deliveryStatus?: 'pending' | 'completed' | 'cancelled';
  collectionStatus?: 'pending' | 'completed' | 'cancelled';
  siteVisitStatus?: 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
  vatAmount: number;
  notes?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    createdBy: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'pending' | 'completed' | 'deleted';

export interface TaskMetadata {
  type?: 'follow_up' | 'general';
  autoCreated?: boolean;
  completedReason?: 'payment_received' | 'manual' | 'cancelled';
  paymentId?: string;
}

export interface TaskAssignee {
  userId: string;
  userName: string;
  assignedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdBy: string;
  createdAt: Date;
  dueDate: Date;
  completedAt: Date | null;
  deletedAt: Date | null;
  priority: 'low' | 'medium' | 'high';
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  metadata?: TaskMetadata;
  assignees: TaskAssignee[];
}

export type NewTask = Omit<Task, 'id'>;

export type ActivityType = 
  | 'order_created' 
  | 'order_updated'
  | 'order_deleted'
  | 'payment_created'
  | 'payment_updated'
  | 'payment_deleted'
  | 'customer_created'
  | 'customer_updated'
  | 'customer_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_deleted'
  | 'task_assigned'
  | 'communication_created'
  | 'communication_updated'
  | 'communication_deleted';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type UserRole = 'admin' | 'manager' | 'finance' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  active: boolean;
  lastLogin: Date | null;
}