/**
 * Recipe Generation Metadata Service
 * Handles storing and retrieving recipe generation metadata in Supabase
 */
import { supabase } from './supabaseService';

export interface RecipeGenerationMetadata {
  id?: string;
  recipe_id?: string;
  user_id: string;
  
  // LLM Request/Response metadata
  llm_model?: string;
  llm_url?: string;
  llm_temperature?: number;
  llm_max_tokens?: number;
  
  // Token usage data
  prompt_tokens?: number;
  completion_tokens?: number;
  reasoning_tokens?: number;
  cached_tokens?: number;
  total_tokens?: number;
  
  // Image generation metadata
  image_model?: string;
  image_generation_prompt?: string;
  image_generation_success?: boolean;
  is_dalle_image?: boolean;
  
  // Performance metrics
  generation_start_time?: string;
  generation_end_time?: string;
  total_generation_time_ms?: number;
  llm_response_time_ms?: number;
  image_generation_time_ms?: number;
  
  // Additional metadata
  ingredients_used?: string[];
  distinctive_ingredients?: string[];
  dish_type?: string;
  generation_steps_completed?: number;
  generation_success?: boolean;
  error_message?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Save recipe generation metadata to Supabase
 * @param metadata - The metadata object to save
 * @returns Promise<RecipeGenerationMetadata | null>
 */
export async function saveRecipeGenerationMetadata(
  metadata: RecipeGenerationMetadata
): Promise<RecipeGenerationMetadata | null> {
  try {
    console.log('Saving recipe generation metadata:', metadata);

    const { data, error } = await supabase
      .from('recipe_generation_metadata')
      .insert([metadata])
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe generation metadata:', error);
      return null;
    }

    console.log('Recipe generation metadata saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveRecipeGenerationMetadata:', error);
    return null;
  }
}

/**
 * Update existing recipe generation metadata
 * @param id - The metadata record ID
 * @param updates - The fields to update
 * @returns Promise<RecipeGenerationMetadata | null>
 */
export async function updateRecipeGenerationMetadata(
  id: string,
  updates: Partial<RecipeGenerationMetadata>
): Promise<RecipeGenerationMetadata | null> {
  try {
    console.log('Updating recipe generation metadata:', id, updates);

    const { data, error } = await supabase
      .from('recipe_generation_metadata')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe generation metadata:', error);
      return null;
    }

    console.log('Recipe generation metadata updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateRecipeGenerationMetadata:', error);
    return null;
  }
}

/**
 * Get recipe generation metadata by recipe ID
 * @param recipeId - The recipe ID
 * @returns Promise<RecipeGenerationMetadata | null>
 */
export async function getRecipeGenerationMetadata(
  recipeId: string
): Promise<RecipeGenerationMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('recipe_generation_metadata')
      .select('*')
      .eq('recipe_id', recipeId)
      .single();

    if (error) {
      console.error('Error fetching recipe generation metadata:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRecipeGenerationMetadata:', error);
    return null;
  }
}

/**
 * Get all recipe generation metadata for a user
 * @param userId - The user ID
 * @param limit - Optional limit for results
 * @returns Promise<RecipeGenerationMetadata[]>
 */
export async function getUserRecipeGenerationMetadata(
  userId: string,
  limit?: number
): Promise<RecipeGenerationMetadata[]> {
  try {
    let query = supabase
      .from('recipe_generation_metadata')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user recipe generation metadata:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserRecipeGenerationMetadata:', error);
    return [];
  }
}

/**
 * Get aggregated statistics for recipe generation
 * @param userId - The user ID
 * @returns Promise with aggregated stats
 */
export async function getRecipeGenerationStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('recipe_generation_metadata')
      .select(`
        total_tokens,
        completion_tokens,
        prompt_tokens,
        total_generation_time_ms,
        llm_response_time_ms,
        image_generation_time_ms,
        generation_success,
        llm_model,
        is_dalle_image
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching recipe generation stats:', error);
      return null;
    }

    // Calculate aggregated statistics
    const stats = {
      total_recipes: data.length,
      successful_generations: data.filter(d => d.generation_success).length,
      total_tokens_used: data.reduce((sum, d) => sum + (d.total_tokens || 0), 0),
      total_completion_tokens: data.reduce((sum, d) => sum + (d.completion_tokens || 0), 0),
      total_prompt_tokens: data.reduce((sum, d) => sum + (d.prompt_tokens || 0), 0),
      average_generation_time: data.length > 0 
        ? data.reduce((sum, d) => sum + (d.total_generation_time_ms || 0), 0) / data.length 
        : 0,
      average_llm_response_time: data.length > 0 
        ? data.reduce((sum, d) => sum + (d.llm_response_time_ms || 0), 0) / data.length 
        : 0,
      dalle_images_generated: data.filter(d => d.is_dalle_image).length,
      most_used_model: getMostFrequent(data.map(d => d.llm_model).filter(Boolean)),
    };

    return stats;
  } catch (error) {
    console.error('Error in getRecipeGenerationStats:', error);
    return null;
  }
}

/**
 * Helper function to get the most frequent item in an array
 */
function getMostFrequent(arr: string[]): string | null {
  if (arr.length === 0) return null;
  
  const frequency: { [key: string]: number } = {};
  let maxCount = 0;
  let mostFrequent = arr[0];

  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostFrequent = item;
    }
  }

  return mostFrequent;
}