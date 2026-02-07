-- =========================================
-- INSERT 200 SAMPLE DATA FOR 2026
-- Management System Kredit
-- Business Logic: Omset - Keuntungan (20%) = Modal
-- =========================================

-- NOTE: Script assumes sales_agents and collectors already exist in database
-- Fetch existing sales agents and collectors dynamically

-- Generate 200 customers and contracts for 2026
DO $$
DECLARE
  v_customer_id UUID;
  v_contract_id UUID;
  v_sales_agent_id UUID;
  v_collector_id UUID;
  v_customer_code TEXT;
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
  i INTEGER;
  j INTEGER;
  v_first_idx INTEGER;
  v_last_idx INTEGER;
  
  -- Arrays for random Indonesian names (200+ combinations possible)
  v_first_names TEXT[] := ARRAY[
    'Agus', 'Bambang', 'Cahyadi', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hendra', 'Indra', 'Joko',
    'Kartini', 'Lukman', 'Maya', 'Nugroho', 'Oktavia', 'Putra', 'Qori', 'Rini', 'Surya', 'Tono',
    'Udin', 'Vina', 'Wahyu', 'Yanto', 'Zahra', 'Arief', 'Bima', 'Candra', 'Dian', 'Endang',
    'Faisal', 'Galih', 'Hani', 'Irwan', 'Juli', 'Kusuma', 'Lina', 'Mulyadi', 'Ningsih', 'Omar',
    'Putri', 'Ratna', 'Sinta', 'Taufik', 'Utami', 'Vera', 'Wawan', 'Yudi', 'Zaki', 'Adit',
    'Bayu', 'Cindy', 'Doni', 'Elsa', 'Fajar', 'Gita', 'Hasan', 'Intan', 'Jihan', 'Kiki'
  ];
  
  v_last_names TEXT[] := ARRAY[
    'Pratama', 'Wijaya', 'Santoso', 'Kusuma', 'Saputra', 'Hidayat', 'Nugraha', 'Permana', 'Setiawan', 'Wibowo',
    'Hartono', 'Suharto', 'Suryadi', 'Pranoto', 'Budiman', 'Supriyadi', 'Handoko', 'Susanto', 'Purnama', 'Gunawan',
    'Halim', 'Wicaksono', 'Kurniawan', 'Firmansyah', 'Ramadhan', 'Hakim', 'Utomo', 'Prasetya', 'Mahendra', 'Perdana'
  ];
  
  v_streets TEXT[] := ARRAY[
    'Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani',
    'Jl. Diponegoro', 'Jl. Imam Bonjol', 'Jl. Hayam Wuruk', 'Jl. Gajah Mada', 'Jl. Pemuda',
    'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Kartini', 'Jl. Slamet Riyadi', 'Jl. Panglima Sudirman'
  ];
  
  v_areas TEXT[] := ARRAY[
    'Menteng', 'Kemang', 'Kelapa Gading', 'Senayan', 'Kuningan', 
    'Tebet', 'Cikini', 'Mangga Dua', 'Tanah Abang', 'Glodok',
    'Cibubur', 'Bekasi', 'Depok', 'Bogor', 'Tangerang'
  ];
  
  v_sales_agents UUID[];
  v_collectors UUID[];

  v_full_name TEXT;
  v_used_names TEXT[] := ARRAY[]::TEXT[];

BEGIN
  -- Fetch existing sales agents dynamically
  SELECT ARRAY_AGG(id) INTO v_sales_agents FROM public.sales_agents;
  
  -- Fetch existing collectors dynamically
  SELECT ARRAY_AGG(id) INTO v_collectors FROM public.collectors;
  
  -- Validate we have data
  IF v_sales_agents IS NULL OR array_length(v_sales_agents, 1) IS NULL THEN
    RAISE EXCEPTION 'No sales agents found. Please add sales agents first!';
  END IF;
  
  IF v_collectors IS NULL OR array_length(v_collectors, 1) IS NULL THEN
    RAISE EXCEPTION 'No collectors found. Please add collectors first!';
  END IF;

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
    v_sales_agent_id := v_sales_agents[1 + floor(random() * array_length(v_sales_agents, 1))::int];
    v_collector_id := v_collectors[1 + floor(random() * array_length(v_collectors, 1))::int];
    
    -- Generate customer code (B001-B200 format for 2026)
    v_customer_code := 'B' || LPAD(i::text, 3, '0');
    
    -- Generate contract reference
    v_contract_ref := 'A' || LPAD(i::text, 3, '0');
    
    -- Generate unique name with number suffix if needed
    v_first_idx := 1 + floor(random() * 60)::int;
    v_last_idx := 1 + floor(random() * 30)::int;
    v_full_name := v_first_names[v_first_idx] || ' ' || v_last_names[v_last_idx];
    
    -- Add number suffix to ensure uniqueness
    IF v_full_name = ANY(v_used_names) THEN
      v_full_name := v_full_name || ' ' || i::text;
    END IF;
    v_used_names := array_append(v_used_names, v_full_name);
    
    -- Random start date distributed across 2026 (January to December)
    v_start_date := '2026-01-01'::date + (floor(random() * 365)::int);
    
    -- Random OMSET (Harga Jual) between 1,200,000 and 12,000,000
    v_omset := (1200000 + floor(random() * 10800000)::int);
    -- Round to nearest 100,000
    v_omset := round(v_omset / 100000) * 100000;
    
    -- MODAL = OMSET / 1.2 (karena Omset = Modal * 1.2, maka Modal = Omset / 1.2)
    -- Keuntungan 20% dari Modal
    v_modal := round(v_omset / 1.2, 0);
    
    -- Random tenor: 30, 50, 60, 90, or 100 days
    v_tenor := (ARRAY[30, 50, 60, 90, 100])[1 + floor(random() * 5)::int];
    
    -- Daily installment = Omset / Tenor
    v_daily_amount := round(v_omset / v_tenor, 0);
    
    -- Insert customer
    INSERT INTO public.customers (id, name, customer_code, address, business_address, phone, nik)
    VALUES (
      v_customer_id,
      v_full_name,
      v_customer_code,
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
    -- omset field = Modal (capital)
    -- total_loan_amount = Omset (selling price / total to be paid)
    INSERT INTO public.credit_contracts (
      id, customer_id, contract_ref, omset, total_loan_amount, 
      tenor_days, daily_installment_amount, start_date, sales_agent_id, 
      status, current_installment_index
    )
    VALUES (
      v_contract_id,
      v_customer_id,
      v_contract_ref,
      v_modal,           -- omset field stores Modal (capital)
      v_omset,           -- total_loan_amount stores Omset (selling price)
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
    
    -- Generate some payments for contracts started before current simulation date
    -- Simulate ~20% payment progress for older contracts
    IF v_start_date < '2026-02-07'::date THEN
      v_payment_count := GREATEST(1, floor(random() * (v_tenor * 0.25))::int);
      
      FOR j IN 1..v_payment_count LOOP
        -- Update coupon status
        UPDATE public.installment_coupons 
        SET status = 'paid'
        WHERE contract_id = v_contract_id 
          AND installment_index = j;
        
        -- Insert payment log
        INSERT INTO public.payment_logs (contract_id, coupon_id, installment_index, amount_paid, payment_date, collector_id, notes)
        SELECT 
          v_contract_id,
          ic.id,
          j,
          v_daily_amount,
          ic.due_date + (floor(random() * 3)::int),
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
-- Omset = total_loan_amount (Harga Jual)
-- Modal = omset field (Capital)
-- Keuntungan = Omset - Modal
SELECT 
  COUNT(*) as total_contracts,
  SUM(omset) as total_modal,
  SUM(total_loan_amount) as total_omset,
  SUM(total_loan_amount) - SUM(omset) as total_keuntungan,
  ROUND((SUM(total_loan_amount) - SUM(omset)) / NULLIF(SUM(omset), 0) * 100, 2) as margin_persen
FROM public.credit_contracts 
WHERE start_date >= '2026-01-01' AND start_date < '2027-01-01';
