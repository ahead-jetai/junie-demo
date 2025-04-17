import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getCurrentUser, signIn, signOut, signUp, User, supabase } from '@/services/supabaseService';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Check if the user is authenticated on initial load and when auth state changes
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkUser();

    // Set up a listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // User signed in or token refreshed
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
            };
            setUser(user);
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // User signed out or deleted
          setUser(null);
        }
      }
    );

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthScreen = segments[0] === 'auth';

    if (!user && !isAuthScreen) {
      // If user is not authenticated and not on auth screen, redirect to auth
      router.replace('/auth');
    } else if (user && (inAuthGroup || isAuthScreen)) {
      // If user is authenticated and on auth screen, redirect to home
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  // Sign in function
  const handleSignIn = async (email: string, password: string) => {
    try {
      const user = await signIn(email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    }
  };

  // Sign up function
  const handleSignUp = async (email: string, password: string) => {
    try {
      const user = await signUp(email, password);
      // Don't set user state after sign-up to require email verification
      // User will need to verify email and then sign in
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      return null;
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success) {
        setUser(null);
      }
      return success;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  };

  // Create the auth value object
  const authValue: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
