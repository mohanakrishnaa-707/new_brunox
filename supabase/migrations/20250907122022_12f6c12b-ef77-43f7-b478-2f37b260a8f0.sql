-- Ensure trigger exists to set created_by on conversations
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_conversations_created_by'
  ) THEN
    DROP TRIGGER set_conversations_created_by ON public.conversations;
  END IF;
END $$;

CREATE TRIGGER set_conversations_created_by
BEFORE INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_conversation_created_by();
