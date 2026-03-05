-- =========================================
-- RESET ALL DATA & SEED 300 CONTRACTS
-- 10 Collectors, 20 Sales Agents, 300 Customers/Contracts
-- Various products & problems
-- =========================================

-- STEP 1: DELETE ALL DATA (order matters for FK constraints)
DELETE FROM public.commission_payments;
DELETE FROM public.coupon_handovers;
DELETE FROM public.activity_logs;
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.collectors;
DELETE FROM public.sales_agents;
-- Note: holidays, operational_expenses, user_roles preserved

-- STEP 2: INSERT 10 COLLECTORS
INSERT INTO public.collectors (id, collector_code, name, phone) VALUES
  (gen_random_uuid(), 'COL-001', 'Rizky Ramadhan', '081234567801'),
  (gen_random_uuid(), 'COL-002', 'Dwi Cahyono', '081234567802'),
  (gen_random_uuid(), 'COL-003', 'Teguh Prasetyo', '081234567803'),
  (gen_random_uuid(), 'COL-004', 'Hendra Gunawan', '081234567804'),
  (gen_random_uuid(), 'COL-005', 'Slamet Widodo', '081234567805'),
  (gen_random_uuid(), 'COL-006', 'Dimas Kurniawan', '081234567806'),
  (gen_random_uuid(), 'COL-007', 'Yusuf Maulana', '081234567807'),
  (gen_random_uuid(), 'COL-008', 'Andi Firmansyah', '081234567808'),
  (gen_random_uuid(), 'COL-009', 'Budi Santosa', '081234567809'),
  (gen_random_uuid(), 'COL-010', 'Farid Hidayat', '081234567810');

-- STEP 3: INSERT 20 SALES AGENTS
INSERT INTO public.sales_agents (id, agent_code, name, phone, use_tiered_commission) VALUES
  (gen_random_uuid(), 'SA-001', 'Ahmad Fauzi', '082111000001', true),
  (gen_random_uuid(), 'SA-002', 'Siti Nurhaliza', '082111000002', true),
  (gen_random_uuid(), 'SA-003', 'Bambang Suryadi', '082111000003', true),
  (gen_random_uuid(), 'SA-004', 'Dewi Lestari', '082111000004', true),
  (gen_random_uuid(), 'SA-005', 'Eko Prasetyo', '082111000005', true),
  (gen_random_uuid(), 'SA-006', 'Fitri Handayani', '082111000006', true),
  (gen_random_uuid(), 'SA-007', 'Gunawan Wibisono', '082111000007', true),
  (gen_random_uuid(), 'SA-008', 'Hani Susanti', '082111000008', true),
  (gen_random_uuid(), 'SA-009', 'Irfan Hakim', '082111000009', true),
  (gen_random_uuid(), 'SA-010', 'Juliana Putri', '082111000010', true),
  (gen_random_uuid(), 'SA-011', 'Kusuma Wardani', '082111000011', true),
  (gen_random_uuid(), 'SA-012', 'Lukman Hakim', '082111000012', true),
  (gen_random_uuid(), 'SA-013', 'Maya Sari', '082111000013', true),
  (gen_random_uuid(), 'SA-014', 'Nugroho Adi', '082111000014', true),
  (gen_random_uuid(), 'SA-015', 'Oktavia Rahmawati', '082111000015', true),
  (gen_random_uuid(), 'SA-016', 'Putra Wijaya', '082111000016', true),
  (gen_random_uuid(), 'SA-017', 'Qori Mulyadi', '082111000017', true),
  (gen_random_uuid(), 'SA-018', 'Ratna Dewi', '082111000018', true),
  (gen_random_uuid(), 'SA-019', 'Surya Permana', '082111000019', true),
  (gen_random_uuid(), 'SA-020', 'Taufik Hidayat', '082111000020', true);

-- STEP 4: INSERT 300 CUSTOMERS & CONTRACTS WITH COUPONS
DO $$
DECLARE
  v_customer_id UUID;
  v_contract_id UUID;
  v_sales_agent_id UUID;
  v_collector_id UUID;
  v_contract_ref TEXT;
  v_start_date DATE;
  v_omset NUMERIC;
  v_modal NUMERIC;
  v_tenor INTEGER;
  v_daily_amount NUMERIC;
  v_current_date DATE;
  v_coupon_index INTEGER;
  v_payment_count INTEGER;
  v_specific_holidays DATE[];
  v_recurring_weekdays INTEGER[];
  v_status TEXT;
  v_product TEXT;
  i INTEGER;
  j INTEGER;

  v_first_names TEXT[] := ARRAY[
    'Agus','Bambang','Cahyadi','Dewi','Eko','Fitri','Gunawan','Hendra','Indra','Joko',
    'Kartini','Lukman','Maya','Nugroho','Oktavia','Putra','Qori','Rini','Surya','Tono',
    'Udin','Vina','Wahyu','Yanto','Zahra','Arief','Bima','Candra','Dian','Endang',
    'Faisal','Galih','Hani','Irwan','Juli','Kusuma','Lina','Mulyadi','Ningsih','Omar',
    'Putri','Ratna','Sinta','Taufik','Utami','Vera','Wawan','Yudi','Zaki','Adit',
    'Bayu','Cindy','Doni','Elsa','Fajar','Gita','Hasan','Intan','Jihan','Kiki'
  ];
  v_last_names TEXT[] := ARRAY[
    'Pratama','Wijaya','Santoso','Kusuma','Saputra','Hidayat','Nugraha','Permana','Setiawan','Wibowo',
    'Hartono','Suharto','Suryadi','Pranoto','Budiman','Supriyadi','Handoko','Susanto','Purnama','Gunawan',
    'Halim','Wicaksono','Kurniawan','Firmansyah','Ramadhan','Hakim','Utomo','Prasetya','Mahendra','Perdana'
  ];
  v_streets TEXT[] := ARRAY[
    'Jl. Merdeka','Jl. Sudirman','Jl. Thamrin','Jl. Gatot Subroto','Jl. Ahmad Yani',
    'Jl. Diponegoro','Jl. Imam Bonjol','Jl. Hayam Wuruk','Jl. Gajah Mada','Jl. Pemuda',
    'Jl. Pahlawan','Jl. Veteran','Jl. Kartini','Jl. Slamet Riyadi','Jl. Panglima Sudirman'
  ];
  v_areas TEXT[] := ARRAY[
    'Menteng','Kemang','Kelapa Gading','Senayan','Kuningan',
    'Tebet','Cikini','Mangga Dua','Tanah Abang','Glodok',
    'Cibubur','Bekasi','Depok','Bogor','Tangerang'
  ];
  v_products TEXT[] := ARRAY[
    'Elektronik','Furniture','Handphone','Laptop','Peralatan Dapur',
    'Sepeda Motor','Mesin Jahit','Kulkas','TV LED','AC',
    'Mesin Cuci','Komputer','Kamera','Sound System','Alat Olahraga'
  ];

  v_sales_agents UUID[];
  v_collectors UUID[];
  v_full_name TEXT;
  v_used_names TEXT[] := ARRAY[]::TEXT[];

BEGIN
  -- Fetch agents & collectors
  SELECT ARRAY_AGG(id) INTO v_sales_agents FROM public.sales_agents;
  SELECT ARRAY_AGG(id) INTO v_collectors FROM public.collectors;

  IF v_sales_agents IS NULL OR array_length(v_sales_agents, 1) IS NULL THEN
    RAISE EXCEPTION 'No sales agents found!';
  END IF;
  IF v_collectors IS NULL OR array_length(v_collectors, 1) IS NULL THEN
    RAISE EXCEPTION 'No collectors found!';
  END IF;

  -- Fetch holidays
  SELECT COALESCE(ARRAY_AGG(holiday_date), ARRAY[]::DATE[]) INTO v_specific_holidays
  FROM public.holidays WHERE holiday_type = 'specific_date' AND holiday_date IS NOT NULL;
  SELECT COALESCE(ARRAY_AGG(day_of_week), ARRAY[]::INTEGER[]) INTO v_recurring_weekdays
  FROM public.holidays WHERE holiday_type = 'recurring_weekday' AND day_of_week IS NOT NULL;

  FOR i IN 1..300 LOOP
    v_customer_id := gen_random_uuid();
    v_contract_id := gen_random_uuid();

    v_sales_agent_id := v_sales_agents[1 + floor(random() * array_length(v_sales_agents, 1))::int];
    v_collector_id := v_collectors[1 + floor(random() * array_length(v_collectors, 1))::int];

    -- Contract ref: A001 - A300
    v_contract_ref := 'A' || LPAD(i::text, 3, '0');

    -- Unique name
    v_full_name := v_first_names[1 + floor(random() * 60)::int] || ' ' || v_last_names[1 + floor(random() * 30)::int];
    IF v_full_name = ANY(v_used_names) THEN
      v_full_name := v_full_name || ' ' || i::text;
    END IF;
    v_used_names := array_append(v_used_names, v_full_name);

    -- Random start date in 2026
    v_start_date := '2026-01-02'::date + (floor(random() * 120)::int); -- Jan-Apr 2026

    -- Random product
    v_product := v_products[1 + floor(random() * 15)::int];

    -- Random omset 1.2M - 15M
    v_omset := (1200000 + floor(random() * 13800000)::int);
    v_omset := round(v_omset / 100000) * 100000;
    v_modal := round(v_omset / 1.2, 0);

    -- Random tenor
    v_tenor := (ARRAY[30, 50, 60, 90, 100])[1 + floor(random() * 5)::int];
    v_daily_amount := round(v_omset / v_tenor, 0);

    -- Status variety: mostly active, some completed, some defaulted
    IF i <= 240 THEN
      v_status := 'active';
    ELSIF i <= 270 THEN
      v_status := 'completed';
    ELSE
      v_status := 'active'; -- these will have heavy arrears
    END IF;

    -- Insert customer
    INSERT INTO public.customers (id, name, address, business_address, phone, nik)
    VALUES (
      v_customer_id,
      v_full_name,
      v_streets[1 + floor(random() * 15)::int] || ' No. ' || (1 + floor(random() * 200)::int) || ', ' || v_areas[1 + floor(random() * 15)::int],
      'Pasar ' || v_areas[1 + floor(random() * 15)::int] || ' Blok ' || chr(65 + floor(random() * 10)::int) || (1 + floor(random() * 50)::int),
      '08' || (11 + floor(random() * 89)::int)::text || (10000000 + floor(random() * 89999999)::int)::text,
      (31 + floor(random() * 69)::int)::text || (10 + floor(random() * 90)::int)::text ||
        LPAD((floor(random() * 12)::int + 1)::text, 2, '0') ||
        LPAD((floor(random() * 28)::int + 1)::text, 2, '0') ||
        (60 + floor(random() * 40)::int)::text ||
        LPAD((floor(random() * 9999)::int + 1)::text, 4, '0')
    );

    -- Insert contract
    INSERT INTO public.credit_contracts (
      id, customer_id, contract_ref, omset, total_loan_amount,
      tenor_days, daily_installment_amount, start_date, sales_agent_id,
      collector_id, status, current_installment_index, product_type
    ) VALUES (
      v_contract_id, v_customer_id, v_contract_ref,
      v_modal, v_omset, v_tenor, v_daily_amount,
      v_start_date, v_sales_agent_id, v_collector_id,
      v_status, 0, v_product
    );

    -- Generate installment coupons
    v_current_date := v_start_date;
    v_coupon_index := 1;
    WHILE v_coupon_index <= v_tenor LOOP
      IF v_current_date = ANY(v_specific_holidays) OR EXTRACT(DOW FROM v_current_date)::INTEGER = ANY(v_recurring_weekdays) THEN
        v_current_date := v_current_date + INTERVAL '1 day';
        CONTINUE;
      END IF;
      INSERT INTO public.installment_coupons (contract_id, installment_index, due_date, amount, status)
      VALUES (v_contract_id, v_coupon_index, v_current_date, v_daily_amount, 'unpaid');
      v_coupon_index := v_coupon_index + 1;
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    -- SCENARIO-BASED PAYMENTS:
    -- Group 1 (1-60): Good payers - 80-100% paid
    -- Group 2 (61-120): Average payers - 40-60% paid
    -- Group 3 (121-180): Late/slow payers - 10-30% paid
    -- Group 4 (181-240): Very few payments - 0-10% paid
    -- Group 5 (241-270): Completed contracts - 100% paid
    -- Group 6 (271-300): Problem contracts - 0% paid (heavy arrears)

    IF i <= 60 THEN
      -- Good payers
      v_payment_count := GREATEST(1, floor(v_tenor * (0.8 + random() * 0.2))::int);
    ELSIF i <= 120 THEN
      -- Average
      v_payment_count := GREATEST(1, floor(v_tenor * (0.4 + random() * 0.2))::int);
    ELSIF i <= 180 THEN
      -- Slow
      v_payment_count := GREATEST(1, floor(v_tenor * (0.1 + random() * 0.2))::int);
    ELSIF i <= 240 THEN
      -- Very few
      v_payment_count := floor(v_tenor * random() * 0.1)::int;
    ELSIF i <= 270 THEN
      -- Completed
      v_payment_count := v_tenor;
    ELSE
      -- Problem - zero payments
      v_payment_count := 0;
    END IF;

    -- Cap payment count to tenor
    v_payment_count := LEAST(v_payment_count, v_tenor);

    FOR j IN 1..v_payment_count LOOP
      UPDATE public.installment_coupons
      SET status = 'paid'
      WHERE contract_id = v_contract_id AND installment_index = j;

      INSERT INTO public.payment_logs (contract_id, coupon_id, installment_index, amount_paid, payment_date, collector_id, notes)
      SELECT
        v_contract_id, ic.id, j, v_daily_amount,
        ic.due_date + (floor(random() * 3)::int),
        v_collector_id,
        'Pembayaran cicilan ke-' || j
      FROM public.installment_coupons ic
      WHERE ic.contract_id = v_contract_id AND ic.installment_index = j;

      UPDATE public.credit_contracts
      SET current_installment_index = j
      WHERE id = v_contract_id;
    END LOOP;

    -- Mark completed contracts
    IF i >= 241 AND i <= 270 THEN
      UPDATE public.credit_contracts SET status = 'completed' WHERE id = v_contract_id;
    END IF;

  END LOOP;

  RAISE NOTICE 'Successfully seeded: 10 collectors, 20 sales agents, 300 customers & contracts!';
END $$;

-- VERIFICATION
SELECT 'Collectors' as entity, COUNT(*) as total FROM public.collectors
UNION ALL SELECT 'Sales Agents', COUNT(*) FROM public.sales_agents
UNION ALL SELECT 'Customers', COUNT(*) FROM public.customers
UNION ALL SELECT 'Contracts', COUNT(*) FROM public.credit_contracts
UNION ALL SELECT 'Coupons', COUNT(*) FROM public.installment_coupons
UNION ALL SELECT 'Payments', COUNT(*) FROM public.payment_logs;

SELECT status, COUNT(*) as total FROM public.credit_contracts GROUP BY status;
SELECT product_type, COUNT(*) as total FROM public.credit_contracts GROUP BY product_type ORDER BY total DESC;
