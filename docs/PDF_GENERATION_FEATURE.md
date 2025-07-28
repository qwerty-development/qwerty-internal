# PDF Generation Feature

## Overview

The PDF generation feature allows users to generate professional PDF documents from quotations in the admin panel. This feature is built using jsPDF and html2canvas libraries to convert HTML content to PDF format.

## Features

- **Professional PDF Layout**: Clean, professional design with company branding
- **Complete Quotation Data**: Includes all quotation details, client information, and line items
- **Item-based Support**: Supports both legacy and item-based quotation systems
- **Multi-page Support**: Automatically handles content that spans multiple pages
- **Status Indicators**: Shows quotation status with color-coded badges
- **High Quality**: Generates high-resolution PDFs suitable for printing

## How to Use

### From Quotation Detail Page

1. Navigate to a quotation detail page (`/admin/quotations/[id]`)
2. Click the "Generate PDF" button in the header section
3. The PDF will be automatically downloaded with the filename `quotation-[QUOTATION_NUMBER].pdf`

### From Quotations List Page

1. Navigate to the quotations list page (`/admin/quotations`)
2. Click the "PDF" button in the actions column for any quotation
3. The PDF will be automatically downloaded

## Technical Implementation

### API Endpoint

- **URL**: `/api/quotations/[id]/pdf`
- **Method**: GET
- **Authentication**: Required
- **Response**: JSON with HTML content and quotation data

### Client-side Utility

The PDF generation is handled by the `generateQuotationPDF` function in `src/utils/pdfGenerator.ts`:

```typescript
import { generateQuotationPDF } from "@/utils/pdfGenerator";

// Generate PDF for a quotation
await generateQuotationPDF(quotationId);
```

### PDF Template

The PDF template is generated server-side in `src/app/api/quotations/[id]/pdf/route.ts` and includes:

- Company header and branding
- Client information section
- Quotation details (dates, status, total amount)
- Line items table (for item-based quotations)
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
│       └── quotations/
│           └── [id]/
│               └── pdf/
│                   └── route.ts          # PDF generation API
├── utils/
│   └── pdfGenerator.ts                   # Client-side PDF utilities
├── types/
│   └── pdf.ts                           # TypeScript types
└── app/
    └── admin/
        └── quotations/
            ├── page.tsx                  # List page with PDF buttons
            └── [id]/
                └── page.tsx              # Detail page with PDF button
```

## Customization

### Company Branding

To customize the company branding, edit the `generateQuotationPDF` function in `src/app/api/quotations/[id]/pdf/route.ts`:

```typescript
// Change company name
<div class="company-name">Your Company Name</div>

// Change colors
.company-name { color: #2563eb; }
```

### PDF Layout

The PDF layout can be customized by modifying the CSS styles in the HTML template:

- **Page size**: A4 (210mm x 297mm)
- **Margins**: 10mm on all sides
- **Font**: Arial, sans-serif
- **Colors**: Blue theme (#2563eb)

### File Naming

The PDF filename follows the pattern: `quotation-[QUOTATION_NUMBER].pdf`

## Error Handling

The feature includes comprehensive error handling:

- **Authentication errors**: Returns 401 for unauthenticated requests
- **Quotation not found**: Returns 404 for invalid quotation IDs
- **PDF generation errors**: Shows user-friendly error messages
- **Network errors**: Handles fetch failures gracefully

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Performance Considerations

- **Large quotations**: May take a few seconds to generate
- **Memory usage**: Temporary DOM elements are cleaned up automatically
- **File size**: PDFs are optimized for reasonable file sizes

## Future Enhancements

Potential improvements for the future:

1. **Email Integration**: Send PDFs directly via email
2. **Template Customization**: Allow users to customize PDF templates
3. **Batch Generation**: Generate multiple PDFs at once
4. **Cloud Storage**: Store PDFs in cloud storage for later access
5. **Digital Signatures**: Add digital signature capabilities
6. **Watermarks**: Add watermarks for draft quotations
7. **Multi-language Support**: Support for multiple languages
8. **Tax Calculations**: Include tax calculations in PDFs
9. **Payment Terms**: Add payment terms and conditions
10. **QR Codes**: Add QR codes for easy access to digital versions

## Troubleshooting

### Common Issues

1. **PDF not downloading**: Check browser download settings
2. **Blank PDF**: Ensure quotation has data and items
3. **Slow generation**: Large quotations may take longer
4. **Authentication errors**: Ensure user is logged in

### Debug Mode

Enable console logging to debug PDF generation:

```typescript
// In pdfGenerator.ts
console.log("PDF generation started");
console.log("HTML content length:", data.pdfHtml.length);
```

## Security Considerations

- **Authentication**: All PDF generation requires authentication
- **Data validation**: Server-side validation of quotation data
- **XSS Prevention**: HTML content is sanitized
- **File access**: Only authorized users can generate PDFs
