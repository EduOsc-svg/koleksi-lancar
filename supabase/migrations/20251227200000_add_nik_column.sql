-- Add NIK column to customers table
ALTER TABLE public.customers 
ADD COLUMN nik text;

-- Add comment for clarity
COMMENT ON COLUMN public.customers.nik IS 'Nomor Induk Kependudukan (Indonesian National ID Number) - 16 digits';