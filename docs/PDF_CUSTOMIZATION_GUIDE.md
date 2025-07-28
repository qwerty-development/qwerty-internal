# PDF Template Customization Guide

## Quick Customization Examples

### 1. Change Company Name

**Location**: `src/app/api/quotations/[id]/pdf/route.ts` (line ~230)

**Current**:

```html
<div class="company-name">Your Company Name</div>
```

**Change to**:

```html
<div class="company-name">Acme Corporation</div>
```

### 2. Change Primary Color (Blue Theme)

**Location**: `src/app/api/quotations/[id]/pdf/route.ts` (lines ~110-130)

**Current Blue Theme** (`#2563eb`):

```css
.header {
  border-bottom: 2px solid #2563eb;
}
.company-name {
  color: #2563eb;
}
.section-title {
  color: #2563eb;
}
.item-number {
  color: #2563eb;
}
.description {
  border-left: 4px solid #2563eb;
}
```

**Change to Green Theme** (`#059669`):

```css
.header {
  border-bottom: 2px solid #059669;
}
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

**Change to Purple Theme** (`#7c3aed`):

```css
.header {
  border-bottom: 2px solid #7c3aed;
}
.company-name {
  color: #7c3aed;
}
.section-title {
  color: #7c3aed;
}
.item-number {
  color: #7c3aed;
}
.description {
  border-left: 4px solid #7c3aed;
}
```

## Detailed Customization Options

### Company Information Section

**Add Company Logo** (if you have a logo URL):

```html
<div class="header">
  <img
    src="https://your-domain.com/logo.png"
    alt="Company Logo"
    style="height: 60px; margin-bottom: 10px;"
  />
  <div class="company-name">Your Company Name</div>
  <div class="document-type">QUOTATION</div>
  <div class="quotation-number">${quotation.quotation_number}</div>
</div>
```

**Add Company Address**:

```html
<div class="header">
  <div class="company-name">Your Company Name</div>
  <div
    class="company-address"
    style="font-size: 12px; color: #666; margin-bottom: 10px;"
  >
    123 Business Street<br />
    City, State 12345<br />
    Phone: (555) 123-4567
  </div>
  <div class="document-type">QUOTATION</div>
  <div class="quotation-number">${quotation.quotation_number}</div>
</div>
```

### Color Schemes

#### 1. Professional Blue (Current)

```css
/* Primary: #2563eb */
/* Secondary: #f8fafc */
/* Text: #333, #666 */
```

#### 2. Corporate Green

```css
/* Primary: #059669 */
/* Secondary: #f0fdf4 */
/* Text: #333, #666 */
```

#### 3. Modern Purple

```css
/* Primary: #7c3aed */
/* Secondary: #faf5ff */
/* Text: #333, #666 */
```

#### 4. Classic Red

```css
/* Primary: #dc2626 */
/* Secondary: #fef2f2 */
/* Text: #333, #666 */
```

#### 5. Elegant Gray

```css
/* Primary: #374151 */
/* Secondary: #f9fafb */
/* Text: #333, #666 */
```

### Font Customization

**Change Font Family**:

```css
body {
  font-family: "Times New Roman", serif; /* Classic */
  /* OR */
  font-family: "Georgia", serif; /* Elegant */
  /* OR */
  font-family: "Helvetica", Arial, sans-serif; /* Modern */
}
```

**Change Font Sizes**:

```css
.company-name {
  font-size: 28px; /* Larger company name */
}
.document-type {
  font-size: 16px; /* Smaller document type */
}
.section-title {
  font-size: 18px; /* Larger section titles */
}
```

### Layout Customization

**Add Page Margins**:

```css
body {
  margin: 0;
  padding: 30px; /* Increase padding for more white space */
}
```

**Change Header Spacing**:

```css
.header {
  text-align: center;
  margin-bottom: 40px; /* More space below header */
  border-bottom: 3px solid #2563eb; /* Thicker border */
  padding-bottom: 25px; /* More padding */
}
```

**Customize Table Styling**:

```css
.items-table th {
  background-color: #2563eb; /* Colored header */
  color: white; /* White text */
  padding: 15px; /* More padding */
}
.items-table td {
  padding: 15px; /* More padding */
  border-bottom: 1px solid #e5e7eb;
}
```

### Advanced Customizations

#### Add Watermark for Draft Quotations

```css
.draft-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 48px;
  color: rgba(0, 0, 0, 0.1);
  z-index: -1;
}
```

**Add to HTML** (inside the body tag):

```html
${quotation.status === 'Draft' ? '
<div class="draft-watermark">DRAFT</div>
' : ''}
```

#### Add QR Code for Digital Access

```html
<div class="footer">
  <p>This quotation is valid for 30 days from the issue date.</p>
  <p>Thank you for your business!</p>
  <div style="margin-top: 20px;">
    <img
      src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}"
      alt="QR Code"
      style="width: 100px; height: 100px;"
    />
    <p style="font-size: 10px; margin-top: 5px;">Scan for digital version</p>
  </div>
</div>
```

#### Add Terms and Conditions

```html
<div
  class="terms"
  style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb;"
>
  <h3 style="margin-top: 0; color: #2563eb;">Terms and Conditions</h3>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>Payment is due within 30 days of invoice date</li>
    <li>Late payments may incur additional charges</li>
    <li>All prices are subject to applicable taxes</li>
    <li>This quotation is valid for 30 days</li>
  </ul>
</div>
```

## Complete Customization Example

Here's a complete example with a green theme and additional company information:

```css
/* Green Theme */
.header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #059669;
  padding-bottom: 20px;
}
.company-name {
  font-size: 24px;
  font-weight: bold;
  color: #059669;
  margin-bottom: 5px;
}
.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #059669;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 5px;
}
.item-number {
  text-align: center;
  font-weight: bold;
  color: #059669;
}
.description {
  margin: 20px 0;
  padding: 15px;
  background-color: #f0fdf4;
  border-left: 4px solid #059669;
}
```

```html
<div class="header">
  <div class="company-name">GreenTech Solutions</div>
  <div
    class="company-address"
    style="font-size: 12px; color: #666; margin-bottom: 10px;"
  >
    456 Innovation Drive<br />
    Tech City, TC 54321<br />
    Phone: (555) 987-6543 | Email: info@greentech.com
  </div>
  <div class="document-type">QUOTATION</div>
  <div class="quotation-number">${quotation.quotation_number}</div>
</div>
```

## Testing Your Changes

1. **Make your changes** in `src/app/api/quotations/[id]/pdf/route.ts`
2. **Save the file**
3. **Generate a PDF** from any quotation
4. **Check the result** - the changes should appear immediately

## Tips for Professional PDFs

1. **Keep it Simple**: Don't overcrowd the design
2. **Use Consistent Colors**: Stick to 2-3 main colors
3. **Ensure Readability**: Use high contrast for text
4. **Test Print Quality**: Make sure it looks good when printed
5. **Keep File Size Reasonable**: Avoid very large images

## Common Customization Requests

- **Company Logo**: Add your logo URL to the header
- **Contact Information**: Add phone, email, website
- **Tax Information**: Add tax ID or registration numbers
- **Payment Terms**: Add specific payment terms
- **Legal Disclaimers**: Add any required legal text
- **Brand Colors**: Match your company's brand colors
- **Font Choices**: Use your brand fonts
