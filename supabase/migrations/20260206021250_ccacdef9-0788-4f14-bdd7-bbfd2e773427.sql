-- Create commission tiers table for tiered commission calculation
CREATE TABLE public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC, -- NULL means unlimited (100jt+)
  percentage NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view commission_tiers" 
  ON public.commission_tiers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert commission_tiers" 
  ON public.commission_tiers FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update commission_tiers" 
  ON public.commission_tiers FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete commission_tiers" 
  ON public.commission_tiers FOR DELETE USING (true);

-- Insert default tier values based on the user's reference
INSERT INTO public.commission_tiers (min_amount, max_amount, percentage) VALUES
  (0, 29999999, 5),          -- < 30jt = 5%
  (30000000, 39999999, 5),    -- 30jt = 5%
  (40000000, 49999999, 5.25), -- 40jt = 5.25%
  (50000000, 59999999, 6),    -- 50jt = 6%
  (60000000, 69999999, 7),    -- 60jt = 7%
  (70000000, 79999999, 7.25), -- 70jt = 7.25%
  (80000000, 89999999, 7.5),  -- 80jt = 7.5%
  (90000000, 99999999, 7.75), -- 90jt = 7.75%
  (100000000, NULL, 8.25);    -- 100jt+ = 8.25%

-- Add yearly bonus percentage setting (0.8% default)
-- We'll store this as a simple config in a settings approach or just hardcode for now

-- Add use_tiered_commission flag to sales_agents to choose system
ALTER TABLE public.sales_agents 
  ADD COLUMN use_tiered_commission BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX idx_commission_tiers_amount ON public.commission_tiers (min_amount, max_amount);