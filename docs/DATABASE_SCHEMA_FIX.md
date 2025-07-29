# Database Schema Fix for Client Deletion System

## Issue

The client deletion system is failing due to foreign key constraint violations in the `tickets` table.

## Problem

- `tickets.client_id` has `ON DELETE NO ACTION` constraint
- This prevents client deletion when tickets exist
- The current deletion order is incorrect

## Required Database Changes

### 1. Update Tickets Table Constraint

```sql
-- Drop the existing foreign key constraint
ALTER TABLE tickets
DROP CONSTRAINT tickets_client_id_fkey;

-- Add the new constraint with CASCADE
ALTER TABLE tickets
ADD CONSTRAINT tickets_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;
```

### 2. Update Updates Table Constraint (if needed)

```sql
-- Drop the existing foreign key constraint
ALTER TABLE updates
DROP CONSTRAINT updates_client_id_fkey;

-- Add the new constraint with CASCADE
ALTER TABLE updates
ADD CONSTRAINT updates_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;
```

## Alternative: Manual Deletion Order

If you prefer not to change the database schema, you need to modify the deletion order in the API:

1. Delete updates first (they reference tickets)
2. Delete tickets manually
3. Delete receipts (CASCADE will work)
4. Delete invoices (CASCADE will work)
5. Delete quotations (CASCADE will work)
6. Delete user record
7. Delete client record

## Recommended Approach

**Use Option 1** (database schema fix) as it's cleaner and more maintainable.
