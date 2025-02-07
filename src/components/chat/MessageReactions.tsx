import React from 'react';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface MessageReactionsProps {
  message: Message;
  onReactionClick: (emoji: string) => void;
}

export default function MessageReactions({ message, onReactionClick }: MessageReactionsProps) {
  const { user } = useAuthStore();
  const reactions = message.reactions || {};

  if (Object.keys(reactions).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, data]) => {
        const hasReacted = user?.id && data.users.includes(user.id);
        
        return (
          <Popover key={emoji}>
            <PopoverTrigger asChild>
              <button
                onClick={() => onReactionClick(emoji)}
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                  ${hasReacted 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                  hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                `}
              >
                <span role="img" aria-label={`${emoji} reaction`}>{emoji}</span>
                <span>{data.count}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-2 text-sm" side="top">
              <div className="text-gray-700 dark:text-gray-300">
                {data.users.length} {data.users.length === 1 ? 'person' : 'people'} reacted with {emoji}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
