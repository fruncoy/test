import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface LikedShow {
  id: string;
  name: string;
  host: string;
  time: string;
  days: string;
  image: any;
  likedAt: number;
  notificationsEnabled?: boolean;
}

const LIKED_SHOWS_KEY = '@radio47:liked_shows';
const NOTIFICATION_SETTINGS_KEY = '@radio47:notification_settings';

export async function getLikedShows(): Promise<LikedShow[]> {
  try {
    let localShows: LikedShow[] = [];
    
    // Get shows from local storage
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(LIKED_SHOWS_KEY);
      localShows = data ? JSON.parse(data) : [];
    } else {
      const data = await AsyncStorage.getItem(LIKED_SHOWS_KEY);
      localShows = data ? JSON.parse(data) : [];
    }
    
    // Try to get shows from Supabase and merge them
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get shows from Supabase
        const { data: supabaseShows, error } = await supabase
          .from('liked_shows')
          .select('*')
          .eq('user_id', user.id);
          
        if (!error && supabaseShows && supabaseShows.length > 0) {
          // Convert Supabase shows to local format
          const remoteShows = supabaseShows.map(show => ({
            id: `${show.show_name}-${show.show_time}`,
            name: show.show_name,
            host: show.show_host,
            time: show.show_time,
            days: show.show_days || '',
            image: require('../assets/images/default.png'), // Default image
            likedAt: new Date(show.created_at).getTime(),
            notificationsEnabled: show.notifications_enabled
          }));
          
          // Merge local and remote shows, preferring remote data
          const mergedShows = [...localShows];
          
          // Add remote shows that don't exist locally
          for (const remoteShow of remoteShows) {
            const localShowIndex = localShows.findIndex(show => show.id === remoteShow.id);
            
            if (localShowIndex === -1) {
              // Show doesn't exist locally, add it
              mergedShows.push(remoteShow);
            } else {
              // Show exists locally, use remote data for notifications setting
              mergedShows[localShowIndex].notificationsEnabled = remoteShow.notificationsEnabled;
            }
          }
          
          // Save merged shows back to local storage
          if (Platform.OS === 'web') {
            localStorage.setItem(LIKED_SHOWS_KEY, JSON.stringify(mergedShows));
          } else {
            await AsyncStorage.setItem(LIKED_SHOWS_KEY, JSON.stringify(mergedShows));
          }
          
          return mergedShows;
        }
      }
    } catch (error) {
      console.error('Error fetching shows from Supabase:', error);
      // Continue with local shows if there's an error with Supabase
    }
    
    return localShows;
  } catch (error) {
    console.error('Error getting liked shows:', error);
    return [];
  }
}

export async function toggleLikeShow(show: Omit<LikedShow, 'likedAt' | 'id'> & { id?: string, likedAt?: number }): Promise<boolean> {
  try {
    const likedShows = await getLikedShows();
    const showId = show.id || `${show.name}-${show.time}`;
    const isLiked = likedShows.some(s => s.id === showId);
    
    let newLikedShows;
    if (isLiked) {
      newLikedShows = likedShows.filter(s => s.id !== showId);
    } else {
      newLikedShows = [...likedShows, {
        ...show,
        id: showId,
        likedAt: show.likedAt || Date.now(),
        notificationsEnabled: true // Enable notifications by default for new liked shows
      }];
    }
    
    // Save to local storage
    if (Platform.OS === 'web') {
      localStorage.setItem(LIKED_SHOWS_KEY, JSON.stringify(newLikedShows));
    } else {
      await AsyncStorage.setItem(LIKED_SHOWS_KEY, JSON.stringify(newLikedShows));
    }
    
    // Save to Supabase if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (isLiked) {
          // Delete from Supabase if unliked
          await supabase
            .from('liked_shows')
            .delete()
            .eq('user_id', user.id)
            .eq('show_name', show.name)
            .eq('show_time', show.time);
        } else {
          // Insert into Supabase if liked
          await supabase
            .from('liked_shows')
            .upsert({
              user_id: user.id,
              show_name: show.name,
              show_host: show.host,
              show_time: show.time,
              show_days: show.days,
              notifications_enabled: true,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,show_name,show_time'
            });
        }
      }
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      // Continue despite Supabase error - local storage is primary
    }
    
    return !isLiked;
  } catch (error) {
    console.error('Error toggling show like:', error);
    return false;
  }
}

export async function isShowLiked(showName: string, showTime: string): Promise<boolean> {
  try {
    const likedShows = await getLikedShows();
    return likedShows.some(show => show.id === `${showName}-${showTime}`);
  } catch (error) {
    console.error('Error checking if show is liked:', error);
    return false;
  }
}

export async function toggleShowNotifications(showId: string): Promise<boolean> {
  try {
    const likedShows = await getLikedShows();
    const showIndex = likedShows.findIndex(s => s.id === showId);
    
    if (showIndex === -1) return false;
    
    // Toggle notification setting in local storage
    const updatedShows = [...likedShows];
    updatedShows[showIndex] = {
      ...updatedShows[showIndex],
      notificationsEnabled: !updatedShows[showIndex].notificationsEnabled
    };
    
    if (Platform.OS === 'web') {
      localStorage.setItem(LIKED_SHOWS_KEY, JSON.stringify(updatedShows));
    } else {
      await AsyncStorage.setItem(LIKED_SHOWS_KEY, JSON.stringify(updatedShows));
    }
    
    // Update notification setting in Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const show = updatedShows[showIndex];
        await supabase
          .from('liked_shows')
          .update({
            notifications_enabled: show.notificationsEnabled
          })
          .eq('user_id', user.id)
          .eq('show_name', show.name)
          .eq('show_time', show.time);
      }
    } catch (error) {
      console.error('Error updating notification setting in Supabase:', error);
      // Continue despite Supabase error - local storage is primary
    }
    
    return updatedShows[showIndex].notificationsEnabled;
  } catch (error) {
    console.error('Error toggling show notifications:', error);
    return false;
  }
}

// Get global notification settings
export async function getNotificationSettings(): Promise<{
  upcomingShows: boolean;
  newContent: boolean;
  specialEvents: boolean;
}> {
  try {
    const defaultSettings = {
      upcomingShows: true,
      newContent: true,
      specialEvents: true
    };
    
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return data ? JSON.parse(data) : defaultSettings;
    } else {
      const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return data ? JSON.parse(data) : defaultSettings;
    }
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      upcomingShows: true,
      newContent: true,
      specialEvents: true
    };
  }
}

// Update global notification settings
export async function updateNotificationSettings(settings: {
  upcomingShows?: boolean;
  newContent?: boolean;
  specialEvents?: boolean;
}): Promise<boolean> {
  try {
    const currentSettings = await getNotificationSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    
    if (Platform.OS === 'web') {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } else {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updatedSettings));
    }
    
    // Update notification settings in Supabase if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('notification_settings')
          .upsert({
            user_id: user.id,
            upcoming_shows: updatedSettings.upcomingShows,
            new_content: updatedSettings.newContent,
            special_events: updatedSettings.specialEvents,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      }
    } catch (error) {
      console.error('Error updating notification settings in Supabase:', error);
      // Continue despite Supabase error - local storage is primary
    }
    
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
}