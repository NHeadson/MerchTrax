import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CustomTimePicker({
  value,
  onChange,
  style,
  textStyle,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handlePickerChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
    setShowPicker(false); // Close the picker
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={styles.button}>
        <Text style={[styles.text, textStyle]}>
          {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          onChange={handlePickerChange}
          textColor="#211C1F" // Dark color for text
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ADB9E3', // Accent color for button
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  text: {
    color: '#211C1F', // Dark color for text
    fontSize: 16,
    fontWeight: 'bold',
  },
});
