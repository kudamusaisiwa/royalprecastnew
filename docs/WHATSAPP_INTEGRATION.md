# WhatsApp Integration Guide

This guide explains how to integrate WhatsApp messaging capabilities into the Royal Precast CRM using the `whatsapp-web.js` library.

## Prerequisites

- Node.js v18 or higher
- A WhatsApp account with a registered phone number
- Google Chrome installed (required for WhatsApp Web)

## Installation

1. Install required dependencies:
```bash
npm install whatsapp-web.js qrcode-terminal
```

2. Add WhatsApp configuration to your `.env`:
```env
VITE_WHATSAPP_SESSION_PATH=./whatsapp-sessions
VITE_WHATSAPP_CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

## Implementation

### 1. WhatsApp Service Setup

Create a new service file at `src/services/whatsapp.ts`:

```typescript
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { create } from 'zustand';

interface WhatsAppStore {
  isReady: boolean;
  qrCode: string | null;
  setReady: (ready: boolean) => void;
  setQRCode: (code: string | null) => void;
}

// WhatsApp Store for managing state
export const useWhatsAppStore = create<WhatsAppStore>((set) => ({
  isReady: false,
  qrCode: null,
  setReady: (ready) => set({ isReady: ready }),
  setQRCode: (code) => set({ qrCode: code }),
}));

class WhatsAppService {
  private static instance: WhatsAppService;
  private client: Client;
  
  private constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: import.meta.env.VITE_WHATSAPP_SESSION_PATH
      }),
      puppeteer: {
        executablePath: import.meta.env.VITE_WHATSAPP_CHROME_PATH,
        headless: true,
        args: ['--no-sandbox']
      }
    });

    this.initializeClient();
  }

  private initializeClient() {
    const { setQRCode, setReady } = useWhatsAppStore.getState();

    this.client.on('qr', (qr) => {
      // Generate QR in terminal and store it for UI
      qrcode.generate(qr, { small: true });
      setQRCode(qr);
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      setReady(true);
      setQRCode(null);
    });

    this.client.on('disconnected', () => {
      console.log('WhatsApp client disconnected');
      setReady(false);
    });

    this.client.initialize();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Send message to a specific phone number
  public async sendMessage(phoneNumber: string, message: string): Promise<Message> {
    const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    return await this.client.sendMessage(chatId, message);
  }

  // Send order notification
  public async sendOrderNotification(
    phoneNumber: string,
    orderNumber: string,
    status: string
  ): Promise<Message> {
    const message = `🔔 *Order Update*\nOrder #${orderNumber}\nStatus: ${status}\n\nTrack your order at: ${window.location.origin}/track?order=${orderNumber}`;
    return this.sendMessage(phoneNumber, message);
  }

  // Send delivery notification
  public async sendDeliveryNotification(
    phoneNumber: string,
    orderNumber: string,
    estimatedTime: string
  ): Promise<Message> {
    const message = `🚚 *Delivery Update*\nOrder #${orderNumber}\nEstimated delivery time: ${estimatedTime}\n\nTrack your delivery at: ${window.location.origin}/track?order=${orderNumber}`;
    return this.sendMessage(phoneNumber, message);
  }

  // Send payment reminder
  public async sendPaymentReminder(
    phoneNumber: string,
    orderNumber: string,
    amount: number
  ): Promise<Message> {
    const message = `💰 *Payment Reminder*\nOrder #${orderNumber}\nOutstanding amount: $${amount.toFixed(2)}\n\nMake payment at: ${window.location.origin}/payments`;
    return this.sendMessage(phoneNumber, message);
  }
}

export default WhatsAppService;
```

### 2. WhatsApp QR Code Component

Create a component to display the QR code for WhatsApp Web authentication at `src/components/WhatsAppQR.tsx`:

```typescript
import React from 'react';
import QRCode from 'qrcode.react';
import { useWhatsAppStore } from '@/services/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function WhatsAppQR() {
  const { qrCode, isReady } = useWhatsAppStore();

  if (isReady) {
    return null;
  }

  return (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle>Scan WhatsApp QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        {qrCode ? (
          <QRCode value={qrCode} size={256} />
        ) : (
          <div>Loading QR Code...</div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. Integration Examples

#### Order Status Updates

```typescript
// In your order status update function
async function updateOrderStatus(orderId: string, status: string) {
  try {
    // Update order status in database
    await updateOrderInDB(orderId, status);

    // Get customer phone number
    const order = await getOrderDetails(orderId);
    const customerPhone = order.customer.phoneNumber;

    // Send WhatsApp notification
    await WhatsAppService.getInstance().sendOrderNotification(
      customerPhone,
      orderId,
      status
    );
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
}
```

#### Delivery Updates

```typescript
// In your delivery management component
async function scheduleDelivery(orderId: string, deliveryTime: string) {
  try {
    // Schedule delivery in system
    await createDeliverySchedule(orderId, deliveryTime);

    // Get customer details
    const order = await getOrderDetails(orderId);
    const customerPhone = order.customer.phoneNumber;

    // Send WhatsApp notification
    await WhatsAppService.getInstance().sendDeliveryNotification(
      customerPhone,
      orderId,
      deliveryTime
    );
  } catch (error) {
    console.error('Failed to send delivery notification:', error);
  }
}
```

#### Payment Reminders

```typescript
// In your payment reminder system
async function sendPaymentReminders() {
  try {
    // Get all overdue payments
    const overduePayments = await getOverduePayments();

    // Send reminders
    for (const payment of overduePayments) {
      await WhatsAppService.getInstance().sendPaymentReminder(
        payment.customer.phoneNumber,
        payment.orderId,
        payment.outstandingAmount
      );
    }
  } catch (error) {
    console.error('Failed to send payment reminders:', error);
  }
}
```

## Security Considerations

1. **Session Management**
   - WhatsApp sessions are stored in the configured `VITE_WHATSAPP_SESSION_PATH`
   - Keep session files secure and backup regularly
   - For production, consider using encrypted storage

2. **Rate Limiting**
   - Implement rate limiting to prevent spam
   - Recommended: max 5 messages per second per number

3. **Phone Number Validation**
   - Always validate phone numbers before sending messages
   - Ensure numbers are in international format (e.g., +263XXXXXXXXX)

4. **Error Handling**
   - Implement proper error handling and logging
   - Have fallback notification methods (email, SMS)

## Best Practices

1. **Message Templates**
   - Use consistent message templates
   - Include opt-out instructions in marketing messages
   - Keep messages concise and professional

2. **Testing**
   - Use a dedicated test WhatsApp number
   - Test all notification types thoroughly
   - Monitor delivery rates and user engagement

3. **Monitoring**
   - Log all WhatsApp interactions
   - Monitor connection status
   - Set up alerts for disconnections

4. **Deployment**
   - Use PM2 or similar process manager
   - Set up automatic reconnection
   - Monitor memory usage

## Troubleshooting

1. **QR Code Issues**
   - Clear the `whatsapp-sessions` directory
   - Restart the WhatsApp service
   - Ensure Chrome is installed and accessible

2. **Connection Issues**
   - Check internet connectivity
   - Verify Chrome installation
   - Check WhatsApp Web status

3. **Message Delivery Issues**
   - Verify phone number format
   - Check rate limiting
   - Ensure WhatsApp service is ready

## Limitations

1. WhatsApp does not officially support automation
2. Risk of account ban for excessive automation
3. Requires active internet connection
4. Requires Chrome browser
5. Single device connection at a time

## Support

For issues and questions:
1. Check the [whatsapp-web.js documentation](https://docs.wwebjs.dev/)
2. Review error logs
3. Contact the development team
