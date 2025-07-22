# Client Creation System Documentation

## Overview

This document explains the automated client creation system implemented in the QWERTY Internal Management System. The system allows admins to create client accounts that automatically generate Supabase Auth users with random passwords, while maintaining proper database relationships and security.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │───▶│  Next.js API     │───▶│   Supabase      │
│   (Client-Side) │    │  Route (Server)  │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

1. **Admin Form** (`/admin/clients/new`) - Client-side form for entering client details
2. **API Route** (`/api/clients`) - Server-side handler for client creation
3. **Database Tables** - `auth.users`, `users`, `clients` with proper relationships
4. **Password Generator** - Utility for creating secure random passwords

## Database Schema

### Tables Structure

```sql
-- Supabase Auth (managed by Supabase)
auth.users (
  id: uuid (primary key)
  email: text
  encrypted_password: text
  -- other auth fields...
)

-- Custom users table for roles and profiles
users (
  id: uuid (primary key, references auth.users.id)
  role: text (enum: 'admin', 'client')
  name: text
  phone: text
  created_at: timestamp
  updated_at: timestamp
)

-- Client-specific information
clients (
  id: uuid (primary key)
  name: text
  contact_email: text
  contact_phone: text
  address: text
  notes: text
  user_id: uuid (foreign key to users.id)
  created_at: timestamp
  updated_at: timestamp
)
```

### Relationships

- `clients.user_id` → `users.id` → `auth.users.id`
- This creates a chain: Client → User Profile → Auth User

## Implementation Details

### 1. Client-Side Form (`/admin/clients/new/page.tsx`)

**Purpose**: Collect client information from admin

**Key Features**:

- Form validation for required fields
- Error handling and success messages
- Password display with copy-to-clipboard functionality
- Form reset after successful creation

**Code Flow**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // 1. Validate form data
  // 2. Call createClientUser() utility
  // 3. Handle response (success/error)
  // 4. Display generated password
  // 5. Reset form on success
};
```

### 2. Client Creation Utility (`/utils/clientCreation.ts`)

**Purpose**: Client-side helper that calls the API route

**Key Features**:

- Simple fetch wrapper for the API
- Error handling and response formatting
- No direct database access (security)

**Code Flow**:

```typescript
export async function createClientUser(clientData: ClientData) {
  // 1. Send POST request to /api/clients
  // 2. Handle response
  // 3. Return formatted result
}
```

### 3. API Route (`/api/clients/route.ts`)

**Purpose**: Server-side handler for client creation with full database access

**Key Features**:

- Access to `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Multi-step creation process with rollback
- Proper error handling and HTTP status codes
- Password generation and return

**Code Flow**:

```typescript
export async function POST(request: NextRequest) {
  // 1. Parse request data
  // 2. Generate random password
  // 3. Create Supabase Auth user
  // 4. Create users table entry
  // 5. Create clients table entry
  // 6. Return success with password
  // 7. Handle errors with rollback
}
```

### 4. Password Generator (`/utils/passwordGenerator.ts`)

**Purpose**: Generate secure random passwords

**Features**:

- Minimum 12 characters
- Includes uppercase, lowercase, numbers, and symbols
- Ensures at least one character from each category
- Shuffles final password for randomness

## Security Considerations

### 1. Service Role Key Protection

**Problem**: `SUPABASE_SERVICE_ROLE_KEY` cannot be exposed to client-side code

**Solution**:

- Move all service role operations to server-side API routes
- Client-side only uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key only accessible in `/api/*` routes

### 2. Environment Variables

**Required Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Security Notes**:

- `NEXT_PUBLIC_*` variables are exposed to client-side
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- Never log or expose service role key

### 3. Error Handling and Rollback

**Multi-Step Process**:

1. Create Auth user
2. Create users table entry
3. Create clients table entry

**Rollback Strategy**:

- If step 2 fails → Delete Auth user
- If step 3 fails → Delete Auth user + users entry
- Ensures database consistency

## User Workflow

### Admin Workflow

1. **Navigate** to `/admin/clients/new`
2. **Fill Form** with client details (name, email, phone, address, notes)
3. **Submit** form
4. **View** generated password
5. **Copy** password to clipboard
6. **Share** credentials with client manually

### Client Workflow

1. **Receive** email and password from admin
2. **Navigate** to `/signin`
3. **Sign In** with provided credentials
4. **Access** client portal at `/portal`
5. **Change** password (future feature)

## Error Scenarios and Handling

### Common Errors

1. **Missing Environment Variables**

   - Error: "Missing environment variables"
   - Solution: Check `.env.local` file

2. **Duplicate Email**

   - Error: "User already registered"
   - Solution: Use different email or check existing clients

3. **Database Constraint Violation**

   - Error: Specific database error message
   - Solution: Check data format and constraints

4. **Network Issues**
   - Error: "Failed to create client"
   - Solution: Check internet connection and API route

### Debugging

**Client-Side Debugging**:

- Check browser console for fetch errors
- Verify form data is correct
- Check network tab for API responses

**Server-Side Debugging**:

- Check server logs for API route errors
- Verify environment variables are loaded
- Check Supabase dashboard for auth user creation

## Future Enhancements

### 1. Email Automation

**Goal**: Automatically send credentials to clients

**Implementation**:

- Add email service (SendGrid, Resend, etc.)
- Create email template
- Send email after successful client creation

### 2. Password Reset

**Goal**: Allow clients to reset their passwords

**Implementation**:

- Use Supabase Auth password reset
- Create password reset page
- Handle reset flow

### 3. Data Validation

**Goal**: Better input validation

**Implementation**:

- Add Zod or similar validation library
- Validate email format, phone numbers
- Add client-side and server-side validation

### 4. Row Level Security (RLS)

**Goal**: Better data protection

**Implementation**:

- Enable RLS on all tables
- Create policies for admin/client access
- Test security thoroughly

## Testing

### Manual Testing Checklist

- [ ] Admin can create client with all fields
- [ ] Admin can create client with minimal fields
- [ ] Generated password is displayed and copyable
- [ ] Client can sign in with generated credentials
- [ ] Client is redirected to correct portal
- [ ] Error handling works for invalid data
- [ ] Rollback works when creation fails

### Database Verification

After creating a client, verify:

1. **Auth User Created**:

   ```sql
   SELECT * FROM auth.users WHERE email = 'client@example.com';
   ```

2. **User Profile Created**:

   ```sql
   SELECT * FROM users WHERE email = 'client@example.com';
   ```

3. **Client Record Created**:

   ```sql
   SELECT * FROM clients WHERE contact_email = 'client@example.com';
   ```

4. **Relationships Correct**:
   ```sql
   SELECT c.*, u.name as user_name, u.role
   FROM clients c
   JOIN users u ON c.user_id = u.id
   WHERE c.contact_email = 'client@example.com';
   ```

## Troubleshooting

### Common Issues

1. **"supabaseKey is required"**

   - Cause: Service role key not accessible
   - Solution: Ensure API route is server-side only

2. **"User already registered"**

   - Cause: Email already exists in auth.users
   - Solution: Use different email or check existing users

3. **Foreign key constraint failed**

   - Cause: Invalid user_id reference
   - Solution: Check users table exists and has correct ID

4. **Environment variables not loading**
   - Cause: .env.local not in root directory
   - Solution: Restart development server

### Getting Help

1. Check this documentation first
2. Review error messages in console/logs
3. Verify database schema and relationships
4. Test with minimal data
5. Check Supabase dashboard for auth users

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: [Your Name]
