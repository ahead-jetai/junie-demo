import { getUserFavoriteRecipes, getUserRecentRecipes, getUserRecipes, getUserFavoritesCount, getUserGeneratedRecipesCount } from './supabaseService';
import { Recipe } from './llmService';

export interface ProfileMetrics {
  favoritesCount: number;
  generatedRecipesCount: number;
  mostFrequentIngredients: string[];
  averagePrepTime: number;
  averageCookTime: number;
  topCuisineTypes: string[];
  totalCookingTime: number;
}

/**
 * Extract cuisine type from recipe title or description
 */
function extractCuisineType(recipe: Recipe): string {
  const text = `${recipe.title} ${recipe.description}`.toLowerCase();
  
  const cuisineKeywords = {
    'italian': ['italian', 'pasta', 'pizza', 'risotto', 'marinara', 'pesto', 'parmesan'],
    'mexican': ['mexican', 'taco', 'burrito', 'salsa', 'guacamole', 'quesadilla', 'enchilada'],
    'asian': ['asian', 'stir-fry', 'soy sauce', 'ginger', 'sesame', 'teriyaki', 'ramen'],
    'indian': ['indian', 'curry', 'turmeric', 'cumin', 'garam masala', 'naan', 'basmati'],
    'mediterranean': ['mediterranean', 'olive oil', 'feta', 'hummus', 'tzatziki', 'olives'],
    'american': ['american', 'burger', 'bbq', 'mac and cheese', 'fried chicken', 'apple pie'],
    'french': ['french', 'baguette', 'croissant', 'brie', 'coq au vin', 'ratatouille'],
    'thai': ['thai', 'pad thai', 'coconut milk', 'lemongrass', 'fish sauce', 'basil'],
    'chinese': ['chinese', 'wok', 'soy sauce', 'rice wine', 'five spice', 'dim sum'],
    'japanese': ['japanese', 'sushi', 'miso', 'sake', 'tempura', 'udon', 'soba']
  };

  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return cuisine;
    }
  }
  
  return 'other';
}

/**
 * Parse time string to minutes
 */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  
  const hourMatch = timeStr.match(/(\d+)\s*h/i);
  const minuteMatch = timeStr.match(/(\d+)\s*m/i);
  
  let totalMinutes = 0;
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
  
  return totalMinutes;
}

/**
 * Extract and clean ingredient names
 */
function extractIngredientNames(ingredients: string[]): string[] {
  return ingredients.map(ingredient => {
    // Remove measurements and quantities
    return ingredient
      .replace(/^\d+\s*\/?\d*\s*(tbsp|tsp|cup|g|oz|ml|pound|lb|pinch|dash|tablespoon|teaspoon)s?\s*(of)?\s*/i, '')
      .replace(/^[-*•]\s*/, '') // Remove bullet points
      .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical notes
      .trim()
      .toLowerCase();
  }).filter(ingredient => ingredient.length > 0);
}

/**
 * Get the most frequent ingredients from all recipes
 */
function getMostFrequentIngredients(recipes: Recipe[], limit: number = 5): string[] {
  const ingredientCounts: { [key: string]: number } = {};
  
  recipes.forEach(recipe => {
    const cleanedIngredients = extractIngredientNames(recipe.ingredients);
    cleanedIngredients.forEach(ingredient => {
      // Skip very generic ingredients
      const genericIngredients = ['salt', 'pepper', 'oil', 'water', 'sugar', 'flour', 'butter'];
      if (!genericIngredients.includes(ingredient)) {
        ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1;
      }
    });
  });
  
  return Object.entries(ingredientCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([ingredient]) => ingredient);
}

/**
 * Get the most common cuisine types
 */
function getTopCuisineTypes(recipes: Recipe[], limit: number = 3): string[] {
  const cuisineCounts: { [key: string]: number } = {};
  
  recipes.forEach(recipe => {
    const cuisine = extractCuisineType(recipe);
    cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
  });
  
  return Object.entries(cuisineCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([cuisine]) => cuisine);
}

/**
 * Calculate profile metrics from user's recipes stored in Supabase
 */
export async function getProfileMetrics(): Promise<ProfileMetrics> {
  try {
    // Fetch data from Supabase database
    const [favoriteRecipes, allUserRecipes, favoritesCount, generatedRecipesCount] = await Promise.all([
      getUserFavoriteRecipes(),
      getUserRecipes(),
      getUserFavoritesCount(),
      getUserGeneratedRecipesCount()
    ]);
    
    // Combine all recipes for analysis (avoid duplicates by using a Map with recipe ID as key)
    const allRecipesMap = new Map<string, Recipe>();
    
    // Add all user's generated recipes
    allUserRecipes.forEach(recipe => {
      if (recipe.id) {
        allRecipesMap.set(recipe.id, recipe);
      }
    });
    
    // Add favorite recipes (may include recipes from other users)
    favoriteRecipes.forEach(recipe => {
      if (recipe.id) {
        allRecipesMap.set(recipe.id, recipe);
      }
    });
    
    const allRecipes = Array.from(allRecipesMap.values());
    
    // Calculate time-based metrics
    const prepTimes = allRecipes
      .map(recipe => parseTimeToMinutes(recipe.prepTime))
      .filter(time => time > 0);
    
    const cookTimes = allRecipes
      .map(recipe => parseTimeToMinutes(recipe.cookTime))
      .filter(time => time > 0);
    
    const averagePrepTime = prepTimes.length > 0 
      ? Math.round(prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length)
      : 0;
    
    const averageCookTime = cookTimes.length > 0
      ? Math.round(cookTimes.reduce((sum, time) => sum + time, 0) / cookTimes.length)
      : 0;
    
    const totalCookingTime = prepTimes.reduce((sum, time) => sum + time, 0) + 
                           cookTimes.reduce((sum, time) => sum + time, 0);
    
    console.log(`[ProfileMetrics] Calculated metrics for user:`, {
      favoritesCount,
      generatedRecipesCount,
      totalRecipesAnalyzed: allRecipes.length,
      averagePrepTime,
      averageCookTime,
      totalCookingTime
    });
    
    return {
      favoritesCount,
      generatedRecipesCount,
      mostFrequentIngredients: getMostFrequentIngredients(allRecipes),
      averagePrepTime,
      averageCookTime,
      topCuisineTypes: getTopCuisineTypes(allRecipes),
      totalCookingTime
    };
  } catch (error) {
    console.error('Error calculating profile metrics from Supabase:', error);
    return {
      favoritesCount: 0,
      generatedRecipesCount: 0,
      mostFrequentIngredients: [],
      averagePrepTime: 0,
      averageCookTime: 0,
      topCuisineTypes: [],
      totalCookingTime: 0
    };
  }
}