import { useState, useEffect, useRef } from 'react';
import { ref, push, serverTimestamp } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import type { Message } from '../types/chat';
import type { User } from '../types';

export function useChatInput() {
  const { user } = useAuthStore();
  const { users } = useUserStore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<Message['attachment'] | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [mentions, setMentions] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    inputRef.current = e.target;

    // Handle @ mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const matches = textBeforeCursor.match(/@(\w*)$/);

    if (matches) {
      // Get cursor position in the input
      const atIndex = textBeforeCursor.lastIndexOf('@');
      const textBeforeAt = textBeforeCursor.slice(0, atIndex);
      
      // Create a temporary span to measure text width
      const span = document.createElement('span');
      span.style.font = window.getComputedStyle(e.target).font;
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.textContent = textBeforeAt;
      document.body.appendChild(span);
      
      // Calculate the left position based on text width
      const textWidth = span.offsetWidth;
      document.body.removeChild(span);

      setMentionSearch(matches[1]);
      setMentionPosition({ 
        top: 0,
        left: Math.max(0, textWidth - 20) // Offset slightly to the left of the @ symbol
      });
    } else {
      setMentionSearch('');
      setMentionPosition(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMentionSelect = (selectedUser: User) => {
    if (!inputRef.current) return;

    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeMention = newMessage.slice(0, cursorPosition).replace(/@\w*$/, '');
    const textAfterMention = newMessage.slice(cursorPosition);
    const firstName = selectedUser.name.split(' ')[0]; // Get only the first name
    
    setNewMessage(`${textBeforeMention}@${firstName} ${textAfterMention}`);
    setMentions(prev => ({
      ...prev,
      [selectedUser.id]: firstName
    }));
    
    setMentionSearch('');
    setMentionPosition(null);

    // Focus back on input after selection
    inputRef.current.focus();
  };

  const handleSendMessage = async () => {
    if (!user?.id || !user?.name) {
      console.error('User not properly authenticated');
      return;
    }

    if ((!newMessage.trim() && !attachment) || isSending) return;

    setIsSending(true);
    try {
      const messageData = {
        text: newMessage.trim(),
        userId: user.id,
        userName: user.name,
        timestamp: serverTimestamp(),
        mentions,
        ...(attachment && { attachment })
      };

      const messagesRef = ref(rtdb, 'messages');
      await push(messagesRef, messageData);

      setNewMessage('');
      setAttachment(null);
      setMentions({});
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentSelect = (selected: Message['attachment']) => {
    setAttachment(selected);
  };

  return {
    newMessage,
    isSending,
    attachment,
    mentionSearch,
    mentionPosition,
    handleInputChange,
    handleKeyPress,
    handleSendMessage,
    handleAttachmentSelect,
    handleMentionSelect,
    setAttachment,
    inputRef
  };
}