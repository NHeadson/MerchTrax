import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import CustomButton from '../components/CustomButton';
import CustomTimePickerModal from '../components/CustomTimePickerModal';
import CustomDatePicker from '../components/CustomDatePicker';

export default function AddVisitScreen({ navigation }) {
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [timeToStart, setTimeToStart] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    return now;
  });
  const [timeToComplete, setTimeToComplete] = useState('');
  const [date, setDate] = useState(''); // Stores string "YYYY-MM-DD"
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // HELPER 1: Convert Date Object -> Local String "YYYY-MM-DD"
  // This replaces toISOString() to prevent UTC shifting
  const formatLocalDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // HELPER 2: Convert String "YYYY-MM-DD" -> Date Object (Local Time)
  // This prevents new Date("string") from assuming UTC
  const parseLocalDate = (dateString) => {
    if (!dateString) return new Date();
    // Split "2025-01-15" into parts
    const [y, m, d] = dateString.split('-').map(Number);
    // Create date using Local Time constructor (Month is 0-indexed)
    return new Date(y, m - 1, d);
  };

  const handleAddVisit = async () => {
    if (
      !storeName ||
      !location ||
      !taskTitle ||
      !timeToStart ||
      !timeToComplete ||
      !date
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const visitsCollection = collection(db, 'visits');

      // Format time_to_start as "HH:MM"
      const hours = String(timeToStart.getHours()).padStart(2, '0');
      const minutes = String(timeToStart.getMinutes()).padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;

      await addDoc(visitsCollection, {
        store_name: storeName,
        location: location,
        task_title: taskTitle,
        title: `${storeName} - ${taskTitle}`,
        time_to_start: formattedTime,
        allotted_minutes: parseInt(timeToComplete, 10),
        date: date, // This is now a safe Local string "YYYY-MM-DD"
        completed: false,
      });
      Alert.alert('Success', 'Visit added successfully');

      // Clear form
      setStoreName('');
      setLocation('');
      setTaskTitle('');
      setTimeToStart(new Date());
      setTimeToComplete('');
      setDate(new Date().toISOString().split('T')[0]);

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add visit');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="Enter store name"
          placeholderTextColor="#ADB9E3"
        />
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location (e.g., city name)"
          placeholderTextColor="#ADB9E3"
        />
        <Text style={styles.label}>Task Title</Text>
        <TextInput
          style={styles.input}
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="Enter task title"
          placeholderTextColor="#ADB9E3"
        />
        <Text style={styles.label}>Time to Start</Text>
        <TouchableOpacity
          style={[styles.input, { justifyContent: 'center' }]}
          onPress={() => setShowCustomTimePicker(true)}>
          <Text style={styles.time}>
            {timeToStart.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
        <CustomTimePickerModal
          value={timeToStart}
          onChange={setTimeToStart}
          visible={showCustomTimePicker}
          onClose={() => setShowCustomTimePicker(false)}
        />
        <Text style={styles.label}>Time to Complete (in minutes)</Text>
        <TextInput
          style={styles.input}
          value={timeToComplete}
          onChangeText={setTimeToComplete}
          placeholder="Enter time to complete (e.g., 30)"
          keyboardType="numeric"
          placeholderTextColor="#ADB9E3"
        />

        {/* --- FIXED DATE SECTION --- */}
        <Text style={styles.label}>Date</Text>
        <CustomDatePicker
          // FIX 1: Use the helper to parse the string safely back to an Object
          value={parseLocalDate(date)}
          // FIX 2: Use the helper to format the object safely to a String
          onChange={(selectedDate) => {
            const localDateString = formatLocalDate(selectedDate);
            setDate(localDateString);
          }}
          visible={showCustomDatePicker}
          onClose={() => setShowCustomDatePicker(false)}
          style={styles.input}
          textStyle={{ color: '#211C1F' }}
        />
        {/* -------------------------- */}

        <CustomButton
          title="Add Visit"
          onPress={handleAddVisit}
          accessibilityLabel="Add a new visit"
          style={{
            backgroundColor: '#211C1F',
            marginTop: 20,
            marginBottom: 80,
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E6DFDB',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  time: {
    fontSize: 16,
    color: '#211C1F',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#211C1F',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ADB9E3',
    borderRadius: 5,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#211C1F',
  },
  button: {
    backgroundColor: '#211C1F',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#E6DFDB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timePicker: {
    backgroundColor: '#E6DFDB',
    borderRadius: 5,
    marginBottom: 16,
  },
});
