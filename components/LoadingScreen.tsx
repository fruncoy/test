import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  
  // Create animated values for dots
  const dot1Opacity = useSharedValue(0.2);
  const dot2Opacity = useSharedValue(0.2);
  const dot3Opacity = useSharedValue(0.2);
  
  // Start animations
  React.useEffect(() => {
    // Animate dot 1
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.ease }),
        withTiming(0.2, { duration: 500, easing: Easing.ease })
      ),
      -1, // Repeat indefinitely
      false // Don't reverse
    );
    
    // Animate dot 2 with slight delay
    setTimeout(() => {
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.ease }),
          withTiming(0.2, { duration: 500, easing: Easing.ease })
        ),
        -1,
        false
      );
    }, 200);
    
    // Animate dot 3 with more delay
    setTimeout(() => {
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.ease }),
          withTiming(0.2, { duration: 500, easing: Easing.ease })
        ),
        -1,
        false
      );
    }, 400);
  }, []);
  
  // Define animated styles
  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value
  }));
  
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value
  }));
  
  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value
  }));
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/images/Logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.dotContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E3EA1',
    marginHorizontal: 5,
  }
});