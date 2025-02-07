import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

// Common emojis that might be relevant for business chat
const COMMON_EMOJIS = ['👍', '👎', '❤️', '😊', '🎉', '👀', '🤝', '✅'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  trigger: React.ReactNode;
}

export default function ReactionPicker({ onSelect, trigger }: ReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top">
        <div className="flex gap-2">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
