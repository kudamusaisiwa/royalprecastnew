import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { canChangeToStatus } from '../../hooks/usePermissions';
import type { OrderStatus } from '../../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusSelectorProps {
  currentStatus: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
}

export default function StatusSelector({ currentStatus, onChange, disabled = false }: StatusSelectorProps) {
  const { user } = useAuthStore();
  const statuses: OrderStatus[] = [
    'quotation',
    'paid',
    'production',
    'quality_control',
    'dispatch',
    'installation',
    'completed'
  ];

  const getStatusLabel = (status: OrderStatus): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => onChange(value as OrderStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue>{getStatusLabel(currentStatus)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map(status => {
          const canChange = user ? canChangeToStatus(currentStatus, status, user.role) : false;
          
          return (
            <SelectItem 
              key={status} 
              value={status}
              disabled={!canChange}
            >
              {getStatusLabel(status)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}