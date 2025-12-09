import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function CountdownTimer({
  initialSeconds,
  onTimerEnd,
  resetTrigger,
  paused,
  visitTitle = 'your visit',
  onPauseChange,
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [endTime, setEndTime] = useState(null);
  const [notificationId, setNotificationId] = useState(null);
  const [persistentNotificationId, setPersistentNotificationId] =
    useState(null);
  const timeoutRef = useRef(null);
  const timerEndedRef = useRef(false);
  const notificationScheduledRef = useRef(false);

  // Function to handle countdown tick
  const tick = useCallback(() => {
    setSeconds((currentSeconds) => {
      if (currentSeconds > 0 && endTime && !paused) {
        const now = Date.now();
        const timeUntilEnd = endTime - now;

        if (timeUntilEnd > 1000) {
          // More than 1 second remaining
          const newSeconds = Math.max(0, Math.floor(timeUntilEnd / 1000));

          // Schedule next tick
          timeoutRef.current = setTimeout(() => tick(), 1000);

          return newSeconds;
        } else if (timeUntilEnd > 0) {
          // Less than 1 second but not ended, schedule final tick
          timeoutRef.current = setTimeout(
            () => tick(),
            Math.floor(timeUntilEnd)
          );
          return currentSeconds;
        } else {
          // Timer ended
          cancelNotification();
          cancelPersistentNotification();
          setEndTime(null);

          // Only call onTimerEnd once
          if (!timerEndedRef.current && onTimerEnd) {
            timerEndedRef.current = true;
            // Call the callback (shows alert in app)
            onTimerEnd();
          }
          return 0;
        }
      }
      return currentSeconds;
    });
  }, [endTime, paused, onTimerEnd, visitTitle]);

  // Storage key for timer persistence
  const TIMER_STORAGE_KEY = 'merchTrax_timer_data';

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
    }
  };

  // Schedule notification when timer starts
  const scheduleNotification = useCallback(
    async (endTime, title) => {
      try {
        // Cancel any existing notification first
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          setNotificationId(null);
        }

        // Schedule notification for when timer ends using absolute timestamp
        if (endTime) {
          const newNotificationId =
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Timer Complete!',
                body: `Time's up for: ${title}`,
                sound: true,
                badge: 1,
                priority: 'high',
                vibrate: [0, 250, 250, 250], // Vibration pattern: off, vibrate, off, vibrate
              },
              trigger: {
                type: 'date',
                date: new Date(endTime), // Use absolute timestamp, not relative seconds
              },
            });

          setNotificationId(newNotificationId);
        }
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    },
    [notificationId]
  );

  // Cancel notification
  const cancelNotification = async () => {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      setNotificationId(null);
    }
  };

  // Send multiple notifications to simulate an alarm
  const sendMultipleNotifications = async (title, timerEndTime) => {
    try {
      // Send 10 notifications starting at timer end time with 500ms delay between each
      for (let i = 0; i < 10; i++) {
        const notificationTime = new Date(timerEndTime + i * 500);
        const content = {
          title: 'Timer Complete!',
          body: `Time's up for: ${title}`,
          sound: true,
          priority: 'high',
          vibrate: [0, 250, 250, 250],
        };

        // Only add badge to first notification
        if (i === 0) {
          content.badge = 1;
        }

        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: 'date',
            date: notificationTime,
          },
          identifier: `timer-complete-${i}`,
        });
      }
    } catch (error) {
      console.error('Error sending multiple notifications:', error);
    }
  };

  // Update persistent notification for lock screen
  const updatePersistentNotification = async (
    remainingSeconds,
    title,
    isPaused = false
  ) => {
    try {
      // Don't create new notifications every second - only for initial display
      // This prevents spam on the lock screen
      if (
        remainingSeconds > 0 &&
        (remainingSeconds === initialSeconds || isPaused)
      ) {
        // Only show on initial start or when paused
        const minutes = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;
        const statusText = isPaused ? 'PAUSED' : 'RUNNING';

        // Don't use presentNotificationAsync - it creates too many notifications
        // The scheduled notification at timer end is sufficient
      } else if (remainingSeconds === 0) {
        // Clear when done
        if (persistentNotificationId) {
          try {
            await Notifications.dismissNotificationAsync(
              persistentNotificationId
            );
          } catch (e) {
            // Ignore if already dismissed
          }
          setPersistentNotificationId(null);
        }
      }
    } catch (error) {
      console.error('Error updating persistent notification:', error);
    }
  };

  // Cancel persistent notification
  const cancelPersistentNotification = async () => {
    if (persistentNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        persistentNotificationId
      );
      setPersistentNotificationId(null);
    }
  };

  // Cleanup notifications on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancelNotification();
      cancelPersistentNotification();
    };
  }, []);

  // Save timer data whenever seconds or paused state changes
  useEffect(() => {
    saveTimerData();
  }, [seconds, paused, endTime]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  const loadTimerData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
      if (storedData) {
        const { storedEndTime, storedPaused } = JSON.parse(storedData);
        const now = Date.now();

        if (storedEndTime) {
          const remainingTime = Math.max(
            0,
            Math.floor((storedEndTime - now) / 1000)
          );
          setSeconds(remainingTime);
          setEndTime(storedEndTime);

          // Don't call onTimerEnd here - the scheduled notification will handle it
          // Only update the UI display
        }
      }
    } catch (error) {
      console.error('Error loading timer data:', error);
    }
  };

  const saveTimerData = async () => {
    try {
      if (endTime && !paused) {
        const dataToStore = {
          endTime: endTime,
          paused: paused,
        };
        await AsyncStorage.setItem(
          TIMER_STORAGE_KEY,
          JSON.stringify(dataToStore)
        );
      } else {
        // Clear stored data if timer is paused or reset
        await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving timer data:', error);
    }
  };

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      // App came back to foreground, recalculate remaining time
      loadTimerData();
    }
    // Don't auto-pause on background - let the parent component manage pause state
  };

  // Reset timer when resetTrigger changes
  React.useEffect(() => {
    setSeconds(initialSeconds);
    cancelNotification(); // Cancel any existing notification
    cancelPersistentNotification(); // Cancel persistent notification
    timerEndedRef.current = false; // Reset the timer end flag
    notificationScheduledRef.current = false; // Reset notification scheduled flag

    if (initialSeconds > 0) {
      const newEndTime = Date.now() + initialSeconds * 1000;
      setEndTime(newEndTime);
    } else {
      setEndTime(null);
    }
  }, [resetTrigger, initialSeconds]);

  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      cancelNotification();
    } else if (endTime && seconds > 0 && !notificationScheduledRef.current) {
      // Schedule multiple notifications upfront when timer starts
      sendMultipleNotifications(visitTitle, endTime);
      notificationScheduledRef.current = true;
    } else if (!endTime || seconds === 0) {
      cancelPersistentNotification();
    }
  }, [paused, endTime, visitTitle]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Start timer if conditions are met
    if (seconds > 0 && !paused && endTime) {
      // Schedule first tick in 1 second
      timeoutRef.current = setTimeout(() => tick(), 1000);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [paused, endTime, tick]); // Depend on tick function which has proper dependencies

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(seconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
});
