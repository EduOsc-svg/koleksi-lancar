# Voucher Print Layout - KTP Size (85.6mm x 53.98mm)

## Overview
Aplikasi ini telah disesuaikan untuk mencetak voucher dengan ukuran **KTP (85.6mm x 53.98mm)** pada kertas A4 (landscape).

## Layout Specifications

### Paper & Layout
- **Paper Size**: A4 Landscape (297mm x 210mm)
- **Margin**: 10mm pada semua sisi
- **Print Area**: 277mm x 190mm (landscape printable area)
- **Voucher Size**: KTP — 85.6mm x 53.98mm (~8.56cm x 5.4cm)
- **Layout Grid**: 3 kolom x 3 baris = **9 voucher per halaman**
- **Gap**: 2mm antar voucher

### Voucher Dimensions
```
Width:  8.56cm (85.6mm)
Height: 5.40cm (54.0mm)
```

### Field Positioning (KTP size)
```css
/* NO.Faktur - Merah, Bold */
left: 29%, top: 38%, font-size: 9pt

/* Customer Name */
left: 29%, top: 46%, font-size: 8pt

/* Customer Address */
left: 29%, top: 54%, font-size: 7pt

/* Due Date */
left: 29%, top: 62%, font-size: 8pt

/* Installment Number - Merah, Bold */
left: 29%, top: 70%, font-size: 8pt

/* Installment Amount - Merah, Bold, Right align */
right: 8%, top: 76%, font-size: 14pt

/* Company Info - Center bottom */
left: 48%, bottom: 8%, font-size: 7pt
```

## File Structure

### CSS File
```
/src/styles/print-8x5cm.css (now updated to KTP dimensions)
```

### Component Files
```
/src/components/print/VoucherPage.tsx  (couponsPerPage = 9)
/src/components/print/VoucherCard.tsx
```

### Import Locations
```typescript
// Collection.tsx
import "@/styles/print-8x5cm.css";

// Contracts.tsx  
import "@/styles/print-8x5cm.css";
```

### Print Results

### Per Page
- **9 voucher** per halaman A4 (landscape)
- Tata letak 3 kolom x 3 baris
- Optimal untuk cutting dan distribusi

### Multi-Customer
- Voucher diurutkan berdasarkan customer_code
- Setiap kontrak menghasilkan voucher sesuai tenor masing-masing
- Halaman baru otomatis untuk overflow voucher

### Background Images
- `Voucher background Hitam.png` - Voucher normal
- `Voucher backround Merah.png` - Voucher urgent (10 hari terakhir)

### Usage

### Print dari Collection Page
1. Pilih filters (customer, sales agent, route)
2. Generate manifest
3. Click "Print Manifest"
4. Browser akan otomatis print dengan layout KTP (85.6mm x 53.98mm) pada A4 landscape

### Print dari Contract Page
1. Pilih specific contract
2. Click print button
3. Voucher akan di-generate untuk sisa tenor kontrak tersebut

## Technical Notes

### CSS Media Queries
- `@media print` - Khusus untuk print mode
- `@media screen` - Untuk preview di browser
- `@page { size: A4 landscape; margin: 10mm; }`

### Grid Layout
```css
.voucher-grid {
  display: grid;
  grid-template-columns: repeat(3, 8.56cm);
  grid-template-rows: repeat(3, 5.4cm);
  gap: 2mm;
}
```

### Font & Colors
- Font: Arial Narrow (fallback: Arial, sans-serif)
- Normal text: #000000 (black)
- Special fields: #d00000 (red) - NO.Faktur, Angsuran Ke, Besar Angsuran

## Previous vs New Layout

### Previous (9.5cm x 6.5cm)
- 9 voucher per halaman (3x3)
- Size: 9.5cm x 6.5cm
- Layout: Portrait A4

### New (KTP size) ✅
- **9 voucher per halaman (3x3)**
- Size: **85.6mm x 53.98mm (≈8.56cm x 5.4cm)**
- Layout: Landscape A4
- **Kesesuaian ukuran KTP umum**

## Keuntungan Layout Baru

1. **Ukuran Standar**: Menggunakan ukuran KTP umum (85.6mm x 53.98mm)
2. **Layout Seimbang**: 9 voucher per halaman dengan grid 3x3 yang rapi
3. **Kemudahan Potong**: Grid 3x3 memudahkan pemotongan dan pengemasan
4. **Print Quality**: Spacing yang cukup untuk kualitas print yang baik