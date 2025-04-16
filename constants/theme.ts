/**
 * Theme configuration for the ChefAI app
 * This file centralizes styling constants to make CSS edits more efficient
 * Changes here will affect styling throughout the app
 */

const theme = {
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
  },
  borderRadius: {
    small: 5,
    medium: 10,
    large: 20,
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
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
  },
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
  },
};

export default theme;