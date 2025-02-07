import { Order } from '../types';

export function exportDeliveryData(
  orders: { deliveries: Order[], collections: Order[] },
  startDate: Date,
  endDate: Date,
  getCustomerById: (id: string) => any
) {
  const headers = [
    'Date',
    'Type',
    'Order Number',
    'Customer',
    'Company',
    'Items',
    'Total Amount',
    'Status',
    'Contact',
    'Phone',
    'Address'
  ];

  const rows: string[][] = [];

  // Format date range for filename
  const formatDateForFilename = (date: Date) => 
    date.toISOString().split('T')[0];

  // Add deliveries
  orders.deliveries.forEach(order => {
    const customer = getCustomerById(order.customerId);
    if (customer) {
      rows.push([
        order.deliveryDate?.toLocaleDateString() || '',
        'Delivery',
        order.id,
        `${customer.firstName} ${customer.lastName}`,
        customer.companyName || '',
        order.products.reduce((sum, p) => sum + p.quantity, 0).toString(),
        order.totalAmount.toFixed(2),
        order.deliveryStatus || 'pending',
        `${customer.firstName} ${customer.lastName}`,
        customer.phone,
        customer.address.replace(/,/g, ';')
      ]);
    }
  });

  // Add collections
  orders.collections.forEach(order => {
    const customer = getCustomerById(order.customerId);
    if (customer) {
      rows.push([
        order.collectionDate?.toLocaleDateString() || '',
        'Collection',
        order.id,
        `${customer.firstName} ${customer.lastName}`,
        customer.companyName || '',
        order.products.reduce((sum, p) => sum + p.quantity, 0).toString(),
        order.totalAmount.toFixed(2),
        order.collectionStatus || 'pending',
        `${customer.firstName} ${customer.lastName}`,
        customer.phone,
        customer.address.replace(/,/g, ';')
      ]);
    }
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
    ).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `deliveries-${formatDateForFilename(startDate)}-to-${formatDateForFilename(endDate)}.csv`;
  link.click();
}