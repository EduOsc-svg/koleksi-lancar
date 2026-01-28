-- =========================================
-- RESET ALL DATA AND INSERT 200 DISTRIBUTED SAMPLE DATA (2025-2026)
-- =========================================

-- Clear existing data in reverse dependency order
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.collectors;
DELETE FROM public.sales_agents;
DELETE FROM public.activity_logs;
DELETE FROM public.operational_expenses;

-- =========================================
-- 1. SALES AGENTS (20 records)
-- =========================================
INSERT INTO public.sales_agents (id, agent_code, name, phone, commission_percentage) VALUES
(gen_random_uuid(), 'S001', 'Ahmad Rizky', '081234567001', 5.0),
(gen_random_uuid(), 'S002', 'Siti Nurhaliza', '081234567002', 4.5),
(gen_random_uuid(), 'S003', 'Budi Santoso', '081234567003', 5.5),
(gen_random_uuid(), 'S004', 'Dewi Kartika', '081234567004', 4.0),
(gen_random_uuid(), 'S005', 'Eko Prasetyo', '081234567005', 6.0),
(gen_random_uuid(), 'S006', 'Fitri Handayani', '081234567006', 4.5),
(gen_random_uuid(), 'S007', 'Gunawan Wijaya', '081234567007', 5.0),
(gen_random_uuid(), 'S008', 'Hesti Purwanti', '081234567008', 5.5),
(gen_random_uuid(), 'S009', 'Indra Kusuma', '081234567009', 4.0),
(gen_random_uuid(), 'S010', 'Joko Susilo', '081234567010', 6.0),
(gen_random_uuid(), 'S011', 'Kartini Sari', '081234567011', 5.0),
(gen_random_uuid(), 'S012', 'Lukman Hakim', '081234567012', 4.5),
(gen_random_uuid(), 'S013', 'Maya Anggraini', '081234567013', 5.5),
(gen_random_uuid(), 'S014', 'Nanda Pratama', '081234567014', 4.0),
(gen_random_uuid(), 'S015', 'Oscar Perdana', '081234567015', 6.0),
(gen_random_uuid(), 'S016', 'Putri Amelia', '081234567016', 4.5),
(gen_random_uuid(), 'S017', 'Qori Rahman', '081234567017', 5.0),
(gen_random_uuid(), 'S018', 'Rina Marlina', '081234567018', 5.5),
(gen_random_uuid(), 'S019', 'Surya Dharma', '081234567019', 4.0),
(gen_random_uuid(), 'S020', 'Tika Permata', '081234567020', 6.0);

-- =========================================
-- 2. COLLECTORS (50 records)
-- =========================================
INSERT INTO public.collectors (id, collector_code, name, phone) VALUES
(gen_random_uuid(), 'K01', 'Andi Firmansyah', '082134567001'),
(gen_random_uuid(), 'K02', 'Bambang Irawan', '082134567002'),
(gen_random_uuid(), 'K03', 'Cahyo Purnomo', '082134567003'),
(gen_random_uuid(), 'K04', 'Darmawan Salim', '082134567004'),
(gen_random_uuid(), 'K05', 'Erwin Saputra', '082134567005'),
(gen_random_uuid(), 'K06', 'Fadli Ramadhan', '082134567006'),
(gen_random_uuid(), 'K07', 'Gilang Pratama', '082134567007'),
(gen_random_uuid(), 'K08', 'Haris Munandar', '082134567008'),
(gen_random_uuid(), 'K09', 'Irfan Habibi', '082134567009'),
(gen_random_uuid(), 'K10', 'Johan Effendi', '082134567010'),
(gen_random_uuid(), 'K11', 'Kurniawan Adi', '082134567011'),
(gen_random_uuid(), 'K12', 'Lutfi Hidayat', '082134567012'),
(gen_random_uuid(), 'K13', 'Maulana Yusuf', '082134567013'),
(gen_random_uuid(), 'K14', 'Naufal Rizki', '082134567014'),
(gen_random_uuid(), 'K15', 'Ogi Setiawan', '082134567015'),
(gen_random_uuid(), 'K16', 'Pandu Wicaksono', '082134567016'),
(gen_random_uuid(), 'K17', 'Qodir Jaelani', '082134567017'),
(gen_random_uuid(), 'K18', 'Rahmat Hidayat', '082134567018'),
(gen_random_uuid(), 'K19', 'Satria Nugraha', '082134567019'),
(gen_random_uuid(), 'K20', 'Taufik Abdullah', '082134567020'),
(gen_random_uuid(), 'K21', 'Umar Faruq', '082134567021'),
(gen_random_uuid(), 'K22', 'Vino Bastian', '082134567022'),
(gen_random_uuid(), 'K23', 'Wahyu Aditya', '082134567023'),
(gen_random_uuid(), 'K24', 'Xaverius Hendra', '082134567024'),
(gen_random_uuid(), 'K25', 'Yanto Sugiarto', '082134567025'),
(gen_random_uuid(), 'K26', 'Zaki Maulana', '082134567026'),
(gen_random_uuid(), 'K27', 'Agus Hermawan', '082134567027'),
(gen_random_uuid(), 'K28', 'Bayu Segara', '082134567028'),
(gen_random_uuid(), 'K29', 'Candra Wijaya', '082134567029'),
(gen_random_uuid(), 'K30', 'Doni Kusuma', '082134567030'),
(gen_random_uuid(), 'K31', 'Eka Saputra', '082134567031'),
(gen_random_uuid(), 'K32', 'Fajar Nugroho', '082134567032'),
(gen_random_uuid(), 'K33', 'Galih Permana', '082134567033'),
(gen_random_uuid(), 'K34', 'Hendra Gunawan', '082134567034'),
(gen_random_uuid(), 'K35', 'Imam Santoso', '082134567035'),
(gen_random_uuid(), 'K36', 'Jefri Setiawan', '082134567036'),
(gen_random_uuid(), 'K37', 'Kevin Pratama', '082134567037'),
(gen_random_uuid(), 'K38', 'Luki Hermanto', '082134567038'),
(gen_random_uuid(), 'K39', 'Mulyadi Putra', '082134567039'),
(gen_random_uuid(), 'K40', 'Niko Adrianto', '082134567040'),
(gen_random_uuid(), 'K41', 'Okta Ramadhan', '082134567041'),
(gen_random_uuid(), 'K42', 'Prasetyo Budi', '082134567042'),
(gen_random_uuid(), 'K43', 'Qomar Hidayat', '082134567043'),
(gen_random_uuid(), 'K44', 'Rendi Saputra', '082134567044'),
(gen_random_uuid(), 'K45', 'Sigit Prabowo', '082134567045'),
(gen_random_uuid(), 'K46', 'Teguh Santoso', '082134567046'),
(gen_random_uuid(), 'K47', 'Udin Sedunia', '082134567047'),
(gen_random_uuid(), 'K48', 'Vicky Rahman', '082134567048'),
(gen_random_uuid(), 'K49', 'Wawan Kurniawan', '082134567049'),
(gen_random_uuid(), 'K50', 'Yudi Hermawan', '082134567050');

-- =========================================
-- 3. CUSTOMERS (200 records) - Distributed across sales agents
-- =========================================
DO $$
DECLARE
  v_sales_ids UUID[];
  v_customer_num INTEGER;
  v_sales_index INTEGER;
  v_nik_base BIGINT := 3275010000000000;
  v_names TEXT[] := ARRAY[
    'Ayu Lestari', 'Bambang Sutrisno', 'Citra Dewi', 'Dedi Kurniawan', 'Erna Sari',
    'Fajar Nugraha', 'Gita Purnama', 'Hendra Wijaya', 'Indah Permata', 'Jaka Prasetya',
    'Kartika Sari', 'Lukman Hakim', 'Maya Sari', 'Nanda Pratama', 'Octavia Putri',
    'Putra Wijaya', 'Qori Rahmawati', 'Rini Susanti', 'Slamet Riyadi', 'Tuti Wulandari',
    'Umar Bakri', 'Vina Melati', 'Wawan Setiawan', 'Xena Putri', 'Yanto Sugiarto',
    'Zahra Amelia', 'Adi Nugroho', 'Bella Safitri', 'Chandra Wijaya', 'Dina Marlina',
    'Erik Prasetya', 'Fani Anggraini', 'Galih Perdana', 'Hani Rahayu', 'Ivan Maulana',
    'Joni Iskandar', 'Kiki Amelia', 'Lina Kartini', 'Maman Suherman', 'Nina Agustina',
    'Omar Faruk', 'Pipit Sari', 'Qomar Ahmad', 'Ratna Dewi', 'Santi Permata',
    'Tono Sucipto', 'Umi Kulsum', 'Vito Anggara', 'Wulan Dari', 'Yoga Pratama'
  ];
  v_streets TEXT[] := ARRAY['Jl. Mawar', 'Jl. Melati', 'Jl. Anggrek', 'Jl. Kenanga', 'Jl. Dahlia', 'Jl. Tulip', 'Jl. Sakura', 'Jl. Flamboyan', 'Jl. Cempaka', 'Jl. Bougenvil'];
  v_cities TEXT[] := ARRAY['Karawang Timur', 'Karawang Barat', 'Bekasi Utara', 'Bekasi Selatan', 'Cibitung', 'Cikarang', 'Tambun', 'Rawa Lumbu', 'Teluk Pucung', 'Klari'];
BEGIN
  SELECT ARRAY_AGG(id ORDER BY agent_code) INTO v_sales_ids FROM public.sales_agents;
  
  FOR v_customer_num IN 1..200 LOOP
    v_sales_index := ((v_customer_num - 1) % 20) + 1;
    
    INSERT INTO public.customers (id, customer_code, name, address, business_address, phone, nik, assigned_sales_id)
    VALUES (
      gen_random_uuid(),
      'C' || LPAD(v_customer_num::TEXT, 3, '0'),
      v_names[((v_customer_num - 1) % 50) + 1] || ' ' || CASE WHEN v_customer_num > 50 THEN (v_customer_num / 50 + 1)::TEXT ELSE '' END,
      v_streets[((v_customer_num - 1) % 10) + 1] || ' No. ' || ((v_customer_num % 100) + 1) || ', ' || v_cities[((v_customer_num - 1) % 10) + 1],
      'Toko ' || v_names[((v_customer_num - 1) % 50) + 1] || ', Pasar ' || v_cities[((v_customer_num - 1) % 10) + 1],
      '08' || (7650000000 + v_customer_num)::TEXT,
      (v_nik_base + v_customer_num)::TEXT,
      v_sales_ids[v_sales_index]
    );
  END LOOP;
END $$;

-- =========================================
-- 4. CREDIT CONTRACTS (200 records) - Distributed 2025-2026
-- =========================================
DO $$
DECLARE
  v_customer RECORD;
  v_contract_num INTEGER := 1;
  v_tenor INTEGER;
  v_loan_amount NUMERIC;
  v_omset NUMERIC;
  v_daily_amount NUMERIC;
  v_status TEXT;
  v_start_date DATE;
  v_products TEXT[] := ARRAY['Elektronik', 'Furniture', 'Motor', 'Handphone', 'Perabotan', 'Laptop', 'Kulkas', 'AC', 'TV', 'Mesin Cuci'];
BEGIN
  FOR v_customer IN (SELECT id, customer_code FROM public.customers ORDER BY customer_code) LOOP
    -- Distribute start dates from Jan 2025 to Dec 2026
    v_start_date := '2025-01-01'::DATE + ((v_contract_num - 1) * 3 % 730)::INTEGER;
    
    -- Vary tenor between 60-150 days
    v_tenor := 60 + ((v_contract_num * 7) % 91);
    
    -- Vary loan amounts between 3M - 15M
    v_loan_amount := (3000000 + ((v_contract_num * 50000) % 12000000))::NUMERIC;
    v_omset := v_loan_amount * 1.2;
    v_daily_amount := v_omset / v_tenor;
    
    -- Mix of active and completed based on start date
    IF v_start_date < '2025-06-01'::DATE THEN
      v_status := 'completed';
    ELSE
      v_status := 'active';
    END IF;
    
    INSERT INTO public.credit_contracts (
      id, contract_ref, customer_id, product_type, total_loan_amount, omset,
      tenor_days, daily_installment_amount, current_installment_index, status, start_date
    ) VALUES (
      gen_random_uuid(),
      'A' || LPAD(v_contract_num::TEXT, 3, '0'),
      v_customer.id,
      v_products[((v_contract_num - 1) % 10) + 1],
      v_loan_amount,
      v_omset,
      v_tenor,
      v_daily_amount,
      CASE WHEN v_status = 'completed' THEN v_tenor ELSE LEAST((CURRENT_DATE - v_start_date), v_tenor - 10) END,
      v_status,
      v_start_date
    );
    
    v_contract_num := v_contract_num + 1;
  END LOOP;
END $$;

-- =========================================
-- 5. PAYMENT LOGS - Distributed across 2025-2026
-- =========================================
DO $$
DECLARE
  v_contract RECORD;
  v_collector_ids UUID[];
  v_payment_index INTEGER;
  v_payment_date DATE;
  v_collector_index INTEGER;
  v_max_payments INTEGER;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY collector_code) INTO v_collector_ids FROM public.collectors;
  
  FOR v_contract IN (
    SELECT id, start_date, tenor_days, daily_installment_amount, status, current_installment_index
    FROM public.credit_contracts
    ORDER BY start_date
  ) LOOP
    -- Determine max payments based on status
    IF v_contract.status = 'completed' THEN
      v_max_payments := v_contract.tenor_days;
    ELSE
      v_max_payments := GREATEST(1, v_contract.current_installment_index);
    END IF;
    
    -- Generate payment logs
    FOR v_payment_index IN 1..v_max_payments LOOP
      v_payment_date := v_contract.start_date + (v_payment_index - 1);
      v_collector_index := ((v_payment_index - 1) % 50) + 1;
      
      -- Skip weekends for more realistic data
      IF EXTRACT(DOW FROM v_payment_date) NOT IN (0, 6) THEN
        INSERT INTO public.payment_logs (
          id, contract_id, payment_date, installment_index, amount_paid, collector_id
        ) VALUES (
          gen_random_uuid(),
          v_contract.id,
          v_payment_date,
          v_payment_index,
          v_contract.daily_installment_amount,
          v_collector_ids[v_collector_index]
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =========================================
-- 6. OPERATIONAL EXPENSES - Sample 2025-2026
-- =========================================
INSERT INTO public.operational_expenses (id, description, amount, expense_date, category, notes)
SELECT 
  gen_random_uuid(),
  CASE (n % 5)
    WHEN 0 THEN 'Biaya BBM Operasional'
    WHEN 1 THEN 'Biaya Listrik Kantor'
    WHEN 2 THEN 'Biaya ATK dan Supplies'
    WHEN 3 THEN 'Biaya Maintenance Kendaraan'
    WHEN 4 THEN 'Biaya Makan Karyawan'
  END,
  (100000 + (n * 25000) % 900000)::NUMERIC,
  '2025-01-01'::DATE + (n * 7 % 730),
  CASE (n % 5)
    WHEN 0 THEN 'Transport'
    WHEN 1 THEN 'Utilities'
    WHEN 2 THEN 'Supplies'
    WHEN 3 THEN 'Maintenance'
    WHEN 4 THEN 'Meals'
  END,
  'Pengeluaran rutin bulan ke-' || ((n / 4) + 1)
FROM generate_series(1, 50) AS n;

-- =========================================
-- VERIFICATION
-- =========================================
SELECT 
  'sales_agents' as table_name, COUNT(*) as record_count FROM public.sales_agents
UNION ALL SELECT 'collectors', COUNT(*) FROM public.collectors
UNION ALL SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL SELECT 'payment_logs', COUNT(*) FROM public.payment_logs
UNION ALL SELECT 'operational_expenses', COUNT(*) FROM public.operational_expenses
ORDER BY table_name;