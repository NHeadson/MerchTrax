import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './components/Navigation';
import { StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { COLORS } from './theme';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// COLORS provided via theme.js

export default function App() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Clear badge when app comes to foreground
        Notifications.setBadgeCountAsync(0);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.light} // Updated to use COLORS
          />
          <Navigation />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
});
