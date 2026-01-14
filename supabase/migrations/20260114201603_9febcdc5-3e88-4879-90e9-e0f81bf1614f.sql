-- Update customer codes to A001, A002, A003... format
WITH numbered_customers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) as rn
  FROM public.customers
  WHERE customer_code IS NULL OR customer_code = ''
)
UPDATE public.customers c
SET customer_code = 'A' || LPAD(nc.rn::text, 3, '0')
FROM numbered_customers nc
WHERE c.id = nc.id;