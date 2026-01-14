-- Create collectors table
CREATE TABLE public.collectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view collectors"
ON public.collectors FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert collectors"
ON public.collectors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update collectors"
ON public.collectors FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete collectors"
ON public.collectors FOR DELETE
USING (true);

-- Update routes table to reference collectors properly
ALTER TABLE public.routes 
DROP COLUMN IF EXISTS default_collector_id;

ALTER TABLE public.routes 
ADD COLUMN default_collector_id UUID REFERENCES public.collectors(id) ON DELETE SET NULL;

-- Update payment_logs to reference collectors
-- First drop the old column if it exists without constraint
ALTER TABLE public.payment_logs 
DROP COLUMN IF EXISTS collector_id;

ALTER TABLE public.payment_logs 
ADD COLUMN collector_id UUID REFERENCES public.collectors(id) ON DELETE SET NULL;

-- Insert sample collectors
INSERT INTO public.collectors (collector_code, name, phone) VALUES
('K01', 'Kolektor Satu', '081234567001'),
('K02', 'Kolektor Dua', '081234567002'),
('K03', 'Kolektor Tiga', '081234567003');