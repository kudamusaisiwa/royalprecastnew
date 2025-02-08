import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface SentimentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  loading: boolean;
}

export default function SentimentAnalysisModal({
  isOpen,
  onClose,
  analysis,
  loading,
}: SentimentAnalysisModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sentiment Analysis Report</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
