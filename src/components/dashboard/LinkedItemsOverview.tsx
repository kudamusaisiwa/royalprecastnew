import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTaskStore } from '@/store/taskStore';
import { useCustomerStore } from '@/store/customerStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Building2, Package, ArrowUpRight, CalendarDays } from 'lucide-react';
import type { Task, Customer, Order } from '@/types';

interface LinkedItem {
  id: string;
  type: 'customer' | 'order';
  label: string;
  status?: string;
  date?: Date;
  tasks: Task[];
}

export function LinkedItemsOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const { customers } = useCustomerStore();
  const { orders } = useOrderStore();
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);

  useEffect(() => {
    if (!user) return;

    // Get user's tasks
    const userTasks = tasks.filter(task => 
      task.assignees?.some(assignee => assignee.userId === user.id) &&
      task.status !== 'deleted'
    );

    // Collect unique linked items
    const linkedItemsMap = new Map<string, LinkedItem>();

    userTasks.forEach(task => {
      if (!task.linkedItem) return;

      const key = `${task.linkedItem.type}-${task.linkedItem.id}`;
      if (!linkedItemsMap.has(key)) {
        let item: LinkedItem = {
          id: task.linkedItem.id,
          type: task.linkedItem.type,
          label: task.linkedItem.label || '',
          tasks: []
        };

        // Add additional details based on type
        if (task.linkedItem.type === 'customer') {
          const customer = customers.find(c => c.id === task.linkedItem?.id);
          if (customer) {
            item.label = customer.name;
            item.status = customer.status;
          }
        } else if (task.linkedItem.type === 'order') {
          const order = orders.find(o => o.id === task.linkedItem?.id);
          if (order) {
            item.label = `Order #${order.id}`;
            item.status = order.status;
            item.date = order.createdAt?.toDate();
          }
        }

        linkedItemsMap.set(key, item);
      }

      // Add task to the item's tasks
      const existingItem = linkedItemsMap.get(key);
      if (existingItem) {
        existingItem.tasks.push(task);
      }
    });

    // Convert map to array and sort
    const sortedItems = Array.from(linkedItemsMap.values())
      .sort((a, b) => {
        // Sort by number of pending tasks first
        const aPending = a.tasks.filter(t => t.status !== 'completed').length;
        const bPending = b.tasks.filter(t => t.status !== 'completed').length;
        if (aPending !== bPending) return bPending - aPending;

        // Then by date if available
        if (a.date && b.date) return b.date.getTime() - a.date.getTime();
        return 0;
      })
      .slice(0, 5); // Show only top 5

    setLinkedItems(sortedItems);
  }, [tasks, customers, orders, user]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'text-green-500 border-green-500';
      case 'pending':
      case 'in progress':
        return 'text-yellow-500 border-yellow-500';
      case 'cancelled':
      case 'inactive':
        return 'text-destructive border-destructive';
      default:
        return 'text-muted-foreground border-muted';
    }
  };

  if (linkedItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Related Items</CardTitle>
            <CardDescription>Customers and orders related to your tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {linkedItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.type === 'customer' ? (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium"
                    onClick={() => navigate(`/${item.type}s/${item.id}`)}
                  >
                    {item.label}
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                {item.status && (
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-muted-foreground">
                  {item.date && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {item.date.toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    {item.tasks.length} task{item.tasks.length !== 1 ? 's' : ''} •{' '}
                    {item.tasks.filter(t => t.status !== 'completed').length} pending
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
