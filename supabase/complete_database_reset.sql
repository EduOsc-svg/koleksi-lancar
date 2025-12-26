-- =========================================
-- COMPLETE DATABASE RESET AND SAMPLE DATA
-- =========================================
-- This script first deletes all data, then inserts sample data
-- Use with caution in production environments!

-- =========================================
-- STEP 1: DELETE ALL EXISTING DATA
-- =========================================
BEGIN;

-- Delete data in reverse dependency order
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.routes;
DELETE FROM public.sales_agents;
DELETE FROM public.holidays;
DELETE FROM public.user_roles;

-- Verification after deletion
DO $$
DECLARE
    table_counts TEXT;
BEGIN
    SELECT string_agg(table_name || ': ' || record_count, ', ' ORDER BY table_name) INTO table_counts
    FROM (
        SELECT 'payment_logs' as table_name, COUNT(*)::text as record_count FROM public.payment_logs
        UNION ALL
        SELECT 'installment_coupons', COUNT(*)::text FROM public.installment_coupons
        UNION ALL
        SELECT 'credit_contracts', COUNT(*)::text FROM public.credit_contracts
        UNION ALL
        SELECT 'customers', COUNT(*)::text FROM public.customers
        UNION ALL
        SELECT 'routes', COUNT(*)::text FROM public.routes
        UNION ALL
        SELECT 'sales_agents', COUNT(*)::text FROM public.sales_agents
        UNION ALL
        SELECT 'holidays', COUNT(*)::text FROM public.holidays
        UNION ALL
        SELECT 'user_roles', COUNT(*)::text FROM public.user_roles
    ) counts;
    
    RAISE NOTICE 'Tables after deletion - %', table_counts;
END $$;

COMMIT;

-- =========================================
-- STEP 2: INSERT SAMPLE DATA
-- =========================================
BEGIN;

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

RAISE NOTICE 'Inserted % sales agents', (SELECT COUNT(*) FROM sales_agents);

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

RAISE NOTICE 'Inserted % routes', (SELECT COUNT(*) FROM routes);

-- =========================================
-- 3. HOLIDAYS (15 records)
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

RAISE NOTICE 'Inserted % holidays', (SELECT COUNT(*) FROM holidays);

-- =========================================
-- 4. CUSTOMERS (15 records)
-- =========================================
INSERT INTO public.customers (id, name, address, phone, customer_code, assigned_sales_id, route_id) VALUES
(gen_random_uuid(), 'Ayu Lestari', 'Jl. Mawar No. 12, Karawang Timur', '087654321001', 'C001', 
 (SELECT id FROM sales_agents WHERE agent_code = 'S001' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT001' LIMIT 1)),
(gen_random_uuid(), 'Bambang Sutrisno', 'Jl. Melati No. 25, Karawang Barat', '087654321002', 'C002',
 (SELECT id FROM sales_agents WHERE agent_code = 'S002' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT002' LIMIT 1)),
(gen_random_uuid(), 'Citra Dewi', 'Jl. Anggrek No. 8, Bekasi Utara', '087654321003', 'C003',
 (SELECT id FROM sales_agents WHERE agent_code = 'S003' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT003' LIMIT 1)),
(gen_random_uuid(), 'Dedi Kurniawan', 'Jl. Kenanga No. 15, Bekasi Selatan', '087654321004', 'C004',
 (SELECT id FROM sales_agents WHERE agent_code = 'S004' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT004' LIMIT 1)),
(gen_random_uuid(), 'Erna Sari', 'Jl. Dahlia No. 30, Cibitung', '087654321005', 'C005',
 (SELECT id FROM sales_agents WHERE agent_code = 'S005' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT005' LIMIT 1)),
(gen_random_uuid(), 'Fajar Nugraha', 'Jl. Tulip No. 7, Cikarang', '087654321006', 'C006',
 (SELECT id FROM sales_agents WHERE agent_code = 'S006' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT006' LIMIT 1)),
(gen_random_uuid(), 'Gita Purnama', 'Jl. Sakura No. 22, Tambun', '087654321007', 'C007',
 (SELECT id FROM sales_agents WHERE agent_code = 'S007' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT007' LIMIT 1)),
(gen_random_uuid(), 'Hendra Wijaya', 'Jl. Flamboyan No. 18, Rawa Lumbu', '087654321008', 'C008',
 (SELECT id FROM sales_agents WHERE agent_code = 'S008' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT008' LIMIT 1)),
(gen_random_uuid(), 'Indah Permata', 'Jl. Cempaka No. 11, Teluk Pucung', '087654321009', 'C009',
 (SELECT id FROM sales_agents WHERE agent_code = 'S009' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT009' LIMIT 1)),
(gen_random_uuid(), 'Jaka Prasetya', 'Jl. Bougenvil No. 28, Klari', '087654321010', 'C010',
 (SELECT id FROM sales_agents WHERE agent_code = 'S010' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT010' LIMIT 1)),
(gen_random_uuid(), 'Kartika Sari', 'Jl. Kamboja No. 5, Karawang Timur', '087654321011', 'C011',
 (SELECT id FROM sales_agents WHERE agent_code = 'S001' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT001' LIMIT 1)),
(gen_random_uuid(), 'Lukman Hakim', 'Jl. Alamanda No. 33, Karawang Barat', '087654321012', 'C012',
 (SELECT id FROM sales_agents WHERE agent_code = 'S002' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT002' LIMIT 1)),
(gen_random_uuid(), 'Maya Sari', 'Jl. Bougenville No. 14, Bekasi Utara', '087654321013', 'C013',
 (SELECT id FROM sales_agents WHERE agent_code = 'S003' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT003' LIMIT 1)),
(gen_random_uuid(), 'Nanda Pratama', 'Jl. Teratai No. 20, Bekasi Selatan', '087654321014', 'C014',
 (SELECT id FROM sales_agents WHERE agent_code = 'S004' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT004' LIMIT 1)),
(gen_random_uuid(), 'Octavia Putri', 'Jl. Seroja No. 9, Cibitung', '087654321015', 'C015',
 (SELECT id FROM sales_agents WHERE agent_code = 'S005' LIMIT 1),
 (SELECT id FROM routes WHERE code = 'RT005' LIMIT 1));

RAISE NOTICE 'Inserted % customers', (SELECT COUNT(*) FROM customers);

-- =========================================
-- 5. CREDIT CONTRACTS (12 records)
-- =========================================
INSERT INTO public.credit_contracts (id, contract_ref, customer_id, product_type, total_loan_amount, omset, tenor_days, daily_installment_amount, current_installment_index, status, start_date) VALUES
(gen_random_uuid(), 'KNT-2024-001', 
 (SELECT id FROM customers WHERE customer_code = 'C001' LIMIT 1),
 'Elektronik', 5000000, 6000000, 100, 50000, 15, 'active', '2024-11-01'),
(gen_random_uuid(), 'KNT-2024-002',
 (SELECT id FROM customers WHERE customer_code = 'C002' LIMIT 1),
 'Furniture', 8000000, 9600000, 120, 66667, 25, 'active', '2024-10-15'),
(gen_random_uuid(), 'KNT-2024-003',
 (SELECT id FROM customers WHERE customer_code = 'C003' LIMIT 1),
 'Motor', 12000000, 14400000, 150, 80000, 30, 'active', '2024-10-01'),
(gen_random_uuid(), 'KNT-2024-004',
 (SELECT id FROM customers WHERE customer_code = 'C004' LIMIT 1),
 'Handphone', 3000000, 3600000, 60, 50000, 45, 'active', '2024-11-15'),
(gen_random_uuid(), 'KNT-2024-005',
 (SELECT id FROM customers WHERE customer_code = 'C005' LIMIT 1),
 'Perabotan', 6000000, 7200000, 100, 60000, 20, 'active', '2024-11-10'),
(gen_random_uuid(), 'KNT-2024-006',
 (SELECT id FROM customers WHERE customer_code = 'C006' LIMIT 1),
 'Laptop', 10000000, 12000000, 100, 100000, 10, 'active', '2024-12-01'),
(gen_random_uuid(), 'KNT-2024-007',
 (SELECT id FROM customers WHERE customer_code = 'C007' LIMIT 1),
 'Kulkas', 7000000, 8400000, 90, 77778, 60, 'active', '2024-09-15'),
(gen_random_uuid(), 'KNT-2024-008',
 (SELECT id FROM customers WHERE customer_code = 'C008' LIMIT 1),
 'AC', 4000000, 4800000, 80, 50000, 70, 'active', '2024-09-01'),
(gen_random_uuid(), 'KNT-2024-009',
 (SELECT id FROM customers WHERE customer_code = 'C009' LIMIT 1),
 'TV', 5500000, 6600000, 110, 50000, 35, 'active', '2024-10-20'),
(gen_random_uuid(), 'KNT-2023-010',
 (SELECT id FROM customers WHERE customer_code = 'C010' LIMIT 1),
 'Mesin Cuci', 6500000, 7800000, 100, 65000, 95, 'active', '2023-12-15'),
(gen_random_uuid(), 'KNT-2023-011',
 (SELECT id FROM customers WHERE customer_code = 'C011' LIMIT 1),
 'Smartphone', 8000000, 9600000, 80, 100000, 80, 'completed', '2023-10-01'),
(gen_random_uuid(), 'KNT-2024-012',
 (SELECT id FROM customers WHERE customer_code = 'C012' LIMIT 1),
 'Sepeda Motor', 15000000, 18000000, 120, 125000, 40, 'active', '2024-09-10');

RAISE NOTICE 'Inserted % credit contracts', (SELECT COUNT(*) FROM credit_contracts);

-- =========================================
-- 6. PAYMENT LOGS (25 records)
-- =========================================
INSERT INTO public.payment_logs (id, contract_id, payment_date, installment_index, amount_paid) VALUES
-- Recent payments for dashboard trends
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-001' LIMIT 1), CURRENT_DATE - 5, 11, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-001' LIMIT 1), CURRENT_DATE - 4, 12, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-002' LIMIT 1), CURRENT_DATE - 3, 23, 66667),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-003' LIMIT 1), CURRENT_DATE - 2, 28, 80000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), CURRENT_DATE - 1, 7, 100000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-004' LIMIT 1), CURRENT_DATE, 46, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-005' LIMIT 1), CURRENT_DATE, 21, 60000),
-- Historical payments
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-001' LIMIT 1), '2024-11-01', 1, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-001' LIMIT 1), '2024-11-02', 2, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-002' LIMIT 1), '2024-10-15', 1, 66667),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-002' LIMIT 1), '2024-10-16', 2, 66667),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-003' LIMIT 1), '2024-10-01', 1, 80000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-003' LIMIT 1), '2024-10-02', 2, 80000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), '2024-12-01', 1, 100000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), '2024-12-02', 2, 100000),
-- More spread out payments
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-007' LIMIT 1), '2024-12-20', 61, 77778),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-008' LIMIT 1), '2024-12-21', 71, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-009' LIMIT 1), '2024-12-22', 36, 50000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-012' LIMIT 1), '2024-12-23', 41, 125000),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2023-011' LIMIT 1), '2023-12-28', 80, 100000);

RAISE NOTICE 'Inserted % payment logs', (SELECT COUNT(*) FROM payment_logs);

-- =========================================
-- 7. INSTALLMENT COUPONS (Sample set)
-- =========================================
INSERT INTO public.installment_coupons (id, contract_id, installment_index, due_date, amount, status) VALUES
-- Coupons for KNT-2024-006 (active contract)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), 1, '2024-12-01', 100000, 'paid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), 2, '2024-12-02', 100000, 'paid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), 3, '2024-12-03', 100000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), 4, '2024-12-04', 100000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-006' LIMIT 1), 5, '2024-12-05', 100000, 'unpaid'),
-- Coupons for KNT-2024-004 (near completion)
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-004' LIMIT 1), 56, '2024-12-28', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-004' LIMIT 1), 57, '2024-12-31', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-004' LIMIT 1), 58, '2025-01-02', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-004' LIMIT 1), 59, '2025-01-03', 50000, 'unpaid'),
(gen_random_uuid(), (SELECT id FROM credit_contracts WHERE contract_ref = 'KNT-2024-004' LIMIT 1), 60, '2025-01-06', 50000, 'unpaid');

RAISE NOTICE 'Inserted % installment coupons', (SELECT COUNT(*) FROM installment_coupons);

COMMIT;

-- =========================================
-- FINAL VERIFICATION AND SUMMARY
-- =========================================
SELECT 
    '=== DATABASE POPULATED SUCCESSFULLY ===' as status;

SELECT 
    'Table Name' as category,
    'Record Count' as value
UNION ALL
SELECT 'sales_agents', COUNT(*)::text FROM public.sales_agents
UNION ALL
SELECT 'routes', COUNT(*)::text FROM public.routes
UNION ALL
SELECT 'customers', COUNT(*)::text FROM public.customers
UNION ALL
SELECT 'holidays', COUNT(*)::text FROM public.holidays
UNION ALL
SELECT 'credit_contracts', COUNT(*)::text FROM public.credit_contracts
UNION ALL
SELECT 'payment_logs', COUNT(*)::text FROM public.payment_logs
UNION ALL
SELECT 'installment_coupons', COUNT(*)::text FROM public.installment_coupons
UNION ALL
SELECT '=== BUSINESS METRICS ===', ''
UNION ALL
SELECT 'Total Omset', TO_CHAR(SUM(omset), 'FM999,999,999,999') FROM credit_contracts
UNION ALL
SELECT 'Total Loans', TO_CHAR(SUM(total_loan_amount), 'FM999,999,999,999') FROM credit_contracts
UNION ALL
SELECT 'Total Collected', TO_CHAR(SUM(amount_paid), 'FM999,999,999,999') FROM payment_logs
UNION ALL
SELECT 'Active Contracts', COUNT(*)::text FROM credit_contracts WHERE status = 'active'
UNION ALL
SELECT 'Unpaid Coupons', COUNT(*)::text FROM installment_coupons WHERE status = 'unpaid';

SELECT '=== SAMPLE DATA READY FOR TESTING ===' as final_status;