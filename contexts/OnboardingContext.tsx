import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Key for storing onboarding status in AsyncStorage
const ONBOARDING_KEY = '@radio47:onboarding_completed';
const SEEN_FEATURES_KEY = '@radio47:seen_features';

type OnboardingContextType = {
  isFirstLaunch: boolean;
  onboardingComplete: boolean;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  seenFeatures: string[];
  markFeatureSeen: (feature: string) => Promise<void>;
  isFeatureSeen: (feature: string) => boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
};

const defaultContextValue: OnboardingContextType = {
  isFirstLaunch: true,
  onboardingComplete: false,
  completeOnboarding: async () => {},
  skipOnboarding: async () => {},
  restartOnboarding: async () => {},
  seenFeatures: [],
  markFeatureSeen: async () => {},
  isFeatureSeen: () => false,
  currentStep: 0,
  setCurrentStep: () => {},
  totalSteps: 5,
};

const OnboardingContext = createContext<OnboardingContextType>(defaultContextValue);

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [seenFeatures, setSeenFeatures] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5; // Total number of onboarding steps

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        let status: string | null = null;
        let features: string[] = [];

        if (Platform.OS === 'web') {
          status = localStorage.getItem(ONBOARDING_KEY);
          const featuresStr = localStorage.getItem(SEEN_FEATURES_KEY);
          features = featuresStr ? JSON.parse(featuresStr) : [];
        } else {
          status = await AsyncStorage.getItem(ONBOARDING_KEY);
          const featuresStr = await AsyncStorage.getItem(SEEN_FEATURES_KEY);
          features = featuresStr ? JSON.parse(featuresStr) : [];
        }

        setOnboardingComplete(status === 'true');
        setIsFirstLaunch(status === null);
        setSeenFeatures(features);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(ONBOARDING_KEY, 'true');
      } else {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      }
      setOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const skipOnboarding = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(ONBOARDING_KEY, 'true');
      } else {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      }
      setOnboardingComplete(true);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const restartOnboarding = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(ONBOARDING_KEY);
      } else {
        await AsyncStorage.removeItem(ONBOARDING_KEY);
      }
      setOnboardingComplete(false);
      setIsFirstLaunch(true);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  const markFeatureSeen = async (feature: string) => {
    try {
      if (seenFeatures.includes(feature)) return;
      
      const updatedFeatures = [...seenFeatures, feature];
      setSeenFeatures(updatedFeatures);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(SEEN_FEATURES_KEY, JSON.stringify(updatedFeatures));
      } else {
        await AsyncStorage.setItem(SEEN_FEATURES_KEY, JSON.stringify(updatedFeatures));
      }
    } catch (error) {
      console.error('Error marking feature as seen:', error);
    }
  };

  const isFeatureSeen = (feature: string): boolean => {
    return seenFeatures.includes(feature);
  };

  if (isLoading) {
    return <>{children}</>; // Return children while loading to avoid flickering
  }

  return (
    <OnboardingContext.Provider
      value={{
        isFirstLaunch,
        onboardingComplete,
        completeOnboarding,
        skipOnboarding,
        restartOnboarding,
        seenFeatures,
        markFeatureSeen,
        isFeatureSeen,
        currentStep,
        setCurrentStep,
        totalSteps,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export default OnboardingContext;