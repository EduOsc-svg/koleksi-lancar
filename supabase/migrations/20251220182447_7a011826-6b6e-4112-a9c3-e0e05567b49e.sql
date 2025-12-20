-- Create sales_agents table (Collectors)
CREATE TABLE public.sales_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routes table (Jalur)
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  default_collector_id UUID REFERENCES public.sales_agents(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  assigned_sales_id UUID REFERENCES public.sales_agents(id),
  route_id UUID NOT NULL REFERENCES public.routes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_contracts table (The Loan Header)
CREATE TABLE public.credit_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_ref TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  product_type TEXT,
  total_loan_amount NUMERIC NOT NULL DEFAULT 0,
  tenor_days INTEGER NOT NULL DEFAULT 100,
  daily_installment_amount NUMERIC NOT NULL DEFAULT 0,
  current_installment_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_logs table (Transaction History)
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.credit_contracts(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_index INTEGER NOT NULL,
  amount_paid NUMERIC NOT NULL,
  collector_id UUID REFERENCES public.sales_agents(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_details view with computed no_faktur
CREATE OR REPLACE VIEW public.invoice_details AS
SELECT 
  cc.id,
  cc.contract_ref,
  cc.customer_id,
  c.name AS customer_name,
  c.address AS customer_address,
  c.phone AS customer_phone,
  cc.product_type,
  cc.total_loan_amount,
  cc.tenor_days,
  cc.daily_installment_amount,
  cc.current_installment_index,
  cc.status,
  sa.id AS sales_agent_id,
  sa.agent_code,
  sa.name AS sales_agent_name,
  r.id AS route_id,
  r.code AS route_code,
  r.name AS route_name,
  CAST(cc.tenor_days AS TEXT) || '/' || sa.agent_code || '/' || UPPER(sa.name) AS no_faktur,
  cc.created_at
FROM public.credit_contracts cc
JOIN public.customers c ON cc.customer_id = c.id
LEFT JOIN public.sales_agents sa ON c.assigned_sales_id = sa.id
LEFT JOIN public.routes r ON c.route_id = r.id;

-- Function to get next coupon number for a contract
CREATE OR REPLACE FUNCTION public.get_next_coupon(contract_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_index INTEGER;
BEGIN
  SELECT current_installment_index + 1 INTO next_index
  FROM public.credit_contracts
  WHERE id = contract_id;
  
  RETURN COALESCE(next_index, 1);
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for admin-only prototype (as requested)
ALTER TABLE public.sales_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs DISABLE ROW LEVEL SECURITY;