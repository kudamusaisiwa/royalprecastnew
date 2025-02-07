import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
}

export default function UpdatePrompt({ onUpdate }: UpdatePromptProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show the prompt after a slight delay
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center justify-between max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Download className="h-5 w-5 text-blue-500 mr-2" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            New version available
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShow(false)}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Later
          </button>
          <button
            onClick={() => {
              onUpdate();
              setShow(false);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}