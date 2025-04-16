/**
 * Example of how to use the theme in component styles
 * This file demonstrates the recommended way to create styles using the theme
 */

import { StyleSheet } from "react-native";
import theme from "@/constants/theme";

// Example of creating styles using the theme
const styles = StyleSheet.create({
  // Container style using theme properties
  container: {
    backgroundColor: theme.colors.primaryBg,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.medium,
  },
  
  // Text style using theme properties
  text: {
    color: theme.colors.primaryText,
    ...theme.typography.default,
  },
  
  // Button style using theme properties
  button: {
    backgroundColor: theme.colors.buttonBg,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
    borderWidth: 2,
    borderColor: theme.colors.accentRed,
    ...theme.shadows.small,
  },
  
  // Button text style using theme properties
  buttonText: {
    color: theme.colors.primaryText,
    ...theme.typography.defaultSemiBold,
  },
  
  // Card style using theme properties
  card: {
    backgroundColor: theme.colors.secondaryBg,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    ...theme.shadows.medium,
  },
  
  // Header style using theme properties
  header: {
    backgroundColor: theme.colors.primaryBg,
    padding: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  
  // Header title style using theme properties
  headerTitle: {
    color: theme.colors.accentRed,
    ...theme.typography.title,
  },
});

export default styles;

/**
 * Example of how to use these styles in a component:
 * 
 * import React from "react";
 * import { View, Text, TouchableOpacity } from "react-native";
 * import styles from "./ExampleStyles";
 * 
 * const ExampleComponent = () => {
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.text}>Welcome to Chef AI</Text>
 *       <TouchableOpacity style={styles.button}>
 *         <Text style={styles.buttonText}>Start Cooking</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * };
 * 
 * export default ExampleComponent;
 */