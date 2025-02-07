import React from 'react';
import { Toast, ToastClose, ToastDescription, ToastTitle } from './toast';

interface LegacyToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const LegacyToast: React.FC<LegacyToastProps> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Toast variant={type === 'error' ? 'destructive' : 'default'}>
      <div className="grid gap-1">
        <ToastTitle>{type === 'success' ? 'Success' : 'Error'}</ToastTitle>
        <ToastDescription>{message}</ToastDescription>
      </div>
      <ToastClose onClick={onClose} />
    </Toast>
  );
};

export default LegacyToast;
