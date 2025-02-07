import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { PaymentMethod } from '../../types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddPartPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: PaymentMethod, notes?: string) => void;
  remainingAmount: number;
}

export default function AddPartPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  remainingAmount
}: AddPartPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = Number(Number(amount).toFixed(2));
    if (!isNaN(paymentAmount) && paymentAmount > 0 && paymentAmount <= remainingAmount) {
      onConfirm(paymentAmount, method, notes);
      setAmount('');
      setMethod('bank_transfer');
      setNotes('');
      setReference('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 transition-opacity" />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-8 shadow-2xl transition-all">
          <div className="absolute right-6 top-6">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Add Payment</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                Payment Method
              </Label>
              <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                <SelectTrigger className="h-14 text-base">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="ecocash">EcoCash</SelectItem>
                  <SelectItem value="innbucks">InnBucks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                Amount ($)
              </Label>
              <Input
                type="number"
                required
                min="0.01"
                max={remainingAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-base"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remaining balance: ${remainingAmount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                Reference Number
              </Label>
              <Input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional"
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                Notes
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="min-h-[120px] text-base resize-none"
              />
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-14 px-6 text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-14 px-6 text-base bg-blue-600 hover:bg-blue-500"
              >
                Add Payment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}