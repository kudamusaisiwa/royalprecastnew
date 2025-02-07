import React from 'react';
import { Search } from 'lucide-react';

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input"
        />
      </div>
    </div>
  );
}