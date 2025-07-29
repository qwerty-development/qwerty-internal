# Database Documentation (Pre-PDF Implementation)

## Overview

This document provides a comprehensive and accurate overview of the business management system's database schema. It is generated directly from a live database query and serves as the single source of truth.

**Important Note**: This document represents the state of the database schema _before_ the implementation of PDF generation features. It should be used as the baseline for that development work.

The system manages clients, quotations, invoices, receipts, tickets, and user accounts, with a focus on a streamlined quotation-to-invoice workflow.

## Database Schema

### Table: `users`

**Purpose**: Stores public user profile information, linked to the Supabase Auth system.

**Primary Key**: `id` (UUID)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique user identifier, references `auth.users.id`.
- `role` (text, NOT NULL, DEFAULT 'client') - User role (e.g., 'admin' or 'client').
- `name` (text, NOT NULL) - User's full name.
- `phone` (text) - User's phone number.
- `avatar_url` (text) - URL to user's profile picture.
- `created_at` (timestamp with time zone, DEFAULT now()) - Account creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `users_pkey` (PRIMARY KEY) on `id`.
- `profiles_id_fkey` (FOREIGN KEY) on `id` → `auth.users.id` **ON DELETE CASCADE**.

**Business Rules**:

- This table is a public profile extension of the main Supabase `auth.users` table. Deleting a user in Supabase Auth will cascade and delete the corresponding profile here.
- There is **no** unique constraint on the `phone` number at the database level.

---

### Table: `clients`

**Purpose**: Business client management and financial tracking.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique client identifier.
- `user_id` (UUID, FOREIGN KEY) - Links to the `users` table.
- `name` (text, NOT NULL, UNIQUE) - Client business name.
- `contact_email` (text) - Client's email address.
- `contact_phone` (text) - Client's phone number.
- `address` (text) - Client's physical address.
- `company_name` (text) - Client's company name (optional).
- `company_email` (text) - Client's company email address (optional).
- `regular_balance` (numeric, DEFAULT 0) - Client's outstanding balance.
- `paid_amount` (numeric, DEFAULT 0) - Total amount paid by client.
- `notes` (text) - Additional client information.
- `created_at` (timestamp with time zone, DEFAULT now()) - Client creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `clients_pkey` (PRIMARY KEY) on `id`.
- `clients_user_id_fkey` (FOREIGN KEY) on `user_id` → `users.id` **ON DELETE SET NULL**.
- `clients_name_key` (UNIQUE) on `name`.

**Business Rules**:

- Client names must be unique.
- If a linked user is deleted, the `user_id` for that client will be set to `NULL`.

---

### Table: `invoices`

**Purpose**: Official billing documents, supporting both legacy and item-based systems.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique invoice identifier.
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to client.
- `quotation_id` (UUID, FOREIGN KEY) - Links to the source quotation.
- `invoice_number` (text, NOT NULL, UNIQUE) - Unique invoice reference number.
- `issue_date` (date, NOT NULL) - Date invoice was issued.
- `due_date` (date, NOT NULL) - Date payment is due.
- `description` (text, NOT NULL) - Detailed description of services/products.
- `total_amount` (numeric, NOT NULL) - Total invoice amount.
- `amount_paid` (numeric, DEFAULT 0) - Amount paid to date.
- `balance_due` (numeric, NOT NULL) - Outstanding balance.
- `status` (text, DEFAULT 'Unpaid') - Invoice status.
- `uses_items` (boolean, DEFAULT false) - Whether invoice uses the item-based system.
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who created the invoice.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `invoices_pkey` (PRIMARY KEY) on `id`.
- `invoices_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE CASCADE**.
- `invoices_quotation_id_fkey` (FOREIGN KEY) on `quotation_id` → `quotations.id` **ON DELETE SET NULL**.
- `invoices_invoice_number_key` (UNIQUE) on `invoice_number`.
- `invoices_created_by_fkey` (FOREIGN KEY) on `created_by` → `users.id` **ON DELETE NO ACTION**.

**Business Rules**:

- The `status` values ('Unpaid', 'Partially Paid', 'Paid') are an application-level convention and are **not** enforced by a database `CHECK` constraint.

---

### Table: `invoice_items`

**Purpose**: Individual line items for item-based invoices.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique item identifier.
- `invoice_id` (UUID, NOT NULL, FOREIGN KEY) - Links to the parent invoice.
- `position` (integer, NOT NULL) - Sequential position of the item in the invoice.
- `title` (text, NOT NULL) - Item title/name.
- `description` (text) - Optional item description.
- `price` (numeric, NOT NULL, DEFAULT 0) - Item price.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `invoice_items_pkey` (PRIMARY KEY) on `id`.
- `invoice_items_invoice_id_fkey` (FOREIGN KEY) on `invoice_id` → `invoices.id` **ON DELETE CASCADE**.
- `unique_invoice_position` (UNIQUE) on `(invoice_id, position)`.

**Business Rules**:

- Items are automatically deleted when their parent invoice is deleted.

---

### Table: `quotations`

**Purpose**: Pre-invoice proposals that can be converted to clients and invoices.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY)
- `client_id` (UUID, FOREIGN KEY)
- `quotation_number` (text, NOT NULL, UNIQUE)
- `issue_date` (date, NOT NULL)
- `due_date` (date)
- `description` (text, NOT NULL)
- `total_amount` (numeric, NOT NULL)
- `status` (text, DEFAULT 'Draft')
- `pdf_url` (text)
- `uses_items` (boolean, DEFAULT false)
- `created_by` (UUID, NOT NULL, FOREIGN KEY)
- `created_at` (timestamp with time zone, DEFAULT now())
- `updated_at` (timestamp with time zone, DEFAULT now())
- `client_name` (text)
- `client_email` (text)
- `client_phone` (text)
- `client_contact_email` (text)
- `client_contact_phone` (text)
- `client_address` (text)
- `client_notes` (text)
- `quotation_issue_date` (date, NOT NULL)
- `quotation_due_date` (date)
- `approved_at` (timestamp with time zone)
- `rejected_at` (timestamp with time zone)
- `converted_to_invoice_id` (UUID, FOREIGN KEY)
- `is_converted` (boolean, DEFAULT false)

**Constraints**:

- `quotations_pkey` (PRIMARY KEY) on `id`.
- `quotations_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE CASCADE**.
- `quotations_quotation_number_key` (UNIQUE) on `quotation_number`.
- `quotations_created_by_fkey` (FOREIGN KEY) on `created_by` → `users.id` **ON DELETE NO ACTION**.
- `quotations_converted_to_invoice_id_fkey` (FOREIGN KEY) on `converted_to_invoice_id` → `invoices.id` **ON DELETE NO ACTION**.
- `quotations_status_check` (CHECK) - Enforces that `status` must be one of: 'Draft', 'Sent', 'Approved', 'Rejected', 'Converted'.

---

### Table: `quotation_items`

**Purpose**: Individual line items for item-based quotations.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique item identifier.
- `quotation_id` (UUID, NOT NULL, FOREIGN KEY) - Links to the parent quotation.
- `position` (integer, NOT NULL) - Sequential position of the item.
- `title` (text, NOT NULL) - Item title/name.
- `description` (text) - Optional item description.
- `price` (numeric, NOT NULL, DEFAULT 0) - Item price.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `quotation_items_pkey` (PRIMARY KEY) on `id`.
- `quotation_items_quotation_id_fkey` (FOREIGN KEY) on `quotation_id` → `quotations.id` **ON DELETE CASCADE**.
- `quotation_items_quotation_id_position_key` (UNIQUE) on `(quotation_id, position)`.

---

### Table: `receipts`

**Purpose**: Payment tracking and documentation.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique receipt identifier.
- `invoice_id` (UUID, NOT NULL, FOREIGN KEY) - Links to the invoice being paid.
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to the client making the payment.
- `receipt_number` (text, NOT NULL, UNIQUE) - Unique receipt reference number.
- `payment_date` (date, NOT NULL) - Date payment was received.
- `amount` (numeric, NOT NULL) - Payment amount.
- `payment_method` (text, NOT NULL) - Method of payment.
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who recorded the payment.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `receipts_pkey` (PRIMARY KEY) on `id`.
- `receipts_invoice_id_fkey` (FOREIGN KEY) on `invoice_id` → `invoices.id` **ON DELETE CASCADE**.
- `receipts_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE CASCADE**.
- `receipts_receipt_number_key` (UNIQUE) on `receipt_number`.
- `receipts_created_by_fkey` (FOREIGN KEY) on `created_by` → `users.id` **ON DELETE NO ACTION**.

---

### Table: `tickets`

**Purpose**: Customer support and issue tracking system.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique ticket identifier.
- `title` (text) - Ticket title/summary.
- `description` (text) - Detailed description of the issue.
- `status` (text, DEFAULT 'pending') - Ticket status.
- `page` (text) - Page/feature where the ticket was created.
- `file_url` (text) - URL to an attached file/document.
- `client_id` (UUID, NOT NULL, FOREIGN KEY) - Links to the client who created the ticket.
- `viewed` (boolean, NOT NULL, DEFAULT false) - Whether an admin has viewed the ticket.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.

**Constraints**:

- `tickets_pkey` (PRIMARY KEY) on `id`.
- `tickets_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE NO ACTION**.

**Business Rules**:

- The `status` workflow ('pending', 'in_progress', 'resolved', 'closed') is an application-level convention and is **not** enforced by a database `CHECK` constraint.

---

### Table: `updates`

**Purpose**: System notifications and ticket updates.

**Primary Key**: `id` (UUID, auto-generated with `gen_random_uuid()`)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique update identifier.
- `title` (text) - Update title.
- `content` (text) - Update content/details.
- `update_type` (USER-DEFINED enum `update_type_enum`, NOT NULL) - The type of update.
- `ticket_id` (UUID, FOREIGN KEY) - Links to a ticket.
- `client_id` (UUID, FOREIGN KEY) - Links to a client.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.

**Constraints**:

- `updates_pkey` (PRIMARY KEY) on `id`.
- `updates_ticket_id_fkey` (FOREIGN KEY) on `ticket_id` → `tickets.id` **ON DELETE NO ACTION**.
- `updates_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE NO ACTION**.

---

## Version History

- **Current Version**: 4.1
- **Last Updated**: 2025-01-27
- **Changes**:
  - Added `company_name` and `company_email` fields to the `clients` table (optional fields).
  - Updated foreign key constraints for `tickets` and `updates` tables to use `ON DELETE CASCADE`.
  - Fixed client deletion system to properly handle all related data.
  - Complete schema synchronization based on a live database query. This version serves as the baseline before PDF feature implementation.
  - Corrected all foreign key `ON DELETE` actions (`CASCADE`, `SET NULL`, `NO ACTION`).
  - Corrected `users` table constraints to remove a non-existent unique constraint and accurately describe its link to `auth.users`.
  - Updated `quotations` table `CHECK` constraint to include all five valid statuses.
  - Clarified which `status` columns are enforced by the database versus by the application.

---

_This documentation serves as the authoritative reference for all database-related development and should be updated whenever schema changes are made._
