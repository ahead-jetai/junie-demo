# ChefAI LLM Integration

This directory contains services for integrating Large Language Models (LLMs) into the ChefAI application.

## Overview

The LLM integration allows ChefAI to generate dynamic, creative recipes based on user-provided ingredients. Instead of using hardcoded recipes, the app now sends the ingredients to an LLM API and receives a customized recipe in response.

## Files

- `llmService.ts`: The main service file that handles communication with the LLM API and processes the responses.

## How It Works

1. The user enters ingredients in the app's main screen.
2. When they submit, the ingredients are passed to the `generateRecipeWithLLM` function.
3. This function:
   - Formats the ingredients into a prompt for the LLM
   - Sends the prompt to the OpenRouter API
   - Parses the response into a structured Recipe object
   - Searches for relevant images using the Unsplash API
   - Returns the recipe to be displayed in the app
4. If any errors occur during this process, a fallback recipe is generated to ensure the app always provides a response.
5. Comprehensive logging is implemented throughout the process to track requests, responses, and any errors.

## Configuration

### Changing the LLM Model

The service currently uses the "openai/gpt-3.5-turbo" model from OpenRouter. To use a different model:

1. Open `llmService.ts`
2. Find the `callOpenRouterAPI` function
3. Update the `model` parameter in the request body with your preferred model

```typescript
// Example: Change to a different model
body: JSON.stringify({
  model: "anthropic/claude-3-sonnet", // Change to any model supported by OpenRouter
  messages: [
    {
      role: "user",
      content: prompt
    }
  ],
  // other parameters...
}),
```

OpenRouter provides access to hundreds of AI models through a single endpoint. You can find a list of available models at [https://openrouter.ai/models](https://openrouter.ai/models).

### API Key Configuration

The service uses the OpenRouter API key stored in the `.env` file as `OPEN_ROUTER_API_KEY`. Make sure this environment variable is set correctly.

```
OPEN_ROUTER_API_KEY=your-api-key-here
```

If you need to regenerate your API key or create a new one, visit [https://openrouter.ai/keys](https://openrouter.ai/keys).

### Unsplash API Configuration

The service uses the Unsplash API to search for relevant images based on recipe keywords. The Unsplash API credentials are stored in the `.env` file:

```
UNSPLASH_APP_ID=your-app-id
UNSPLASH_ACCESS_KEY=your-access-key
UNSPLASH_SECRET_KEY=your-secret-key
```

These credentials are used to authenticate requests to the Unsplash API. The service only needs the `UNSPLASH_ACCESS_KEY` for the image search functionality.

## Alternative LLM Options

OpenRouter already provides access to a wide variety of LLM models, including:

1. **OpenAI models** (GPT-4, GPT-3.5-turbo, etc.)
2. **Anthropic models** (Claude 3, etc.)
3. **Mistral models** (Mistral-7B, Mixtral, etc.)
4. **Meta models** (Llama 3, etc.)
5. **And many more**

To use a different model, simply change the `model` parameter in the `callOpenRouterAPI` function as described above. No need to change the API endpoint or request format.

## Logging

The service includes comprehensive logging to help with debugging and monitoring:

1. **Request Logging**: All requests to the LLM API are logged, including the prompt and configuration.
2. **Response Logging**: Responses from the LLM API are logged, including the model used and token usage.
3. **Image URL Extraction**: The process of extracting image URLs from the response is logged.
4. **Error Logging**: Any errors that occur during the process are logged with detailed information.

You can view these logs in the console during development or in your production logging system.

## Image Handling

The service uses a multi-layered approach to find relevant images for recipes:

1. **Unsplash API Search**: The service extracts keywords from the recipe (title and main ingredients) and searches the Unsplash API for relevant food images.
2. **LLM-Provided URLs** (Fallback 1): If the Unsplash API call fails, the service attempts to extract image URLs from the LLM response:
   - The prompt asks the LLM to include a URL to an image that represents the dish.
   - The response parser looks for URLs that might be image links (ending with .jpg, .jpeg, .png, .gif, or .webp).
   - It also looks for URLs that are explicitly labeled as image URLs.
3. **Static Image Array** (Fallback 2): If both the Unsplash API call and URL extraction fail, a random image is selected from a static array of food images.

## Limitations and Considerations

1. **Rate Limits**: Free APIs often have rate limits. If the app experiences heavy usage, you may need to implement rate limiting or switch to a paid service.
2. **Response Quality**: The quality of generated recipes depends on the model used. More powerful models generally produce better results but may have higher costs or stricter rate limits.
3. **Error Handling**: The service includes fallback mechanisms to ensure the app always returns a recipe, even if the API call fails.
4. **Response Parsing**: The current parsing logic is designed to handle a variety of response formats, but it may need adjustments if you switch to a different model that produces significantly different output structures.
5. **Unsplash API Rate Limits**: The Unsplash API has rate limits (50 requests per hour for the free tier). If the app experiences heavy usage, you may need to implement rate limiting or upgrade to a paid Unsplash plan.
6. **Image Relevance**: The relevance of images depends on the keywords extracted from the recipe. The service uses the recipe title and main ingredients as search keywords, but this may not always result in the most appropriate image for the specific dish.

## Testing

To test the LLM integration:

1. Enter different combinations of ingredients in the app
2. Verify that the generated recipes make sense and use the provided ingredients
3. Check the console logs to see the requests being sent to the LLM and the responses received
4. Verify that the Unsplash API is being called with appropriate keywords
5. Check that relevant images are being displayed for the recipes
6. Test the fallback mechanisms by:
   - Temporarily removing the Unsplash API key to test the LLM URL extraction fallback
   - Modifying the LLM prompt to not include image URLs to test the static image array fallback
7. Test error scenarios by temporarily modifying the API URLs to invalid endpoints
8. Verify that the fallback recipe generation works correctly
9. Check that the logging provides useful information for debugging
