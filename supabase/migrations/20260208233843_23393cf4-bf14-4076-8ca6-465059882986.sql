-- Fix existing contracts that are fully paid but still marked as active
UPDATE credit_contracts 
SET status = 'completed'
WHERE current_installment_index >= tenor_days 
AND status = 'active';