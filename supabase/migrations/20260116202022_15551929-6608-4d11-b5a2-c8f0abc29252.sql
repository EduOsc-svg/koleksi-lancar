-- Delete all data from all tables in correct order (respecting foreign keys)
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.sales_agents;
DELETE FROM public.collectors;
DELETE FROM public.holidays;
DELETE FROM public.operational_expenses;
DELETE FROM public.activity_logs;