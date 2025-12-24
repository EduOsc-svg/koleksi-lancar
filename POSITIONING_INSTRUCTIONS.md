# Instruksi Konfigurasi Print Coupon

## Mode Saat Ini: 100 COUPON GRID LAYOUT

### 📋 **Spesifikasi Aktual:**
- **Total Coupon**: 100 coupon
- **Ukuran per Coupon**: 8cm x 5cm
- **Grid Layout**: 3 kolom × 4 baris = 12 coupon per halaman A4 landscape
- **Total Halaman**: 9 halaman (8 halaman penuh + 1 halaman 4 coupon)
- **Background Image**: Voucher template pada setiap coupon
- **Auto-loop**: Jika contract < 100, akan mengulang contract dengan installment number yang berbeda

### 🔧 **File Konfigurasi:**
1. **Component**: `/src/components/print/PrintA4LandscapeCoupons.tsx`
   - `couponsPerPage = 12` (3x4 grid)
   - `totalCoupons = 100`
   - Auto-loop contracts untuk mencapai 100 coupon

2. **CSS**: `/src/styles/print-100-coupons.css`
   - CSS Grid: `grid-template-columns: repeat(3, 8cm)`
   - CSS Grid: `grid-template-rows: repeat(4, 5cm)`
   - Gap: `1mm` antar coupon

3. **Import**: `/src/pages/Collection.tsx`
   - `import "@/styles/print-100-coupons.css"`

## Mode yang Tersedia:

### 🎯 **Mode 1: Single Coupon (Positioning)**
Untuk mengatur posisi field:
- File: `print-single-coupon.css`
- Coupon: 1 buah di tengah halaman
- Purpose: Testing positioning

### 📄 **Mode 2: Standard Grid (Original)**
Mode standar 9 coupon:
- File: `print-a4-landscape.css`
- Coupon: 9 buah per halaman (3x3)
- Grid: Mengikuti jumlah contract aktual

### 🎯 **Mode 3: 100 Coupon Grid (AKTIF)**
Mode produksi 100 coupon:
- File: `print-100-coupons.css`
- Coupon: 100 buah total (12 per halaman)
- Grid: 3x4 layout optimal untuk A4 landscape

## Cara Ganti Mode:

### ➡️ **Ke Mode Single Coupon:**
```tsx
// PrintA4LandscapeCoupons.tsx
const couponsPerPage = 1;
// Collection.tsx
import "@/styles/print-single-coupon.css";
```

### ➡️ **Ke Mode Standard 9 Coupon:**
```tsx
// PrintA4LandscapeCoupons.tsx
const couponsPerPage = 9;
// Collection.tsx  
import "@/styles/print-a4-landscape.css";
```

### ➡️ **Ke Mode 100 Coupon (Current):**
```tsx
// PrintA4LandscapeCoupons.tsx
const couponsPerPage = 12;
const totalCoupons = 100;
// Collection.tsx
import "@/styles/print-100-coupons.css";
```

## Status Saat Ini:
✅ Mode 100 Coupon Grid - Produksi ready
✅ Background image di setiap coupon
✅ Auto-loop contracts jika kurang dari 100
✅ Font size dioptimasi untuk grid kecil