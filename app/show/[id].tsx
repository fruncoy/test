import { StyleSheet, View, Text, Image, ScrollView, Pressable, Share, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { isShowLiked, toggleLikeShow } from '../../utils/storage';
import { scheduleShowNotifications } from '../../utils/notifications';

// Get the show by ID from the utils/shows.ts file
import { getShowById } from '../../utils/shows';

export default function ShowDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [notification, setNotification] = useState(false);
  const heartScale = useSharedValue(1);
  const bellScale = useSharedValue(1);
  
  useEffect(() => {
    // Get show details
    if (id) {
      const showData = getShowById(id.toString());
      if (showData) {
        setShow(showData);
        
        // Check if show is liked
        const checkLikedStatus = async () => {
          const liked = await isShowLiked(showData.name, showData.time);
          setIsLiked(liked);
          
          // Also check notification status by loading the liked show object
          const likedShows = await import('../../utils/storage').then(m => m.getLikedShows());
          const likedShow = likedShows.find(s => 
            s.name === showData.name && s.time === showData.time
          );
          
          if (likedShow) {
            setNotification(likedShow.notificationsEnabled !== false);
          }
        };
        
        checkLikedStatus();
      }
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };
  
  const handleShare = async () => {
    if (!show) return;
    
    try {
      const message = `Check out "${show.name}" with ${show.host} on Radio 47! Listen here: https://shorturl.at/yvHdJ`;
      
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Radio 47 - ' + show.name,
            text: message,
            url: 'https://shorturl.at/yvHdJ'
          });
        } else {
          // Fallback for browsers that don't support the Web Share API
          await navigator.clipboard.writeText(message);
          alert('Link copied to clipboard! Share it with your friends.');
        }
      } else {
        await Share.share({
          message,
          title: 'Radio 47 - ' + show.name
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const handleLike = async () => {
    if (!show) return;
    
    heartScale.value = withSequence(
      withSpring(1.3),
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
    
    // If liked, also enable notifications by default
    if (newIsLiked && !notification) {
      setNotification(true);
      
      // Schedule notifications
      if (Platform.OS !== 'web') {
        scheduleShowNotifications();
      }
    }
  };
  
  const handleNotification = async () => {
    if (!show || !isLiked) return;
    
    bellScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    // Toggle notification status
    const newNotificationValue = !notification;
    setNotification(newNotificationValue);
    
    // Update storage
    const showId = `${show.name}-${show.time}`;
    await import('../../utils/storage').then(m => m.toggleShowNotifications(showId));
    
    // Reschedule notifications
    if (Platform.OS !== 'web') {
      scheduleShowNotifications();
    }
  };
  
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));
  
  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }]
  }));

  if (!show) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#1E3EA1" />
          </Pressable>
          <Text style={styles.headerTitle}>Show Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading show details...</Text>
        </View>
      </View>
    );
  }
  
  // Format air days and time
  const formattedDays = show.days;
  const [startTime, endTime] = show.time.split(' - ');
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image 
            source={show.image} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.showName}>{show.name}</Text>
            <Text style={styles.showHost}>Hosted by {show.host}</Text>
          </View>
          
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#1E3EA1" />
              <Text style={styles.infoText}>{formattedDays}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#1E3EA1" />
              <Text style={styles.infoText}>{startTime} - {endTime}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>About the Show</Text>
              <Text style={styles.descriptionText}>
                {show.description || `Join ${show.host} for an exciting radio show filled with great content and amazing guests! Tune in ${formattedDays} at ${show.time}.`}
              </Text>
              
              <View style={styles.actionButtons}>
                <Animated.View style={heartStyle}>
                  <Pressable 
                    style={[styles.actionButton, isLiked && styles.likedButton]} 
                    onPress={handleLike}
                  >
                    <Ionicons 
                      name={isLiked ? "heart" : "heart-outline"} 
                      size={22} 
                      color={isLiked ? "#FFFFFF" : "#1E3EA1"} 
                    />
                    <Text style={[styles.actionText, isLiked && styles.likedText]}>
                      {isLiked ? "Liked" : "Like"}
                    </Text>
                  </Pressable>
                </Animated.View>
                
                <Animated.View style={bellStyle}>
                  <Pressable 
                    style={[
                      styles.actionButton, 
                      notification && styles.notifyButton,
                      !isLiked && styles.disabledButton
                    ]} 
                    onPress={handleNotification}
                    disabled={!isLiked}
                  >
                    <Ionicons 
                      name={notification ? "notifications" : "notifications-outline"} 
                      size={22} 
                      color={notification ? "#FFFFFF" : !isLiked ? "#999999" : "#1E3EA1"} 
                    />
                    <Text style={[
                      styles.actionText, 
                      notification && styles.notifyText,
                      !isLiked && styles.disabledText
                    ]}>
                      {notification ? "Notifying" : "Notify Me"}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3EA1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  heroContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  showName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  showHost: {
    fontSize: 18,
    color: '#FFDE2D',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  shareButton: {
    position: 'absolute',
    right: 20,
    bottom: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    width: 120,
  },
  likedButton: {
    backgroundColor: '#FF3B30',
  },
  notifyButton: {
    backgroundColor: '#1E3EA1',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 14,
    color: '#1E3EA1',
    marginTop: 6,
    fontWeight: '500',
  },
  likedText: {
    color: '#FFFFFF',
  },
  notifyText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#999999',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  }
});