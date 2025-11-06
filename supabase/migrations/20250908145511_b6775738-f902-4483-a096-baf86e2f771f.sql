-- Fix RLS infinite recursion on conversation_participants by using a SECURITY DEFINER helper
-- 1) Create helper function that checks membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_user_in_conversation(conv_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conv_id
      AND cp.user_id = user_uuid
  );
$$;

-- 2) Replace SELECT policy on conversation_participants to avoid self-reference
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can view participants of conversations they're in"
ON public.conversation_participants
FOR SELECT
USING (
  public.is_user_in_conversation(conversation_participants.conversation_id, auth.uid())
);

-- 3) Optional: ensure table has replica identity full for realtime (no-op if already set)
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;