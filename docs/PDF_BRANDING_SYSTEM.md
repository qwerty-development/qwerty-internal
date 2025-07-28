# PDF Branding System

## Overview

The PDF Branding System allows administrators to customize the appearance of all PDF documents (invoices, quotations, and any future PDF types) through a centralized configuration. This ensures consistent branding across all generated documents without requiring code changes.

## Features

- **Centralized Branding**: All PDFs use the same branding settings
- **Admin Interface**: Easy-to-use web interface for customization
- **Real-time Preview**: See changes before saving
- **Color Presets**: Quick color scheme selection
- **Company Information**: Logo, contact details, and address
- **Typography Control**: Font family and styling options
- **Database Storage**: Persistent settings with proper security

## Architecture

### Components

1. **Database Table**: `branding_settings` - Stores all branding configuration
2. **API Endpoint**: `/api/branding` - Manages branding settings
3. **Branding Service**: `src/utils/brandingService.ts` - Centralized branding logic
4. **Admin Interface**: `/admin/branding` - Web interface for customization
5. **PDF Templates**: Updated to use centralized branding

### Data Flow

```
Admin Interface → API → Database → Branding Service → PDF Templates
```

## Database Schema

### Table: `branding_settings`

| Column            | Type      | Default                          | Description                    |
| ----------------- | --------- | -------------------------------- | ------------------------------ |
| `id`              | UUID      | `gen_random_uuid()`              | Primary key                    |
| `company_name`    | TEXT      | `'QWERTY'`                       | Company name displayed on PDFs |
| `company_address` | TEXT      | `''`                             | Company address                |
| `company_phone`   | TEXT      | `''`                             | Company phone number           |
| `company_email`   | TEXT      | `''`                             | Company email address          |
| `company_website` | TEXT      | `''`                             | Company website URL            |
| `primary_color`   | TEXT      | `'#01303F'`                      | Primary brand color            |
| `secondary_color` | TEXT      | `'#014a5f'`                      | Secondary brand color          |
| `accent_color`    | TEXT      | `'#059669'`                      | Accent color for highlights    |
| `font_family`     | TEXT      | `'Arial, sans-serif'`            | Font family for PDFs           |
| `logo_url`        | TEXT      | `''`                             | Company logo URL               |
| `footer_text`     | TEXT      | `'Thank you for your business!'` | Footer text                    |
| `created_at`      | TIMESTAMP | `NOW()`                          | Creation timestamp             |
| `updated_at`      | TIMESTAMP | `NOW()`                          | Last update timestamp          |

## API Endpoints

### GET `/api/branding`

Fetches current branding settings.

**Response:**

```json
{
  "success": true,
  "branding": {
    "company_name": "QWERTY",
    "primary_color": "#01303F",
    "secondary_color": "#014a5f",
    "accent_color": "#059669",
    "font_family": "Arial, sans-serif",
    "logo_url": "",
    "footer_text": "Thank you for your business!"
    // ... other fields
  }
}
```

### POST `/api/branding`

Updates branding settings.

**Request Body:**

```json
{
  "company_name": "My Company",
  "primary_color": "#2563eb",
  "secondary_color": "#3b82f6",
  "accent_color": "#1d4ed8",
  "font_family": "Helvetica, Arial, sans-serif",
  "logo_url": "https://example.com/logo.png",
  "footer_text": "Thank you for choosing us!"
}
```

**Response:**

```json
{
  "success": true,
  "branding": {
    // Updated branding settings
  }
}
```

## Branding Service

### Core Functions

#### `getBrandingSettings()`

Fetches branding settings from database with fallback to defaults.

#### `generateBrandingCSS(branding)`

Generates CSS styles based on branding settings.

#### `generateCompanyHeader(branding, documentType, documentNumber)`

Creates the company header HTML with logo and company information.

#### `generateFooter(branding)`

Creates the footer HTML with custom text.

#### `generatePDFTemplate(documentType, documentNumber, content)`

Generates complete PDF HTML with branding applied.

## Admin Interface

### Features

1. **Company Information Section**

   - Company name (required)
   - Logo URL
   - Address, phone, email, website

2. **Color Scheme Section**

   - Color presets (QWERTY Blue, Professional Blue, Corporate Green, etc.)
   - Custom color pickers for primary, secondary, and accent colors
   - Real-time color preview

3. **Typography Section**

   - Font family selection
   - Footer text customization

4. **Live Preview**
   - Shows how branding will appear on PDFs
   - Displays current color values

### Color Presets

| Preset Name       | Primary   | Secondary | Accent    |
| ----------------- | --------- | --------- | --------- |
| QWERTY Blue       | `#01303F` | `#014a5f` | `#059669` |
| Professional Blue | `#2563eb` | `#3b82f6` | `#1d4ed8` |
| Corporate Green   | `#059669` | `#10b981` | `#047857` |
| Modern Purple     | `#7c3aed` | `#8b5cf6` | `#6d28d9` |
| Classic Red       | `#dc2626` | `#ef4444` | `#b91c1c` |
| Elegant Gray      | `#374151` | `#6b7280` | `#1f2937` |

## PDF Integration

### Updated PDF Templates

Both invoice and quotation PDFs now use the centralized branding system:

1. **Invoice PDF**: `src/app/api/invoices/[id]/pdf/route.ts`
2. **Quotation PDF**: `src/app/api/quotations/[id]/pdf/route.ts`

### Branding Elements Applied

- **Header**: Company name, logo, contact information
- **Colors**: Primary, secondary, and accent colors throughout
- **Typography**: Font family applied to all text
- **Footer**: Custom footer text
- **Status Badges**: Color-coded using brand colors

## Security

### Row Level Security (RLS)

The `branding_settings` table has RLS enabled with policies that:

- Only allow admins to read branding settings
- Only allow admins to insert new settings
- Only allow admins to update existing settings
- Only allow admins to delete settings

### API Security

- Authentication required for all endpoints
- Admin role verification
- Input validation for colors and required fields
- SQL injection protection through Supabase

## Usage

### For Administrators

1. **Access Branding Settings**

   - Navigate to `/admin/branding`
   - Or click "PDF Branding Settings" in the admin dashboard

2. **Customize Company Information**

   - Enter company name (required)
   - Add logo URL (optional)
   - Fill in contact details

3. **Choose Color Scheme**

   - Select from color presets for quick setup
   - Or customize colors manually using color pickers

4. **Set Typography**

   - Choose font family from dropdown
   - Customize footer text

5. **Save Changes**
   - Click "Save Branding Settings"
   - Changes apply immediately to all new PDFs

### For Developers

#### Adding Branding to New PDF Types

1. **Import the branding service:**

   ```typescript
   import { generatePDFTemplate } from "@/utils/brandingService";
   ```

2. **Generate content HTML:**

   ```typescript
   const content = `
     <div class="content">
       <!-- Your PDF content here -->
     </div>
   `;
   ```

3. **Use the template function:**
   ```typescript
   const pdfHtml = await generatePDFTemplate(
     "Document Type",
     documentNumber,
     content
   );
   ```

#### Customizing Branding Elements

To add new branding elements:

1. **Update the database schema** in `docs/BRANDING_SETTINGS_MIGRATION.sql`
2. **Update the TypeScript interface** in `src/utils/brandingService.ts`
3. **Update the admin interface** in `src/app/admin/branding/page.tsx`
4. **Update the API endpoint** in `src/app/api/branding/route.ts`
5. **Update the CSS generation** in `generateBrandingCSS()`

## Migration

### Database Setup

Run the migration SQL in your Supabase SQL editor:

```sql
-- Run the contents of docs/BRANDING_SETTINGS_MIGRATION.sql
```

### Default Settings

The system includes default branding settings that match the current QWERTY theme:

- Company name: "QWERTY"
- Primary color: `#01303F` (QWERTY blue)
- Secondary color: `#014a5f`
- Accent color: `#059669` (green)
- Font: Arial, sans-serif

## Troubleshooting

### Common Issues

1. **Branding not applying to PDFs**

   - Check that the branding service is properly imported
   - Verify the database table exists and has data
   - Check browser console for errors

2. **Color picker not working**

   - Ensure you're using a modern browser
   - Check that the color format is valid (#RRGGBB)

3. **Logo not displaying**

   - Verify the logo URL is accessible
   - Check that the URL is a direct link to an image
   - Ensure the image format is supported (PNG, JPG, etc.)

4. **Changes not saving**
   - Check that you're logged in as an admin
   - Verify the API endpoint is accessible
   - Check browser network tab for errors

### Debugging

1. **Check branding settings:**

   ```sql
   SELECT * FROM branding_settings;
   ```

2. **Test API endpoint:**

   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/branding
   ```

3. **Check PDF generation:**
   - Open browser developer tools
   - Look for errors in the console
   - Check network tab for failed requests

## Future Enhancements

### Planned Features

1. **Multiple Branding Profiles**

   - Support for different branding per client
   - Seasonal branding themes

2. **Advanced Typography**

   - Custom font uploads
   - Font size controls
   - Text alignment options

3. **Template Customization**

   - Custom PDF layouts
   - Section reordering
   - Conditional content

4. **Branding Analytics**
   - Track which branding settings are used
   - Usage statistics

### Technical Improvements

1. **Caching**

   - Cache branding settings for better performance
   - CDN for logo images

2. **Validation**

   - Enhanced color validation
   - Logo URL validation
   - File size limits

3. **Backup/Restore**
   - Export/import branding settings
   - Version history

## Support

For issues or questions about the PDF Branding System:

1. Check the troubleshooting section above
2. Review the database migration file
3. Test the API endpoints directly
4. Check browser console for JavaScript errors

The system is designed to be robust and fallback to default settings if any issues occur, ensuring PDF generation continues to work even if branding settings are unavailable.
