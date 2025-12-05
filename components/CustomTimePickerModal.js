import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function CustomTimePickerModal({
  value,
  onChange,
  visible,
  onClose,
}) {
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(0); // Default to 00 minutes
  const [amPm, setAmPm] = useState(value.getHours() >= 12 ? 'PM' : 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // Generate increments of 5 minutes

  const handleConfirm = () => {
    const newDate = new Date(value);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    onChange(newDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select Time</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedHour % 12 || 12} // Convert to 12-hour format
              onValueChange={(itemValue) =>
                setSelectedHour(amPm === 'PM' ? itemValue + 12 : itemValue)
              }
              style={styles.picker}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                <Picker.Item
                  key={hour}
                  label={hour.toString()}
                  value={hour}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
            <Text style={styles.separator}>:</Text>
            <Picker
              selectedValue={selectedMinute}
              onValueChange={(itemValue) => setSelectedMinute(itemValue)}
              style={styles.picker}>
              {minutes.map((minute) => (
                <Picker.Item
                  key={minute}
                  label={minute.toString().padStart(2, '0')}
                  value={minute}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
          </View>
          <View style={styles.amPmContainer}>
            <TouchableOpacity
              style={[styles.amPmButton, amPm === 'AM' && styles.selectedAmPm]}
              onPress={() => {
                setAmPm('AM');
                if (selectedHour >= 12) setSelectedHour(selectedHour - 12);
              }}>
              <Text style={styles.amPmText}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.amPmButton, amPm === 'PM' && styles.selectedAmPm]}
              onPress={() => {
                setAmPm('PM');
                if (selectedHour < 12) setSelectedHour(selectedHour + 12);
              }}>
              <Text style={styles.amPmText}>PM</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleConfirm}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay for better contrast
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF', // White background for a cleaner look
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Add elevation for Android
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#211C1F', // Dark color for text
    marginBottom: 15,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly', // Distribute space evenly between hour and minute dropdowns
    marginBottom: 20,
  },
  picker: {
    width: 100, // Increased width to accommodate two-digit values
    height: 60, // Compact height for dropdowns
    backgroundColor: '#F5F5F5', // Light gray for picker background
    borderRadius: 10,
    marginHorizontal: 10, // Increased spacing between dropdowns
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    textAlign: 'center', // Ensure text is horizontally centered
    paddingRight: 3, // Further reduced padding to prevent value cutoff
    paddingLeft: 3, // Ensure symmetry in padding
    overflow: 'visible', // Prevent text from being truncated
  },
  pickerItem: {
    textAlign: 'center', // Ensure picker item text is centered
    justifyContent: 'center', // Center content vertically within the picker item
    fontSize: 20, // Increased font size for better readability of two-digit values
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F', // Dark color for text
  },
  amPmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  amPmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#E6DFDB', // Light color for unselected items
  },
  selectedAmPm: {
    backgroundColor: '#ADB9E3', // Accent color for selected items
  },
  amPmText: {
    fontSize: 16,
    color: '#211C1F', // Dark color for text
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#211C1F', // Dark color for buttons
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF', // White color for button text
    fontSize: 16,
    fontWeight: 'bold',
  },
});
