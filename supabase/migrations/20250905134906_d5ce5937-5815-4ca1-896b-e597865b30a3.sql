-- Fix the conversation_participants RLS policy properly to prevent infinite recursion
-- First drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;

-- Create a security definer function to get user's conversation IDs
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(user_uuid uuid)
RETURNS TABLE(conversation_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.conversation_id 
  FROM public.conversation_participants cp
  WHERE cp.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create a non-recursive policy using the security definer function
CREATE POLICY "Users can view participants of conversations they're in" 
ON public.conversation_participants 
FOR SELECT 
USING (conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));