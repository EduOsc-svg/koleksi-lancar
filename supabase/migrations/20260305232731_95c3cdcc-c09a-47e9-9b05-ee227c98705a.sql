
-- Clear existing tiers
DELETE FROM public.commission_tiers;

-- Insert commission tiers based on business rules
INSERT INTO public.commission_tiers (min_amount, max_amount, percentage) VALUES
(30000000, 39999999, 5),
(40000000, 49999999, 5.25),
(50000000, 59999999, 6),
(60000000, 69999999, 7),
(70000000, 79999999, 7.25),
(80000000, 89999999, 7.5),
(90000000, 99999999, 7.75),
(100000000, NULL, 8.25);
