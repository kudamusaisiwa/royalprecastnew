import React from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import Toast from '../components/ui/Toast';

export default function Chat() {
  const {
    messages,
    isLoading,
    handleEdit,
    showToast,
    toastMessage,
    toastType,
    setShowToast
  } = useChat();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <ChatMessages 
        messages={messages}
        onEdit={handleEdit}
      />
      <ChatInput />
      
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}