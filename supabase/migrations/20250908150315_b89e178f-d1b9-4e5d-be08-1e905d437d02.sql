-- 1) Ensure profiles.user_id is unique (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2) Re-point FKs from auth.users to public.profiles(user_id)
-- conversation_participants.user_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversation_participants_user_id_fkey'
      AND confrelid = 'auth.users'::regclass
  ) THEN
    ALTER TABLE public.conversation_participants
      DROP CONSTRAINT conversation_participants_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.conversation_participants
  ADD CONSTRAINT conversation_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;

-- messages.sender_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_sender_id_fkey'
      AND confrelid = 'auth.users'::regclass
  ) THEN
    ALTER TABLE public.messages
      DROP CONSTRAINT messages_sender_id_fkey;
  END IF;
END $$;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;

-- 3) Update conversations SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  public.is_user_in_conversation(conversations.id, auth.uid()) OR (created_by = auth.uid())
);