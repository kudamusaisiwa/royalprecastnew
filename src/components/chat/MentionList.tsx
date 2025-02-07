import React from 'react';
import type { User } from '../../types';

interface MentionListProps {
  users: User[];
  searchTerm: string;
  onSelect: (user: User) => void;
  position: { top: number; left: number };
}

export default function MentionList({ users, searchTerm, onSelect, position }: MentionListProps) {
  const searchText = searchTerm.toLowerCase();
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText) ||
    user.email.toLowerCase().includes(searchText)
  ).slice(0, 5); // Limit to 5 results for better performance

  if (filteredUsers.length === 0) return null;

  return (
    <div 
      className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto w-64"
      style={{ 
        bottom: 'calc(100% + 40px)', // Position 40px above the input
        left: position.left,
        transform: 'translateY(-40px)', // Additional offset
      }}
    >
      {filteredUsers.map(user => (
        <button
          key={user.id}
          onClick={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
        >
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}