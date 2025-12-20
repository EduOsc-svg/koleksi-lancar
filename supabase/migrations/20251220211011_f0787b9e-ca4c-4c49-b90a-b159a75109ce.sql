-- Fix existing functions to have search_path set
CREATE OR REPLACE FUNCTION public.calculate_total_due()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.total_due := (
    SELECT SUM(ic.amount)
    FROM public.credit_contracts cc
    JOIN public.installment_coupons ic ON cc.id = ic.contract_id
    WHERE cc.customer_id = NEW.id
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_installment_index()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.credit_contracts
  SET current_installment_index = NEW.installment_index
  WHERE id = NEW.contract_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_next_coupon(contract_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_index INTEGER;
BEGIN
  SELECT current_installment_index + 1 INTO next_index
  FROM public.credit_contracts
  WHERE id = contract_id;
  RETURN COALESCE(next_index, 1);
END;
$function$;

-- Drop old policies that allow anonymous/public access on credit_contracts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.credit_contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.credit_contracts;

-- Create new properly scoped policies for credit_contracts
CREATE POLICY "Authenticated can view contracts" ON public.credit_contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contracts" ON public.credit_contracts
  FOR INSERT TO authenticated WITH CHECK (true);

-- Revoke public access from tables to prevent anonymous access warnings
REVOKE ALL ON public.credit_contracts FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.payment_logs FROM anon;
REVOKE ALL ON public.routes FROM anon;
REVOKE ALL ON public.sales_agents FROM anon;
REVOKE ALL ON public.user_roles FROM anon;