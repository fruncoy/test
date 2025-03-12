/*
  # Chat Messages Table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `message` (text)
      - `reply_to_id` (uuid, self-reference)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_system` (boolean)
      - `is_pinned` (boolean)
      - `edited` (boolean)
      - `is_deleted` (boolean)
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for public access to read messages
    - Add policies for authenticated users to manage their own messages
*/

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  message text NOT NULL,
  reply_to_id uuid REFERENCES chat_messages(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_system boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create trigger for updating the updated_at timestamp only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chat_messages_timestamp'
  ) THEN
    CREATE TRIGGER update_chat_messages_timestamp
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$;

-- Create policies for chat_messages (using IF NOT EXISTS for each policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Anyone can read chat messages' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Anyone can read chat messages"
      ON chat_messages
      FOR SELECT
      TO public
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Chat messages are viewable by everyone' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Chat messages are viewable by everyone"
      ON chat_messages
      FOR SELECT
      TO public
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert chat messages' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Users can insert chat messages"
      ON chat_messages
      FOR INSERT
      TO public
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can insert their chat messages' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Users can insert their chat messages"
      ON chat_messages
      FOR INSERT
      TO public
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update their own chat messages' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Users can update their own chat messages"
      ON chat_messages
      FOR UPDATE
      TO public
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update their own messages' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Users can update their own messages"
      ON chat_messages
      FOR UPDATE
      TO public
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can delete their own chat messages' 
    AND polrelid = 'chat_messages'::regclass
  ) THEN
    CREATE POLICY "Users can delete their own chat messages"
      ON chat_messages
      FOR DELETE
      TO public
      USING (auth.uid() = user_id);
  END IF;
END
$$;