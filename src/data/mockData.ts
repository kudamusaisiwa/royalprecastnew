import type { Customer, Order } from '../types';

// Generate realistic company and customer names
const customers: Array<{ company: string; firstName: string; lastName: string }> = [
  { company: 'Masimba Holdings', firstName: 'John', lastName: 'Masimba' },
  { company: 'Exodus Construction', firstName: 'Sarah', lastName: 'Moyo' },
  { company: 'Fossil Contracting', firstName: 'David', lastName: 'Chigumba' },
  { company: 'Individual', firstName: 'Peter', lastName: 'Ndlovu' },
  { company: 'Tarcon Construction', firstName: 'Mary', lastName: 'Chiwenga' },
  { company: 'Individual', firstName: 'Grace', lastName: 'Mutasa' },
  { company: 'Machipisa Builders', firstName: 'James', lastName: 'Machipisa' },
  { company: 'Victoria Falls Construction', firstName: 'Robert', lastName: 'Mhlanga' },
  { company: 'Individual', firstName: 'Tendai', lastName: 'Murisa' },
  { company: 'Mutare Construction Ltd', firstName: 'Patricia', lastName: 'Zimbiti' }
].slice(0, 20); // Limit to 20 customers

const products = [
  { name: 'Concrete Blocks (Standard)', basePrice: 15 },
  { name: 'Pavers (Square)', basePrice: 25 },
  { name: 'Retaining Wall Blocks', basePrice: 35 },
  { name: 'Concrete Lintels', basePrice: 45 },
  { name: 'Storm Drain Channels', basePrice: 120 }
];

const cities = [
  'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru',
  'Kwekwe', 'Kadoma', 'Masvingo'
];

// Generate customers with company names
export const generateCustomers = (): Customer[] => {
  return customers.map((customer, index) => ({
    id: (index + 1).toString(),
    firstName: customer.firstName,
    lastName: customer.lastName,
    companyName: customer.company === 'Individual' ? undefined : customer.company,
    email: customer.firstName.toLowerCase() + '.' + customer.lastName.toLowerCase() + '@' + 
          (customer.company === 'Individual' ? 'gmail.com' : 
           customer.company.toLowerCase().replace(/\s+/g, '') + '.co.zw'),
    phone: `+263 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
    address: `${Math.floor(Math.random() * 1000)} ${cities[Math.floor(Math.random() * cities.length)]}, Zimbabwe`,
    notes: Math.random() > 0.5 ? `Regular customer - ${Math.random() > 0.5 ? 'Prefers morning deliveries' : 'Requires site inspection'}` : undefined,
    rating: Math.floor(Math.random() * 5) + 1,
    totalOrders: Math.floor(Math.random() * 20),
    totalRevenue: Math.floor(Math.random() * 50000),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }));
};

// Generate orders spanning last 7 days, limited to 3 orders per customer
export const generateOrders = (customers: Customer[]): Order[] => {
  const orders: Order[] = [];
  const now = new Date();

  // Generate 1-3 orders per customer
  customers.forEach((customer) => {
    const numOrders = Math.floor(Math.random() * 3) + 1; // 1-3 orders per customer

    for (let i = 0; i < numOrders; i++) {
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [...products]
        .sort(() => Math.random() - 0.5)
        .slice(0, numProducts)
        .map(product => ({
          id: Math.random().toString(36).substr(2, 9),
          name: product.name,
          quantity: Math.floor(Math.random() * 100) + 10,
          unitPrice: product.basePrice * (0.9 + Math.random() * 0.3)
        }));

      const totalAmount = selectedProducts.reduce((sum, product) => 
        sum + product.quantity * product.unitPrice, 0
      );

      // Generate more realistic status distribution
      const status: Order['status'] = ['quotation', 'paid', 'production', 'quality_control', 'dispatch', 'installation', 'completed'][Math.floor(Math.random() * 7)];

      const orderDate = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
      orderDate.setHours(Math.floor(Math.random() * 8) + 8); // Between 8 AM and 4 PM

      const year = orderDate.getFullYear().toString().slice(-2);
      const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = orderDate.getDate().toString().padStart(2, '0');
      const sequence = (i + 1).toString().padStart(3, '0');
      const orderId = `${year}${month}${dayStr}${sequence}`;

      orders.push({
        id: orderId,
        customerId: customer.id,
        products: selectedProducts,
        status,
        deliveryDate: new Date(orderDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        deliveryMethod: Math.random() > 0.3 ? 'delivery' : 'pickup',
        paymentStatus: status === 'paid' ? 'paid' : 'pending',
        totalAmount,
        createdAt: orderDate,
        updatedAt: new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      });
    }
  });

  return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};