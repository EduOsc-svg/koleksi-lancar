-- =========================================
-- TABEL PEMBAYARAN KOMISI SALES AGENT
-- Untuk tracking kapan komisi dicairkan
-- =========================================

CREATE TABLE public.commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_agent_id UUID NOT NULL REFERENCES public.sales_agents(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.credit_contracts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate commission payment for same contract
ALTER TABLE public.commission_payments 
ADD CONSTRAINT unique_commission_per_contract UNIQUE (contract_id);

-- Enable RLS
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view commission_payments" 
ON public.commission_payments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert commission_payments" 
ON public.commission_payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update commission_payments" 
ON public.commission_payments 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete commission_payments" 
ON public.commission_payments 
FOR DELETE 
USING (true);

-- Index for faster lookups
CREATE INDEX idx_commission_payments_sales_agent ON public.commission_payments(sales_agent_id);
CREATE INDEX idx_commission_payments_contract ON public.commission_payments(contract_id);
CREATE INDEX idx_commission_payments_date ON public.commission_payments(payment_date);