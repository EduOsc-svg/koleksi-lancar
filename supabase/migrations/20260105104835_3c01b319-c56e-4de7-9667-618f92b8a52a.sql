-- Clear existing data to avoid duplicates
DELETE FROM payment_logs;
DELETE FROM installment_coupons;
DELETE FROM credit_contracts;
DELETE FROM customers;
DELETE FROM sales_agents;
DELETE FROM routes;

-- Insert 10 Sales Agents
INSERT INTO sales_agents (id, agent_code, name, phone, commission_percentage) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'SA001', 'Budi Santoso', '081234567001', 5),
  ('a2222222-2222-2222-2222-222222222222', 'SA002', 'Dewi Lestari', '081234567002', 5),
  ('a3333333-3333-3333-3333-333333333333', 'SA003', 'Ahmad Fauzi', '081234567003', 5),
  ('a4444444-4444-4444-4444-444444444444', 'SA004', 'Siti Nurhaliza', '081234567004', 5),
  ('a5555555-5555-5555-5555-555555555555', 'SA005', 'Eko Prasetyo', '081234567005', 5),
  ('a6666666-6666-6666-6666-666666666666', 'SA006', 'Ratna Sari', '081234567006', 5),
  ('a7777777-7777-7777-7777-777777777777', 'SA007', 'Joko Widodo', '081234567007', 5),
  ('a8888888-8888-8888-8888-888888888888', 'SA008', 'Maya Putri', '081234567008', 5),
  ('a9999999-9999-9999-9999-999999999999', 'SA009', 'Rudi Hartono', '081234567009', 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SA010', 'Linda Wijaya', '081234567010', 5);

-- Insert 10 Routes
INSERT INTO routes (id, code, name, default_collector_id) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'R01', 'Rute Jakarta Utara', 'a1111111-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'R02', 'Rute Jakarta Selatan', 'a2222222-2222-2222-2222-222222222222'),
  ('b3333333-3333-3333-3333-333333333333', 'R03', 'Rute Jakarta Barat', 'a3333333-3333-3333-3333-333333333333'),
  ('b4444444-4444-4444-4444-444444444444', 'R04', 'Rute Jakarta Timur', 'a4444444-4444-4444-4444-444444444444'),
  ('b5555555-5555-5555-5555-555555555555', 'R05', 'Rute Tangerang', 'a5555555-5555-5555-5555-555555555555'),
  ('b6666666-6666-6666-6666-666666666666', 'R06', 'Rute Bekasi', 'a6666666-6666-6666-6666-666666666666'),
  ('b7777777-7777-7777-7777-777777777777', 'R07', 'Rute Depok', 'a7777777-7777-7777-7777-777777777777'),
  ('b8888888-8888-8888-8888-888888888888', 'R08', 'Rute Bogor', 'a8888888-8888-8888-8888-888888888888'),
  ('b9999999-9999-9999-9999-999999999999', 'R09', 'Rute Bandung', 'a9999999-9999-9999-9999-999999999999'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'R10', 'Rute Surabaya', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Generate 100 Customers with DO loop
DO $$
DECLARE
  i INTEGER;
  route_ids UUID[] := ARRAY[
    'b1111111-1111-1111-1111-111111111111'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'b3333333-3333-3333-3333-333333333333'::uuid,
    'b4444444-4444-4444-4444-444444444444'::uuid,
    'b5555555-5555-5555-5555-555555555555'::uuid,
    'b6666666-6666-6666-6666-666666666666'::uuid,
    'b7777777-7777-7777-7777-777777777777'::uuid,
    'b8888888-8888-8888-8888-888888888888'::uuid,
    'b9999999-9999-9999-9999-999999999999'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  ];
  sales_ids UUID[] := ARRAY[
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'a2222222-2222-2222-2222-222222222222'::uuid,
    'a3333333-3333-3333-3333-333333333333'::uuid,
    'a4444444-4444-4444-4444-444444444444'::uuid,
    'a5555555-5555-5555-5555-555555555555'::uuid,
    'a6666666-6666-6666-6666-666666666666'::uuid,
    'a7777777-7777-7777-7777-777777777777'::uuid,
    'a8888888-8888-8888-8888-888888888888'::uuid,
    'a9999999-9999-9999-9999-999999999999'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  ];
  first_names TEXT[] := ARRAY['Andi', 'Budi', 'Citra', 'Dedi', 'Eka', 'Feri', 'Gita', 'Hendra', 'Ira', 'Joko', 'Kartika', 'Lina', 'Mira', 'Nina', 'Oscar', 'Putri', 'Qori', 'Rina', 'Sari', 'Tono'];
  last_names TEXT[] := ARRAY['Santoso', 'Wijaya', 'Pratama', 'Kusuma', 'Saputra', 'Hidayat', 'Putra', 'Lestari', 'Sari', 'Dewi'];
  customer_name TEXT;
  customer_id UUID;
BEGIN
  FOR i IN 1..100 LOOP
    customer_id := gen_random_uuid();
    customer_name := first_names[1 + (i % 20)] || ' ' || last_names[1 + (i % 10)] || ' ' || i::text;
    
    INSERT INTO customers (id, customer_code, name, nik, address, phone, route_id, assigned_sales_id)
    VALUES (
      customer_id,
      'CUST' || LPAD(i::text, 3, '0'),
      customer_name,
      '32' || LPAD(i::text, 14, '0'),
      'Jl. Contoh No. ' || i || ', Jakarta',
      '0812' || LPAD((34567000 + i)::text, 8, '0'),
      route_ids[1 + (i % 10)],
      sales_ids[1 + (i % 10)]
    );
  END LOOP;
END $$;

-- Generate 100 Contracts with varying amounts and tenors
DO $$
DECLARE
  cust RECORD;
  contract_id UUID;
  modal_amount NUMERIC;
  omset_amount NUMERIC;
  tenor INTEGER;
  daily_amount NUMERIC;
  start_dt DATE;
  product_types TEXT[] := ARRAY['Elektronik', 'Furniture', 'Peralatan Rumah', 'Gadget', 'Fashion'];
  contract_counter INTEGER := 0;
BEGIN
  FOR cust IN SELECT id, assigned_sales_id FROM customers LOOP
    contract_counter := contract_counter + 1;
    contract_id := gen_random_uuid();
    
    -- Randomize values
    modal_amount := 500000 + (contract_counter % 20) * 100000; -- 500k to 2.4M
    tenor := 50 + (contract_counter % 5) * 10; -- 50, 60, 70, 80, 90 days
    omset_amount := modal_amount * (1 + 0.30); -- 30% markup
    daily_amount := omset_amount / tenor;
    start_dt := '2025-12-01'::date + ((contract_counter % 30) || ' days')::interval;
    
    INSERT INTO credit_contracts (
      id, contract_ref, customer_id, sales_agent_id,
      total_loan_amount, omset, tenor_days, daily_installment_amount,
      start_date, status, current_installment_index
    ) VALUES (
      contract_id,
      'CTR-2025-' || LPAD(contract_counter::text, 4, '0'),
      cust.id,
      cust.assigned_sales_id,
      modal_amount,
      omset_amount,
      tenor,
      daily_amount,
      start_dt,
      'active',
      0
    );
    
    -- Generate installment coupons for this contract
    PERFORM public.generate_installment_coupons(
      contract_id,
      start_dt,
      tenor,
      daily_amount
    );
  END LOOP;
END $$;

-- Generate payment logs for some contracts (simulate some payments made)
DO $$
DECLARE
  contract RECORD;
  payment_count INTEGER;
  i INTEGER;
  pay_date DATE;
BEGIN
  FOR contract IN 
    SELECT c.id, c.daily_installment_amount, c.sales_agent_id, c.start_date
    FROM credit_contracts c
    LIMIT 60 -- Only 60 contracts have payments
  LOOP
    -- Each contract has 1-15 payments
    payment_count := 1 + (EXTRACT(EPOCH FROM contract.start_date)::INTEGER % 15);
    
    FOR i IN 1..payment_count LOOP
      pay_date := contract.start_date + (i || ' days')::interval;
      
      -- Skip if payment date is in the future
      IF pay_date <= CURRENT_DATE THEN
        INSERT INTO payment_logs (
          contract_id, installment_index, payment_date, amount_paid, collector_id, notes
        ) VALUES (
          contract.id,
          i,
          pay_date,
          contract.daily_installment_amount,
          contract.sales_agent_id,
          'Pembayaran ke-' || i
        );
        
        -- Update current installment index
        UPDATE credit_contracts SET current_installment_index = i WHERE id = contract.id;
        
        -- Mark coupon as paid
        UPDATE installment_coupons 
        SET status = 'paid' 
        WHERE contract_id = contract.id AND installment_index = i;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Insert some operational expenses for current month
INSERT INTO operational_expenses (description, amount, expense_date, category, notes) VALUES
  ('Gaji Staff Admin', 5000000, '2026-01-02', 'Gaji', 'Gaji bulan Januari'),
  ('Bensin Kendaraan Operasional', 1500000, '2026-01-03', 'Transportasi', 'BBM untuk 5 motor'),
  ('Listrik Kantor', 800000, '2026-01-05', 'Utilitas', 'Tagihan PLN'),
  ('Internet & Telepon', 500000, '2026-01-05', 'Utilitas', 'Tagihan bulanan'),
  ('ATK & Supplies', 250000, '2026-01-04', 'Perlengkapan', 'Kertas, tinta printer'),
  ('Makan Siang Tim', 600000, '2026-01-03', 'Operasional', 'Makan siang untuk 10 orang'),
  ('Service Motor', 350000, '2026-01-02', 'Transportasi', 'Service berkala');