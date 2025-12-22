-- Add customer_code column to customers table
ALTER TABLE public.customers 
ADD COLUMN customer_code text UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);