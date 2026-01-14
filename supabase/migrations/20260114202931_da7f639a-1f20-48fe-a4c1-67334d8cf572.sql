-- Remove route_id column from activity_logs table
ALTER TABLE public.activity_logs DROP COLUMN IF EXISTS route_id;