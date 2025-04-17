import { supabase, getCurrentUser } from './supabaseService';
import { Recipe } from './llmService';

// In-memory cache of favorites to avoid repeated Supabase calls
let favoritesCache: Recipe[] | null = null;

/**
 * Get all favorite recipes from Supabase
 * @returns A Promise that resolves to an array of Recipe objects
 */
export async function getFavoriteRecipes(): Promise<Recipe[]> {
  // Return from cache if available
  if (favoritesCache !== null) {
    return favoritesCache;
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot get favorites: User not authenticated');
      return [];
    }
    
    // Query favorites for the current user with recipe details
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
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
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error retrieving favorite recipes:', error.message);
      return [];
    }
    
    // Convert a database format to Recipe objects
    const favorites = data.map(item => ({
      title: item.recipes.title,
      description: item.recipes.description,
      image: item.recipes.image,
      prepTime: item.recipes.prep_time,
      cookTime: item.recipes.cook_time,
      ingredients: item.recipes.ingredients,
      instructions: item.recipes.instructions,
      isDallEImage: item.recipes.is_dalle_image,
      id: item.recipes.id, // Include recipe ID for reference
    }));
    
    // Update cache
    favoritesCache = favorites;
    
    return favorites;
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
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot add favorite: User not authenticated');
      return false;
    }
    
    // First, check if the recipe exists in the recipes table
    let recipeId = (recipe as any).id; // Use existing ID if available
    
    if (!recipeId) {
      // If a recipe doesn't have an ID, we need to save it first
      // Convert a recipe to database format
      const recipeData = {
        user_id: user.id,
        title: recipe.title,
        description: recipe.description,
        image: recipe.image,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        is_dalle_image: recipe.isDallEImage || false,
        created_at: new Date().toISOString(),
      };
      
      // Insert recipe into database
      const { data: savedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select('id')
        .single();
      
      if (recipeError) {
        console.error('Error saving recipe for favorite:', recipeError.message);
        return false;
      }
      
      recipeId = savedRecipe.id;
    }
    
    // Check if a recipe is already in favorites
    const { data: existingFavorites, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
    
    if (checkError) {
      console.error('Error checking existing favorites:', checkError.message);
      return false;
    }
    
    // If already in favorites, return success
    if (existingFavorites.length > 0) {
      return true;
    }
    
    // Add to favorites
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error adding favorite recipe:', error.message);
      return false;
    }
    
    // Clear cache to force refresh
    favoritesCache = null;
    
    return true;
  } catch (error) {
    console.error('Error adding favorite recipe:', error);
    return false;
  }
}

/**
 * Remove a recipe from favorites
 * @param recipeId - The ID of the recipe to remove
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function removeFavoriteRecipe(recipeId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot remove favorite: User not authenticated');
      return false;
    }
    
    // Remove from favorites
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
    
    if (error) {
      console.error('Error removing favorite recipe:', error.message);
      return false;
    }
    
    // Clear cache to force refresh
    favoritesCache = null;
    
    return true;
  } catch (error) {
    console.error('Error removing favorite recipe:', error);
    return false;
  }
}

/**
 * Check if a recipe is in favorites
 * @param recipeId - The ID of the recipe to check
 * @returns A Promise that resolves to true if the recipe is in favorites, false otherwise
 */
export async function isRecipeFavorite(recipeId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot check favorite: User not authenticated');
      return false;
    }
    
    // Check if a recipe is in favorites
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
    
    if (error) {
      console.error('Error checking if recipe is favorite:', error.message);
      return false;
    }
    
    return data.length > 0;
  } catch (error) {
    console.error('Error checking if recipe is favorite:', error);
    return false;
  }
}

/**
 * Clear the favorites cache to force a refresh from Supabase
 */
export function clearFavoritesCache(): void {
  favoritesCache = null;
}