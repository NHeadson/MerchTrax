import React from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountdownTimer from '../components/CountdownTimer';

export default function TimerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { visitData, initialSeconds } = route.params || {};
  const [resetTrigger, setResetTrigger] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  // Check if timer should have ended when screen loads
  React.useEffect(() => {
    const checkTimerCompletion = async () => {
      try {
        const storedData = await AsyncStorage.getItem('merchTrax_timer_data');
        if (storedData && visitData) {
          const { endTime, paused } = JSON.parse(storedData);
          const now = Date.now();

          if (endTime && !paused && now >= endTime) {
            // Timer should have ended while app was closed
            // Don't show alert here - it was already shown via push notification
            // Just clear the stored data
            await AsyncStorage.removeItem('merchTrax_timer_data');
          }
        }
      } catch (error) {
        console.error('Error checking timer completion:', error);
      }
    };

    if (visitData && initialSeconds) {
      checkTimerCompletion();
    }
  }, [visitData, initialSeconds]);

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
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="timer-outline"
            size={80}
            color="#ADB9E3"
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateTitle}>No Active Timer</Text>
          <Text style={styles.emptyStateMessage}>
            Start a visit timer from your scheduled visits to begin tracking
            time.
          </Text>
          <TouchableOpacity
            style={styles.selectVisitButton}
            onPress={() => navigation.navigate('Visits')}>
            <Ionicons
              name="list"
              size={20}
              color="#211C1F"
            />
            <Text style={styles.selectVisitButtonText}>Select a Visit</Text>
          </TouchableOpacity>
        </View>
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
        visitTitle={visitData.title}
        onPauseChange={setIsPaused}
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#211C1F',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  selectVisitButton: {
    backgroundColor: '#ADB9E3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  selectVisitButtonText: {
    color: '#211C1F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
