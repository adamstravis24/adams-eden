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
  Dimensions,
  Modal,
  Alert,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';
import { getAllProducts, formatMoney, createCartCheckoutUrl, getProductUrl, isShopifyConfigured } from '../services/shopify';
import { ShopifyProduct } from '../services/types';
import * as WebBrowser from 'expo-web-browser';

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
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const firstAvailable = selectedProduct.variants.find((variant) => variant.availableForSale) ?? selectedProduct.variants[0] ?? null;
      setSelectedVariantId(firstAvailable?.id ?? null);
    } else {
      setSelectedVariantId(null);
    }
  }, [selectedProduct]);

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

  const selectedVariant = useMemo(() => {
    if (!selectedProduct || !selectedVariantId) return null;
    return selectedProduct.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  }, [selectedProduct, selectedVariantId]);

  const productPriceLabel = useMemo(() => {
    if (!selectedProduct) return '';
    if (selectedVariant) {
      return formatMoney(selectedVariant.price);
    }
    const min = formatMoney(selectedProduct.priceRange.minVariantPrice);
    const max = formatMoney(selectedProduct.priceRange.maxVariantPrice);
    return min === max ? min : `${min} - ${max}`;
  }, [selectedProduct, selectedVariant]);

  const closeProductModal = () => {
    setSelectedProduct(null);
    setBuyNowLoading(false);
  };

  const handleBuyNow = async () => {
    if (!selectedProduct || !selectedVariant) {
      return;
    }
    if (!selectedVariant.availableForSale) {
      Alert.alert('Out of stock', 'This variant is currently unavailable.');
      return;
    }
    setBuyNowLoading(true);
    try {
      const checkoutUrl = await createCartCheckoutUrl([
        { merchandiseId: selectedVariant.id, quantity: 1 },
      ]);
      setBuyNowLoading(false);
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (error) {
      setBuyNowLoading(false);
      const message = error instanceof Error ? error.message : 'Unable to start checkout right now.';
      Alert.alert('Checkout unavailable', message);
    }
  };

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
      onPress={() => setSelectedProduct(item)}
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

  const listHeader = (
    <View>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
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

      {!isShopifyConfigured && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 12, color: palette.textMuted }}>
            Shopify credentials are not configured. Set EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN and
            EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN to enable the shop.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar />
      {loading ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={{ fontSize: 14, marginTop: 12, color: palette.textMuted }}>
            Loading products...
          </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={listHeader}
          ListHeaderComponentStyle={{ marginBottom: 8 }}
          ListEmptyComponent={
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: palette.textMuted }}>
                No products found
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        transparent
        onRequestClose={closeProductModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
          onPress={closeProductModal}
        >
          <Pressable
            style={{
              maxHeight: '90%',
              backgroundColor: palette.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 24,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedProduct && (
              <>
                <View style={{ alignItems: 'center', padding: 16 }}>
                  <View style={{ width: 56, height: 5, borderRadius: 3, backgroundColor: palette.border, marginBottom: 16 }} />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: palette.text, textAlign: 'center', marginBottom: 6 }}>
                    {selectedProduct.title}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: palette.primary }}>
                    {productPriceLabel}
                  </Text>
                </View>

                <ScrollView
                  style={{ paddingHorizontal: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedProduct.featuredImage ? (
                    <Image
                      source={{ uri: selectedProduct.featuredImage.url }}
                      style={{
                        width: '100%',
                        height: width * 0.7,
                        borderRadius: 12,
                        marginBottom: 16,
                        backgroundColor: palette.surfaceMuted,
                      }}
                      resizeMode="cover"
                    />
                  ) : null}

                  {selectedProduct.variants.length > 1 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: palette.text }}>
                        Select option
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedProduct.variants.map((variant) => {
                          const selected = variant.id === selectedVariantId;
                          const disabled = !variant.availableForSale;
                          return (
                            <TouchableOpacity
                              key={variant.id}
                              onPress={() => !disabled && setSelectedVariantId(variant.id)}
                              style={{
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                marginRight: 8,
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: selected ? palette.primary : palette.border,
                                backgroundColor: selected ? palette.primary : palette.surface,
                                opacity: disabled ? 0.5 : 1,
                              }}
                              disabled={disabled}
                            >
                              <Text
                                style={{
                                  color: selected ? '#fff' : palette.text,
                                  fontWeight: '600',
                                }}
                              >
                                {variant.title}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text, marginBottom: 8 }}>
                      Description
                    </Text>
                    <Text style={{ fontSize: 14, color: palette.textMuted, lineHeight: 20 }}>
                      {selectedProduct.description || 'No description provided.'}
                    </Text>
                  </View>
                </ScrollView>

                <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: palette.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                      marginBottom: 12,
                      opacity: buyNowLoading ? 0.7 : 1,
                    }}
                    onPress={handleBuyNow}
                    disabled={buyNowLoading || !selectedVariant || !selectedVariant.availableForSale}
                  >
                    {buyNowLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                        {selectedVariant?.availableForSale === false ? 'Unavailable' : 'Buy Now'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {selectedProduct && getProductUrl(selectedProduct.handle) ? (
                    <TouchableOpacity
                      style={{
                        paddingVertical: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: palette.border,
                        alignItems: 'center',
                      }}
                      onPress={async () => {
                        const url = getProductUrl(selectedProduct.handle);
                        if (url) {
                          await WebBrowser.openBrowserAsync(url);
                        }
                      }}
                    >
                      <Text style={{ color: palette.text, fontWeight: '600' }}>View product page</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={{ paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                    onPress={closeProductModal}
                  >
                    <Text style={{ color: palette.textMuted, fontWeight: '600' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
