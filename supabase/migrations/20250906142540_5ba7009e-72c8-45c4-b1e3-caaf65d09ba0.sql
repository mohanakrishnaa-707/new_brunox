-- Policy to allow conversation creators to add other participants
-- This fixes RLS error when inserting the friend into conversation_participants

-- Create an additional INSERT policy (OR-combined with existing one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'conversation_participants' 
      AND policyname = 'Conversation creators can add participants'
  ) THEN
    CREATE POLICY "Conversation creators can add participants"
    ON public.conversation_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND c.created_by = auth.uid()
      )
      OR auth.uid() = user_id
    );
  END IF;
END $$;

-- Optional: ensure the messages table is in realtime publication (no-op if already)
-- Note: safe to re-add; duplicates are ignored
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.conversation_participants;

-- Ensure REPLICA IDENTITY FULL for realtime completeness
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;