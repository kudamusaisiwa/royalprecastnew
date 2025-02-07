import React from 'react';

interface MessageTextProps {
  text: string;
  mentions?: { [key: string]: string }; // userId: userName
}

export default function MessageText({ text, mentions }: MessageTextProps) {
  if (!mentions) return <div className="break-words">{text}</div>;

  // Split text to preserve mentions
  const parts = text.split(/(@[^\s]+)/g);
  
  return (
    <div className="break-words">
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const name = part.slice(1); // Remove @ symbol
          return (
            <span
              key={index}
              className="text-blue-300 dark:text-blue-400 font-medium"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </div>
  );
}