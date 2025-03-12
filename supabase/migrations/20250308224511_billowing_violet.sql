/*
  # Radio-47 App Database Schema

  1. New Tables
    - `profiles`: Stores user profile information
    - `liked_shows`: Tracks shows that users have liked
    - `notification_settings`: User preferences for notifications
    - `chat_messages`: Stores chat messages between users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public access where appropriate

  3. Triggers
    - Add trigger to create profile when a new user signs up
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Liked shows
CREATE TABLE IF NOT EXISTS liked_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  show_name TEXT NOT NULL,
  show_host TEXT,
  show_time TEXT,
  show_days TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Compound unique constraint to prevent duplicates
  UNIQUE (user_id, show_name, show_time)
);

-- Notification settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  upcoming_shows BOOLEAN DEFAULT true,
  new_content BOOLEAN DEFAULT true,
  special_events BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  message TEXT NOT NULL,
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to chat_messages if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_system') THEN
    ALTER TABLE chat_messages ADD COLUMN is_system BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_pinned') THEN
    ALTER TABLE chat_messages ADD COLUMN is_pinned BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'edited') THEN
    ALTER TABLE chat_messages ADD COLUMN edited BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_deleted') THEN
    ALTER TABLE chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view any profile') THEN
    CREATE POLICY "Users can view any profile" 
      ON profiles FOR SELECT 
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" 
      ON profiles FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END $$;

-- Liked shows policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_shows' AND policyname = 'Users can view their own liked shows') THEN
    CREATE POLICY "Users can view their own liked shows" 
      ON liked_shows FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_shows' AND policyname = 'Users can insert their own liked shows') THEN
    CREATE POLICY "Users can insert their own liked shows" 
      ON liked_shows FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_shows' AND policyname = 'Users can update their own liked shows') THEN
    CREATE POLICY "Users can update their own liked shows" 
      ON liked_shows FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liked_shows' AND policyname = 'Users can delete their own liked shows') THEN
    CREATE POLICY "Users can delete their own liked shows" 
      ON liked_shows FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Notification settings policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can view their own notification settings') THEN
    CREATE POLICY "Users can view their own notification settings" 
      ON notification_settings FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can insert their own notification settings') THEN
    CREATE POLICY "Users can insert their own notification settings" 
      ON notification_settings FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can update their own notification settings') THEN
    CREATE POLICY "Users can update their own notification settings" 
      ON notification_settings FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Chat messages policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Anyone can view chat messages') THEN
    CREATE POLICY "Anyone can view chat messages" 
      ON chat_messages FOR SELECT 
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Authenticated users can insert chat messages') THEN
    CREATE POLICY "Authenticated users can insert chat messages" 
      ON chat_messages FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can update their own chat messages') THEN
    CREATE POLICY "Users can update their own chat messages" 
      ON chat_messages FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can hard delete their own chat messages') THEN
    CREATE POLICY "Users can hard delete their own chat messages" 
      ON chat_messages FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Try to add the table to the realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Do nothing if there's an error (e.g., if the table is already in the publication)
END $$;

-- Create function to handle on_auth_user_created if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  
  INSERT INTO public.notification_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update modified column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_timestamp') THEN
    CREATE TRIGGER update_profiles_timestamp
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_messages_timestamp') THEN
    CREATE TRIGGER update_chat_messages_timestamp
      BEFORE UPDATE ON chat_messages
      FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;
END $$;