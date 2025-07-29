# Database Documentation

## Overview

This document provides a comprehensive and accurate overview of the business management system's database schema. It is generated directly from a live database query and serves as the single source of truth for the project.

The system manages clients, branding, quotations, invoices, receipts, and tickets, with a focus on a streamlined quotation-to-invoice workflow and customizable document generation.

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
- `company_name` (text, NOT NULL, UNIQUE) - Main company name (previously "name").
- `company_email` (text) - Main company email address (previously "contact_email").
- `contact_person_name` (text) - Name of the primary contact person.
- `contact_person_email` (text) - Email of the primary contact person.
- `contact_phone` (text) - Client's phone number.
- `address` (text) - Client's physical address.
- `mof_number` (text) - MOF (Ministry of Finance) registration number.
- `regular_balance` (numeric, DEFAULT 0) - Client's outstanding balance.
- `paid_amount` (numeric, DEFAULT 0) - Total amount paid by client.
- `notes` (text) - Additional client information.
- `created_at` (timestamp with time zone, DEFAULT now()) - Client creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `clients_pkey` (PRIMARY KEY) on `id`.
- `clients_user_id_fkey` (FOREIGN KEY) on `user_id` → `users.id` **ON DELETE SET NULL**.
- `clients_company_name_key` (UNIQUE) on `company_name`.

**Business Rules**:

- Company names must be unique.
- If a linked user is deleted, the `user_id` for that client will be set to `NULL`.

---

### Table: `branding_settings`

**Purpose**: Stores company branding information for use in generated documents like PDFs.

**Primary Key**: `id` (UUID)

**Columns**:

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique identifier for the settings record.
- `company_name` (text, NOT NULL, DEFAULT 'QWERTY') - The name of the company.
- `company_address` (text) - The physical address of the company.
- `company_phone` (text) - The contact phone number for the company.
- `company_email` (text) - The contact email for the company.
- `company_website` (text) - The company's website URL.
- `primary_color` (text, NOT NULL, DEFAULT '#01303F') - Primary branding color hex code.
- `secondary_color` (text, DEFAULT '#014a5f') - Secondary branding color hex code.
- `accent_color` (text, DEFAULT '#059669') - Accent branding color hex code.
- `font_family` (text, DEFAULT 'Arial, sans-serif') - The font family to be used.
- `logo_url` (text) - A URL to the company's logo image.
- `footer_text` (text, DEFAULT 'Thank you for your business!') - Default footer text for documents.
- `created_at` (timestamp with time zone, DEFAULT now()) - Record creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.

**Constraints**:

- `branding_settings_pkey` (PRIMARY KEY) on `id`.

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

- `id` (UUID, NOT NULL, PRIMARY KEY) - Unique quotation identifier.
- `client_id` (UUID, FOREIGN KEY) - Links to the `clients` table.
- `quotation_number` (text, NOT NULL, UNIQUE) - Unique quotation reference number.
- `issue_date` (date, NOT NULL) - Date quotation was issued.
- `due_date` (date) - Date quotation expires.
- `description` (text, NOT NULL) - Detailed description of services/products.
- `total_amount` (numeric, NOT NULL) - Total quotation amount.
- `status` (text, DEFAULT 'Draft') - Quotation status.
- `pdf_url` (text) - URL to generated PDF document.
- `uses_items` (boolean, DEFAULT false) - Whether quotation uses the item-based system.
- `created_by` (UUID, NOT NULL, FOREIGN KEY) - User who created the quotation.
- `created_at` (timestamp with time zone, DEFAULT now()) - Creation timestamp.
- `updated_at` (timestamp with time zone, DEFAULT now()) - Last update timestamp.
- `terms_and_conditions` (text) - Terms and conditions for the quotation.
- `company_name` (text) - Company name from quotation (matches clients.company_name).
- `company_email` (text) - Company email from quotation (matches clients.company_email).
- `contact_person_name` (text) - Contact person name from quotation.
- `contact_person_email` (text) - Contact person email from quotation.
- `contact_phone` (text) - Contact phone number from quotation.
- `mof_number` (text) - MOF number from quotation.
- `address` (text) - Address from quotation.
- `notes` (text) - Notes from quotation.
- `quotation_issue_date` (date, NOT NULL) - Quotation issue date.
- `quotation_due_date` (date) - Quotation due date.
- `approved_at` (timestamp with time zone) - When quotation was approved.
- `rejected_at` (timestamp with time zone) - When quotation was rejected.
- `converted_to_invoice_id` (UUID, FOREIGN KEY) - Links to converted invoice.
- `is_converted` (boolean, DEFAULT false) - Whether quotation was converted to invoice.

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
- `tickets_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE CASCADE**.

**Business Rules**:

- The `status` workflow ('pending', 'in_progress', 'resolved', 'closed') is an application-level convention and is **not** enforced by a database `CHECK` constraint.
- If a client is deleted, all of their associated tickets will be automatically deleted.

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
- `updates_client_id_fkey` (FOREIGN KEY) on `client_id` → `clients.id` **ON DELETE CASCADE**.

---

## Version History

- **Current Version**: 6.0
- **Last Updated**: 2025-01-27
- **Changes**:

  - **`clients` Table**: Restructured to use Company Name as main identifier instead of Client Name. Renamed `name` to `company_name` and `contact_email` to `company_email`. Added new fields: `contact_person_name`, `contact_person_email`, and `mof_number`.
  - **`quotations` Table**: Added `terms_and_conditions` field and new client-related fields to match the updated client structure: `company_name`, `company_email`, `contact_person_name`, `contact_person_email`, and `mof_number`. Kept existing `client_*` fields for backward compatibility but marked as deprecated.
  - **Database Migration**: Created migration script to handle schema changes while preserving existing data.
  - **General**: Updated documentation to reflect new schema structure and maintain backward compatibility during transition period.

- **Previous Version**: 5.0
- **Last Updated**: 2025-07-29
- **Changes**:
  - **New Table**: Added `branding_settings` to manage company branding for documents.
  - **`clients` Table**: Added optional `company_name` and `company_email` fields.
  - **Data Integrity**: Updated foreign key constraints for `tickets` and `updates` to use `ON DELETE CASCADE` where appropriate, ensuring that deleting a client also removes their related tickets and updates.
  - **General**: Synchronized the entire document with the live database schema to serve as the definitive source of truth.

---

_This documentation serves as the authoritative reference for all database-related development and should be updated whenever schema changes are made._
