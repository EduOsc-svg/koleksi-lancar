
-- =========================================
-- 1. SALES AGENTS (10 records)
-- =========================================
INSERT INTO public.sales_agents (id, agent_code, name, phone, commission_percentage) VALUES
(gen_random_uuid(), 'S001', 'Ahmad Rizky', '081234567890', 5.0),
(gen_random_uuid(), 'S002', 'Siti Nurhaliza', '081234567891', 4.5),
(gen_random_uuid(), 'S003', 'Budi Santoso', '081234567892', 5.5),
(gen_random_uuid(), 'S004', 'Dewi Kartika', '081234567893', 4.0),
(gen_random_uuid(), 'S005', 'Eko Prasetyo', '081234567894', 6.0),
(gen_random_uuid(), 'S006', 'Fitri Handayani', '081234567895', 4.5),
(gen_random_uuid(), 'S007', 'Gunawan Wijaya', '081234567896', 5.0),
(gen_random_uuid(), 'S008', 'Hesti Purwanti', '081234567897', 5.5),
(gen_random_uuid(), 'S009', 'Indra Kusuma', '081234567898', 4.0),
(gen_random_uuid(), 'S010', 'Joko Susilo', '081234567899', 6.0);

-- =========================================
-- 2. ROUTES (10 records)
-- =========================================
INSERT INTO public.routes (id, code, name, default_collector_id) VALUES
(gen_random_uuid(), 'RT001', 'Rute Karawang Timur', (SELECT id FROM sales_agents WHERE agent_code = 'S001' LIMIT 1)),
(gen_random_uuid(), 'RT002', 'Rute Karawang Barat', (SELECT id FROM sales_agents WHERE agent_code = 'S002' LIMIT 1)),
(gen_random_uuid(), 'RT003', 'Rute Bekasi Utara', (SELECT id FROM sales_agents WHERE agent_code = 'S003' LIMIT 1)),
(gen_random_uuid(), 'RT004', 'Rute Bekasi Selatan', (SELECT id FROM sales_agents WHERE agent_code = 'S004' LIMIT 1)),
(gen_random_uuid(), 'RT005', 'Rute Cibitung', (SELECT id FROM sales_agents WHERE agent_code = 'S005' LIMIT 1)),
(gen_random_uuid(), 'RT006', 'Rute Cikarang', (SELECT id FROM sales_agents WHERE agent_code = 'S006' LIMIT 1)),
(gen_random_uuid(), 'RT007', 'Rute Tambun', (SELECT id FROM sales_agents WHERE agent_code = 'S007' LIMIT 1)),
(gen_random_uuid(), 'RT008', 'Rute Rawa Lumbu', (SELECT id FROM sales_agents WHERE agent_code = 'S008' LIMIT 1)),
(gen_random_uuid(), 'RT009', 'Rute Teluk Pucung', (SELECT id FROM sales_agents WHERE agent_code = 'S009' LIMIT 1)),
(gen_random_uuid(), 'RT010', 'Rute Klari', (SELECT id FROM sales_agents WHERE agent_code = 'S010' LIMIT 1));

-- =========================================
-- 3. CUSTOMERS (15 records - more realistic)
-- =========================================
INSERT INTO public.customers (id, name, address, phone, nik, customer_code, assigned_sales_id, route_id) VALUES
(gen_random_uuid(), 'Ayu Lestari', 'Jl. Mawar No. 12, Karawang Timur', '087654321001', '3275012345678901', 'K01', 
 (SELECT id FROM sales_agents WHERE agent_code = 'S001' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT001' LIMIT 1)),

(gen_random_uuid(), 'Bambang Sutrisno', 'Jl. Melati No. 25, Karawang Barat', '087654321002', '3275023456789012', 'K02',
 (SELECT id FROM sales_agents WHERE agent_code = 'S002' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT002' LIMIT 1)),

(gen_random_uuid(), 'Citra Dewi', 'Jl. Anggrek No. 8, Bekasi Utara', '087654321003', '3275034567890123', 'K03',
 (SELECT id FROM sales_agents WHERE agent_code = 'S003' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT003' LIMIT 1)),

(gen_random_uuid(), 'Dedi Kurniawan', 'Jl. Kenanga No. 15, Bekasi Selatan', '087654321004', '3275045678901234', 'K04',
 (SELECT id FROM sales_agents WHERE agent_code = 'S004' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT004' LIMIT 1)),

(gen_random_uuid(), 'Erna Sari', 'Jl. Dahlia No. 30, Cibitung', '087654321005', '3275055678901235', 'K05',
 (SELECT id FROM sales_agents WHERE agent_code = 'S005' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT005' LIMIT 1)),

(gen_random_uuid(), 'Fajar Nugraha', 'Jl. Tulip No. 7, Cikarang', '087654321006', '3275066789012346', 'K06',
 (SELECT id FROM sales_agents WHERE agent_code = 'S006' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT006' LIMIT 1)),

(gen_random_uuid(), 'Gita Purnama', 'Jl. Sakura No. 22, Tambun', '087654321007', '3275077890123457', 'K07',
 (SELECT id FROM sales_agents WHERE agent_code = 'S007' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT007' LIMIT 1)),

(gen_random_uuid(), 'Hendra Wijaya', 'Jl. Flamboyan No. 18, Rawa Lumbu', '087654321008', '3275088901234568', 'K08',
 (SELECT id FROM sales_agents WHERE agent_code = 'S008' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT008' LIMIT 1)),

(gen_random_uuid(), 'Indah Permata', 'Jl. Cempaka No. 11, Teluk Pucung', '087654321009', '3275099012345679', 'K09',
 (SELECT id FROM sales_agents WHERE agent_code = 'S009' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT009' LIMIT 1)),

(gen_random_uuid(), 'Jaka Prasetya', 'Jl. Bougenvil No. 28, Klari', '087654321010', '3275100123456780', 'K10',
 (SELECT id FROM sales_agents WHERE agent_code = 'S010' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT010' LIMIT 1)),

(gen_random_uuid(), 'Kartika Sari', 'Jl. Kamboja No. 5, Karawang Timur', '087654321011', '3275111234567891', 'K11',
 (SELECT id FROM sales_agents WHERE agent_code = 'S001' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT001' LIMIT 1)),

(gen_random_uuid(), 'Lukman Hakim', 'Jl. Alamanda No. 33, Karawang Barat', '087654321012', '3275122345678902', 'K12',
 (SELECT id FROM sales_agents WHERE agent_code = 'S002' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT002' LIMIT 1)),

(gen_random_uuid(), 'Maya Sari', 'Jl. Bougenville No. 14, Bekasi Utara', '087654321013', '3275133456789013', 'K13',
 (SELECT id FROM sales_agents WHERE agent_code = 'S003' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT003' LIMIT 1)),

(gen_random_uuid(), 'Nanda Pratama', 'Jl. Teratai No. 20, Bekasi Selatan', '087654321014', '3275144567890124', 'K14',
 (SELECT id FROM sales_agents WHERE agent_code = 'S004' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT004' LIMIT 1)),

(gen_random_uuid(), 'Octavia Putri', 'Jl. Seroja No. 9, Cibitung', '087654321015', '3275155678901235', 'K15',
 (SELECT id FROM sales_agents WHERE agent_code = 'S005' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT005' LIMIT 1));

-- =========================================
-- 4. HOLIDAYS (15 records - mix of specific dates and recurring)
-- =========================================
INSERT INTO public.holidays (id, holiday_date, description, holiday_type, day_of_week) VALUES
-- Specific holidays (Indonesian national holidays 2025)
(gen_random_uuid(), '2025-01-01', 'Tahun Baru Masehi', 'specific_date', NULL),
(gen_random_uuid(), '2025-02-12', 'Tahun Baru Imlek', 'specific_date', NULL),
(gen_random_uuid(), '2025-03-29', 'Nyepi', 'specific_date', NULL),
(gen_random_uuid(), '2025-03-30', 'Wafat Isa Almasih', 'specific_date', NULL),
(gen_random_uuid(), '2025-04-01', 'Isra Miraj', 'specific_date', NULL),
(gen_random_uuid(), '2025-05-01', 'Hari Buruh', 'specific_date', NULL),
(gen_random_uuid(), '2025-05-29', 'Kenaikan Isa Almasih', 'specific_date', NULL),
(gen_random_uuid(), '2025-05-31', 'Idul Fitri', 'specific_date', NULL),
(gen_random_uuid(), '2025-06-01', 'Hari Kedua Idul Fitri', 'specific_date', NULL),
(gen_random_uuid(), '2025-06-17', 'Hari Raya Waisak', 'specific_date', NULL),
(gen_random_uuid(), '2025-08-07', 'Idul Adha', 'specific_date', NULL),
(gen_random_uuid(), '2025-08-17', 'Kemerdekaan RI', 'specific_date', NULL),
(gen_random_uuid(), '2025-08-28', 'Tahun Baru Islam', 'specific_date', NULL),

-- Recurring holidays (weekends)
(gen_random_uuid(), NULL, 'Hari Minggu (Weekend)', 'recurring_weekday', 0),
(gen_random_uuid(), NULL, 'Hari Sabtu (Weekend)', 'recurring_weekday', 6);

-- =========================================
-- 5. CREDIT CONTRACTS (12 records)
-- =========================================
INSERT INTO public.credit_contracts (id, contract_ref, customer_id, product_type, total_loan_amount, omset, tenor_days, daily_installment_amount, current_installment_index, status, start_date) VALUES
(gen_random_uuid(), 'A001', 
 (SELECT id FROM customers WHERE customer_code = 'K01' LIMIT 1),
 'Elektronik', 5000000, 6000000, 100, 50000, 15, 'active', '2025-01-15'),

(gen_random_uuid(), 'A002',
 (SELECT id FROM customers WHERE customer_code = 'K02' LIMIT 1),
 'Furniture', 8000000, 9600000, 120, 66667, 25, 'active', '2025-01-10'),

(gen_random_uuid(), 'A003',
 (SELECT id FROM customers WHERE customer_code = 'K03' LIMIT 1),
 'Motor', 12000000, 14400000, 150, 80000, 30, 'active', '2025-01-05'),

(gen_random_uuid(), 'A004',
 (SELECT id FROM customers WHERE customer_code = 'K04' LIMIT 1),
 'Handphone', 3000000, 3600000, 60, 50000, 45, 'active', '2025-01-20'),

(gen_random_uuid(), 'A005',
 (SELECT id FROM customers WHERE customer_code = 'K05' LIMIT 1),
 'Perabotan', 6000000, 7200000, 100, 60000, 20, 'active', '2025-02-01'),

(gen_random_uuid(), 'A006',
 (SELECT id FROM customers WHERE customer_code = 'K06' LIMIT 1),
 'Laptop', 10000000, 12000000, 100, 100000, 10, 'active', '2025-12-01'),

(gen_random_uuid(), 'A007',
 (SELECT id FROM customers WHERE customer_code = 'K07' LIMIT 1),
 'Kulkas', 7000000, 8400000, 90, 77778, 60, 'active', '2024-12-15'),

(gen_random_uuid(), 'A008',
 (SELECT id FROM customers WHERE customer_code = 'K08' LIMIT 1),
 'AC', 4000000, 4800000, 80, 50000, 70, 'active', '2024-12-01'),

(gen_random_uuid(), 'A009',
 (SELECT id FROM customers WHERE customer_code = 'K09' LIMIT 1),
 'TV', 5500000, 6600000, 110, 50000, 35, 'active', '2024-11-20'),

(gen_random_uuid(), 'KNT-2024-010',
 (SELECT id FROM customers WHERE customer_code = 'K10' LIMIT 1),
 'Mesin Cuci', 6500000, 7800000, 100, 65000, 95, 'active', '2024-10-15'),

(gen_random_uuid(), 'KNT-2024-011',
 (SELECT id FROM customers WHERE customer_code = 'K11' LIMIT 1),
 'Smartphone', 8000000, 9600000, 80, 100000, 80, 'completed', '2024-09-01'),

(gen_random_uuid(), 'A012',
 (SELECT id FROM customers WHERE customer_code = 'K12' LIMIT 1),
 'Sepeda Motor', 15000000, 18000000, 120, 125000, 40, 'active', '2024-11-10');

-- =========================================
-- 6. PAYMENT LOGS (25 records - various payments)
-- =========================================
INSERT INTO public.payment_logs (id, contract_id, payment_date, installment_index, amount_paid) VALUES
-- Payments for contract A001 (K01)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A001' LIMIT 1), '2025-01-15', 1, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A001' LIMIT 1), '2025-01-16', 2, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A001' LIMIT 1), '2025-01-17', 3, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A001' LIMIT 1), '2025-01-20', 4, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A001' LIMIT 1), '2025-01-21', 5, 50000),

-- Payments for contract A002 (K02)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A002' LIMIT 1), '2024-12-10', 1, 66667),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A002' LIMIT 1), '2024-12-11', 2, 66667),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A002' LIMIT 1), '2024-12-12', 3, 66667),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A002' LIMIT 1), '2024-12-13', 4, 66667),

-- Payments for contract A003 (K03)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A003' LIMIT 1), '2024-12-20', 1, 80000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A003' LIMIT 1), '2024-12-23', 2, 80000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A003' LIMIT 1), '2024-12-24', 3, 80000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A003' LIMIT 1), '2024-12-26', 4, 80000),

-- Payments for contract A006 (K06) - Recent contract
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), '2025-01-01', 1, 100000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), '2025-01-02', 2, 100000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), '2025-01-03', 3, 100000),

-- Payments for completed contract KNT-2024-010 (K11)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-010' LIMIT 1), '2024-10-01', 1, 100000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-010' LIMIT 1), '2024-10-02', 2, 100000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-010' LIMIT 1), '2024-10-03', 3, 100000),

-- Mixed payments from recent dates (for dashboard trends)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A008' LIMIT 1), '2024-12-25', 71, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A009' LIMIT 1), '2024-12-25', 36, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A012' LIMIT 1), '2024-12-26', 41, 125000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A007' LIMIT 1), '2024-12-26', 61, 77778),

-- Christmas day payments
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A004' LIMIT 1), '2024-12-25', 46, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A005' LIMIT 1), '2024-12-24', 21, 60000);

-- =========================================
-- 7. INSTALLMENT COUPONS (Sample for few contracts)
-- =========================================
-- Generate some sample coupons for contract A006 (recent contract)
INSERT INTO public.installment_coupons (id, contract_id, installment_index, due_date, amount, status) VALUES
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 1, '2025-01-01', 100000, 'paid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 2, '2025-01-02', 100000, 'paid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 3, '2025-01-03', 100000, 'paid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 4, '2025-01-06', 100000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 5, '2025-01-07', 100000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 6, '2025-01-08', 100000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 7, '2025-01-09', 100000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A006' LIMIT 1), 8, '2025-01-10', 100000, 'unpaid'),

-- Generate some coupons for contract A004 (shorter tenor, almost finished)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A004' LIMIT 1), 46, '2024-12-25', 50000, 'paid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A004' LIMIT 1), 47, '2025-01-02', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A004' LIMIT 1), 48, '2025-01-03', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A004' LIMIT 1), 49, '2025-01-06', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'A004' LIMIT 1), 50, '2025-01-07', 50000, 'unpaid');

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Check all tables have data
SELECT 'sales_agents' as table_name, COUNT(*) as record_count FROM public.sales_agents
UNION ALL
SELECT 'routes', COUNT(*) FROM public.routes
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'holidays', COUNT(*) FROM public.holidays
UNION ALL
SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL
SELECT 'payment_logs', COUNT(*) FROM public.payment_logs
UNION ALL
SELECT 'installment_coupons', COUNT(*) FROM public.installment_coupons
ORDER BY table_name;

-- Summary statistics
SELECT 
  'SUMMARY' as info,
  (SELECT COUNT(*) FROM sales_agents) as agents,
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM credit_contracts) as contracts,
  (SELECT COUNT(*) FROM payment_logs) as payments,
  (SELECT SUM(amount_paid) FROM payment_logs) as total_collected,
  (SELECT SUM(omset) FROM credit_contracts) as total_omset,
  (SELECT COUNT(*) FROM installment_coupons WHERE status = 'unpaid') as unpaid_coupons;