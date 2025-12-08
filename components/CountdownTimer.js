import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function CountdownTimer({
  initialSeconds,
  onTimerEnd,
  resetTrigger,
  paused,
  visitTitle = 'your visit',
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [endTime, setEndTime] = useState(null);
  const [notificationId, setNotificationId] = useState(null);

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
  const scheduleNotification = async (endTime, title) => {
    try {
      // Cancel any existing notification first
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        setNotificationId(null);
      }

      const now = Date.now();
      const timeUntilEnd = endTime - now;

      // Only schedule if there's at least 3 seconds remaining
      if (timeUntilEnd > 3000) {
        const delaySeconds = Math.ceil(timeUntilEnd / 1000);

        console.log('Scheduling notification:', {
          endTime,
          now,
          timeUntilEnd,
          delaySeconds,
          title,
        });
        const newNotificationId = await Notifications.scheduleNotificationAsync(
          {
            content: {
              title: 'Timer Complete!',
              body: `Time's up for: ${title}`,
              sound: 'default',
            },
            trigger: {
              seconds: delaySeconds,
            },
          }
        );

        setNotificationId(newNotificationId);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // Cancel notification
  const cancelNotification = async () => {
    if (notificationId) {
      console.log('Cancelling notification:', notificationId);
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      setNotificationId(null);
    }
  };

  // Load timer data from storage on mount
  useEffect(() => {
    loadTimerData();
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

        if (storedEndTime && !storedPaused) {
          const remainingTime = Math.max(
            0,
            Math.floor((storedEndTime - now) / 1000)
          );
          setSeconds(remainingTime);
          setEndTime(storedEndTime);

          // If timer should have ended while app was closed
          if (remainingTime === 0 && onTimerEnd) {
            onTimerEnd();
          }
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
  };

  // Reset timer when resetTrigger changes
  React.useEffect(() => {
    setSeconds(initialSeconds);
    cancelNotification(); // Cancel any existing notification

    if (initialSeconds > 0 && !paused) {
      const newEndTime = Date.now() + initialSeconds * 1000;
      setEndTime(newEndTime);
      // Don't schedule notification immediately - let the timer logic handle it
    } else {
      setEndTime(null);
    }
  }, [resetTrigger, initialSeconds, paused]);

  // Handle pause/resume - only schedule notification when actively running and stable
  useEffect(() => {
    if (paused) {
      cancelNotification();
    } else if (endTime && seconds > 0 && seconds < initialSeconds) {
      // Only schedule if timer is running, has time left, and has already started counting down
      const now = Date.now();
      if (endTime > now + 3000) {
        // At least 3 seconds remaining
        scheduleNotification(endTime, visitTitle);
      }
    }
  }, [paused, endTime, seconds, initialSeconds]);

  useEffect(() => {
    if (seconds > 0 && !paused && endTime) {
      const now = Date.now();
      const timeUntilEnd = endTime - now;

      if (timeUntilEnd > 0) {
        const timer = setTimeout(() => {
          const newSeconds = Math.max(
            0,
            Math.floor((endTime - Date.now()) / 1000)
          );
          setSeconds(newSeconds);

          if (newSeconds === 0 && onTimerEnd) {
            onTimerEnd();
            cancelNotification();
          }
        }, Math.min(1000, timeUntilEnd));
        return () => clearTimeout(timer);
      } else {
        // Timer should have ended
        setSeconds(0);
        setEndTime(null);
        cancelNotification();
        if (onTimerEnd) {
          onTimerEnd();
        }
      }
    }
  }, [seconds, onTimerEnd, paused, endTime]);

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
