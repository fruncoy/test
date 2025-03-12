import { StyleSheet, View, Text, Pressable, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatFloatingButtonProps {
  currentShow: {
    name: string;
    host: string;
  };
}

export default function ChatFloatingButton({ currentShow }: ChatFloatingButtonProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const scale = useSharedValue(1);
  const tooltipOpacity = useSharedValue(0);

  useEffect(() => {
    // Show tooltip periodically
    const interval = setInterval(() => {
      if (!isOpen) {
        tooltipOpacity.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }, () => {
            'worklet';
            tooltipOpacity.value = 0;
          })
        );
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    setIsOpen(!isOpen);
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [
      { translateY: withSpring(tooltipOpacity.value === 0 ? 10 : 0) }
    ]
  }));

  return (
    <>
      <View style={[styles.container, { bottom: 20 + insets.bottom }]}>
        <Animated.View style={[styles.tooltip, tooltipStyle]}>
          <Text style={styles.tooltipText}>
            Chat about {currentShow.name}!
          </Text>
        </Animated.View>
        
        <Animated.View style={[styles.button, buttonStyle]}>
          <Pressable 
            onPress={handlePress}
            style={styles.pressable}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 28 }}
          >
            <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{currentShow.name}</Text>
            <Pressable 
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <Ionicons name="close" size={24} color="#1E3EA1" />
            </Pressable>
          </View>
          
          <View style={styles.chatContainer}>
            <Text style={styles.comingSoonText}>
              Chat feature coming soon!
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  tooltip: {
    backgroundColor: '#1E3EA1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3EA1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3EA1',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  }
});