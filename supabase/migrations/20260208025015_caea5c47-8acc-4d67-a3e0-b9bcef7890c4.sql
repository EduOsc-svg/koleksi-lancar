-- Add collector_id column to credit_contracts table
ALTER TABLE public.credit_contracts 
ADD COLUMN collector_id uuid REFERENCES public.collectors(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_credit_contracts_collector_id ON public.credit_contracts(collector_id);