import { StyleSheet, View, Text, ScrollView, Image, Dimensions, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withSpring,
} from 'react-native-reanimated';
import { isShowLiked, toggleLikeShow } from '../utils/storage';

type Show = {
  name: string;
  host: string;
  time: string;
  days: string;
  image: any;
  description?: string;
};

interface ShowsCarouselProps {
  shows: Show[];
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_SIZE = Math.min(200, screenWidth - 80);
const CARD_GAP = 15;
const CARD_WIDTH = Platform.OS === 'web' ? CARD_SIZE : CARD_SIZE + CARD_GAP;

function formatShowTime(show: Show): { time: string; label: string } {
  const now = new Date();
  const [startTime] = show.time.split(' - ');
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const showTime = new Date(now);
  showTime.setHours(hours, minutes, 0);

  if (showTime < now) {
    showTime.setDate(showTime.getDate() + 1);
  }

  const isToday = showTime.getDate() === now.getDate();
  const isTomorrow = showTime.getDate() === now.getDate() + 1;

  return {
    time: show.time,
    label: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : 'Upcoming'
  };
}

// Individual show card component
const ShowCard = ({ show, index }) => {
  const [isLiked, setIsLiked] = useState(false);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    // Check if show is liked
    const checkLikedStatus = async () => {
      const liked = await isShowLiked(show.name, show.time);
      setIsLiked(liked);
    };
    checkLikedStatus();
  }, [show]);
  
  const handleLike = async (e) => {
    e.stopPropagation();
    
    scale.value = withSequence(
      withSpring(1.2, { damping: 4 }),
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
  };
  
  // Navigate to show details page
  const navigateToShow = () => {
    // Create an ID for navigation
    const showId = `${show.name}-${show.time}`;
    router.push(`/show/${showId}`);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const { time, label } = show.name === "Off Studio" 
    ? { time: "24/7", label: "Currently Playing" }
    : formatShowTime(show);
    
  return (
    <Pressable 
      style={[
        styles.showCard, 
        { 
          width: CARD_SIZE,
          marginRight: index === 0 ? CARD_GAP : 0 
        }
      ]}
      onPress={navigateToShow}
    >
      <Image 
        source={show.image} 
        style={styles.showImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.95)']}
        style={[StyleSheet.absoluteFill, styles.gradient]}
      >
        <View style={styles.showInfo}>
          <View style={styles.showHeader}>
            <Text style={styles.showName} numberOfLines={2}>{show.name}</Text>
            <Animated.View style={animatedStyle}>
              <Pressable onPress={handleLike}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#FF3B30" : "#FFFFFF"} 
                />
              </Pressable>
            </Animated.View>
          </View>
          {show.host && (
            <Text style={styles.showHost} numberOfLines={1} ellipsizeMode="tail">{show.host}...</Text>
          )}
          <View style={styles.timeContainer}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{label}</Text>
            </View>
            <Text style={styles.showTime}>{time}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export default function ShowsCarousel({ shows }: ShowsCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Add "Off Studio" as a show if there are no upcoming shows
  const displayShows = shows.length > 0 ? shows : [{
    name: "Off Studio",
    host: "With our Amazing DJs",
    time: "24/7",
    days: "All Days",
    image: require('../assets/images/default.png')
  }];

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        pagingEnabled={false}
        scrollEventThrottle={16}
      >
        {displayShows.map((show, index) => (
          <ShowCard 
            key={`${show.name}-${index}`}
            show={show}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_SIZE + 20,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingBottom: 20,
  },
  showCard: {
    height: CARD_SIZE,
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
    marginLeft: CARD_GAP,
  },
  showImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    height: '100%',
  },
  showInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  showHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  showName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flex: 1,
    marginRight: 10,
  },
  showHost: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  timeBadge: {
    backgroundColor: '#FFDE2D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timeBadgeText: {
    color: '#1E3EA1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  showTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});