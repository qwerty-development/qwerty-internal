# Database Documentation

## Overview

This document provides a comprehensive overview of the business management system database. The system manages clients, quotations, invoices, receipts, tickets, and user accounts with a focus on streamlining the quotation-to-invoice workflow. The system now supports both legacy and modern item-based systems for both quotations and invoices, with auto-calculated totals and comprehensive client data capture for quotation-to-client-invoice conversion workflow.

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

### Table: `invoices`

**Purpose**: Official billing documents generated from quotations or created manually, supporting both legacy and modern item-based systems

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique invoice identifier
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to client
- `quotation_id` (UUID, FOREIGN KEY) - Links to source quotation (optional)
- `invoice_number` (text, NOT NULL, UNIQUE) - Unique invoice reference number
- `issue_date` (date, NOT NULL) - Date invoice was issued
- `due_date` (date, NOT NULL) - Date payment is due
- `description` (text, NOT NULL) - Detailed description of services/products
- `total_amount` (numeric, NOT NULL) - Total invoice amount (auto-calculated for item-based invoices)
- `amount_paid` (numeric, DEFAULT 0) - Amount paid to date
- `balance_due` (numeric, NOT NULL) - Outstanding balance (calculated: total_amount - amount_paid)
- `status` (text, DEFAULT 'Unpaid') - Invoice status: 'Unpaid', 'Partially Paid', 'Paid'
- `uses_items` (boolean, DEFAULT false) - Whether invoice uses the new item-based system
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
- Item-based invoices have total_amount auto-calculated from invoice_items
- Legacy invoices maintain manual total_amount entry

---

### Table: `invoice_items`

**Purpose**: Individual line items for item-based invoices, enabling detailed breakdown of services/products

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique item identifier
- `invoice_id` (UUID, NOT NULL, FOREIGN KEY) - Links to parent invoice
- `position` (integer, NOT NULL) - Sequential position of item in invoice (1, 2, 3...)
- `title` (text, NOT NULL) - Item title/name
- `description` (text) - Optional item description
- `price` (numeric, NOT NULL, DEFAULT 0) - Item price
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Constraints**:

- `invoice_items_pkey` (PRIMARY KEY) on `id`
- `invoice_items_invoice_id_fkey` (FOREIGN KEY) on `invoice_id` → `invoices.id` ON DELETE CASCADE
- `unique_invoice_position` (UNIQUE) on `(invoice_id, position)`
- `idx_invoice_items_invoice_id` (INDEX) on `invoice_id`
- `idx_invoice_items_position` (INDEX) on `(invoice_id, position)`

**Business Rules**:

- Each item must belong to an invoice
- Position must be unique within each invoice
- Items are automatically deleted when parent invoice is deleted
- Price can be zero (for free items)
- Title is required, description is optional
- Items are ordered by position for display

---

### Table: `quotations`

**Purpose**: Pre-invoice proposals that can be converted to clients and invoices upon approval, supporting both legacy and item-based systems

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique quotation identifier
- `client_id` (UUID, FOREIGN KEY) - Links to existing client (optional - can create new client from quotation)
- `quotation_number` (text, NOT NULL, UNIQUE) - Unique quotation reference number
- `issue_date` (date, NOT NULL) - Date quotation was issued
- `due_date` (date) - Date quotation expires (optional)
- `description` (text, NOT NULL) - Detailed description of services/products
- `total_amount` (numeric, NOT NULL) - Total quotation amount (auto-calculated for item-based quotations)
- `status` (text, DEFAULT 'Draft') - Quotation status: 'Draft', 'Sent', 'Approved', 'Rejected'
- `pdf_url` (text) - URL to generated PDF quotation
- `uses_items` (boolean, DEFAULT false) - Whether quotation uses the new item-based system
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who created the quotation
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Comprehensive Client Data** (for auto-generation of clients):

- `client_name` (text) - Client name for quotation/client creation
- `client_email` (text) - Client email (legacy field)
- `client_phone` (text) - Client phone (legacy field)
- `client_contact_email` (text) - Client contact email (new normalized field)
- `client_contact_phone` (text) - Client contact phone (new normalized field)
- `client_address` (text) - Client physical address
- `client_notes` (text) - Additional client information

**Invoice Data** (for auto-generation of invoices):

- `quotation_issue_date` (date, NOT NULL) - Issue date for generated invoice
- `quotation_due_date` (date) - Due date for generated invoice

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
- Comprehensive client data enables automatic client creation
- Invoice data enables automatic invoice creation
- Item-based quotations have total_amount auto-calculated from quotation_items
- Legacy quotations maintain manual total_amount entry
- Approval workflow tracks approval/rejection timestamps
- Conversion process creates both client and invoice with all captured data

---

### Table: `quotation_items`

**Purpose**: Individual line items for item-based quotations, enabling detailed breakdown of services/products

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique item identifier
- `quotation_id` (UUID, NOT NULL, FOREIGN KEY) - Links to parent quotation
- `position` (integer, NOT NULL) - Sequential position of item in quotation (1, 2, 3...)
- `title` (text, NOT NULL) - Item title/name
- `description` (text) - Optional item description
- `price` (numeric, NOT NULL, DEFAULT 0) - Item price
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp

**Constraints**:

- `quotation_items_pkey` (PRIMARY KEY) on `id`
- `quotation_items_quotation_id_fkey` (FOREIGN KEY) on `quotation_id` → `quotations.id` ON DELETE CASCADE
- `quotation_items_quotation_id_position_key` (UNIQUE) on `(quotation_id, position)`

**Business Rules**:

- Each item must belong to a quotation
- Position must be unique within each quotation
- Items are automatically deleted when parent quotation is deleted
- Price can be zero (for free items)
- Title is required, description is optional
- Items are ordered by position for display

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

## Database Functions and Triggers

### Invoice Total Calculation

**Function**: `calculate_invoice_total()`

**Purpose**: Automatically calculates and updates invoice total_amount when items are modified

**Triggers**:

- `trigger_calculate_invoice_total_insert` - Fires after INSERT on invoice_items
- `trigger_calculate_invoice_total_update` - Fires after UPDATE on invoice_items
- `trigger_calculate_invoice_total_delete` - Fires after DELETE on invoice_items

**Behavior**: Updates the parent invoice's total_amount to the sum of all associated item prices

### Invoice Items Validation

**Function**: `validate_invoice_has_items()`

**Purpose**: Ensures item-based invoices have at least one item

**Trigger**: `trigger_validate_invoice_items` - Fires before UPDATE on invoices

**Behavior**: Raises exception if invoice uses items system but has no items

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
8. **Quotation → Quotation Items**: One quotation can have multiple items (for item-based quotations)
9. **Invoice → Invoice Items**: One invoice can have multiple items (for item-based invoices)
10. **Invoice → Receipts**: One invoice can have multiple receipts
11. **Ticket → Updates**: One ticket can have multiple updates

### Optional Relationships

1. **Quotation → Client**: Quotation can reference existing client or create new one
2. **Quotation → Invoice**: Quotation can be converted to invoice
3. **Update → Ticket**: Update can be linked to specific ticket
4. **Update → Client**: Update can be linked to specific client

---

## Business Workflows

### Invoice Creation Workflow

#### Legacy Invoice Creation

1. **Manual Entry**: Admin enters client, dates, description, and total amount
2. **Invoice Creation**: System creates invoice with manual total_amount
3. **Balance Update**: Client's regular_balance is updated

#### Item-Based Invoice Creation

1. **Item Entry**: Admin adds multiple items with titles, descriptions, and prices
2. **Auto-Calculation**: System calculates total from sum of item prices
3. **Invoice Creation**: System creates invoice with uses_items = true
4. **Items Storage**: All items stored in invoice_items table with sequential positions
5. **Balance Update**: Client's regular_balance is updated

### Enhanced Quotation-to-Invoice Workflow

1. **Quotation Creation**: Admin creates quotation with comprehensive client and invoice details
   - **Legacy Mode**: Manual total amount entry with basic client info
   - **Item-Based Mode**: Multiple items with auto-calculated total
2. **Client Data Capture**: System captures complete client information:
   - Basic: name, contact_email, contact_phone, address, notes
   - Invoice: quotation_issue_date, quotation_due_date
3. **Quotation Review**: Client reviews quotation with detailed breakdown
4. **Approval Process**: Client approves quotation (sets approved_at timestamp)
5. **Auto-Generation**: System automatically creates:
   - New client record with all captured data (if client_id is null)
   - New invoice record with items (for item-based) or description (for legacy)
   - Copies quotation items to invoice_items (if applicable)
   - Sets is_converted = true and converted_to_invoice_id

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

---

## Data Integrity Rules

### Financial Calculations

- `balance_due = total_amount - amount_paid` (for invoices)
- `total_amount = SUM(item_prices)` (for item-based invoices and quotations)
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
- Item positions must be unique within each invoice and quotation

### Validation Rules

- Item-based invoices and quotations must have at least one item
- Item titles are required, descriptions are optional
- Item prices must be non-negative
- Total amounts are auto-calculated for item-based invoices and quotations
- Quotation client data must be comprehensive for auto-generation workflow

---

## Common Query Patterns

### Get Invoice with Items and Payment Summary

```sql
SELECT
    i.*,
    c.name as client_name,
    COUNT(ii.id) as item_count,
    SUM(ii.price) as calculated_total,
    COUNT(r.id) as receipt_count,
    SUM(r.amount) as total_received
FROM invoices i
JOIN clients c ON i.client_id = c.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
LEFT JOIN receipts r ON i.id = r.invoice_id
GROUP BY i.id, c.name;
```

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

### Get Invoice Items with Details

```sql
SELECT
    ii.*,
    i.invoice_number,
    c.name as client_name
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN clients c ON i.client_id = c.id
WHERE ii.invoice_id = $1
ORDER BY ii.position;
```

### Get Quotation with Items and Conversion Status

```sql
SELECT
    q.*,
    c.name as client_name,
    i.invoice_number as converted_invoice_number,
    COUNT(qi.id) as item_count,
    SUM(qi.price) as calculated_total
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
LEFT JOIN invoices i ON q.converted_to_invoice_id = i.id
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
GROUP BY q.id, c.name, i.invoice_number;
```

### Get Quotation Items with Details

```sql
SELECT
    qi.*,
    q.quotation_number,
    q.client_name
FROM quotation_items qi
JOIN quotations q ON qi.quotation_id = q.id
WHERE qi.quotation_id = $1
ORDER BY qi.position;
```

---

## API Endpoints

### Invoice Management

- `POST /api/invoices` - Create new invoice (supports both legacy and item-based)
- `GET /api/invoices/[id]/items` - Fetch invoice items
- `POST /api/invoices/[id]/items` - Update invoice items (replaces all items)

### Payment Management

- `POST /api/receipts` - Create new payment receipt
- `GET /api/receipts` - List all receipts

### Client Management

- `POST /api/clients` - Create new client
- `GET /api/clients` - List all clients
- `PUT /api/clients/[id]` - Update client

---

## Frontend Components

### Invoice Creation

- **Legacy Mode**: Simple form with manual total amount entry
- **Item-Based Mode**: Dynamic form with add/remove items functionality
- **Auto-Calculation**: Real-time total calculation from items
- **Validation**: Comprehensive form validation for both modes

### Invoice Details

- **Conditional Display**: Shows items table only for item-based invoices
- **Item Breakdown**: Sequential numbering, titles, descriptions, prices
- **Total Summary**: Footer with calculated total
- **Payment Management**: Integrated payment recording and history

---

## Future Enhancements

### Planned Quotation System Enhancement

The quotation system is being enhanced to support comprehensive item-based management:

- Quotations will capture complete client information
- Quotations will capture complete invoice information with items
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
- Bulk operations
- Advanced search and filtering

---

## Version History

- **Current Version**: 3.0
- **Last Updated**: [Current Date]
- **Changes**:
  - **Major Enhancement**: Added quotation_items table for item-based quotations
  - **Enhanced Quotations**: Added comprehensive client data capture fields:
    - `client_contact_email`, `client_contact_phone`, `client_address`, `client_notes`
    - `quotation_issue_date`, `quotation_due_date` for invoice generation
    - `uses_items` flag for item-based quotation system
  - **Complete Quotation-to-Invoice Workflow**: System now supports full auto-generation of clients and invoices from quotations
  - **Enhanced Documentation**: Updated all business workflows, relationships, and query patterns
  - **Database Structure**: Now supports parallel item systems for both quotations and invoices

---

_This documentation serves as the authoritative reference for all database-related development and should be updated whenever schema changes are made._
