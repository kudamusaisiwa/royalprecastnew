import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface ChatContextMenuProps {
  position: { x: number; y: number };
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isOwnMessage: boolean;
}

export default function ChatContextMenu({ position, onEdit, onDelete, onClose, isOwnMessage }: ChatContextMenuProps) {
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chat-context-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOwnMessage) return null;

  return (
    <div
      className="chat-context-menu fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`
      }}
    >
      <button
        onClick={onEdit}
        className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Edit className="h-4 w-4" />
        <span>Edit Message</span>
      </button>
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
      >
        <Trash2 className="h-4 w-4" />
        <span>Delete Message</span>
      </button>
    </div>
  );
}