-- Backfill missing profiles for existing users
INSERT INTO public.profiles (user_id, username, display_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', 'user_' || substring(u.id::text, 1, 8)),
  COALESCE(u.raw_user_meta_data->>'display_name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Create helper function to ensure the current user's profile exists (no trigger needed)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(current_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 'user_' || substring(au.id::text, 1, 8)),
    COALESCE(au.raw_user_meta_data->>'display_name', au.email)
  FROM auth.users au
  WHERE au.id = current_user_id
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;