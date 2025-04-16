import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import theme from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'primary' | 'secondary';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'primary',
  ...otherProps 
}: ThemedViewProps) {
  // Use the theme-based background color if no specific colors are provided
  const defaultLight = variant === 'primary' ? theme.colors.primaryBg : theme.colors.secondaryBg;
  const defaultDark = variant === 'primary' ? theme.colors.primaryBg : theme.colors.secondaryBg;

  const backgroundColor = useThemeColor({ 
    light: lightColor || defaultLight, 
    dark: darkColor || defaultDark 
  }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
