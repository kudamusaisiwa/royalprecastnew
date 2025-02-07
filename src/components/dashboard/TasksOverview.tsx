import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "../ui/use-toast";
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { CalendarIcon, CheckCircle2, Clock, ExternalLink, Link as LinkIcon, User2 } from 'lucide-react';
import type { Task } from '@/types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { format } from 'date-fns';

const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#FF69B4', '#33CC33', '#6666CC', '#CC3333', '#CCCC33'];
  return colors[hash % colors.length];
};

const getContrastText = (bgColor: string) => {
  const contrastColors = {
    '#FF69B4': 'text-white',
    '#33CC33': 'text-white',
    '#6666CC': 'text-white',
    '#CC3333': 'text-white',
    '#CCCC33': 'text-black',
  };
  return contrastColors[bgColor] || 'text-black';
};

export function TasksOverview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { tasks, updateTask, loading } = useTaskStore();
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [futureTasks, setFutureTasks] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureTasksCount = tasks.filter(task => {
      const taskDate = task.dueDate.toDate();
      taskDate.setHours(0, 0, 0, 0);
      return task.assignees?.some(assignee => assignee.userId === user.id) &&
        task.status === 'pending' &&
        task.status !== 'deleted' &&
        taskDate.getTime() > today.getTime();
    }).length;
    setFutureTasks(futureTasksCount);

    const filteredTasks = tasks
      .filter(task => {
        const taskDate = task.dueDate.toDate();
        taskDate.setHours(0, 0, 0, 0);
        
        return task.assignees?.some(assignee => assignee.userId === user.id) &&
          task.status === 'pending' &&
          task.status !== 'deleted' &&
          taskDate.getTime() === today.getTime();
      })
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = (priorityOrder[a.priority?.toLowerCase()] || 3) - 
                           (priorityOrder[b.priority?.toLowerCase()] || 3);
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      });

    setUserTasks(filteredTasks);
  }, [tasks, user]);

  const handleTaskComplete = async (taskId: string, isComplete: boolean) => {
    try {
      await updateTask(taskId, {
        status: isComplete ? 'completed' : 'pending',
        completedAt: isComplete ? new Date() : null
      });

      if (isComplete) {
        setUserTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      }

      toast({
        title: isComplete ? "Task completed" : "Task reopened",
        description: isComplete ? "Task marked as complete" : "Task marked as pending",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isPastDue = (date: Date) => {
    const today = new Date();
    return date < today && !isToday(date);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Today's Tasks</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
            View All
          </Button>
        </div>
        <CardDescription>Tasks due today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading tasks...</div>
        ) : userTasks.length === 0 ? (
          <div className="space-y-2">
            <div className="text-center text-muted-foreground">No tasks due today</div>
            {futureTasks > 0 && (
              <Button 
                variant="link" 
                className="w-full text-primary" 
                onClick={() => navigate('/tasks')}
              >
                {futureTasks} {futureTasks === 1 ? 'task' : 'tasks'} pending in the future →
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {userTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start space-x-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={(checked) => handleTaskComplete(task.id, !!checked)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{task.title}</div>
                    <Badge className={getPriorityBadgeClass(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  {/* Links Section */}
                  {(task.orderId || task.customerId) && (
                    <div className="flex flex-wrap gap-2">
                      {task.orderId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => navigate(`/orders/${task.orderId}`)}
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Order #{task.orderNumber}
                        </Button>
                      )}
                      {task.customerId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => navigate(`/customers/${task.customerId}`)}
                        >
                          <User2 className="h-3 w-3 mr-1" />
                          {task.customerName}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Due Date */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span className={cn(
                      isPastDue(task.dueDate.toDate()) && "text-destructive font-medium",
                      isToday(task.dueDate.toDate()) && "text-warning font-medium"
                    )}>
                      Due {format(task.dueDate.toDate(), 'PPP')}
                      {isToday(task.dueDate.toDate()) && " (Today)"}
                      {isPastDue(task.dueDate.toDate()) && " (Past Due)"}
                    </span>
                  </div>

                  {/* Assignees */}
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-2">
                      {task.assignees.map((assignee, index) => (
                        <Avatar 
                          key={assignee.userId}
                          className="h-6 w-6 border-2 border-background"
                        >
                          <AvatarFallback 
                            style={{ 
                              backgroundColor: getAvatarColor(assignee.userName),
                              color: 'white'
                            }}
                          >
                            {assignee.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
