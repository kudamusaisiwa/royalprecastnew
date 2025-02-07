import React, { useState } from 'react';
import { X, Phone, MessageCircle, PhoneCall, Users, Mail } from 'lucide-react';
import type { CommunicationType } from '../types';

interface AddCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { type: CommunicationType; summary: string }) => void;
}

const communicationTypes: Array<{ type: CommunicationType; icon: typeof Phone; label: string }> = [
  { type: 'phone', icon: Phone, label: 'Phone' },
  { type: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { type: 'call', icon: PhoneCall, label: 'Call' },
  { type: 'walk-in', icon: Users, label: 'Walk-In' },
  { type: 'email', icon: Mail, label: 'Email' }
];

export default function AddCommunicationModal({ isOpen, onClose, onAdd }: AddCommunicationModalProps) {
  const [type, setType] = useState<CommunicationType>('phone');
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ type, summary });
    setType('phone');
    setSummary('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Communication Log</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {communicationTypes.map(({ type: commType, icon: Icon, label }) => (
                  <button
                    key={commType}
                    type="button"
                    onClick={() => setType(commType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                      type === commType
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-6 w-6 mb-1" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                id="summary"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="modern-textarea"
                placeholder="Enter communication details..."
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Log
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}