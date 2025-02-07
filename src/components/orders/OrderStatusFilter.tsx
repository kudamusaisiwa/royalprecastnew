import React from 'react';
import { Filter } from 'lucide-react';
import type { OrderStatus } from '../../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderStatusFilterProps {
  selectedStatus: OrderStatus | 'all';
  onChange: (status: OrderStatus | 'all') => void;
}

const statuses: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Orders' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'approval', label: 'Approval' },
  { value: 'payment', label: 'Payment' },
  { value: 'production', label: 'Production' },
  { value: 'quality_control', label: 'Quality Control' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'installation', label: 'Installation' },
  { value: 'completed', label: 'Completed' }
];

export default function OrderStatusFilter({ selectedStatus, onChange }: OrderStatusFilterProps) {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <Select
        value={selectedStatus}
        onValueChange={(value) => onChange(value as OrderStatus | 'all')}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {statuses.find(s => s.value === selectedStatus)?.label || 'All Orders'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map(status => (
            <SelectItem 
              key={status.value} 
              value={status.value}
            >
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}