``` (NOBRIDGE) LOG  Starting recipe generation for ingredients: Chicken, Mac and cheese, ketchup, mustard, rice
 (NOBRIDGE) LOG  Formatted ingredient list: ["Chicken", "Mac and cheese", "ketchup", "mustard", "rice"]
 (NOBRIDGE) LOG  Created prompt for LLM
 (NOBRIDGE) LOG  Calling OpenRouter API...
 (NOBRIDGE) LOG  Sending prompt to LLM: Create a quick and easy recipe (15-20 minutes total cooking time) using these ingredients: Chicken, Mac and cheese, ketchup, mustard, rice.

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
 (NOBRIDGE) LOG  LLM Request configuration: {"max_tokens": 1024, "model": "openai/gpt-3.5-turbo", "temperature": 0.7, "url": "https://openrouter.ai/api/v1/chat/completions"}
 (NOBRIDGE) LOG  Received response from LLM: {"content": "Title: Cheesy Chicken Rice Bowl

Description: This quick and easy recipe combines tender chicken wit...", "model": "openai/gpt-3.5-turbo", "usage": {"completion_tokens": 317, "completion_tokens_details": {"reasoning_tokens": 0}, "prompt_tokens": 161, "prompt_tokens_details": {"cached_tokens": 0}, "total_tokens": 478}}
 (NOBRIDGE) LOG  Received response from OpenRouter API
 (NOBRIDGE) LOG  Parsing LLM response into Recipe object...
 (NOBRIDGE) LOG  Extracted dish type: None detected
 (NOBRIDGE) LOG  Distinctive ingredients for image search: ["cooked chicken, diced", "mac and cheese", "cooked rice", "ketchup"]
 (NOBRIDGE) LOG  Generating image with DALL-E 3 API
 (NOBRIDGE) LOG  Generating image with DALL-E 3 for ingredients: ["cooked chicken, diced", "mac and cheese", "cooked rice", "ketchup"]
 (NOBRIDGE) LOG  DALL-E API request: {"prompt": "generate an instagram food blog worthy food pic of a dish that includes these ingredients: cooked chicken, diced, mac and cheese, cooked rice, ketchup"}
 (NOBRIDGE) LOG  Generated image with DALL-E 3: https://oaidalleapiprodscus.blob.core.windows.net/private/org-Yh4WWJGdSuem4c40AC2gWFmy/user-Tlodpz0KcUBt3kqr2oMyrqkC/img-SyxOO5CAKh2vC3N3VS39hPIR.png?st=2025-04-16T17%3A34%3A30Z&se=2025-04-16T19%3A34%3A30Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=52f8f7b3-ca8d-4b21-9807-8b9df114d84c&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-04-16T04%3A56%3A30Z&ske=2025-04-17T04%3A56%3A30Z&sks=b&skv=2024-08-04&sig=MeiNePmLdqRuxjYiJpW3A3jN5p%2BrBFgYVQWjz5Pt4nk%3D
 (NOBRIDGE) LOG  Recipe successfully generated: Cheesy Chicken Rice Bowl
 (NOBRIDGE) LOG  Added recipe "Cheesy Chicken Rice Bowl" to recent recipes. Total recent recipes: 10
```