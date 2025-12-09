import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import CustomTimePickerModal from '../components/CustomTimePickerModal';
import CustomDatePicker from '../components/CustomDatePicker';

export default function VisitsScreen() {
  const [visits, setVisits] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [selectedVisit, setSelectedVisit] = React.useState(null);
  const [editVisitId, setEditVisitId] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, right: 0 });

  // Edit form state
  const [editStoreName, setEditStoreName] = React.useState('');
  const [editLocation, setEditLocation] = React.useState('');
  const [editTaskTitle, setEditTaskTitle] = React.useState('');
  const [editTimeToStart, setEditTimeToStart] = React.useState(new Date());
  const [editAllottedMinutes, setEditAllottedMinutes] = React.useState('');
  const [editDate, setEditDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [showEditDatePicker, setShowEditDatePicker] = React.useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = React.useState(false);

  const navigation = useNavigation();

  // Helper function: Convert "HH:MM" to Date object
  const parseTimeString = (timeString) => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date;
  };

  // Helper function: Convert Date object to "HH:MM"
  const formatTimeToString = (dateObj) => {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper function: Convert Date Object -> Local String "YYYY-MM-DD"
  const formatLocalDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function: Convert String "YYYY-MM-DD" -> Date Object
  const parseLocalDate = (dateString) => {
    if (!dateString) return new Date();
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // timeString is in "HH:MM" format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateAllottedTime = (allottedMinutes) => {
    if (!allottedMinutes) return '0 minutes';
    const minutes = parseInt(allottedMinutes, 10);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const processVisits = (visitList) => {
    // Group visits by date
    const groupedVisits = visitList.reduce((groups, visit) => {
      const date = visit.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(visit);
      return groups;
    }, {});

    // Sort dates chronologically and convert to array
    const sortedDates = Object.keys(groupedVisits).sort((a, b) => {
      // Parse "YYYY-MM-DD" strings properly to avoid timezone issues
      const [aYear, aMonth, aDay] = a.split('-').map(Number);
      const [bYear, bMonth, bDay] = b.split('-').map(Number);
      const dateA = new Date(aYear, aMonth - 1, aDay);
      const dateB = new Date(bYear, bMonth - 1, bDay);
      return dateA - dateB;
    });
    const sortedGroupedVisits = sortedDates.map((date) => {
      // Parse "YYYY-MM-DD" string properly to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return {
        date,
        formattedDate: dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        visits: groupedVisits[date].sort((a, b) =>
          a.time_to_start.localeCompare(b.time_to_start)
        ),
      };
    });

    setVisits(sortedGroupedVisits);
  };

  React.useEffect(() => {
    const visitsCollection = collection(db, 'visits');
    const visitsQuery = query(visitsCollection, orderBy('date'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      visitsQuery,
      (visitSnapshot) => {
        try {
          const visitList = visitSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((visit) => !visit.completed); // Filter out completed visits
          processVisits(visitList);
        } catch (error) {
          console.error('Error processing visits:', error);
          Alert.alert(
            'Error',
            'Failed to load visits. Please check Firebase index requirements.'
          );
          setVisits([]);
        }
      },
      (error) => {
        console.error('Error setting up visits listener:', error);
        Alert.alert(
          'Error',
          'Failed to load visits. Please check Firebase index requirements.'
        );
        setVisits([]);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const deleteVisit = async (visitId) => {
    try {
      await deleteDoc(doc(db, 'visits', visitId));
      setVisits((prevVisits) =>
        prevVisits
          .map((group) => ({
            ...group,
            visits: group.visits.filter((visit) => visit.id !== visitId),
          }))
          .filter((group) => group.visits.length > 0)
      );
      Alert.alert('Success', 'Visit deleted successfully');
    } catch (error) {
      console.error('Error deleting visit:', error);
      Alert.alert('Error', 'Failed to delete visit');
    }
  };

  const confirmDelete = (visitId, title) => {
    Alert.alert('Delete Visit', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteVisit(visitId),
      },
    ]);
  };

  const startTimer = (visit) => {
    const estimatedMinutes = parseInt(visit.allotted_minutes, 10);
    const estimatedSeconds = estimatedMinutes * 60;
    navigation.navigate('Timer', {
      screen: 'TimerStack_Timer',
      params: {
        visitData: visit,
        initialSeconds: estimatedSeconds,
      },
    });
  };

  const openMenu = (visit, event) => {
    setSelectedVisit(visit);
    // Position menu near the button (top right)
    const nativeEvent = event.nativeEvent;
    setMenuPosition({
      top: nativeEvent.pageY - 50,
      right: 20,
    });
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedVisit(null);
  };

  const handleEdit = () => {
    if (selectedVisit) {
      // Store the visit ID before closing menu
      setEditVisitId(selectedVisit.id);
      // Populate edit form with current visit data
      setEditStoreName(selectedVisit.store_name);
      setEditLocation(selectedVisit.location);
      setEditTaskTitle(selectedVisit.task_title);
      setEditTimeToStart(parseTimeString(selectedVisit.time_to_start));
      setEditAllottedMinutes(String(selectedVisit.allotted_minutes));
      setEditDate(selectedVisit.date);
      setEditModalVisible(true);
      closeMenu();
    }
  };

  const handleSaveEdit = async () => {
    if (
      !editStoreName ||
      !editLocation ||
      !editTaskTitle ||
      !editAllottedMinutes ||
      !editDate
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!editVisitId) {
      Alert.alert('Error', 'Visit ID not found');
      return;
    }

    try {
      const formattedTime = formatTimeToString(editTimeToStart);

      await updateDoc(doc(db, 'visits', editVisitId), {
        store_name: editStoreName,
        location: editLocation,
        task_title: editTaskTitle,
        title: `${editStoreName} - ${editTaskTitle}`,
        time_to_start: formattedTime,
        allotted_minutes: parseInt(editAllottedMinutes, 10),
        date: editDate,
      });
      Alert.alert('Success', 'Visit updated successfully');
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating visit:', error);
      Alert.alert('Error', 'Failed to update visit');
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setSelectedVisit(null);
    setEditVisitId(null);
    setEditStoreName('');
    setEditLocation('');
    setEditTaskTitle('');
    setEditTimeToStart(new Date());
    setEditAllottedMinutes('');
    setEditDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = () => {
    closeMenu();
    if (selectedVisit) {
      confirmDelete(selectedVisit.id, selectedVisit.title);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh by reloading the data
    const visitsCollection = collection(db, 'visits');
    const visitsQuery = query(visitsCollection, orderBy('date'));

    getDocs(visitsQuery)
      .then((snapshot) => {
        const visitList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((visit) => !visit.completed); // Filter out completed visits
        processVisits(visitList);
        setRefreshing(false);
      })
      .catch((error) => {
        console.error('Error refreshing visits:', error);
        setRefreshing(false);
      });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#211C1F"
            colors={['#211C1F', '#ADB9E3']}
          />
        }>
        <Text style={styles.title}>Upcoming Visits</Text>
        {Array.isArray(visits) &&
          visits.map((group) => (
            <View
              key={group.date}
              style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{group.formattedDate}</Text>
              {group.visits.map((visit) => (
                <View
                  key={visit.id}
                  style={styles.visitItem}>
                  <TouchableOpacity
                    style={styles.menuButtonTop}
                    onPress={(event) => openMenu(visit, event)}>
                    <Text style={styles.menuButtonTextTop}>⋮</Text>
                  </TouchableOpacity>
                  <Text
                    style={styles.visitTitle}
                    numberOfLines={1}>
                    Title: {visit.title}
                  </Text>
                  <Text style={styles.visitText}>
                    Location: {visit.location}
                  </Text>
                  <Text style={styles.visitText}>
                    Start: {formatTime(visit.time_to_start)}
                  </Text>
                  <Text style={styles.visitText}>
                    Estimated Time:{' '}
                    {calculateAllottedTime(visit.allotted_minutes)}
                  </Text>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => startTimer(visit)}>
                      <Text style={styles.startButtonText}>Start</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>

      {/* Menu Tooltip */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}>
          <View
            style={[
              styles.menuContainer,
              {
                top: menuPosition.top,
                right: menuPosition.right,
              },
            ]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEdit}>
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDelete}>
              <Text style={styles.menuItemTextDelete}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={closeMenu}>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCancelEdit}>
        <ScrollView contentContainerStyle={styles.editScrollContainer}>
          <Text style={styles.editHeader}>Edit Visit</Text>

          <Text style={styles.editLabel}>Store Name</Text>
          <TextInput
            style={styles.editInput}
            value={editStoreName}
            onChangeText={setEditStoreName}
            placeholder="Enter store name"
            placeholderTextColor="#ADB9E3"
          />

          <Text style={styles.editLabel}>Location</Text>
          <TextInput
            style={styles.editInput}
            value={editLocation}
            onChangeText={setEditLocation}
            placeholder="Enter location (e.g., city name)"
            placeholderTextColor="#ADB9E3"
          />

          <Text style={styles.editLabel}>Task Title</Text>
          <TextInput
            style={styles.editInput}
            value={editTaskTitle}
            onChangeText={setEditTaskTitle}
            placeholder="Enter task title"
            placeholderTextColor="#ADB9E3"
          />

          <Text style={styles.editLabel}>Time to Start</Text>
          <TouchableOpacity
            style={[styles.editInput, { justifyContent: 'center' }]}
            onPress={() => setShowEditTimePicker(true)}>
            <Text style={styles.time}>
              {editTimeToStart.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
          <CustomTimePickerModal
            value={editTimeToStart}
            onChange={setEditTimeToStart}
            visible={showEditTimePicker}
            onClose={() => setShowEditTimePicker(false)}
          />

          <Text style={styles.editLabel}>Time to Complete (in minutes)</Text>
          <TextInput
            style={styles.editInput}
            value={editAllottedMinutes}
            onChangeText={setEditAllottedMinutes}
            placeholder="Enter time to complete (e.g., 30)"
            keyboardType="numeric"
            placeholderTextColor="#ADB9E3"
          />

          <Text style={styles.editLabel}>Date</Text>
          <CustomDatePicker
            value={parseLocalDate(editDate)}
            onChange={(selectedDate) => {
              const localDateString = formatLocalDate(selectedDate);
              setEditDate(localDateString);
            }}
            visible={showEditDatePicker}
            onClose={() => setShowEditDatePicker(false)}
            style={styles.editInput}
            textStyle={{ color: '#211C1F' }}
          />

          <View style={styles.editButtonContainer}>
            <TouchableOpacity
              style={[styles.editButton, styles.editCancelButton]}
              onPress={handleCancelEdit}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.editSaveButton]}
              onPress={handleSaveEdit}>
              <Text style={styles.editButtonTextSave}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6DFDB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 10,
    paddingLeft: 5,
    backgroundColor: '#ADB9E3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  visitItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ADB9E3',
  },
  visitText: {
    fontSize: 16,
    color: '#211C1F',
    marginBottom: 5,
  },
  visitTitle: {
    fontSize: 16,
    color: '#211C1F',
    marginBottom: 5,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  menuButtonTop: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
  menuButtonTextTop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#211C1F',
  },
  deleteButton: {
    backgroundColor: '#DC143C',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 0,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DFDB',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#211C1F',
    fontWeight: '500',
  },
  menuItemTextDelete: {
    fontSize: 16,
    color: '#DC143C',
    fontWeight: '500',
  },
  editScrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#E6DFDB',
    justifyContent: 'center',
  },
  editHeader: {
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
  editLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#211C1F',
    fontWeight: 'bold',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ADB9E3',
    borderRadius: 5,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#211C1F',
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
    gap: 10,
  },
  editButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  editCancelButton: {
    backgroundColor: '#ADB9E3',
  },
  editSaveButton: {
    backgroundColor: '#211C1F',
  },
  editButtonText: {
    color: '#211C1F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButtonTextSave: {
    color: '#E6DFDB',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
