# ChefAI Styling Theme System

This document explains the styling theme system implemented in the ChefAI app. The theme system provides a centralized way to manage styles, making CSS edits more efficient by allowing changes in one place to affect many files.

## Theme Structure

The theme is defined in `constants/theme.ts` and includes the following sections:

### Colors

```javascript
colors: {
  primaryBg: "#000000", // Black background
  secondaryBg: "#1A1A1A", // Dark grey background
  primaryText: "#F1FAEE", // Off-white text
  secondaryText: "#b0b0b0", // Light grey text
  accentRed: "#E63946", // Chef red accent
  accentBlue: "#457B9D", // Chef blue accent
  borderColor: "#333333", // Dark border color
  buttonBg: "#1A1A1A", // Dark grey button background
  buttonHover: "#333333", // Slightly lighter grey for hover states
  shadowColor: "rgba(230, 57, 70, 0.3)", // Chef red shadow with opacity
}
```

### Border Radius

```javascript
borderRadius: {
  small: 5,
  medium: 10,
  large: 20,
}
```

### Spacing

```javascript
spacing: {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
}
```

### Shadows

```javascript
shadows: {
  small: {
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  medium: {
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  glow: {
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
}
```

### Typography

```javascript
typography: {
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
}
```

## How to Use the Theme

### In Component Styles

Import the theme and use it in your StyleSheet:

```javascript
import { StyleSheet } from "react-native";
import theme from "@/constants/theme";

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primaryBg,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.medium,
  },
  text: {
    color: theme.colors.primaryText,
    ...theme.typography.default,
  },
  button: {
    backgroundColor: theme.colors.buttonBg,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
    borderWidth: 2,
    borderColor: theme.colors.accentRed,
    ...theme.shadows.small,
  },
});
```

### In Components

```javascript
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";

const ExampleComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Chef AI</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Start Cooking</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Using ThemedView and ThemedText Components

The app includes `ThemedView` and `ThemedText` components that automatically use the theme:

```javascript
import React from "react";
import { TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

const ExampleComponent = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to Chef AI</ThemedText>
      <TouchableOpacity style={styles.button}>
        <ThemedText type="defaultSemiBold">Start Cooking</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};
```

## Best Practices

1. **Always use the theme for styling**: Avoid hardcoding colors, spacing, or other style values.
2. **Create component-specific style files**: Keep styles organized by creating separate style files for each component.
3. **Use the ThemedView and ThemedText components**: These components automatically handle theme-based styling.
4. **Update the theme when adding new design elements**: If you need a new color or spacing value, add it to the theme rather than hardcoding it.
5. **Document any changes to the theme**: Keep this README updated with any changes to the theme structure.

## Example

See `components/ExampleStyles.ts` for a complete example of how to use the theme in component styles.