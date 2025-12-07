import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomDatePickerModal from './CustomDatePickerModal';

export default function CustomDatePicker({ value, onChange }) {
  const [isModalVisible, setModalVisible] = useState(false);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  return (
    <View>
      <TouchableOpacity
        onPress={handleOpenModal}
        style={styles.input}>
        <Text style={styles.buttonText}>{value.toDateString()}</Text>
      </TouchableOpacity>
      <CustomDatePickerModal
        value={value}
        onChange={(newDate) => {
          onChange(newDate);
          handleCloseModal();
        }}
        visible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ADB9E3',
    borderRadius: 5,
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    color: '#211C1F',
  },
  button: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#211C1F',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
