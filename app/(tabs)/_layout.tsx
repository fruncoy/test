import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memo } from 'react';

// Memoize the tab bar background for better performance
const TabBarBackground = memo(() => (
  <View style={styles.tabBarBackground} />
));

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1E3EA1',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 0,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#FFDE2D',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Radio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="tv" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shows"
        options={{
          title: 'Shows',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E3EA1',
    borderTopLeftRadius: 20,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF3B30',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});