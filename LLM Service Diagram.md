# LLM Service Diagram - ChefAI

This document provides a detailed explanation of the LLM (Large Language Model) service implementation in the ChefAI application. It outlines the complete flow from user input to recipe generation, including all components, endpoints, models, and token usage.

## Overview

The LLM service in ChefAI is responsible for generating recipes based on user-provided ingredients. It leverages OpenAI's GPT models through the OpenRouter API for recipe generation and OpenAI's DALL-E 3 for generating food images. The service includes fallback mechanisms to ensure a smooth user experience even when API calls fail.

## Service Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Interface │────▶│  LLM Service    │────▶│  OpenRouter API │
│  (explore.tsx)  │     │ (llmService.ts) │     │  (GPT-3.5)      │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Recipe Object  │◀────│  Response       │
│  with Image     │     │  Parser         │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  DALL-E 3 API   │
                        │  (Image Gen)    │
                        │                 │
                        └─────────────────┘
```

## Detailed Component Breakdown

### 1. User Interface (explore.tsx)

**Input:**
- User-provided ingredients (comma-separated string)

**Process:**
- Calls `generateRecipeWithLLM(ingredients)` from the LLM service
- Handles loading states and error conditions
- Displays the generated recipe with its image
- Manages recipe saving, favorites, and recent recipes

**Output:**
- Rendered recipe UI with all components (title, description, image, prep/cook times, ingredients, instructions)

### 2. LLM Service (llmService.ts)

#### Main Function: `generateRecipeWithLLM(ingredients: string): Promise<Recipe>`

**Input:**
- Comma-separated list of ingredients (string)

**Process:**
1. Formats the ingredients into a list
2. Creates a prompt for the LLM using `createRecipePrompt()`
3. Calls the OpenRouter API using `callOpenRouterAPI()`
4. Parses the response into a Recipe object using `parseRecipeResponse()`
5. Generates an image using DALL-E 3 API

**Output:**
- A Recipe object containing:
  - title: string
  - description: string
  - image: string (URL)
  - prepTime: string
  - cookTime: string
  - ingredients: string[]
  - instructions: string[]
  - isDallEImage?: boolean

**Error Handling:**
- Returns a fallback recipe if any step fails

### 3. OpenRouter API Call

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Model:** `openai/gpt-3.5-turbo`

**Headers:**
- Content-Type: application/json
- Authorization: Bearer {API_KEY}
- HTTP-Referer: chefai-app
- X-Title: ChefAI

**Request Body:**
```json
{
  "model": "openai/gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "<prompt>"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 0.95
}
```

**Prompt Template:**
```
Create a quick and easy recipe (15-20 minutes total cooking time) using these ingredients: {ingredients}.

The recipe should include:
1. A creative title
2. A brief description
3. Preparation time (around 5 minutes)
4. Cooking time (around 10-15 minutes)
5. A list of all ingredients with measurements
6. Step-by-step cooking instructions
7. A URL to an image that represents this dish (must be a valid, publicly accessible image URL)

Make sure the recipe is simple, delicious, and uses all or most of the provided ingredients. 
For the image URL, please provide a link to a high-quality, appetizing image that accurately represents the dish.
```

**Average Token Usage:**
- Input tokens: ~150-200 tokens (depends on number of ingredients)
- Output tokens: ~500-800 tokens (complete recipe)
- Total per request: ~650-1000 tokens

### 4. Response Parsing

**Process:**
1. Extracts title (typically the first line)
2. Extracts description (from the first few lines)
3. Extracts prep time and cook time using regex
4. Extracts ingredients list (looks for bullet points or measurements)
5. Extracts instructions (looks for numbered steps or bullet points)
6. Identifies dish type and distinctive ingredients for image generation

**Edge Cases Handled:**
- Missing title: Creates a title based on the first ingredient
- Missing description: Creates a generic description
- Missing prep/cook times: Uses default values (5 min prep, 10 min cook)
- Missing ingredients: Uses the original ingredient list
- Missing instructions: Creates basic instructions based on ingredients

### 5. DALL-E 3 Image Generation

**Endpoint:** `https://api.openai.com/v1/images/generations`

**Headers:**
- Authorization: Bearer {OPENAI_DALL_E_API_KEY}
- Content-Type: application/json

**Request Body:**
```json
{
  "model": "dall-e-3",
  "prompt": "<image_prompt>",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "response_format": "url"
}
```

**Image Prompt Template:**
```
generate an instagram food blog worthy food pic of a {dishType} dish that includes these ingredients: {distinctiveIngredients}
```

**Average Token Usage:**
- DALL-E 3 doesn't use tokens in the same way as text models
- Each image generation counts as one API call

**Fallback Mechanism:**
- If DALL-E image generation fails, uses a predefined list of food images

### 6. Fallback Recipe Generation

**Function:** `createFallbackRecipe(ingredients: string): Promise<Recipe>`

**Process:**
1. Creates a simple title based on the first ingredient
2. Creates a generic description
3. Uses default prep and cook times
4. Uses the original ingredient list
5. Creates basic instructions based on ingredients
6. Attempts to generate an image with DALL-E or uses a predefined image

## Helper Functions

### 1. Extract Dish Type
- **Function:** `extractDishType(title: string, description: string): string | undefined`
- **Purpose:** Identifies the type of dish (e.g., pasta, salad, soup) from the title or description
- **Used for:** Improving image generation prompts

### 2. Extract Distinctive Ingredients
- **Function:** `extractDistinctiveIngredients(ingredients: string[], maxCount: number): string[]`
- **Purpose:** Identifies visually distinctive ingredients for better image generation
- **Process:** Scores ingredients based on distinctiveness, color words, and length

### 3. Check Generic Ingredients
- **Function:** `isGenericIngredient(ingredient: string): boolean`
- **Purpose:** Filters out generic ingredients (salt, pepper, oil) that might skew image search

## Integration Points

The LLM service integrates with several other components in the ChefAI application:

1. **Recipe Storage:** Generated recipes are saved to a database via `saveRecipe()` in recipeService.ts
2. **Favorites System:** Recipes can be added to favorites via `addFavoriteRecipe()` in favoritesServiceSupabase.ts
3. **Recent Recipes:** Generated recipes are added to recent recipes via `addRecentRecipe()` in recentRecipesServiceSupabase.ts

## Error Handling and Resilience

The LLM service includes several mechanisms to ensure reliability:

1. **API Error Handling:** Catches and logs errors from OpenRouter and DALL-E APIs
2. **Fallback Recipe:** Provides a basic recipe if generation fails
3. **Fallback Images:** Uses predefined food images if DALL-E image generation fails
4. **Response Validation:** Ensures all required recipe fields are present, with defaults if missing

## Performance Considerations

- **Token Usage:** The service is optimized to use around 650-1000 tokens per recipe generation
- **Response Time:** Recipe generation typically takes 3-5 seconds, depending on API response times
- **Image Generation:** DALL-E image generation adds 1-3 seconds to the process
- **Caching:** Generated recipes are stored in the database to avoid regeneration

## Security Considerations

- **API Keys:** All API keys are stored in environment variables, not hardcoded
- **Error Logging:** Errors are logged without exposing sensitive information
- **Input Validation:** User inputs are validated before being sent to external APIs

## Future Enhancements

Potential improvements to the LLM service could include:

1. **Model Selection:** Allow switching between different LLM models based on needs
2. **Prompt Optimization:** Further refine prompts for better recipe quality
3. **Caching:** Implement caching of similar ingredient combinations
4. **Offline Mode:** Provide basic functionality when APIs are unavailable
5. **User Feedback Loop:** Incorporate user ratings to improve recipe generation