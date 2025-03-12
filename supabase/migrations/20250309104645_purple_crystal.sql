/*
  # Fix Chat Policies
  
  This migration fixes duplicate policies by:
  1. First dropping any existing policies that might be causing conflicts
  2. Then recreating the policies with the correct settings
*/

-- First check if the policy exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can update their own chat messages'
  ) THEN
    DROP POLICY "Users can update their own chat messages" ON public.chat_messages;
  END IF;
END $$;

-- Create the policy if it doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can update their own chat messages'
  ) THEN
    CREATE POLICY "Users can update their own chat messages" 
    ON public.chat_messages
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Make sure all other required policies exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Anyone can read chat messages'
  ) THEN
    CREATE POLICY "Anyone can read chat messages" 
    ON public.chat_messages
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can insert their chat messages'
  ) THEN
    CREATE POLICY "Users can insert their chat messages" 
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can delete their own chat messages'
  ) THEN
    CREATE POLICY "Users can delete their own chat messages" 
    ON public.chat_messages
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create admin user if it doesn't exist
DO $$ 
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if admin@radio47.fm exists in auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@radio47.fm' LIMIT 1;

  -- If not found, log a message (can't create auth users in migrations)
  IF admin_uid IS NULL THEN
    RAISE NOTICE 'Admin user not found. Please create admin@radio47.fm user in Supabase Auth dashboard.';
  ELSE
    -- Check if profile exists for admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uid) THEN
      -- Create profile entry
      INSERT INTO public.profiles (id, email, first_name, last_name)
      VALUES (admin_uid, 'admin@radio47.fm', 'Admin', 'Radio47');
      
      RAISE NOTICE 'Admin profile created successfully!';
    ELSE
      RAISE NOTICE 'Admin profile already exists!';
    END IF;
  END IF;
END $$;