import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Configure redirect URL for auth callbacks
    // This should match the URL pattern in app.config.js
    url: 'chefai://auth/callback',
    // For development, also handle localhost URLs
    // This is what Supabase uses by default
    redirectTo: 'chefai://auth/callback',
  },
});

// Recipe type from llmService
import { Recipe } from './llmService';

// User type for authentication
export interface User {
  id: string;
  email: string;
}

// Current user session
let currentUser: User | null = null;

/**
 * Get the current user
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  if (currentUser) {
    return currentUser;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    currentUser = {
      id: user.id,
      email: user.email || '',
    };
    return currentUser;
  }

  return null;
}

/**
 * Sign up a new user
 * @param email - User's email
 * @param password - User's password
 * @returns The new user or null if sign up failed
 */
export async function signUp(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error signing up:', error.message);
    return null;
  }

  if (data.user) {
    // Don't set currentUser after sign-up to require email verification
    // Return user data for UI feedback, but don't store it in currentUser
    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  }

  return null;
}

/**
 * Sign in an existing user
 * @param email - User's email
 * @param password - User's password
 * @returns The user or null if sign in failed
 */
export async function signIn(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error.message);
    return null;
  }

  if (data.user) {
    currentUser = {
      id: data.user.id,
      email: data.user.email || '',
    };
    return currentUser;
  }

  return null;
}

/**
 * Sign out the current user
 * @returns True if sign out was successful, false otherwise
 */
export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error.message);
    return false;
  }

  currentUser = null;
  return true;
}

/**
 * Check if a user is authenticated
 * @returns True if a user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
