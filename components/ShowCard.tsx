import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { toggleLikeShow, isShowLiked } from '../utils/storage';
import { scheduleShowNotifications } from '../utils/notifications';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  useSharedValue,
  withTiming 
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ShowCard({ show, onLikeChange }: { 
  show: any;
  onLikeChange?: (isLiked: boolean) => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    isShowLiked(show.name, show.time).then(setIsLiked);
  }, [show]);

  const handleLike = async () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    
    const newIsLiked = await toggleLikeShow({
      id: `${show.name}-${show.time}`,
      name: show.name,
      host: show.host,
      time: show.time,
      days: show.days,
      image: show.image,
      likedAt: Date.now()
    });
    
    setIsLiked(newIsLiked);
    onLikeChange?.(newIsLiked);
    
    // Schedule notifications if show was liked
    if (newIsLiked) {
      scheduleShowNotifications();
    }
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={styles.showCard}>
      <Image source={show.image} style={styles.showImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.showInfo}>
          <View style={styles.showHeader}>
            <Text style={styles.showName}>{show.name}</Text>
            <AnimatedPressable 
              style={[styles.likeButton, heartStyle]}
              onPress={handleLike}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF3B30" : "#FFFFFF"} 
              />
            </AnimatedPressable>
          </View>
          {show.host ? <Text style={styles.showHost}>{show.host}</Text> : null}
          <View style={styles.showTimeContainer}>
            <Text style={styles.showTime}>{show.time}</Text>
            <Text style={styles.showDays}>{show.days}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  showCard: {
    height: 200,
    backgroundColor: '#1E3EA1',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  showImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  showInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  showHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  showName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    flex: 1,
    marginRight: 10,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showHost: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  showTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showTime: {
    fontSize: 14,
    color: '#FFDE2D',
    fontWeight: 'bold',
  },
  showDays: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});