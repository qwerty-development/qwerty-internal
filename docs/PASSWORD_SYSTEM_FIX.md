# Password System Fix

## Problem

The password caching system was broken due to two main issues:

1. **Database Schema Change**: The database was updated to use `company_email` instead of `contact_email`, but the password API was still trying to access the old field name.

2. **In-Memory Cache Issue**: The password cache was stored in memory, which gets reset every time the server restarts, causing all cached passwords to be lost.

## Solution

### 1. Database Schema Fix

**Fixed**: Updated the password API route to use `company_email` instead of `contact_email`:

```typescript
// Before (broken)
.select("contact_email")

// After (fixed)
.select("company_email")
```

### 2. Persistent Password Storage

**Replaced**: In-memory cache with a persistent database table.

**New Table**: `password_storage`

```sql
CREATE TABLE password_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);
```

**Features**:

- Passwords are encrypted before storage
- 30-day expiration period
- Automatic cleanup of expired passwords
- CASCADE deletion when client is deleted

## Implementation Steps

### Step 1: Run Database Migration

Execute the SQL script in `docs/PASSWORD_STORAGE_MIGRATION.sql` in your Supabase SQL Editor.

### Step 2: Add Environment Variable (Optional)

For better security, add a password encryption key to your `.env.local`:

```env
PASSWORD_ENCRYPTION_KEY=your-secure-encryption-key-here
```

If not provided, a default key will be used.

### Step 3: Restart Your Development Server

The new password system will be active after restart.

## Files Modified

### New Files Created:

- `docs/PASSWORD_STORAGE_MIGRATION.sql` - Database migration script
- `src/utils/passwordService.ts` - New password service with database storage
- `src/app/api/admin/cleanup-passwords/route.ts` - Admin cleanup endpoint
- `docs/PASSWORD_SYSTEM_FIX.md` - This documentation

### Files Updated:

- `src/app/api/clients/route.ts` - Updated to use new password service
- `src/app/api/clients/[id]/password/route.ts` - Fixed field name and updated service
- `src/app/api/clients/[id]/delete/route.ts` - Added password cleanup on deletion

## How It Works

### Password Storage Flow:

1. Client is created with random password
2. Password is encrypted using AES-256-CBC
3. Encrypted password is stored in `password_storage` table
4. Password expires after 30 days

### Password Retrieval Flow:

1. Admin requests password for client
2. System checks if password exists and hasn't expired
3. If valid, password is decrypted and returned
4. If expired, password is automatically deleted

### Security Features:

- Passwords are encrypted at rest
- 30-day expiration prevents indefinite storage
- Automatic cleanup of expired passwords
- CASCADE deletion ensures no orphaned password records

## Testing

### Test Password Storage:

1. Create a new client
2. Note the generated password
3. Navigate to client details page
4. Click "Get Password" button
5. Verify the password matches the original

### Test Password Expiration:

1. Create a client and note the password
2. Wait 30 days (or manually update the `expires_at` field in database)
3. Try to retrieve the password
4. Verify it returns "password expired" error

### Test Client Deletion:

1. Create a client with password
2. Delete the client
3. Verify the password record is also deleted from `password_storage`

## Maintenance

### Manual Cleanup:

You can manually clean up expired passwords by calling:

```bash
curl -X POST http://localhost:3000/api/admin/cleanup-passwords
```

### Automatic Cleanup:

Consider setting up a cron job or scheduled task to run the cleanup endpoint periodically.

## Troubleshooting

### "No original password found" Error:

- Check if the client was created after the migration
- Verify the `password_storage` table exists
- Check if the password has expired

### "Client not found" Error:

- Verify the client ID is correct
- Check if the client exists in the `clients` table
- Ensure you're using the correct field names (`company_email`)

### Encryption Errors:

- Verify the `PASSWORD_ENCRYPTION_KEY` environment variable is set (optional)
- Check that the crypto module is available

## Migration Notes

### For Existing Clients:

- Passwords for clients created before this migration will not be available
- Only passwords for newly created clients will be stored and retrievable
- This is expected behavior as the old in-memory cache is not persistent

### Backward Compatibility:

- The old `passwordCache.ts` file is no longer used but can be kept for reference
- All new password operations use the database-based system
- No changes needed to client-side code
