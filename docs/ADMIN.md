# Admin User Management

## Default Admin Credentials

The system comes with a default admin user that is created when you run the seed function:

- **Email**: admin@shibr.sa
- **Password**: Admin@123
- **Dashboard**: /admin-dashboard

⚠️ **IMPORTANT**: Change the default password immediately in production!

## Creating Admin Users

### Method 1: Using the Seed Function

Run the master seed function to create the default admin along with sample data:

```bash
bunx convex run seed:seedAll
```

### Method 2: Using the CLI Script

Create additional admin users interactively:

```bash
node scripts/create-admin.js
```

The script will prompt you for:
- Email address
- Password (minimum 8 characters)
- Full name
- Phone number

### Method 3: Direct Convex Mutation

Create an admin programmatically:

```bash
bunx convex run admin:createAdminUser '{"email":"admin@example.com","password":"SecurePass123","fullName":"Admin Name","phoneNumber":"0501234567"}'
```

## Admin Functions

The admin module (`convex/admin.ts`) provides the following functions:

### User Management
- `createAdminUser` - Create a new admin user
- `toggleUserStatus` - Activate/deactivate user accounts
- `verifyAdminAccess` - Check if a user has admin privileges

### Platform Management
- `updatePlatformSettings` - Configure platform fee, minimum prices, etc.
- `getAdminStats` - Get comprehensive platform statistics

### Content Moderation
- `reviewShelfListing` - Approve or reject shelf listings
- Automatic notification sending to users on approval/rejection

## Admin Dashboard Features

The admin dashboard (`/admin-dashboard`) provides:

1. **User Management**
   - View all registered users
   - Filter by account type (store owners, brand owners)
   - Activate/deactivate accounts
   - View user details and activity

2. **Shelf Management**
   - Review pending shelf listings
   - Approve or reject with reasons
   - Monitor active rentals
   - Track shelf performance

3. **Financial Overview**
   - Total revenue tracking
   - Platform fee calculations
   - Transaction history
   - Revenue analytics

4. **Platform Settings**
   - Configure platform fee percentage (default: 8%)
   - Set minimum shelf prices
   - Define maximum discount percentages

## Security Considerations

1. **Password Security**
   - Implement proper password hashing (bcrypt/argon2) in production
   - Enforce strong password policies
   - Consider implementing 2FA for admin accounts

2. **Access Control**
   - All admin functions verify admin privileges
   - Admin cannot deactivate their own account
   - Session management should be implemented

3. **Audit Logging**
   - Track all admin actions
   - Log approval/rejection decisions
   - Monitor configuration changes

## Database Schema

Admin users are stored in the `users` table with `accountType: "admin"`. The schema supports:

- Multiple admin users
- Email-based authentication
- Active/inactive status
- Email verification status
- Language preferences
- Last login tracking

## API Integration

Admin endpoints should be protected with proper authentication:

```typescript
// Example: Verify admin access before operations
const adminCheck = await convex.query(api.admin.verifyAdminAccess, {
  userId: currentUserId
});

if (!adminCheck.isAdmin) {
  throw new Error(adminCheck.error);
}
```

## Troubleshooting

### Admin Cannot Login
1. Check if the admin user exists: `bunx convex run users:getUsersByType '{"accountType":"admin"}'`
2. Verify the account is active
3. Ensure correct credentials are being used

### Permission Denied Errors
1. Verify the user has `accountType: "admin"`
2. Check if the account is active
3. Ensure proper authentication flow

### Seeding Issues
1. Clear existing data if needed
2. Run `bunx convex dev` to sync schema
3. Execute `bunx convex run seed:seedAll`