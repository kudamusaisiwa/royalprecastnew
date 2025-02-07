# Chat System Documentation

This document outlines the chat system implementation in the Royal Precast CRM, including its components, features, and data structures.

## Data Structure

### Message Interface
```typescript
interface Message {
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
  deleted?: boolean;
  deletedAt?: number;
  edited?: boolean;
  editedAt?: number;
}
```

## Components

### 1. ChatInput
Main component for message composition and sending.

**Features:**
- Text input with auto-resize
- Attachment support
- Mention functionality
- Emoji picker
- Message sending

```typescript
const ChatInput = () => {
  // Key features
  - Text input with auto-resize
  - Attachment button with preview
  - Mention system with @ trigger
  - Send button with validation
  - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
};
```

### 2. ChatMessage
Displays individual messages with interactive features.

**Features:**
- Message text display
- Attachments display
- Reactions
- Edit/Delete options
- Long-press actions
- Timestamps

```typescript
const ChatMessage = ({ message }) => {
  // Interactions
  - Long press for actions menu
  - Click reactions
  - Edit message
  - Delete message (soft delete)
  - View attachments
};
```

### 3. MentionList
Handles user mentions in messages.

**Features:**
- User search
- Filtered results
- Keyboard navigation
- Click selection
- Position calculation

```typescript
const MentionList = ({ users, searchTerm, onSelect, position }) => {
  // Features
  - Filter users by name/email
  - Limited to 5 results
  - User avatar display
  - Name and email display
  - Positioned above input
};
```

### 4. AttachmentMenu
Manages attaching external references to messages.

**Features:**
- Recent orders list
- Payment attachments
- Customer references
- Preview functionality
- Quick selection

```typescript
interface Attachment {
  type: 'customer' | 'order' | 'payment';
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
}
```

### 5. MessageActions
Handles message modification options.

**Features:**
- Edit message
- Delete message
- Popover menu
- Action confirmation

## Features

### 1. Message Management

#### Sending Messages
```typescript
const handleSendMessage = async () => {
  // Validate message
  // Process mentions
  // Handle attachments
  // Send to Firebase
  // Clear input
};
```

#### Editing Messages
```typescript
const handleEdit = async (messageId: string, newText: string) => {
  // Preserve original metadata
  // Update text
  // Mark as edited
  // Update timestamp
};
```

#### Deleting Messages
```typescript
const handleDelete = async (messageId: string) => {
  // Soft delete
  // Clear sensitive data
  // Maintain message placeholder
  // Update UI
};
```

### 2. Reactions System

```typescript
const handleReaction = async (messageId: string, emoji: string) => {
  // Toggle user reaction
  // Update reaction count
  // Maintain users list
  // Update UI
};
```

### 3. Mention System

```typescript
const handleMention = (trigger: string, search: string) => {
  // Calculate position
  // Filter users
  // Show mention list
  // Handle selection
};
```

### 4. Attachment System

```typescript
const handleAttachment = (type: 'order' | 'payment' | 'customer', id: string) => {
  // Fetch reference data
  // Create preview
  // Prepare for sending
  // Handle removal
};
```

## User Experience

### 1. Message Interactions
- Long press for actions menu
- Quick reactions
- Inline editing
- Attachment previews

### 2. Input Experience
- Auto-growing input
- Mention suggestions
- Emoji picker
- Attachment menu

### 3. Visual Feedback
- Sending states
- Error handling
- Loading states
- Action confirmations

## Security

### 1. Message Permissions
- Users can edit own messages
- Users can delete own messages
- All users can react
- All users can mention

### 2. Data Validation
- Message length limits
- Attachment validation
- Mention validation
- Reaction limits

## Best Practices

1. **Message Handling**
   - Use soft deletes
   - Preserve metadata
   - Handle errors gracefully
   - Validate input

2. **Performance**
   - Limit mention results
   - Optimize attachments
   - Handle long messages
   - Efficient updates

3. **User Experience**
   - Clear feedback
   - Intuitive interactions
   - Responsive design
   - Error recovery

4. **Security**
   - Validate permissions
   - Sanitize input
   - Protect metadata
   - Secure attachments

## Common Issues and Solutions

1. **Message Conflicts**
   - Use optimistic updates
   - Handle concurrent edits
   - Maintain message order
   - Resolve conflicts

2. **Performance**
   - Paginate messages
   - Lazy load content
   - Optimize reactions
   - Cache user data

3. **UX Issues**
   - Handle long content
   - Mobile interactions
   - Keyboard handling
   - Error states
