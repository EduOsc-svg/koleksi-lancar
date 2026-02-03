-- =========================================
-- INSERT 200 SAMPLE DATA FOR 2026
-- Management System Kredit
-- =========================================

-- First, ensure we have enough sales agents
INSERT INTO public.sales_agents (id, name, agent_code, phone, commission_percentage)
VALUES 
  ('a1000001-0000-0000-0000-000000000001', 'Ahmad Susanto', 'S001', '081234567801', 5),
  ('a1000001-0000-0000-0000-000000000002', 'Budi Hartono', 'S002', '081234567802', 5),
  ('a1000001-0000-0000-0000-000000000003', 'Citra Dewi', 'S003', '081234567803', 5),
  ('a1000001-0000-0000-0000-000000000004', 'Dedi Prasetyo', 'S004', '081234567804', 5),
  ('a1000001-0000-0000-0000-000000000005', 'Eka Putra', 'S005', '081234567805', 5)
ON CONFLICT (id) DO NOTHING;

-- Ensure we have collectors
INSERT INTO public.collectors (id, name, collector_code, phone)
VALUES 
  ('c1000001-0000-0000-0000-000000000001', 'Kolektor Andi', 'K001', '081345678901'),
  ('c1000001-0000-0000-0000-000000000002', 'Kolektor Bambang', 'K002', '081345678902'),
  ('c1000001-0000-0000-0000-000000000003', 'Kolektor Cahyo', 'K003', '081345678903')
ON CONFLICT (id) DO NOTHING;

-- Generate 200 customers for 2026
DO $$
DECLARE
  v_customer_id UUID;
  v_contract_id UUID;
  v_sales_agent_id UUID;
  v_collector_id UUID;
  v_customer_code TEXT;
  v_contract_ref TEXT;
  v_start_date DATE;
  v_modal NUMERIC;
  v_omset NUMERIC;
  v_tenor INTEGER;
  v_daily_amount NUMERIC;
  v_current_date DATE;
  v_coupon_index INTEGER;
  v_payment_count INTEGER;
  v_specific_holidays DATE[];
  v_recurring_weekdays INTEGER[];
  i INTEGER;
  j INTEGER;
  
  -- Arrays for random names
  v_first_names TEXT[] := ARRAY['Agus', 'Bambang', 'Cahyadi', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hendra', 'Indra', 'Joko', 
                                 'Kartini', 'Lukman', 'Maya', 'Nugroho', 'Oktavia', 'Putra', 'Qori', 'Rini', 'Surya', 'Tono',
                                 'Udin', 'Vina', 'Wahyu', 'Xena', 'Yanto', 'Zahra', 'Arief', 'Bima', 'Candra', 'Dian',
                                 'Endang', 'Faisal', 'Galih', 'Hani', 'Irwan', 'Juli', 'Kusuma', 'Lina', 'Mulyadi', 'Ningsih'];
  v_last_names TEXT[] := ARRAY['Pratama', 'Wijaya', 'Santoso', 'Kusuma', 'Saputra', 'Hidayat', 'Nugraha', 'Permana', 'Setiawan', 'Wibowo',
                                'Hartono', 'Suharto', 'Suryadi', 'Pranoto', 'Budiman', 'Supriyadi', 'Handoko', 'Susanto', 'Purnama', 'Gunawan'];
  v_streets TEXT[] := ARRAY['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 
                            'Jl. Diponegoro', 'Jl. Imam Bonjol', 'Jl. Hayam Wuruk', 'Jl. Gajah Mada', 'Jl. Pemuda',
                            'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Kartini', 'Jl. Slamet Riyadi', 'Jl. Panglima Sudirman'];
  v_areas TEXT[] := ARRAY['Menteng', 'Kemang', 'Kelapa Gading', 'Senayan', 'Kuningan', 'Tebet', 'Cikini', 'Mangga Dua', 'Tanah Abang', 'Glodok'];
  v_products TEXT[] := ARRAY['HP Samsung', 'HP iPhone', 'HP Xiaomi', 'Laptop Asus', 'Laptop HP', 'TV LED 32"', 'TV LED 43"', 
                              'Kulkas 2 Pintu', 'AC 1 PK', 'Mesin Cuci', 'Kompor Gas', 'Dispenser', 'Blender', 'Rice Cooker', 'Setrika'];
  
  v_sales_agents UUID[] := ARRAY[
    'a1000001-0000-0000-0000-000000000001'::UUID,
    'a1000001-0000-0000-0000-000000000002'::UUID,
    'a1000001-0000-0000-0000-000000000003'::UUID,
    'a1000001-0000-0000-0000-000000000004'::UUID,
    'a1000001-0000-0000-0000-000000000005'::UUID
  ];
  
  v_collectors UUID[] := ARRAY[
    'c1000001-0000-0000-0000-000000000001'::UUID,
    'c1000001-0000-0000-0000-000000000002'::UUID,
    'c1000001-0000-0000-0000-000000000003'::UUID
  ];

BEGIN
  -- Fetch holidays
  SELECT ARRAY_AGG(holiday_date) INTO v_specific_holidays 
  FROM public.holidays 
  WHERE holiday_type = 'specific_date' AND holiday_date IS NOT NULL;
  
  SELECT ARRAY_AGG(day_of_week) INTO v_recurring_weekdays 
  FROM public.holidays 
  WHERE holiday_type = 'recurring_weekday' AND day_of_week IS NOT NULL;
  
  IF v_specific_holidays IS NULL THEN
    v_specific_holidays := ARRAY[]::DATE[];
  END IF;
  
  IF v_recurring_weekdays IS NULL THEN
    v_recurring_weekdays := ARRAY[]::INTEGER[];
  END IF;

  -- Generate 200 records
  FOR i IN 1..200 LOOP
    -- Generate unique IDs
    v_customer_id := gen_random_uuid();
    v_contract_id := gen_random_uuid();
    
    -- Select random sales agent and collector
    v_sales_agent_id := v_sales_agents[1 + floor(random() * 5)::int];
    v_collector_id := v_collectors[1 + floor(random() * 3)::int];
    
    -- Generate customer code (A001-A200 format for 2026)
    v_customer_code := 'B' || LPAD(i::text, 3, '0');
    
    -- Generate contract reference
    v_contract_ref := 'KTR-2026-' || LPAD(i::text, 4, '0');
    
    -- Random start date in 2026 (January to December)
    v_start_date := '2026-01-01'::date + (floor(random() * 365)::int);
    
    -- Random modal between 1,000,000 and 10,000,000
    v_modal := (1000000 + floor(random() * 9000000)::int);
    -- Round to nearest 100,000
    v_modal := round(v_modal / 100000) * 100000;
    
    -- Omset = Modal * 1.2 (20% margin)
    v_omset := v_modal * 1.2;
    
    -- Random tenor: 30, 50, 60, 90, or 100 days
    v_tenor := (ARRAY[30, 50, 60, 90, 100])[1 + floor(random() * 5)::int];
    
    -- Daily installment = Omset / Tenor
    v_daily_amount := round(v_omset / v_tenor, 0);
    
    -- Insert customer
    INSERT INTO public.customers (id, name, customer_code, address, business_address, phone, nik, assigned_sales_id)
    VALUES (
      v_customer_id,
      v_first_names[1 + floor(random() * 40)::int] || ' ' || v_last_names[1 + floor(random() * 20)::int],
      v_customer_code,
      v_streets[1 + floor(random() * 15)::int] || ' No. ' || (1 + floor(random() * 200)::int) || ', ' || v_areas[1 + floor(random() * 10)::int],
      'Pasar ' || v_areas[1 + floor(random() * 10)::int] || ' Blok ' || chr(65 + floor(random() * 10)::int) || (1 + floor(random() * 50)::int),
      '08' || (11 + floor(random() * 89)::int)::text || (10000000 + floor(random() * 89999999)::int)::text,
      (31 + floor(random() * 69)::int)::text || (10 + floor(random() * 90)::int)::text || (floor(random() * 3)::int + 1)::text || 
        (floor(random() * 12)::int + 1)::text || (60 + floor(random() * 40)::int)::text || (1000 + floor(random() * 9000)::int)::text,
      v_sales_agent_id
    );
    
    -- Insert contract
    INSERT INTO public.credit_contracts (id, customer_id, contract_ref, omset, total_loan_amount, tenor_days, daily_installment_amount, start_date, sales_agent_id, status, current_installment_index)
    VALUES (
      v_contract_id,
      v_customer_id,
      v_contract_ref,
      v_modal,  -- omset field stores Modal
      v_omset,  -- total_loan_amount stores Omset (Total Pinjaman)
      v_tenor,
      v_daily_amount,
      v_start_date,
      v_sales_agent_id,
      'active',
      0
    );
    
    -- Generate installment coupons (respecting holidays)
    v_current_date := v_start_date;
    v_coupon_index := 1;
    
    WHILE v_coupon_index <= v_tenor LOOP
      -- Skip holidays
      IF v_current_date = ANY(v_specific_holidays) OR EXTRACT(DOW FROM v_current_date)::INTEGER = ANY(v_recurring_weekdays) THEN
        v_current_date := v_current_date + INTERVAL '1 day';
        CONTINUE;
      END IF;
      
      INSERT INTO public.installment_coupons (contract_id, installment_index, due_date, amount, status)
      VALUES (v_contract_id, v_coupon_index, v_current_date, v_daily_amount, 'unpaid');
      
      v_coupon_index := v_coupon_index + 1;
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    -- Generate some payments (random 0-30% of coupons paid)
    -- Only for contracts that started before Feb 3, 2026 (current date context)
    IF v_start_date < '2026-02-03'::date THEN
      v_payment_count := floor(random() * (v_tenor * 0.3))::int;
      
      FOR j IN 1..v_payment_count LOOP
        -- Update coupon status
        UPDATE public.installment_coupons 
        SET status = 'paid'
        WHERE contract_id = v_contract_id 
          AND installment_index = j;
        
        -- Get the due date for this coupon
        SELECT due_date INTO v_current_date
        FROM public.installment_coupons
        WHERE contract_id = v_contract_id AND installment_index = j;
        
        -- Insert payment log
        INSERT INTO public.payment_logs (contract_id, coupon_id, installment_index, amount_paid, payment_date, collector_id, notes)
        SELECT 
          v_contract_id,
          ic.id,
          j,
          v_daily_amount,
          ic.due_date + (floor(random() * 3)::int),  -- Paid within 0-2 days of due date
          v_collector_id,
          'Pembayaran cicilan ke-' || j
        FROM public.installment_coupons ic
        WHERE ic.contract_id = v_contract_id AND ic.installment_index = j;
        
        -- Update contract current_installment_index
        UPDATE public.credit_contracts 
        SET current_installment_index = j
        WHERE id = v_contract_id;
      END LOOP;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Successfully inserted 200 customers, contracts, coupons, and payments for 2026!';
END $$;

-- Verify the data
SELECT 'Customers 2026' as entity, COUNT(*) as total FROM public.customers WHERE customer_code LIKE 'B%'
UNION ALL
SELECT 'Contracts 2026', COUNT(*) FROM public.credit_contracts WHERE start_date >= '2026-01-01' AND start_date < '2027-01-01'
UNION ALL
SELECT 'Coupons 2026', COUNT(*) FROM public.installment_coupons ic 
  JOIN public.credit_contracts cc ON ic.contract_id = cc.id 
  WHERE cc.start_date >= '2026-01-01' AND cc.start_date < '2027-01-01'
UNION ALL
SELECT 'Payments 2026', COUNT(*) FROM public.payment_logs pl
  JOIN public.credit_contracts cc ON pl.contract_id = cc.id 
  WHERE cc.start_date >= '2026-01-01' AND cc.start_date < '2027-01-01';

-- Summary statistics
SELECT 
  COUNT(*) as total_contracts,
  SUM(omset) as total_modal,
  SUM(total_loan_amount) as total_omset,
  SUM(total_loan_amount) - SUM(omset) as total_profit,
  SUM(total_loan_amount) * 0.05 as total_commission
FROM public.credit_contracts 
WHERE start_date >= '2026-01-01' AND start_date < '2027-01-01';
