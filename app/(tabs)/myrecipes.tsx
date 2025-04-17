import { StyleSheet, FlatList, TouchableOpacity, View, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import RecipeModal from '@/components/RecipeModal';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Recipe } from '@/services/llmService';
import { getFavoriteRecipes, removeFavoriteRecipe, clearFavoritesCache } from '@/services/favoritesServiceSupabase';

export default function MyRecipesScreen() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const pathname = usePathname();

  // Use a ref to track if the component is mounted
  const isMounted = React.useRef(true);

  // Load favorite recipes when the component mounts
  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;

    // Initial load of favorites
    loadFavoriteRecipes();

    // Set up a timer to periodically reload favorites when the component is mounted
    // This ensures the list is refreshed when navigating back to this tab
    const intervalId = setInterval(() => {
      // Only reload if we're not already loading and the component is still mounted
      if (!loading && isMounted.current) {
        console.log('Periodic refresh of favorites list');
        loadFavoriteRecipes();
      }
    }, 5000); // Check every 5 seconds (increased from 3 seconds for better performance)

    // Clean up the timer when the component unmounts
    return () => {
      console.log('Cleaning up timer');
      // Set isMounted to false when the component unmounts
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Refresh favorites list when modal is closed
  useEffect(() => {
    // If modal was just closed and component is mounted, refresh the favorites list
    if (!modalVisible && isMounted.current) {
      loadFavoriteRecipes();
    }
  }, [modalVisible]); // Dependency on modalVisible means this effect runs when modal visibility changes

  // Refresh favorites list when navigating to this tab
  useEffect(() => {
    // Check if the current path is the myrecipes tab
    if (pathname === '/myrecipes' && isMounted.current) {
      console.log('Navigated to My Recipes tab, refreshing favorites list');
      loadFavoriteRecipes();
    }
  }, [pathname]); // Dependency on pathname means this effect runs when the path changes

  // Function to load favorite recipes from storage
  const loadFavoriteRecipes = async () => {
    // Only proceed if the component is still mounted
    if (!isMounted.current) {
      console.log('Component unmounted, skipping loadFavoriteRecipes');
      return;
    }

    // Don't set loading to true if we're just refreshing in the background
    // This prevents the loading spinner from showing unnecessarily
    const isInitialLoad = favoriteRecipes.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      // Clear the cache to force a fresh load from AsyncStorage
      clearFavoritesCache();

      const recipes = await getFavoriteRecipes();
      console.log(`Loaded ${recipes.length} favorite recipes:`, recipes.map(r => r.title));

      // Check again if the component is still mounted before updating state
      if (isMounted.current) {
        setFavoriteRecipes(recipes);
      }
    } catch (error) {
      console.error('Error loading favorite recipes:', error);
    } finally {
      // Check if the component is still mounted before updating state
      if (isMounted.current && isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Function to handle removing a recipe from favorites
  const handleRemoveFavorite = async (recipe: Recipe) => {
    // Only proceed if the component is still mounted
    if (!isMounted.current) {
      console.log('Component unmounted, skipping handleRemoveFavorite');
      return;
    }

    try {
      // Use recipe ID if available, otherwise use title
      const recipeId = recipe.id;
      const recipeTitle = recipe.title;

      const success = recipeId 
        ? await removeFavoriteRecipe(recipeId)
        : await removeFavoriteRecipe(recipeTitle);

      if (success && isMounted.current) {
        setFavoriteRecipes(prevRecipes => 
          prevRecipes.filter(r => 
            // Filter by ID if both have IDs, otherwise fall back to title
            (r.id && recipe.id) ? r.id !== recipe.id : r.title !== recipe.title
          )
        );

        if (selectedRecipe && 
            ((selectedRecipe.id && recipe.id && selectedRecipe.id === recipe.id) || 
             (!selectedRecipe.id && !recipe.id && selectedRecipe.title === recipe.title)) && 
            isMounted.current) {
          setModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Error removing favorite recipe:', error);
    }
  };

  // Function to open the recipe detail modal
  const openRecipeModal = (recipe: Recipe) => {
    // Only proceed if the component is still mounted
    if (!isMounted.current) {
      console.log('Component unmounted, skipping openRecipeModal');
      return;
    }

    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  // Render a recipe item in the list
  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    // Function to handle opening the recipe modal
    const handleOpenModal = () => {
      openRecipeModal(item);
    };

    // Function to handle removing the recipe from favorites
    const handleRemove = () => {
      handleRemoveFavorite(item);
    };

    return (
      <View style={[styles.recipeItemContainer, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A' }]}>
        <TouchableOpacity 
          style={styles.recipeItem}
          onPress={handleOpenModal}
        >
          <Image source={{ uri: item.image }} style={styles.recipeItemImage} />
          <View style={styles.recipeItemContent}>
            <View style={styles.recipeItemHeader}>
              <ThemedText style={styles.recipeItemTitle}>{item.title}</ThemedText>
            </View>
            <ThemedText style={styles.recipeItemDescription} numberOfLines={2}>
              {item.description}
            </ThemedText>
            <View style={styles.recipeItemTimes}>
              <View style={styles.timeItem}>
                <IconSymbol size={16} name="clock" color={colors.accent2} />
                <ThemedText style={styles.timeText}>Prep: {item.prepTime}</ThemedText>
              </View>
              <View style={styles.timeItem}>
                <IconSymbol size={16} name="flame" color={colors.accent2} />
                <ThemedText style={styles.timeText}>Cook: {item.cookTime}</ThemedText>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Separate TouchableOpacity for the remove button */}
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={handleRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol size={20} name="heart.fill" color={colors.accent1} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ color: colors.accent2 }}>My Recipes</ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <IconSymbol size={50} name="hourglass" color={colors.accent2} />
          <ThemedText style={[styles.loadingText, { color: colors.accent2 }]}>Loading your recipes...</ThemedText>
        </ThemedView>
      ) : favoriteRecipes.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol size={50} name="heart.slash" color={colors.accent1} />
          <ThemedText style={[styles.emptyText, { color: colors.text }]}>
            You don't have any favorite recipes yet.
          </ThemedText>
          <ThemedText style={[styles.emptySubText, { color: colors.text }]}>
            When you find a recipe you love, tap the heart icon to save it here.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={favoriteRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id ? `id-${item.id}` : `title-${item.title}-${item.prepTime}`}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Recipe Detail Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        visible={modalVisible}
        isFavorite={true}
        onClose={() => setModalVisible(false)}
        onToggleFavorite={() => selectedRecipe && handleRemoveFavorite(selectedRecipe)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    paddingVertical: 16,
    marginTop: 40,
    marginBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  loadingText: { fontSize: 20, textAlign: 'center', fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  emptyText: { fontSize: 20, textAlign: 'center', fontWeight: '600', marginTop: 16 },
  emptySubText: { fontSize: 16, textAlign: 'center', marginTop: 8 },
  listContainer: { paddingBottom: 16 },
  recipeItemContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  recipeItem: {
    flexDirection: 'row',
  },
  recipeItemImage: { width: 100, height: 100 },
  recipeItemContent: { flex: 1, padding: 12 },
  recipeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeItemTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 1,
  },
  recipeItemDescription: { fontSize: 14, marginBottom: 8 },
  recipeItemTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, fontWeight: '600' },
  // Modal styles have been moved to RecipeModal.tsx
});
