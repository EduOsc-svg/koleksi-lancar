# ALUR BISNIS & FITUR APLIKASI - KOLEKSI LANCAR

## 📋 Daftar Isi

1. [Gambaran Umum Bisnis](#gambaran-umum-bisnis)
2. [Entitas Utama](#entitas-utama)
3. [Alur Bisnis Lengkap](#alur-bisnis-lengkap)
4. [Rumus & Perhitungan Finansial](#rumus--perhitungan-finansial)
5. [Fitur Aplikasi](#fitur-aplikasi)
6. [Alur Kerja Per Modul](#alur-kerja-per-modul)
7. [Sistem Keamanan & Audit](#sistem-keamanan--audit)

---

## Gambaran Umum Bisnis

**Koleksi Lancar** adalah sistem digitalisasi bisnis kredit barang (kredit konsumtif) yang sebelumnya dikelola secara manual. Bisnis ini beroperasi dengan model:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SUPPLIER   │────▶│   BISNIS    │────▶│  PELANGGAN  │
│  (Barang)   │     │ (Penyedia   │     │   (Toko/    │
│             │     │   Kredit)   │     │   Usaha)    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │   Modal/Omset     │    Total Pinjaman  │
      │   (Harga Beli)    │    (Harga Jual)    │
      └───────────────────┴────────────────────┘
```

### Model Operasional

| Aspek | Deskripsi |
|-------|-----------|
| **Jenis Kredit** | Kredit barang (elektronik, furniture, mesin, dll) |
| **Target Pelanggan** | Pemilik usaha kecil/toko di area Karawang & Bekasi |
| **Metode Pembayaran** | Cicilan harian yang ditagih langsung oleh collector |
| **Tenor** | Fleksibel (50-170 hari) |
| **Margin** | ±20% dari modal |

---

## Entitas Utama

### 1. Sales Agent (Agen Penjualan)
Bertugas mencari dan mengakuisisi pelanggan baru.

| Field | Deskripsi |
|-------|-----------|
| `agent_code` | Kode unik (S001, S002, dst) |
| `name` | Nama lengkap |
| `phone` | Nomor telepon |
| `commission_percentage` | Persentase komisi (default 5%) |

**Relasi:**
- Satu sales agent dapat memiliki banyak pelanggan
- Satu sales agent dapat memiliki banyak kontrak

---

### 2. Collector (Penagih)
Bertugas menagih cicilan harian ke pelanggan.

| Field | Deskripsi |
|-------|-----------|
| `collector_code` | Kode unik (K01, K02, dst) |
| `name` | Nama lengkap |
| `phone` | Nomor telepon |

**Relasi:**
- Satu collector mencatat banyak pembayaran

---

### 3. Customer (Pelanggan)
Pemilik usaha yang mengambil kredit barang.

| Field | Deskripsi |
|-------|-----------|
| `customer_code` | Kode unik (C001, C002, dst) |
| `name` | Nama toko/usaha |
| `address` | Alamat rumah |
| `business_address` | Alamat usaha (untuk penagihan) |
| `phone` | Nomor telepon |
| `nik` | NIK pemilik |
| `assigned_sales_id` | Sales yang mengakuisisi |

**Relasi:**
- Satu pelanggan dapat memiliki banyak kontrak

---

### 4. Credit Contract (Kontrak Kredit)
Perjanjian kredit antara bisnis dengan pelanggan.

| Field | Deskripsi |
|-------|-----------|
| `contract_ref` | Nomor kontrak (A001, A002, dst) |
| `customer_id` | Pelanggan terkait |
| `sales_agent_id` | Sales yang mengakuisisi |
| `product_type` | Jenis barang (TV, Kulkas, dll) |
| `omset` | Modal (harga beli dari supplier) |
| `total_loan_amount` | Total pinjaman (harga jual ke customer) |
| `tenor_days` | Jumlah hari cicilan |
| `daily_installment_amount` | Nominal cicilan per hari |
| `start_date` | Tanggal mulai kontrak |
| `status` | Status (active/completed) |
| `current_installment_index` | Cicilan terakhir yang dibayar |

---

### 5. Installment Coupon (Kupon Cicilan)
Bukti tagihan per cicilan yang di-generate otomatis.

| Field | Deskripsi |
|-------|-----------|
| `contract_id` | Kontrak terkait |
| `installment_index` | Nomor urut cicilan (1, 2, 3, ...) |
| `due_date` | Tanggal jatuh tempo |
| `amount` | Nominal cicilan |
| `status` | Status (unpaid/paid) |

**Catatan Penting:**
- Kupon di-generate otomatis saat kontrak dibuat
- Tanggal jatuh tempo otomatis melewati hari libur
- Pembayaran harus sequential (kupon #1 sebelum #2)

---

### 6. Payment Log (Log Pembayaran)
Catatan setiap transaksi pembayaran.

| Field | Deskripsi |
|-------|-----------|
| `contract_id` | Kontrak terkait |
| `coupon_id` | Kupon yang dibayar |
| `collector_id` | Collector yang menagih |
| `payment_date` | Tanggal pembayaran aktual |
| `installment_index` | Nomor cicilan |
| `amount_paid` | Jumlah yang dibayar |
| `notes` | Catatan tambahan |

---

### 7. Holiday (Hari Libur)
Daftar hari non-kerja untuk kalkulasi jatuh tempo.

| Tipe | Deskripsi |
|------|-----------|
| `specific_date` | Tanggal spesifik (1 Jan, 17 Agustus, dll) |
| `recurring_weekday` | Hari berulang (Minggu setiap minggu) |

---

### 8. Operational Expense (Biaya Operasional)
Pencatatan pengeluaran bisnis.

| Field | Deskripsi |
|-------|-----------|
| `description` | Deskripsi pengeluaran |
| `amount` | Nominal |
| `expense_date` | Tanggal |
| `category` | Kategori (Gaji, Transportasi, dll) |

---

## Alur Bisnis Lengkap

### Diagram Alur Utama

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ALUR BISNIS KREDIT                              │
└──────────────────────────────────────────────────────────────────────────┘

   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ 1.AKUI- │    │ 2.BUAT  │    │ 3.GENE- │    │ 4.TAGIH │    │ 5.LUNAS │
   │  SISI   │───▶│ KONTRAK │───▶│ RATE    │───▶│ CICILAN │───▶│         │
   │         │    │         │    │ KUPON   │    │         │    │         │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
       │              │              │              │              │
   Sales Agent    Admin Input    Otomatis      Collector       Status
   cari customer  data kontrak   by system    tagih harian    completed
```

### Detail Setiap Tahap

#### Tahap 1: Akuisisi Pelanggan
```
Sales Agent ──▶ Cari prospek ──▶ Survey kelayakan ──▶ Input data pelanggan
                    │
                    ▼
            ┌───────────────┐
            │ Data Customer │
            │ - Nama toko   │
            │ - Alamat      │
            │ - NIK         │
            │ - Telepon     │
            └───────────────┘
```

#### Tahap 2: Pembuatan Kontrak
```
Admin ──▶ Pilih Customer ──▶ Input Detail Kontrak ──▶ Simpan
              │
              ▼
        ┌─────────────────────┐
        │ Data Kontrak        │
        │ - Jenis barang      │
        │ - Modal (omset)     │
        │ - Total pinjaman    │
        │ - Tenor (hari)      │
        │ - Tanggal mulai     │
        │ - Sales Agent       │
        └─────────────────────┘
```

#### Tahap 3: Generate Kupon Otomatis
```
                         ┌─────────────────┐
Kontrak Dibuat ─────────▶│ generate_       │
                         │ installment_    │
                         │ coupons()       │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │ Kupon 1 │   │ Kupon 2 │   │ Kupon N │
              │ Due: D1 │   │ Due: D2 │   │ Due: DN │
              └─────────┘   └─────────┘   └─────────┘
                    │
                    ▼
           Skip hari libur secara otomatis
```

#### Tahap 4: Penagihan Harian
```
Collector ──▶ Kunjungi Pelanggan ──▶ Terima Pembayaran ──▶ Input ke Sistem
                    │                        │
                    ▼                        ▼
            Bawa daftar tagihan      ┌─────────────────┐
            hari ini                 │ Payment Log     │
                                     │ - Tanggal       │
                                     │ - Jumlah        │
                                     │ - Collector     │
                                     └─────────────────┘
                                            │
                                            ▼
                                    Update kupon status
                                    Update contract index
```

#### Tahap 5: Pelunasan
```
Cicilan terakhir dibayar ──▶ current_index = tenor ──▶ Status = completed
                                      │
                                      ▼
                              Contract selesai
                              (tetap tersimpan untuk audit)
```

---

## Rumus & Perhitungan Finansial

### Rumus Dasar

```
┌─────────────────────────────────────────────────────────────────┐
│                      RUMUS PERHITUNGAN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Pinjaman = Modal × 1.2  (margin 20%)                    │
│                                                                 │
│  Cicilan Harian = Total Pinjaman ÷ Tenor                       │
│                                                                 │
│  Keuntungan = Total Pinjaman - Modal                           │
│                                                                 │
│  Komisi Sales = Total Pinjaman × Commission%                   │
│                                                                 │
│  Keuntungan Bersih = Keuntungan - Komisi - Biaya Operasional   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Contoh Perhitungan

| Item | Nilai | Keterangan |
|------|-------|------------|
| Modal | Rp 5.000.000 | Harga beli TV dari supplier |
| Total Pinjaman | Rp 6.000.000 | Modal × 1.2 |
| Tenor | 100 hari | Durasi cicilan |
| Cicilan Harian | Rp 60.000 | 6.000.000 ÷ 100 |
| Keuntungan Kotor | Rp 1.000.000 | 6.000.000 - 5.000.000 |
| Komisi Sales (5%) | Rp 300.000 | 6.000.000 × 5% |
| Keuntungan Bersih | Rp 700.000 | 1.000.000 - 300.000 |

### Metrik Performa Kontrak

```
Days Per Due = (Hari Sejak Mulai) ÷ (Cicilan Terbayar)

┌────────────────┬─────────────┬───────────────────────────┐
│ Status         │ Days/Due    │ Interpretasi              │
├────────────────┼─────────────┼───────────────────────────┤
│ Lancar         │ ≤ 1.2       │ Bayar tepat/lebih cepat   │
│ Kurang Lancar  │ ≤ 2.0       │ Agak terlambat            │
│ Macet          │ > 2.0       │ Sangat terlambat          │
└────────────────┴─────────────┴───────────────────────────┘
```

---

## Fitur Aplikasi

### Navigasi Utama

| Menu | Deskripsi |
|------|-----------|
| 🏠 Dashboard | Ringkasan metrik bisnis |
| 📄 Kontrak | Manajemen kontrak kredit |
| 👥 Pelanggan | Database pelanggan |
| 📜 Riwayat | Histori pembayaran per pelanggan |
| 🏦 Penagihan | Input pembayaran harian |
| 📊 Laporan | Laporan pembayaran bulanan |
| 👔 Agen Sales | Manajemen sales agent |
| 🧾 Kolektor | Manajemen collector |
| 📅 Libur | Manajemen hari libur |
| 📝 Audit Log | Jejak audit aktivitas |

---

## Alur Kerja Per Modul

### 1. Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│                         DASHBOARD                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Total Omset  │  │ Total Modal  │  │ Keuntungan   │      │
│  │ Rp XXX.XXX   │  │ Rp XXX.XXX   │  │ Rp XXX.XXX   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              GRAFIK TREN PENAGIHAN 30 HARI         │    │
│  │   📈 ─────────────────────────────────────────     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              TABEL PERFORMA SALES AGENT            │    │
│  │   #  Nama       Omset       Profit      Komisi     │    │
│  │   1  Ahmad      Rp XXX      Rp XXX      Rp XXX     │    │
│  │   2  Budi       Rp XXX      Rp XXX      Rp XXX     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Data yang ditampilkan:**
- Total Omset = Σ total_loan_amount (semua kontrak)
- Total Modal = Σ omset field (semua kontrak)
- Keuntungan = Total Omset - Total Modal
- Total Komisi = Σ (total_loan_amount × commission_percentage)
- Grafik Tren = Pembayaran 30 hari terakhir
- Performa Agent = Agregasi per sales agent

---

### 2. Kontrak

#### Alur Buat Kontrak Baru
```
Klik "Tambah Kontrak"
        │
        ▼
┌─────────────────────────┐
│ Form Kontrak Baru       │
│ ────────────────────    │
│ Pelanggan: [Dropdown]   │
│ Sales: [Dropdown]       │
│ Produk: [Input]         │
│ Modal: [Currency]       │
│ Total Pinjaman: [Curr]  │
│ Tenor: [Number]         │
│ Cicilan: [Auto-calc]    │
│ Tanggal Mulai: [Date]   │
└────────────┬────────────┘
             │
             ▼
        [Simpan]
             │
             ▼
    Kupon auto-generate
```

#### Detail Kontrak
Klik baris kontrak untuk melihat:
- Progress bar cicilan
- Informasi finansial
- Tombol cetak kupon
- Tombol edit/hapus

---

### 3. Penagihan (Collection)

#### Alur Input Pembayaran
```
┌─────────────────────────────────────────────────────────────┐
│                     HALAMAN PENAGIHAN                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Pilih Pelanggan: [Searchable Combobox]                 │
│                           ↓                                 │
│  2. Sistem tampilkan kontrak aktif                         │
│                           ↓                                 │
│  3. Pilih Kontrak: [Dropdown]                              │
│                           ↓                                 │
│  4. Info auto-fill:                                        │
│     - Cicilan ke: [Auto dari current_index + 1]            │
│     - Nominal: [Auto dari daily_installment_amount]        │
│                           ↓                                 │
│  5. Input Tanggal Bayar: [Date Picker]                     │
│                           ↓                                 │
│  6. Pilih Collector: [Dropdown]                            │
│                           ↓                                 │
│  7. [Simpan Pembayaran]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Proses di Backend:**
1. Insert ke `payment_logs`
2. Update `installment_coupons` status = 'paid'
3. Increment `credit_contracts.current_installment_index`
4. Jika index = tenor → update status = 'completed'

---

### 4. Cetak Kupon

#### Format Kupon
```
┌─────────────────────────────────────────┐
│  No. Faktur: 100/S001/K01              │
│                                         │
│  Nama: Toko Elektronik Jaya            │
│  Alamat: Jl. Pasar Baru No. 15         │
│                                         │
│  Jatuh Tempo: 15 Jan 2025              │
│  Angsuran Ke: 1                        │
│  Nominal: Rp 60.000                    │
│                                         │
└─────────────────────────────────────────┘
```

**Keterangan No. Faktur:**
- `100` = Tenor (jumlah cicilan)
- `S001` = Kode Sales Agent
- `K01` = Kode Collector

**Layout Cetak:**
- Format: A4 Landscape
- Grid: 3x3 (9 kupon per halaman)
- Ukuran per kupon: 9.3 × 6.3 cm

---

### 5. Laporan

#### Fitur Laporan Pembayaran
```
┌─────────────────────────────────────────────────────────────┐
│                       HALAMAN LAPORAN                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter:                                                    │
│  ┌─────────────────┐  ┌─────────────────────────────┐      │
│  │ 📅 Januari 2025 │  │ 👤 Pilih Pelanggan [Search] │      │
│  └─────────────────┘  └─────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Periode: 1 Jan - 31 Jan 2025                       │   │
│  │  Total: Rp 1.800.000 | Transaksi: 30               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tanggal    │ Pelanggan  │ Kontrak │ Nominal        │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  15/01/25   │ Toko Jaya  │ A001    │ Rp 60.000      │   │
│  │  15/01/25   │ Warung SM  │ A006    │ Rp 60.000      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [📥 Export Excel]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. Riwayat Pelanggan

#### Alur Lihat Riwayat
```
Cari Pelanggan (Nama/Kode)
        │
        ▼
Klik baris pelanggan
        │
        ▼
┌─────────────────────────────────────────┐
│  RIWAYAT PEMBAYARAN                     │
│  ─────────────────                      │
│  Pelanggan: Toko Elektronik Jaya (C001) │
│                                         │
│  Kontrak Aktif:                         │
│  ┌───────────────────────────────────┐  │
│  │ A001 - TV LED 43 inch             │  │
│  │ Progress: ████████░░ 80/100       │  │
│  │ Sisa: 20 cicilan                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Histori Pembayaran:                    │
│  │ 20/01/25 │ A001 │ #80 │ Rp 60.000 │ │
│  │ 19/01/25 │ A001 │ #79 │ Rp 60.000 │ │
│  │ 18/01/25 │ A001 │ #78 │ Rp 60.000 │ │
└─────────────────────────────────────────┘
```

---

## Sistem Keamanan & Audit

### Row Level Security (RLS)
Semua tabel dilindungi RLS dengan aturan:
- Hanya user terautentikasi yang dapat akses
- Tidak ada akses anonymous

### Role-Based Access
```
┌──────────────────────────────────────────┐
│           HIERARKI ROLE                  │
├──────────────────────────────────────────┤
│                                          │
│   ADMIN ──────────────────────────────   │
│     │  • Akses penuh semua fitur         │
│     │  • Kelola user roles               │
│     │  • Lihat audit log                 │
│     │                                    │
│   USER ───────────────────────────────   │
│        • Akses operasional standar       │
│        • Input pembayaran                │
│        • Lihat laporan                   │
│                                          │
└──────────────────────────────────────────┘
```

### Audit Trail
Semua aksi tercatat di `activity_logs`:

| Field | Deskripsi |
|-------|-----------|
| `action` | CREATE, UPDATE, DELETE |
| `entity_type` | contract, customer, payment, dll |
| `entity_id` | ID objek yang diubah |
| `user_name` | Nama user yang melakukan |
| `description` | Deskripsi aksi |
| `created_at` | Timestamp |

**Contoh Log:**
```
[2025-01-15 10:30:00] Ahmad (admin) - CREATE contract A001 with loan amount 6000000
[2025-01-15 14:45:00] Budi (user) - CREATE payment for contract A001 amount 60000
[2025-01-16 09:00:00] Ahmad (admin) - UPDATE customer C001 phone number
```

---

## Appendix: Studi Kasus 1 Tahun

### Ringkasan Operasional 2025

| Metrik | Nilai |
|--------|-------|
| Total Kontrak | 20 |
| Total Pelanggan | 20 |
| Sales Agent | 5 |
| Collector | 3 |

### Ringkasan Keuangan

| Item | Nilai |
|------|-------|
| Total Modal | Rp 90.000.000 |
| Total Pinjaman | Rp 108.000.000 |
| Keuntungan Kotor | Rp 18.000.000 |
| Total Komisi (5%) | Rp 5.400.000 |
| Biaya Operasional | Rp 24.000.000 |
| **Keuntungan Bersih** | **Rp -11.400.000** |

### Analisis Break-Even

```
Biaya Tetap Bulanan:
- Gaji Collector: Rp 1.500.000
- Transportasi: Rp 500.000
- Total: Rp 2.000.000/bulan = Rp 24.000.000/tahun

Margin per Kontrak (rata-rata):
- Rata-rata Modal: Rp 4.500.000
- Rata-rata Pinjaman: Rp 5.400.000
- Keuntungan Kotor: Rp 900.000
- Komisi (5%): Rp 270.000
- Keuntungan Bersih: Rp 630.000/kontrak

Break-Even Point:
Rp 24.000.000 ÷ Rp 630.000 = 38.1 kontrak/tahun
≈ 3-4 kontrak/bulan
```

---

*Dokumen ini terakhir diperbarui: Januari 2025*
*Versi: 1.0*
