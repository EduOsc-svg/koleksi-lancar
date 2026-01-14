-- 1. Drop the existing view that depends on routes
DROP VIEW IF EXISTS public.invoice_details;

-- 2. Drop foreign key constraint from customers.route_id
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_route_id_fkey;

-- 3. Drop the route_id column from customers
ALTER TABLE public.customers DROP COLUMN IF EXISTS route_id;

-- 4. Drop the routes table entirely
DROP TABLE IF EXISTS public.routes CASCADE;

-- 5. Recreate invoice_details view WITHOUT route references
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
    -- No Faktur format: TENOR/KODE_SALES/KODE_KONSUMEN
    CONCAT(cc.tenor_days, '/', COALESCE(sa.agent_code, 'N/A'), '/', COALESCE(c.customer_code, 'N/A')) AS no_faktur,
    cc.created_at
FROM public.credit_contracts cc
JOIN public.customers c ON cc.customer_id = c.id
LEFT JOIN public.sales_agents sa ON c.assigned_sales_id = sa.id;