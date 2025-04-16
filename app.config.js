import 'dotenv/config';

export default {
    expo: {
        name: 'ChefAI',
        slug: 'chef-ai',
        extra: {
            OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY,
            UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
            UNSPLASH_SECRET_KEY: process.env.UNSPLASH_SECRET_KEY,
            UNSPLASH_APP_ID: process.env.UNSPLASH_APP_ID,
            DEEP_AI_API_KEY: process.env.DEEP_AI_API_KEY,
            OPENAI_DALL_E_API_KEY: process.env.OPENAI_DALL_E_API_KEY,
        },
    },
};