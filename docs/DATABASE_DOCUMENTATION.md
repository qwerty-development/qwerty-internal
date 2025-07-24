# Database Documentation

## Overview

This document provides a comprehensive overview of the business management system database. The system manages clients, quotations, invoices, receipts, tickets, and user accounts with a focus on streamlining the quotation-to-invoice workflow.

## Database Schema

### Table: `users`

**Purpose**: User authentication and authorization system (Supabase Auth)

**Primary Key**: `id` (UUID)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique user identifier
- `role` (text, NOT NULL, DEFAULT 'client') - User role: 'admin' or 'client'
- `name` (text, NOT NULL) - User's full name
- `phone` (text, UNIQUE) - User's phone number (unique constraint)
- `avatar_url` (text) - URL to user's profile picture
- `created_at` (timestamp with time zone, DEFAULT now()) - Account creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Additional Supabase Auth Fields**:

- Standard authentication fields (email, password, tokens, etc.)
- Email confirmation, password recovery, and session management fields

**Constraints**:

- `users_phone_key` (UNIQUE) on `phone` column
- `profiles_id_fkey` (FOREIGN KEY) linking to profiles table

**Business Rules**:

- Default role is 'client'
- Phone numbers must be unique across all users
- Users can be either 'admin' or 'client' role

---

### Table: `clients`

**Purpose**: Business client management and financial tracking

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique client identifier
- `user_id` (UUID, FOREIGN KEY) - Links to users table (optional - client may not have user account)
- `name` (text, NOT NULL, UNIQUE) - Client business name (must be unique)
- `contact_email` (text) - Client's email address
- `contact_phone` (text) - Client's phone number
- `address` (text) - Client's physical address
- `regular_balance` (numeric, DEFAULT 0) - Client's outstanding balance
- `paid_amount` (numeric, DEFAULT 0) - Total amount paid by client
- `notes` (text) - Additional client information
- `created_at` (timestamp with time zone, DEFAULT now()) - Client creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Constraints**:

- `clients_pkey` (PRIMARY KEY) on `id`
- `clients_user_id_fkey` (FOREIGN KEY) on `user_id` → `users.id`
- `clients_name_key` (UNIQUE) on `name`

**Business Rules**:

- Client names must be unique across the system
- Clients can exist without associated user accounts
- Financial balances default to 0
- Timestamps are automatically managed

---

### Table: `quotations`

**Purpose**: Pre-invoice proposals that can be converted to clients and invoices upon approval

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique quotation identifier
- `client_id` (UUID, FOREIGN KEY) - Links to existing client (optional - can create new client from quotation)
- `quotation_number` (text, NOT NULL, UNIQUE) - Unique quotation reference number
- `issue_date` (date, NOT NULL) - Date quotation was issued
- `due_date` (date) - Date quotation expires (optional)
- `description` (text, NOT NULL) - Detailed description of services/products
- `total_amount` (numeric, NOT NULL) - Total quotation amount
- `status` (text, DEFAULT 'Draft') - Quotation status: 'Draft', 'Sent', 'Approved', 'Rejected'
- `pdf_url` (text) - URL to generated PDF quotation
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who created the quotation
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Denormalized Client Data** (for historical preservation):

- `client_name` (text) - Client name at time of quotation
- `client_email` (text) - Client email at time of quotation
- `client_phone` (text) - Client phone at time of quotation

**Approval Workflow Fields**:

- `approved_at` (timestamp with time zone) - When quotation was approved
- `rejected_at` (timestamp with time zone) - When quotation was rejected
- `converted_to_invoice_id` (UUID, FOREIGN KEY) - Links to invoice if converted
- `is_converted` (boolean, DEFAULT false) - Whether quotation has been converted

**Constraints**:

- `quotations_pkey` (PRIMARY KEY) on `id`
- `quotations_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id`
- `quotations_quotation_number_key` (UNIQUE) on `quotation_number`
- `quotations_created_by_fkey` (FOREIGN KEY) on `created_by` → `users.id`
- `quotations_converted_to_invoice_id_fkey` (FOREIGN KEY) on `converted_to_invoice_id` → `invoices.id`

**Business Rules**:

- Quotation numbers must be unique
- Can be created with or without existing client
- Denormalized client data preserves historical information
- Approval workflow tracks approval/rejection timestamps
- Conversion process creates both client and invoice

---

### Table: `invoices`

**Purpose**: Official billing documents generated from quotations or created manually

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique invoice identifier
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to client
- `quotation_id` (UUID, FOREIGN KEY) - Links to source quotation (optional)
- `invoice_number` (text, NOT NULL, UNIQUE) - Unique invoice reference number
- `issue_date` (date, NOT NULL) - Date invoice was issued
- `due_date` (date, NOT NULL) - Date payment is due
- `description` (text, NOT NULL) - Detailed description of services/products
- `total_amount` (numeric, NOT NULL) - Total invoice amount
- `amount_paid` (numeric, DEFAULT 0) - Amount paid to date
- `balance_due` (numeric, NOT NULL) - Outstanding balance (calculated: total_amount - amount_paid)
- `status` (text, DEFAULT 'Unpaid') - Invoice status: 'Unpaid', 'Partially Paid', 'Paid'
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who created the invoice
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Constraints**:

- `invoices_pkey` (PRIMARY KEY) on `id`
- `invoices_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id`
- `invoices_quotation_id_fkey` (FOREIGN KEY) on `quotation_id` → `quotations.id`
- `invoices_invoice_number_key` (UNIQUE) on `invoice_number`
- `invoices_created_by_fkey` (FOREIGN KEY) on `created_by` → `users.id`

**Business Rules**:

- Invoice numbers must be unique
- Can be created from quotations or manually
- Balance due is calculated as total_amount - amount_paid
- Status updates based on payment amounts
- All invoices must have a client

---

### Table: `receipts`

**Purpose**: Payment tracking and documentation

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique receipt identifier
- `invoice_id` (UUID, NOT NULL, FOREIGN KEY) - Links to invoice being paid
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to client making payment
- `receipt_number` (text, NOT NULL, UNIQUE) - Unique receipt reference number
- `payment_date` (date, NOT NULL) - Date payment was received
- `amount` (numeric, NOT NULL) - Payment amount
- `payment_method` (text, NOT NULL) - Method of payment (cash, card, bank transfer, etc.)
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who recorded the payment
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Constraints**:

- `receipts_pkey` (PRIMARY KEY) on `id`
- `receipts_invoice_id_fkey` (FOREIGN KEY) on `invoice_id` → `invoices.id`
- `receipts_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id`
- `receipts_receipt_number_key` (UNIQUE) on `receipt_number`
- `receipts_created_by_fkey` (FOREIGN KEY) on `created_by` → `users.id`

**Business Rules**:

- Receipt numbers must be unique
- Each receipt is linked to a specific invoice
- Payment amounts update invoice amount_paid and balance_due
- Multiple receipts can be created for a single invoice

---

### Table: `tickets`

**Purpose**: Customer support and issue tracking system

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique ticket identifier
- `title` (text) - Ticket title/summary
- `description` (text) - Detailed description of the issue
- `status` (text, DEFAULT 'pending') - Ticket status: 'pending', 'in_progress', 'resolved', 'closed'
- `page` (text) - Page/feature where ticket was created
- `file_url` (text) - URL to attached file/document
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to client who created the ticket
- `viewed` (boolean, NOT NULL, DEFAULT false) - Whether admin has viewed the ticket
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp

**Constraints**:

- `tickets_pkey` (PRIMARY KEY) on `id`
- `tickets_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id`

**Business Rules**:

- All tickets must be associated with a client
- Viewed status helps track admin response times
- Status workflow: pending → in_progress → resolved → closed
- File attachments supported for documentation

---

### Table: `updates`

**Purpose**: System notifications and ticket updates

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique update identifier
- `title` (text) - Update title
- `content` (text) - Update content/details
- `update_type` (USER-DEFINED enum, NOT NULL) - Type of update
- `ticket_id` (UUID, FOREIGN KEY) - Links to ticket (optional)
- `client_id` (UUID, FOREIGN KEY) - Links to client (optional)
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp

**Constraints**:

- `updates_pkey` (PRIMARY KEY) on `id`
- `updates_ticket_id_fkey` (FOREIGN KEY) on `ticket_id` → `tickets.id`
- `updates_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id`

**Business Rules**:

- Updates can be linked to tickets or clients
- Update type is a custom enum (values to be defined)
- Used for notifications and communication tracking

---

## Key Relationships

### One-to-Many Relationships

1. **User → Clients**: One user can have multiple clients (via user_id)
2. **User → Quotations**: One user can create multiple quotations (via created_by)
3. **User → Invoices**: One user can create multiple invoices (via created_by)
4. **User → Receipts**: One user can record multiple receipts (via created_by)
5. **Client → Invoices**: One client can have multiple invoices
6. **Client → Tickets**: One client can create multiple tickets
7. **Client → Updates**: One client can have multiple updates
8. **Invoice → Receipts**: One invoice can have multiple receipts
9. **Ticket → Updates**: One ticket can have multiple updates

### Optional Relationships

1. **Quotation → Client**: Quotation can reference existing client or create new one
2. **Quotation → Invoice**: Quotation can be converted to invoice
3. **Update → Ticket**: Update can be linked to specific ticket
4. **Update → Client**: Update can be linked to specific client

## Business Workflows

### Quotation-to-Invoice Workflow

1. **Quotation Creation**: Admin creates quotation with client and invoice details
2. **Quotation Review**: Client reviews quotation
3. **Approval Process**: Client approves quotation (sets approved_at timestamp)
4. **Auto-Generation**: System automatically creates:
   - New client record (if client_id is null)
   - New invoice record (linked to quotation)
   - Sets is_converted = true
   - Sets converted_to_invoice_id

### Payment Processing Workflow

1. **Invoice Creation**: Invoice created manually or from quotation
2. **Payment Recording**: Admin creates receipt for payment
3. **Balance Updates**: System updates:
   - Invoice amount_paid and balance_due
   - Client paid_amount and regular_balance
4. **Status Updates**: Invoice status updated based on payment amounts

### Support Ticket Workflow

1. **Ticket Creation**: Client creates support ticket
2. **Admin Review**: Admin views ticket (sets viewed = true)
3. **Status Updates**: Admin updates ticket status through workflow
4. **Communication**: Updates linked to tickets for communication tracking

## Data Integrity Rules

### Financial Calculations

- `balance_due = total_amount - amount_paid` (for invoices)
- `regular_balance` should reflect sum of unpaid invoice balances
- `paid_amount` should reflect sum of all receipt amounts

### Status Management

- Invoice status: 'Unpaid' → 'Partially Paid' → 'Paid'
- Quotation status: 'Draft' → 'Sent' → 'Approved'/'Rejected'
- Ticket status: 'pending' → 'in_progress' → 'resolved' → 'closed'

### Unique Constraints

- Client names must be unique
- Invoice numbers must be unique
- Quotation numbers must be unique
- Receipt numbers must be unique
- User phone numbers must be unique

## Common Query Patterns

### Get Client with Financial Summary

```sql
SELECT
    c.*,
    COUNT(i.id) as invoice_count,
    SUM(i.total_amount) as total_invoiced,
    SUM(i.amount_paid) as total_paid,
    SUM(i.balance_due) as total_outstanding
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
GROUP BY c.id;
```

### Get Invoice with Payment History

```sql
SELECT
    i.*,
    c.name as client_name,
    COUNT(r.id) as receipt_count,
    SUM(r.amount) as total_received
FROM invoices i
JOIN clients c ON i.client_id = c.id
LEFT JOIN receipts r ON i.id = r.invoice_id
GROUP BY i.id, c.name;
```

### Get Quotation Conversion Status

```sql
SELECT
    q.*,
    c.name as client_name,
    i.invoice_number as converted_invoice_number
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
LEFT JOIN invoices i ON q.converted_to_invoice_id = i.id;
```

## Future Enhancements

### Planned Quotation System

The system is being enhanced to support comprehensive quotation management:

- Quotations will capture complete client information
- Quotations will capture complete invoice information
- Approval workflow will auto-generate both clients and invoices
- Database modifications will be made to support this enhanced workflow

### Potential Additions

- Product/Service catalog
- Tax calculations
- Multi-currency support
- Recurring invoices
- Payment gateway integration
- Email notification system
- Document generation (PDFs)
- Reporting and analytics

---

## Version History

- **Current Version**: 1.0
- **Last Updated**: [Date]
- **Changes**: Initial documentation created

---

_This documentation serves as the authoritative reference for all database-related development and should be updated whenever schema changes are made._
