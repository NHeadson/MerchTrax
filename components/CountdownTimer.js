import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CountdownTimer({
  initialSeconds,
  onTimerEnd,
  resetTrigger,
  paused,
}) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Reset timer when resetTrigger changes
  React.useEffect(() => {
    setSeconds(initialSeconds);
  }, [resetTrigger, initialSeconds]);

  useEffect(() => {
    if (seconds > 0 && !paused) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (seconds === 0 && onTimerEnd && !paused) {
      onTimerEnd();
    }
  }, [seconds, onTimerEnd, paused]);

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
