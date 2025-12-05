import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import CustomButton from '../components/CustomButton';
import CustomTimePickerModal from '../components/CustomTimePickerModal';

export default function AddVisitScreen({ navigation }) {
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [timeToStart, setTimeToStart] = useState(new Date());
  const [timeToComplete, setTimeToComplete] = useState('');
  const [date, setDate] = useState('');
  const [visitName, setVisitName] = useState('');
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);

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
      await addDoc(visitsCollection, {
        store_name: storeName,
        location: location,
        task_title: taskTitle,
        time_to_start: timeToStart.toISOString(),
        time_to_complete: parseInt(timeToComplete, 10),
        date: date,
        completed: false,
        visit_name: visitName,
      });
      Alert.alert('Success', 'Visit added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add visit');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Add a New Visit</Text>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="Enter store name"
        />
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location (e.g., city name)"
        />
        <Text style={styles.label}>Task Title</Text>
        <TextInput
          style={styles.input}
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="Enter task title"
        />
        <Text style={styles.label}>Time to Start</Text>
        <TouchableOpacity
          style={[styles.input, { justifyContent: 'center' }]} // Added missing closing bracket
          onPress={() => setShowCustomTimePicker(true)}>
          <Text style={{ color: '#211C1F' }}>
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
        />
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="Enter date (e.g., YYYY-MM-DD)"
        />
        <Text style={styles.label}>Visit Name</Text>
        <TextInput
          style={styles.input}
          value={visitName}
          onChangeText={setVisitName}
          placeholder="Enter visit name"
          placeholderTextColor="#ADB9E3"
        />
        <CustomButton
          title="Add Visit"
          onPress={handleAddVisit}
          style={{ backgroundColor: '#211C1F', marginTop: 20 }}
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
    backgroundColor: '#E6DFDB', // Light color for background
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F', // Dark color for header text
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#211C1F', // Dark color for text
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ADB9E3', // Accent color for borders
    borderRadius: 5,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#FFFFFF', // White color for input background
    color: '#211C1F', // Dark color for input text
  },
  button: {
    backgroundColor: '#211C1F', // Dark color for button background
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#E6DFDB', // Light color for button text
    fontSize: 16,
    fontWeight: 'bold',
  },
  timePicker: {
    backgroundColor: '#E6DFDB', // Light color for background
    borderRadius: 5,
    marginBottom: 16,
  },
});
