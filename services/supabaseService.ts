import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Recipe } from './llmService';

// Resolve Supabase URL and publishable key from multiple sources to be robust across environments
const extra = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifestExtra || {};

console.log('[Supabase] Configuration resolution started');
console.log('[Supabase] Available extra config:', {
  hasExtra: Boolean(extra),
  extraKeys: extra ? Object.keys(extra) : [],
  supabaseUrl: extra?.supabaseUrl ? 'SET' : 'NOT_SET',
  supabaseAnonKey: extra?.supabaseAnonKey ? 'SET' : 'NOT_SET'
});

const supabaseUrl =
  extra?.supabaseUrl ||
  process.env?.EXPO_PUBLIC_SUPABASE_URL ||
  process.env?.SUPABASE_URL ||
  '';

console.log('[Supabase] URL resolution:', {
  fromExtra: extra?.supabaseUrl ? 'FOUND' : 'NOT_FOUND',
  fromExpoPublic: process.env?.EXPO_PUBLIC_SUPABASE_URL ? 'FOUND' : 'NOT_FOUND',
  fromEnv: process.env?.SUPABASE_URL ? 'FOUND' : 'NOT_FOUND',
  finalUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'EMPTY'
});

const supabasePublishableKey =
  // Prefer new publishable key naming
  extra?.supabaseAnonKey ||
  process.env?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env?.SUPABASE_API_PUBLISHABLE_KEY ||
  // Backward compatibility fallbacks
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env?.SUPABASE_PUBLIC_KEY ||
  '';

console.log('[Supabase] Publishable key resolution:', {
  fromExtraAnonKey: extra?.supabaseAnonKey ? 'FOUND' : 'NOT_FOUND',
  fromExpoPublicPublishable: process.env?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'FOUND' : 'NOT_FOUND',
  fromApiPublishable: process.env?.SUPABASE_API_PUBLISHABLE_KEY ? 'FOUND' : 'NOT_FOUND',
  fromExpoPublicAnon: process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'FOUND' : 'NOT_FOUND',
  fromPublicKey: process.env?.SUPABASE_PUBLIC_KEY ? 'FOUND' : 'NOT_FOUND',
  finalKey: supabasePublishableKey ? `${supabasePublishableKey.substring(0, 20)}...` : 'EMPTY'
});

// Warn early if config is missing to avoid confusing network errors
if (!supabaseUrl || !supabasePublishableKey) {
  // Do not throw to avoid crashing the app; log a helpful error instead
  console.error('[Supabase] Missing configuration:', {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabasePublishableKey),
    urlValue: supabaseUrl || 'MISSING',
    keyValue: supabasePublishableKey ? `${supabasePublishableKey.substring(0, 20)}...` : 'MISSING',
    hint:
      'Ensure SUPABASE_URL and SUPABASE_API_PUBLISHABLE_KEY (or legacy SUPABASE_PUBLIC_KEY) are provided via app.config.js extra or EXPO_PUBLIC_ env vars.'
  });
} else {
  console.log('[Supabase] Configuration validation passed:', {
    url: `${supabaseUrl.substring(0, 30)}...`,
    keyLength: supabasePublishableKey.length,
    keyPrefix: supabasePublishableKey.substring(0, 10)
  });
}

// Initialize the Supabase client
console.log('[Supabase] Initializing client with config:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  keyLength: supabasePublishableKey?.length || 0,
  authConfig: {
    storage: 'AsyncStorage',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[Supabase] Client initialized successfully');

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
  console.log('[Supabase Auth] getCurrentUser called');
  
  if (currentUser) {
    console.log('[Supabase Auth] Returning cached user:', {
      id: currentUser.id,
      email: currentUser.email,
      source: 'cache'
    });
    return currentUser;
  }

  console.log('[Supabase Auth] Fetching user from Supabase...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('[Supabase Auth] getUser response:', {
      hasUser: Boolean(user),
      userId: user?.id || 'none',
      userEmail: user?.email || 'none',
      hasError: Boolean(error),
      errorMessage: error?.message || 'none'
    });

    if (error) {
      console.error('[Supabase Auth] Error getting user:', {
        message: error.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        details: error
      });
      return null;
    }

    if (user) {
      currentUser = {
        id: user.id,
        email: user.email || '',
      };
      console.log('[Supabase Auth] User retrieved and cached:', {
        id: currentUser.id,
        email: currentUser.email,
        source: 'supabase'
      });
      return currentUser;
    }

    console.log('[Supabase Auth] No user found in session');
    return null;
  } catch (error) {
    console.error('[Supabase Auth] Exception in getCurrentUser:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return null;
  }
}

/**
 * Sign up a new user
 * @param email - User's email
 * @param password - User's password
 * @returns The new user or null if sign up failed
 */
export async function signUp(email: string, password: string): Promise<User | null> {
  console.log('[Supabase Auth] signUp called:', {
    email: email,
    passwordLength: password?.length || 0,
    redirectTo: 'chefai://auth/callback'
  });

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'chefai://auth/callback',
      },
    });

    console.log('[Supabase Auth] signUp response:', {
      hasUser: Boolean(data?.user),
      userId: data?.user?.id || 'none',
      userEmail: data?.user?.email || 'none',
      hasSession: Boolean(data?.session),
      sessionId: data?.session?.access_token ? `${data.session.access_token.substring(0, 20)}...` : 'none',
      hasError: Boolean(error),
      errorMessage: error?.message || 'none'
    });

    if (error) {
      console.error('[Supabase Auth] Error signing up:', {
        message: error.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        code: (error as any)?.code,
        details: error
      });
      return null;
    }

    if (data.user) {
      const newUser = {
        id: data.user.id,
        email: data.user.email || '',
      };
      
      console.log('[Supabase Auth] User signed up successfully:', {
        id: newUser.id,
        email: newUser.email,
        emailConfirmed: data.user.email_confirmed_at ? 'YES' : 'NO',
        note: 'User not cached - email verification required'
      });
      
      // Don't set currentUser after sign-up to require email verification
      // Return user data for UI feedback, but don't store it in currentUser
      return newUser;
    }

    console.log('[Supabase Auth] signUp completed but no user data returned');
    return null;
  } catch (error) {
    console.error('[Supabase Auth] Exception in signUp:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return null;
  }
}

/**
 * Sign in an existing user
 * @param email - User's email
 * @param password - User's password
 * @returns The user or null if sign in failed
 */
export async function signIn(email: string, password: string): Promise<User | null> {
  console.log('[Supabase Auth] signIn called:', {
    email: email,
    passwordLength: password?.length || 0
  });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[Supabase Auth] signIn response:', {
      hasUser: Boolean(data?.user),
      userId: data?.user?.id || 'none',
      userEmail: data?.user?.email || 'none',
      hasSession: Boolean(data?.session),
      sessionId: data?.session?.access_token ? `${data.session.access_token.substring(0, 20)}...` : 'none',
      expiresAt: data?.session?.expires_at || 'none',
      hasError: Boolean(error),
      errorMessage: error?.message || 'none'
    });

    if (error) {
      console.error('[Supabase Auth] Error signing in:', {
        message: error.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        code: (error as any)?.code,
        details: error
      });
      return null;
    }

    if (data.user) {
      currentUser = {
        id: data.user.id,
        email: data.user.email || '',
      };
      
      console.log('[Supabase Auth] User signed in successfully:', {
        id: currentUser.id,
        email: currentUser.email,
        emailConfirmed: data.user.email_confirmed_at ? 'YES' : 'NO',
        lastSignIn: data.user.last_sign_in_at || 'none',
        note: 'User cached in currentUser'
      });
      
      return currentUser;
    }

    console.log('[Supabase Auth] signIn completed but no user data returned');
    return null;
  } catch (error) {
    console.error('[Supabase Auth] Exception in signIn:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return null;
  }
}

/**
 * Sign out the current user
 * @returns True if sign out was successful, false otherwise
 */
export async function signOut(): Promise<boolean> {
  console.log('[Supabase Auth] signOut called:', {
    hasCurrentUser: Boolean(currentUser),
    currentUserId: currentUser?.id || 'none',
    currentUserEmail: currentUser?.email || 'none'
  });

  try {
    const { error } = await supabase.auth.signOut();

    console.log('[Supabase Auth] signOut response:', {
      hasError: Boolean(error),
      errorMessage: error?.message || 'none'
    });

    if (error) {
      console.error('[Supabase Auth] Error signing out:', {
        message: error.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        code: (error as any)?.code,
        details: error
      });
      return false;
    }

    const previousUser = currentUser;
    currentUser = null;
    
    console.log('[Supabase Auth] User signed out successfully:', {
      previousUserId: previousUser?.id || 'none',
      previousUserEmail: previousUser?.email || 'none',
      currentUserCleared: currentUser === null
    });
    
    return true;
  } catch (error) {
    console.error('[Supabase Auth] Exception in signOut:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
}

/**
 * Check if a user is authenticated
 * @returns True if a user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Send a password reset email
 * @param email - The user's email address
 * @returns True if the request was sent successfully
 */
export async function resetPassword(email: string): Promise<boolean> {
  console.log('[Supabase Auth] resetPassword called:', {
    email: email,
    redirectTo: 'chefai://auth/callback'
  });

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'chefai://auth/callback',
    });

    console.log('[Supabase Auth] resetPassword response:', {
      hasError: Boolean(error),
      errorMessage: error?.message || 'none'
    });

    if (error) {
      console.error('[Supabase Auth] Error requesting password reset:', {
        message: error.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        code: (error as any)?.code,
        details: error
      });
      return false;
    }
    
    console.log('[Supabase Auth] Password reset email sent successfully:', {
      email: email,
      note: 'User should check email for reset link'
    });
    
    return true;
  } catch (error) {
    console.error('[Supabase Auth] Exception in resetPassword:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
}

/**
 * Update the current user's password (after receiving reset link or while authenticated)
 * @param newPassword - The new password to set
 * @returns True if the password was updated successfully
 */
export async function updatePassword(newPassword: string): Promise<boolean> {
  console.log('[Supabase Auth] updatePassword called:', {
    newPasswordLength: newPassword?.length || 0,
    hasCurrentUser: Boolean(currentUser),
    currentUserId: currentUser?.id || 'none'
  });

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    console.log('[Supabase Auth] updatePassword response:', {
      hasError: Boolean(error),
      errorMessage: error?.message || 'none'
    });

    if (error) {
      console.error('[Supabase Auth] Error updating password:', {
        message: error.message,
        name: (error as any)?.name,
        status: (error as any)?.status,
        code: (error as any)?.code,
        details: error
      });
      return false;
    }
    
    console.log('[Supabase Auth] Password updated successfully:', {
      userId: currentUser?.id || 'none',
      note: 'Password change completed'
    });
    
    return true;
  } catch (error) {
    console.error('[Supabase Auth] Exception in updatePassword:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
}

// ============================================================================
// DATABASE QUERIES FOR USER RECIPES AND METRICS
// ============================================================================

/**
 * Get all recipes for the current user
 * @returns Array of recipes or empty array if none found
 */
export async function getUserRecipes(): Promise<Recipe[]> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('[Supabase DB] No authenticated user for getUserRecipes');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase DB] Error fetching user recipes:', error);
      return [];
    }

    // Transform database format to Recipe interface
    const recipes: Recipe[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      image: row.image || '',
      prepTime: row.prep_time || '',
      cookTime: row.cook_time || '',
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      isDallEImage: row.is_dalle_image || false
    }));

    console.log(`[Supabase DB] Fetched ${recipes.length} recipes for user ${user.id}`);
    return recipes;
  } catch (error) {
    console.error('[Supabase DB] Exception in getUserRecipes:', error);
    return [];
  }
}

/**
 * Get all favorite recipes for the current user
 * @returns Array of favorite recipes or empty array if none found
 */
export async function getUserFavoriteRecipes(): Promise<Recipe[]> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('[Supabase DB] No authenticated user for getUserFavoriteRecipes');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        recipe_id,
        recipes (
          id,
          title,
          description,
          image,
          prep_time,
          cook_time,
          ingredients,
          instructions,
          is_dalle_image
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase DB] Error fetching user favorite recipes:', error);
      return [];
    }

    // Transform database format to Recipe interface
    const recipes: Recipe[] = (data || [])
      .filter(row => row.recipes) // Ensure recipe data exists
      .map(row => {
        const recipe = row.recipes as any;
        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description || '',
          image: recipe.image || '',
          prepTime: recipe.prep_time || '',
          cookTime: recipe.cook_time || '',
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
          isDallEImage: recipe.is_dalle_image || false
        };
      });

    console.log(`[Supabase DB] Fetched ${recipes.length} favorite recipes for user ${user.id}`);
    return recipes;
  } catch (error) {
    console.error('[Supabase DB] Exception in getUserFavoriteRecipes:', error);
    return [];
  }
}

/**
 * Get recent recipes for the current user
 * @returns Array of recent recipes or empty array if none found
 */
export async function getUserRecentRecipes(): Promise<Recipe[]> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('[Supabase DB] No authenticated user for getUserRecentRecipes');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('recent_recipes')
      .select(`
        recipe_id,
        recipes (
          id,
          title,
          description,
          image,
          prep_time,
          cook_time,
          ingredients,
          instructions,
          is_dalle_image
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10); // Limit to last 10 recent recipes

    if (error) {
      console.error('[Supabase DB] Error fetching user recent recipes:', error);
      return [];
    }

    // Transform database format to Recipe interface
    const recipes: Recipe[] = (data || [])
      .filter(row => row.recipes) // Ensure recipe data exists
      .map(row => {
        const recipe = row.recipes as any;
        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description || '',
          image: recipe.image || '',
          prepTime: recipe.prep_time || '',
          cookTime: recipe.cook_time || '',
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
          isDallEImage: recipe.is_dalle_image || false
        };
      });

    console.log(`[Supabase DB] Fetched ${recipes.length} recent recipes for user ${user.id}`);
    return recipes;
  } catch (error) {
    console.error('[Supabase DB] Exception in getUserRecentRecipes:', error);
    return [];
  }
}

/**
 * Get count of user's favorite recipes
 * @returns Number of favorite recipes
 */
export async function getUserFavoritesCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase DB] Error fetching favorites count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[Supabase DB] Exception in getUserFavoritesCount:', error);
    return 0;
  }
}

/**
 * Get count of user's generated recipes
 * @returns Number of generated recipes
 */
export async function getUserGeneratedRecipesCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase DB] Error fetching recipes count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[Supabase DB] Exception in getUserGeneratedRecipesCount:', error);
    return 0;
  }
}
