import React from 'react';
import { useAuthStore } from '../store/authStore';

export default function Footer() {
  const { user } = useAuthStore();
  
  return (
    <footer className="py-4 px-6 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 dark:text-gray-400">
      <p>
        Developed by & copyright 2025 Musasiwa Group. v2.0.0
      </p>
    </footer>
  );
}