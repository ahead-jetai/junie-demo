/**
 * LLM Service for recipe generation
 * Uses OpenRouter API to generate recipes based on ingredients
 * Uses Unsplash API to find relevant images for recipes
 */
import Constants from 'expo-constants';


// Recipe type definition
export interface Recipe {
  id?: string; // Database ID (when saved to Supabase)
  title: string;
  description: string;
  image: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  isDallEImage?: boolean; // Flag to indicate if the image is from DALL-E
}

// Default food images to use when generating recipes
const foodImages = [
  "https://media.istockphoto.com/id/513124350/photo/cuisine-of-different-countries.jpg?s=612x612&w=0&k=20&c=KlcikHT7Cw5pLOynGjB4w_q3TAh-iDnpPHClBEfIBbY=",
  "https://img.freepik.com/premium-photo/beautiful-spread-diverse-culinary-dishes-showcasing-vibrant-mix-flavors-cuisines-from-around-world-grand-array-dishes-from-around-world_538213-76553.jpg",
  "https://img.freepik.com/premium-photo/table-full-food-including-turkey-turkey-turkey_670382-12577.jpg"
];

// Common dish types for better image search
const commonDishTypes = [
  'pasta', 'salad', 'soup', 'stew', 'curry', 'stir-fry', 'casserole', 
  'roast', 'grill', 'sandwich', 'burger', 'pizza', 'taco', 'burrito', 
  'risotto', 'pilaf', 'paella', 'omelette', 'frittata', 'quiche', 
  'cake', 'pie', 'cookie', 'bread', 'muffin', 'pancake', 'waffle'
];

// Generic ingredients that might skew image search results
const genericIngredients = [
  'salt', 'pepper', 'oil', 'water', 'sugar', 'flour', 'butter', 
  'garlic', 'onion', 'spice', 'herb', 'seasoning', 'vinegar'
];

// Ingredients that are visually distinctive and good for image searches
const distinctiveIngredientTypes = [
  // Proteins
  'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu',
  // Vegetables
  'tomato', 'carrot', 'broccoli', 'spinach', 'kale', 'pepper', 'zucchini', 'eggplant', 'mushroom',
  // Fruits
  'apple', 'orange', 'lemon', 'lime', 'berry', 'strawberry', 'blueberry', 'raspberry', 'banana',
  // Other distinctive ingredients
  'cheese', 'chocolate', 'avocado', 'egg', 'rice', 'pasta', 'noodle', 'bean', 'lentil'
];

/**
 * Extract dish type from recipe title or description
 * @param title - Recipe title
 * @param description - Recipe description
 * @returns The detected dish type or undefined if none detected
 */
function extractDishType(title: string, description: string): string | undefined {
  // Combine title and description for searching
  const text = `${title} ${description}`.toLowerCase();

  // Check for common dish types in the text
  for (const dishType of commonDishTypes) {
    if (text.includes(dishType)) {
      return dishType;
    }
  }

  // Check for dish types with common suffixes
  const suffixMatch = text.match(/\b\w+(?:soup|salad|stew|curry|pasta|sandwich|burger|pizza|cake|pie)\b/);
  if (suffixMatch) {
    return suffixMatch[0];
  }

  return undefined;
}

/**
 * Check if an ingredient is generic and might skew image search results
 * @param ingredient - Ingredient to check
 * @returns True if the ingredient is generic, false otherwise
 */
function isGenericIngredient(ingredient: string): boolean {
  const lowerIngredient = ingredient.toLowerCase();

  // Check if the ingredient is in the list of generic ingredients
  return genericIngredients.some(generic => 
    lowerIngredient.includes(generic) || 
    // Also check for measurements with generic ingredients
    /\d+\s*(tbsp|tsp|cup|g|oz|ml|pinch|dash)\s*of\s*/.test(lowerIngredient)
  );
}

/**
 * Extract the most visually distinctive ingredients from a list
 * @param ingredients - List of ingredients to analyze
 * @param maxCount - Maximum number of ingredients to return
 * @returns Array of the most distinctive ingredients for image search
 */
function extractDistinctiveIngredients(ingredients: string[], maxCount: number = 3): string[] {
  // Clean and normalize the ingredients
  const cleanedIngredients = ingredients.map(ingredient => {
    // Remove measurements and quantities
    return ingredient
      .replace(/^\d+\s*\/?\d*\s*(tbsp|tsp|cup|g|oz|ml|pound|lb|pinch|dash|tablespoon|teaspoon)s?\s*(of)?\s*/i, '')
      .replace(/^[-*•]\s*/, '') // Remove bullet points
      .trim()
      .toLowerCase();
  });

  // Score each ingredient based on distinctiveness
  const scoredIngredients = cleanedIngredients.map(ingredient => {
    // Skip generic ingredients
    if (isGenericIngredient(ingredient)) {
      return { ingredient, score: 0 };
    }

    // Start with a base score
    let score = 1;

    // Increase score for ingredients that are in our distinctive list
    for (const distinctive of distinctiveIngredientTypes) {
      if (ingredient.includes(distinctive)) {
        score += 3;
        break; // Only count once per ingredient
      }
    }

    // Increase score for ingredients with color words (visually distinctive)
    const colorWords = ['red', 'green', 'yellow', 'orange', 'purple', 'black', 'white', 'blue', 'brown'];
    for (const color of colorWords) {
      if (ingredient.includes(color)) {
        score += 2;
        break; // Only count once per ingredient
      }
    }

    // Increase score for longer ingredient names (often more specific)
    if (ingredient.length > 10) {
      score += 1;
    }

    return { ingredient, score };
  });

  // Sort by score (highest first) and take the top N
  const topIngredients = scoredIngredients
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map(item => item.ingredient)
    .filter(ingredient => ingredient.length > 0 && !isGenericIngredient(ingredient));

  // If we don't have enough distinctive ingredients, add some from the original list
  if (topIngredients.length < Math.min(maxCount, ingredients.length)) {
    for (const ingredient of cleanedIngredients) {
      if (!topIngredients.includes(ingredient) && 
          !isGenericIngredient(ingredient) && 
          ingredient.length > 0) {
        topIngredients.push(ingredient);
        if (topIngredients.length >= maxCount) {
          break;
        }
      }
    }
  }

  return topIngredients;
}

/**
 * Generate a recipe using the OpenRouter API
 * @param ingredients - Comma-separated list of ingredients
 * @returns A Promise that resolves to a Recipe object
 */
export async function generateRecipeWithLLM(ingredients: string): Promise<Recipe> {
  console.log("Starting recipe generation for ingredients:", ingredients);

  try {
    // Format the ingredients into a list
    const ingredientList = ingredients.split(',').map(item => item.trim());
    console.log("Formatted ingredient list:", ingredientList);

    // Create the prompt for the LLM
    const prompt = createRecipePrompt(ingredientList);
    console.log("Created prompt for LLM");

    // Call the OpenRouter API
    console.log("Calling OpenRouter API...");
    const response = await callOpenRouterAPI(prompt);
    console.log("Received response from OpenRouter API");

    // Parse the response into a Recipe object
    console.log("Parsing LLM response into Recipe object...");
    const recipe = await parseRecipeResponse(response, ingredientList);
    console.log("Recipe successfully generated:", recipe.title);

    return recipe;
  } catch (error) {
    console.error('Error generating recipe:', error);
    console.log("Using fallback recipe due to error");
    // Return a fallback recipe in case of error
    return await createFallbackRecipe(ingredients);
  }
}

/**
 * Create a prompt for the LLM to generate a recipe
 * @param ingredients - List of ingredients
 * @returns A formatted prompt string
 */
function createRecipePrompt(ingredients: string[]): string {
  return `Create a quick and easy recipe (15-20 minutes total cooking time) using these ingredients: ${ingredients.join(', ')}.

The recipe should include:
1. A creative title
2. A brief description
3. Preparation time (around 5 minutes)
4. Cooking time (around 10-15 minutes)
5. A list of all ingredients with measurements
6. Step-by-step cooking instructions
7. A URL to an image that represents this dish (must be a valid, publicly accessible image URL)

Make sure the recipe is simple, delicious, and uses all or most of the provided ingredients. 
For the image URL, please provide a link to a high-quality, appetizing image that accurately represents the dish.`;
}

/**
 * Call the OpenRouter API
 * @param prompt - The prompt to send to the API
 * @returns The text response from the API
 */
async function callOpenRouterAPI(prompt: string): Promise<string> {
  // For this implementation, we'll use the OpenRouter API
  // OpenRouter provides access to multiple LLM models through a single endpoint

  // The API endpoint for OpenRouter
  const API_URL = "https://openrouter.ai/api/v1/chat/completions";

  // Get the API key from environment variables
  // In React Native, we access environment variables differently than in Node.js
  // The .env file is already set up with OPEN_ROUTER_API_KEY
  const API_KEY = Constants.expoConfig.extra.OPEN_ROUTER_API_KEY || '';

  if (!API_KEY) {
    console.warn("OpenRouter API key not found in environment variables. Using fallback recipe.");
    throw new Error("OpenRouter API key not found");
  }

  // Log the prompt being sent to the LLM
  console.log("Sending prompt to LLM:", prompt);

  const requestBody = {
    model: "openai/gpt-3.5-turbo", // You can change this to any model supported by OpenRouter
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 0.95
  };

  // Log the request configuration
  console.log("LLM Request configuration:", {
    url: API_URL,
    model: requestBody.model,
    temperature: requestBody.temperature,
    max_tokens: requestBody.max_tokens
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        // Optional headers for OpenRouter analytics
        "HTTP-Referer": "chefai-app", // Your app's identifier
        "X-Title": "ChefAI" // Your app's name
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      return ""; // Return empty string instead of throwing error
    }

    const data = await response.json();

    // Log the response from the LLM
    console.log("Received response from LLM:", {
      model: data.model,
      usage: data.usage,
      content: data.choices[0].message.content.substring(0, 100) + "..." // Log first 100 chars to avoid huge logs
    });

    return data.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw error;
  }
}

/**
 * Parse the LLM response into a structured Recipe object
 * @param response - The text response from the LLM
 * @param ingredientList - The original list of ingredients
 * @returns A structured Recipe object
 */
async function parseRecipeResponse(response: string, ingredientList: string[]): Promise<Recipe> {
  try {
    // Extract title (assume it's the first line)
    const lines = response.split('\n').filter(line => line.trim() !== '');
    let title = lines[0].replace(/^#\s*/, '').trim();

    // Remove "title:" prefix if present
    title = title.replace(/^title:\s*/i, '');

    // If the title is too long or not found, create a simple one
    if (!title || title.length > 50) {
      title = `${ingredientList[0].charAt(0).toUpperCase() + ingredientList[0].slice(1)} Delight`;
    }

    // Extract description (assume it's in the first few lines)
    let description = '';
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.match(/prep time|cook time|ingredients|instructions/i)) {
        description = line;
        break;
      }
    }

    // Remove "description:" prefix if present
    description = description.replace(/^description:\s*/i, '');

    if (!description) {
      description = `A quick and easy recipe using ${ingredientList.join(', ')}. Ready in just 15 minutes!`;
    }

    // Extract prep time and cook time
    let prepTime = '5 minutes';
    let cookTime = '10 minutes';

    const prepTimeMatch = response.match(/prep\s*time:?\s*(\d+[-\s]?\d*\s*minutes?)/i);
    if (prepTimeMatch) {
      prepTime = prepTimeMatch[1];
    }

    const cookTimeMatch = response.match(/cook\s*time:?\s*(\d+[-\s]?\d*\s*minutes?)/i);
    if (cookTimeMatch) {
      cookTime = cookTimeMatch[1];
    }

    // Extract ingredients
    const ingredients: string[] = [];
    let inIngredientsSection = false;

    for (const line of lines) {
      if (line.match(/ingredients/i)) {
        inIngredientsSection = true;
        continue;
      }

      if (inIngredientsSection) {
        if (line.match(/instructions|directions|steps/i)) {
          inIngredientsSection = false;
          continue;
        }

        // Look for lines that might be ingredients (contain measurements or start with a dash/bullet)
        if (line.match(/^\s*[-*•]\s+/) || line.match(/\d+\s*(cup|tbsp|tsp|g|oz|ml|pound|lb)/i)) {
          ingredients.push(line.replace(/^\s*[-*•]\s+/, '').trim());
        }
      }
    }

    // If no ingredients were found, use the original list
    if (ingredients.length === 0) {
      ingredients.push(...ingredientList);
    }

    // Extract instructions
    const instructions: string[] = [];
    let inInstructionsSection = false;

    for (const line of lines) {
      if (line.match(/instructions|directions|steps/i)) {
        inInstructionsSection = true;
        continue;
      }

      if (inInstructionsSection) {
        // Look for numbered steps or bullet points
        if (line.match(/^\s*\d+[.)]\s+/) || line.match(/^\s*[-*•]\s+/)) {
          instructions.push(line.replace(/^\s*\d+[.)]\s+/, '').replace(/^\s*[-*•]\s+/, '').trim());
        }
      }
    }

    // If no instructions were found, create some basic ones
    if (instructions.length === 0) {
      instructions.push(
        `Prepare the ${ingredientList[0]} by washing and cutting into bite-sized pieces.`,
        `Heat a pan over medium heat and add a tablespoon of oil.`,
        `Add ${ingredientList[0]} to the pan and cook for 5 minutes.`,
        ingredientList.length > 1 ? `Add ${ingredientList.slice(1).join(', ')} and cook for another 5 minutes.` : 'Cook for another 5 minutes.',
        'Season with salt and pepper to taste.',
        'Serve hot and enjoy your meal!'
      );
    }

    // Extract dish type from title or description
    const dishType = extractDishType(title, description);
    console.log("Extracted dish type:", dishType || "None detected");

    // Create optimized search keywords from the parsed ingredients
    // Use the parsed ingredients if available, otherwise use the original list
    const parsedIngredientsList = ingredients.length > 0 ? ingredients : ingredientList;

    // Extract the main ingredients, focusing on distinctive ones
    // This will help find more relevant images
    const distinctiveIngredients = extractDistinctiveIngredients(parsedIngredientsList, 4);
    console.log("Distinctive ingredients for image search:", distinctiveIngredients);

    // Generate an image using DALL-E 3 API
    console.log("Generating image with DALL-E 3 API");
    let imageUrl = await generateImageWithDallE(distinctiveIngredients, dishType);
    let isDallEImage = false;

    // If DALL-E API call succeeds, set the flag
    if (imageUrl) {
      isDallEImage = true;
    } else {
      // If DALL-E API call fails, fall back to random image
      console.log("DALL-E API call failed, using random image from predefined collection");
      imageUrl = foodImages[Math.floor(Math.random() * foodImages.length)];
    }

    const finalImage = imageUrl;

    return {
      title,
      description,
      image: finalImage,
      prepTime,
      cookTime,
      ingredients,
      instructions,
      isDallEImage
    };
  } catch (error) {
    console.error('Error parsing recipe response:', error);
    // Return a fallback recipe if parsing fails
    return await createFallbackRecipe(ingredientList.join(', '));
  }
}

/**
 * Generate an image using the OpenAI DALL-E 3 API based on recipe ingredients
 * @param ingredients - List of ingredients to include in the prompt
 * @param dishType - Type of dish (e.g., pasta, salad, soup) if available
 * @returns A Promise that resolves to an image URL
 */
async function generateImageWithDallE(ingredients: string[], dishType?: string): Promise<string | null> {
  console.log("Generating image with DALL-E 3 for ingredients:", ingredients);

  try {
    // Get the OpenAI DALL-E API key from environment variables
    const OPENAI_DALL_E_API_KEY = Constants.expoConfig.extra.OPENAI_DALL_E_API_KEY || '';

    if (!OPENAI_DALL_E_API_KEY) {
      console.warn("OpenAI DALL-E API key not found in environment variables. Using fallback image.");
      return null;
    }

    // Create the prompt for DALL-E 3
    // Format as suggested in the issue description
    let prompt = `generate an instagram food blog worthy food pic of a dish that includes these ingredients: ${ingredients.join(', ')}`;

    // Add dish type if available
    if (dishType && dishType.length > 0) {
      prompt = `generate an instagram food blog worthy food pic of a ${dishType} dish that includes these ingredients: ${ingredients.join(', ')}`;
    }

    // Log the request configuration
    console.log("DALL-E API request:", {
      prompt: prompt
    });

    // Make the API call to OpenAI DALL-E 3 API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_DALL_E_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      })
    });

    if (!response.ok) {
      console.error(`DALL-E API request failed with status ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check if the response contains an image URL
    if (data && data.data && data.data.length > 0 && data.data[0].url) {
      console.log("Generated image with DALL-E 3:", data.data[0].url);
      return data.data[0].url;
    } else {
      console.error("DALL-E API response did not contain an image URL:", data);
      return null;
    }
  } catch (error) {
    console.error("Error calling DALL-E API:", error);
    return null;
  }
}



/**
 * Create a fallback recipe in case the API call fails
 * @param ingredients - Comma-separated list of ingredients
 * @returns A basic Recipe object
 */
async function createFallbackRecipe(ingredients: string): Promise<Recipe> {
  console.log("Creating fallback recipe for ingredients:", ingredients);

  const ingredientList = ingredients.split(',').map(item => item.trim());

  // Create a title for the fallback recipe
  const title = `${ingredientList[0].charAt(0).toUpperCase() + ingredientList[0].slice(1)} Delight`;

  // Create a simple description
  const description = `A quick and easy recipe using ${ingredientList.join(', ')}. Ready in just 15 minutes!`;

  // Extract dish type from title or description
  const dishType = extractDishType(title, description);
  console.log("Extracted dish type for fallback recipe:", dishType || "None detected");

  // Extract the most distinctive ingredients for image search
  const distinctiveIngredients = extractDistinctiveIngredients(ingredientList, 4);
  console.log("Distinctive ingredients for fallback recipe image search:", distinctiveIngredients);

  // Generate an image using DALL-E 3 API
  console.log("Generating image with DALL-E 3 API for fallback recipe");
  let imageUrl = await generateImageWithDallE(distinctiveIngredients, dishType);
  let isDallEImage = false;

  // If DALL-E API call succeeds, set the flag
  if (imageUrl) {
    isDallEImage = true;
  } else {
    // If DALL-E API call fails, fall back to random image
    console.log("DALL-E API call failed for fallback recipe, using random image from predefined collection");
    imageUrl = foodImages[Math.floor(Math.random() * foodImages.length)];
  }

  console.log("Using image for fallback recipe:", imageUrl);

  const fallbackRecipe = {
    title,
    description: `A quick and easy recipe using ${ingredientList.join(', ')}. Ready in just 15 minutes!`,
    image: imageUrl,
    prepTime: '5 minutes',
    cookTime: '10 minutes',
    ingredients: ingredientList.map(ingredient => `${ingredient}`),
    instructions: [
      `Prepare the ${ingredientList[0]} by washing and cutting into bite-sized pieces.`,
      `Heat a pan over medium heat and add a tablespoon of oil.`,
      `Add ${ingredientList[0]} to the pan and cook for 5 minutes.`,
      ingredientList.length > 1 ? `Add ${ingredientList.slice(1).join(', ')} and cook for another 5 minutes.` : 'Cook for another 5 minutes.',
      'Season with salt and pepper to taste.',
      'Serve hot and enjoy your meal!'
    ],
    isDallEImage
  };

  console.log("Fallback recipe created successfully");

  return fallbackRecipe;
}
