# Supabase Integration for ChefAI

This document provides information about the Supabase integration for ChefAI, including database schema, setup instructions, and usage guidelines.

## Database Schema

The Supabase database for ChefAI consists of the following tables:

### 1. recipes

Stores recipe data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| title | text | Recipe title |
| description | text | Recipe description |
| image | text | URL to recipe image |
| prep_time | text | Preparation time |
| cook_time | text | Cooking time |
| ingredients | jsonb | Array of ingredients |
| instructions | jsonb | Array of instructions |
| is_dalle_image | boolean | Whether the image is from DALL-E |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### 2. favorites

Stores user favorite recipes.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| recipe_id | uuid | Foreign key to recipes |
| created_at | timestamp | Creation timestamp |

### 3. recent_recipes

Stores user recent recipes.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| recipe_id | uuid | Foreign key to recipes |
| created_at | timestamp | Creation timestamp |

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Note your project URL and public (anon) key

### 2. Set Up Database Tables

Execute the following SQL in the Supabase SQL Editor:

```sql
-- Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  prep_time TEXT,
  cook_time TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  is_dalle_image BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  recipe_id UUID REFERENCES recipes(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Create recent_recipes table
CREATE TABLE recent_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  recipe_id UUID REFERENCES recipes(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX recipes_user_id_idx ON recipes(user_id);
CREATE INDEX favorites_user_id_idx ON favorites(user_id);
CREATE INDEX favorites_recipe_id_idx ON favorites(recipe_id);
CREATE INDEX recent_recipes_user_id_idx ON recent_recipes(user_id);
CREATE INDEX recent_recipes_recipe_id_idx ON recent_recipes(recipe_id);
CREATE INDEX recent_recipes_created_at_idx ON recent_recipes(created_at);
```

### 3. Set Up Row Level Security (RLS)

Execute the following SQL to set up RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes
CREATE POLICY "Users can view their own recipes" 
  ON recipes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" 
  ON recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" 
  ON recipes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" 
  ON recipes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for recent_recipes
CREATE POLICY "Users can view their own recent recipes" 
  ON recent_recipes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recent recipes" 
  ON recent_recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recent recipes" 
  ON recent_recipes FOR DELETE 
  USING (auth.uid() = user_id);
```

### 4. Configure Environment Variables

Add the following to your `.env` file:

```
SUPABASE_URL=your-supabase-url
SUPABASE_PUBLIC_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-service-role-key
```

## Usage

The Supabase integration provides the following services:

1. **Authentication Service** (`supabaseService.ts`)
   - User sign up, sign in, and sign out
   - Get current user information

2. **Recipe Service** (`recipeService.ts`)
   - CRUD operations for recipes

3. **Favorites Service** (`favoritesServiceSupabase.ts`)
   - Add/remove favorite recipes
   - Get all favorite recipes

4. **Recent Recipes Service** (`recentRecipesServiceSupabase.ts`)
   - Add/remove recent recipes
   - Get all recent recipes

## Migration from AsyncStorage

To migrate from AsyncStorage to Supabase:

1. Replace imports from the old services with the new Supabase services
2. Add authentication UI for users to sign up and sign in
3. Update components to handle recipe IDs for favorites and recent recipes

Example:

```typescript
// Old import
import { getFavoriteRecipes } from '@/services/favoritesService';

// New import
import { getFavoriteRecipes } from '@/services/favoritesServiceSupabase';
```

## Dependencies

- `@supabase/supabase-js`: Supabase JavaScript client
- `@react-native-async-storage/async-storage`: For session persistence