/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Colors are now imported from the centralized theme.ts file for consistent styling.
 */

import theme from './theme';

export const Colors = {
  light: {
    text: theme.colors.primaryText,
    background: theme.colors.secondaryBg,
    tint: theme.colors.accentRed,
    icon: theme.colors.accentRed,
    tabIconDefault: theme.colors.secondaryBg,
    tabIconSelected: theme.colors.accentRed,
    accent1: theme.colors.accentRed,
    accent2: theme.colors.accentBlue,
    accent3: theme.colors.secondaryBg,
  },
  dark: {
    text: theme.colors.primaryText,
    background: theme.colors.primaryBg,
    tint: theme.colors.accentRed,
    icon: theme.colors.accentRed,
    tabIconDefault: theme.colors.secondaryBg,
    tabIconSelected: theme.colors.accentRed,
    accent1: theme.colors.accentRed,
    accent2: theme.colors.accentBlue,
    accent3: theme.colors.primaryText,
  },
};
