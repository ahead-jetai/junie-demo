import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileMetrics, ProfileMetrics } from '@/services/profileMetricsService';
import CircularProgress from '@/components/CircularProgress';

// Function to get appropriate emoji for ingredient
const getIngredientEmoji = (ingredient: string): string => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Vegetables
  if (lowerIngredient.includes('carrot')) return '🥕';
  if (lowerIngredient.includes('tomato')) return '🍅';
  if (lowerIngredient.includes('onion')) return '🧅';
  if (lowerIngredient.includes('pepper') || lowerIngredient.includes('bell pepper')) return '🫑';
  if (lowerIngredient.includes('broccoli')) return '🥦';
  if (lowerIngredient.includes('corn')) return '🌽';
  if (lowerIngredient.includes('potato')) return '🥔';
  if (lowerIngredient.includes('mushroom')) return '🍄';
  if (lowerIngredient.includes('avocado')) return '🥑';
  if (lowerIngredient.includes('cucumber')) return '🥒';
  if (lowerIngredient.includes('eggplant')) return '🍆';
  if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('spinach') || lowerIngredient.includes('kale')) return '🥬';
  
  // Fruits
  if (lowerIngredient.includes('apple')) return '🍎';
  if (lowerIngredient.includes('banana')) return '🍌';
  if (lowerIngredient.includes('orange')) return '🍊';
  if (lowerIngredient.includes('lemon')) return '🍋';
  if (lowerIngredient.includes('lime')) return '🟢';
  if (lowerIngredient.includes('strawberry')) return '🍓';
  if (lowerIngredient.includes('grape')) return '🍇';
  if (lowerIngredient.includes('pineapple')) return '🍍';
  if (lowerIngredient.includes('peach')) return '🍑';
  if (lowerIngredient.includes('cherry')) return '🍒';
  
  // Proteins
  if (lowerIngredient.includes('chicken')) return '🐔';
  if (lowerIngredient.includes('beef') || lowerIngredient.includes('steak')) return '🥩';
  if (lowerIngredient.includes('pork') || lowerIngredient.includes('bacon') || lowerIngredient.includes('ham')) return '🥓';
  if (lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') || lowerIngredient.includes('tuna')) return '🐟';
  if (lowerIngredient.includes('shrimp') || lowerIngredient.includes('prawn')) return '🦐';
  if (lowerIngredient.includes('egg')) return '🥚';
  if (lowerIngredient.includes('tofu')) return '🧈';
  
  // Dairy
  if (lowerIngredient.includes('cheese')) return '🧀';
  if (lowerIngredient.includes('milk')) return '🥛';
  if (lowerIngredient.includes('butter')) return '🧈';
  if (lowerIngredient.includes('yogurt')) return '🥛';
  
  // Grains & Carbs
  if (lowerIngredient.includes('rice')) return '🍚';
  if (lowerIngredient.includes('pasta') || lowerIngredient.includes('noodle')) return '🍝';
  if (lowerIngredient.includes('bread')) return '🍞';
  if (lowerIngredient.includes('flour')) return '🌾';
  
  // Beans & Legumes
  if (lowerIngredient.includes('bean') || lowerIngredient.includes('lentil') || lowerIngredient.includes('chickpea')) return '🫘';
  
  // Herbs & Spices
  if (lowerIngredient.includes('garlic')) return '🧄';
  if (lowerIngredient.includes('ginger')) return '🫚';
  if (lowerIngredient.includes('chili') || lowerIngredient.includes('hot pepper')) return '🌶️';
  if (lowerIngredient.includes('herb') || lowerIngredient.includes('basil') || lowerIngredient.includes('parsley')) return '🌿';
  
  // Nuts & Seeds
  if (lowerIngredient.includes('nut') || lowerIngredient.includes('almond') || lowerIngredient.includes('walnut')) return '🥜';

  // Default fallback
  return '🥕';
};

export default function StatsScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useFocusEffect(
    React.useCallback(() => {
      loadMetrics();
    }, [])
  );

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      const profileMetrics = await getProfileMetrics();
      setMetrics(profileMetrics);
    } catch (error) {
      console.error('Error loading profile metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const success = await signOut();
      if (!success) {
        Alert.alert('Error', 'Failed to sign out');
      }
      // The AuthContext will handle navigation
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSigningOut(false);
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ color: colors.accent2 }}>My Recipe Data</ThemedText>
      </ThemedView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {metricsLoading ? (
          <ThemedView style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#FF8C00" />
            <ThemedText style={styles.loadingText}>Loading your cooking stats...</ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Main Stats Section */}
            <ThemedView style={styles.mainStatsSection}>
              <CircularProgress
                size={180}
                strokeWidth={8}
                progress={Math.min((metrics?.generatedRecipesCount || 0) / 100, 1)}
                color="#FF8C00"
                backgroundColor="#2A2A2A"
                value={metrics?.generatedRecipesCount || 0}
                label="RECIPES"
                textColor="#F1FAEE"
              />
            </ThemedView>

            {/* Secondary Stats */}
            <ThemedView style={styles.secondaryStatsSection}>
              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statValue}>{metrics?.favoritesCount || 0}</ThemedText>
                <ThemedText style={styles.statLabel}>FAVORITES</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statValue}>{metrics?.averagePrepTime || 0}</ThemedText>
                <ThemedText style={styles.statLabel}>AVG PREP</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statValue}>{Math.round((metrics?.totalCookingTime || 0) / 60)}</ThemedText>
                <ThemedText style={styles.statLabel}>TOTAL HOURS</ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Popular Ingredients Section */}
            {metrics?.mostFrequentIngredients && metrics.mostFrequentIngredients.length > 0 && (
              <ThemedView style={styles.popularSection}>
                <ThemedText style={styles.sectionTitle}>Popular Ingredients</ThemedText>
                <ThemedView style={styles.ingredientsGrid}>
                  {metrics.mostFrequentIngredients.slice(0, 4).map((ingredient, index) => (
                    <ThemedView key={ingredient} style={styles.ingredientCard}>
                      <ThemedView style={styles.ingredientIcon}>
                        <ThemedText style={styles.ingredientEmoji}>
                          {getIngredientEmoji(ingredient)}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText style={styles.ingredientName} numberOfLines={2} ellipsizeMode="tail">
                        {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            )}
          </>
        )}

        {/* Sign Out Button */}
        <ThemedView style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    opacity: 0.7,
    color: '#F1FAEE',
    fontSize: 16,
  },
  mainStatsSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  secondaryStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1FAEE',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#F1FAEE',
    opacity: 0.7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  popularSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F1FAEE',
    marginBottom: 20,
    textAlign: 'center',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ingredientCard: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 15,
    minHeight: 90,
  },
  ingredientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientEmoji: {
    fontSize: 18,
  },
  ingredientName: {
    fontSize: 11,
    color: '#F1FAEE',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 14,
  },
  buttonSection: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  signOutButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    marginBottom: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});