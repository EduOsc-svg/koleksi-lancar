-- Add holiday_type and day_of_week columns to holidays table
ALTER TABLE public.holidays 
ADD COLUMN holiday_type text NOT NULL DEFAULT 'specific_date',
ADD COLUMN day_of_week integer NULL;

-- Add constraint to ensure day_of_week is valid (0=Sunday, 6=Saturday)
ALTER TABLE public.holidays
ADD CONSTRAINT valid_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));

-- Add constraint to ensure correct fields based on type
ALTER TABLE public.holidays
ADD CONSTRAINT holiday_type_fields CHECK (
  (holiday_type = 'specific_date' AND holiday_date IS NOT NULL) OR
  (holiday_type = 'recurring_weekday' AND day_of_week IS NOT NULL)
);

-- Make holiday_date nullable for recurring weekday type
ALTER TABLE public.holidays ALTER COLUMN holiday_date DROP NOT NULL;

-- Drop the unique constraint on holiday_date since we now have recurring types
ALTER TABLE public.holidays DROP CONSTRAINT IF EXISTS holidays_holiday_date_key;

-- Add unique constraint for recurring weekdays (only one entry per day of week)
CREATE UNIQUE INDEX holidays_day_of_week_unique ON public.holidays (day_of_week) WHERE holiday_type = 'recurring_weekday';

-- Update the generate_installment_coupons function to handle both types
CREATE OR REPLACE FUNCTION public.generate_installment_coupons(
  p_contract_id uuid,
  p_start_date date,
  p_tenor_days integer,
  p_daily_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_date DATE := p_start_date;
  v_coupon_index INTEGER := 1;
  v_specific_holidays DATE[];
  v_recurring_weekdays INTEGER[];
BEGIN
  -- Fetch all specific holiday dates into an array
  SELECT ARRAY_AGG(holiday_date) INTO v_specific_holidays 
  FROM public.holidays 
  WHERE holiday_type = 'specific_date' AND holiday_date IS NOT NULL;
  
  -- Fetch all recurring weekday numbers into an array
  SELECT ARRAY_AGG(day_of_week) INTO v_recurring_weekdays 
  FROM public.holidays 
  WHERE holiday_type = 'recurring_weekday' AND day_of_week IS NOT NULL;
  
  -- If no holidays, initialize as empty arrays
  IF v_specific_holidays IS NULL THEN
    v_specific_holidays := ARRAY[]::DATE[];
  END IF;
  
  IF v_recurring_weekdays IS NULL THEN
    v_recurring_weekdays := ARRAY[]::INTEGER[];
  END IF;
  
  -- Generate coupons respecting both holiday types
  WHILE v_coupon_index <= p_tenor_days LOOP
    -- Skip if current date is a specific holiday OR is a recurring weekday holiday
    IF v_current_date = ANY(v_specific_holidays) OR EXTRACT(DOW FROM v_current_date)::INTEGER = ANY(v_recurring_weekdays) THEN
      v_current_date := v_current_date + INTERVAL '1 day';
      CONTINUE;
    END IF;
    
    -- Insert the coupon
    INSERT INTO public.installment_coupons (
      contract_id,
      installment_index,
      due_date,
      amount,
      status
    ) VALUES (
      p_contract_id,
      v_coupon_index,
      v_current_date,
      p_daily_amount,
      'unpaid'
    );
    
    v_coupon_index := v_coupon_index + 1;
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
END;
$$;