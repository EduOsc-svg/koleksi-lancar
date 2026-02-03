-- =========================================
-- DELETE ALL DATA SCRIPT
-- =========================================
-- This script deletes all contracts and customers data
-- Order is important due to foreign key constraints
-- Run this in Supabase SQL Editor

-- Step 1: Delete activity logs (references customers, contracts)
DELETE FROM public.activity_logs;

-- Step 2: Delete payment logs (references credit_contracts, installment_coupons)
DELETE FROM public.payment_logs;

-- Step 3: Delete installment coupons (references credit_contracts)
DELETE FROM public.installment_coupons;

-- Step 4: Delete credit contracts (references customers, sales_agents)
DELETE FROM public.credit_contracts;

-- Step 5: Delete customers
DELETE FROM public.customers;

-- Note: sales_agents, collectors, holidays, operational_expenses, and user_roles are NOT deleted
-- as they are master/reference data that should be preserved

-- Verify deletion
SELECT 'activity_logs' as table_name, COUNT(*) as remaining FROM public.activity_logs
UNION ALL
SELECT 'payment_logs', COUNT(*) FROM public.payment_logs
UNION ALL
SELECT 'installment_coupons', COUNT(*) FROM public.installment_coupons
UNION ALL
SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers;

SELECT '✅ All contracts and customers data deleted!' as status;