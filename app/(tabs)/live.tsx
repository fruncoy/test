import { StyleSheet, View, Text, ScrollView, Platform, useWindowDimensions, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import Header from '../../components/Header';
import ShowsCarousel from '../../components/ShowsCarousel';
import LoadingDots from '../../components/LoadingDots';
import ChatFloatingButton from '../../components/ChatFloatingButton';
import { pauseAudio, isAudioPlaying } from '../../components/AudioPlayer';
import { getCurrentShow, getUpcomingShows } from '../../utils/shows';

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const playerHeight = Math.max(windowHeight - 300, 400);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentShow, setCurrentShow] = useState(getCurrentShow());
  const [upcomingShows, setUpcomingShows] = useState(getUpcomingShows());
  const [streamStatus, setStreamStatus] = useState('loading');
  const webViewRef = useRef(null);

  // Update shows periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShow(getCurrentShow());
      setUpcomingShows(getUpcomingShows());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async () => {
    // If radio is playing, pause it first
    if (isAudioPlaying) {
      await pauseAudio();
    }
    
    setIsPlaying(!isPlaying);
    
    // If we're on native platforms and have a webview reference
    if (Platform.OS !== 'web' && webViewRef.current) {
      const script = isPlaying 
        ? 'document.querySelector("video")?.pause();'
        : 'document.querySelector("video")?.play();';
      
      // @ts-ignore
      webViewRef.current.injectJavaScript(script);
    }
  };

  // Fallback stream URLs
  const streamUrls = [
    'https://player.restream.io/?token=85a050dea0e3494d97933e93ec53aeb7',
    'https://www.youtube.com/embed/live_stream?channel=UCUfYGqOF_mxPwnzH7esDm7A&autoplay=1',
    'https://www.youtube.com/embed/_DVooa4ZH1A?autoplay=1'
  ];
  
  // Selected stream URL - using the YouTube embed as it's more reliable
  const streamUrl = streamUrls[1];

  const renderWebEmbed = () => {
    return (
      <iframe
        src={streamUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#000',
        }}
        allow="autoplay; camera; microphone; fullscreen; picture-in-picture"
        allowFullScreen
        title="Radio 47 Live Stream"
      />
    );
  };

  const renderNativeWebView = () => {
    return (
      <WebView
        ref={webViewRef}
        source={{ uri: streamUrl }}
        style={styles.webView}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadStart={() => {
          setStreamStatus('loading');
          setIsLoading(true);
        }}
        onLoadEnd={() => {
          setStreamStatus('online');
          setIsLoading(false);
        }}
        onError={() => {
          setStreamStatus('offline');
          setIsLoading(false);
        }}
        originWhitelist={['*']}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <Text style={styles.loadingText}>Loading stream...</Text>
          </View>
        )}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      />
    );
  };

  const renderStreamContent = () => {
    if (!isPlaying) {
      return (
        <View style={styles.offlineContainer}>
          <Image
            source={currentShow.image}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={[StyleSheet.absoluteFill, styles.gradient]}
          />
          <View style={styles.offlineContent}>
            <Ionicons name="tv-outline" size={48} color="white" />
            <Text style={styles.offlineText}>Tap play to watch livestream</Text>
          </View>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return renderWebEmbed();
    }

    return (
      <View style={styles.webViewContainer}>
        {renderNativeWebView()}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.playerCard, { height: playerHeight }]}>
          {renderStreamContent()}
          <View style={styles.playerOverlay}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={[StyleSheet.absoluteFill, styles.playerGradient]}
            />
            <View style={styles.playerControls}>
              <View style={styles.showDetails}>
                <Text style={styles.currentShowName}>Now Playing: {currentShow.name}</Text>
                <Text style={styles.currentShowHost}>{currentShow.host}</Text>
                {streamStatus === 'offline' && isPlaying && (
                  <View style={styles.offlineIndicator}>
                    <Text style={styles.offlineIndicatorText}>Stream is currently offline</Text>
                  </View>
                )}
                {isLoading && isPlaying && (
                  <View style={styles.loadingIndicator}>
                    <Text style={styles.loadingIndicatorText}>Loading stream...</Text>
                  </View>
                )}
              </View>
              <Pressable 
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="white" 
                />
              </Pressable>
            </View>
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
      <ChatFloatingButton currentShow={currentShow} />
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
    paddingHorizontal: 20,
  },
  playerCard: {
    width: '100%',
    backgroundColor: '#1E3EA1',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  webViewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  offlineContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3EA1',
  },
  offlineContent: {
    alignItems: 'center',
    gap: 16,
  },
  offlineText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  gradient: {
    height: '100%',
  },
  playerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  playerGradient: {
    height: 200,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  showDetails: {
    flex: 1,
    marginRight: 20,
  },
  currentShowName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentShowHost: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 16,
  },
  offlineIndicator: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  offlineIndicatorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingIndicator: {
    backgroundColor: 'rgba(255, 222, 45, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingIndicatorText: {
    color: '#FFDE2D',
    fontSize: 14,
    fontWeight: '600',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  upcomingSection: {
    backgroundColor: 'rgba(30, 62, 161, 0.05)',
    borderTopLeftRadius: 20,
    marginHorizontal: -20,
    marginTop: 30,
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