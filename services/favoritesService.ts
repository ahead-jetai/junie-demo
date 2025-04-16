import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from './llmService';

// Key for storing favorites in AsyncStorage
const FAVORITES_STORAGE_KEY = 'chefai_favorite_recipes';

// In-memory cache of favorites to avoid repeated AsyncStorage calls
let favoritesCache: Recipe[] | null = null;

/**
 * Get all favorite recipes from storage
 * @returns A Promise that resolves to an array of Recipe objects
 */
export async function getFavoriteRecipes(): Promise<Recipe[]> {
  // Return from cache if available
  if (favoritesCache !== null) {
    return favoritesCache;
  }

  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    if (favoritesJson) {
      const favorites = JSON.parse(favoritesJson) as Recipe[];
      // Update cache
      favoritesCache = favorites;
      return favorites;
    }
    // If no favorites found, return empty array
    favoritesCache = [];
    return [];
  } catch (error) {
    console.error('Error retrieving favorite recipes:', error);
    return [];
  }
}

/**
 * Save a recipe to favorites
 * @param recipe - The Recipe object to save
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function addFavoriteRecipe(recipe: Recipe): Promise<boolean> {
  try {
    // Get current favorites
    const favorites = await getFavoriteRecipes();

    // Check if recipe already exists in favorites (by title)
    const exists = favorites.some(fav => fav.title === recipe.title);
    if (exists) {
      return true; // Already in favorites
    }

    // Add new recipe to favorites
    const updatedFavorites = [...favorites, recipe];

    // Save to AsyncStorage
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));

    // Update cache
    favoritesCache = updatedFavorites;

    // Log for debugging
    console.log(`Added recipe "${recipe.title}" to favorites. Total favorites: ${updatedFavorites.length}`);

    return true;
  } catch (error) {
    console.error('Error adding favorite recipe:', error);
    return false;
  }
}

/**
 * Remove a recipe from favorites
 * @param recipeTitle - The title of the recipe to remove
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function removeFavoriteRecipe(recipeTitle: string): Promise<boolean> {
  try {
    // Get current favorites
    const favorites = await getFavoriteRecipes();

    // Filter out the recipe to remove
    const updatedFavorites = favorites.filter(recipe => recipe.title !== recipeTitle);

    // If no change in length, recipe wasn't in favorites
    if (updatedFavorites.length === favorites.length) {
      return false;
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));

    // Update cache
    favoritesCache = updatedFavorites;

    return true;
  } catch (error) {
    console.error('Error removing favorite recipe:', error);
    return false;
  }
}

/**
 * Check if a recipe is in favorites
 * @param recipeTitle - The title of the recipe to check
 * @returns A Promise that resolves to true if the recipe is in favorites, false otherwise
 */
export async function isRecipeFavorite(recipeTitle: string): Promise<boolean> {
  try {
    const favorites = await getFavoriteRecipes();
    return favorites.some(recipe => recipe.title === recipeTitle);
  } catch (error) {
    console.error('Error checking if recipe is favorite:', error);
    return false;
  }
}

/**
 * Clear the favorites cache to force a refresh from AsyncStorage
 */
export function clearFavoritesCache(): void {
  favoritesCache = null;
}
