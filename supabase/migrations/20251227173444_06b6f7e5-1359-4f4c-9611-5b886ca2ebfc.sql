-- Add sales_agent_id column to credit_contracts table
ALTER TABLE public.credit_contracts 
ADD COLUMN sales_agent_id uuid REFERENCES public.sales_agents(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_credit_contracts_sales_agent_id ON public.credit_contracts(sales_agent_id);