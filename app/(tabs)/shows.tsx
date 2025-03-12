import { StyleSheet, View, Text, ScrollView, Pressable, Image, Dimensions, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  useAnimatedScrollHandler,
  interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import { getCurrentShow, getShowsByDay, getAllShows } from '../../utils/shows';
import { isShowLiked, toggleLikeShow } from '../../utils/storage';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Find the current day of the week
function getCurrentDayOfWeek() {
  const day = new Date().getDay();
  // Convert from Sunday=0 to Monday=0 format
  return day === 0 ? 6 : day - 1;
}

// Show item component for carousel
function ShowItem({ show, onPress }) {
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
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const isCurrentShow = useMemo(() => {
    const currentShow = getCurrentShow();
    return currentShow?.name === show.name;
  }, [show]);
  
  return (
    <Pressable 
      style={styles.carouselShowItem}
      onPress={() => router.push(`/show/${show.name}-${show.time}`)}
    >
      <Image 
        source={show.image} 
        style={styles.carouselShowImage} 
        resizeMode="cover" 
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.carouselShowContent}>
          <View style={styles.carouselShowHeader}>
            <View>
              <Text style={styles.carouselShowName}>{show.name}</Text>
              <Text style={styles.carouselShowHost}>{show.host}</Text>
            </View>
            
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
          
          <View style={styles.carouselShowFooter}>
            <View style={styles.carouselShowTime}>
              <Ionicons name="time-outline" size={16} color="#FFDE2D" />
              <Text style={styles.carouselShowTimeText}>{show.time}</Text>
            </View>
            
            {isCurrentShow && (
              <View style={styles.liveNowBadge}>
                <Ionicons name="radio-outline" size={14} color="white" />
                <Text style={styles.liveNowText}>ON AIR</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function ShowsScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[getCurrentDayOfWeek()].toLowerCase());
  const [showLikes, setShowLikes] = useState({});
  const [allShows, setAllShows] = useState([]);
  const animatedScale = useSharedValue(1);
  const scrollY = useSharedValue(0);
  const carouselRef = useRef(null);
  
  // Calculate appropriate button size based on screen width
  const dayButtonSize = useMemo(() => {
    // Calculate the available width accounting for padding
    const availableWidth = windowWidth - 40; // 20px padding on each side
    // Divide by 7 for each day and ensure a minimum size
    return Math.min(Math.max(36, (availableWidth / 7) - 8), 42); 
  }, [windowWidth]);
  
  // Get show data organized by day - memoize to avoid recalculation
  const showsByDay = useMemo(() => getShowsByDay(), []);

  // Get the currently playing show - memoize to avoid recalculation
  const currentShow = useMemo(() => getCurrentShow(), []);
  const currentShowId = useMemo(() => {
    if (!currentShow) return '';
    
    // Create an ID in the same format as the shows in showsByDay
    const now = new Date();
    const day = now.getDay();
    let dayPrefix = '';
    
    if (day === 0) dayPrefix = 'sun-';
    else if (day === 6) dayPrefix = 'sat-';
    else dayPrefix = ['mon-', 'tue-', 'wed-', 'thu-', 'fri-'][day - 1];
    
    return `${dayPrefix}${currentShow.name}`;
  }, [currentShow]);

  // Load all shows
  useEffect(() => {
    setAllShows(getAllShows());
  }, []);

  // Load initial likes state
  const loadShowLikes = useCallback(async () => {
    const likesObj = {};
    
    // Check only shows for the selected day to reduce performance load
    if (showsByDay[selectedDay]) {
      for (const show of showsByDay[selectedDay]) {
        const isLiked = await isShowLiked(show.name, show.time);
        likesObj[show.id] = isLiked;
      }
    }
    
    setShowLikes(prev => ({...prev, ...likesObj}));
  }, [selectedDay, showsByDay]);

  // Load likes when selected day changes
  useMemo(() => {
    loadShowLikes();
  }, [selectedDay, loadShowLikes]);

  // Toggle like show
  const handleLikeShow = async (show) => {
    animatedScale.value = withSequence(
      withSpring(1.2, { damping: 4 }),
      withSpring(1)
    );
    
    const showObj = {
      id: show.id,
      name: show.name,
      host: show.host,
      time: show.time,
      days: show.days,
      image: show.image,
      likedAt: Date.now()
    };
    
    const isLiked = await toggleLikeShow(showObj);
    
    setShowLikes(prev => ({
      ...prev,
      [show.id]: isLiked
    }));
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: animatedScale.value }]
    };
  });

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const showDaySchedule = (day) => {
    setSelectedDay(day);
  };

  const navigateToShowDetails = (show) => {
    router.push(`/show/${show.id}`);
  };

  const renderDayItem = ({ item: day, index }) => {
    const dayKey = DAYS_OF_WEEK[index].toLowerCase();
    const isSelected = selectedDay === dayKey;
    const isToday = index === getCurrentDayOfWeek();
    
    return (
      <Pressable
        style={[
          styles.dayButton,
          isSelected && styles.selectedDayButton,
          { width: dayButtonSize, height: dayButtonSize }
        ]}
        onPress={() => showDaySchedule(dayKey)}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
          ]}
        >
          {day}
        </Text>
        {isSelected && <View style={styles.selectedIndicator} />}
        {isToday && !isSelected && <View style={styles.todayIndicator} />}
      </Pressable>
    );
  };

  const renderShowItem = ({ item: show }) => {
    const isLiked = !!showLikes[show.id];
    const isCurrentShow = show.id === currentShowId;
    
    return (
      <Pressable
        style={styles.showItem}
        onPress={() => navigateToShowDetails(show)}
      >
        <View style={styles.showCard}>
          <Image 
            source={show.image} 
            style={styles.showImage}
            resizeMode="cover"
          />
          <View style={styles.showMainInfo}>
            <View style={styles.timeContainer}>
              <Text style={styles.showTime}>{show.time}</Text>
              {isCurrentShow && (
                <View style={styles.liveBadge}>
                  <Ionicons name="radio" size={12} color="#FFF" />
                  <Text style={styles.liveText}>ON AIR</Text>
                </View>
              )}
            </View>
            
            <View style={styles.showDetails}>
              <Text style={styles.showName}>{show.name}</Text>
              <Text style={styles.showHost} numberOfLines={1}>{show.host}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyDay = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={48} color="#1E3EA1" />
      <Text style={styles.emptyStateText}>
        No shows scheduled for {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80 }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Carousel of all shows */}
        <View style={styles.carouselSection}>
          <Text style={styles.carouselTitle}>Featured Shows</Text>
          <FlatList
            ref={carouselRef}
            data={allShows}
            keyExtractor={(item) => `${item.name}-${item.time}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={styles.carouselContainer}
            renderItem={({ item }) => (
              <ShowItem 
                show={item} 
                onPress={navigateToShowDetails}
              />
            )}
          />
        </View>
        
        <View style={styles.calendarContainer}>
          <FlatList
            horizontal
            data={DAYS_SHORT}
            renderItem={renderDayItem}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          />
        </View>

        <View style={styles.showsContainer}>
          <Text style={styles.dayTitle}>
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Schedule
          </Text>
          
          {showsByDay[selectedDay] && showsByDay[selectedDay].length > 0 ? (
            <FlatList
              data={showsByDay[selectedDay]}
              renderItem={renderShowItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.showsList}
              ListEmptyComponent={renderEmptyDay}
            />
          ) : (
            renderEmptyDay()
          )}
        </View>
      </Animated.ScrollView>
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
    paddingBottom: 100,
  },
  // Carousel styles
  carouselSection: {
    marginBottom: 30,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 15,
  },
  carouselContainer: {
    paddingRight: 20,
  },
  carouselShowItem: {
    width: 300,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 15,
    backgroundColor: '#1E3EA1',
  },
  carouselShowImage: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselShowContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  carouselShowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  carouselShowName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  carouselShowHost: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  carouselShowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselShowTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  carouselShowTimeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  liveNowBadge: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  liveNowText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Calendar styles
  calendarContainer: {
    marginBottom: 20,
    width: '100%',
  },
  daysRow: {
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#1E3EA1',
    position: 'relative',
    marginHorizontal: 4,
  },
  selectedDayButton: {
    backgroundColor: '#FFDE2D',
    borderColor: '#1E3EA1',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3EA1',
  },
  selectedDayText: {
    color: '#1E3EA1',
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3EA1',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFDE2D',
  },
  // Shows list styles
  showsContainer: {
    marginTop: 10,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 16,
  },
  showsList: {
    gap: 16,
  },
  showItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  showCard: {
    flexDirection: 'row',
    height: 100,
  },
  showImage: {
    width: 100,
    height: '100%',
  },
  showMainInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  showTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3EA1',
    marginRight: 8,
  },
  liveBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  showDetails: {
    flex: 1,
  },
  showName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3EA1',
    marginBottom: 4,
  },
  showHost: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 16,
    lineHeight: 24,
  },
});