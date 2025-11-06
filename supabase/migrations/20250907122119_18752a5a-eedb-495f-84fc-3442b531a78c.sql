-- Fix SELECT policy to allow creators to view newly created conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = public.conversations.id
      AND cp.user_id = auth.uid()
  )
  OR public.conversations.created_by = auth.uid()
);
