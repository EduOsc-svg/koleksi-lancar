
-- =========================================
-- COMPLETE SAMPLE DATA: 200 Customers, 20 Sales, 50 Collectors
-- =========================================

-- Clear existing data first (in reverse dependency order)
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.collectors;
DELETE FROM public.sales_agents;

-- =========================================
-- 1. SALES AGENTS (20 records: S001-S020)
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
(gen_random_uuid(), 'S011', 'Kartini Wulandari', '081234567011', 5.0),
(gen_random_uuid(), 'S012', 'Lukman Hakim', '081234567012', 4.5),
(gen_random_uuid(), 'S013', 'Maya Anggraini', '081234567013', 5.5),
(gen_random_uuid(), 'S014', 'Nanda Permata', '081234567014', 4.0),
(gen_random_uuid(), 'S015', 'Oscar Hidayat', '081234567015', 6.0),
(gen_random_uuid(), 'S016', 'Putri Ayu', '081234567016', 4.5),
(gen_random_uuid(), 'S017', 'Qomar Fauzi', '081234567017', 5.0),
(gen_random_uuid(), 'S018', 'Rina Marlina', '081234567018', 5.5),
(gen_random_uuid(), 'S019', 'Surya Dharma', '081234567019', 4.0),
(gen_random_uuid(), 'S020', 'Tania Putri', '081234567020', 6.0);

-- =========================================
-- 2. COLLECTORS (50 records: K01-K50)
-- =========================================
INSERT INTO public.collectors (id, collector_code, name, phone) VALUES
(gen_random_uuid(), 'K01', 'Agus Setiawan', '082134567001'),
(gen_random_uuid(), 'K02', 'Bambang Kurniawan', '082134567002'),
(gen_random_uuid(), 'K03', 'Cahyo Nugroho', '082134567003'),
(gen_random_uuid(), 'K04', 'Dimas Prasetya', '082134567004'),
(gen_random_uuid(), 'K05', 'Eko Budiman', '082134567005'),
(gen_random_uuid(), 'K06', 'Farid Rahman', '082134567006'),
(gen_random_uuid(), 'K07', 'Galih Permana', '082134567007'),
(gen_random_uuid(), 'K08', 'Hadi Santoso', '082134567008'),
(gen_random_uuid(), 'K09', 'Irfan Maulana', '082134567009'),
(gen_random_uuid(), 'K10', 'Jaya Kusuma', '082134567010'),
(gen_random_uuid(), 'K11', 'Krisna Wijaya', '082134567011'),
(gen_random_uuid(), 'K12', 'Lutfi Hidayat', '082134567012'),
(gen_random_uuid(), 'K13', 'Mulyadi Putra', '082134567013'),
(gen_random_uuid(), 'K14', 'Naufal Akbar', '082134567014'),
(gen_random_uuid(), 'K15', 'Okta Firmansyah', '082134567015'),
(gen_random_uuid(), 'K16', 'Pandu Wicaksono', '082134567016'),
(gen_random_uuid(), 'K17', 'Rendi Saputra', '082134567017'),
(gen_random_uuid(), 'K18', 'Sigit Prabowo', '082134567018'),
(gen_random_uuid(), 'K19', 'Taufik Ismail', '082134567019'),
(gen_random_uuid(), 'K20', 'Umar Bakri', '082134567020'),
(gen_random_uuid(), 'K21', 'Vino Bastian', '082134567021'),
(gen_random_uuid(), 'K22', 'Wahyu Nugroho', '082134567022'),
(gen_random_uuid(), 'K23', 'Yoga Pratama', '082134567023'),
(gen_random_uuid(), 'K24', 'Zainal Abidin', '082134567024'),
(gen_random_uuid(), 'K25', 'Arief Budiman', '082134567025'),
(gen_random_uuid(), 'K26', 'Bayu Segara', '082134567026'),
(gen_random_uuid(), 'K27', 'Candra Wijaya', '082134567027'),
(gen_random_uuid(), 'K28', 'Dedi Mulyadi', '082134567028'),
(gen_random_uuid(), 'K29', 'Erwin Setiawan', '082134567029'),
(gen_random_uuid(), 'K30', 'Feri Andika', '082134567030'),
(gen_random_uuid(), 'K31', 'Gilang Ramadhan', '082134567031'),
(gen_random_uuid(), 'K32', 'Hendri Susanto', '082134567032'),
(gen_random_uuid(), 'K33', 'Ivan Gunawan', '082134567033'),
(gen_random_uuid(), 'K34', 'Johan Permadi', '082134567034'),
(gen_random_uuid(), 'K35', 'Kevin Sanjaya', '082134567035'),
(gen_random_uuid(), 'K36', 'Leo Waldy', '082134567036'),
(gen_random_uuid(), 'K37', 'Mario Teguh', '082134567037'),
(gen_random_uuid(), 'K38', 'Nanang Kosim', '082134567038'),
(gen_random_uuid(), 'K39', 'Omar Faruq', '082134567039'),
(gen_random_uuid(), 'K40', 'Prima Ananda', '082134567040'),
(gen_random_uuid(), 'K41', 'Rizal Mantovani', '082134567041'),
(gen_random_uuid(), 'K42', 'Sandi Firmansyah', '082134567042'),
(gen_random_uuid(), 'K43', 'Tommy Kurniawan', '082134567043'),
(gen_random_uuid(), 'K44', 'Ujang Sudrajat', '082134567044'),
(gen_random_uuid(), 'K45', 'Vicky Prasetyo', '082134567045'),
(gen_random_uuid(), 'K46', 'Wawan Setiawan', '082134567046'),
(gen_random_uuid(), 'K47', 'Yanto Budiman', '082134567047'),
(gen_random_uuid(), 'K48', 'Zaki Mubarak', '082134567048'),
(gen_random_uuid(), 'K49', 'Adi Nugroho', '082134567049'),
(gen_random_uuid(), 'K50', 'Bima Sakti', '082134567050');

-- =========================================
-- 3. CUSTOMERS (200 records: C001-C200) with distributed sales agents
-- =========================================
DO $$
DECLARE
  v_customer_num INTEGER;
  v_customer_code TEXT;
  v_first_names TEXT[] := ARRAY['Ayu', 'Bambang', 'Citra', 'Dedi', 'Erna', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko', 
                                'Kartika', 'Lukman', 'Maya', 'Nanda', 'Okta', 'Putri', 'Qomar', 'Rina', 'Surya', 'Tania',
                                'Udin', 'Vera', 'Wahyu', 'Yanti', 'Zahra', 'Adi', 'Bella', 'Cahya', 'Dina', 'Erik',
                                'Fina', 'Galih', 'Hana', 'Irma', 'Joni', 'Kiki', 'Lina', 'Mira', 'Nina', 'Oki'];
  v_last_names TEXT[] := ARRAY['Lestari', 'Sutrisno', 'Dewi', 'Kurniawan', 'Sari', 'Nugraha', 'Purnama', 'Wijaya', 'Permata', 'Prasetya',
                               'Wulandari', 'Hakim', 'Anggraini', 'Hidayat', 'Budiman', 'Setiawan', 'Santoso', 'Kusuma', 'Handayani', 'Marlina'];
  v_streets TEXT[] := ARRAY['Jl. Mawar', 'Jl. Melati', 'Jl. Anggrek', 'Jl. Kenanga', 'Jl. Dahlia', 'Jl. Tulip', 'Jl. Sakura', 'Jl. Flamboyan', 
                            'Jl. Cempaka', 'Jl. Bougenvil', 'Jl. Kamboja', 'Jl. Alamanda', 'Jl. Teratai', 'Jl. Seroja', 'Jl. Merpati',
                            'Jl. Rajawali', 'Jl. Garuda', 'Jl. Elang', 'Jl. Kutilang', 'Jl. Camar'];
  v_areas TEXT[] := ARRAY['Karawang Timur', 'Karawang Barat', 'Bekasi Utara', 'Bekasi Selatan', 'Cibitung', 'Cikarang', 'Tambun', 
                          'Rawa Lumbu', 'Teluk Pucung', 'Klari', 'Purwakarta', 'Subang', 'Cikampek', 'Dawuan', 'Kotabaru'];
  v_sales_agents UUID[];
  v_name TEXT;
  v_address TEXT;
  v_business_address TEXT;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY agent_code) INTO v_sales_agents FROM public.sales_agents;
  
  FOR v_customer_num IN 1..200 LOOP
    v_customer_code := 'C' || LPAD(v_customer_num::TEXT, 3, '0');
    v_name := v_first_names[1 + (v_customer_num % 40)] || ' ' || v_last_names[1 + (v_customer_num % 20)];
    v_address := v_streets[1 + (v_customer_num % 20)] || ' No. ' || (v_customer_num % 100 + 1) || ', ' || v_areas[1 + (v_customer_num % 15)];
    v_business_address := 'Toko ' || v_name || ', Pasar ' || v_areas[1 + ((v_customer_num + 5) % 15)];
    
    INSERT INTO public.customers (id, customer_code, name, nik, address, business_address, phone, assigned_sales_id)
    VALUES (
      gen_random_uuid(),
      v_customer_code,
      v_name,
      '3275' || LPAD(v_customer_num::TEXT, 12, '0'),
      v_address,
      v_business_address,
      '0876' || LPAD(v_customer_num::TEXT, 8, '0'),
      v_sales_agents[1 + (v_customer_num % 20)]
    );
  END LOOP;
END $$;

-- =========================================
-- 4. CREDIT CONTRACTS (A001-Axxx, only 'active' or 'completed' status)
-- =========================================
DO $$
DECLARE
  v_customer RECORD;
  v_contract_num INTEGER := 1;
  v_num_contracts INTEGER;
  v_contract_ref TEXT;
  v_tenor INTEGER;
  v_loan_amount NUMERIC;
  v_product_types TEXT[] := ARRAY['Elektronik', 'Furniture', 'Motor', 'Handphone', 'Perabotan', 'Laptop', 'Kulkas', 'AC', 'TV', 'Mesin Cuci', 'Smartphone', 'Sepeda Motor', 'Komputer', 'Dispenser', 'Kipas Angin'];
  v_start_date DATE;
  v_status TEXT;
  v_daily_amount NUMERIC;
  v_omset NUMERIC;
  v_current_index INTEGER;
BEGIN
  FOR v_customer IN SELECT id, customer_code FROM public.customers ORDER BY customer_code LOOP
    v_num_contracts := CASE 
      WHEN random() < 0.5 THEN 1
      WHEN random() < 0.8 THEN 2
      ELSE 3
    END;
    
    FOR i IN 1..v_num_contracts LOOP
      v_contract_ref := 'A' || LPAD(v_contract_num::TEXT, 3, '0');
      v_tenor := (ARRAY[60, 80, 100, 120, 150])[1 + floor(random() * 5)::INTEGER];
      v_loan_amount := (3000000 + floor(random() * 12000000))::NUMERIC;
      v_omset := v_loan_amount * 1.2;
      v_daily_amount := round(v_omset / v_tenor);
      v_start_date := CURRENT_DATE - (floor(random() * 180))::INTEGER;
      
      -- Only use 'active' or 'completed' status (no 'cancelled')
      IF v_start_date + v_tenor < CURRENT_DATE THEN
        v_status := CASE WHEN random() < 0.85 THEN 'completed' ELSE 'active' END;
        v_current_index := CASE WHEN v_status = 'completed' THEN v_tenor ELSE floor(random() * v_tenor)::INTEGER END;
      ELSE
        v_status := 'active';
        v_current_index := GREATEST(0, (CURRENT_DATE - v_start_date)::INTEGER - floor(random() * 10)::INTEGER);
      END IF;
      
      INSERT INTO public.credit_contracts (
        id, contract_ref, customer_id, product_type, total_loan_amount, omset, 
        tenor_days, daily_installment_amount, current_installment_index, status, start_date
      ) VALUES (
        gen_random_uuid(),
        v_contract_ref,
        v_customer.id,
        v_product_types[1 + floor(random() * 15)::INTEGER],
        v_loan_amount,
        v_omset,
        v_tenor,
        v_daily_amount,
        v_current_index,
        v_status,
        v_start_date
      );
      
      v_contract_num := v_contract_num + 1;
    END LOOP;
  END LOOP;
END $$;

-- =========================================
-- 5. PAYMENT LOGS (distributed payments for contracts with payments)
-- =========================================
DO $$
DECLARE
  v_contract RECORD;
  v_collectors UUID[];
  v_payment_date DATE;
  v_num_payments INTEGER;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY collector_code) INTO v_collectors FROM public.collectors;
  
  FOR v_contract IN 
    SELECT id, start_date, daily_installment_amount, current_installment_index, tenor_days 
    FROM public.credit_contracts 
    WHERE status IN ('active', 'completed') AND current_installment_index > 0
  LOOP
    v_num_payments := LEAST(v_contract.current_installment_index, 50);
    
    FOR i IN 1..v_num_payments LOOP
      v_payment_date := v_contract.start_date + i;
      
      IF EXTRACT(DOW FROM v_payment_date) NOT IN (0, 6) THEN
        INSERT INTO public.payment_logs (
          id, contract_id, payment_date, installment_index, amount_paid, collector_id
        ) VALUES (
          gen_random_uuid(),
          v_contract.id,
          v_payment_date,
          i,
          v_contract.daily_installment_amount,
          v_collectors[1 + (i % 50)]
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =========================================
-- VERIFICATION
-- =========================================
SELECT 'sales_agents' as table_name, COUNT(*) as record_count FROM public.sales_agents
UNION ALL SELECT 'collectors', COUNT(*) FROM public.collectors
UNION ALL SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL SELECT 'payment_logs', COUNT(*) FROM public.payment_logs
ORDER BY table_name;
