import React, { useState, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChatInput } from '../../hooks/useChatInput';
import { useUserStore } from '../../store/userStore';
import AttachmentSearch from './AttachmentSearch';
import AttachmentPreview from './AttachmentPreview';
import MentionList from './MentionList';

export default function ChatInput() {
  const {
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
  } = useChatInput();

  const { users } = useUserStore();
  const [showAttachmentSearch, setShowAttachmentSearch] = useState(false);
  const attachButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="fixed bottom-16 left-0 right-0 md:left-[16rem] md:right-8 mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      {attachment && (
        <div className="mb-4">
          <AttachmentPreview
            attachment={attachment}
            onRemove={() => setAttachment(null)}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0 relative">
          <button
            ref={attachButtonRef}
            onClick={() => setShowAttachmentSearch(!showAttachmentSearch)}
            className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          {showAttachmentSearch && (
            <div className="absolute bottom-full left-0 mb-2">
              <AttachmentSearch
                onSelect={handleAttachmentSelect}
                onClose={() => setShowAttachmentSearch(false)}
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 relative">
          <TextareaAutosize
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... Use @ to mention someone"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            minRows={1}
            maxRows={5}
          />
          {mentionPosition && mentionSearch !== null && (
            <div className="absolute left-0 right-0">
              <MentionList
                users={users}
                searchTerm={mentionSearch}
                onSelect={handleMentionSelect}
                position={mentionPosition}
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !attachment) || isSending}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}