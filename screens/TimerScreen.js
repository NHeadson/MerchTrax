import React from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CountdownTimer from '../components/CountdownTimer';

export default function TimerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { visitData, initialSeconds } = route.params || {};
  const [resetTrigger, setResetTrigger] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const handleTimerEnd = () => {
    Alert.alert(
      'Timer Complete!',
      `Time's up for: ${visitData?.title || 'your visit'}`,
      [{ text: 'OK' }]
    );
  };

  const handleRestart = () => {
    setResetTrigger((prev) => prev + 1);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleEnd = () => {
    Alert.alert('End Timer', 'Are you sure you want to end this timer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  if (!visitData || !initialSeconds) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No visit data provided</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.visitTitle}>{visitData.title}</Text>
      <Text style={styles.location}>{visitData.location}</Text>
      <CountdownTimer
        initialSeconds={initialSeconds}
        onTimerEnd={handleTimerEnd}
        resetTrigger={resetTrigger}
        paused={isPaused}
      />
      <Text style={[styles.instruction, isPaused && styles.pausedText]}>
        {isPaused ? 'Timer Paused' : 'Timer will alert when time is up!'}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.restartButton}
          onPress={handleRestart}>
          <Ionicons
            name="refresh"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={handlePauseResume}>
          <Ionicons
            name={isPaused ? 'play' : 'pause'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEnd}>
          <Ionicons
            name="stop"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6DFDB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  visitTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 10,
    textAlign: 'center',
  },
  location: {
    fontSize: 18,
    color: '#211C1F',
    marginBottom: 30,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#211C1F',
    marginTop: 30,
    textAlign: 'center',
  },
  pausedText: {
    color: '#211C1F',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 0,
  },
  restartButton: {
    backgroundColor: '#ADB9E3',
    padding: 15,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#C68080',
    padding: 15,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: 'rgba(220, 20, 60, 0.8)',
    padding: 15,
    borderRadius: 8,
    width: 100,
    alignItems: 'center',
  },
});
