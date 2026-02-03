-- Remove assigned_sales_id column from customers table
-- Sales agent relationship is now only through contracts, not customer profiles

ALTER TABLE public.customers DROP COLUMN IF EXISTS assigned_sales_id;