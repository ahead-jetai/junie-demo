import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const [ingredients, setIngredients] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleSubmit = () => {
    // Navigate to the recipe page with the ingredients as a parameter
    if (ingredients.trim()) {
      router.push({
        pathname: 'explore',
        params: { ingredients: ingredients.trim() }
      });
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ 
        light: colors.background, 
        dark: colors.background 
      }}
      headerImage={
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/chef-ai-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ color: colors.accent2 }}>Chef🤖AI</ThemedText>
      </ThemedView>

      <ThemedView style={styles.welcomeContainer}>
        <ThemedText style={[styles.welcomeText, { color: colors.text }]}>
          Welcome to ChefAI! {'\n'} Enter ingredients from your kitchen, and we'll create a delicious recipe for you.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <ThemedText type="subtitle" style={{ color: colors.tint }}>What's in your kitchen?</ThemedText>
        <TextInput
          style={[
            styles.input, 
            { 
              borderColor: colors.accent2,
              backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A',
              color: colors.text,
            }
          ]}
          placeholder="Enter ingredients (e.g., chicken, rice, tomatoes)"
          placeholderTextColor={colors.text}
          value={ingredients}
          onChangeText={setIngredients}
          multiline
        />
        <ThemedText style={[styles.hint, { color: colors.text }]}>
          List items from your refrigerator, pantry, or freezer.
        </ThemedText>

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { 
              backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A',
              borderColor: colors.accent2,
              borderWidth: 2,
              opacity: ingredients.trim() ? 1 : 0.5,
            }
          ]} 
          onPress={handleSubmit}
          disabled={!ingredients.trim()}
        >
          <ThemedText style={[styles.submitButtonText, { color: colors.accent2 }]}>Create Recipe</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    marginTop: 25
  },
  logoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 180,
    maxHeight: 180,
    borderRadius: '50%'

  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  welcomeContainer: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  inputContainer: {
    gap: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  hint: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: -8,
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    textShadow: '0 0 8px rgba(57, 255, 20, 0.7)',
  },
});
