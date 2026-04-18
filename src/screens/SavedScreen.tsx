import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock_qty: number;
};

export function SavedScreen() {
  const navigation = useNavigation<any>();
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect makes it re-fetch every time the user navigates back to it
  useFocusEffect(
    useCallback(() => {
      async function fetchSavedItems() {
        setLoading(true);
        try {
          const savedData = await SecureStore.getItemAsync('wishlist');
          if (savedData) {
            const list: string[] = JSON.parse(savedData);
            if (list.length > 0) {
              const { data, error } = await supabase
                .from('products')
                .select('id, name, price, images, stock_qty')
                .in('id', list);
                
              if (data) setSavedProducts(data);
            } else {
              setSavedProducts([]);
            }
          } else {
             setSavedProducts([]);
          }
        } catch (err) {
          console.error('Error fetching saved items:', err);
        } finally {
          setLoading(false);
        }
      }
      
      fetchSavedItems();
    }, [])
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const mainImage = item.images && item.images.length > 0 ? item.images[0] : null;
    const isSoldOut = item.stock_qty === 0;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {mainImage ? (
             <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />
          ) : (
             <View style={[styles.image, styles.imagePlaceholder]} />
          )}
          {isSoldOut && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardPrice}>₱{item.price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Saved Items</Text>
        <View style={styles.placeholderSpace} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#fb7185" />
        </View>
      ) : savedProducts.length === 0 ? (
        // Empty State
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptyText}>
            You haven't saved any items yet. Start browsing the shop to add your favorite Japan surplus finds!
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.browseButtonText}>BROWSE SHOP</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Populated state mapped perfectly to original React component functionality
        <FlatList
          data={savedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#333333' },
  title: { fontSize: 18, fontWeight: '700', color: '#333333' },
  placeholderSpace: { width: 40 },
  
  loadingContainer: {
     flex: 1,
     alignItems: 'center',
     justifyContent: 'center',
  },
  
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, opacity: 0.5, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333333', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  browseButton: { backgroundColor: '#333333', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  browseButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  // Grid
  gridContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEAE5',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // 1:1 square
    backgroundColor: '#FAF9F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fb7185',
  },
});
