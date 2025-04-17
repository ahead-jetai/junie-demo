# 🤖 ChefAI — Built with JetBrains Junie & Expo

ChefAI is a smart cooking assistant powered by OpenAI and built using [JetBrains Junie](https://www.jetbrains.com/guide/ai/article/junie/intellij-idea/), JetBrains' new AI coding agent. This app generates quick recipes and dish images from simple ingredient lists—all built in React Native using [Expo](https://expo.dev).

> ✨ AI-powered. React Native fast. Junie assisted.

---

## 🚀 Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

3. Run the app on:
   - [Expo Go](https://expo.dev/go)
   - Android/iOS Simulators
   - Physical devices via QR code

> 🧪 This project uses [file-based routing](https://docs.expo.dev/router/introduction/) in the app/ directory.

## 🧠 Powered by JetBrains Junie

JetBrains Junie is an AI coding agent built into IDEs like WebStorm, designed to assist in:

- Project execution plan proposal
- Writing code, docs, and tests
- Generating UI from prompts
- Integrating APIs (like Open AI, Google Gemini, Anthropic, etc...)

ChefAI was built with significant help from Junie in creating:

- Step by step project execution plan
- Recipe generation logic
- DALL·E image generation prompts
- Themed UI styling and dark mode
- Learn more: [Junie for IntelliJ-based IDEs →](https://www.jetbrains.com/guide/ai/article/junie/intellij-idea/)

## 📘 Junie Guidelines

This project includes a [`.junie/guidelines.md`](.junie/guidelines.md) file to help JetBrains Junie better understand and contribute to the codebase.

Junie uses this file to:

- Learn the project structure and tech stack
- Understand how to run scripts and tests
- Follow your team’s best practices
- Avoid common mistakes by referencing custom hints

> You can auto-generate this file by asking Junie to analyze the project or create it manually from scratch. Clear instructions improve Junie's effectiveness — think of it as giving your AI teammate onboarding docs.


## 📦 Scripts

🔧 General

```bash
npm install           # Install all dependencies
npx expo start        # Launch Expo developer tools in your browser
```

📱 Run the App
```bash
npx expo start --ios      # Open in iOS Simulator (Mac only)
npx expo start --android  # Open in Android Emulator (or device)
npx expo start --web      # Run the app in a web browser
npx expo start            # Choose platform manually in terminal or browser
```

📱 Expo Go (physical devices)
Scan the QR code shown in the terminal or browser after running:
```bash
npx expo start
```
Install the Expo Go app on your device.

🔄 Development Utilities
```bash
npx expo start --dev-client     # Start with development build
npx expo r -c                   # Restart and clear cache
npm run reset-project           # Reset app/ folder (custom script)
```
> 🧼 `-c` flag = clear cache (helpful for fixing weird issues)

🛠️ Build for Production
```
npx expo build:android      # Build APK or AAB (classic build service)
npx expo build:ios          # Build .ipa file (requires Apple credentials)

# New EAS Build system:
npx eas build -p android    # Build for Android with EAS
npx eas build -p ios        # Build for iOS with EAS
```
> Make sure to configure EAS with eas.json before using EAS Build.

## 📚 Learn More

- [Expo Docs](https://docs.expo.dev/)
- [JetBrains Junie Guide](https://www.jetbrains.com/guide/ai/)

## 🤝 Community

- [JetBrains AI Community](https://www.jetbrains.com/ai/)


## 🔒 Environment

Remember to add your [OpenRouter API](https://openrouter.ai/) and [OpenAI](https://platform.openai.com/docs/overview) api keys in a .env file (which is gitignored):

   ```bash
   OPEN_ROUTER_API_KEY=your-open-router-api-key
   OPENAI_DALL_E_API_KEY=your-openai-dall-e-api-key
   ```
