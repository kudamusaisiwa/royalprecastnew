import React from 'react';
import { 
  CheckCircle, 
  CreditCard, 
  UserPlus, 
  Package, 
  RefreshCw,
  UserCog,
  MessageSquare
} from 'lucide-react';
import type { ActivityType } from '../../store/activityStore';

interface ActivityIconProps {
  type: ActivityType;
  className?: string;
}

export default function ActivityIcon({ type, className = '' }: ActivityIconProps) {
  const getIconConfig = () => {
    switch (type) {
      case 'status_change':
        return { Icon: RefreshCw, color: 'text-blue-400' };
      case 'payment':
        return { Icon: CreditCard, color: 'text-green-400' };
      case 'customer_created':
        return { Icon: UserPlus, color: 'text-purple-400' };
      case 'order_created':
        return { Icon: Package, color: 'text-orange-400' };
      case 'customer_updated':
        return { Icon: UserCog, color: 'text-indigo-400' };
      case 'order_updated':
        return { Icon: CheckCircle, color: 'text-yellow-400' };
      case 'communication_added':
        return { Icon: MessageSquare, color: 'text-pink-400' };
      default:
        return { Icon: CheckCircle, color: 'text-gray-400' };
    }
  };

  const { Icon, color } = getIconConfig();
  return <Icon className={`h-5 w-5 ${color} ${className}`} />;
}