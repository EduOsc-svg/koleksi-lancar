-- =========================================
-- COMPREHENSIVE SAMPLE DATA - 200 CONTRACTS
-- Total Modal: ~1 Miliar IDR
-- 100 for 2025, 100 for 2026
-- =========================================

-- First, ensure we have sales agents and collectors
-- Check existing or insert if needed
INSERT INTO public.sales_agents (id, agent_code, name, phone, commission_percentage)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'S001', 'Ahmad Salesman', '081234567001', 5),
  ('a2222222-2222-2222-2222-222222222222', 'S002', 'Budi Penjual', '081234567002', 5),
  ('a3333333-3333-3333-3333-333333333333', 'S003', 'Citra Sales', '081234567003', 5),
  ('a4444444-4444-4444-4444-444444444444', 'S004', 'Dewi Marketing', '081234567004', 5),
  ('a5555555-5555-5555-5555-555555555555', 'S005', 'Eko Jualan', '081234567005', 5)
ON CONFLICT (agent_code) DO NOTHING;

INSERT INTO public.collectors (id, collector_code, name, phone)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'K01', 'Kolektor Andi', '081987654001'),
  ('c2222222-2222-2222-2222-222222222222', 'K02', 'Kolektor Bambang', '081987654002'),
  ('c3333333-3333-3333-3333-333333333333', 'K03', 'Kolektor Cahyo', '081987654003')
ON CONFLICT (collector_code) DO NOTHING;

-- =========================================
-- CUSTOMERS & CONTRACTS FOR 2025 (100 records)
-- These are mostly COMPLETED (lunas)
-- =========================================

DO $$
DECLARE
  v_customer_id UUID;
  v_contract_id UUID;
  v_sales_ids UUID[] := ARRAY[
    'a1111111-1111-1111-1111-111111111111'::UUID,
    'a2222222-2222-2222-2222-222222222222'::UUID,
    'a3333333-3333-3333-3333-333333333333'::UUID,
    'a4444444-4444-4444-4444-444444444444'::UUID,
    'a5555555-5555-5555-5555-555555555555'::UUID
  ];
  v_collector_ids UUID[] := ARRAY[
    'c1111111-1111-1111-1111-111111111111'::UUID,
    'c2222222-2222-2222-2222-222222222222'::UUID,
    'c3333333-3333-3333-3333-333333333333'::UUID
  ];
  v_tenors INT[] := ARRAY[30, 50, 60, 90, 100];
  v_products TEXT[] := ARRAY['Elektronik', 'Furniture', 'Handphone', 'Laptop', 'Perabotan', 'Motor', 'Mesin Jahit', 'Kulkas', 'TV', 'AC'];
  v_names TEXT[] := ARRAY['Siti', 'Rina', 'Dewi', 'Sri', 'Ani', 'Yuni', 'Tuti', 'Lina', 'Wati', 'Ningsih', 'Ratna', 'Indah', 'Fitri', 'Maya', 'Dian', 'Lia', 'Nani', 'Sari', 'Rini', 'Yanti'];
  v_surnames TEXT[] := ARRAY['Wijaya', 'Susanto', 'Hartono', 'Setiawan', 'Kurniawan', 'Pratama', 'Saputra', 'Wibowo', 'Hidayat', 'Santoso'];
  
  v_modal NUMERIC;
  v_omset NUMERIC;
  v_tenor INT;
  v_daily_amount NUMERIC;
  v_start_date DATE;
  v_sales_id UUID;
  v_collector_id UUID;
  v_product TEXT;
  v_customer_name TEXT;
  v_customer_code TEXT;
  v_contract_ref TEXT;
  v_i INT;
  v_coupon_date DATE;
  v_coupon_index INT;
  v_coupon_id UUID;
BEGIN
  FOR v_i IN 1..100 LOOP
    -- Generate random data for 2025
    v_modal := (3000000 + floor(random() * 12000000))::NUMERIC; -- 3M to 15M
    v_omset := v_modal * 1.2; -- 20% margin
    v_tenor := v_tenors[1 + floor(random() * 5)::INT];
    v_daily_amount := ROUND(v_omset / v_tenor, 0);
    v_start_date := '2025-01-01'::DATE + (floor(random() * 300))::INT; -- Random date in 2025
    v_sales_id := v_sales_ids[1 + floor(random() * 5)::INT];
    v_collector_id := v_collector_ids[1 + floor(random() * 3)::INT];
    v_product := v_products[1 + floor(random() * 10)::INT];
    v_customer_name := v_names[1 + floor(random() * 20)::INT] || ' ' || v_surnames[1 + floor(random() * 10)::INT];
    v_customer_code := 'C' || LPAD(v_i::TEXT, 3, '0');
    v_contract_ref := 'A' || LPAD(v_i::TEXT, 3, '0');
    
    -- Insert customer
    v_customer_id := gen_random_uuid();
    INSERT INTO public.customers (id, customer_code, name, phone, address, business_address)
    VALUES (
      v_customer_id,
      v_customer_code,
      v_customer_name,
      '08' || (1000000000 + floor(random() * 9000000000))::BIGINT,
      'Jl. Raya No.' || (1 + floor(random() * 100))::INT || ', RT ' || (1 + floor(random() * 10))::INT || '/RW ' || (1 + floor(random() * 5))::INT,
      'Pasar ' || v_surnames[1 + floor(random() * 10)::INT] || ' Blok ' || CHR(65 + floor(random() * 10)::INT) || (1 + floor(random() * 50))::INT
    );
    
    -- Insert contract (completed for 2025)
    v_contract_id := gen_random_uuid();
    INSERT INTO public.credit_contracts (id, contract_ref, customer_id, sales_agent_id, product_type, total_loan_amount, omset, tenor_days, daily_installment_amount, start_date, status, current_installment_index)
    VALUES (
      v_contract_id,
      v_contract_ref,
      v_customer_id,
      v_sales_id,
      v_product,
      v_modal,
      v_omset,
      v_tenor,
      v_daily_amount,
      v_start_date,
      'completed',
      v_tenor
    );
    
    -- Generate coupons and payments (all paid for 2025)
    v_coupon_date := v_start_date;
    FOR v_coupon_index IN 1..v_tenor LOOP
      -- Skip Sundays
      WHILE EXTRACT(DOW FROM v_coupon_date) = 0 LOOP
        v_coupon_date := v_coupon_date + 1;
      END LOOP;
      
      v_coupon_id := gen_random_uuid();
      
      -- Insert coupon as paid
      INSERT INTO public.installment_coupons (id, contract_id, installment_index, due_date, amount, status)
      VALUES (v_coupon_id, v_contract_id, v_coupon_index, v_coupon_date, v_daily_amount, 'paid');
      
      -- Insert payment log
      INSERT INTO public.payment_logs (contract_id, coupon_id, installment_index, amount_paid, payment_date, collector_id)
      VALUES (v_contract_id, v_coupon_id, v_coupon_index, v_daily_amount, v_coupon_date, v_collector_id);
      
      v_coupon_date := v_coupon_date + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ 100 customers and contracts for 2025 created (all completed)';
END $$;

-- =========================================
-- CUSTOMERS & CONTRACTS FOR 2026 (100 records)
-- These are ACTIVE with partial payments
-- =========================================

DO $$
DECLARE
  v_customer_id UUID;
  v_contract_id UUID;
  v_sales_ids UUID[] := ARRAY[
    'a1111111-1111-1111-1111-111111111111'::UUID,
    'a2222222-2222-2222-2222-222222222222'::UUID,
    'a3333333-3333-3333-3333-333333333333'::UUID,
    'a4444444-4444-4444-4444-444444444444'::UUID,
    'a5555555-5555-5555-5555-555555555555'::UUID
  ];
  v_collector_ids UUID[] := ARRAY[
    'c1111111-1111-1111-1111-111111111111'::UUID,
    'c2222222-2222-2222-2222-222222222222'::UUID,
    'c3333333-3333-3333-3333-333333333333'::UUID
  ];
  v_tenors INT[] := ARRAY[30, 50, 60, 90, 100];
  v_products TEXT[] := ARRAY['Elektronik', 'Furniture', 'Handphone', 'Laptop', 'Perabotan', 'Motor', 'Mesin Jahit', 'Kulkas', 'TV', 'AC'];
  v_names TEXT[] := ARRAY['Siti', 'Rina', 'Dewi', 'Sri', 'Ani', 'Yuni', 'Tuti', 'Lina', 'Wati', 'Ningsih', 'Ratna', 'Indah', 'Fitri', 'Maya', 'Dian', 'Lia', 'Nani', 'Sari', 'Rini', 'Yanti'];
  v_surnames TEXT[] := ARRAY['Wijaya', 'Susanto', 'Hartono', 'Setiawan', 'Kurniawan', 'Pratama', 'Saputra', 'Wibowo', 'Hidayat', 'Santoso'];
  
  v_modal NUMERIC;
  v_omset NUMERIC;
  v_tenor INT;
  v_daily_amount NUMERIC;
  v_start_date DATE;
  v_sales_id UUID;
  v_collector_id UUID;
  v_product TEXT;
  v_customer_name TEXT;
  v_customer_code TEXT;
  v_contract_ref TEXT;
  v_i INT;
  v_coupon_date DATE;
  v_coupon_index INT;
  v_coupon_id UUID;
  v_paid_count INT;
  v_today DATE := CURRENT_DATE;
BEGIN
  FOR v_i IN 101..200 LOOP
    -- Generate random data for 2026
    v_modal := (3000000 + floor(random() * 12000000))::NUMERIC; -- 3M to 15M
    v_omset := v_modal * 1.2; -- 20% margin
    v_tenor := v_tenors[1 + floor(random() * 5)::INT];
    v_daily_amount := ROUND(v_omset / v_tenor, 0);
    v_start_date := '2026-01-01'::DATE + (floor(random() * 30))::INT; -- First month of 2026
    v_sales_id := v_sales_ids[1 + floor(random() * 5)::INT];
    v_collector_id := v_collector_ids[1 + floor(random() * 3)::INT];
    v_product := v_products[1 + floor(random() * 10)::INT];
    v_customer_name := v_names[1 + floor(random() * 20)::INT] || ' ' || v_surnames[1 + floor(random() * 10)::INT];
    v_customer_code := 'C' || LPAD(v_i::TEXT, 3, '0');
    v_contract_ref := 'A' || LPAD(v_i::TEXT, 3, '0');
    
    -- Calculate how many should be paid (based on days elapsed from start)
    v_paid_count := GREATEST(0, LEAST(v_tenor, (v_today - v_start_date)::INT - 5 + floor(random() * 10)::INT));
    
    -- Insert customer
    v_customer_id := gen_random_uuid();
    INSERT INTO public.customers (id, customer_code, name, phone, address, business_address)
    VALUES (
      v_customer_id,
      v_customer_code,
      v_customer_name,
      '08' || (1000000000 + floor(random() * 9000000000))::BIGINT,
      'Jl. Merdeka No.' || (1 + floor(random() * 100))::INT || ', Kel. ' || v_surnames[1 + floor(random() * 10)::INT],
      'Toko ' || v_names[1 + floor(random() * 20)::INT] || ' - Pasar ' || v_surnames[1 + floor(random() * 10)::INT]
    );
    
    -- Insert contract (active for 2026)
    v_contract_id := gen_random_uuid();
    INSERT INTO public.credit_contracts (id, contract_ref, customer_id, sales_agent_id, product_type, total_loan_amount, omset, tenor_days, daily_installment_amount, start_date, status, current_installment_index)
    VALUES (
      v_contract_id,
      v_contract_ref,
      v_customer_id,
      v_sales_id,
      v_product,
      v_modal,
      v_omset,
      v_tenor,
      v_daily_amount,
      v_start_date,
      'active',
      GREATEST(0, v_paid_count)
    );
    
    -- Generate all coupons
    v_coupon_date := v_start_date;
    FOR v_coupon_index IN 1..v_tenor LOOP
      -- Skip Sundays
      WHILE EXTRACT(DOW FROM v_coupon_date) = 0 LOOP
        v_coupon_date := v_coupon_date + 1;
      END LOOP;
      
      v_coupon_id := gen_random_uuid();
      
      IF v_coupon_index <= v_paid_count THEN
        -- Paid coupon
        INSERT INTO public.installment_coupons (id, contract_id, installment_index, due_date, amount, status)
        VALUES (v_coupon_id, v_contract_id, v_coupon_index, v_coupon_date, v_daily_amount, 'paid');
        
        -- Payment log
        INSERT INTO public.payment_logs (contract_id, coupon_id, installment_index, amount_paid, payment_date, collector_id)
        VALUES (v_contract_id, v_coupon_id, v_coupon_index, v_daily_amount, v_coupon_date, v_collector_id);
      ELSE
        -- Unpaid coupon
        INSERT INTO public.installment_coupons (id, contract_id, installment_index, due_date, amount, status)
        VALUES (v_coupon_id, v_contract_id, v_coupon_index, v_coupon_date, v_daily_amount, 'unpaid');
      END IF;
      
      v_coupon_date := v_coupon_date + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ 100 customers and contracts for 2026 created (active with partial payments)';
END $$;

-- =========================================
-- OPERATIONAL EXPENSES SAMPLE DATA
-- =========================================
INSERT INTO public.operational_expenses (expense_date, description, amount, category, notes)
VALUES 
  -- 2025 expenses
  ('2025-01-15', 'Bensin Kolektor', 500000, 'Transport', 'Biaya transport bulanan'),
  ('2025-02-10', 'Pulsa & Internet', 300000, 'Komunikasi', NULL),
  ('2025-03-20', 'Maintenance Motor', 750000, 'Kendaraan', 'Service rutin'),
  ('2025-04-05', 'ATK dan Materai', 200000, 'Operasional', NULL),
  ('2025-05-12', 'Bensin Kolektor', 550000, 'Transport', NULL),
  ('2025-06-08', 'Pulsa & Internet', 300000, 'Komunikasi', NULL),
  ('2025-07-22', 'Gaji Karyawan', 3000000, 'Gaji', 'Gaji bulanan'),
  ('2025-08-14', 'Bensin Kolektor', 600000, 'Transport', NULL),
  ('2025-09-03', 'Perbaikan Printer', 450000, 'Peralatan', NULL),
  ('2025-10-18', 'Bensin Kolektor', 550000, 'Transport', NULL),
  ('2025-11-25', 'Pulsa & Internet', 350000, 'Komunikasi', NULL),
  ('2025-12-10', 'THR Karyawan', 5000000, 'Gaji', 'Tunjangan hari raya'),
  -- 2026 expenses
  ('2026-01-05', 'Bensin Kolektor', 600000, 'Transport', 'Biaya awal tahun'),
  ('2026-01-20', 'Pulsa & Internet', 350000, 'Komunikasi', NULL),
  ('2026-02-01', 'Gaji Karyawan', 3500000, 'Gaji', 'Gaji bulanan Februari');

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
SELECT 'SUMMARY' as section;
SELECT 
  (SELECT COUNT(*) FROM public.customers) as total_customers,
  (SELECT COUNT(*) FROM public.credit_contracts) as total_contracts,
  (SELECT COUNT(*) FROM public.credit_contracts WHERE status = 'completed') as completed_contracts,
  (SELECT COUNT(*) FROM public.credit_contracts WHERE status = 'active') as active_contracts,
  (SELECT COUNT(*) FROM public.installment_coupons) as total_coupons,
  (SELECT COUNT(*) FROM public.payment_logs) as total_payments;

SELECT 'FINANCIAL SUMMARY' as section;
SELECT 
  SUM(total_loan_amount) as total_modal,
  SUM(omset) as total_omset,
  SUM(omset - total_loan_amount) as total_profit,
  SUM(omset * 0.05) as total_commission
FROM public.credit_contracts;

SELECT 'BY YEAR' as section;
SELECT 
  EXTRACT(YEAR FROM start_date) as year,
  COUNT(*) as contracts,
  SUM(total_loan_amount) as modal,
  SUM(omset) as omset,
  SUM(omset - total_loan_amount) as profit
FROM public.credit_contracts
GROUP BY EXTRACT(YEAR FROM start_date)
ORDER BY year;

SELECT 'BY SALES AGENT' as section;
SELECT 
  sa.agent_code,
  sa.name,
  COUNT(cc.id) as contracts,
  SUM(cc.total_loan_amount) as modal,
  SUM(cc.omset) as omset
FROM public.sales_agents sa
LEFT JOIN public.credit_contracts cc ON cc.sales_agent_id = sa.id
GROUP BY sa.id, sa.agent_code, sa.name
ORDER BY sa.agent_code;

SELECT '✅ ALL DATA INSERTED SUCCESSFULLY!' as status;
