# ✅ Red Text + Red Background for Last 10 Days Tenor - Voucher Print

## 🎯 Fitur Baru: Teks Merah + Background Merah untuk 10 Hari Terakhir Tenor

### 📋 **Deskripsi:**
Voucher yang memasuki **10 hari terakhir dari tenor** akan memiliki:
1. **✅ Semua teks berwarna merah** 
2. **✅ Background image merah** (`/public/Voucher backround Merah.png`)

Ini memberikan peringatan visual yang sangat jelas kepada collector dan customer.

### 🔧 **Implementasi:**

#### 1. **Logic Helper Function**
```typescript
// Check if coupon is in last 10 days of tenor
const isLastTenDays = (coupon: InstallmentCoupon) => {
  const totalTenor = contract.tenor_days;
  const currentInstallment = coupon.installment_index;
  const remainingDays = totalTenor - currentInstallment + 1;
  return remainingDays <= 10;
};
```

#### 2. **CSS Styling**
```css
/* Last 10 Days Styling - Red text + red background */
.coupon-card.last-ten-days {
  background-image: url('/Voucher backround Merah.png') !important;
}
.coupon-card.last-ten-days .coupon-data {
  color: red !important;
}
.coupon-card.last-ten-days .coupon-data span.label {
  color: red !important;
}
.coupon-card.last-ten-days .coupon-data span.value {
  color: red !important;
}

/* Normal voucher background (for clarity) */
.coupon-card:not(.last-ten-days) {
  background-image: url('/Background with WM SME.png');
}
```

#### 3. **Conditional Class Application**
```tsx
const isLastTen = isLastTenDays(coupon);
<div key={coupon.id} className={`coupon-card ${isLastTen ? 'last-ten-days' : ''}`}>
```

### 📊 **Contoh Scenario:**

#### **Tenor 30 Hari:**
- **Voucher 1-20**: Teks hitam normal
- **Voucher 21-30**: ✅ **Teks MERAH semua** (10 hari terakhir)

#### **Tenor 60 Hari:**
- **Voucher 1-50**: Teks hitam normal  
- **Voucher 51-60**: ✅ **Teks MERAH semua** (10 hari terakhir)

#### **Tenor 90 Hari:**
- **Voucher 1-80**: Teks hitam normal
- **Voucher 81-90**: ✅ **Teks MERAH semua** (10 hari terakhir)

### 🎯 **Visual Impact:**

#### ✅ **Voucher Normal (Teks Hitam + Background Normal):**
```
Background: Background with WM SME.png
VOUCHER ANGSURAN
NO.Faktur    : 30/AG01/CS001  
Nama         : John Doe
Alamat       : Jl. Merdeka No.1
Jatuh Tempo  : 15/02/2026
Angsuran Ke- : 15
Besar Angsuran: Rp 50,000
```

#### 🚨 **Voucher 10 Hari Terakhir (Teks MERAH + Background MERAH):**
```
Background: Voucher backround Merah.png
🔴 VOUCHER ANGSURAN
🔴 NO.Faktur    : 30/AG01/CS001  
🔴 Nama         : John Doe
🔴 Alamat       : Jl. Merdeka No.1
🔴 Jatuh Tempo  : 28/02/2026
🔴 Angsuran Ke- : 25
🔴 Besar Angsuran: Rp 50,000
```

### 📁 **File Modified:**
- `/src/components/print/PrintCoupon8x5.tsx`
  - ✅ Added `isLastTenDays()` helper function
  - ✅ Added CSS rules for red text + red background
  - ✅ Applied conditional class on voucher cards
  - ✅ Added debug logging
  - ✅ Automatic background image switching

### 🚀 **Benefits:**

1. **⚠️ Double Visual Warning**: Red text + red background untuk maximum impact
2. **📋 Collector Awareness**: Collector dapat fokus pada penagihan final  
3. **💼 Customer Alert**: Customer aware bahwa cicilan hampir lunas
4. **🎯 Better Management**: Easier tracking untuk kontrak yang akan selesai
5. **🖼️ Asset Management**: Automatic background switching based on tenor status

### ✅ **Status: READY FOR TESTING**

Fitur red text untuk 10 hari terakhir tenor sudah **fully implemented** dan ready untuk testing di production environment.

### 🧪 **How to Test:**

1. **Create Contract** dengan tenor pendek (misal 15 hari)
2. **Print Vouchers** untuk contract tersebut  
3. **Check Voucher 6-15**: Harus berwarna merah semua + background merah
4. **Check Voucher 1-5**: Tetap berwarna hitam normal + background normal
5. **Verify Assets**: Pastikan file `/public/Voucher backround Merah.png` tersedia

### 📝 **Debug Info:**
Console akan menampilkan log: `"Coupon X/Y - Last 10 days: true/false"` untuk troubleshooting.