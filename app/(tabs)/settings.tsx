import { StyleSheet, View, Text, ScrollView, Pressable, Linking, TextInput, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import Animated, { 
  useSharedValue,
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { getUserInitials } from '../../utils/auth';

// FM Frequencies data
const fmFrequencies = [
  { location: 'Nairobi', frequency: '103.0 FM' },
  { location: 'Mombasa', frequency: '92.9 FM' },
  { location: 'Kisumu', frequency: '101.2 FM' },
  { location: 'Nakuru', frequency: '92.1 FM' },
  { location: 'Eldoret', frequency: '100.9 FM' },
  { location: 'Nyeri', frequency: '97.3 FM' },
  { location: 'Meru', frequency: '97.9 FM' },
  { location: 'Busia', frequency: '95.5 FM' },
  { location: 'Bomet', frequency: '93.4 FM' },
  { location: 'Garissa', frequency: '101.8 FM' },
  { location: 'Isiolo', frequency: '104.2 FM' },
  { location: 'Kakamega', frequency: '95.5 FM' },
  { location: 'Kapenguria', frequency: '95.5 FM' },
  { location: 'Kericho', frequency: '104.9 FM' },
  { location: 'Kisii', frequency: '99.9 FM' },
  { location: 'Kitale', frequency: '95.5 FM' },
  { location: 'Kitui', frequency: '89.0 FM' },
  { location: 'Laikipia', frequency: '92.1 FM' },
  { location: 'Lamu', frequency: '89.6 FM' },
  { location: 'Lodwar', frequency: '95.5 FM' },
  { location: 'Malindi', frequency: '92.9 FM' },
  { location: 'Mandera', frequency: '101.8 FM' },
  { location: 'Marsabit', frequency: '101.8 FM' },
  { location: 'Murang\'a', frequency: '97.3 FM' },
  { location: 'Naivasha', frequency: '92.1 FM' },
  { location: 'Narok', frequency: '93.4 FM' },
  { location: 'Samburu-Maralal', frequency: '92.1 FM' },
  { location: 'Voi (Taita-Taveta)', frequency: '95.7 FM' },
  { location: 'Webuye/Bungoma', frequency: '104.3 FM' },
];

// Animated section component
function SettingsSection({ title, icon, children, initiallyExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const rotation = useSharedValue(initiallyExpanded ? 180 : 0);
  const height = useSharedValue(initiallyExpanded ? 200 : 0);

  const toggleExpand = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    
    rotation.value = withSpring(newValue ? 180 : 0, { damping: 15 });
    height.value = withSpring(newValue ? 200 : 0, { damping: 15 });
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value === 0 ? 0 : 1,
  }));

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={toggleExpand}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={24} color="#1E3EA1" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Animated.View style={iconStyle}>
          <Ionicons name="chevron-down" size={24} color="#1E3EA1" />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.sectionContent, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

// User profile component
function UserProfile() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const userInitials = getUserInitials(user);
  
  return (
    <View style={[styles.profileContainer]}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
      </View>
      
      <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
      
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// Authentication forms
function AuthForms() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { login, register, isLoading, error, clearError } = useAuth();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      await login(email, password);
    } catch (error) {
      // Error is already handled in the auth context
    }
  };
  
  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      await register(email, password, firstName, lastName);
    } catch (error) {
      // Error is already handled in the auth context
    }
  };
  
  return (
    <View style={styles.authContainer}>
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
          
          <Pressable style={styles.actionButton} onPress={handleRegister} disabled={isLoading}>
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
  );
}

// Advertisement form component
function AdvertisementForm() {
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = async () => {
    if (!businessName || !contactEmail || !contactPhone || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setIsSending(true);
    
    // Create email body
    const emailBody = `
      Business Name: ${businessName}
      Contact Email: ${contactEmail}
      Contact Phone: ${contactPhone}
      
      Message:
      ${message}
    `;
    
    try {
      // For web, open mail client
      if (Platform.OS === 'web') {
        const mailtoLink = `mailto:capemedia.africa@gmail.com?subject=Advertising%20Inquiry%20from%20${encodeURIComponent(businessName)}&body=${encodeURIComponent(emailBody)}`;
        await Linking.openURL(mailtoLink);
        Alert.alert('Email client opened', 'Please send the pre-filled email to submit your advertisement request.');
      } else {
        // For mobile
        const canOpenMail = await Linking.canOpenURL('mailto:capemedia.africa@gmail.com');
        if (canOpenMail) {
          const mailtoLink = `mailto:capemedia.africa@gmail.com?subject=Advertising%20Inquiry%20from%20${encodeURIComponent(businessName)}&body=${encodeURIComponent(emailBody)}`;
          await Linking.openURL(mailtoLink);
        } else {
          Alert.alert('No email client found', 'Please send an email to capemedia.africa@gmail.com with your advertising details.');
        }
      }
      
      // Clear form
      setBusinessName('');
      setContactEmail('');
      setContactPhone('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Could not open email client. Please send an email to capemedia.africa@gmail.com directly.');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <View style={styles.adFormContainer}>
      <Text style={styles.adFormTitle}>Advertise with Radio 47</Text>
      <Text style={styles.adFormDescription}>
        Fill in the form below to inquire about advertising opportunities. Our team will get back to you shortly.
      </Text>
      
      <View style={styles.inputGroup}>
        <Ionicons name="business-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Business Name"
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Ionicons name="mail-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Contact Email"
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Ionicons name="call-outline" size={20} color="#1E3EA1" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Contact Phone"
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.textAreaGroup}>
        <TextInput
          style={styles.textArea}
          placeholder="Tell us about your business and advertising needs..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
      </View>
      
      <Pressable 
        style={styles.adSubmitButton} 
        onPress={handleSubmit}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.adSubmitText}>Submit Inquiry</Text>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </>
        )}
      </Pressable>
    </View>
  );
}

// FM Frequencies Component
function FMFrequenciesSection() {
  const frequencyColumns = [
    fmFrequencies.slice(0, Math.ceil(fmFrequencies.length / 3)),
    fmFrequencies.slice(Math.ceil(fmFrequencies.length / 3), Math.ceil(fmFrequencies.length * 2 / 3)),
    fmFrequencies.slice(Math.ceil(fmFrequencies.length * 2 / 3))
  ];

  return (
    <View style={styles.fmContainer}>
      <View style={styles.fmCardContainer}>
        <View style={styles.fmGrid}>
          {frequencyColumns.map((column, columnIndex) => (
            <View key={`column-${columnIndex}`} style={styles.fmColumn}>
              {column.map((item, index) => (
                <View key={`freq-${columnIndex}-${index}`} style={styles.fmItem}>
                  <Text style={styles.fmLocation}>{item.location}</Text>
                  <Text style={styles.fmFrequency}>{item.frequency}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
      
      <Pressable 
        style={styles.tuneInButton}
        onPress={() => Linking.openURL('https://shorturl.at/yvHdJ')}
      >
        <Text style={styles.tuneInText}>Listen Online</Text>
        <Ionicons name="headset" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'Light',
    language: 'English',
    pushNotifications: true,
    emailUpdates: true,
  });
  
  const handleToggleSetting = (setting: string) => {
    if (setting === 'pushNotifications' || setting === 'emailUpdates') {
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
      
      // Show confirmation
      Alert.alert(
        'Setting Updated',
        `${setting === 'pushNotifications' ? 'Push notifications' : 'Email updates'} ${!settings[setting] ? 'enabled' : 'disabled'}.`
      );
    }
  };
  
  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.radio47.fm/tc/');
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isAuthenticated ? (
          <UserProfile />
        ) : (
          <AuthForms />
        )}
        
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsHeader}>App Settings</Text>
          
          <SettingsSection title="FM Frequencies" icon="radio" initiallyExpanded={false}>
            <FMFrequenciesSection />
          </SettingsSection>
          
          <SettingsSection title="Preferences" icon="options">
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Theme</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.settingValue}>{settings.theme}</Text>
                <Ionicons name="chevron-forward" size={16} color="#1E3EA1" />
              </View>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Language</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.settingValue}>{settings.language}</Text>
                <Ionicons name="chevron-forward" size={16} color="#1E3EA1" />
              </View>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={settings.pushNotifications}
                onValueChange={() => handleToggleSetting('pushNotifications')}
                trackColor={{ false: '#D1D1D6', true: '#1E3EA1' }}
                thumbColor={settings.pushNotifications ? '#FFDE2D' : '#FFFFFF'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Email Updates</Text>
              <Switch
                value={settings.emailUpdates}
                onValueChange={() => handleToggleSetting('emailUpdates')}
                trackColor={{ false: '#D1D1D6', true: '#1E3EA1' }}
                thumbColor={settings.emailUpdates ? '#FFDE2D' : '#FFFFFF'}
              />
            </View>
          </SettingsSection>

          <SettingsSection title="Notifications" icon="notifications">
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={settings.pushNotifications}
                onValueChange={() => handleToggleSetting('pushNotifications')}
                trackColor={{ false: '#D1D1D6', true: '#1E3EA1' }}
                thumbColor={settings.pushNotifications ? '#FFDE2D' : '#FFFFFF'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Email Updates</Text>
              <Switch
                value={settings.emailUpdates}
                onValueChange={() => handleToggleSetting('emailUpdates')}
                trackColor={{ false: '#D1D1D6', true: '#1E3EA1' }}
                thumbColor={settings.emailUpdates ? '#FFDE2D' : '#FFFFFF'}
              />
            </View>
          </SettingsSection>

          <SettingsSection title="About" icon="information-circle">
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>2.0.0</Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Build</Text>
              <Text style={styles.settingValue}>2025.1</Text>
            </View>
          </SettingsSection>

          <SettingsSection title="Advertise with Us" icon="megaphone">
            <AdvertisementForm />
          </SettingsSection>

          <SettingsSection title="Privacy Policy" icon="shield-checkmark">
            <View style={styles.privacySection}>
              <Text style={styles.privacyText}>
                Radio 47 respects your privacy and only collects minimal data necessary to provide our services. We use the following permissions:
              </Text>
              
              <View style={styles.permissionItem}>
                <Ionicons name="globe-outline" size={20} color="#1E3EA1" />
                <Text style={styles.permissionText}>
                  <Text style={styles.bold}>INTERNET:</Text> Required to stream radio content and live broadcasts.
                </Text>
              </View>
              
              <View style={styles.permissionItem}>
                <Ionicons name="notifications-outline" size={20} color="#1E3EA1" />
                <Text style={styles.permissionText}>
                  <Text style={styles.bold}>POST_NOTIFICATIONS:</Text> Used to notify you about your favorite shows.
                </Text>
              </View>
              
              <View style={styles.permissionItem}>
                <Ionicons name="power-outline" size={20} color="#1E3EA1" />
                <Text style={styles.permissionText}>
                  <Text style={styles.bold}>WAKE_LOCK & FOREGROUND_SERVICE:</Text> Allows audio playback when the app is in the background.
                </Text>
              </View>
              
              <Text style={styles.privacyText}>
                We do not record audio or access your microphone. For our complete privacy policy, please visit our website.
              </Text>
              
              <Pressable style={styles.linkButton} onPress={openPrivacyPolicy}>
                <Text style={styles.linkButtonText}>View Full Privacy Policy</Text>
                <Ionicons name="arrow-forward" size={16} color="#1E3EA1" />
              </Pressable>
            </View>
          </SettingsSection>
          
          {/* Add bottom padding to last item */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    gap: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  authContainer: {
    marginBottom: 30,
    marginTop: 20,
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
    marginBottom: 12,
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
  settingsContainer: {
    marginTop: 20,
  },
  settingsHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3EA1',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  settingLabel: {
    fontSize: 16,
    color: '#666666',
  },
  settingValue: {
    fontSize: 16,
    color: '#1E3EA1',
    fontWeight: '500',
    marginRight: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacySection: {
    padding: 20,
    paddingTop: 0,
  },
  privacyText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 10,
    gap: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#333333',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  linkButtonText: {
    color: '#1E3EA1',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 50,
  },
  // Advertisement Form Styles
  adFormContainer: {
    padding: 20,
    paddingTop: 0,
  },
  adFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 8,
  },
  adFormDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  textAreaGroup: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 10,
    height: 100,
    marginBottom: 16,
  },
  textArea: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
  },
  adSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3EA1',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  adSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // FM Frequencies styles
  fmContainer: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  fmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  fmDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  fmCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fmGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fmColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  fmItem: {
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#FFDE2D',
  },
  fmLocation: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 2,
  },
  fmFrequency: {
    fontSize: 12,
    color: '#666666',
  },
  tuneInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3EA1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
    marginHorizontal: 20,
  },
  tuneInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});