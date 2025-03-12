import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

// Sign up with Supabase
export const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<User | null> => {
  try {
    console.log('Signing up user:', email);
    
    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      throw new Error('All fields are required');
    }

    if (!email.includes('@') || !email.includes('.')) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Sign up with Supabase with better error handling
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      throw error;
    }

    console.log('Signup response:', data);

    // User is signed up, insert into profiles table
    if (data.user) {
      console.log('Creating profile for user:', data.user.id);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
          }
        ]);
        
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        firstName: firstName,
        lastName: lastName,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with Supabase
export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('Signing in user:', email);
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signin error:', error);
      throw error;
    }

    console.log('Signin successful:', data.user?.id);

    // User is signed in
    if (data.user) {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        firstName: profile?.first_name || data.user.user_metadata?.first_name || '',
        lastName: profile?.last_name || data.user.user_metadata?.last_name || '',
        avatarUrl: profile?.avatar_url,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('Sign out successful');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('Getting current user...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    if (!user) {
      console.log('No user found');
      return null;
    }
    
    console.log('Current user:', user.id);
    
    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    
    return {
      id: user.id,
      email: user.email || '',
      firstName: profile?.first_name || user.user_metadata?.first_name || '',
      lastName: profile?.last_name || user.user_metadata?.last_name || '',
      avatarUrl: profile?.avatar_url,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get user initials for UI display
export const getUserInitials = (user: User | null): string => {
  if (!user) return '';
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
};