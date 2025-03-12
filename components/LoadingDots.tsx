import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function LoadingDots() {
  // Create shared values for each dot's opacity
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);
  const dot4Opacity = useSharedValue(0.3);

  useEffect(() => {
    // Setup animation for dot 1
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.ease }),
        withTiming(0.3, { duration: 500, easing: Easing.ease })
      ),
      -1
    );

    // Setup animation for dot 2 with timing instead of delay
    setTimeout(() => {
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.ease }),
          withTiming(0.3, { duration: 500, easing: Easing.ease })
        ),
        -1
      );
    }, 125);

    // Setup animation for dot 3 with timing instead of delay
    setTimeout(() => {
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.ease }),
          withTiming(0.3, { duration: 500, easing: Easing.ease })
        ),
        -1
      );
    }, 250);

    // Setup animation for dot 4 with timing instead of delay
    setTimeout(() => {
      dot4Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.ease }),
          withTiming(0.3, { duration: 500, easing: Easing.ease })
        ),
        -1
      );
    }, 375);
  }, []);

  // Create animated styles for each dot
  const dot1Style = useAnimatedStyle(() => {
    return {
      opacity: dot1Opacity.value,
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    return {
      opacity: dot2Opacity.value,
    };
  });

  const dot3Style = useAnimatedStyle(() => {
    return {
      opacity: dot3Opacity.value,
    };
  });

  const dot4Style = useAnimatedStyle(() => {
    return {
      opacity: dot4Opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
      <Animated.View style={[styles.dot, dot4Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3EA1',
    marginHorizontal: 2,
  },
});