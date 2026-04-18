import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  ActivityIndicator, Dimensions, Linking, Alert, SafeAreaView 
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          Alert.alert('Not Found', 'This product does not exist.');
          navigation.goBack();
          return;
        }
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    async function checkWishlist() {
      try {
        const savedData = await SecureStore.getItemAsync('wishlist');
        if (savedData) {
          const list: string[] = JSON.parse(savedData);
          if (list.includes(id)) {
            setIsSaved(true);
          }
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      }
    }

    fetchProduct();
    checkWishlist();
  }, [id, navigation]);

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a403a" />
      </View>
    );
  }

  const isNew = Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const isSoldOut = product.stock_qty === 0;

  const messageText = `Hi! I'm interested in this product:\n\nName: ${product.name}\nDescription: ${product.description}\nPrice: ₱${product.price.toFixed(2)}\n\nIs this still available?`;
  const encodedMessage = encodeURIComponent(messageText);
  const messengerLink = `https://m.me/100064110249756?ref=WebsiteVisitor&text=${encodedMessage}`;

  const handleMessengerClick = async () => {
    try {
      const supported = await Linking.canOpenURL(messengerLink);
      if (supported) {
        await Linking.openURL(messengerLink);
      } else {
        Alert.alert('Error', 'Messenger cannot be opened on this device.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWishlist = async () => {
    try {
      const savedData = await SecureStore.getItemAsync('wishlist');
      let list: string[] = savedData ? JSON.parse(savedData) : [];
      
      if (isSaved) {
        // Remove
        list = list.filter(item => item !== id);
        setIsSaved(false);
      } else {
        // Add
        if (!list.includes(id)) list.push(id);
        setIsSaved(true);
      }
      
      await SecureStore.setItemAsync('wishlist', JSON.stringify(list));
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      Alert.alert('Error', 'Could not update wishlist.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
           <Text style={styles.shareText}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Simple Image Horizontal Scroll (Native Carousel) */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {product.images?.map((img: string, index: number) => (
            <Image 
              key={index}
              source={{ uri: img }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ))}
          {(!product.images || product.images.length === 0) && (
            <View style={[styles.carouselImage, styles.placeholderImage]} />
          )}
        </ScrollView>

        {/* Product Info */}
        <View style={styles.contentSection}>
          <Text style={styles.title}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>₱{product.price.toFixed(2)}</Text>
            <View style={styles.badgeContainer}>
              {isSoldOut && (
                <View style={[styles.badge, styles.soldOutBadge]}>
                  <Text style={styles.badgeTextWhite}>SOLD OUT</Text>
                </View>
              )}
              {isNew && !isSoldOut && (
                <View style={[styles.badge, styles.newBadge]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          </View>

          {/* Details Section */}
          <Text style={styles.sectionHeader}>ℹ️ Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <Text style={styles.detailValue}>{product.condition}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={styles.detailValue}>{isSoldOut ? '0' : product.stock_qty}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Posted:</Text>
              <Text style={styles.detailValue}>{new Date(product.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

        </View>
      </ScrollView>

      {/* Fixed Product Actions Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.wishlistButton, isSoldOut && styles.disabledButton]} 
          disabled={isSoldOut}
          onPress={toggleWishlist}
        >
          <Text style={[styles.wishlistText, isSoldOut && styles.disabledText, isSaved && styles.savedWishlistText]}>
             {isSaved ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.messengerButton} 
          onPress={handleMessengerClick}
        >
          <Text style={styles.messengerText}>💬 Inquire via Messenger</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Standard Wabi Sabi background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF9F6',
  },
  backButton: { padding: 8 },
  backText: { fontSize: 24, color: '#333' },
  shareButton: { padding: 8 },
  shareText: { fontSize: 20 },
  
  scrollContent: {
    paddingBottom: 220, // Leave massive room for the high bottom bar
  },
  imageCarousel: {
    width: width,
    height: width * 0.8, // Make image slightly less tall to show more content
  },
  carouselImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: '#EBEAE5',
  },
  placeholderImage: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contentSection: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333333',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fb7185', // Accent color
    marginRight: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutBadge: {
    backgroundColor: '#ef4444', // Destructive red
  },
  badgeTextWhite: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#fb7185', // Accent
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
    marginTop: 28,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailRow: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: '700',
    color: '#333333',
    marginRight: 6,
    fontSize: 14,
  },
  detailValue: {
    color: '#666666',
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    color: '#4a403a',
    lineHeight: 26,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F6',
    padding: 16,
    paddingBottom: 32, // Accommodate iOS home bar
    borderTopWidth: 1,
    borderTopColor: '#EBEAE5',
    flexDirection: 'column',
    gap: 12,
  },
  wishlistButton: {
    borderWidth: 1,
    borderColor: '#EBEAE5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  wishlistText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  disabledButton: {
    opacity: 0.5,
  },
  savedWishlistText: {
    color: '#fb7185', // Accent color to show it's active
  },
  disabledText: {
    color: '#999999',
  },
  messengerButton: {
    backgroundColor: '#0084ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  messengerText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
