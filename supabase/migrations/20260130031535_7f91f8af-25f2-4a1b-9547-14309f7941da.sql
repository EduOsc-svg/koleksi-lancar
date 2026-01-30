-- =========================================
-- HAPUS SEMUA DATA EXISTING
-- =========================================
DELETE FROM public.activity_logs;
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.collectors;
DELETE FROM public.sales_agents;
DELETE FROM public.operational_expenses;
DELETE FROM public.holidays;

-- =========================================
-- STUDI KASUS: BISNIS KREDIT "KOLEKSI LANCAR"
-- Periode: Januari 2025 - Desember 2025 (1 Tahun)
-- =========================================

-- =========================================
-- 1. SALES AGENTS (5 Orang)
-- Komisi: 5% dari Total Pinjaman
-- =========================================
INSERT INTO public.sales_agents (id, name, agent_code, phone, commission_percentage) VALUES
('a1000000-0000-0000-0000-000000000001', 'Ahmad Rizki', 'S001', '081234567001', 5.0),
('a1000000-0000-0000-0000-000000000002', 'Budi Santoso', 'S002', '081234567002', 5.0),
('a1000000-0000-0000-0000-000000000003', 'Citra Dewi', 'S003', '081234567003', 5.0),
('a1000000-0000-0000-0000-000000000004', 'Deni Pratama', 'S004', '081234567004', 5.0),
('a1000000-0000-0000-0000-000000000005', 'Eka Wulandari', 'S005', '081234567005', 5.0);

-- =========================================
-- 2. COLLECTORS (3 Orang)
-- =========================================
INSERT INTO public.collectors (id, name, collector_code, phone) VALUES
('c1000000-0000-0000-0000-000000000001', 'Fajar Nugroho', 'K01', '081234567101'),
('c1000000-0000-0000-0000-000000000002', 'Gilang Ramadhan', 'K02', '081234567102'),
('c1000000-0000-0000-0000-000000000003', 'Hendra Wijaya', 'K03', '081234567103');

-- =========================================
-- 3. HOLIDAYS 2025 (Libur Nasional + Minggu)
-- =========================================
INSERT INTO public.holidays (holiday_type, day_of_week, description) VALUES
('recurring_weekday', 0, 'Hari Minggu');

INSERT INTO public.holidays (holiday_type, holiday_date, description) VALUES
('specific_date', '2025-01-01', 'Tahun Baru'),
('specific_date', '2025-03-29', 'Hari Raya Nyepi'),
('specific_date', '2025-03-31', 'Idul Fitri'),
('specific_date', '2025-04-01', 'Idul Fitri'),
('specific_date', '2025-05-01', 'Hari Buruh'),
('specific_date', '2025-06-01', 'Hari Lahir Pancasila'),
('specific_date', '2025-08-17', 'Hari Kemerdekaan'),
('specific_date', '2025-12-25', 'Hari Natal');

-- =========================================
-- 4. CUSTOMERS (20 Pelanggan)
-- Tersebar merata ke 5 Sales Agent
-- =========================================
INSERT INTO public.customers (id, name, customer_code, address, phone, assigned_sales_id) VALUES
-- Pelanggan Ahmad Rizki (S001)
('d1000000-0000-0000-0000-000000000001', 'Toko Elektronik Jaya', 'C001', 'Jl. Pasar Baru No. 15, Karawang', '081111000001', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000002', 'Warung Makan Sederhana', 'C002', 'Jl. Tuparev No. 88, Karawang', '081111000002', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000003', 'Bengkel Motor Bersama', 'C003', 'Jl. Galuh Mas No. 22, Karawang', '081111000003', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000004', 'Toko Kelontong Makmur', 'C004', 'Jl. Kertabumi No. 45, Karawang', '081111000004', 'a1000000-0000-0000-0000-000000000001'),
-- Pelanggan Budi Santoso (S002)
('d1000000-0000-0000-0000-000000000005', 'Konter HP Cellular', 'C005', 'Jl. Ahmad Yani No. 100, Bekasi', '081111000005', 'a1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000006', 'Toko Bangunan Sentosa', 'C006', 'Jl. Cut Mutia No. 55, Bekasi', '081111000006', 'a1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000007', 'Salon Kecantikan Ayu', 'C007', 'Jl. Veteran No. 33, Bekasi', '081111000007', 'a1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000008', 'Apotek Sehat Selalu', 'C008', 'Jl. Sudirman No. 77, Bekasi', '081111000008', 'a1000000-0000-0000-0000-000000000002'),
-- Pelanggan Citra Dewi (S003)
('d1000000-0000-0000-0000-000000000009', 'Toko Pakaian Modis', 'C009', 'Jl. Raya Cikampek No. 10, Karawang', '081111000009', 'a1000000-0000-0000-0000-000000000003'),
('d1000000-0000-0000-0000-000000000010', 'Warnet Game Center', 'C010', 'Jl. Bypass No. 200, Karawang', '081111000010', 'a1000000-0000-0000-0000-000000000003'),
('d1000000-0000-0000-0000-000000000011', 'Toko Sepatu Langkah', 'C011', 'Jl. Kosambi No. 18, Karawang', '081111000011', 'a1000000-0000-0000-0000-000000000003'),
('d1000000-0000-0000-0000-000000000012', 'Laundry Bersih Wangi', 'C012', 'Jl. Telukjambe No. 5, Karawang', '081111000012', 'a1000000-0000-0000-0000-000000000003'),
-- Pelanggan Deni Pratama (S004)
('d1000000-0000-0000-0000-000000000013', 'Toko Tas Ransel', 'C013', 'Jl. Harapan Indah No. 99, Bekasi', '081111000013', 'a1000000-0000-0000-0000-000000000004'),
('d1000000-0000-0000-0000-000000000014', 'Warung Kopi Nikmat', 'C014', 'Jl. Galaxy No. 150, Bekasi', '081111000014', 'a1000000-0000-0000-0000-000000000004'),
('d1000000-0000-0000-0000-000000000015', 'Toko Mainan Anak', 'C015', 'Jl. Pekayon No. 25, Bekasi', '081111000015', 'a1000000-0000-0000-0000-000000000004'),
('d1000000-0000-0000-0000-000000000016', 'Pet Shop Sayang', 'C016', 'Jl. Tambun No. 88, Bekasi', '081111000016', 'a1000000-0000-0000-0000-000000000004'),
-- Pelanggan Eka Wulandari (S005)
('d1000000-0000-0000-0000-000000000017', 'Toko Kue Lezat', 'C017', 'Jl. Cikarang No. 40, Bekasi', '081111000017', 'a1000000-0000-0000-0000-000000000005'),
('d1000000-0000-0000-0000-000000000018', 'Studio Foto Kenangan', 'C018', 'Jl. Lippo Cikarang No. 12, Bekasi', '081111000018', 'a1000000-0000-0000-0000-000000000005'),
('d1000000-0000-0000-0000-000000000019', 'Toko Alat Tulis', 'C019', 'Jl. Deltamas No. 8, Bekasi', '081111000019', 'a1000000-0000-0000-0000-000000000005'),
('d1000000-0000-0000-0000-000000000020', 'Percetakan Cepat', 'C020', 'Jl. Jababeka No. 15, Bekasi', '081111000020', 'a1000000-0000-0000-0000-000000000005');

-- =========================================
-- 5. CREDIT CONTRACTS (20 Kontrak - 1 per Customer)
-- 
-- RUMUS BISNIS:
-- Modal (omset field) = Harga beli barang dari supplier
-- Total Pinjaman = Harga jual ke customer (Modal + Margin 20%)
-- Cicilan Harian = Total Pinjaman / Tenor
-- Keuntungan = Total Pinjaman - Modal
-- Komisi Sales = Total Pinjaman x 5%
--
-- Contoh:
-- Modal: Rp 5.000.000
-- Total Pinjaman: Rp 6.000.000 (margin 20%)
-- Tenor: 100 hari
-- Cicilan: Rp 60.000/hari
-- Keuntungan: Rp 1.000.000
-- Komisi: Rp 300.000 (5% dari 6jt)
-- =========================================

INSERT INTO public.credit_contracts (id, contract_ref, customer_id, sales_agent_id, product_type, omset, total_loan_amount, tenor_days, daily_installment_amount, start_date, status, current_installment_index) VALUES
-- Q1 2025: 5 Kontrak (Januari-Maret)
('e1000000-0000-0000-0000-000000000001', 'A001', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'TV LED 43 inch', 5000000, 6000000, 100, 60000, '2025-01-06', 'completed', 100),
('e1000000-0000-0000-0000-000000000002', 'A002', 'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Smartphone Samsung', 4000000, 4800000, 80, 60000, '2025-01-15', 'completed', 80),
('e1000000-0000-0000-0000-000000000003', 'A003', 'd1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', 'Mesin Jahit', 3500000, 4200000, 70, 60000, '2025-02-03', 'completed', 70),
('e1000000-0000-0000-0000-000000000004', 'A004', 'd1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000004', 'Kulkas 2 Pintu', 6000000, 7200000, 120, 60000, '2025-02-17', 'completed', 120),
('e1000000-0000-0000-0000-000000000005', 'A005', 'd1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000005', 'Oven Kue Besar', 4500000, 5400000, 90, 60000, '2025-03-03', 'completed', 90),

-- Q2 2025: 5 Kontrak (April-Juni)
('e1000000-0000-0000-0000-000000000006', 'A006', 'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Kompor Gas + Tabung', 2500000, 3000000, 50, 60000, '2025-04-07', 'completed', 50),
('e1000000-0000-0000-0000-000000000007', 'A007', 'd1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Mesin Bor Set', 3000000, 3600000, 60, 60000, '2025-04-21', 'completed', 60),
('e1000000-0000-0000-0000-000000000008', 'A008', 'd1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', 'PC Gaming Set', 8000000, 9600000, 160, 60000, '2025-05-05', 'completed', 160),
('e1000000-0000-0000-0000-000000000009', 'A009', 'd1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000004', 'Mesin Kopi Espresso', 5500000, 6600000, 110, 60000, '2025-05-19', 'completed', 110),
('e1000000-0000-0000-0000-000000000010', 'A010', 'd1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000005', 'Kamera DSLR', 7000000, 8400000, 140, 60000, '2025-06-02', 'completed', 140),

-- Q3 2025: 5 Kontrak (Juli-September)
('e1000000-0000-0000-0000-000000000011', 'A011', 'd1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Kompresor Angin', 4000000, 4800000, 80, 60000, '2025-07-07', 'completed', 80),
('e1000000-0000-0000-0000-000000000012', 'A012', 'd1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'Alat Salon Lengkap', 6500000, 7800000, 130, 60000, '2025-07-21', 'completed', 130),
('e1000000-0000-0000-0000-000000000013', 'A013', 'd1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003', 'Rak Display Toko', 3500000, 4200000, 70, 60000, '2025-08-04', 'completed', 70),
('e1000000-0000-0000-0000-000000000014', 'A014', 'd1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000004', 'Etalase Kaca', 2800000, 3360000, 56, 60000, '2025-08-18', 'completed', 56),
('e1000000-0000-0000-0000-000000000015', 'A015', 'd1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000005', 'Printer Multifungsi', 3200000, 3840000, 64, 60000, '2025-09-01', 'completed', 64),

-- Q4 2025: 5 Kontrak (Oktober-Desember) - MASIH AKTIF
('e1000000-0000-0000-0000-000000000016', 'A016', 'd1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Mesin Cuci', 4500000, 5400000, 90, 60000, '2025-10-06', 'active', 85),
('e1000000-0000-0000-0000-000000000017', 'A017', 'd1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'Lemari Obat', 2000000, 2400000, 40, 60000, '2025-10-20', 'active', 75),
('e1000000-0000-0000-0000-000000000018', 'A018', 'd1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'Mesin Cuci Laundry', 7500000, 9000000, 150, 60000, '2025-11-03', 'active', 60),
('e1000000-0000-0000-0000-000000000019', 'A019', 'd1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000004', 'Akuarium Besar Set', 3000000, 3600000, 60, 60000, '2025-11-17', 'active', 45),
('e1000000-0000-0000-0000-000000000020', 'A020', 'd1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000005', 'Mesin Cetak Digital', 8500000, 10200000, 170, 60000, '2025-12-01', 'active', 30);

-- =========================================
-- 6. OPERATIONAL EXPENSES (Biaya Operasional Bulanan)
-- Rata-rata Rp 2.000.000/bulan
-- =========================================
INSERT INTO public.operational_expenses (description, amount, expense_date, category) VALUES
('Gaji Collector Januari', 1500000, '2025-01-31', 'Gaji'),
('Bensin Operasional Januari', 500000, '2025-01-31', 'Transportasi'),
('Gaji Collector Februari', 1500000, '2025-02-28', 'Gaji'),
('Bensin Operasional Februari', 500000, '2025-02-28', 'Transportasi'),
('Gaji Collector Maret', 1500000, '2025-03-31', 'Gaji'),
('Bensin Operasional Maret', 500000, '2025-03-31', 'Transportasi'),
('Gaji Collector April', 1500000, '2025-04-30', 'Gaji'),
('Bensin Operasional April', 500000, '2025-04-30', 'Transportasi'),
('Gaji Collector Mei', 1500000, '2025-05-31', 'Gaji'),
('Bensin Operasional Mei', 500000, '2025-05-31', 'Transportasi'),
('Gaji Collector Juni', 1500000, '2025-06-30', 'Gaji'),
('Bensin Operasional Juni', 500000, '2025-06-30', 'Transportasi'),
('Gaji Collector Juli', 1500000, '2025-07-31', 'Gaji'),
('Bensin Operasional Juli', 500000, '2025-07-31', 'Transportasi'),
('Gaji Collector Agustus', 1500000, '2025-08-31', 'Gaji'),
('Bensin Operasional Agustus', 500000, '2025-08-31', 'Transportasi'),
('Gaji Collector September', 1500000, '2025-09-30', 'Gaji'),
('Bensin Operasional September', 500000, '2025-09-30', 'Transportasi'),
('Gaji Collector Oktober', 1500000, '2025-10-31', 'Gaji'),
('Bensin Operasional Oktober', 500000, '2025-10-31', 'Transportasi'),
('Gaji Collector November', 1500000, '2025-11-30', 'Gaji'),
('Bensin Operasional November', 500000, '2025-11-30', 'Transportasi'),
('Gaji Collector Desember', 1500000, '2025-12-31', 'Gaji'),
('Bensin Operasional Desember', 500000, '2025-12-31', 'Transportasi');