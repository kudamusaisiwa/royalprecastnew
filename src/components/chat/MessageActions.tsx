import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface MessageActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export default function MessageActions({ isOpen, onClose, onEdit, onDelete, children }: MessageActionsProps) {
  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[140px] p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
        sideOffset={5}
      >
        <div className="flex flex-col gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
