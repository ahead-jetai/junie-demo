import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getCurrentUser, signIn, signOut, signUp, resetPassword as requestPasswordReset, updatePassword as applyNewPassword, User, supabase } from '@/services/supabaseService';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => false,
  resetPassword: async () => false,
  updatePassword: async () => false,
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
    console.log('[AuthContext] Initial auth check starting');
    
    const checkUser = async () => {
      try {
        console.log('[AuthContext] Setting loading to true');
        setLoading(true);
        
        console.log('[AuthContext] Calling getCurrentUser...');
        const currentUser = await getCurrentUser();
        
        console.log('[AuthContext] getCurrentUser result:', {
          hasUser: Boolean(currentUser),
          userId: currentUser?.id || 'none',
          userEmail: currentUser?.email || 'none'
        });
        
        setUser(currentUser);
        console.log('[AuthContext] User state updated');
      } catch (error) {
        console.error('[AuthContext] Error checking authentication:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
      } finally {
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
      }
    };

    // Initial check
    checkUser();

    // Set up a listener for auth state changes
    console.log('[AuthContext] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', {
          event: event,
          hasSession: Boolean(session),
          hasUser: Boolean(session?.user),
          userId: session?.user?.id || 'none',
          userEmail: session?.user?.email || 'none',
          sessionId: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'none'
        });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // User signed in or token refreshed
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
            };
            console.log('[AuthContext] Setting user from auth state change:', {
              id: user.id,
              email: user.email,
              event: event
            });
            setUser(user);
          } else {
            console.log('[AuthContext] Auth event received but no user in session:', event);
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // User signed out or deleted
          console.log('[AuthContext] Clearing user from auth state change:', {
            event: event,
            previousUser: user ? `${user.id} (${user.email})` : 'none'
          });
          setUser(null);
        } else {
          console.log('[AuthContext] Unhandled auth state change:', event);
        }
      }
    );

    console.log('[AuthContext] Auth state listener setup complete');

    // Clean up the subscription when the component unmounts
    return () => {
      console.log('[AuthContext] Cleaning up auth state subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    console.log('[AuthContext] Routing effect triggered:', {
      loading: loading,
      hasUser: Boolean(user),
      userId: user?.id || 'none',
      segments: segments,
      currentPath: segments.join('/')
    });

    if (loading) {
      console.log('[AuthContext] Still loading, skipping routing logic');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthScreen = segments[0] === 'auth';

    console.log('[AuthContext] Routing analysis:', {
      inAuthGroup: inAuthGroup,
      isAuthScreen: isAuthScreen,
      hasUser: Boolean(user),
      shouldRedirectToAuth: !user && !isAuthScreen,
      shouldRedirectToHome: user && (inAuthGroup || isAuthScreen)
    });

    if (!user && !isAuthScreen) {
      // If user is not authenticated and not on auth screen, redirect to auth
      console.log('[AuthContext] Redirecting to auth - user not authenticated');
      router.replace('/auth');
    } else if (user && (inAuthGroup || isAuthScreen)) {
      // If user is authenticated and on auth screen, redirect to home
      console.log('[AuthContext] Redirecting to home - user authenticated on auth screen');
      router.replace('/');
    } else {
      console.log('[AuthContext] No routing action needed');
    }
  }, [user, loading, segments, router]);

  // Sign in function
  const handleSignIn = async (email: string, password: string) => {
    console.log('[AuthContext] handleSignIn called:', {
      email: email,
      passwordLength: password?.length || 0,
      currentUser: user ? `${user.id} (${user.email})` : 'none'
    });

    try {
      const signInUser = await signIn(email, password);
      
      console.log('[AuthContext] signIn result:', {
        success: Boolean(signInUser),
        userId: signInUser?.id || 'none',
        userEmail: signInUser?.email || 'none'
      });
      
      setUser(signInUser);
      console.log('[AuthContext] User state updated after signIn');
      return signInUser;
    } catch (error) {
      console.error('[AuthContext] Exception in handleSignIn:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return null;
    }
  };

  // Sign up function
  const handleSignUp = async (email: string, password: string) => {
    console.log('[AuthContext] handleSignUp called:', {
      email: email,
      passwordLength: password?.length || 0,
      currentUser: user ? `${user.id} (${user.email})` : 'none'
    });

    try {
      const signUpUser = await signUp(email, password);
      
      console.log('[AuthContext] signUp result:', {
        success: Boolean(signUpUser),
        userId: signUpUser?.id || 'none',
        userEmail: signUpUser?.email || 'none',
        note: 'User not set in state - email verification required'
      });
      
      // Don't set user state after sign-up to require email verification
      // User will need to verify email and then sign in
      return signUpUser;
    } catch (error) {
      console.error('[AuthContext] Exception in handleSignUp:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return null;
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    console.log('[AuthContext] handleSignOut called:', {
      currentUser: user ? `${user.id} (${user.email})` : 'none'
    });

    try {
      const success = await signOut();
      
      console.log('[AuthContext] signOut result:', {
        success: success
      });
      
      if (success) {
        setUser(null);
        console.log('[AuthContext] User state cleared after signOut');
      } else {
        console.log('[AuthContext] signOut failed, user state not changed');
      }
      return success;
    } catch (error) {
      console.error('[AuthContext] Exception in handleSignOut:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return false;
    }
  };

  // Password reset function
  const handleResetPassword = async (email: string) => {
    console.log('[AuthContext] handleResetPassword called:', {
      email: email,
      currentUser: user ? `${user.id} (${user.email})` : 'none'
    });

    try {
      const success = await requestPasswordReset(email);
      
      console.log('[AuthContext] resetPassword result:', {
        success: success,
        email: email
      });
      
      return success;
    } catch (error) {
      console.error('[AuthContext] Exception in handleResetPassword:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return false;
    }
  };

  // Update password function
  const handleUpdatePassword = async (newPassword: string) => {
    console.log('[AuthContext] handleUpdatePassword called:', {
      newPasswordLength: newPassword?.length || 0,
      currentUser: user ? `${user.id} (${user.email})` : 'none'
    });

    try {
      const success = await applyNewPassword(newPassword);
      
      console.log('[AuthContext] updatePassword result:', {
        success: success,
        userId: user?.id || 'none'
      });
      
      return success;
    } catch (error) {
      console.error('[AuthContext] Exception in handleUpdatePassword:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
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
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
