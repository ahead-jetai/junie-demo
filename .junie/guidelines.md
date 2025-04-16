# ChefAI Developer Guidelines

This document provides essential information for developers working on the ChefAI project.

## Project Structure

```
chefAI/
├── app/                  # Main application code (Expo Router)
│   ├── (tabs)/           # Tab-based navigation screens
│   │   ├── _layout.tsx   # Tab navigation configuration
│   │   ├── index.tsx     # Home screen
│   │   ├── explore.tsx   # Recipe exploration screen
│   │   └── myrecipes.tsx # Saved recipes screen
│   └── _layout.tsx       # Root layout configuration
├── assets/               # Static assets (images, fonts)
├── components/           # Reusable UI components
├── constants/            # App constants and theme configuration
├── hooks/                # Custom React hooks
├── services/             # Business logic and API integrations
│   ├── llmService.ts     # OpenAI integration for recipe generation
│   ├── favoritesService.ts # Manage favorite recipes
│   └── recentRecipesService.ts # Track recent recipes
└── scripts/              # Utility scripts
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React hooks and context
- **API Integration**: OpenAI for recipe generation
- **Storage**: AsyncStorage for local data persistence
- **Language**: TypeScript

## Getting Started

1. **Setup Environment**:
   - Ensure Node.js and npm are installed
   - Install Expo CLI: `npm install -g expo-cli`
   - Create a `.env` file with required API keys (see Environment section)

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   # or
   npx expo start
   ```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run linter
npm run lint
```

## Common Scripts

- `npm start`: Start the Expo development server
- `npm run ios`: Start the app in iOS simulator
- `npm run android`: Start the app in Android emulator
- `npm run web`: Start the app in web browser
- `npm run reset-project`: Reset the project (clears caches)

## Environment Setup

Create a `.env` file in the project root with the following variables:

```
OPEN_ROUTER_API_KEY=your-api-key
OPENAI_DALL_E_API_KEY=your-openai-dall-e-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UNSPLASH_SECRET_KEY=your-unsplash-secret-key
UNSPLASH_APP_ID=your-unsplash-app-id
DEEP_AI_API_KEY=your-deep-ai-api-key
```

## Best Practices

1. **File Organization**:
   - Place new screens in the appropriate directory under `app/`
   - Create reusable components in the `components/` directory
   - Add business logic in the `services/` directory

2. **Coding Standards**:
   - Follow TypeScript best practices
   - Use functional components with hooks
   - Document complex functions with JSDoc comments
   - Run linter before committing code

3. **Navigation**:
   - Use Expo Router's file-based routing
   - Screen files in `app/(tabs)/` automatically become tab screens
   - Use `Link` component from Expo Router for navigation

4. **State Management**:
   - Use React Context for global state
   - Use local state for component-specific state
   - Leverage custom hooks for reusable logic

5. **API Integration**:
   - Add new API services in the `services/` directory
   - Follow the pattern in existing services
   - Handle errors and loading states appropriately

## Troubleshooting

- **Metro bundler issues**: Run `npm start -- --reset-cache`
- **Dependency issues**: Delete `node_modules` and run `npm install`
- **Expo errors**: Check the [Expo documentation](https://docs.expo.dev/)