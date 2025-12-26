-- Add omset (revenue) column to credit_contracts table
ALTER TABLE public.credit_contracts 
ADD COLUMN omset numeric DEFAULT 0;

-- Add commission_percentage column to sales_agents table
ALTER TABLE public.sales_agents 
ADD COLUMN commission_percentage numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.credit_contracts.omset IS 'Revenue/omset from this contract';
COMMENT ON COLUMN public.sales_agents.commission_percentage IS 'Commission percentage for calculating earnings from omset';