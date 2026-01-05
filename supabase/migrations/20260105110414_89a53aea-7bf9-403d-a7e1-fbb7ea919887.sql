-- Reset and repopulate database with proper codes and distributed data
-- Sales: S001-S020, Collectors: K01-K20, Routes: A001-A100

-- Step 1: Clear existing data
TRUNCATE payment_logs, installment_coupons, credit_contracts, customers, operational_expenses, routes, sales_agents CASCADE;

-- Step 2: Insert 20 Sales Agents (S001-S020)
INSERT INTO sales_agents (agent_code, name, phone, commission_percentage) VALUES
('S001', 'Ahmad Wijaya', '081234567001', 5),
('S002', 'Budi Santoso', '081234567002', 5),
('S003', 'Citra Dewi', '081234567003', 6),
('S004', 'Dedi Prasetyo', '081234567004', 5),
('S005', 'Eka Putra', '081234567005', 5.5),
('S006', 'Fajar Hidayat', '081234567006', 6),
('S007', 'Gita Permata', '081234567007', 5),
('S008', 'Hendra Kusuma', '081234567008', 5.5),
('S009', 'Indra Lesmana', '081234567009', 5),
('S010', 'Joko Susilo', '081234567010', 6),
('S011', 'Kartika Sari', '081234567011', 5),
('S012', 'Lukman Hakim', '081234567012', 5.5),
('S013', 'Maya Anggraini', '081234567013', 5),
('S014', 'Nanda Pratama', '081234567014', 6),
('S015', 'Oscar Firmansyah', '081234567015', 5),
('S016', 'Putri Handayani', '081234567016', 5.5),
('S017', 'Qori Ramadhan', '081234567017', 5),
('S018', 'Rizky Aditya', '081234567018', 6),
('S019', 'Sinta Maharani', '081234567019', 5),
('S020', 'Taufik Ismail', '081234567020', 5.5);

-- Step 3: Insert 20 Collectors (K01-K20)
INSERT INTO sales_agents (agent_code, name, phone, commission_percentage) VALUES
('K01', 'Kolektor Agus', '082111111001', 3),
('K02', 'Kolektor Bambang', '082111111002', 3),
('K03', 'Kolektor Cahyo', '082111111003', 3.5),
('K04', 'Kolektor Dimas', '082111111004', 3),
('K05', 'Kolektor Eko', '082111111005', 3),
('K06', 'Kolektor Faisal', '082111111006', 3.5),
('K07', 'Kolektor Gunawan', '082111111007', 3),
('K08', 'Kolektor Hadi', '082111111008', 3),
('K09', 'Kolektor Irfan', '082111111009', 3.5),
('K10', 'Kolektor Johan', '082111111010', 3),
('K11', 'Kolektor Kurniawan', '082111111011', 3),
('K12', 'Kolektor Lutfi', '082111111012', 3.5),
('K13', 'Kolektor Mulyadi', '082111111013', 3),
('K14', 'Kolektor Nugroho', '082111111014', 3),
('K15', 'Kolektor Oktavian', '082111111015', 3.5),
('K16', 'Kolektor Prasetyo', '082111111016', 3),
('K17', 'Kolektor Qomar', '082111111017', 3),
('K18', 'Kolektor Ridwan', '082111111018', 3.5),
('K19', 'Kolektor Surya', '082111111019', 3),
('K20', 'Kolektor Teguh', '082111111020', 3);

-- Step 4: Insert 100 Routes (A001-A100) with collectors
DO $$
DECLARE
  collector_ids uuid[];
  i integer;
  collector_idx integer;
BEGIN
  SELECT array_agg(id ORDER BY agent_code) INTO collector_ids
  FROM sales_agents WHERE agent_code LIKE 'K%';
  
  FOR i IN 1..100 LOOP
    collector_idx := ((i - 1) % 20) + 1;
    INSERT INTO routes (code, name, default_collector_id)
    VALUES (
      'A' || LPAD(i::text, 3, '0'),
      'Jalur A' || LPAD(i::text, 3, '0'),
      collector_ids[collector_idx]
    );
  END LOOP;
END $$;

-- Step 5: Insert 100 Customers
DO $$
DECLARE
  route_rec RECORD;
  sales_ids uuid[];
  sales_idx integer;
  customer_names text[] := ARRAY[
    'Bambang Sutrisno', 'Agung Prabowo', 'Wahyu Hidayat', 'Dwi Nugroho', 'Sri Wahyuni',
    'Rina Susanti', 'Yuli Astuti', 'Dewi Lestari', 'Tri Handoko', 'Andi Permadi',
    'Slamet Riyadi', 'Joko Purnomo', 'Sugeng Priyanto', 'Wawan Setiawan', 'Heri Susanto',
    'Darmawan Putra', 'Suryadi Wibowo', 'Eko Prasetyo', 'Budi Raharjo', 'Agus Salim',
    'Yanto Wijaya', 'Suyanto Mulyo', 'Bambang Pamungkas', 'Hendro Susilo', 'Suparman Jaya',
    'Maryanto Utomo', 'Sugianto Adi', 'Winarno Hadi', 'Suharto Budi', 'Sutomo Eko',
    'Margono Santoso', 'Supardi Joko', 'Waluyo Dwi', 'Suherman Tri', 'Yatno Agung',
    'Parman Wahyu', 'Warno Sri', 'Sukardi Rina', 'Karno Yuli', 'Mujiono Dewi',
    'Sumardi Tri', 'Purnomo Andi', 'Sutrisno Slamet', 'Suyono Joko', 'Warsito Sugeng',
    'Tarno Wawan', 'Sumanto Heri', 'Sunaryo Darmawan', 'Jumadi Suryadi', 'Wagiman Eko',
    'Sukiman Budi', 'Supriyadi Agus', 'Sutarno Yanto', 'Poniman Suyanto', 'Saimin Bambang',
    'Suwardi Hendro', 'Suparno Suparman', 'Suwarno Maryanto', 'Mugiono Sugianto', 'Sarno Winarno',
    'Darmo Suharto', 'Sukirno Sutomo', 'Yusuf Margono', 'Kasiran Supardi', 'Sulaiman Waluyo',
    'Parjo Suherman', 'Surono Yatno', 'Karman Parman', 'Samidi Warno', 'Warsono Sukardi',
    'Sutikno Karno', 'Sukarto Mujiono', 'Subandi Sumardi', 'Sudirman Purnomo', 'Karsono Sutrisno',
    'Mulyono Suyono', 'Triyono Warsito', 'Wahyono Tarno', 'Sujono Sumanto', 'Prayitno Sunaryo',
    'Sartono Jumadi', 'Suryono Wagiman', 'Sukamto Sukiman', 'Suwanto Supriyadi', 'Pranoto Sutarno',
    'Haryono Poniman', 'Sugiyanto Saimin', 'Sunarto Suwardi', 'Supriyono Suparno', 'Sutejo Suwarno',
    'Widodo Mugiono', 'Slamet Sarno', 'Sumarno Darmo', 'Suprapto Sukirno', 'Purwanto Yusuf',
    'Rusman Kasiran', 'Suroso Sulaiman', 'Sugito Parjo', 'Suyitno Surono', 'Untung Karman'
  ];
  counter integer := 0;
BEGIN
  SELECT array_agg(id ORDER BY agent_code) INTO sales_ids
  FROM sales_agents WHERE agent_code LIKE 'S%';
  
  FOR route_rec IN SELECT id, code FROM routes ORDER BY code LOOP
    counter := counter + 1;
    sales_idx := ((counter - 1) % 20) + 1;
    
    INSERT INTO customers (name, route_id, assigned_sales_id, phone, address)
    VALUES (
      customer_names[counter],
      route_rec.id,
      sales_ids[sales_idx],
      '08' || (1000000000 + counter)::text,
      'Jl. ' || customer_names[counter] || ' No. ' || counter || ', Jakarta'
    );
  END LOOP;
END $$;

-- Step 6: Insert 100 Contracts distributed across months (Oct 2025 - Jan 2026)
DO $$
DECLARE
  customer_rec RECORD;
  sales_ids uuid[];
  counter integer := 0;
  contract_id uuid;
  start_dates date[] := ARRAY[
    '2025-10-01'::date, '2025-10-15'::date,
    '2025-11-01'::date, '2025-11-15'::date,
    '2025-12-01'::date, '2025-12-15'::date,
    '2026-01-01'::date, '2026-01-02'::date
  ];
  loan_amounts numeric[] := ARRAY[1000000, 1500000, 2000000, 2500000, 3000000, 3500000, 4000000, 5000000];
  tenor_options integer[] := ARRAY[50, 100];
  omset_amount numeric;
  loan_amount numeric;
  tenor integer;
  daily_amount numeric;
  start_date date;
  date_idx integer;
  sales_idx integer;
BEGIN
  SELECT array_agg(id ORDER BY agent_code) INTO sales_ids
  FROM sales_agents WHERE agent_code LIKE 'S%';
  
  FOR customer_rec IN 
    SELECT c.id as customer_id, c.assigned_sales_id, r.code as route_code
    FROM customers c
    JOIN routes r ON c.route_id = r.id
    ORDER BY r.code
  LOOP
    counter := counter + 1;
    date_idx := ((counter - 1) % 8) + 1;
    start_date := start_dates[date_idx];
    loan_amount := loan_amounts[((counter - 1) % 8) + 1];
    tenor := tenor_options[((counter - 1) % 2) + 1];
    omset_amount := loan_amount * (1.2 + (random() * 0.1));
    daily_amount := omset_amount / tenor;
    sales_idx := ((counter - 1) % 20) + 1;
    
    INSERT INTO credit_contracts (
      contract_ref, customer_id, sales_agent_id,
      total_loan_amount, omset, tenor_days, daily_installment_amount,
      start_date, status, product_type
    ) VALUES (
      customer_rec.route_code,
      customer_rec.customer_id,
      sales_ids[sales_idx],
      loan_amount,
      omset_amount,
      tenor,
      ROUND(daily_amount, 0),
      start_date,
      'active',
      CASE 
        WHEN counter % 5 = 0 THEN 'Elektronik'
        WHEN counter % 5 = 1 THEN 'Furniture'
        WHEN counter % 5 = 2 THEN 'Pakaian'
        WHEN counter % 5 = 3 THEN 'Perhiasan'
        ELSE 'Lainnya'
      END
    ) RETURNING id INTO contract_id;
    
    -- Generate coupons manually instead of using function
    FOR i IN 1..tenor LOOP
      INSERT INTO installment_coupons (contract_id, installment_index, amount, due_date, status)
      VALUES (
        contract_id,
        i,
        ROUND(daily_amount, 0),
        start_date + (i - 1),
        'unpaid'
      );
    END LOOP;
  END LOOP;
END $$;

-- Step 7: Generate payment logs distributed across months
DO $$
DECLARE
  coupon_rec RECORD;
  collector_ids uuid[];
  collector_idx integer;
  payment_count integer := 0;
BEGIN
  SELECT array_agg(id ORDER BY agent_code) INTO collector_ids
  FROM sales_agents WHERE agent_code LIKE 'K%';
  
  FOR coupon_rec IN 
    SELECT ic.id, ic.contract_id, ic.amount, ic.due_date, ic.installment_index,
           r.default_collector_id
    FROM installment_coupons ic
    JOIN credit_contracts cc ON ic.contract_id = cc.id
    JOIN customers cu ON cc.customer_id = cu.id
    JOIN routes r ON cu.route_id = r.id
    WHERE ic.due_date <= CURRENT_DATE
    AND ic.status = 'unpaid'
    ORDER BY ic.due_date
    LIMIT 500
  LOOP
    payment_count := payment_count + 1;
    collector_idx := ((payment_count - 1) % 20) + 1;
    
    UPDATE installment_coupons SET status = 'paid' WHERE id = coupon_rec.id;
    
    INSERT INTO payment_logs (
      contract_id, coupon_id, amount_paid, payment_date, 
      installment_index, collector_id, notes
    ) VALUES (
      coupon_rec.contract_id,
      coupon_rec.id,
      coupon_rec.amount,
      coupon_rec.due_date,
      coupon_rec.installment_index,
      COALESCE(coupon_rec.default_collector_id, collector_ids[collector_idx]),
      'Pembayaran rutin'
    );
  END LOOP;
END $$;

-- Step 8: Insert operational expenses distributed across months
INSERT INTO operational_expenses (description, amount, expense_date, category, notes) VALUES
('Gaji Karyawan Oktober', 15000000, '2025-10-25', 'Gaji', 'Gaji bulan Oktober'),
('BBM Kendaraan Oktober', 2500000, '2025-10-20', 'Transportasi', 'BBM motor kolektor'),
('ATK Oktober', 500000, '2025-10-15', 'Kantor', 'Alat tulis kantor'),
('Gaji Karyawan November', 15000000, '2025-11-25', 'Gaji', 'Gaji bulan November'),
('BBM Kendaraan November', 2800000, '2025-11-20', 'Transportasi', 'BBM motor kolektor'),
('Sewa Gedung November', 5000000, '2025-11-01', 'Sewa', 'Sewa kantor bulanan'),
('Gaji Karyawan Desember', 15000000, '2025-12-25', 'Gaji', 'Gaji bulan Desember'),
('THR Karyawan', 30000000, '2025-12-20', 'Gaji', 'THR Hari Raya'),
('BBM Kendaraan Desember', 3000000, '2025-12-15', 'Transportasi', 'BBM motor kolektor'),
('Perbaikan Kendaraan', 2000000, '2025-12-10', 'Transportasi', 'Service motor'),
('Gaji Karyawan Januari', 15000000, '2026-01-03', 'Gaji', 'Gaji bulan Januari'),
('BBM Kendaraan Januari', 2500000, '2026-01-02', 'Transportasi', 'BBM motor kolektor'),
('Sewa Gedung Januari', 5000000, '2026-01-01', 'Sewa', 'Sewa kantor bulanan');