import React, { useState, useCallback } from 'react';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { Timestamp } from 'firebase/firestore';
import TextareaAutosize from 'react-textarea-autosize';
import { formatDistanceToNow } from 'date-fns';
import type { Order } from '../../types';

interface OrderNotesProps {
  order: Order;
}

export default function OrderNotes({ order }: OrderNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getUserById } = useUserStore();
  const { user } = useAuthStore();
  const { updateOrder } = useOrderStore();

  const handleAddNote = useCallback(async () => {
    console.log('Add note button clicked');
    
    if (!newNote.trim()) {
      console.log('Note is empty');
      return;
    }

    if (!user) {
      console.log('No current user');
      return;
    }

    if (isSubmitting) {
      console.log('Already submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Starting note submission');

      // Create the new note
      const note = {
        id: crypto.randomUUID(),
        content: newNote.trim(),
        createdAt: Timestamp.now(),
        createdBy: user.id
      };
      console.log('Created note:', note);

      // Get existing notes or initialize empty array
      const existingNotes = order.notes || [];
      console.log('Existing notes:', existingNotes);

      // Create updated notes array
      const updatedNotes = [...existingNotes, note];
      console.log('Updated notes array:', updatedNotes);

      // Update the order
      console.log('Updating order:', order.id);
      await updateOrder(order.id, {
        notes: updatedNotes
      });
      console.log('Order updated successfully');

      // Clear the input
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newNote, user, isSubmitting, order.id, order.notes, updateOrder]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddNote();
    }
  }, [handleAddNote]);

  // Sort notes by date, newest first
  const sortedNotes = React.useMemo(() => {
    const notes = order.notes || [];
    return [...notes].sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [order.notes]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notes</h3>
        
        <div className="space-y-4">
          <div className="space-y-4">
            <TextareaAutosize
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note... (⌘/Ctrl + Enter to save)"
              className="w-full min-h-[80px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxRows={5}
              disabled={isSubmitting}
            />
            
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSubmitting}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </button>
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Note History</h4>
            <div className="space-y-4">
              {sortedNotes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No notes yet</p>
              ) : (
                sortedNotes.map((note) => {
                  const noteUser = getUserById(note.createdBy);
                  const noteDate = note.createdAt instanceof Timestamp ? 
                    note.createdAt.toDate() : 
                    new Date(note.createdAt);
                  
                  return (
                    <div key={note.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-gray-100 mb-2 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>By {noteUser?.name || 'Unknown User'}</span>
                        <span>{formatDistanceToNow(noteDate)} ago</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
