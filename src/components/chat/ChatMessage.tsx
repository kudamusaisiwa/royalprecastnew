import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRealtimeDatabase } from '../../hooks/useRealtimeDatabase';
import type { Message } from '../../types/chat';
import MessageText from './MessageText';
import ReactionPicker from './ReactionPicker';
import MessageReactions from './MessageReactions';
import MessageActions from './MessageActions';

interface ChatMessageProps {
  message: Message;
  onEdit: (messageId: string, text: string) => void;
}

export default function ChatMessage({ message, onEdit }: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const { updateData, deleteData } = useRealtimeDatabase();
  const isCurrentUser = user?.id === message.userId;

  const handleTouchStart = () => {
    if (!isCurrentUser) return;
    
    longPressTimeout.current = setTimeout(() => {
      setShowActions(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowActions(false);
  };

  const handleDelete = async () => {
    try {
      // Instead of deleting, mark the message as deleted
      await updateData(`messages/${message.id}`, {
        ...message,
        deleted: true,
        deletedAt: Date.now(),
        text: "This message was deleted",
        attachment: null, // Remove any attachments
        mentions: {}, // Clear mentions
        reactions: {} // Clear reactions
      });
      setShowActions(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Preserve existing message data and only update necessary fields
      const updates = {
        text: editText,
        edited: true,
        editedAt: Date.now(),
        userId: message.userId, // Preserve original author
        userName: message.userName,
        timestamp: message.timestamp, // Preserve original timestamp
        mentions: message.mentions || {},
        reactions: message.reactions || {}
      };
      
      await updateData(`messages/${message.id}`, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  const handleReaction = async (emoji: string) => {
    if (!user) return;

    const currentReactions = message.reactions || {};
    const currentEmojiData = currentReactions[emoji] || { count: 0, users: [] };
    const hasReacted = currentEmojiData.users.includes(user.id);

    let updatedReactions = { ...currentReactions };

    if (hasReacted) {
      if (currentEmojiData.count <= 1) {
        delete updatedReactions[emoji];
      } else {
        updatedReactions[emoji] = {
          count: currentEmojiData.count - 1,
          users: currentEmojiData.users.filter(id => id !== user.id)
        };
      }
    } else {
      updatedReactions[emoji] = {
        count: (currentEmojiData.count || 0) + 1,
        users: [...(currentEmojiData.users || []), user.id]
      };
    }

    try {
      await updateData(`messages/${message.id}/reactions`, updatedReactions);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  return (
    <div 
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <MessageActions
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      >
        <div 
          className={`
            max-w-[70%] rounded-lg px-4 py-2 relative group shadow-sm
            ${message.deleted ? 'bg-gray-100 dark:bg-gray-800' : 
              isCurrentUser 
                ? 'bg-blue-500 text-white ml-auto rounded-br-none' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mr-auto rounded-bl-none'
            }
            ${message.deleted ? 'italic text-gray-500 dark:text-gray-400' : ''}
          `}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onContextMenu={(e) => {
            if (isCurrentUser && !message.deleted) {
              e.preventDefault();
              setShowActions(true);
            }
          }}
        >
          {message.deleted ? (
            <div className="text-sm">This message was deleted</div>
          ) : (
            <>
              {message.attachment && (
                <div className="mb-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <Link 
                    to={`/${message.attachment.type}s/${message.attachment.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-blue-500 dark:text-blue-400">
                      {message.attachment.title}
                    </div>
                    {message.attachment.subtitle && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {message.attachment.subtitle}
                      </div>
                    )}
                    {message.attachment.amount && (
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${message.attachment.amount.toLocaleString()}
                      </div>
                    )}
                  </Link>
                </div>
              )}
              
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <MessageText text={message.text} />
                  
                  <div className="text-xs mt-1">
                    <span className={`${isCurrentUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.userName} • {new Date(message.timestamp).toLocaleTimeString()}
                      {message.edited && ' (edited)'}
                    </span>
                  </div>

                  <MessageReactions 
                    message={message} 
                    onReactionClick={handleReaction}
                  />

                  <div className={`
                    absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity
                    ${isCurrentUser ? 'left-0 -translate-x-full pl-2' : 'right-0 translate-x-full pr-2'}
                  `}>
                    <ReactionPicker
                      onSelect={handleReaction}
                      trigger={
                        <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                          <span role="img" aria-label="add reaction">
                            😊
                          </span>
                        </button>
                      }
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </MessageActions>
    </div>
  );
}