import { Stack, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, LogBox } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import LoadingScreen from '../components/LoadingScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Require cycle:',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Import polyfills for web platform
if (Platform.OS === 'web') {
  require('react-native-url-polyfill/auto');
  require('cross-fetch/polyfill');
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useFrameworkReady();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsReady(true);
      } catch (err) {
        console.error('Error initializing app:', err);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <AuthProvider>
          <Stack 
            screenOptions={{
              headerShown: false,
              animation: Platform.OS === 'web' ? 'none' : 'default'
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  )
}