/*
  # Fix Policies and Setup Admin User
  
  This migration fixes the duplicate policy error and attempts to create the admin user if it doesn't exist.
  
  1. Safely drops existing policy if it exists
  2. Recreates the policy with proper checks
  3. Sets up admin user profile if the admin user exists in auth but not in profiles
*/

-- First check if policies exist and drop them if they do
DO $$ 
BEGIN
  -- Drop update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can update their own chat messages'
  ) THEN
    DROP POLICY "Users can update their own chat messages" ON public.chat_messages;
  END IF;
  
  -- Drop select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Anyone can read chat messages'
  ) THEN
    DROP POLICY "Anyone can read chat messages" ON public.chat_messages;
  END IF;
  
  -- Drop insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can insert their chat messages'
  ) THEN
    DROP POLICY "Users can insert their chat messages" ON public.chat_messages;
  END IF;
  
  -- Drop delete policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages'
    AND policyname = 'Users can delete their own chat messages'
  ) THEN
    DROP POLICY "Users can delete their own chat messages" ON public.chat_messages;
  END IF;
END $$;

-- Create policies with proper safety checks
CREATE POLICY "Anyone can read chat messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Look for admin user in auth.users and create profile if needed
DO $$ 
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if admin@radio47.fm exists in auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@radio47.fm' LIMIT 1;
  
  -- If admin user exists in auth but not in profiles, create the profile
  IF admin_uid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uid) THEN
      INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
      VALUES (admin_uid, 'admin@radio47.fm', 'Admin', 'Radio47', now(), now());
    END IF;
  END IF;
END $$;