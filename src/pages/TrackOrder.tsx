import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOrderTrackingStore } from '@/store/orderTrackingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { OperationalStatus } from '@/types'
import { useToast } from '@/components/ui/use-toast'
import { useThemeStore } from '@/store/themeStore'
import { Moon, Sun } from 'lucide-react'

const STATUSES: OperationalStatus[] = ['quotation', 'production', 'quality_control', 'dispatch', 'installation', 'completed']
const LOGO_URL = "https://res.cloudinary.com/fresh-ideas/image/upload/v1731533951/o6no9tkm6wegl6mprrri.png";

export default function TrackOrder() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [trackingNumber, setTrackingNumber] = useState(() => searchParams.get('orderId') || '')
  const { isDarkMode, toggleTheme } = useThemeStore()
  const { 
    order, 
    loading, 
    error,
    recentTrackingNumbers,
    trackOrder,
    clearOrder
  } = useOrderTrackingStore()

  // Automatically track order if orderId is in URL
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (orderId && !order && !loading && !error) {
      trackOrder(orderId)
    }
  }, [searchParams])

  const handleTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber) return
    
    try {
      await trackOrder(trackingNumber)
    } catch (error) {
      console.error('Error tracking order:', error)
    }
  }

  const handleCopyLink = () => {
    if (!order) return
    const trackingLink = `${window.location.origin}/track?orderId=${order.id}`
    navigator.clipboard.writeText(trackingLink)
    toast({
      title: "Link Copied",
      description: "The tracking link has been copied to your clipboard.",
      duration: 3000,
    })
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Moon className="h-6 w-6 text-blue-800 dark:text-blue-400" />
          ) : (
            <Sun className="h-6 w-6 text-blue-800 dark:text-blue-400" />
          )}
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={LOGO_URL}
              alt="Royal Precast"
              className="mx-auto h-20 w-auto mb-4"
              style={{
                filter: isDarkMode ? 'invert(1) brightness(2)' : 'none',
                transition: 'filter 0.3s ease-in-out'
              }}
            />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Track Your Order
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your tracking number to see your order status
            </p>
          </div>

          <form onSubmit={handleTracking} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter order ID (e.g., RPC202401180001 or your order ID)"
                className="flex-1 text-lg h-12 bg-white dark:bg-gray-800 border-2 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 px-6 bg-blue-800 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                {loading ? 'Tracking...' : 'Track'}
              </Button>
            </div>
          </form>

          {error && (
            <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
          )}

          {/* Recent tracking numbers */}
          {recentTrackingNumbers.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">Recent Tracking Numbers</h2>
              <div className="flex flex-wrap gap-2">
                {recentTrackingNumbers.map((number) => (
                  <Button
                    key={number}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTrackingNumber(number)
                      trackOrder(number)
                    }}
                    className="font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  >
                    {number}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Order details */}
          {order && (
            <div className="mt-8 border-2 dark:border-gray-700 rounded-lg p-6 space-y-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Order Status</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => clearOrder()}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clear
                </Button>
              </div>

              {/* Status timeline */}
              <div className="space-y-4">
                {STATUSES.map((status, index) => {
                  const isCompleted = order.status === status
                  const isPast = STATUSES.indexOf(order.status) > index

                  return (
                    <div
                      key={status}
                      className={`flex items-center gap-4 ${
                        isCompleted ? 'text-blue-800 dark:text-blue-400' : 
                        isPast ? 'text-gray-600 dark:text-gray-400' : 
                        'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          isCompleted || isPast ? 'bg-blue-800 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {status === 'dispatch' 
                            ? 'Dispatch or Ready for Pickup'
                            : status.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')
                          }
                        </div>
                        {isCompleted && order.updatedAt && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Updated: {format(order.updatedAt.toDate(), 'PPp')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-600 dark:text-gray-400">Customer Name:</div>
                <div className="text-gray-900 dark:text-white">{order.customerName}</div>
                
                <div className="text-gray-600 dark:text-gray-400">Created:</div>
                <div className="text-gray-900 dark:text-white">{format(order.createdAt.toDate(), 'PPP')}</div>
                
                <div className="text-gray-600 dark:text-gray-400">Total Amount:</div>
                <div className="text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</div>

                <div className="text-gray-600 dark:text-gray-400">Order ID:</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white">{order.id}</span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-gray-900 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    onClick={handleCopyLink}
                  >
                    Copy Link
                  </Button>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Products</h3>
                <div className="space-y-2">
                  {order.products.map((product, index) => (
                    <div key={index} className="border-2 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">Product:</div>
                        <div className="text-gray-900 dark:text-white">{product.name}</div>
                        
                        <div className="text-gray-600 dark:text-gray-400">Quantity:</div>
                        <div className="text-gray-900 dark:text-white">{product.quantity}</div>
                        
                        <div className="text-gray-600 dark:text-gray-400">Unit Price:</div>
                        <div className="text-gray-900 dark:text-white">${product.unitPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
