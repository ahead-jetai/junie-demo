import { supabase, getCurrentUser } from './supabaseService';
import { Recipe } from './llmService';

/**
 * Save a recipe to the database
 * @param recipe - The Recipe object to save
 * @returns A Promise that resolves to the saved recipe or null if save failed
 */
export async function saveRecipe(recipe: Recipe): Promise<Recipe | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.error('Cannot save recipe: User not authenticated');
      return null;
    }

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
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipeData)
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe:', error.message);
      return null;
    }

    // Convert database format back to Recipe
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      image: data.image,
      prepTime: data.prep_time,
      cookTime: data.cook_time,
      ingredients: data.ingredients,
      instructions: data.instructions,
      isDallEImage: data.is_dalle_image,
    };
  } catch (error) {
    console.error('Error saving recipe:', error);
    return null;
  }
}

/**
 * Get all recipes for the current user
 * @returns A Promise that resolves to an array of Recipe objects
 */
export async function getUserRecipes(): Promise<Recipe[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.error('Cannot get recipes: User not authenticated');
      return [];
    }

    // Query recipes for current user
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting recipes:', error.message);
      return [];
    }

    // Convert database format to Recipe objects
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: item.image,
      prepTime: item.prep_time,
      cookTime: item.cook_time,
      ingredients: item.ingredients,
      instructions: item.instructions,
      isDallEImage: item.is_dalle_image,
    }));
  } catch (error) {
    console.error('Error getting recipes:', error);
    return [];
  }
}

/**
 * Get a recipe by ID
 * @param recipeId - The ID of the recipe to get
 * @returns A Promise that resolves to the Recipe object or null if not found
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  try {
    // Query recipe by ID
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) {
      console.error('Error getting recipe:', error.message);
      return null;
    }

    // Convert database format to Recipe
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      image: data.image,
      prepTime: data.prep_time,
      cookTime: data.cook_time,
      ingredients: data.ingredients,
      instructions: data.instructions,
      isDallEImage: data.is_dalle_image,
    };
  } catch (error) {
    console.error('Error getting recipe:', error);
    return null;
  }
}

/**
 * Update a recipe
 * @param recipeId - The ID of the recipe to update
 * @param recipe - The updated Recipe object
 * @returns A Promise that resolves to the updated Recipe object or null if update failed
 */
export async function updateRecipe(recipeId: string, recipe: Recipe): Promise<Recipe | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.error('Cannot update recipe: User not authenticated');
      return null;
    }

    // Convert recipe to database format
    const recipeData = {
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      is_dalle_image: recipe.isDallEImage || false,
      updated_at: new Date().toISOString(),
    };

    // Update recipe in database
    const { data, error } = await supabase
      .from('recipes')
      .update(recipeData)
      .eq('id', recipeId)
      .eq('user_id', user.id) // Ensure user owns the recipe
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe:', error.message);
      return null;
    }

    // Convert database format back to Recipe
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      image: data.image,
      prepTime: data.prep_time,
      cookTime: data.cook_time,
      ingredients: data.ingredients,
      instructions: data.instructions,
      isDallEImage: data.is_dalle_image,
    };
  } catch (error) {
    console.error('Error updating recipe:', error);
    return null;
  }
}

/**
 * Delete a recipe
 * @param recipeId - The ID of the recipe to delete
 * @returns A Promise that resolves to true if successful, false otherwise
 */
export async function deleteRecipe(recipeId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.error('Cannot delete recipe: User not authenticated');
      return false;
    }

    // Delete recipe from database
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id); // Ensure user owns the recipe

    if (error) {
      console.error('Error deleting recipe:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return false;
  }
}
