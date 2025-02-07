# Royal Precast CRM Security Rules Documentation

This document outlines all the security rules and permissions in the Royal Precast CRM system. It covers both Firestore and Realtime Database rules.

## User Roles

The system has the following user roles with different levels of access:
- Admin
- Manager
- Finance
- Regular User (Authenticated)
- Anonymous User

## Firestore Collections

### Orders Collection
- **Anonymous Access**
  - Can read basic order data for tracking purposes
  - Cannot access sensitive order details

- **Authenticated Users**
  - Can view full order details

- **Admin/Manager/Finance Users**
  - Can create new orders
  - Can update existing orders

- **Admin Only**
  - Can delete orders

### Users Collection
- **Authenticated Users**
  - Can read all user profiles
  - Can update their own profile

- **Admin Only**
  - Can create new users
  - Can delete users
  - Can update any user's profile

### Products Collection
- **Authenticated Users**
  - Can view all products

- **Admin/Manager**
  - Can create new products
  - Can update existing products

- **Admin Only**
  - Can delete products

### Payments Collection
- **Authenticated Users**
  - Can view all payments

- **Admin/Finance**
  - Can create new payments
  - Can update existing payments

- **Admin Only**
  - Can delete payments

### Customers Collection
- **Authenticated Users**
  - Can view all customers

- **Admin/Manager/Finance**
  - Can create new customers
  - Can update existing customers

- **Admin Only**
  - Can delete customers

### Tasks Collection
- **Authenticated Users**
  - Can create new tasks
  - Can read tasks they created
  - Can read tasks assigned to them
  - Can update tasks they created
  - Can update tasks assigned to them
  - Can delete tasks they created

- **Admin/Manager**
  - Can read all tasks
  - Can update any task
  - Can delete any task

### Activities Collection (Audit Logs)
- **Authenticated Users**
  - Can read all activities
  - Can create new activities

- **No One Can**
  - Update activities
  - Delete activities
  (Activities are immutable for audit purposes)

### Communications Collection
- **Authenticated Users**
  - Can read all communications

- **Admin/Manager**
  - Can create new communications
  - Can update existing communications

- **Admin Only**
  - Can delete communications

## Realtime Database

### Messages Collection (Chat)
- **Authenticated Users Can**
  - Read all messages
  - Send new messages
  - Edit their own messages
  - Delete their own messages (marks as deleted)
  - Add reactions to messages
  - Mention other users

- **Message Validation**
  - Text must be non-empty and under 1000 characters
  - Must include: text, userId, userName, timestamp
  - Optional fields: mentions, attachments, reactions
  - Deleted messages are marked with deleted: true and deletedAt timestamp

- **No One Can**
  - Edit messages they didn't create
  - Delete messages they didn't create
  - Change the userId of a message
  - Access messages without authentication

## Special Rules

### Task Management
- Users can only see tasks that:
  1. They created
  2. Are assigned to them
  3. Or if they are Admin/Manager

### User Profile Updates
- Users can only update their own profile unless they are Admin
- Profile updates maintain role-based restrictions

### Order Tracking
- Public tracking page is the only feature accessible without authentication
- Provides limited order information for customer tracking

### Audit Logging
- All activities are permanently stored
- Cannot be modified or deleted by any user
- Provides accountability for all system actions

## Security Best Practices

1. **Default Deny**
   - All undefined routes are automatically denied
   - Access must be explicitly granted

2. **Role Validation**
   - All role-based access is validated server-side
   - Roles cannot be modified by regular users

3. **Data Validation**
   - All data must meet specified formats
   - Timestamps are validated against server time
   - String lengths are enforced
   - Required fields are enforced

4. **Ownership Validation**
   - Users can only modify their own content
   - Role-based exceptions for admin/manager users

5. **Immutable History**
   - Activities/audit logs cannot be modified
   - Deleted messages are marked rather than removed
   - Original timestamps are preserved

## Updating Rules

When updating security rules:
1. Always test new rules thoroughly
2. Consider impact on existing functionality
3. Maintain principle of least privilege
4. Document changes in this file
5. Update application code to match rule changes
