import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import CountdownTimer from '../components/CountdownTimer';
import { COLORS } from '../theme';

export default function TimerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { visitData, initialSeconds } = route.params || {};
  const [resetTrigger, setResetTrigger] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showCompletionModal, setShowCompletionModal] = React.useState(false);

  // FIX: Reset pause state every time the screen comes into focus with new data
  useFocusEffect(
    React.useCallback(() => {
      // When the screen is focused, if it has timer data, it should not be paused.
      if (visitData && initialSeconds) {
        setIsPaused(false);
      }
    }, [visitData, initialSeconds])
  );

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

  const handleTimerEnd = async () => {
    // Pause timer and clear stored timer data
    setIsPaused(true);
    try {
      await AsyncStorage.removeItem('merchTrax_timer_data');
    } catch (error) {
      console.error('Error clearing timer data:', error);
    }
    setShowCompletionModal(true);
  };

  const handleCompletionNo = async () => {
    setShowCompletionModal(false);
    // Clear the timer parameters for this screen
    navigation.setParams({ visitData: null, initialSeconds: null });
    // Navigate to the Visits tab
    navigation.navigate('Visits');
  };

  const handleCompletionYes = async () => {
    if (visitData) {
      try {
        const visitRef = doc(db, 'visits', visitData.id);
        await updateDoc(visitRef, {
          completed: true,
          completedAt: new Date().toISOString(),
        });
        console.log('Visit marked as complete');

        // Clear the timer state before navigating
        navigation.setParams({ visitData: null, initialSeconds: null });

        // Navigate to History screen
        navigation.navigate('History');
      } catch (error) {
        console.error('Error updating visit:', error);
        Alert.alert('Error', 'Could not complete the visit. Please try again.');
      }
    }
    setShowCompletionModal(false);
  };

  const handleRestart = () => {
    // Ensure the timer is not paused when restarting
    setIsPaused(false);
    setResetTrigger((prev) => prev + 1);
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleEnd = async () => {
    try {
      // Clear timer data from storage
      await AsyncStorage.removeItem('merchTrax_timer_data');

      // Reset navigation to the Visits screen, clearing the stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Visits' }],
      });
      // Clear the specific timer from this screen
      navigation.setParams({ visitData: null, initialSeconds: null });
    } catch (error) {
      console.error('Error clearing timer data:', error);
      // Still attempt to navigate away on error
      navigation.reset({
        index: 0,
        routes: [{ name: 'Visits' }],
      });
      navigation.setParams({ visitData: null, initialSeconds: null });
    }
  };

  if (!visitData || !initialSeconds) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="timer-outline"
            size={80}
            color={COLORS.accent2}
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
              color={COLORS.dark}
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

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons
                name="checkmark-circle"
                size={60}
                color={COLORS.accent}
              />
            </View>
            <Text style={styles.modalTitle}>Time's Up!</Text>
            <Text style={styles.modalSubtitle}>
              {visitData?.title || 'your visit'}
            </Text>
            <Text style={styles.modalMessage}>Was the visit completed?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonNo]}
                onPress={handleCompletionNo}>
                <Text style={styles.modalButtonTextNo}>No, Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonYes]}
                onPress={handleCompletionYes}>
                <Text style={styles.modalButtonTextYes}>Yes, Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#E6DFDB',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#43DABC',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonNo: {
    backgroundColor: '#ADB9E3',
  },
  modalButtonYes: {
    backgroundColor: '#43DABC',
  },
  modalButtonTextNo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#211C1F',
  },
  modalButtonTextYes: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
