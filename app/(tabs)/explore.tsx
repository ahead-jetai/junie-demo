import { StyleSheet, Image, TouchableOpacity, View, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { generateRecipeWithLLM, Recipe } from '@/services/llmService';
import { addFavoriteRecipe, removeFavoriteRecipe, isRecipeFavorite } from '@/services/favoritesService';
import { addRecentRecipe, getRecentRecipes } from '@/services/recentRecipesService';
import RecipeModal from '@/components/RecipeModal';

// Function to generate a recipe based on ingredients using an LLM API
const generateRecipe = async (ingredients: string): Promise<Recipe> => {
  // Call the LLM service to generate a recipe
  return await generateRecipeWithLLM(ingredients);
};

export default function RecipeScreen() {
  const { ingredients } = useLocalSearchParams<{ ingredients: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipeIsFavorite, setSelectedRecipeIsFavorite] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Function to fetch recent recipes
  const fetchRecentRecipes = async () => {
    try {
      const recipes = await getRecentRecipes();
      setRecentRecipes(recipes);
    } catch (error) {
      console.error('Error fetching recent recipes:', error);
    }
  };

  // Function to handle opening a recipe in a modal
  const openRecipeModal = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);

    // Check if this recipe is a favorite
    const favorite = await isRecipeFavorite(recipe.title);
    setSelectedRecipeIsFavorite(favorite);

    setModalVisible(true);
  };

  // Function to toggle favorite status for the selected recipe
  const toggleSelectedFavorite = async () => {
    if (!selectedRecipe) return;

    try {
      if (selectedRecipeIsFavorite) {
        // Remove from favorites
        const success = await removeFavoriteRecipe(selectedRecipe.title);
        if (success) {
          setSelectedRecipeIsFavorite(false);
        }
      } else {
        // Add to favorites
        const success = await addFavoriteRecipe(selectedRecipe);
        if (success) {
          setSelectedRecipeIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite status for selected recipe:', error);
    }
  };

  useEffect(() => {
    // Function to fetch recipe
    const fetchRecipe = async () => {
      if (ingredients) {
        try {
          setLoading(true);
          // Call the generateRecipe function which now uses the LLM API
          const recipeData = await generateRecipe(ingredients);
          setRecipe(recipeData);

          // Check if this recipe is already a favorite
          const favorite = await isRecipeFavorite(recipeData.title);
          setIsFavorite(favorite);

          // Add to recent recipes
          await addRecentRecipe(recipeData);

          // Refresh the recent recipes list
          await fetchRecentRecipes();
        } catch (error) {
          console.error('Error generating recipe:', error);
          // Show an error message to the user (could be enhanced with a proper UI component)
          alert('Failed to generate recipe. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // If no ingredients provided, just show recent recipes
        setRecipe(null);
        setLoading(false);
        fetchRecentRecipes();
      }
    };

    fetchRecipe();
  }, [ingredients]);

  // Function to toggle favorite status
  const toggleFavorite = async () => {
    if (!recipe) return;

    try {
      if (isFavorite) {
        // Remove from favorites
        const success = await removeFavoriteRecipe(recipe.title);
        if (success) {
          setIsFavorite(false);
        }
      } else {
        // Add to favorites
        const success = await addFavoriteRecipe(recipe);
        if (success) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  const handleBackToHome = () => {
    router.replace('/');
  };

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ 
          light: colors.background, 
          dark: colors.background 
        }}
        headerImage={
          <View style={styles.headerImageContainer}>
            <Image
              source={{ 
                uri: loading 
                  ? 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=1000' 
                  : recipe?.image || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=1000'
              }}
              style={styles.headerImage}
              onError={() => {
                // If image fails to load and it's from DALL-E, use a fallback image
                if (recipe?.isDallEImage) {
                  // Use a random image from the foodImages array in llmService.ts
                  setRecipe({
                    ...recipe,
                    image: 'https://media.istockphoto.com/id/513124350/photo/cuisine-of-different-countries.jpg?s=612x612&w=0&k=20&c=KlcikHT7Cw5pLOynGjB4w_q3TAh-iDnpPHClBEfIBbY=',
                    isDallEImage: false // Reset the flag so we don't keep trying to load DALL-E images
                  });
                }
              }}
            />
            {!loading && recipe && (
              <View style={styles.imageOverlay} />
            )}
          </View>
        }>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <IconSymbol size={50} name="hourglass" color={colors.accent2} />
            <ThemedText style={[styles.loadingText, { color: colors.accent2 }]}>Creating your recipe...</ThemedText>
          </ThemedView>
        ) : (
          <>
            {recipe ? (
              <>
                <ThemedView style={styles.titleContainer}>
                  <ThemedText type="title" style={{ color: colors.accent1 }}>{recipe.title}</ThemedText>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={toggleFavorite}
                  >
                    <IconSymbol 
                      size={28} 
                      name={isFavorite ? "heart.fill" : "heart"} 
                      color={colors.accent1} 
                      style={{
                        shadowColor: colors.accent1,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 5,
                      }}
                    />
                  </TouchableOpacity>
                </ThemedView>

                <ThemedView style={styles.descriptionContainer}>
                  <ThemedText style={styles.description}>{recipe.description}</ThemedText>
                </ThemedView>

                <ThemedView style={[styles.timeContainer, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A' }]}>
                  <View style={styles.timeItem}>
                    <IconSymbol size={24} name="clock" color={colors.accent2} />
                    <ThemedText style={styles.timeText}>Prep: {recipe.prepTime}</ThemedText>
                  </View>
                  <View style={styles.timeItem}>
                    <IconSymbol size={24} name="flame" color={colors.accent2} />
                    <ThemedText style={styles.timeText}>Cook: {recipe.cookTime}</ThemedText>
                  </View>
                </ThemedView>

                <ThemedView style={styles.sectionContainer}>
                  <ThemedText type="subtitle" style={{ color: colors.tint }}>Ingredients</ThemedText>
                  {recipe.ingredients.map((ingredient: string, index: number) => (
                    <ThemedView key={index} style={styles.ingredientItem}>
                      <IconSymbol size={16} name="circle.fill" color={colors.accent2} style={styles.bulletPoint} />
                      <ThemedText style={styles.ingredientText}>{ingredient}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>

                <ThemedView style={styles.sectionContainer}>
                  <ThemedText type="subtitle" style={{ color: colors.tint }}>Instructions</ThemedText>
                  {recipe.instructions.map((instruction: string, index: number) => (
                    <ThemedView key={index} style={styles.instructionItem}>
                      <ThemedText style={[styles.instructionNumber, { color: colors.accent1 }]}>{index + 1}</ThemedText>
                      <ThemedText style={styles.instructionText}>{instruction}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>

                <TouchableOpacity 
                  style={[styles.backButton, { 
                    backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A',
                    borderColor: colors.accent2,
                    borderWidth: 2,
                  }]} 
                  onPress={handleBackToHome}
                >
                  <ThemedText style={[styles.backButtonText, { color: colors.accent2 }]}>Try New Ingredients</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <ThemedView style={styles.noActiveRecipeContainer}>
                <ThemedText type="subtitle" style={{ color: colors.tint, textAlign: 'center', marginBottom: 16 }}>
                  No active recipe
                </ThemedText>
                <TouchableOpacity 
                  style={[styles.backButton, { 
                    backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A',
                    borderColor: colors.accent2,
                    borderWidth: 2,
                    marginBottom: 24,
                  }]} 
                  onPress={handleBackToHome}
                >
                  <ThemedText style={[styles.backButtonText, { color: colors.accent2 }]}>Create New Recipe</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}

            {/* Recent Recipes Section */}
            {recentRecipes.length > 0 && (
              <ThemedView style={styles.recentRecipesContainer}>
                <ThemedView style={styles.recentRecipesHeader}>
                  <ThemedText type="subtitle" style={{ color: colors.tint }}>Your Recent Recipes</ThemedText>
                </ThemedView>
                <FlatList
                  data={recentRecipes}
                  keyExtractor={(item) => item.title}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.recentRecipeItem, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A' }]}
                      onPress={() => openRecipeModal(item)}
                    >
                      <Image source={{ uri: item.image }} style={styles.recentRecipeImage} />
                      <View style={styles.recentRecipeContent}>
                        <ThemedText style={styles.recentRecipeTitle}>{item.title}</ThemedText>
                        <ThemedText style={styles.recentRecipeDescription} numberOfLines={1}>{item.description}</ThemedText>
                        <View style={styles.recentRecipeTimes}>
                          <View style={styles.timeItem}>
                            <IconSymbol size={12} name="clock" color={colors.accent2} />
                            <ThemedText style={{ fontSize: 10 }}>Prep: {item.prepTime}</ThemedText>
                          </View>
                          <View style={styles.timeItem}>
                            <IconSymbol size={12} name="flame" color={colors.accent2} />
                            <ThemedText style={{ fontSize: 10 }}>Cook: {item.cookTime}</ThemedText>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.recentRecipesList}
                />
              </ThemedView>
            )}
          </>
        )}
      </ParallaxScrollView>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        visible={modalVisible}
        isFavorite={selectedRecipeIsFavorite}
        onClose={() => setModalVisible(false)}
        onToggleFavorite={toggleSelectedFavorite}
      />
    </>
  );

  // This comment can be removed
}

const styles = StyleSheet.create({
  headerImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.5)', // chefRed with opacity
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    textShadow: '0 0 10px rgba(230, 57, 70, 0.7)', // chefRed with opacity
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)', // chefRed with opacity
  },
  favoriteButton: {
    padding: 8,
  },
  descriptionContainer: {
    marginBottom: 24,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#E63946', // chefRed
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 30,
    gap: 16,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(230, 57, 70, 0.5)', // chefRed with opacity
  },
  bulletPoint: {
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)', // chefRed with opacity
  },
  instructionNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    width: 30,
    textShadow: '0 0 8px rgba(230, 57, 70, 0.7)', // chefRed with opacity
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  backButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  backButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    textShadow: '0 0 8px rgba(57, 255, 20, 0.7)',
  },
  // Recent recipes styles
  recentRecipesContainer: {
    marginTop: 30,
    marginBottom: 16,
  },
  recentRecipesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)',
  },
  recentRecipesList: {
    marginBottom: 16,
  },
  recentRecipeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  recentRecipeImage: {
    width: 80,
    height: 80,
  },
  recentRecipeContent: {
    flex: 1,
    padding: 12,
  },
  recentRecipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recentRecipeDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  recentRecipeTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Style for the container when no active recipe is being displayed
  noActiveRecipeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.5)', // chefRed with opacity
    backgroundColor: '#000000',
  },
  // Modal styles have been moved to RecipeModal.tsx
});
