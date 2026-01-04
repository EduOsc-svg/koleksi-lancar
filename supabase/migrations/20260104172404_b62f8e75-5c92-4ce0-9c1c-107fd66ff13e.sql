-- Create operational_expenses table for tracking monthly operational costs
CREATE TABLE public.operational_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.operational_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view operational_expenses"
ON public.operational_expenses
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert operational_expenses"
ON public.operational_expenses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update operational_expenses"
ON public.operational_expenses
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete operational_expenses"
ON public.operational_expenses
FOR DELETE
USING (true);

-- Create index for faster date-based queries
CREATE INDEX idx_operational_expenses_date ON public.operational_expenses(expense_date);