import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Radio 47</Text>
      <Text style={styles.subtitle}>Hapa Ndipo!</Text>
      <Link href="/(tabs)" style={styles.link}>
        <Text style={styles.linkText}>Enter App</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3EA1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#FFDE2D',
    marginBottom: 32,
  },
  link: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  linkText: {
    color: '#1E3EA1',
    fontSize: 18,
    fontWeight: 'bold',
  },
});