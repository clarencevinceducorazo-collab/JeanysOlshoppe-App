import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export function MeScreen() {
  const { userProfile, role, isGuest, logout } = useAuth();
  const navigation = useNavigation<any>();

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isLoggedIn = !isGuest && userProfile;

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.guestAvatarPlaceholder}>
            <Text style={styles.guestAvatarIcon}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome!</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to save your wishlist, track your favorite Japan surplus finds, and more.
          </Text>

          <View style={styles.loginButtonGroup}>
            <TouchableOpacity 
              style={styles.facebookLoginButton}
            >
              <Text style={styles.facebookButtonText}>f  Continue with Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.emailLoginButton}
              onPress={async () => {
                 await SecureStore.setItemAsync('intent_register_flag', 'true');
                 logout(); 
              }}
            >
              <Text style={styles.emailButtonText}>✉️  Continue with Email</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.privacyText}>
            By signing in you agree to our Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Logged In Render
  const name = userProfile?.full_name || 'User';
  const initials = name.slice(0, 2).toUpperCase();
  const avatar = userProfile?.avatar_url;
  const joinDate = userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Recently';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Hero profile banner ── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                 <Text style={styles.avatarFallbackText}>{initials}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.profileName}>{name}</Text>
          {userProfile?.phone && <Text style={styles.profileMeta}>{userProfile.phone}</Text>}

          {isAdmin && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeIcon}>🛡️</Text>
              <Text style={styles.roleBadgeText}>{role?.replace('_', ' ').toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.joinDateText}>Member since {joinDate}</Text>
        </View>

        {/* ── Menu Items ── */}
        <View style={styles.menuContainer}>
          <View style={styles.menuCard}>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Saved')}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(251, 113, 133, 0.1)' }]}>
                <Text style={styles.menuIconText}>🤍</Text>
              </View>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>My Wishlist</Text>
                <Text style={styles.menuItemSubtitle}>View your saved items</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Shop')}>
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={styles.menuIconText}>🛍️</Text>
              </View>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Browse Shop</Text>
                <Text style={styles.menuItemSubtitle}>Discover Japan surplus finds</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#f3f4f6' }]}>
                <Text style={styles.menuIconText}>📄</Text>
              </View>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Privacy Policy</Text>
                <Text style={styles.menuItemSubtitle}>Read our privacy information</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {isAdmin && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Admin')}>
                  <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(251, 113, 133, 0.1)' }]}>
                    <Text style={styles.menuIconText}>⚙️</Text>
                  </View>
                  <View style={styles.menuItemTextContainer}>
                    <Text style={styles.menuItemTitle}>Admin Panel</Text>
                    <Text style={styles.menuItemSubtitle}>Manage users and inventory</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </>
            )}

          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={logout}>
             <Text style={styles.signOutIcon}>🚪</Text>
             <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>Jeany's Olshoppe · Japan Surplus Philippines</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  
  // -- Hero --
  heroSection: {
    backgroundColor: '#FAF9F6', // Using pure base since native gradients require external libs
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#FAF9F6',
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(251, 113, 133, 0.2)', // Accent/20
    borderWidth: 4,
    borderColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fb7185',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FAF9F6',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 2,
  },
  profileMeta: {
    fontSize: 14,
    color: '#666666',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
  },
  roleBadgeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  roleBadgeText: {
    color: '#fb7185',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  joinDateText: {
    fontSize: 11,
    color: '#999999',
    marginTop: 8,
  },

  // -- Menu --
  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEAE5',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
  chevron: {
    fontSize: 24,
    color: '#cccccc',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EBEAE5',
    marginLeft: 72, // Aligned with text
  },

  // -- Sign Out --
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  signOutIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  signOutText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 32,
  },

  // -- Guest View --
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  guestAvatarIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  guestTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginButtonGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  facebookLoginButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  facebookButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emailLoginButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBEAE5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
  },
});
