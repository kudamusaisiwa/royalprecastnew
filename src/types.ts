import { Timestamp } from 'firebase/firestore';

export interface TaskAssignee {
  userId: string;
  userName: string;
  assignedAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
  dueDate: Timestamp;
  completedAt: Timestamp | null;
  deletedAt: Timestamp | null;
  createdBy: string;
  assignees: TaskAssignee[];
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerReferenceNumber?: string;
  status: string;
  totalAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
