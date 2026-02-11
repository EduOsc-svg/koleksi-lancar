
-- Table to track coupon handovers from admin to collectors
CREATE TABLE public.coupon_handovers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id uuid NOT NULL REFERENCES public.collectors(id),
  contract_id uuid NOT NULL REFERENCES public.credit_contracts(id),
  coupon_count integer NOT NULL,
  start_index integer NOT NULL,
  end_index integer NOT NULL,
  handover_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupon_handovers ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view coupon_handovers"
  ON public.coupon_handovers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert coupon_handovers"
  ON public.coupon_handovers FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update coupon_handovers"
  ON public.coupon_handovers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete coupon_handovers"
  ON public.coupon_handovers FOR DELETE
  TO authenticated USING (true);
