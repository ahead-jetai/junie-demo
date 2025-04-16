import React from 'react';
import { Modal, View, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Recipe } from '@/services/llmService';

interface RecipeModalProps {
  recipe: Recipe | null;
  visible: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}

export default function RecipeModal({ recipe, visible, isFavorite, onClose, onToggleFavorite }: RecipeModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!recipe) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#1A1A1A' }]}>
          <ScrollView style={styles.modalScrollView}>
            <Image source={{ uri: recipe.image }} style={styles.modalImage} />
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="title" style={{ color: colors.accent1 }}>{recipe.title}</ThemedText>
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={onToggleFavorite}
              >
                <IconSymbol 
                  size={24} 
                  name={isFavorite ? "heart.fill" : "heart"} 
                  color={colors.accent1} 
                />
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.descriptionContainer}>
              <ThemedText style={styles.description}>{recipe.description}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.timeContainer}>
              <View style={styles.timeItem}>
                <IconSymbol size={24} name="clock" color={colors.accent2} />
                <ThemedText style={styles.timeText}>Prep: {recipe.prepTime}</ThemedText>
              </View>
              <View style={styles.timeItem}>
                <IconSymbol size={24} name="flame" color={colors.accent2} />
                <ThemedText style={styles.timeText}>Cook: {recipe.cookTime}</ThemedText>
              </View>
            </ThemedView>

            <ThemedView style={styles.sectionContainer}>
              <ThemedText type="subtitle" style={{ color: colors.tint }}>Ingredients</ThemedText>
              {recipe.ingredients.map((ingredient: string, index: number) => (
                <ThemedView key={index} style={styles.ingredientItem}>
                  <IconSymbol size={16} name="circle.fill" color={colors.accent2} style={styles.bulletPoint} />
                  <ThemedText style={styles.ingredientText}>{ingredient}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.sectionContainer}>
              <ThemedText type="subtitle" style={{ color: colors.tint }}>Instructions</ThemedText>
              {recipe.instructions.map((instruction: string, index: number) => (
                <ThemedView key={index} style={styles.instructionItem}>
                  <ThemedText style={[styles.instructionNumber, { color: colors.accent1 }]}>{index + 1}</ThemedText>
                  <ThemedText style={styles.instructionText}>{instruction}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.closeButton, { borderColor: colors.accent2 }]} 
            onPress={onClose}
          >
            <ThemedText style={{ color: colors.accent2 }}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalScrollView: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)',
  },
  favoriteButton: {
    padding: 8,
  },
  descriptionContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
    gap: 16,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(230, 57, 70, 0.5)',
  },
  bulletPoint: {
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)',
  },
  instructionNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    width: 30,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  closeButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
  },
});