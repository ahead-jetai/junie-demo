import { supabase, getCurrentUser } from './supabaseService';
import { Recipe } from './llmService';

// Maximum number of recent recipes to store
const MAX_RECENT_RECIPES = 10;

// In-memory cache of recent recipes to avoid repeated Supabase calls
let recentRecipesCache: Recipe[] | null = null;

/**
 * Get all recent recipes from Supabase
 * @returns A Promise that resolves to an array of Recipe objects
 */
export async function getRecentRecipes(): Promise<Recipe[]> {
  // Return from cache if available
  if (recentRecipesCache !== null) {
    return recentRecipesCache;
  }

  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot get recent recipes: User not authenticated');
      return [];
    }
    
    // Query recent recipes for current user with recipe details
    const { data, error } = await supabase
      .from('recent_recipes')
      .select(`
        id,
        created_at,
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
      .limit(MAX_RECENT_RECIPES);
    
    if (error) {
      console.error('Error retrieving recent recipes:', error.message);
      return [];
    }
    
    // Convert database format to Recipe objects
    const recentRecipes = data.map(item => ({
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
    recentRecipesCache = recentRecipes;
    
    return recentRecipes;
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
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot add recent recipe: User not authenticated');
      return false;
    }
    
    // First, check if the recipe exists in the recipes table
    let recipeId = (recipe as any).id; // Use existing ID if available
    
    if (!recipeId) {
      // If recipe doesn't have an ID, we need to save it first
      // Convert recipe to database format
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
        console.error('Error saving recipe for recent:', recipeError.message);
        return false;
      }
      
      recipeId = savedRecipe.id;
    }
    
    // Check if recipe is already in recent recipes
    const { data: existingRecent, error: checkError } = await supabase
      .from('recent_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
    
    if (checkError) {
      console.error('Error checking existing recent recipes:', checkError.message);
      return false;
    }
    
    // If already in recent recipes, remove it so we can add it to the top
    if (existingRecent.length > 0) {
      const { error: deleteError } = await supabase
        .from('recent_recipes')
        .delete()
        .eq('id', existingRecent[0].id);
      
      if (deleteError) {
        console.error('Error removing existing recent recipe:', deleteError.message);
        // Continue anyway, not a critical error
      }
    }
    
    // Add to recent recipes
    const { error } = await supabase
      .from('recent_recipes')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error adding recent recipe:', error.message);
      return false;
    }
    
    // Check if we have more than MAX_RECENT_RECIPES
    const { data: allRecent, error: countError } = await supabase
      .from('recent_recipes')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (countError) {
      console.error('Error counting recent recipes:', countError.message);
      // Continue anyway, not a critical error
    } else if (allRecent.length > MAX_RECENT_RECIPES) {
      // Remove oldest recipes beyond the limit
      const toRemove = allRecent.slice(MAX_RECENT_RECIPES);
      
      for (const item of toRemove) {
        const { error: removeError } = await supabase
          .from('recent_recipes')
          .delete()
          .eq('id', item.id);
        
        if (removeError) {
          console.error('Error removing old recent recipe:', removeError.message);
          // Continue anyway, not a critical error
        }
      }
    }
    
    // Clear cache to force refresh
    recentRecipesCache = null;
    
    return true;
  } catch (error) {
    console.error('Error adding recent recipe:', error);
    return false;
  }
}

/**
 * Remove a recipe from recent recipes
 * @param recipeId - The ID of the recipe to remove
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function removeRecentRecipe(recipeId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Cannot remove recent recipe: User not authenticated');
      return false;
    }
    
    // Remove from recent recipes
    const { error } = await supabase
      .from('recent_recipes')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);
    
    if (error) {
      console.error('Error removing recent recipe:', error.message);
      return false;
    }
    
    // Clear cache to force refresh
    recentRecipesCache = null;
    
    return true;
  } catch (error) {
    console.error('Error removing recent recipe:', error);
    return false;
  }
}

/**
 * Clear the recent recipes cache to force a refresh from Supabase
 */
export function clearRecentRecipesCache(): void {
  recentRecipesCache = null;
}