# Instruksi Mengembalikan ke Mode 9 Coupon (8x5cm)

## File yang Diubah untuk Mode Single Coupon:

### 1. `/src/components/print/PrintA4LandscapeCoupons.tsx`
**Perubahan:**
- Line ~70: `const couponsPerPage = 1;` → Ubah kembali ke `const couponsPerPage = 9;`
- Line ~72: `Math.min(contracts.length, 1)` → Ubah kembali ke `contracts.length`
- Line ~90-100: Uncomment kode fill empty slots

**Kode yang harus dikembalikan:**
```tsx
// Group contracts into pages of 9
const pages: Array<Array<CouponData>> = [];
const couponsPerPage = 9;

for (let i = 0; i < contracts.length; i += couponsPerPage) {
  const pageContracts = contracts.slice(i, i + couponsPerPage);
  const pageCoupons: Array<CouponData> = pageContracts.map((contract) => {
    // ... existing code ...
  });

  // Fill remaining slots with empty coupons if needed
  while (pageCoupons.length < couponsPerPage) {
    pageCoupons.push({
      contractRef: "",
      noFaktur: "",
      customerName: "",
      customerAddress: "",
      dueDate: "",
      installmentNumber: 0,
      installmentAmount: 0,
    });
  }

  pages.push(pageCoupons);
}
```

### 2. `/src/pages/Collection.tsx`
**Perubahan:**
- Line ~4: `import "@/styles/print-single-coupon.css";` → Ubah kembali ke `import "@/styles/print-a4-landscape.css";`

### 3. File CSS yang dibuat:
- `/src/styles/print-single-coupon.css` → File ini bisa dihapus setelah positioning selesai

## Langkah Cepat Mengembalikan:

1. **Edit PrintA4LandscapeCoupons.tsx:**
   ```bash
   # Ubah couponsPerPage dari 1 ke 9
   # Ubah Math.min(contracts.length, 1) ke contracts.length
   # Uncomment kode fill empty slots
   ```

2. **Edit Collection.tsx:**
   ```bash
   # Ubah import CSS dari print-single-coupon.css ke print-a4-landscape.css
   ```

3. **Hapus file temporary:**
   ```bash
   rm src/styles/print-single-coupon.css
   ```

## Status Saat Ini:
✅ Mode Single Coupon - Untuk positioning adjustment
❌ Mode 9 Coupon (8x5cm) - Akan dikembalikan setelah positioning

## Catatan Positioning:
- Coupon saat ini diposisikan di tengah halaman A4 landscape
- Memiliki border merah tipis untuk membantu positioning
- Ukuran tetap 8x5cm sesuai permintaan
- Data fields sudah diposisikan dalam coupon sesuai layout asli