import React from 'react';
import { 
  Users, 
  PlusCircle, 
  ClipboardList, 
  Package, 
  Truck, 
  CreditCard,
  MessageSquare,
  ChevronRight 
} from 'lucide-react';

export default function Help() {
  const sections = [
    {
      title: 'Getting Started',
      icon: PlusCircle,
      steps: [
        'Log in using your provided email and password',
        'After logging in, you\'ll see the Dashboard with key information',
        'Use the sidebar menu on the left to navigate between different sections',
        'Dark mode can be toggled using the theme switch in the top bar'
      ]
    },
    {
      title: 'Managing Customers',
      icon: Users,
      steps: [
        'Click "Customers" in the sidebar to view all customers',
        'Use the "Add Customer" button to create a new customer',
        'Search customers using the search bar at the top',
        'Click on a customer to view their details and history',
        'Edit or delete customers from their detail page'
      ]
    },
    {
      title: 'Creating Orders',
      icon: ClipboardList,
      steps: [
        'Click "Create Order" in the sidebar',
        'Search for an existing customer or click "New Customer" to create one',
        'Add products to the order by selecting from the product list',
        'Set quantities and adjust prices if needed',
        'Choose delivery method (Delivery or Collection) and date',
        'Review the order summary and click "Create Order"'
      ]
    },
    {
      title: 'Managing Products',
      icon: Package,
      steps: [
        'Access the Products section from the sidebar',
        'View all available products',
        'Add new products using the "Add Product" button',
        'Edit or delete existing products',
        'Import multiple products using CSV file',
        'Export product list for backup or analysis'
      ]
    },
    {
      title: 'Handling Deliveries',
      icon: Truck,
      steps: [
        'Go to the Deliveries section',
        'View the delivery calendar',
        'Schedule new deliveries for orders',
        'Track delivery status and update as needed',
        'View daily delivery schedule',
        'Export delivery schedules'
      ]
    },
    {
      title: 'Processing Payments',
      icon: CreditCard,
      steps: [
        'Access the Payments section',
        'View pending payments',
        'Record new payments for orders',
        'Choose payment method (Cash, Bank Transfer, EcoCash, InnBucks)',
        'Track payment history for each order',
        'Generate payment receipts'
      ]
    },
    {
      title: 'Team Communication',
      icon: MessageSquare,
      steps: [
        'Use the Chat section for team communication',
        'Send messages to team members',
        'Share order, customer, or payment information directly in chat',
        'View chat history and important updates',
        'Receive notifications for mentions and important messages',
        'Collaborate on orders and customer inquiries'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Help Guide</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to the Royal Precast CRM system. This guide will help you understand how to use the system effectively.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Icon className="h-6 w-6 text-blue-500 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <ol className="space-y-4">
                  {section.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          Need More Help?
        </h3>
        <p className="text-blue-700 dark:text-blue-200">
          If you need additional assistance, please contact Kuda via WhatsApp{' '}
          <a 
            href="https://wa.me/27612311634" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 underline"
          >
            https://wa.me/27612311634
          </a>
        </p>
      </div>
    </div>
  );
}