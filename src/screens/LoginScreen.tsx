import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
  ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';

export function LoginScreen() {
  const { signIn, continueAsGuest } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    async function checkIntent() {
      try {
        const intent = await SecureStore.getItemAsync('intent_register_flag');
        if (intent === 'true') {
          setIsLogin(false);
          await SecureStore.deleteItemAsync('intent_register_flag');
        }
      } catch (e) {
        // ignore storage err
      }
    }
    checkIntent();
  }, []);

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setIsGettingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const geocodeArray = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      if (geocodeArray && geocodeArray.length > 0) {
         const geo = geocodeArray[0];
         setLocation(`${geo.city || geo.district || geo.subregion || ''}, ${geo.country || geo.isoCountryCode || ''}`.replace(/^,\s/, ''));
      } else {
         setLocation(`${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`);
      }
    } catch (e) {
      setError('Could not retrieve location. Please type it manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAuth = async () => {
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password.');
        return;
      }
      setLoading(true);
      setError('');
      
      const result = await signIn(email.trim(), password);
      if (result.error) setError(result.error);
      
      setLoading(false);
    } else {
      // Registration flow
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
        setError('Please fill out all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please try again.');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              location: location.trim(),
            }
          }
        });

        if (signupError) {
          setError(signupError.message);
        } else {
           // Successfully registered! In many Supabase configs, email confirmation is required.
           Alert.alert("Account Created", "Your account was successfully registered! You can now log in.", [
              { text: "OK", onPress: () => setIsLogin(true) }
           ]);
        }
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred during registration.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🛵</Text>
            </View>
            <Text style={styles.appName}>Jeany's Olshoppe</Text>
            <Text style={styles.appTagline}>{isLogin ? 'Login' : 'Create Account'}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            
            {/* Registration specific fields */}
            {!isLogin && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>FIRST NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Jane"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      editable={!loading}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>LAST NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Doe"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>LOCATION</Text>
                  <View style={styles.locationRow}>
                    <TextInput
                      style={[styles.input, styles.locationInput]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="City, Country"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      editable={!loading}
                    />
                    <TouchableOpacity 
                       style={styles.locationButton}
                       onPress={handleGetLocation}
                       disabled={isGettingLocation || loading}
                    >
                       {isGettingLocation ? (
                         <ActivityIndicator size="small" color="#ffffff" />
                       ) : (
                         <Text style={styles.locationButtonText}>📍</Text>
                       )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Email (Shared) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password (Shared) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.showHideButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showHideText}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                 <TextInput
                   style={[styles.input]}
                   value={confirmPassword}
                   onChangeText={setConfirmPassword}
                   placeholder="Enter your password again"
                   placeholderTextColor="rgba(255,255,255,0.2)"
                   secureTextEntry={!showPassword}
                   editable={!loading}
                 />
               </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{isLogin ? 'Log In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            {/* Guest Action */}
            {isLogin && (
              <TouchableOpacity
                style={styles.guestButton}
                onPress={continueAsGuest}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            )}

            {/* Toggle Modes */}
            <TouchableOpacity 
               style={styles.toggleModeButton}
               onPress={() => {
                 setIsLogin(!isLogin);
                 setError('');
               }}
            >
               <Text style={styles.toggleModeText}>
                 {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
               </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 60, // increased padding to ensure scrolling works fully for tall register form
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 113, 133, 0.12)', // Using accent color for brand connection
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formSection: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 56,
    fontSize: 16,
    color: '#ffffff',
  },
  locationRow: {
    flexDirection: 'row',
  },
  locationInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  locationButton: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: {
    fontSize: 20,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 70,
  },
  showHideButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showHideText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fb7185', // Accent color
    letterSpacing: 1.5,
  },
  errorBox: {
    backgroundColor: 'rgba(198, 40, 40, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef5350',
    fontSize: 13,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: '#fb7185', // Accent color
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#fb7185',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  guestButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  toggleModeButton: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleModeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});
