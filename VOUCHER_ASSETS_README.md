# 🎟️ Voucher Background Assets

## Required Assets

Untuk sistem voucher yang dinamis berdasarkan jatuh tempo, diperlukan 2 file gambar background:

### 1. **Normal Voucher (Background Hitam)**
- **File:** `/public/voucher background.png`
- **Penggunaan:** Untuk voucher dengan jatuh tempo > 10 hari
- **Warna:** Background hitam/gelap

### 2. **Urgent Voucher (Background Merah)**  
- **File:** `/public/voucher background red.png`
- **Penggunaan:** Untuk voucher dengan jatuh tempo ≤ 10 hari
- **Warna:** Background merah/warning

## Spesifikasi Asset

### Ukuran Recommended:
- **Dimensi:** 800px × 520px (rasio 10cm:6.5cm)
- **Format:** PNG dengan transparansi
- **DPI:** 300 DPI untuk kualitas print yang baik

### Design Guidelines:
- Pastikan area teks tetap readable
- Background tidak mengganggu visibility field data
- Konsisten dengan brand colors
- Font dan elemen dekoratif sesuai kebutuhan

## Logika Sistem

```javascript
// Jika jatuh tempo ≤ 10 hari → background merah
// Jika jatuh tempo > 10 hari → background hitam

const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
const isUrgent = diffDays <= 10;
```

## File Structure
```
/public/
├── voucher background.png     ← Background normal (hitam)
└── voucher background red.png ← Background urgent (merah)
```

---
*Last updated: 27 Desember 2025*