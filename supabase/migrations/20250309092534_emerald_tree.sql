/*
  # Radio 47 Database Schema

  1. New Tables
    - `profiles` - User profiles with basic information
    - `liked_shows` - Shows that users have liked
    - `notification_settings` - User notification preferences
    - `chat_messages` - Messages for live chat feature
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
    - Set up triggers for automatic updates
*/

-- Check if tables exist before creating them
DO $$ 
BEGIN
  -- Profiles table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view any profile" 
      ON profiles FOR SELECT 
      TO authenticated, anon
      USING (true);
    
    CREATE POLICY "Users can update own profile" 
      ON profiles FOR UPDATE 
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Liked shows table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'liked_shows') THEN
    CREATE TABLE liked_shows (
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
    
    -- Enable RLS
    ALTER TABLE liked_shows ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own liked shows" 
      ON liked_shows FOR SELECT 
      TO authenticated, anon
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own liked shows" 
      ON liked_shows FOR INSERT 
      TO authenticated, anon
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own liked shows" 
      ON liked_shows FOR UPDATE 
      TO authenticated, anon
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own liked shows" 
      ON liked_shows FOR DELETE 
      TO authenticated, anon
      USING (auth.uid() = user_id);
  END IF;

  -- Notification settings table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_settings') THEN
    CREATE TABLE notification_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
      upcoming_shows BOOLEAN DEFAULT true,
      new_content BOOLEAN DEFAULT true,
      special_events BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own notification settings" 
      ON notification_settings FOR SELECT 
      TO authenticated, anon
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own notification settings" 
      ON notification_settings FOR INSERT 
      TO authenticated, anon
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own notification settings" 
      ON notification_settings FOR UPDATE 
      TO authenticated, anon
      USING (auth.uid() = user_id);
  END IF;

  -- Chat messages table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    CREATE TABLE chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users ON DELETE SET NULL,
      message TEXT NOT NULL,
      reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
      is_system BOOLEAN DEFAULT false,
      is_pinned BOOLEAN DEFAULT false,
      edited BOOLEAN DEFAULT false,
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Anyone can view chat messages" 
      ON chat_messages FOR SELECT 
      TO authenticated, anon
      USING (true);
    
    CREATE POLICY "Authenticated users can insert chat messages" 
      ON chat_messages FOR INSERT 
      TO authenticated, anon
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own chat messages" 
      ON chat_messages FOR UPDATE 
      TO authenticated, anon
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can hard delete their own chat messages" 
      ON chat_messages FOR DELETE 
      TO authenticated, anon
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add the chat_messages table to the existing publication for realtime functionality
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') 
  AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages')
  AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Publication doesn't exist or table already in publication
    NULL;
END $$;

-- Create or replace functions and triggers
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'first_name', ''), coalesce(new.raw_user_meta_data->>'last_name', ''));
  
  INSERT INTO public.notification_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update modified column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add update timestamp triggers if they don't exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
    AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_timestamp') 
  THEN
    CREATE TRIGGER update_profiles_timestamp
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages')
    AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_messages_timestamp') 
  THEN
    CREATE TRIGGER update_chat_messages_timestamp
      BEFORE UPDATE ON chat_messages
      FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;
END $$;