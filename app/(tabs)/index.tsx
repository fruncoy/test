import { StyleSheet, View } from 'react-native';
import Header from '../../components/Header';
import AudioPlayer from '../../components/AudioPlayer';
import ChatFloatingButton from '../../components/ChatFloatingButton';
import { getCurrentShow } from '../../utils/shows';

export default function HomeScreen() {
  // Get the current show
  const currentShow = getCurrentShow();
  
  return (
    <View style={styles.container}>
      <Header />
      <AudioPlayer />
      <ChatFloatingButton currentShow={currentShow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});