-- First, drop the dependent view
DROP VIEW IF EXISTS public.invoice_details;

-- Remove customer_code column from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_code;

-- Recreate the invoice_details view without customer_code
CREATE OR REPLACE VIEW public.invoice_details AS
SELECT 
  cc.id,
  cc.contract_ref,
  cc.customer_id,
  cc.total_loan_amount,
  cc.tenor_days,
  cc.daily_installment_amount,
  cc.current_installment_index,
  cc.sales_agent_id,
  cc.status,
  cc.created_at,
  cc.product_type,
  cc.contract_ref AS no_faktur,
  c.name AS customer_name,
  c.address AS customer_address,
  c.phone AS customer_phone,
  sa.name AS sales_agent_name,
  sa.agent_code
FROM public.credit_contracts cc
LEFT JOIN public.customers c ON cc.customer_id = c.id
LEFT JOIN public.sales_agents sa ON cc.sales_agent_id = sa.id;