import { BlurView } from 'expo-blur';
import { StyleSheet, View, Text, Pressable, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getUserInitials } from '../utils/auth';
import { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '../utils/supabase';

export default function Header() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, login, register, isLoading, error, clearError } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);
      
      if (!connected) {
        console.warn('Supabase connection failed - some features may be limited');
      }
    };
    
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigateToSettings = () => {
    if (isAuthenticated) {
      router.push('/(tabs)/settings');
    } else {
      setModalVisible(true);
    }
  };
  
  const navigateToNotifications = () => {
    router.push('/(tabs)/notifications');
  };
  
  const navigateToDebugTools = () => {
    if (Platform.OS === 'web') {
      router.push('/scripts/fixUserCreation');
    } else {
      Alert.alert('Debug Tools', 'Debug tools are only available on web');
    }
  };

  const userInitials = getUserInitials(user);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    
    try {
      await login(email, password);
      setModalVisible(false);
      setEmail('');
      setPassword('');
      
      if (!isConnected) {
        Alert.alert(
          'Connection Issue',
          'There seems to be a problem connecting to the server. Some features may be limited.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error is handled in auth context
      console.error('Login error:', error);
    }
  };
  
  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (!isConnected) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please try again later when you have a better connection.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await register(email, password, firstName, lastName);
      setModalVisible(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    } catch (error) {
      // Error is handled in auth context
      console.error('Registration error:', error);
    }
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.content}>
          <Pressable 
            style={styles.profileButton} 
            onPress={navigateToSettings}
          >
            {isAuthenticated ? (
              <Text style={styles.userInitials}>{userInitials}</Text>
            ) : (
              <Ionicons name="person" size={24} color="#FFFFFF" />
            )}
          </Pressable>
          
          <View style={styles.actionButtons}>
            {Platform.OS === 'web' && (
              <Pressable 
                style={styles.debugButton} 
                onPress={navigateToDebugTools}
              >
                <Ionicons name="code-working" size={20} color="#1E3EA1" />
              </Pressable>
            )}
            
            <Pressable 
              style={styles.notificationButton} 
              onPress={navigateToNotifications}
            >
              <Ionicons name="notifications" size={24} color="#1E3EA1" />
              {!isConnected && (
                <View style={styles.connectionErrorBadge} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: insets.top + 50 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Radio 47</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#1E3EA1" />
              </Pressable>
            </View>
            
            {!isConnected && (
              <View style={styles.connectionWarning}>
                <Ionicons name="cloud-offline" size={20} color="#FF3B30" />
                <Text style={styles.connectionWarningText}>
                  Unable to connect to the server. Please check your connection.
                </Text>
              </View>
            )}
            
            <View style={styles.tabBar}>
              <Pressable 
                style={[styles.tab, activeTab === 'login' && styles.activeTab]} 
                onPress={() => { setActiveTab('login'); clearError(); }}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Login</Text>
              </Pressable>
              <Pressable 
                style={[styles.tab, activeTab === 'register' && styles.activeTab]} 
                onPress={() => { setActiveTab('register'); clearError(); }}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Register</Text>
              </Pressable>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {activeTab === 'login' ? (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Ionicons name="mail-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                
                <Pressable style={styles.actionButton} onPress={handleLogin} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>Login</Text>
                      <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
                
                <Text style={styles.hintText}>
                  Please create an account using the Register tab
                </Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.nameRow}>
                  <View style={[styles.inputGroup, styles.nameInput]}>
                    <Ionicons name="person-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, styles.nameInput]}>
                    <Ionicons name="person-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="mail-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                
                <Pressable 
                  style={styles.actionButton} 
                  onPress={handleRegister} 
                  disabled={isLoading || !isConnected}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>Register</Text>
                      <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  profileButton: {
    padding: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    padding: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFDE2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notificationButton: {
    padding: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  connectionErrorBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3EA1'
  },
  closeButton: {
    padding: 8
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectionWarningText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  activeTab: {
    borderBottomColor: '#1E3EA1',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#1E3EA1',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3EA1',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    marginTop: 16,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});