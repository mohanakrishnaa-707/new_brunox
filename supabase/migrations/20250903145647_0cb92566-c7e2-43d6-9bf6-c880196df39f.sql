-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles USING btree (username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles USING btree (display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles USING btree (status);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends USING btree (friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends USING btree (status);

-- Add wallet_address column to profiles for blockchain integration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for wallet address searches
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles USING btree (wallet_address);

-- Create function for fuzzy search of users
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT, current_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT,
  wallet_address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update profiles table to include blockchain-related fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_blockchain_sync TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;

-- Add blockchain fields to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS gas_used BIGINT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS transaction_fee NUMERIC(20,8);