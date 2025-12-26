# 🎟️ Voucher Background Assets

## Required Assets

Untuk sistem voucher yang dinamis berdasarkan urutan cicilan, diperlukan 2 file gambar background:

### 1. **Normal Voucher (Background Hitam)**
- **File:** `/public/Voucher background Hitam.png`
- **Penggunaan:** Untuk 90 voucher pertama (voucher 1-90)
- **Warna:** Background hitam/gelap

### 2. **Final Voucher (Background Merah)**  
- **File:** `/public/Voucher backround Merah.png`
- **Penggunaan:** Untuk 10 voucher terakhir (voucher 91-100)
- **Warna:** Background merah/warning (menandakan cicilan hampir selesai)

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
// Untuk 100 voucher:
// Voucher 1-90 (index 0-89) → background hitam + font hitam
// Voucher 91-100 (index 90-99) → background merah + font merah

const isLastTenVouchers = voucherIndex >= (totalVouchers - 10);
const backgroundType = isLastTenVouchers ? "urgent" : "normal";
```

## Contoh Visual

### Voucher 1-90 (Normal):
```
🖤 Background: Hitam
📝 Font: Hitam (#000000)
🎟️ No.Faktur: 100/S001/KO2 (tenor/sales/konsumen)
💰 Besar Angsuran: Merah (#CC0000) ← Exception
📊 Angsuran Ke-: Merah (#CC0000) ← Exception  
📞 Nomor Kantor: Merah (#CC0000) ← Exception
```

### Voucher 91-100 (Urgent):
```
❤️ Background: Merah
📝 Font: Merah (#CC0000)
🎟️ No.Faktur: 100/S001/KO2 (tenor/sales/konsumen)
💰 Besar Angsuran: Merah (#CC0000) ← Konsisten
📊 Angsuran Ke-: Merah (#CC0000) ← Konsisten
📞 Nomor Kantor: Merah (#CC0000) ← Konsisten
```

## Konsep Bisnis

**Tujuan:** Memberikan indikasi visual kepada nasabah bahwa cicilan hampir selesai

### Background:
- **90 voucher pertama** → Background hitam
- **10 voucher terakhir** → Background merah

### Font Color:
- **90 voucher pertama** → Font hitam (#000000)
- **10 voucher terakhir** → Font merah (#CC0000)

### Field Khusus (Selalu Merah):
Beberapa field tetap menggunakan warna merah untuk semua voucher:
- ✅ **Besar Angsuran** (nominal pembayaran)
- ✅ **Angsuran Ke-** (nomor urutan)
- ✅ **Nomor Kantor** (company info)

### Field dengan Warna Dinamis:
- **NO.Faktur** → Hitam/Merah berdasarkan urutan
- **Nama Pelanggan** → Hitam/Merah berdasarkan urutan  
- **Alamat** → Hitam/Merah berdasarkan urutan
- **Jatuh Tempo** → Hitam/Merah berdasarkan urutan

## File Structure
```
/public/
├── Voucher background Hitam.png  ← Background normal (hitam) ✅
└── Voucher backround Merah.png   ← Background urgent (merah) ✅
```

**Status:** ✅ **Assets sudah tersedia dan URL sudah disesuaikan di CSS**

---
*Last updated: 27 Desember 2025*