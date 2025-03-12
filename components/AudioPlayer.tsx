import { StyleSheet, View, Text, Pressable, ScrollView, Image, Platform, useWindowDimensions, ActivityIndicator, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  withRepeat,
  withSequence,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import ShowsCarousel from './ShowsCarousel';
import { toggleLikeShow, isShowLiked } from '../utils/storage';
import { updatePlaybackNotification, scheduleShowNotifications } from '../utils/notifications';
import { supabase } from '../utils/supabase';
import LoadingDots from './LoadingDots';

// Configure audio for background playback
try {
  Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
  }).catch(err => console.error('Error setting audio mode:', err));
} catch (err) {
  console.error('Failed to configure audio:', err);
}

let audioInstance: Audio.Sound | null = null;

// Import shows from the same source as other components
import { getCurrentShow, getUpcomingShows } from '../utils/shows';

// Global variable to track if audio is playing
export let isAudioPlaying = false;

// Function to pause audio from other components
export const pauseAudio = async () => {
  if (audioInstance && isAudioPlaying) {
    try {
      await audioInstance.pauseAsync();
      isAudioPlaying = false;
      return true;
    } catch (err) {
      console.error('Error pausing audio:', err);
      return false;
    }
  }
  return false;
};

export default function AudioPlayer() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentShow, setCurrentShow] = useState(getCurrentShow());
  const [isLiked, setIsLiked] = useState(false);
  const [upcomingShows, setUpcomingShows] = useState(getUpcomingShows());
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const checkLikedStatus = async () => {
      if (currentShow.name !== "Off Studio") {
        const liked = await isShowLiked(currentShow.name, currentShow.time);
        setIsLiked(liked);
      } else {
        setIsLiked(false);
      }
    };
    checkLikedStatus();
  }, [currentShow]);

  // Auto-start audio player when app opens
  useEffect(() => {
    if (!initialLoadDone.current && Platform.OS !== 'web') {
      initialLoadDone.current = true;
      
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        playSound();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        // Configure audio for background playback first
        Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        });
        
        // Create initial notification without playing
        const currentShow = getCurrentShow();
        updatePlaybackNotification(false, currentShow.name, currentShow.host, false);
      } catch (error) {
        console.error('Error configuring audio:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        // Listen for notification received
        if (Notifications) {
          notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Do nothing with this for now, just prevents unhandled notifications
            console.log('Notification received:', notification.request.content.title);
          });

          // Listen for notification response
          responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { actionIdentifier } = response;
            
            if (actionIdentifier === 'play') {
              playSound();
            } else if (actionIdentifier === 'mute') {
              toggleMute();
            }
          });
        }
      } catch (err) {
        console.error('Error setting up notification listeners:', err);
      }

      return () => {
        try {
          if (notificationListener.current && Notifications) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (responseListener.current && Notifications) {
            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (err) {
          console.error('Error removing notification listeners:', err);
        }
      };
    }
  }, []);

  // Update current show and upcoming shows every minute
  useEffect(() => {
    const updateShows = () => {
      const newCurrentShow = getCurrentShow();
      setCurrentShow(newCurrentShow);
      setUpcomingShows(getUpcomingShows());
    };
    
    // Update immediately on mount
    updateShows();
    
    // Then set interval to update every minute
    const interval = setInterval(updateShows, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!audioRef.current) {
        const audio = new window.Audio('https://streaming.shoutcast.com/radio-47');
        audio.preload = 'none';
        audioRef.current = audio;

        audio.addEventListener('waiting', () => setIsLoading(true));
        audio.addEventListener('playing', () => setIsLoading(false));
        audio.addEventListener('canplay', () => setIsLoading(false));
        audio.addEventListener('error', () => setIsLoading(false));
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.removeEventListener('waiting', () => setIsLoading(true));
          audioRef.current.removeEventListener('playing', () => setIsLoading(false));
          audioRef.current.removeEventListener('canplay', () => setIsLoading(false));
          audioRef.current.removeEventListener('error', () => setIsLoading(false));
        }
      };
    }

    return () => {
      if (audioInstance) {
        try {
          audioInstance.unloadAsync();
          audioInstance = null;
        } catch (err) {
          console.error('Error unloading audio:', err);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying && !isLoading) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(360, { duration: 20000 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
    
    // Update global state
    isAudioPlaying = isPlaying;
    
    // Show persistent notification when audio is playing
    if (Platform.OS !== 'web') {
      // Use a timeout to avoid blocking the UI thread
      setTimeout(() => {
        try {
          updatePlaybackNotification(isPlaying, currentShow.name, currentShow.host, isMuted)
            .catch(err => console.error('Notification error:', err));
        } catch (err) {
          console.error('Failed to update playback notification:', err);
        }
      }, 500);
    }
  }, [isPlaying, isLoading, currentShow, isMuted]);

  async function playSound() {
    try {
      if (Platform.OS === 'web') {
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else {
            setIsLoading(true);
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch (err) {
              console.error('Web audio play error:', err);
              setIsLoading(false);
            }
          }
        }
      } else {
        if (audioInstance) {
          if (isPlaying) {
            await audioInstance.pauseAsync();
            setIsPlaying(false);
          } else {
            setIsLoading(true);
            await audioInstance.playAsync();
            setIsPlaying(true);
          }
        } else {
          setIsLoading(true);
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: 'https://streaming.shoutcast.com/radio-47' },
              { 
                shouldPlay: true,
                isLooping: true,
                staysActiveInBackground: true,
                progressUpdateIntervalMillis: 1000,
              },
              (status) => {
                // Optional status update callback
                if (status.isLoaded && !status.isPlaying && status.error) {
                  console.log('Stream error:', status.error);
                }
              }
            );
            audioInstance = sound;
            setIsPlaying(true);
          } catch (error) {
            console.error('Error creating audio instance:', error);
            // Try alternative stream URL if the first one fails
            try {
              const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://radio47.radioca.st/stream' },
                { 
                  shouldPlay: true,
                  isLooping: true,
                  staysActiveInBackground: true,
                  progressUpdateIntervalMillis: 1000,
                }
              );
              audioInstance = sound;
              setIsPlaying(true);
            } catch (secondError) {
              console.error('Error with backup stream:', secondError);
              setIsLoading(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }

    // Update notification with playback controls - use setTimeout to avoid blocking
    if (Platform.OS !== 'web' && isPlaying) {
      setTimeout(() => {
        try {
          updatePlaybackNotification(true, currentShow.name, currentShow.host, isMuted)
            .catch(err => console.error('Notification error:', err));
        } catch (err) {
          console.error('Failed to update playback notification:', err);
        }
      }, 500);
    }
  }

  async function toggleMute() {
    try {
      if (Platform.OS === 'web') {
        if (audioRef.current) {
          audioRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
        }
      } else {
        if (audioInstance) {
          await audioInstance.setIsMutedAsync(!isMuted);
          setIsMuted(!isMuted);
        }
      }

      // Update notification with new mute state - use setTimeout to avoid blocking
      if (Platform.OS !== 'web' && isPlaying) {
        setTimeout(() => {
          try {
            updatePlaybackNotification(isPlaying, currentShow.name, currentShow.host, !isMuted)
              .catch(err => console.error('Notification error:', err));
          } catch (err) {
            console.error('Failed to update playback notification:', err);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  }

  const handleShare = async () => {
    try {
      const message = `I'm listening to ${currentShow.name} with ${currentShow.host} on Radio 47! Listen here: https://shorturl.at/yvHdJ`;
      
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Radio 47 - Listen Live',
            text: message,
            url: 'https://shorturl.at/yvHdJ'
          });
        } else {
          // Fallback for browsers that don't support the Web Share API
          await navigator.clipboard.writeText(message);
          Alert.alert('Success', 'Link copied to clipboard! Share it with your friends.');
        }
      } else {
        await Share.share({
          message: message,
          title: 'Radio 47 - Listen Live'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLike = async () => {
    if (currentShow.name === "Off Studio") return;
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    try {
      const showData = {
        id: `${currentShow.name}-${currentShow.time}`,
        name: currentShow.name,
        host: currentShow.host,
        time: currentShow.time,
        days: currentShow.days,
        image: currentShow.image,
        likedAt: Date.now()
      };
      
      // Save to local storage
      const newIsLiked = await toggleLikeShow(showData);
      setIsLiked(newIsLiked);
      
      // Save to Supabase if liked (and not when unliked)
      if (newIsLiked) {
        try {
          // Check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Save to Supabase liked_shows table
            const { error } = await supabase
              .from('liked_shows')
              .upsert({
                user_id: user.id,
                show_name: currentShow.name,
                show_host: currentShow.host,
                show_time: currentShow.time,
                show_days: currentShow.days,
                notifications_enabled: true,
                created_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,show_name,show_time'
              });
              
            if (error) {
              console.error('Error saving liked show to Supabase:', error);
            }
          }
        } catch (err) {
          console.error('Error with Supabase operation:', err);
          // Continue despite Supabase error - local storage is our primary storage
        }
      } else {
        // Remove from Supabase if unliked
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Delete from Supabase
            const { error } = await supabase
              .from('liked_shows')
              .delete()
              .eq('user_id', user.id)
              .eq('show_name', currentShow.name)
              .eq('show_time', currentShow.time);
              
            if (error) {
              console.error('Error removing liked show from Supabase:', error);
            }
          }
        } catch (err) {
          console.error('Error with Supabase delete operation:', err);
        }
      }
      
      // If the show was liked, schedule notifications for it
      if (newIsLiked && Platform.OS !== 'web') {
        // Use setTimeout to avoid blocking the UI thread
        setTimeout(() => {
          try {
            scheduleShowNotifications()
              .catch(err => console.error('Show notification error:', err));
          } catch (err) {
            console.error('Failed to schedule show notifications:', err);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const borderRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const albumSize = Math.min(windowHeight * 0.3, 280);

  // Navigate to show details
  const navigateToShow = () => {
    if (currentShow && currentShow.name !== "Off Studio") {
      router.push(`/show/${currentShow.name}-${currentShow.time}`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <Pressable onPress={navigateToShow}>
            <Animated.View 
              style={[
                styles.albumContainer,
                borderRotationStyle,
                { width: albumSize, height: albumSize, borderRadius: albumSize / 2 }
              ]}
            >
              <LinearGradient
                colors={['#182d7e', '#1E3EA1']}
                style={[styles.albumGradient, { borderRadius: (albumSize - 30) / 2 }]}
              >
                <View style={[styles.albumInner, { borderRadius: (albumSize - 36) / 2 }]}>
                  <Image 
                    source={currentShow.image}
                    style={styles.albumArt}
                    resizeMode="cover"
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <View style={styles.controls}>
            <Pressable style={styles.outlineButton} onPress={handleShare}>
              <Ionicons 
                name="share-social" 
                size={24} 
                color="#1E3EA1" 
              />
            </Pressable>
            <Pressable 
              style={[styles.playButton, isLoading && styles.playButtonLoading]} 
              onPress={playSound}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="white" 
                />
              )}
            </Pressable>
            <Animated.View style={heartStyle}>
              <Pressable 
                style={[
                  styles.outlineButton,
                  currentShow.name === "Off Studio" && styles.outlineButtonDisabled,
                  isLiked && styles.likedButton
                ]} 
                onPress={handleLike}
                disabled={currentShow.name === "Off Studio"}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#FFFFFF" : "#1E3EA1"} 
                />
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.label}>Now Playing</Text>
            <Text style={styles.title}>{currentShow.name}</Text>
            <Text style={styles.host}>{currentShow.host}</Text>
            <Pressable 
              style={styles.detailsButton}
              onPress={navigateToShow}
              disabled={currentShow.name === "Off Studio"}
            >
              <Text style={styles.detailsButtonText}>Show Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#1E3EA1" />
            </Pressable>
          </View>
        </View>

        <View style={styles.upcomingSection}>
          <View style={styles.upcomingContent}>
            <View style={styles.upNextHeader}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              <LoadingDots />
            </View>
            <ShowsCarousel shows={upcomingShows} />
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
  mainContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  albumContainer: {
    padding: 15,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FFDE2D',
  },
  albumGradient: {
    flex: 1,
    padding: 3,
  },
  albumInner: {
    flex: 1,
    overflow: 'hidden',
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 30,
  },
  outlineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  likedButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  outlineButtonDisabled: {
    opacity: 0.5,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonLoading: {
    opacity: 0.8,
  },
  trackInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  title: {
    color: '#1E3EA1',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  host: {
    color: '#999',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  detailsButtonText: {
    color: '#1E3EA1',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  upcomingSection: {
    backgroundColor: 'rgba(30, 62, 161, 0.05)',
    borderTopLeftRadius: 40,
    marginTop: 20,
    marginHorizontal: -20,
  },
  upcomingContent: {
    padding: 20,
    paddingBottom: 80,
  },
  upNextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3EA1',
    marginRight: 8,
  },
});

export { isAudioPlaying }