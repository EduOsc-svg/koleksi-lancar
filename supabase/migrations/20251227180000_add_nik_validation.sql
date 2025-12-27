-- Add validation constraint for NIK field
-- NIK must be exactly 16 digits

-- Add constraint to ensure NIK is exactly 16 characters and contains only digits
ALTER TABLE customers 
ADD CONSTRAINT check_nik_format 
CHECK (nik IS NULL OR (nik ~ '^[0-9]{16}$'));

-- Add NOT NULL constraint for NIK
ALTER TABLE customers 
ALTER COLUMN nik SET NOT NULL;

-- Add constraint to ensure NIK is unique
ALTER TABLE customers 
ADD CONSTRAINT unique_nik 
UNIQUE (nik);

-- Comment on constraints
COMMENT ON CONSTRAINT check_nik_format ON customers IS 'NIK must be exactly 16 digits';
COMMENT ON CONSTRAINT unique_nik ON customers IS 'NIK must be unique across all customers';