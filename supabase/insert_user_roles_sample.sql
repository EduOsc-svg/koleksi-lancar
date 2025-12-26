-- =========================================
-- USER ROLES SAMPLE DATA
-- =========================================
-- Note: This requires actual user IDs from auth.users table
-- These are example UUIDs - replace with real user IDs when needed

-- Sample admin user (replace UUID with actual user ID from auth.users)
INSERT INTO public.user_roles (id, user_id, role) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'admin'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'user'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'user'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'user');

-- To get actual user IDs, run this query first:
-- SELECT id, email FROM auth.users;