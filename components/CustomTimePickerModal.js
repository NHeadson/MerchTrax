import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function CustomTimePickerModal({
  value,
  onChange,
  visible,
  onClose,
}) {
  // Initialize with safe defaults, but rely on useEffect for the real sync
  const [selectedHour, setSelectedHour] = useState(
    value ? value.getHours() : 12
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? value.getMinutes() : 0
  );
  const [amPm, setAmPm] = useState(
    value && value.getHours() >= 12 ? 'PM' : 'AM'
  );

  // FIX: Sync state with the 'value' prop whenever the modal opens
  useEffect(() => {
    if (visible && value) {
      const h = value.getHours();
      const m = value.getMinutes();
      setSelectedHour(h);
      setSelectedMinute(m);
      setAmPm(h >= 12 ? 'PM' : 'AM');
    }
  }, [visible, value]);

  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    // Clone the date so we don't mutate the original immediately
    const newDate = new Date(value);

    // setHours/setMinutes works in LOCAL time, so this is safe
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);

    onChange(newDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select Time</Text>
          <View style={styles.pickerContainer}>
            {/* HOUR PICKER */}
            <Picker
              selectedValue={selectedHour % 12 || 12}
              onValueChange={(itemValue) => {
                // Adjust for AM/PM immediately when scrolling
                let newHour = itemValue;
                if (amPm === 'PM' && newHour !== 12) newHour += 12;
                if (amPm === 'AM' && newHour === 12) newHour = 0;
                setSelectedHour(newHour);
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}>
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

            {/* MINUTE PICKER */}
            <Picker
              selectedValue={selectedMinute}
              onValueChange={(itemValue) => setSelectedMinute(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}>
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

          {/* AM/PM SELECTOR */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 30,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 10,
    paddingHorizontal: 16,
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  picker: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 90,
    height: Platform.OS === 'ios' ? 100 : 80,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 0,
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 100 : 80,
    color: '#211C1F',
    marginHorizontal: 10,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  separator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#211C1F',
    marginHorizontal: 10,
  },
  amPmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  amPmButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    borderRadius: 25,
    backgroundColor: '#E6DFDB',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedAmPm: {
    backgroundColor: '#ADB9E3',
  },
  amPmText: {
    fontSize: 16,
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
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
