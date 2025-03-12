import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import 'cross-fetch/polyfill';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qnxuucemiyvrnljbspjy.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFueHV1Y2VtaXl2cm5samJzcGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NzMwOTcsImV4cCI6MjA1NzA0OTA5N30.OM_luzJuv_sj7bMe23GrJ-3oZQxi34n5ISRiKm3FmOc';

// Custom storage implementation for different platforms
const storageAdapter = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
};

// Initialize Supabase client with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'radio47',
    },
  },
  // Add extra logging for development
  debug: true,
});

// Function to check if we can connect to Supabase
export const checkSupabaseConnection = async () => {
  try {
    console.log('Checking Supabase connection...');
    // Simple query to check if we can connect
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!', data);
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Function to diagnose user creation issues
export const diagnoseUserCreation = async (email: string) => {
  try {
    console.log('Diagnosing user creation for:', email);
    
    // Check if user already exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (getUserError) {
      console.log('Error checking if user exists:', getUserError);
      // Not an admin or another issue
      return {
        success: false,
        message: 'Cannot check if user exists. You may not have admin privileges.',
        error: getUserError
      };
    }
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return {
        success: false,
        message: 'User with this email already exists.',
        user: existingUser
      };
    }
    
    // Try to create a profile entry to check database permissions
    const testUser = {
      id: '00000000-0000-0000-0000-000000000000', // Dummy ID
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    };
    
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert([testUser])
      .select();
      
    if (insertError) {
      console.log('Error inserting test profile:', insertError);
      return {
        success: false,
        message: 'Database error: ' + insertError.message,
        error: insertError
      };
    }
    
    // Clean up test entry
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUser.id);
      
    return {
      success: true,
      message: 'Database appears to be working correctly. Try creating the user again.'
    };
  } catch (error) {
    console.error('Error diagnosing user creation:', error);
    return {
      success: false,
      message: 'Unexpected error during diagnosis',
      error
    };
  }
};

// Export default client
export default supabase;