import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Platform } from 'react-native'; // Cleaned up imports
import { Picker } from '@react-native-picker/picker';

export default function CustomDatePickerModal({
  value,
  onChange,
  visible,
  onClose,
}) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    // If value exists, parse it. If not, default to now.
    const targetDate = value || new Date();
    setSelectedYear(targetDate.getFullYear());
    setSelectedMonth(targetDate.getMonth());
    setSelectedDay(targetDate.getDate());
  }, [value]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Simple array 1-31
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // FIX: Start with current year and go forward 5 years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear + i);
  }, []);

  const handleConfirm = () => {
    // Create the date using Local Time arguments (Year, Month Index, Day Number)
    // This prevents the UTC timezone shift.
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Optional: Lock to noon to be extra safe against Daylight Savings shifts, 
    // but the constructor above usually solves it.
    selectedDate.setHours(12, 0, 0, 0); 

    onChange(selectedDate);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select Date</Text>
          <View style={styles.pickerContainer}>
            
            {/* MONTH PICKER */}
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              mode="dialog">
              {months.map((month, index) => (
                <Picker.Item
                  key={index}
                  label={month}
                  value={index} // 0 = Jan, 11 = Dec. This is correct.
                />
              ))}
            </Picker>

            {/* DAY PICKER */}
            <Picker
              selectedValue={selectedDay}
              onValueChange={(itemValue) => setSelectedDay(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              mode="dialog">
              {days.map((day, index) => (
                <Picker.Item
                  key={index}
                  label={day}
                  // FIX: Use 'index + 1' so value is 1-31, not 0-30
                  value={index + 1} 
                />
              ))}
            </Picker>

            {/* YEAR PICKER */}
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}>
              {years.map((year) => (
                <Picker.Item
                  key={year}
                  label={year.toString()}
                  value={year}
                />
              ))}
            </Picker>
          </View>
          
          <View style={styles.buttonContainer}>
            <Text style={styles.button} onPress={onClose}>
              Cancel
            </Text>
            <Text style={styles.button} onPress={handleConfirm}>
              Confirm
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 25,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 10,
    height: Platform.OS === 'ios' ? 80 : 60,
    overflow: 'hidden',
  },
  picker: {
    width: Platform.OS === 'ios' ? 100 : 120,
    height: Platform.OS === 'ios' ? 80 : 60,
    borderRadius: 10,
    marginHorizontal: 5,
    paddingBottom: Platform.OS === 'ios' ? 210 : 0,
    overflow: 'hidden',
  },
  pickerItem: {
    fontSize: Platform.OS === 'ios' ? 16 : 20,
    color: '#211C1F',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#211C1F',
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    overflow: 'hidden', // Ensures borderRadius works on Text on Android
  },
});
