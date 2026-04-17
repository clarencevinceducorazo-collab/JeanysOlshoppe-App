import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  ActivityIndicator, Image, Dimensions, SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Clothes', 'Shoes', 'Bags', 'Accessories', 'Electronics', 'Others'];
const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];

export function ShopScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [condition, setCondition] = useState<string>('all');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (data) setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const isFiltering = searchTerm || category !== 'all' || condition !== 'all';
        if (isFiltering) {
          // Exclude sold out if any filter is active
          return p.stock_qty > 0;
        }
        return true;
      })
      .filter((p) =>
        searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
      )
      .filter((p) => (category !== 'all' ? p.category === category : true))
      .filter((p) => (condition !== 'all' ? p.condition === condition : true));
  }, [products, searchTerm, category, condition]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a403a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Shop All</Text>
          <Text style={styles.subtitle}>Find your next treasure from our full collection.</Text>
        </View>

        {/* Filters Sticky Wrapper */}
        <View style={styles.filtersWrapper}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer} contentContainerStyle={styles.pillsContent}>
            {/* Category Pills */}
            <TouchableOpacity
              style={[styles.pill, category === 'all' && styles.pillActive]}
              onPress={() => setCategory('all')}
            >
              <Text style={[styles.pillText, category === 'all' && styles.pillTextActive]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={`cat-${cat}`}
                style={[styles.pill, category === cat && styles.pillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.verticalDivider} />

            {/* Condition Pills */}
            <TouchableOpacity
              style={[styles.pill, condition === 'all' && styles.pillActive]}
              onPress={() => setCondition('all')}
            >
              <Text style={[styles.pillText, condition === 'all' && styles.pillTextActive]}>Any Condition</Text>
            </TouchableOpacity>
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={`cond-${cond}`}
                style={[styles.pill, condition === cond && styles.pillActive]}
                onPress={() => setCondition(cond)}
              >
                <Text style={[styles.pillText, condition === cond && styles.pillTextActive]}>{cond}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Grid */}
        <View style={styles.productGrid}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found matching your criteria.</Text>
            </View>
          ) : (
            filteredProducts.map((product) => {
              const coverImage = product.images?.[0] || 'https://picsum.photos/seed/placeholder/300/300';
              const isSoldOut = product.stock_qty === 0;
              
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ProductDetail', { id: product.id })}
                >
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: coverImage }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    {isSoldOut && (
                      <View style={styles.soldOutOverlay}>
                        <Text style={styles.soldOutText}>SOLD OUT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Wabi Sabi
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333333',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginTop: 8,
  },
  filtersWrapper: {
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
    paddingBottom: 16,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEAE5',
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    marginRight: 8,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#333333',
    fontSize: 15,
  },
  pillsContainer: {
    paddingHorizontal: 24,
  },
  pillsContent: {
    paddingRight: 48,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBEAE5',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#d1d5db',
    marginHorizontal: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 32,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EBEAE5',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  soldOutOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  productInfo: {
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fb7185', // Accent
  },
  emptyState: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
  },
});
