import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface GenerationStep {
  id: number;
  title: string;
  description: string;
  details?: any;
  completed: boolean;
}

interface RecipeGenerationLoaderProps {
  currentStep: number;
  steps: GenerationStep[];
}

export default function RecipeGenerationLoader({ currentStep, steps }: RecipeGenerationLoaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  // Animation values
  const [logoRotation] = useState(new Animated.Value(0));
  const [logoScale] = useState(new Animated.Value(1));
  const [stepOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Continuous logo rotation animation
    const rotationAnimation = Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Logo pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotationAnimation.start();
    pulseAnimation.start();

    return () => {
      rotationAnimation.stop();
      pulseAnimation.stop();
    };
  }, [logoRotation, logoScale]);

  useEffect(() => {
    // Fade in animation for step changes
    stepOpacity.setValue(0);
    Animated.timing(stepOpacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [currentStep, stepOpacity]);

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentStepData = steps[currentStep] || steps[0];

  return (
    <ThemedView style={styles.container}>
      {/* ChefAI Logo with Animation */}
      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [
                { rotate: logoRotationInterpolate },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/chef-ai-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.tabIconDefault }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accent2,
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.progressText}>
          Step {currentStep + 1} of {steps.length}
        </ThemedText>
      </View>

      {/* Current Step Information */}
      <Animated.View style={[styles.stepContainer, { opacity: stepOpacity }]}>
        <ThemedText type="subtitle" style={[styles.stepTitle, { color: colors.accent1 }]}>
          {currentStepData.title}
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.text }]}>
          {currentStepData.description}
        </ThemedText>
        
        {/* Step Details */}
        {currentStepData.details && (
          <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
            {typeof currentStepData.details === 'object' ? (
              Object.entries(currentStepData.details).map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <ThemedText style={[styles.detailKey, { color: colors.accent2 }]}>
                    {key}:
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {String(currentStepData.details)}
              </ThemedText>
            )}
          </View>
        )}
      </Animated.View>

      {/* Steps List */}
      <View style={styles.stepsListContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View
              style={[
                styles.stepIndicator,
                {
                  backgroundColor: index <= currentStep ? colors.accent2 : colors.tabIconDefault,
                },
              ]}
            >
              {step.completed ? (
                <ThemedText style={[styles.checkmark, { color: colors.background }]}>✓</ThemedText>
              ) : (
                <ThemedText style={[styles.stepNumber, { color: colors.background }]}>
                  {index + 1}
                </ThemedText>
              )}
            </View>
            <ThemedText
              style={[
                styles.stepItemText,
                {
                  color: index <= currentStep ? colors.text : colors.tabIconDefault,
                  fontWeight: index === currentStep ? 'bold' : 'normal',
                },
              ]}
            >
              {step.title}
            </ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.7,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  detailsContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  detailKey: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  stepsListContainer: {
    width: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepItemText: {
    fontSize: 14,
    flex: 1,
  },
});