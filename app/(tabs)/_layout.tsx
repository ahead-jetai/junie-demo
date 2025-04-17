import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: 'rgba(230, 57, 70, 0.5)', // chefRed with opacity
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            // but set a dark background color as a fallback
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            position: 'absolute',
            borderTopWidth: 1,
            borderTopColor: 'rgba(230, 57, 70, 0.3)', // chefRed with opacity
            shadowColor: colors.tint,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
          },
          default: {
            backgroundColor: '#000000', // Dark background for non-iOS platforms
            borderTopWidth: 1,
            borderTopColor: 'rgba(230, 57, 70, 0.3)', // chefRed with opacity
            shadowColor: colors.tint,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ingredients',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="refrigerator.fill" 
              color={focused ? colors.accent1 : color} 
              style={focused ? {
                shadowColor: colors.accent1,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
              } : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Recipe',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="fork.knife" 
              color={focused ? colors.accent1 : color} 
              style={focused ? {
                shadowColor: colors.accent1,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
              } : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="myrecipes"
        options={{
          title: 'My Recipes',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="heart.fill" 
              color={focused ? colors.accent1 : color} 
              style={focused ? {
                shadowColor: colors.accent1,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
              } : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="person.fill" 
              color={focused ? colors.accent1 : color} 
              style={focused ? {
                shadowColor: colors.accent1,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 5,
              } : undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}
