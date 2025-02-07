import React from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const REACTIONS = [
  { emoji: '👍', name: 'thumbs up' },
  { emoji: '👎', name: 'thumbs down' },
  { emoji: '😊', name: 'happy' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '🎉', name: 'party' },
  { emoji: '👀', name: 'eyes' },
  { emoji: '💯', name: 'hundred' },
  { emoji: '🙏', name: 'pray' },
  { emoji: '👏', name: 'clap' }
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div 
      className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-6 gap-1">
        {REACTIONS.map(({ emoji, name }) => (
          <button
            key={name}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={name}
          >
            <span className="text-xl">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}