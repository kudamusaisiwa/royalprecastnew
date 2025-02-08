import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { useCommunicationStore } from '../store/communicationStore';
import { useCustomerStore } from '../store/customerStore';
import { useUserStore } from '../store/userStore';
import { MessageCircle, StickyNote, Clock, User, Filter, X, BarChart2 } from 'lucide-react';
import { analyzeSentiment } from '../services/openaiService';
import SentimentAnalysisModal from '../components/modals/SentimentAnalysisModal';
import { formatDistanceToNow, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '../components/ui/calendar';
import { Button } from '../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';

type FeedbackItem = {
  id: string;
  type: 'note' | 'communication';
  content: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
  customerName: string;
  customerId: string;
  orderId?: string;
  communicationType?: string;
};

export default function CustomerFeedback() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  
  const { orders } = useOrderStore();
  const { communications } = useCommunicationStore();
  const { getCustomerById, isInitialized: isCustomerStoreInitialized } = useCustomerStore();
  const { getUserById } = useUserStore();

  // Load feedback items
  useEffect(() => {
    try {
      const items: FeedbackItem[] = [];

      // Process order notes
      orders.forEach(order => {
        const customer = getCustomerById(order.customerId);
        if (!customer) {
          console.warn('Customer not found for order:', order.id, 'customerId:', order.customerId);
        }
        order.notes?.forEach(note => {
          try {
            const createdAt = note.createdAt?.toDate?.() || new Date(note.createdAt);
            if (!isNaN(createdAt.getTime())) {
              items.push({
                id: note.id,
                type: 'note',
                content: note.content,
                createdAt,
                createdBy: getUserById(note.createdBy)?.name || 'Unknown User',
                createdById: note.createdBy,
                customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
                customerId: order.customerId,
                orderId: order.id
              });
            }
          } catch (error) {
            console.error('Error processing note:', error);
          }
        });
      });

      // Process communications
      communications.forEach(comm => {
        const customer = getCustomerById(comm.customerId);
        if (!customer) {
          console.warn('Customer not found for communication:', comm.id, 'customerId:', comm.customerId);
        }
        try {
          const createdAt = comm.createdAt?.toDate?.() || new Date(comm.createdAt);
          if (!isNaN(createdAt.getTime())) {
            items.push({
              id: comm.id,
              type: 'communication',
              content: comm.summary,
              createdAt,
              createdBy: getUserById(comm.createdBy)?.name || 'Unknown User',
              createdById: comm.createdBy,
              customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
              customerId: comm.customerId,
              communicationType: comm.type
            });
          }
        } catch (error) {
          console.error('Error processing communication:', error);
        }
      });

      // Sort by date
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setFeedbackItems(items);
      setFilteredItems(items);
    } catch (error) {
      console.error('Error loading feedback items:', error);
    } finally {
      setLoading(false);
    }
  }, [orders, communications, getCustomerById, getUserById]);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    try {
      const userIds = new Set(feedbackItems.map(item => item.createdById));
      return Array.from(userIds)
        .map(id => getUserById(id))
        .filter(Boolean);
    } catch (error) {
      console.error('Error calculating unique users:', error);
      return [];
    }
  }, [feedbackItems, getUserById]);

  // Apply filters
  useEffect(() => {
    try {
      let filtered = [...feedbackItems];

      if (dateRange?.from) {
        filtered = filtered.filter(item => {
          try {
            if (dateRange.to) {
              return isWithinInterval(item.createdAt, {
                start: startOfDay(dateRange.from),
                end: endOfDay(dateRange.to)
              });
            }
            return isWithinInterval(item.createdAt, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.from)
            });
          } catch (error) {
            console.error('Error filtering by date:', error);
            return false;
          }
        });
      }

      if (selectedUser && selectedUser !== 'all') {
        filtered = filtered.filter(item => item.createdById === selectedUser);
      }

      setFilteredItems(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [dateRange, selectedUser, feedbackItems]);

  if (loading || !isCustomerStoreInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Customer Feedback
          </h1>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            onClick={async () => {
              try {
                setIsAnalyzing(true);
                setShowAnalysisModal(true);
                
                // Format feedback data
                const feedbackData = filteredItems
                  .map(item => `${item.customerName} - ${item.type === 'note' ? 'Note' : item.communicationType} - ${item.orderId ? `Order #${item.orderId}` : 'No Order'}: ${item.content}`)
                  .join('\n');
                
                // Get analysis
                const analysis = await analyzeSentiment(feedbackData);
                setAnalysisResult(analysis);
              } catch (error) {
                console.error('Error analyzing sentiment:', error);
                setAnalysisResult('Failed to analyze sentiment. Please try again.');
              } finally {
                setIsAnalyzing(false);
              }
            }}
            disabled={isAnalyzing || filteredItems.length === 0}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Analyse Sentiment</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal w-full md:w-auto',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <Filter className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {dateRange.from.toLocaleDateString()} -{' '}
                      {dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    dateRange.from.toLocaleDateString()
                  )
                ) : (
                  'Pick a date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* User Filter */}
          <div className="flex items-center space-x-2">
            <Select
              value={selectedUser}
              onValueChange={setSelectedUser}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(dateRange || selectedUser) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDateRange(undefined);
                  setSelectedUser('all');
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {item.type === 'communication' ? (
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                ) : (
                  <StickyNote className="h-5 w-5 text-yellow-500" />
                )}
                <Link 
                  to={`/customers/${item.customerId}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item.customerName}
                </Link>
                {item.communicationType && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                    {item.communicationType}
                  </span>
                )}
                {item.orderId && (
                  <Link
                    to={`/orders/${item.orderId}`}
                    className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/70 px-2 py-1 rounded-full transition-colors"
                  >
                    Order #{item.orderId}
                  </Link>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {item.createdAt ? formatDistanceToNow(item.createdAt, { addSuffix: true }) : 'Unknown date'}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {item.content}
            </p>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              <User className="h-4 w-4 mr-1" />
              <span>{item.createdBy}</span>
            </div>
          </div>
        ))}

        {feedbackItems.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No feedback items found
          </div>
        )}

        <SentimentAnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          analysis={analysisResult}
          loading={isAnalyzing}
        />
      </div>
    </div>
  );
}
