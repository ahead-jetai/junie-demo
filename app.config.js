import 'dotenv/config';

export default {
    expo: {
        name: 'ChefAI',
        slug: 'chef-ai',
        scheme: 'chefai',
        extra: {
            OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY,
            UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
            UNSPLASH_SECRET_KEY: process.env.UNSPLASH_SECRET_KEY,
            UNSPLASH_APP_ID: process.env.UNSPLASH_APP_ID,
            DEEP_AI_API_KEY: process.env.DEEP_AI_API_KEY,
            OPENAI_DALL_E_API_KEY: process.env.OPENAI_DALL_E_API_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseAnonKey: process.env.SUPABASE_PUBLIC_KEY,
        },
        web: {
            bundler: 'metro',
        },
        plugins: [
            'expo-router',
        ],
        ios: {
            supportsTablet: true,
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
        },
        // Handle deep linking for auth callbacks
        // This is needed for Supabase auth callbacks
        // Supabase will redirect to localhost:3000 by default
        // We need to handle these URLs in our app
        hooks: {
            postPublish: [
                {
                    file: 'expo-router/hooks/useDeepLinks',
                    config: {
                        deepLinks: [
                            'chefai://**',
                            'https://localhost:8081/**',
                            'http://localhost:8081/**',
                        ],
                    },
                },
            ],
        },
    },
};
