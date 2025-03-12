import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { getLikedShows, getNotificationSettings } from './storage';
import { getCurrentShow } from './shows';

// Initialize all notification-related functionality
export async function initializeNotifications() {
  if (Platform.OS === 'web') return null;
  
  try {
    // Configure notification handler
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    
    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      // Media player channel - this is crucial for showing the media controls in notification
      await Notifications.setNotificationChannelAsync('media-playback', {
        name: 'Media Playback',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 0, 0, 0], // No vibration for media playback
        lightColor: '#1E3EA1',
        sound: false,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.setNotificationChannelAsync('upcoming-shows', {
        name: 'Upcoming Shows',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFDE2D',
        sound: true,
      });
      
      await Notifications.setNotificationChannelAsync('tune-in', {
        name: 'Tune In Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFDE2D',
        sound: false,
      });
    }

    // Register for push notifications
    await registerForPushNotificationsAsync();
    
    // Create a default media player notification and schedule tune-in notification
    setTimeout(() => {
      try {
        const currentShow = getCurrentShow();
        updatePlaybackNotification(true, currentShow.name, currentShow.host, false);
        scheduleSingleTuneInNotification();
      } catch (err) {
        console.error('Error scheduling initial notifications:', err);
      }
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
}

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') return null;

  // Only proceed if this is a physical device (not a simulator/emulator)
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask for permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || '6cb116fb-31f3-4c24-87dd-dcb150f077c4'
      });
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  return null;
}

// Schedule a single tune-in notification for 6 hours from now
function scheduleSingleTuneInNotification() {
  if (Platform.OS === 'web') return;
  
  try {
    // First check if there are any existing scheduled notifications
    Notifications.getAllScheduledNotificationsAsync()
      .then(notifications => {
        // If we already have a tune-in notification scheduled, don't add more
        if (notifications.some(n => n.content.data?.type === 'periodic')) {
          console.log('Tune-in notification already scheduled');
          return;
        }

        // Schedule a notification for 6 hours from now
        const SIX_HOURS = 6 * 60 * 60;
        const currentShow = getCurrentShow();
        
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Tune in to Radio 47!",
            body: `Now playing: "${currentShow.name}" with ${currentShow.host}. Listening makes your day better!`,
            data: { type: 'periodic' },
            categoryIdentifier: 'tune-in',
            sound: true,
          },
          trigger: { 
            seconds: SIX_HOURS,
            repeats: false // Don't repeat to avoid notification flood
          },
        }).then(() => {
          console.log('Scheduled single tune-in notification for 6 hours');
        }).catch(err => {
          console.error('Error scheduling tune-in notification:', err);
        });
      })
      .catch(err => {
        console.error('Error checking scheduled notifications:', err);
      });
  } catch (error) {
    console.error('Error in scheduleSingleTuneInNotification:', error);
  }
}

// Schedule notifications for upcoming shows
export async function scheduleShowNotifications() {
  if (Platform.OS === 'web') return;

  try {
    // Get notification settings
    const settings = await getNotificationSettings();
    
    // If upcoming shows notifications are disabled, don't schedule any
    if (!settings.upcomingShows) return;
    
    // Get user's liked shows
    const likedShows = await getLikedShows();
    
    if (likedShows.length === 0) return;
    
    // Filter only shows that have notifications enabled
    const notificationEnabledShows = likedShows.filter(show => 
      show.notificationsEnabled !== false
    );
    
    if (notificationEnabledShows.length === 0) return;
    
    // Cancel existing show notifications before scheduling new ones
    // But keep media playback notification and tune-in notification
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of existingNotifications) {
      // Only cancel notifications that are for shows, not media playback or tune-in
      if (notification.content.data?.showId && 
          notification.content.categoryIdentifier !== 'media-playback' &&
          notification.content.categoryIdentifier !== 'tune-in') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    const now = new Date();
    
    for (const show of notificationEnabledShows) {
      try {
        // Parse show time and days
        const [startTime] = show.time.split(' - ');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const showDays = show.days.toLowerCase();
        
        // Find the next occurrence of this show
        const nextDays = [];
        
        if (showDays.includes('weekdays')) {
          // Add all weekdays (1-5)
          nextDays.push(...[1, 2, 3, 4, 5]);
        } else if (showDays.includes('all days')) {
          // Add all days (0-6)
          nextDays.push(...[0, 1, 2, 3, 4, 5, 6]);
        } else {
          // Add specific days
          if (showDays.includes('monday')) nextDays.push(1);
          if (showDays.includes('tuesday')) nextDays.push(2);
          if (showDays.includes('wednesday')) nextDays.push(3);
          if (showDays.includes('thursday')) nextDays.push(4);
          if (showDays.includes('friday')) nextDays.push(5);
          if (showDays.includes('saturday')) nextDays.push(6);
          if (showDays.includes('sunday')) nextDays.push(0);
        }
        
        // For each day the show airs
        for (const dayOfWeek of nextDays) {
          // Create notification time (15 minutes before show starts)
          const notificationTime = new Date();
          let daysToAdd = (dayOfWeek - now.getDay() + 7) % 7; // Days until next occurrence
          
          // If show is today and hasn't started yet, daysToAdd will be 0
          if (daysToAdd === 0) {
            // Set time to today
            notificationTime.setHours(startHour, startMinute - 15, 0, 0);
            
            // If notification time is in the past, skip this one
            if (notificationTime < now) {
              continue;
            }
          } else {
            // Set date to the future occurrence
            notificationTime.setDate(now.getDate() + daysToAdd);
            notificationTime.setHours(startHour, startMinute - 15, 0, 0);
          }
          
          // Calculate seconds until notification
          const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);
          
          // Only schedule if it's in the future and within next 7 days
          if (secondsUntilNotification > 0 && secondsUntilNotification < 7 * 24 * 60 * 60) {
            // Schedule notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${show.name} starts soon!`,
                body: `Tune in to Radio 47 in 15 minutes for ${show.name} with ${show.host}`,
                data: { showId: show.id },
                categoryIdentifier: 'upcoming-shows',
                sound: true,
              },
              trigger: { 
                seconds: secondsUntilNotification,
                repeats: false,
              },
            });
            
            // Only schedule one notification per show (the next occurrence)
            break;
          }
        }
      } catch (err) {
        console.error('Error scheduling notification for show:', show.name, err);
        // Continue with other shows even if one fails
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

// Create or update playback notification
export async function updatePlaybackNotification(
  isPlaying: boolean, 
  showName: string, 
  hostName: string,
  isMuted: boolean
) {
  if (Platform.OS === 'web') return;

  try {
    // Don't cancel existing notification, just update it

    // Create notification channel for Android if not web
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('playback-control', {
        name: 'Playback Control',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 0, 0, 0],
        enableLights: false,
        sound: false,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        foregroundServiceBehavior: 'when_playing',
      });
    }

    // Define notification actions
    const playButtonTitle = isPlaying ? 'Pause' : 'Play';
    const muteButtonTitle = isMuted ? 'Unmute' : 'Mute';
    
    // Only create actions if we have valid button titles
    if (playButtonTitle && muteButtonTitle) {
      const actions = [
        {
          identifier: 'play',
          buttonTitle: playButtonTitle,
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'mute',
          buttonTitle: muteButtonTitle,
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ];

      // Only set category if we have valid actions
      await Notifications.setNotificationCategoryAsync('media-playback', {
        name: 'Media Controls',
        actions,
      });
    }

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: showName,
        body: `with ${hostName}`,
        data: { type: 'media-control', isPlaying, isMuted },
        ongoing: true,
        priority: 'high',
        categoryIdentifier: 'media-playback',
        sound: false,
        badge: 0,
        sticky: true, // Make notification persistent
        autoDismiss: false,
        channelId: Platform.OS === 'android' ? 'playback-control' : undefined,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error updating playback notification:', error);
  }
}