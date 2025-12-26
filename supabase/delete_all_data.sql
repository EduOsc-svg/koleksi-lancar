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
DELETE FROM public.routes;
DELETE FROM public.sales_agents;
DELETE FROM public.holidays;
DELETE FROM public.user_roles;

-- Reset sequences if needed (though UUIDs don't need this)
-- This is just for completeness

-- Verify deletion
SELECT 'payment_logs' as table_name, COUNT(*) as remaining_records FROM public.payment_logs
UNION ALL
SELECT 'installment_coupons', COUNT(*) FROM public.installment_coupons
UNION ALL
SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'routes', COUNT(*) FROM public.routes
UNION ALL
SELECT 'sales_agents', COUNT(*) FROM public.sales_agents
UNION ALL
SELECT 'holidays', COUNT(*) FROM public.holidays
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles;