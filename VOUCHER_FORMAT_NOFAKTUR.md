# 🎟️ Format No. Faktur Voucher

## Format Terbaru

**No. Faktur:** `TENOR/KODE_SALES/KODE_KONSUMEN`

### Contoh:
```
100/S001/KO2
│   │    └── Kode Konsumen (Customer Code)
│   └── Kode Sales (Agent Code) 
└── Tenor (dalam hari)
```

## Komponen Format

### 1. **TENOR** (Posisi 1)
- **Sumber:** `contract.tenor_days`
- **Deskripsi:** Jangka waktu cicilan dalam hari
- **Contoh:** `100` (100 hari), `365` (1 tahun)

### 2. **KODE_SALES** (Posisi 2)  
- **Sumber:** `contract.customers.sales_agents.agent_code`
- **Deskripsi:** Kode unik sales agent/agen penjualan
- **Format:** Biasanya S + 3 digit angka
- **Contoh:** `S001`, `S025`, `S999`

### 3. **KODE_KONSUMEN** (Posisi 3)
- **Sumber:** `contract.customers.customer_code` 
- **Deskripsi:** Kode unik customer/konsumen
- **Format:** 2-3 karakter + angka
- **Contoh:** `KO2`, `AB1`, `C123`

## Contoh Lengkap

| No. Faktur | Tenor | Kode Sales | Kode Konsumen | Arti |
|------------|-------|------------|---------------|------|
| `100/S001/KO2` | 100 hari | S001 | KO2 | Cicilan 100 hari oleh sales S001 untuk konsumen KO2 |
| `365/S025/AB1` | 365 hari | S025 | AB1 | Cicilan 1 tahun oleh sales S025 untuk konsumen AB1 |
| `180/S999/C123` | 180 hari | S999 | C123 | Cicilan 6 bulan oleh sales S999 untuk konsumen C123 |

## Implementasi Kode

```typescript
// Generate No. Faktur: [Tenor]/[Kode Sales]/[Kode Konsumen]
const tenor = contract.tenor_days || 0;
const agentCode = contract.customers?.sales_agents?.agent_code || "XXX";
const customerCode = contract.customers?.customer_code || "XXX";
const noFaktur = `${tenor}/${agentCode}/${customerCode}`;
```

## Kegunaan Bisnis

### **Tracking & Identifikasi:**
- ✅ **Tenor** → Mudah identifikasi jangka waktu cicilan
- ✅ **Kode Sales** → Tracking performa sales agent
- ✅ **Kode Konsumen** → Identifikasi unik customer

### **Analisis:**
- Grouping by tenor untuk analisis produk
- Grouping by sales untuk komisi dan target
- Tracking individual customer payment behavior

---
*Format berlaku untuk semua voucher yang digenerate*  
*Last updated: 27 Desember 2025*