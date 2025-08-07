import { View, Text, ActivityIndicator, Image, StyleSheet } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/mobilfit_logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>MobilFit 로딩 중...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 120,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'Cafe24',
  },
  tagline: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 40,
    textAlign: 'center',
  },
});