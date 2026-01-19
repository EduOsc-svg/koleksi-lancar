-- Add business_address column to customers table
ALTER TABLE public.customers
ADD COLUMN business_address text;

-- Add comment for clarity
COMMENT ON COLUMN public.customers.business_address IS 'Alamat usaha pelanggan (digunakan untuk cetak kupon)';