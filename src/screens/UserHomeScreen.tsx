import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Dimensions, ActivityIndicator, SafeAreaView
} from 'react-native';
import { supabase } from '../lib/supabase';
// Assuming we'll build a native ProductGrid later, we can inline it for now or import:
// import { ProductGrid } from '../components/ProductGrid';

const { width } = Dimensions.get('window');

type Product = any; // Will refine when building ProductGrid

export function UserHomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [heroContent, setHeroContent] = useState<any>({});
  const [featuredContent, setFeaturedContent] = useState<any>({});
  const [contactContent, setContactContent] = useState<any>({});
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: productsData },
          { data: contentRows },
        ] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_featured', true)
            .eq('is_archived', false)
            .limit(8),
          supabase
            .from('home_content')
            .select('id, data'),
        ]);

        if (productsData) setFeaturedProducts(productsData);
        
        // Build map
        const contentMap: Record<string, any> = {};
        for (const row of contentRows || []) {
          contentMap[row.id] = row.data;
        }

        setHeroContent(contentMap['hero'] || {});
        setFeaturedContent(contentMap['featured'] || {});
        setContactContent(contentMap['contact'] || {});
        
      } catch (e) {
        console.error('Home Page fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a403a" />
      </View>
    );
  }

  // Value fallbacks (Replicated directly from your Next.js page)
  const heroTitle = heroContent.title || 'Wabi-Sabi Aesthetics.';
  const heroSubtitle = heroContent.subtitle || 'Premium Japan Surplus – Philippines';
  const heroDescription = heroContent.description || "Discover authentic Japan surplus items at Jeany's Olshoppe. Handpicked for quality, minimalism, and quiet elegance — delivered anywhere in the Philippines.";
  const heroBtnText = heroContent.button_text || 'Explore Collection';
  const heroImage = heroContent.image_url || 'https://picsum.photos/seed/japandi-hero/1200/800';
  const heroQuote = heroContent.quote || 'Simplicity is the ultimate sophistication.';

  const featuredVisible = featuredContent.visible !== false;
  const featuredTitle = featuredContent.title || 'Selected Arrivals';
  const featuredSubtitle = featuredContent.subtitle || 'Pieces that bring calm to your space.';
  const viewAllText = featuredContent.view_all_text || 'View All Items';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Hero Section ─────────────────────────── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSubtitle}>{heroSubtitle.toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroDescription}>{heroDescription}</Text>
          
          <TouchableOpacity 
            style={styles.heroButton}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.8}
          >
            <Text style={styles.heroButtonText}>{heroBtnText.toUpperCase()}</Text>
            <Text style={styles.heroButtonIcon}>→</Text>
          </TouchableOpacity>

          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Native representation of the overlapping quote box */}
            {heroQuote && (
              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>"{heroQuote}"</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Featured Products Section ─────────────── */}
        {featuredVisible && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <View>
                <Text style={styles.featuredTitle}>{featuredTitle}</Text>
                <Text style={styles.featuredSubtitle}>{featuredSubtitle}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
                <Text style={styles.viewAllText}>{viewAllText.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* Inlined Native Product Grid Concept */}
            <View style={styles.productGrid}>
              {featuredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImagePlaceholder}>
                     <Image 
                        source={{ uri: product.image_url || 'https://picsum.photos/seed/placeholder/300/300' }} 
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productPrice}>₱{product.price}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Next.js background translation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // -- Hero --
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fb7185', // Accent color
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#333333', // Primary
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  heroDescription: {
    fontSize: 16,
    color: '#666666', // Foreground/70
    lineHeight: 26,
    marginBottom: 32,
    fontWeight: '500',
  },
  heroButton: {
    backgroundColor: '#333333', // Primary
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginRight: 10,
  },
  heroButtonIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroImageContainer: {
    width: '100%',
    aspectRatio: 4 / 5, // Mobile aspect ratio translation
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  quoteBox: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    backgroundColor: 'rgba(250, 249, 246, 0.9)', // Secondary/80 backdrop blur equivalent
    padding: 24,
    width: width * 0.6,
    borderTopRightRadius: 8,
  },
  quoteText: {
    fontStyle: 'italic',
    color: '#4a403a',
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },

  // -- Featured --
  featuredSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 20,
    marginBottom: 28,
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fb7185',
    letterSpacing: 1,
  },
  
  // -- Product Grid Placeholder --
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%', // 2-column layout
    marginBottom: 24,
  },
  productImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#666666',
  },
});
