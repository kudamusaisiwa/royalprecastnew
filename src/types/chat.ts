export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  mentions?: { [key: string]: string }; // userId: userName
  reactions?: {
    [emoji: string]: {
      count: number;
      users: string[]; // array of userIds who reacted with this emoji
    }
  };
  attachment?: {
    type: 'customer' | 'order' | 'payment';
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
  };
}