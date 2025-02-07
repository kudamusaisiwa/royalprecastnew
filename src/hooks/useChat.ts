import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import type { Message } from '../types/chat';

export function useChat() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const messagesRef = ref(rtdb, 'messages');
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const messageList = data ? Object.entries(data)
          .map(([id, message]: [string, any]) => ({
            id,
            text: message.text || '',
            userId: message.userId || '',
            userName: message.userName || '',
            timestamp: message.timestamp || Date.now(),
            mentions: message.mentions || {},
            reactions: message.reactions || {},
            attachment: message.attachment || null
          }))
          .sort((a, b) => a.timestamp - b.timestamp) : [];
          
        setMessages(messageList);

        // Check for mentions in new messages
        const lastMessage = messageList[messageList.length - 1];
        if (lastMessage && user && lastMessage.mentions && lastMessage.userId !== user.id) {
          const userMention = lastMessage.mentions[user.id];
          if (userMention) {
            addNotification({
              message: `${lastMessage.userName} mentioned you: "${lastMessage.text}"`,
              type: 'mention',
              metadata: {
                messageId: lastMessage.id,
                userId: lastMessage.userId,
                userName: lastMessage.userName,
                mentionedBy: lastMessage.userName
              }
            });
          }
        }
      } catch (error) {
        console.error('Error processing messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
      setMessages([]);
    });

    return () => unsubscribe();
  }, [user, addNotification]);

  const handleEdit = async (messageId: string, newText: string) => {
    if (!user) return;
    
    try {
      const messageRef = ref(rtdb, `messages/${messageId}`);
      await update(messageRef, {
        text: newText,
        updatedAt: Date.now()
      });
      
      setToastMessage('Message updated successfully');
      setToastType('success');
    } catch (error) {
      console.error('Error updating message:', error);
      setToastMessage('Failed to update message');
      setToastType('error');
    } finally {
      setShowToast(true);
    }
  };

  return {
    messages,
    isLoading,
    handleEdit,
    showToast,
    toastMessage,
    toastType,
    setShowToast
  };
}