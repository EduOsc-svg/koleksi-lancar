-- =========================================
-- DELETE ALL DATA SCRIPT
-- =========================================
-- This script deletes all data from all tables
-- Order is important due to foreign key constraints

-- Delete data in reverse dependency order
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.holidays;
DELETE FROM public.operational_expenses;
DELETE FROM public.activity_logs;

-- Note: sales_agents, collectors, and user_roles are NOT deleted
-- as they are master data that should be preserved

-- Verify deletion
SELECT 'payment_logs' as table_name, COUNT(*) as remaining_records FROM public.payment_logs
UNION ALL
SELECT 'installment_coupons', COUNT(*) FROM public.installment_coupons
UNION ALL
SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers;