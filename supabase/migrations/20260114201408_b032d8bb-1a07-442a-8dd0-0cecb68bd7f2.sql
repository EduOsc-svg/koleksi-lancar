-- 1. Migrate collectors data from sales_agents to collectors table
INSERT INTO public.collectors (collector_code, name, phone)
SELECT agent_code, name, phone
FROM public.sales_agents
WHERE agent_code LIKE 'K%'
ON CONFLICT (collector_code) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

-- 2. Update customer codes from K01, K02... to A001, A002...
UPDATE public.customers
SET customer_code = 'A' || LPAD(SUBSTRING(customer_code FROM 2), 3, '0')
WHERE customer_code LIKE 'K%' AND customer_code ~ '^K[0-9]+$';

-- 3. Delete collector data from sales_agents (they shouldn't be there)
DELETE FROM public.sales_agents WHERE agent_code LIKE 'K%';

-- 4. Add proper foreign key constraints (if not exists)
DO $$
BEGIN
  -- Check and add FK for routes.default_collector_id -> collectors.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'routes_default_collector_id_fkey'
  ) THEN
    ALTER TABLE public.routes
    ADD CONSTRAINT routes_default_collector_id_fkey
    FOREIGN KEY (default_collector_id) REFERENCES public.collectors(id) ON DELETE SET NULL;
  END IF;
  
  -- Check and add FK for payment_logs.collector_id -> collectors.id  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_logs_collector_id_fkey'
  ) THEN
    ALTER TABLE public.payment_logs
    ADD CONSTRAINT payment_logs_collector_id_fkey
    FOREIGN KEY (collector_id) REFERENCES public.collectors(id) ON DELETE SET NULL;
  END IF;
END $$;