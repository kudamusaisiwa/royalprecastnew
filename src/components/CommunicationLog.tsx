import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Phone, PhoneCall, Users, Mail, Clock, User } from 'lucide-react';
import { useCommunicationStore } from '../store/communicationStore';
import { useAuthStore } from '../store/authStore';
import type { CommunicationType } from '../types';

interface CommunicationLogProps {
  customerId: string;
  onAddClick: () => void;
}

const getIcon = (type: CommunicationType) => {
  switch (type) {
    case 'phone':
      return Phone;
    case 'whatsapp':
      return MessageCircle;
    case 'call':
      return PhoneCall;
    case 'walk-in':
      return Users;
    case 'email':
      return Mail;
    default:
      return MessageCircle;
  }
};

export default function CommunicationLog({ customerId, onAddClick }: CommunicationLogProps) {
  const { communications, loading } = useCommunicationStore();
  const { user } = useAuthStore();

  const customerCommunications = communications
    .filter(comm => comm.customerId === customerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-6">
      <button
        onClick={onAddClick}
        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Communication
      </button>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading communications...
          </div>
        ) : customerCommunications.length > 0 ? (
          customerCommunications.map((comm) => {
            const Icon = getIcon(comm.type);
            return (
              <div
                key={comm.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {comm.type}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    {comm.createdAt.toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {comm.summary}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <User className="h-4 w-4 mr-1" />
                  <span>Added by {user?.name}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No communications logged yet
          </div>
        )}
      </div>
    </div>
  );
}