import React, { useState, useEffect, useMemo } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';
import { getAllProducts, formatMoney } from '../services/shopify';
import { ShopifyProduct } from '../services/types';

const styles = appStyles;
const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 2 columns with padding

const CATEGORIES = [
  { id: 'all', label: 'All', keywords: [] },
  { id: 'houseplants', label: 'Houseplants', keywords: ['houseplant', 'indoor', 'house plant'] },
  { id: 'outdoor', label: 'Outdoor', keywords: ['outdoor', 'garden', 'yard'] },
  { id: 'succulents', label: 'Succulents & Cacti', keywords: ['succulent', 'cacti', 'cactus'] },
  { id: 'herbs', label: 'Herbs & Edibles', keywords: ['herb', 'edible', 'vegetable', 'fruit'] },
  { id: 'lighting', label: 'Lighting', keywords: ['light', 'grow light', 'led', 'lamp'] },
  { id: 'hydroponics', label: 'Hydroponics', keywords: ['hydro', 'aerogarden', 'tower'] },
  { id: 'soil', label: 'Soil & Amendments', keywords: ['soil', 'fertilizer', 'compost', 'potting'] },
  { id: 'tools', label: 'Tools & Supplies', keywords: ['tool', 'pot', 'planter', 'spray'] },
];

export default function ShopScreen() {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const allProducts = await getAllProducts();
    setProducts(allProducts);
    setLoading(false);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      if (category) {
        filtered = products.filter((product) => {
          const searchText = `${product.title} ${product.description} ${product.productType} ${product.tags.join(' ')}`.toLowerCase();
          return category.keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
        });
      }
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((product) => {
        const searchText = `${product.title} ${product.description}`.toLowerCase();
        return searchText.includes(searchQuery.toLowerCase());
      });
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount));
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => Number(b.priceRange.minVariantPrice.amount) - Number(a.priceRange.minVariantPrice.amount));
    }

    return sorted;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const renderProduct = ({ item }: { item: ShopifyProduct }) => (
    <TouchableOpacity
      style={{
        width: itemWidth,
        marginBottom: 16,
        backgroundColor: palette.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
      }}
      onPress={() => {
        // TODO: Navigate to product detail
        console.log('Product tapped:', item.title);
      }}
    >
      {item.featuredImage ? (
        <Image
          source={{ uri: item.featuredImage.url }}
          style={{ width: '100%', height: itemWidth, backgroundColor: palette.surfaceMuted }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', height: itemWidth, backgroundColor: palette.surfaceMuted, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: palette.textMuted }}>No Image</Text>
        </View>
      )}
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4, color: palette.text }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 14, color: palette.primary, fontWeight: '700' }}>
          {formatMoney(item.priceRange.minVariantPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar />
      
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <TextInput
          style={{
            backgroundColor: palette.surface,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            borderWidth: 1,
            borderColor: palette.border,
            color: palette.text,
          }}
          placeholder="Search products..."
          placeholderTextColor={palette.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginRight: 8,
              borderRadius: 20,
              backgroundColor: selectedCategory === category.id ? palette.primary : palette.surface,
              borderWidth: 1,
              borderColor: selectedCategory === category.id ? palette.primary : palette.border,
            }}
          >
            <Text
              style={{
                color: selectedCategory === category.id ? '#fff' : palette.text,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {[
          { id: 'featured', label: 'Featured' },
          { id: 'price-asc', label: 'Price: Low to High' },
          { id: 'price-desc', label: 'Price: High to Low' },
        ].map((sort) => (
          <TouchableOpacity
            key={sort.id}
            onPress={() => setSortBy(sort.id as any)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8,
              borderRadius: 16,
              backgroundColor: sortBy === sort.id ? palette.accent : palette.surface,
              borderWidth: 1,
              borderColor: sortBy === sort.id ? palette.accent : palette.border,
            }}
          >
            <Text
              style={{
                color: sortBy === sort.id ? '#fff' : palette.text,
                fontSize: 12,
                fontWeight: sortBy === sort.id ? '600' : '400',
              }}
            >
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={{ fontSize: 14, marginTop: 12, color: palette.textMuted }}>
            Loading products...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: palette.textMuted }}>
                No products found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
