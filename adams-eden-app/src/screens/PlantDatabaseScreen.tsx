import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Modal, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { ComprehensivePlant } from '../types/plants';
import comprehensivePlantDb from '../services/comprehensivePlantDb';

export default function PlantDatabaseScreen() {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [localResults, setLocalResults] = useState<ComprehensivePlant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<ComprehensivePlant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const categories = comprehensivePlantDb.getCategories();
  const stats = comprehensivePlantDb.getDatabaseStats();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search local database
  useEffect(() => {
    setIsLoading(true);
    
    const results = comprehensivePlantDb.searchPlants({
      query: debouncedQuery,
      category: selectedCategory || undefined,
      limit: 50
    });
    
    setLocalResults(results.plants);
    setIsLoading(false);
  }, [debouncedQuery, selectedCategory]);

  const handlePlantPress = (plant: ComprehensivePlant) => {
    setSelectedPlant(plant);
    setShowModal(true);
  };

  const handleSearchOnline = () => {
    Alert.alert(
      'Search Online',
      'Online plant search coming soon! This will search Trefle.io for plants not in our local database.',
      [{ text: 'OK' }]
    );
  };

  const renderPlantCard = ({ item }: { item: ComprehensivePlant }) => (
    <TouchableOpacity
      onPress={() => handlePlantPress(item)}
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: palette.border,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Plant Thumbnail */}
      {(() => {
        // Try to load local image if thumbnail is set
        if (item.thumbnail && !imageErrors.has(item.id)) {
          try {
            // Try loading local image from assets
            const imageMap: Record<string, any> = {
              'tomato.jpg': require('../../assets/images/plants/tomato.jpg'),
              'lettuce.jpg': require('../../assets/images/plants/lettuce.jpg'),
              'cucumber.jpg': require('../../assets/images/plants/cucumber.jpg'),
              'bell-pepper.jpg': require('../../assets/images/plants/bell-pepper.jpg'),
              'carrot.jpg': require('../../assets/images/plants/carrot.jpg'),
              'zucchini.jpg': require('../../assets/images/plants/zucchini.jpg'),
              'spinach.jpg': require('../../assets/images/plants/spinach.jpg'),
              'kale.jpg': require('../../assets/images/plants/kale.jpg'),
              'broccoli.jpg': require('../../assets/images/plants/broccoli.jpg'),
              'cauliflower.jpg': require('../../assets/images/plants/cauliflower.jpg'),
              'eggplant.jpg': require('../../assets/images/plants/eggplant.jpg'),
              'radish.jpg': require('../../assets/images/plants/radish.jpg'),
              'green-beans.jpg': require('../../assets/images/plants/green-beans.jpg'),
              'peas.jpg': require('../../assets/images/plants/peas.jpg'),
              'onion.jpg': require('../../assets/images/plants/onion.jpg'),
              'garlic.jpg': require('../../assets/images/plants/garlic.jpg'),
              'potato.jpg': require('../../assets/images/plants/potato.jpg'),
              'sweet-potato.jpg': require('../../assets/images/plants/sweet-potato.jpg'),
              'beet.jpg': require('../../assets/images/plants/beet.jpg'),
              'corn.jpg': require('../../assets/images/plants/corn.jpg'),
              'basil.jpg': require('../../assets/images/plants/basil.jpg'),
              'rosemary.jpg': require('../../assets/images/plants/rosemary.jpg'),
              'mint.jpg': require('../../assets/images/plants/mint.jpg'),
              'thyme.jpg': require('../../assets/images/plants/thyme.jpg'),
              'oregano.jpg': require('../../assets/images/plants/oregano.jpg'),
              'parsley.jpg': require('../../assets/images/plants/parsley.jpg'),
              'cilantro.jpg': require('../../assets/images/plants/cilantro.jpg'),
              'dill.jpg': require('../../assets/images/plants/dill.jpg'),
              'chives.jpg': require('../../assets/images/plants/chives.jpg'),
              'sage.jpg': require('../../assets/images/plants/sage.jpg'),
              'lavender.jpg': require('../../assets/images/plants/lavender.jpg'),
              'chamomile.jpg': require('../../assets/images/plants/chamomile.jpg'),
              'lemon-balm.jpg': require('../../assets/images/plants/lemon-balm.jpg'),
              'tarragon.jpg': require('../../assets/images/plants/tarragon.jpg'),
              'fennel.jpg': require('../../assets/images/plants/fennel.jpg'),
              'marigold.jpg': require('../../assets/images/plants/marigold.jpg'),
              'sunflower.jpg': require('../../assets/images/plants/sunflower.jpg'),
              'zinnia.jpg': require('../../assets/images/plants/zinnia.jpg'),
              'petunia.jpg': require('../../assets/images/plants/petunia.jpg'),
              'cosmos.jpg': require('../../assets/images/plants/cosmos.jpg'),
              'dahlia.jpg': require('../../assets/images/plants/dahlia.jpg'),
              'rose.jpg': require('../../assets/images/plants/rose.jpg'),
              'pansy.jpg': require('../../assets/images/plants/pansy.jpg'),
              'snapdragon.jpg': require('../../assets/images/plants/snapdragon.jpg'),
              'geranium.jpg': require('../../assets/images/plants/geranium.jpg'),
              'impatiens.jpg': require('../../assets/images/plants/impatiens.jpg'),
              'begonia.jpg': require('../../assets/images/plants/begonia.jpg'),
              'nasturtium.jpg': require('../../assets/images/plants/nasturtium.jpg'),
              'black-eyed-susan.jpg': require('../../assets/images/plants/black-eyed-susan.jpg'),
              'morning-glory.jpg': require('../../assets/images/plants/morning-glory.jpg'),
            };
            
            const imageSource = imageMap[item.thumbnail];
            if (imageSource) {
              return (
                <Image
                  source={imageSource}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    marginRight: 12,
                    backgroundColor: palette.surfaceMuted,
                  }}
                  resizeMode="cover"
                />
              );
            }
          } catch (error) {
            // Image doesn't exist, fall through to icon
          }
        }
        
        // Show icon fallback
        return (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: palette.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <MaterialCommunityIcons 
              name={item.category === 'Vegetables' ? 'food-apple' : item.category === 'Herbs' ? 'leaf' : 'flower'} 
              size={32} 
              color={palette.primary} 
            />
          </View>
        );
      })()}

      {/* Plant Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>
          {item.commonName}
        </Text>
        <Text style={{ fontSize: 13, color: palette.textMuted, marginTop: 2, fontStyle: 'italic' }}>
          {item.scientificName}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
          <View style={{ backgroundColor: palette.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>
              {item.category}
            </Text>
          </View>
          {item.edible && (
            <View style={{ backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>
                Edible
              </Text>
            </View>
          )}
          {item.care.sunlight && (
            <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>
                {item.care.sunlight === 'full_sun' ? '☀️ Full Sun' :
                 item.care.sunlight === 'partial_sun' ? '⛅ Partial Sun' :
                 item.care.sunlight === 'partial_shade' ? '🌤️ Part Shade' :
                 item.care.sunlight === 'full_shade' ? '☁️ Full Shade' :
                 String(item.care.sunlight).replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color={palette.textMuted} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (query.trim() && localResults.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <MaterialCommunityIcons name="magnify" size={64} color={palette.textMuted} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: palette.text, marginTop: 16 }}>
            No results in local database
          </Text>
          <Text style={{ fontSize: 14, color: palette.textMuted, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            We couldn't find "{query}" in our curated collection of {stats.totalPlants} plants.
          </Text>
          <TouchableOpacity
            onPress={handleSearchOnline}
            style={{
              marginTop: 24,
              backgroundColor: palette.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons name="cloud-search" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Search Online
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!query.trim()) {
      const popularPlants = comprehensivePlantDb.getPopularPlants(10);
      return (
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 12 }}>
            Popular Plants
          </Text>
          {popularPlants.map(plant => (
            <View key={plant.id}>
              {renderPlantCard({ item: plant })}
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <HeaderBar />
      
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: palette.text }}>
            Plant Database
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: palette.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: palette.border,
            alignItems: 'center',
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={palette.textMuted} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 16,
              color: palette.text,
            }}
            placeholder="Search plants..."
            placeholderTextColor={palette.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={palette.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <View style={{ marginBottom: 12, flexDirection: 'row' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory('')}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: !selectedCategory ? palette.primary : palette.surface,
                borderWidth: 1,
                borderColor: !selectedCategory ? palette.primary : palette.border,
                marginRight: 8,
              }}
            >
              <Text 
                style={{ 
                  color: !selectedCategory ? '#fff' : palette.text, 
                  fontWeight: '600',
                  fontSize: 15,
                }}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 24,
                  backgroundColor: selectedCategory === category ? palette.primary : palette.surface,
                  borderWidth: 1,
                  borderColor: selectedCategory === category ? palette.primary : palette.border,
                  marginRight: 8,
                }}
              >
                <Text 
                  style={{ 
                    color: selectedCategory === category ? '#fff' : palette.text, 
                    fontWeight: '600',
                    fontSize: 15,
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results List */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <FlatList
            data={localResults}
            renderItem={renderPlantCard}
            keyExtractor={item => item.id}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Plant Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
          <View style={{ flex: 1 }}>
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text }}>
                Plant Details
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={28} color={palette.text} />
              </TouchableOpacity>
            </View>

            {selectedPlant && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {/* Plant Image */}
                {(() => {
                  if (selectedPlant.thumbnail) {
                    try {
                      const imageMap: Record<string, any> = {
                        'tomato.jpg': require('../../assets/images/plants/tomato.jpg'),
                        'lettuce.jpg': require('../../assets/images/plants/lettuce.jpg'),
                        'cucumber.jpg': require('../../assets/images/plants/cucumber.jpg'),
                        'bell-pepper.jpg': require('../../assets/images/plants/bell-pepper.jpg'),
                        'carrot.jpg': require('../../assets/images/plants/carrot.jpg'),
                        'zucchini.jpg': require('../../assets/images/plants/zucchini.jpg'),
                        'spinach.jpg': require('../../assets/images/plants/spinach.jpg'),
                        'kale.jpg': require('../../assets/images/plants/kale.jpg'),
                        'broccoli.jpg': require('../../assets/images/plants/broccoli.jpg'),
                        'cauliflower.jpg': require('../../assets/images/plants/cauliflower.jpg'),
                        'eggplant.jpg': require('../../assets/images/plants/eggplant.jpg'),
                        'radish.jpg': require('../../assets/images/plants/radish.jpg'),
                        'green-beans.jpg': require('../../assets/images/plants/green-beans.jpg'),
                        'peas.jpg': require('../../assets/images/plants/peas.jpg'),
                        'onion.jpg': require('../../assets/images/plants/onion.jpg'),
                        'garlic.jpg': require('../../assets/images/plants/garlic.jpg'),
                        'potato.jpg': require('../../assets/images/plants/potato.jpg'),
                        'sweet-potato.jpg': require('../../assets/images/plants/sweet-potato.jpg'),
                        'beet.jpg': require('../../assets/images/plants/beet.jpg'),
                        'corn.jpg': require('../../assets/images/plants/corn.jpg'),
                        'basil.jpg': require('../../assets/images/plants/basil.jpg'),
                        'rosemary.jpg': require('../../assets/images/plants/rosemary.jpg'),
                        'mint.jpg': require('../../assets/images/plants/mint.jpg'),
                        'thyme.jpg': require('../../assets/images/plants/thyme.jpg'),
                        'oregano.jpg': require('../../assets/images/plants/oregano.jpg'),
                        'parsley.jpg': require('../../assets/images/plants/parsley.jpg'),
                        'cilantro.jpg': require('../../assets/images/plants/cilantro.jpg'),
                        'dill.jpg': require('../../assets/images/plants/dill.jpg'),
                        'chives.jpg': require('../../assets/images/plants/chives.jpg'),
                        'sage.jpg': require('../../assets/images/plants/sage.jpg'),
                        'lavender.jpg': require('../../assets/images/plants/lavender.jpg'),
                        'chamomile.jpg': require('../../assets/images/plants/chamomile.jpg'),
                        'lemon-balm.jpg': require('../../assets/images/plants/lemon-balm.jpg'),
                        'tarragon.jpg': require('../../assets/images/plants/tarragon.jpg'),
                        'fennel.jpg': require('../../assets/images/plants/fennel.jpg'),
                        'marigold.jpg': require('../../assets/images/plants/marigold.jpg'),
                        'sunflower.jpg': require('../../assets/images/plants/sunflower.jpg'),
                        'zinnia.jpg': require('../../assets/images/plants/zinnia.jpg'),
                        'petunia.jpg': require('../../assets/images/plants/petunia.jpg'),
                        'cosmos.jpg': require('../../assets/images/plants/cosmos.jpg'),
                        'dahlia.jpg': require('../../assets/images/plants/dahlia.jpg'),
                        'rose.jpg': require('../../assets/images/plants/rose.jpg'),
                        'pansy.jpg': require('../../assets/images/plants/pansy.jpg'),
                        'snapdragon.jpg': require('../../assets/images/plants/snapdragon.jpg'),
                        'geranium.jpg': require('../../assets/images/plants/geranium.jpg'),
                        'impatiens.jpg': require('../../assets/images/plants/impatiens.jpg'),
                        'begonia.jpg': require('../../assets/images/plants/begonia.jpg'),
                        'nasturtium.jpg': require('../../assets/images/plants/nasturtium.jpg'),
                        'black-eyed-susan.jpg': require('../../assets/images/plants/black-eyed-susan.jpg'),
                        'morning-glory.jpg': require('../../assets/images/plants/morning-glory.jpg'),
                      };
                      
                      const imageSource = imageMap[selectedPlant.thumbnail];
                      if (imageSource) {
                        return (
                          <Image
                            source={imageSource}
                            style={{
                              width: '100%',
                              height: 250,
                              borderRadius: 16,
                              marginBottom: 20,
                              backgroundColor: palette.surfaceMuted,
                            }}
                            resizeMode="cover"
                          />
                        );
                      }
                    } catch (error) {
                      // Image doesn't exist, show nothing (will show plant name below)
                    }
                  }
                  return null;
                })()}

                {/* Plant Header */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: palette.text, textAlign: 'center' }}>
                    {selectedPlant.commonName}
                  </Text>
                  <Text style={{ fontSize: 16, color: palette.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                    {selectedPlant.scientificName}
                  </Text>
                  <Text style={{ fontSize: 14, color: palette.textMuted, marginTop: 2 }}>
                    {selectedPlant.family} • {selectedPlant.genus}
                  </Text>
                </View>

                {/* Quick Info Tags */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  <View style={{ backgroundColor: palette.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{selectedPlant.category}</Text>
                  </View>
                  {selectedPlant.type && (
                    <View style={{ backgroundColor: palette.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{selectedPlant.type}</Text>
                    </View>
                  )}
                  {selectedPlant.edible && (
                    <View style={{ backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Edible</Text>
                    </View>
                  )}
                  {selectedPlant.toxic && (
                    <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Toxic</Text>
                    </View>
                  )}
                </View>

                {/* Care Information */}
                <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 12 }}>
                    Care Instructions
                  </Text>
                  
                  <InfoRow icon="water" label="Watering" value={selectedPlant.care.watering} palette={palette} />
                  <InfoRow icon="white-balance-sunny" label="Sunlight" value={selectedPlant.care.sunlight.replace(/_/g, ' ')} palette={palette} />
                  {selectedPlant.care.hardiness.min && selectedPlant.care.hardiness.max && (
                    <InfoRow icon="thermometer" label="Hardiness Zones" value={`${selectedPlant.care.hardiness.min}-${selectedPlant.care.hardiness.max}`} palette={palette} />
                  )}
                  {selectedPlant.care.soilType.length > 0 && (
                    <InfoRow icon="shovel" label="Soil Type" value={selectedPlant.care.soilType.join(', ')} palette={palette} />
                  )}
                  {selectedPlant.care.fertilizer && (
                    <InfoRow icon="flask" label="Fertilizer" value={selectedPlant.care.fertilizer} palette={palette} multiline />
                  )}
                  {selectedPlant.care.spacing && (
                    <InfoRow icon="arrow-expand-horizontal" label="Spacing" value={selectedPlant.care.spacing} palette={palette} />
                  )}
                  {selectedPlant.care.depth && (
                    <InfoRow icon="arrow-down" label="Planting Depth" value={selectedPlant.care.depth} palette={palette} />
                  )}
                </View>

                {/* Growth Information */}
                <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 12 }}>
                    Growth Information
                  </Text>
                  
                  {selectedPlant.daysToMaturity && (
                    <InfoRow icon="calendar-clock" label="Days to Maturity" value={`${selectedPlant.daysToMaturity} days`} palette={palette} />
                  )}
                  <InfoRow icon="speedometer" label="Growth Rate" value={selectedPlant.growthRate} palette={palette} />
                  {selectedPlant.height.min && selectedPlant.height.max && (
                    <InfoRow icon="arrow-up-down" label="Height" value={`${selectedPlant.height.min}-${selectedPlant.height.max} ${selectedPlant.height.unit}`} palette={palette} />
                  )}
                  {selectedPlant.harvestTime.length > 0 && (
                    <InfoRow icon="basket" label="Harvest Time" value={selectedPlant.harvestTime.join(', ')} palette={palette} />
                  )}
                  {selectedPlant.bloomTime.length > 0 && (
                    <InfoRow icon="flower" label="Bloom Time" value={selectedPlant.bloomTime.join(', ')} palette={palette} />
                  )}
                </View>

                {/* Companion Planting */}
                {selectedPlant.companionPlants.length > 0 && (
                  <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 12 }}>
                      Companion Plants
                    </Text>
                    <Text style={{ color: palette.text, lineHeight: 22 }}>
                      Plant with: <Text style={{ fontWeight: '600', color: palette.primary }}>
                        {selectedPlant.companionPlants.join(', ')}
                      </Text>
                    </Text>
                  </View>
                )}

                {/* Avoid Plants */}
                {selectedPlant.avoidPlants && selectedPlant.avoidPlants.length > 0 && (
                  <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 12 }}>
                      Avoid Planting With
                    </Text>
                    <Text style={{ color: palette.text, lineHeight: 22 }}>
                      Don't plant with: <Text style={{ fontWeight: '600', color: '#dc2626' }}>
                        {selectedPlant.avoidPlants.join(', ')}
                      </Text>
                    </Text>
                  </View>
                )}

                {/* Pests & Diseases */}
                {(selectedPlant.pests && selectedPlant.pests.length > 0) || (selectedPlant.diseases && selectedPlant.diseases.length > 0) && (
                  <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 12 }}>
                      Common Issues
                    </Text>
                    {selectedPlant.pests && selectedPlant.pests.length > 0 && (
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ color: palette.textMuted, fontSize: 14, marginBottom: 4 }}>Pests:</Text>
                        <Text style={{ color: palette.text }}>{selectedPlant.pests.join(', ')}</Text>
                      </View>
                    )}
                    {selectedPlant.diseases && selectedPlant.diseases.length > 0 && (
                      <View>
                        <Text style={{ color: palette.textMuted, fontSize: 14, marginBottom: 4 }}>Diseases:</Text>
                        <Text style={{ color: palette.text }}>{selectedPlant.diseases.join(', ')}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Attracts */}
                {selectedPlant.attracts.length > 0 && (
                  <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 8 }}>
                      Attracts: {selectedPlant.attracts.join(', ')}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Helper component for info rows
function InfoRow({ icon, label, value, palette, multiline = false }: { 
  icon: string; 
  label: string; 
  value: string; 
  palette: any;
  multiline?: boolean;
}) {
  return (
    <View style={{ flexDirection: multiline ? 'column' : 'row', marginBottom: 12, alignItems: multiline ? 'flex-start' : 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: multiline ? undefined : 150 }}>
        <MaterialCommunityIcons name={icon as any} size={18} color={palette.primary} />
        <Text style={{ marginLeft: 8, fontSize: 14, color: palette.textMuted }}>
          {label}:
        </Text>
      </View>
      <Text style={{ 
        fontSize: 14, 
        color: palette.text, 
        fontWeight: '600',
        flex: 1,
        marginTop: multiline ? 4 : 0,
        textTransform: 'capitalize'
      }}>
        {value}
      </Text>
    </View>
  );
}
