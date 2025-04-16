import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from './llmService';

// Key for storing recent recipes in AsyncStorage
const RECENT_RECIPES_STORAGE_KEY = 'chefai_recent_recipes';

// Maximum number of recent recipes to store
const MAX_RECENT_RECIPES = 10;

// In-memory cache of recent recipes to avoid repeated AsyncStorage calls
let recentRecipesCache: Recipe[] | null = null;

/**
 * Get all recent recipes from storage
 * @returns A Promise that resolves to an array of Recipe objects
 */
export async function getRecentRecipes(): Promise<Recipe[]> {
  // Return from cache if available
  if (recentRecipesCache !== null) {
    return recentRecipesCache;
  }

  try {
    const recentRecipesJson = await AsyncStorage.getItem(RECENT_RECIPES_STORAGE_KEY);
    if (recentRecipesJson) {
      const recentRecipes = JSON.parse(recentRecipesJson) as Recipe[];
      // Update cache
      recentRecipesCache = recentRecipes;
      return recentRecipes;
    }
    // If no recent recipes found, return empty array
    recentRecipesCache = [];
    return [];
  } catch (error) {
    console.error('Error retrieving recent recipes:', error);
    return [];
  }
}

/**
 * Add a recipe to recent recipes
 * @param recipe - The Recipe object to add
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function addRecentRecipe(recipe: Recipe): Promise<boolean> {
  try {
    // Get current recent recipes
    const recentRecipes = await getRecentRecipes();

    // Check if recipe already exists in recent recipes (by title)
    const existingIndex = recentRecipes.findIndex(r => r.title === recipe.title);
    
    // Create a new array for updated recent recipes
    let updatedRecentRecipes: Recipe[];
    
    if (existingIndex !== -1) {
      // If recipe exists, remove it from its current position
      updatedRecentRecipes = [
        ...recentRecipes.slice(0, existingIndex),
        ...recentRecipes.slice(existingIndex + 1)
      ];
    } else {
      // If recipe doesn't exist, just use the current list
      updatedRecentRecipes = [...recentRecipes];
    }
    
    // Add the recipe to the beginning of the array (most recent)
    updatedRecentRecipes.unshift(recipe);
    
    // Limit to MAX_RECENT_RECIPES
    if (updatedRecentRecipes.length > MAX_RECENT_RECIPES) {
      updatedRecentRecipes = updatedRecentRecipes.slice(0, MAX_RECENT_RECIPES);
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem(RECENT_RECIPES_STORAGE_KEY, JSON.stringify(updatedRecentRecipes));

    // Update cache
    recentRecipesCache = updatedRecentRecipes;

    // Log for debugging
    console.log(`Added recipe "${recipe.title}" to recent recipes. Total recent recipes: ${updatedRecentRecipes.length}`);

    return true;
  } catch (error) {
    console.error('Error adding recent recipe:', error);
    return false;
  }
}

/**
 * Remove a recipe from recent recipes
 * @param recipeTitle - The title of the recipe to remove
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function removeRecentRecipe(recipeTitle: string): Promise<boolean> {
  try {
    // Get current recent recipes
    const recentRecipes = await getRecentRecipes();

    // Filter out the recipe to remove
    const updatedRecentRecipes = recentRecipes.filter(recipe => recipe.title !== recipeTitle);

    // If no change in length, recipe wasn't in recent recipes
    if (updatedRecentRecipes.length === recentRecipes.length) {
      return false;
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem(RECENT_RECIPES_STORAGE_KEY, JSON.stringify(updatedRecentRecipes));

    // Update cache
    recentRecipesCache = updatedRecentRecipes;

    return true;
  } catch (error) {
    console.error('Error removing recent recipe:', error);
    return false;
  }
}

/**
 * Clear the recent recipes cache to force a refresh from AsyncStorage
 */
export function clearRecentRecipesCache(): void {
  recentRecipesCache = null;
}