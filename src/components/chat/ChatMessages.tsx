import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import type { Message } from '../../types/chat';

interface ChatMessagesProps {
  messages: Message[];
  onEdit: (messageId: string, newText: string) => void;
}

export default function ChatMessages({ messages, onEdit }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-24">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onEdit={onEdit}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}