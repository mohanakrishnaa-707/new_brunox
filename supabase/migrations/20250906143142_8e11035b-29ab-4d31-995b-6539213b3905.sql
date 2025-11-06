-- Ensure conversations can be created even if client omits created_by
-- 1) Create trigger to set created_by to auth.uid() when NULL
CREATE OR REPLACE FUNCTION public.set_conversation_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_conversation_created_by_before_insert ON public.conversations;
CREATE TRIGGER set_conversation_created_by_before_insert
BEFORE INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_conversation_created_by();

-- 2) Relax INSERT policy to accept NULL (filled by trigger) or matching user
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (COALESCE(created_by, auth.uid()) = auth.uid());