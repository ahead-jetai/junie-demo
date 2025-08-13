import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileMetrics, ProfileMetrics } from '@/services/profileMetricsService';
import { getAIAnalytics, getDailyActivityBreakdown, getRawMetadataEvents, AIAnalytics, MetadataWithRecipeDetails } from '@/services/supabaseService';
import CircularProgress from '@/components/CircularProgress';

// Export utility functions
const formatDataForExport = (data: MetadataWithRecipeDetails[]) => {
  return data.map(event => ({
    'Model': event.llm_model || 'Unknown',
    'LLM URL': event.llm_url || 'N/A',
    'Temperature': event.llm_temperature !== undefined ? event.llm_temperature.toString() : 'N/A',
    'Max Tokens': event.llm_max_tokens || 'N/A',
    'Input Tokens': event.prompt_tokens || 0,
    'Output Tokens': event.completion_tokens || 0,
    'Reasoning Tokens': event.reasoning_tokens || 0,
    'Cached Tokens': event.cached_tokens || 0,
    'Image Model': event.image_model || 'N/A',
    'LLM Response Time (ms)': event.llm_response_time_ms ? Math.round(event.llm_response_time_ms) : 'N/A',
    'Image Gen Time (ms)': event.image_generation_time_ms ? Math.round(event.image_generation_time_ms) : 'N/A',
    'Date': event.created_at ? new Date(event.created_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A',
    'Status': event.generation_success ? 'Success' : 'Failed',
    'Recipe Title': event.recipe?.title || 'No Recipe',
    'Ingredients Count': event.recipe?.ingredients?.length || 0,
    'Prep Time': event.recipe?.prep_time || 'N/A',
    'Cook Time': event.recipe?.cook_time || 'N/A',
    'Recipe Description': event.recipe?.description || '',
    'Ingredients': event.recipe?.ingredients?.join('; ') || '',
    'Instructions': event.recipe?.instructions?.join('; ') || ''
  }));
};

const exportToCSV = (data: MetadataWithRecipeDetails[], filename: string) => {
  const formattedData = formatDataForExport(data);
  const headers = Object.keys(formattedData[0] || {});
  const csvContent = [
    headers.join(','),
    ...formattedData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escape commas and quotes in CSV
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',')
    )
  ].join('\n');

  if (Platform.OS === 'web') {
    // Web platform - use download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Mobile platform - show alert with data (simplified approach)
    Alert.alert(
      'Export Ready',
      'CSV export is ready. In a full mobile implementation, this would save to device storage.',
      [{ text: 'OK' }]
    );
    console.log('CSV Content:', csvContent);
  }
};

const exportToPDF = (data: MetadataWithRecipeDetails[], filename: string) => {
  const formattedData = formatDataForExport(data);
  
  if (Platform.OS === 'web') {
    // Create a simple HTML table for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raw Events Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .title { color: #333; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1 class="title">ChefAI - Raw Generation Events Export</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              ${Object.keys(formattedData[0] || {}).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${formattedData.map(row => 
              `<tr>${Object.values(row).map(value => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  } else {
    // Mobile platform - show alert
    Alert.alert(
      'PDF Export',
      'PDF export is ready. In a full mobile implementation, this would generate and save a PDF file.',
      [{ text: 'OK' }]
    );
  }
};

// Function to get appropriate emoji for ingredient
const getIngredientEmoji = (ingredient: string): string => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Vegetables
  if (lowerIngredient.includes('carrot')) return '🥕';
  if (lowerIngredient.includes('tomato')) return '🍅';
  if (lowerIngredient.includes('onion')) return '🧅';
  if (lowerIngredient.includes('pepper') || lowerIngredient.includes('bell pepper')) return '🫑';
  if (lowerIngredient.includes('broccoli')) return '🥦';
  if (lowerIngredient.includes('corn')) return '🌽';
  if (lowerIngredient.includes('potato')) return '🥔';
  if (lowerIngredient.includes('mushroom')) return '🍄';
  if (lowerIngredient.includes('avocado')) return '🥑';
  if (lowerIngredient.includes('cucumber')) return '🥒';
  if (lowerIngredient.includes('eggplant')) return '🍆';
  if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('spinach') || lowerIngredient.includes('kale')) return '🥬';
  
  // Fruits
  if (lowerIngredient.includes('apple')) return '🍎';
  if (lowerIngredient.includes('banana')) return '🍌';
  if (lowerIngredient.includes('orange')) return '🍊';
  if (lowerIngredient.includes('lemon')) return '🍋';
  if (lowerIngredient.includes('lime')) return '🟢';
  if (lowerIngredient.includes('strawberry')) return '🍓';
  if (lowerIngredient.includes('grape')) return '🍇';
  if (lowerIngredient.includes('pineapple')) return '🍍';
  if (lowerIngredient.includes('peach')) return '🍑';
  if (lowerIngredient.includes('cherry')) return '🍒';
  
  // Proteins
  if (lowerIngredient.includes('chicken')) return '🐔';
  if (lowerIngredient.includes('beef') || lowerIngredient.includes('steak')) return '🥩';
  if (lowerIngredient.includes('pork') || lowerIngredient.includes('bacon') || lowerIngredient.includes('ham')) return '🥓';
  if (lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') || lowerIngredient.includes('tuna')) return '🐟';
  if (lowerIngredient.includes('shrimp') || lowerIngredient.includes('prawn')) return '🦐';
  if (lowerIngredient.includes('egg')) return '🥚';
  if (lowerIngredient.includes('tofu')) return '🧈';
  
  // Dairy
  if (lowerIngredient.includes('cheese')) return '🧀';
  if (lowerIngredient.includes('milk')) return '🥛';
  if (lowerIngredient.includes('butter')) return '🧈';
  if (lowerIngredient.includes('yogurt')) return '🥛';
  
  // Grains & Carbs
  if (lowerIngredient.includes('rice')) return '🍚';
  if (lowerIngredient.includes('pasta') || lowerIngredient.includes('noodle')) return '🍝';
  if (lowerIngredient.includes('bread')) return '🍞';
  if (lowerIngredient.includes('flour')) return '🌾';
  
  // Beans & Legumes
  if (lowerIngredient.includes('bean') || lowerIngredient.includes('lentil') || lowerIngredient.includes('chickpea')) return '🫘';
  
  // Herbs & Spices
  if (lowerIngredient.includes('garlic')) return '🧄';
  if (lowerIngredient.includes('ginger')) return '🫚';
  if (lowerIngredient.includes('chili') || lowerIngredient.includes('hot pepper')) return '🌶️';
  if (lowerIngredient.includes('herb') || lowerIngredient.includes('basil') || lowerIngredient.includes('parsley')) return '🌿';
  
  // Nuts & Seeds
  if (lowerIngredient.includes('nut') || lowerIngredient.includes('almond') || lowerIngredient.includes('walnut')) return '🥜';

  // Default fallback
  return '🥕';
};

export default function StatsScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipe' | 'analytics'>('recipe');
  const [analyticsData, setAnalyticsData] = useState<AIAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 7 | 30>(7);
  const [dailyActivity, setDailyActivity] = useState<Array<{date: string, recipes: number, favorites: number, views: number}>>([]);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'engagement' | 'rawEvents'>('engagement');
  const [rawMetadataEvents, setRawMetadataEvents] = useState<MetadataWithRecipeDetails[]>([]);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useFocusEffect(
    React.useCallback(() => {
      loadMetrics();
      if (activeTab === 'analytics') {
        loadAnalytics();
      }
    }, [activeTab, selectedPeriod])
  );

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      const profileMetrics = await getProfileMetrics();
      setMetrics(profileMetrics);
    } catch (error) {
      console.error('Error loading profile metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const [analytics, dailyData, rawMetadata] = await Promise.all([
        getAIAnalytics(selectedPeriod),
        getDailyActivityBreakdown(),
        getRawMetadataEvents(selectedPeriod, 50)
      ]);
      setAnalyticsData(analytics);
      setDailyActivity(dailyData);
      setRawMetadataEvents(rawMetadata);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleTabChange = (tab: 'recipe' | 'analytics') => {
    setActiveTab(tab);
    if (tab === 'analytics' && !analyticsData) {
      loadAnalytics();
    }
  };

  const handlePeriodChange = (period: 1 | 7 | 30) => {
    setSelectedPeriod(period);
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const success = await signOut();
      if (!success) {
        Alert.alert('Error', 'Failed to sign out');
      }
      // The AuthContext will handle navigation
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSigningOut(false);
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ color: colors.accent2 }}>Stats Dashboard</ThemedText>
      </ThemedView>

      {/* Tab Navigation */}
      <ThemedView style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipe' && styles.activeTab]}
          onPress={() => handleTabChange('recipe')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'recipe' && styles.activeTabText]}>
            Recipe Data
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => handleTabChange('analytics')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            AI Analytics
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'recipe' ? (
          // Recipe Data Tab Content
          metricsLoading ? (
            <ThemedView style={styles.loadingSection}>
              <ActivityIndicator size="large" color="#FF8C00" />
              <ThemedText style={styles.loadingText}>Loading your cooking stats...</ThemedText>
            </ThemedView>
          ) : (
            <>
              {/* Main Stats Section */}
              <ThemedView style={styles.mainStatsSection}>
                <CircularProgress
                  size={180}
                  strokeWidth={8}
                  progress={Math.min((metrics?.generatedRecipesCount || 0) / 100, 1)}
                  color="#FF8C00"
                  backgroundColor="#2A2A2A"
                  value={metrics?.generatedRecipesCount || 0}
                  label="RECIPES"
                  textColor="#F1FAEE"
                />
              </ThemedView>

              {/* Secondary Stats */}
              <ThemedView style={styles.secondaryStatsSection}>
                <ThemedView style={styles.statCard}>
                  <ThemedText style={styles.statValue}>{metrics?.favoritesCount || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>FAVORITES</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statCard}>
                  <ThemedText style={styles.statValue}>{metrics?.averagePrepTime || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>AVG PREP</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statCard}>
                  <ThemedText style={styles.statValue}>{Math.round((metrics?.totalCookingTime || 0) / 60)}</ThemedText>
                  <ThemedText style={styles.statLabel}>TOTAL HOURS</ThemedText>
                </ThemedView>
              </ThemedView>

              {/* Popular Ingredients Section */}
              {metrics?.mostFrequentIngredients && metrics.mostFrequentIngredients.length > 0 && (
                <ThemedView style={styles.popularSection}>
                  <ThemedText style={styles.sectionTitle}>Popular Ingredients</ThemedText>
                  <ThemedView style={styles.ingredientsGrid}>
                    {metrics.mostFrequentIngredients.slice(0, 4).map((ingredient, index) => (
                      <ThemedView key={ingredient} style={styles.ingredientCard}>
                        <ThemedView style={styles.ingredientIcon}>
                          <ThemedText style={styles.ingredientEmoji}>
                            {getIngredientEmoji(ingredient)}
                          </ThemedText>
                        </ThemedView>
                        <ThemedText style={styles.ingredientName} numberOfLines={2} ellipsizeMode="tail">
                          {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
                        </ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>
                </ThemedView>
              )}
            </>
          )
        ) : (
          // AI Analytics Tab Content
          <>
            {/* Time Period Selector */}
            <ThemedView style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 1 && styles.activePeriodButton]}
                onPress={() => handlePeriodChange(1)}
              >
                <ThemedText style={[styles.periodButtonText, selectedPeriod === 1 && styles.activePeriodButtonText]}>
                  1D
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 7 && styles.activePeriodButton]}
                onPress={() => handlePeriodChange(7)}
              >
                <ThemedText style={[styles.periodButtonText, selectedPeriod === 7 && styles.activePeriodButtonText]}>
                  7D
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 30 && styles.activePeriodButton]}
                onPress={() => handlePeriodChange(30)}
              >
                <ThemedText style={[styles.periodButtonText, selectedPeriod === 30 && styles.activePeriodButtonText]}>
                  30D
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {analyticsLoading ? (
              <ThemedView style={styles.loadingSection}>
                <ActivityIndicator size="large" color="#FF8C00" />
                <ThemedText style={styles.loadingText}>Loading analytics data...</ThemedText>
              </ThemedView>
            ) : (
              <>
                {/* Engagement Score */}
                <ThemedView style={styles.mainStatsSection}>
                  <CircularProgress
                    size={180}
                    strokeWidth={8}
                    progress={(analyticsData?.engagementScore || 0) / 100}
                    color="#FF8C00"
                    backgroundColor="#2A2A2A"
                    value={analyticsData?.engagementScore || 0}
                    label="ENGAGEMENT"
                    textColor="#F1FAEE"
                  />
                </ThemedView>

                {/* Analytics Stats */}
                <ThemedView style={styles.secondaryStatsSection}>
                  <ThemedView style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{analyticsData?.recipesGenerated || 0}</ThemedText>
                    <ThemedText style={styles.statLabel}>RECIPES</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{analyticsData?.favoritesAdded || 0}</ThemedText>
                    <ThemedText style={styles.statLabel}>FAVORITES</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.statCard}>
                    <ThemedText style={styles.statValue}>{analyticsData?.recentRecipeViews || 0}</ThemedText>
                    <ThemedText style={styles.statLabel}>VIEWS</ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Additional Analytics */}
                <ThemedView style={styles.analyticsSection}>
                  <ThemedView style={styles.analyticsCard}>
                    <ThemedText style={styles.analyticsLabel}>Most Active Day</ThemedText>
                    <ThemedText style={styles.analyticsValue}>{analyticsData?.mostActiveDay || 'No data'}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.analyticsCard}>
                    <ThemedText style={styles.analyticsLabel}>Avg Session (min)</ThemedText>
                    <ThemedText style={styles.analyticsValue}>{analyticsData?.averageSessionLength || 0}</ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Analytics Sub-Tab Navigation */}
                <ThemedView style={styles.subTabContainer}>
                  <TouchableOpacity
                    style={[styles.subTab, analyticsSubTab === 'engagement' && styles.activeSubTab]}
                    onPress={() => setAnalyticsSubTab('engagement')}
                  >
                    <ThemedText style={[styles.subTabText, analyticsSubTab === 'engagement' && styles.activeSubTabText]}>
                      Engagement
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.subTab, analyticsSubTab === 'rawEvents' && styles.activeSubTab]}
                    onPress={() => setAnalyticsSubTab('rawEvents')}
                  >
                    <ThemedText style={[styles.subTabText, analyticsSubTab === 'rawEvents' && styles.activeSubTabText]}>
                      Raw Events
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>

                {analyticsSubTab === 'engagement' ? (
                  <>
                    {/* Additional Analytics */}
                    <ThemedView style={styles.analyticsSection}>
                      <ThemedView style={styles.analyticsCard}>
                        <ThemedText style={styles.analyticsLabel}>Most Active Day</ThemedText>
                        <ThemedText style={styles.analyticsValue}>{analyticsData?.mostActiveDay || 'No data'}</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.analyticsCard}>
                        <ThemedText style={styles.analyticsLabel}>Avg Session (min)</ThemedText>
                        <ThemedText style={styles.analyticsValue}>{analyticsData?.averageSessionLength || 0}</ThemedText>
                      </ThemedView>
                    </ThemedView>

                    {/* Daily Activity Chart - Fixed overflow */}
                    {dailyActivity.length > 0 && (
                      <ThemedView style={styles.chartSection}>
                        <ThemedText style={styles.sectionTitle}>Daily Activity (Past 7 Days)</ThemedText>
                        <ThemedView style={styles.chartContainer}>
                          {dailyActivity.map((day, index) => {
                            const totalActivity = day.recipes + day.favorites + day.views;
                            const maxActivity = Math.max(...dailyActivity.map(d => d.recipes + d.favorites + d.views));
                            // Calculate height as percentage of container, max 70px to prevent overflow
                            const barHeight = maxActivity > 0 ? Math.max((totalActivity / maxActivity) * 70, 5) : 5;
                            
                            return (
                              <ThemedView key={day.date} style={styles.chartBar}>
                                <ThemedView style={styles.barContainer}>
                                  <ThemedView 
                                    style={[
                                      styles.bar, 
                                      { height: barHeight }
                                    ]} 
                                  />
                                </ThemedView>
                                <ThemedText style={styles.chartLabel}>
                                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </ThemedText>
                                <ThemedText style={styles.chartValue}>
                                  {totalActivity}
                                </ThemedText>
                              </ThemedView>
                            );
                          })}
                        </ThemedView>
                      </ThemedView>
                    )}
                  </>
                ) : (
                  /* Raw Events Tab Content */
                  <ThemedView style={styles.rawEventsSection}>
                    <ThemedText style={styles.sectionTitle}>Raw Generation Events</ThemedText>
                    <ThemedText style={styles.sectionSubtitle}>
                      Detailed metadata for recipe generation events (Last {selectedPeriod} day{selectedPeriod > 1 ? 's' : ''})
                    </ThemedText>
                    
                    {/* Export Buttons */}
                    {rawMetadataEvents.length > 0 && (
                      <ThemedView style={styles.exportButtonsContainer}>
                        <TouchableOpacity
                          style={styles.exportButton}
                          onPress={() => exportToCSV(rawMetadataEvents, `chefai-raw-events-${selectedPeriod}d.csv`)}
                        >
                          <ThemedText style={styles.exportButtonText}>Export CSV</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.exportButton}
                          onPress={() => exportToPDF(rawMetadataEvents, `chefai-raw-events-${selectedPeriod}d.pdf`)}
                        >
                          <ThemedText style={styles.exportButtonText}>Export PDF</ThemedText>
                        </TouchableOpacity>
                      </ThemedView>
                    )}
                    
                    {rawMetadataEvents.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.metadataTableContainer}>
                        <ThemedView style={styles.metadataTable}>
                          {/* Table Header */}
                          <ThemedView style={styles.metadataTableHeader}>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellModel]}>Model</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellUrl]}>LLM URL</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTemp]}>Temperature</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTokens]}>Max Tokens</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTokens]}>Input Tokens</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTokens]}>Output Tokens</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTokens]}>Reasoning Tokens</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTokens]}>Cached Tokens</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellModel]}>Image Model</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTime]}>LLM Response Time</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTime]}>Image Gen Time</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellDate]}>Date</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellStatus]}>Status</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellRecipeTitle]}>Recipe Title</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellIngredients]}>Ingredients</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTime]}>Prep Time</ThemedText>
                            <ThemedText style={[styles.metadataHeaderCell, styles.metadataHeaderCellTime]}>Cook Time</ThemedText>
                          </ThemedView>
                          
                          {/* Table Rows */}
                          {rawMetadataEvents.map((event, index) => (
                            <ThemedView key={event.id || index} style={[styles.metadataTableRow, index % 2 === 0 && styles.metadataTableRowEven]}>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellModel]} numberOfLines={1}>
                                {event.llm_model || 'Unknown'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellUrl]} numberOfLines={1}>
                                {event.llm_url || 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTemp]}>
                                {event.llm_temperature !== undefined ? event.llm_temperature.toString() : 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTokens]}>
                                {event.llm_max_tokens?.toLocaleString() || 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTokens]}>
                                {event.prompt_tokens?.toLocaleString() || '0'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTokens]}>
                                {event.completion_tokens?.toLocaleString() || '0'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTokens]}>
                                {event.reasoning_tokens?.toLocaleString() || '0'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTokens]}>
                                {event.cached_tokens?.toLocaleString() || '0'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellModel]} numberOfLines={1}>
                                {event.image_model || 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTime]}>
                                {event.llm_response_time_ms ? `${Math.round(event.llm_response_time_ms)}ms` : 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTime]}>
                                {event.image_generation_time_ms ? `${Math.round(event.image_generation_time_ms)}ms` : 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellDate]} numberOfLines={1}>
                                {event.created_at ? new Date(event.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellStatus, 
                                event.generation_success ? styles.metadataStatusSuccess : styles.metadataStatusError]}>
                                {event.generation_success ? '✓' : '✗'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellRecipeTitle]} numberOfLines={2}>
                                {event.recipe?.title || 'No Recipe'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellIngredients]}>
                                {event.recipe?.ingredients?.length || 0}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTime]}>
                                {event.recipe?.prep_time || 'N/A'}
                              </ThemedText>
                              <ThemedText style={[styles.metadataCell, styles.metadataHeaderCellTime]}>
                                {event.recipe?.cook_time || 'N/A'}
                              </ThemedText>
                            </ThemedView>
                          ))}
                        </ThemedView>
                      </ScrollView>
                    ) : (
                      <ThemedView style={styles.noDataContainer}>
                        <ThemedText style={styles.noDataText}>No generation events found for the selected period</ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                )}
              </>
            )}
          </>
        )}

        {/* Sign Out Button */}
        <ThemedView style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 57, 70, 0.3)',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF8C00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1FAEE',
    opacity: 0.7,
  },
  activeTabText: {
    opacity: 1,
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#FF8C00',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1FAEE',
    opacity: 0.7,
  },
  activePeriodButtonText: {
    opacity: 1,
    color: '#FFFFFF',
  },
  analyticsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  analyticsCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 12,
  },
  analyticsLabel: {
    fontSize: 11,
    color: '#F1FAEE',
    opacity: 0.7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F1FAEE',
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 30,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    height: 150,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    backgroundColor: '#FF8C00',
    borderRadius: 2,
    minHeight: 5,
  },
  chartLabel: {
    fontSize: 10,
    color: '#F1FAEE',
    opacity: 0.7,
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F1FAEE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    opacity: 0.7,
    color: '#F1FAEE',
    fontSize: 16,
  },
  mainStatsSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  secondaryStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1FAEE',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#F1FAEE',
    opacity: 0.7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  popularSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F1FAEE',
    marginBottom: 20,
    textAlign: 'center',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ingredientCard: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 15,
    minHeight: 90,
  },
  ingredientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientEmoji: {
    fontSize: 18,
  },
  ingredientName: {
    fontSize: 11,
    color: '#F1FAEE',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 14,
  },
  buttonSection: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  signOutButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    marginBottom: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Sub-tab styles
  subTabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 3,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSubTab: {
    backgroundColor: '#FF8C00',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1FAEE',
    opacity: 0.7,
  },
  activeSubTabText: {
    opacity: 1,
    color: '#FFFFFF',
  },
  // Raw Events styles
  rawEventsSection: {
    marginBottom: 30,
  },
  eventSummarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  eventCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  eventCardTitle: {
    fontSize: 10,
    color: '#F1FAEE',
    opacity: 0.7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 6,
  },
  eventCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventCardPeriod: {
    fontSize: 9,
    color: '#F1FAEE',
    opacity: 0.5,
    textAlign: 'center',
  },
  // Daily breakdown table styles
  dailyBreakdownSection: {
    marginTop: 20,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 5,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
  },
  tableRowEven: {
    backgroundColor: '#111111',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#F1FAEE',
    textAlign: 'center',
    fontWeight: '500',
  },
  tableCellDate: {
    flex: 1,
    fontSize: 13,
    color: '#F1FAEE',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Metadata table styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#F1FAEE',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  metadataTableContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 15,
  },
  metadataTable: {
    minWidth: 1800, // Ensure table is wide enough for all columns including additional metadata
  },
  metadataTableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C00',
    marginBottom: 5,
  },
  metadataHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  metadataHeaderCellRecipeTitle: {
    width: 180,
  },
  metadataHeaderCellIngredients: {
    width: 80,
  },
  metadataHeaderCellModel: {
    width: 120,
  },
  metadataHeaderCellUrl: {
    width: 150,
  },
  metadataHeaderCellTemp: {
    width: 80,
  },
  metadataHeaderCellTokens: {
    width: 80,
  },
  metadataHeaderCellTime: {
    width: 90,
  },
  metadataHeaderCellDate: {
    width: 100,
  },
  metadataHeaderCellStatus: {
    width: 60,
  },
  metadataTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 2,
  },
  metadataTableRowEven: {
    backgroundColor: '#111111',
  },
  metadataCell: {
    fontSize: 11,
    color: '#F1FAEE',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  metadataStatusSuccess: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  metadataStatusError: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#F1FAEE',
    opacity: 0.7,
    textAlign: 'center',
  },
  // Export buttons styles
  exportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  exportButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});