import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/services/supabaseService';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Check if there's an error in the URL
        if (params.error) {
          console.error('Auth error:', params.error, params.error_description);
          setStatus('error');
          setErrorMessage(params.error_description as string || 'Authentication failed');
          return;
        }

        // Get the current session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error.message);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data?.session) {
          // Session exists, but we want users to explicitly sign in after verification
          setStatus('success');
          setTimeout(() => {
            // Redirect to auth screen instead of home
            router.replace('/auth');
          }, 2000);
        } else {
          // No session, redirect to auth
          setStatus('error');
          setErrorMessage('No session found. Please try signing in again.');
          setTimeout(() => {
            router.replace('/auth');
          }, 2000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [params, router]);

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {status === 'loading' && (
          <View style={styles.contentContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.text}>Verifying your account...</ThemedText>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.contentContainer}>
            <ThemedText style={styles.title}>Success!</ThemedText>
            <ThemedText style={styles.text}>Your account has been verified.</ThemedText>
            <ThemedText style={styles.text}>Redirecting to sign in...</ThemedText>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.contentContainer}>
            <ThemedText style={styles.title}>Error</ThemedText>
            <ThemedText style={styles.text}>{errorMessage}</ThemedText>
            <ThemedText style={styles.text}>Redirecting...</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 30,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400, // Ensure there's enough height for the content
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
});
