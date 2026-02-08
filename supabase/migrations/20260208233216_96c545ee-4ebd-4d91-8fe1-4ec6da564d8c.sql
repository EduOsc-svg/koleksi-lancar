-- Create or replace function to auto-complete contract when fully paid
CREATE OR REPLACE FUNCTION public.auto_complete_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenor_days INTEGER;
  v_current_index INTEGER;
BEGIN
  -- Get the contract's tenor and current installment index
  SELECT tenor_days, current_installment_index 
  INTO v_tenor_days, v_current_index
  FROM public.credit_contracts 
  WHERE id = NEW.contract_id;
  
  -- If current_installment_index equals tenor_days, mark as completed
  IF v_current_index >= v_tenor_days THEN
    UPDATE public.credit_contracts 
    SET status = 'completed'
    WHERE id = NEW.contract_id 
    AND status != 'completed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after payment is logged
DROP TRIGGER IF EXISTS trigger_auto_complete_contract ON public.payment_logs;
CREATE TRIGGER trigger_auto_complete_contract
  AFTER INSERT ON public.payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_contract();