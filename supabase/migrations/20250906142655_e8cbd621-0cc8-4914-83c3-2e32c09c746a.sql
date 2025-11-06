-- Drop existing policy and create updated one for conversation participants
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

-- Create a comprehensive policy for inserting conversation participants
CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to add themselves to any conversation
  auth.uid() = user_id
  OR
  -- Allow conversation creators to add others
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
  )
);