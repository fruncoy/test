/*
  # Radio 47 Database Schema

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `chat_messages` - Store chat messages with threading support
    - `liked_shows` - Track user's favorite shows with notification preferences
    - `notification_settings` - User notification preferences
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Ensure users can only access their own data for liked shows and settings
*/

-- Create update_modified_column function if not exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create handle_new_user function if not exists
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_timestamp'
  ) THEN
    CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Create auth user trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Auth schema might not be visible, skip if that's the case
END $$;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view any profile" ON profiles;
DROP POLICY IF EXISTS "Public users can view any profile" ON profiles;

-- Create profile policies
CREATE POLICY "Users can read their own profile" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view profiles" 
  ON profiles FOR SELECT 
  TO anon 
  USING (true);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================

-- Create chat_messages table if not exists
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  reply_to_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_system boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false
);

-- Create chat_messages trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_messages_timestamp'
  ) THEN
    CREATE TRIGGER update_chat_messages_timestamp
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can hard delete their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON chat_messages;

-- Create chat_messages policies
CREATE POLICY "Anyone can read chat messages" 
  ON chat_messages FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their chat messages" 
  ON chat_messages FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
  ON chat_messages FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
  ON chat_messages FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- LIKED SHOWS TABLE
-- ============================================

-- Create liked_shows table if not exists
CREATE TABLE IF NOT EXISTS liked_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  show_name text NOT NULL,
  show_host text,
  show_time text NOT NULL,
  show_days text,
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, show_name, show_time)
);

-- Enable RLS on liked_shows
ALTER TABLE liked_shows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can view their own liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can insert their liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can insert their own liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can delete their liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can delete their own liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can update their liked shows" ON liked_shows;
DROP POLICY IF EXISTS "Users can update their own liked shows" ON liked_shows;

-- Create liked_shows policies
CREATE POLICY "Users can read their liked shows" 
  ON liked_shows FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their liked shows" 
  ON liked_shows FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their liked shows" 
  ON liked_shows FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their liked shows" 
  ON liked_shows FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================

-- Create notification_settings table if not exists
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  upcoming_shows boolean DEFAULT true,
  new_content boolean DEFAULT true,
  special_events boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;

-- Create notification_settings policies
CREATE POLICY "Users can read their notification settings" 
  ON notification_settings FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their notification settings" 
  ON notification_settings FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification settings" 
  ON notification_settings FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);