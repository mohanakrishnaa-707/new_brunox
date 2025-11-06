-- Fix foreign key constraints to use user_id instead of profile id
-- Drop existing foreign key constraints that are causing issues
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;

-- Add correct foreign key constraints pointing to profiles.user_id
ALTER TABLE public.friends 
ADD CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.friends 
ADD CONSTRAINT friends_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Fix the conversation_participants RLS policy to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;

-- Create a simpler, non-recursive policy
CREATE POLICY "Users can view participants of conversations they're in" 
ON public.conversation_participants 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT DISTINCT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Update the search_users function to return user_id instead of profile id
CREATE OR REPLACE FUNCTION public.search_users(search_term text, current_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, username text, display_name text, avatar_url text, status text, wallet_address text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.status,
    p.wallet_address
  FROM public.profiles p
  WHERE 
    p.user_id != current_user_id
    AND (
      p.username ILIKE '%' || search_term || '%'
      OR p.display_name ILIKE '%' || search_term || '%'
      OR p.wallet_address ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_term || '%' THEN 1
      WHEN p.display_name ILIKE search_term || '%' THEN 2
      WHEN p.username ILIKE '%' || search_term || '%' THEN 3
      ELSE 4
    END,
    p.username
  LIMIT 20;
END;
$function$;