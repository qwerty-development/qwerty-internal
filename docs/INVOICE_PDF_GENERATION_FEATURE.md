# Invoice PDF Generation Feature

## Overview

The Invoice PDF generation feature allows users to generate professional PDF documents from invoices in the admin panel. This feature includes comprehensive invoice details, payment history, and client information, making it perfect for billing and record-keeping purposes.

## Features

- **Professional Invoice Layout**: Clean, professional design with company branding
- **Complete Invoice Data**: Includes all invoice details, client information, and line items
- **Payment History**: Shows complete payment history with receipts and payment methods
- **Item-based Support**: Supports both legacy and item-based invoice systems
- **Multi-page Support**: Automatically handles content that spans multiple pages
- **Status Indicators**: Shows invoice status with color-coded badges
- **Payment Summary**: Clear breakdown of total, paid, and balance amounts
- **High Quality**: Generates high-resolution PDFs suitable for printing

## How to Use

### From Invoice Detail Page

1. Navigate to an invoice detail page (`/admin/invoices/[id]`)
2. Click the "Generate PDF" button in the header section
3. The PDF will be automatically downloaded with the filename `invoice-[INVOICE_NUMBER].pdf`

### From Invoices List Page

1. Navigate to the invoices list page (`/admin/invoices`)
2. Click the "PDF" button in the actions column for any invoice
3. The PDF will be automatically downloaded

## Technical Implementation

### API Endpoint

- **URL**: `/api/invoices/[id]/pdf`
- **Method**: GET
- **Authentication**: Required
- **Response**: JSON with HTML content and invoice data

### Client-side Utility

The PDF generation is handled by the `generateInvoicePDF` function in `src/utils/pdfGenerator.ts`:

```typescript
import { generateInvoicePDF } from "@/utils/pdfGenerator";

// Generate PDF for an invoice
await generateInvoicePDF(invoiceId);
```

### PDF Template

The PDF template is generated server-side in `src/app/api/invoices/[id]/pdf/route.ts` and includes:

- Company header and branding
- Client billing information
- Invoice details (dates, status, amounts)
- Line items table (for item-based invoices)
- Payment summary (total, paid, balance)
- Complete payment history with receipts
- Description section
- Professional footer

## Dependencies

- **jsPDF**: For PDF generation
- **html2canvas**: For converting HTML to canvas
- **Next.js 15**: For API routes and server-side rendering

## File Structure

```
src/
├── app/
│   └── api/
│       └── invoices/
│           └── [id]/
│               └── pdf/
│                   └── route.ts          # PDF generation API
├── utils/
│   └── pdfGenerator.ts                   # Client-side PDF utilities
├── types/
│   └── pdf.ts                           # TypeScript types
└── app/
    └── admin/
        └── invoices/
            ├── page.tsx                  # List page with PDF buttons
            └── [id]/
                └── page.tsx              # Detail page with PDF button
```

## PDF Content Structure

### Header Section

- Company name and branding
- Document type (INVOICE)
- Invoice number

### Client Information

- Client name
- Contact email
- Phone number
- Address

### Invoice Details

- Invoice number
- Issue date
- Due date
- Status (with color-coded badge)
- Total amount

### Items Section (if applicable)

- Itemized list with descriptions
- Individual prices
- Total calculation

### Payment Summary

- Total amount
- Amount paid
- Balance due
- Visual indicators for paid/unpaid amounts

### Payment History

- Complete list of receipts
- Payment dates
- Payment amounts
- Payment methods
- Receipt numbers

### Description Section

- Invoice description
- Additional notes

## Status Indicators

The PDF includes color-coded status badges:

- **Paid**: Green background (`#d1fae5`) with dark green text (`#065f46`)
- **Partially Paid**: Yellow background (`#fef3c7`) with dark yellow text (`#92400e`)
- **Unpaid**: Red background (`#fee2e2`) with dark red text (`#991b1b`)

## Payment History Features

### Complete Payment Tracking

- All receipts for the invoice
- Payment dates and amounts
- Payment methods used
- Receipt numbers for reference

### Payment Summary

- Clear breakdown of financial status
- Visual indicators for paid vs. outstanding amounts
- Running totals and balances

## Customization

### Company Branding

To customize the company branding, edit the `generateInvoicePDF` function in `src/app/api/invoices/[id]/pdf/route.ts`:

```typescript
// Change company name
<div class="company-name">Your Company Name</div>

// Change colors
.company-name { color: #059669; }
```

### Color Themes

**Current Green Theme** (`#059669`):

```css
.company-name {
  color: #059669;
}
.section-title {
  color: #059669;
}
.item-number {
  color: #059669;
}
.description {
  border-left: 4px solid #059669;
}
```

**Alternative Themes**:

- **Blue**: `#2563eb`
- **Purple**: `#7c3aed`
- **Red**: `#dc2626`
- **Gray**: `#374151`

## Error Handling

The feature includes comprehensive error handling:

- **Authentication errors**: Returns 401 for unauthenticated requests
- **Invoice not found**: Returns 404 for invalid invoice IDs
- **Client not found**: Returns 404 for missing client data
- **PDF generation errors**: Shows user-friendly error messages
- **Network errors**: Handles fetch failures gracefully

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Performance Considerations

- **Large invoices**: May take a few seconds to generate
- **Payment history**: Handles multiple receipts efficiently
- **Memory usage**: Temporary DOM elements are cleaned up automatically
- **File size**: PDFs are optimized for reasonable file sizes

## Security Considerations

- **Authentication**: All PDF generation requires authentication
- **Data validation**: Server-side validation of invoice data
- **XSS Prevention**: HTML content is sanitized
- **File access**: Only authorized users can generate PDFs

## Business Use Cases

### For Accounting

- Generate PDFs for client billing
- Create records for tax purposes
- Maintain audit trails with payment history

### For Client Communication

- Send professional invoices to clients
- Include complete payment history
- Provide clear payment status

### For Record Keeping

- Archive invoice data with all details
- Maintain payment history records
- Create backup documentation

## Future Enhancements

Potential improvements for the future:

1. **Email Integration**: Send PDFs directly via email
2. **Template Customization**: Allow users to customize PDF templates
3. **Batch Generation**: Generate multiple PDFs at once
4. **Cloud Storage**: Store PDFs in cloud storage for later access
5. **Digital Signatures**: Add digital signature capabilities
6. **Watermarks**: Add watermarks for draft invoices
7. **Multi-language Support**: Support for multiple languages
8. **Tax Calculations**: Include tax calculations in PDFs
9. **Payment Terms**: Add payment terms and conditions
10. **QR Codes**: Add QR codes for easy payment access

## Troubleshooting

### Common Issues

1. **PDF not downloading**: Check browser download settings
2. **Blank PDF**: Ensure invoice has data and items
3. **Slow generation**: Large invoices with many payments may take longer
4. **Authentication errors**: Ensure user is logged in
5. **Missing payment history**: Check if receipts exist for the invoice

### Debug Mode

Enable console logging to debug PDF generation:

```typescript
// In pdfGenerator.ts
console.log("PDF generation started");
console.log("HTML content length:", data.pdfHtml.length);
```

## Comparison with Quotation PDFs

| Feature             | Invoice PDF | Quotation PDF     |
| ------------------- | ----------- | ----------------- |
| Payment History     | ✅ Complete | ❌ Not applicable |
| Payment Summary     | ✅ Yes      | ❌ Not applicable |
| Status Indicators   | ✅ Yes      | ✅ Yes            |
| Item Details        | ✅ Yes      | ✅ Yes            |
| Client Information  | ✅ Yes      | ✅ Yes            |
| Professional Layout | ✅ Yes      | ✅ Yes            |
| Multi-page Support  | ✅ Yes      | ✅ Yes            |

## Testing Checklist

- [ ] Generate PDF from invoice detail page
- [ ] Generate PDF from invoices list page
- [ ] Test with item-based invoices
- [ ] Test with legacy invoices
- [ ] Test with different payment statuses
- [ ] Test with multiple payments
- [ ] Test with no payments
- [ ] Test error handling
- [ ] Test loading states
- [ ] Verify file naming convention
