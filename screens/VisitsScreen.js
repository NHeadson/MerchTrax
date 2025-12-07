import React from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export default function VisitsScreen() {
  const [visits, setVisits] = React.useState([]);
  const navigation = useNavigation();

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateAllottedTime = (allottedMinutes) => {
    if (!allottedMinutes) return '0 minutes';
    const minutes = parseInt(allottedMinutes, 10);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  React.useEffect(() => {
    const fetchVisits = async () => {
      try {
        const visitsCollection = collection(db, 'visits');
        // Temporarily use simple ordering until index is created
        const visitsQuery = query(visitsCollection, orderBy('date'));
        const visitSnapshot = await getDocs(visitsQuery);
        const visitList = visitSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

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
        const sortedDates = Object.keys(groupedVisits).sort(
          (a, b) => new Date(a) - new Date(b)
        );
        const sortedGroupedVisits = sortedDates.map((date) => ({
          date,
          formattedDate: new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          visits: groupedVisits[date].sort((a, b) =>
            a.time_to_start.localeCompare(b.time_to_start)
          ),
        }));

        setVisits(sortedGroupedVisits);
      } catch (error) {
        console.error('Error fetching visits:', error);
        Alert.alert(
          'Error',
          'Failed to load visits. Please check Firebase index requirements.'
        );
        setVisits([]); // Ensure visits is always an array
      }
    };

    fetchVisits();
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
    const estimatedMinutes = parseInt(visit.time_to_complete, 10);
    const estimatedSeconds = estimatedMinutes * 60;
    navigation.navigate('Timer', {
      screen: 'TimerStack_Timer',
      params: {
        visitData: visit,
        initialSeconds: estimatedSeconds,
      },
    });
  };

  return (
    <View style={styles.container}>
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
                <Text style={styles.visitText}>Title: {visit.title}</Text>
                <Text style={styles.visitText}>Location: {visit.location}</Text>
                <Text style={styles.visitText}>
                  Start: {formatTime(visit.time_to_start)}
                </Text>
                <Text style={styles.visitText}>
                  Estimated Time:{' '}
                  {calculateAllottedTime(visit.time_to_complete)}
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => startTimer(visit)}>
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(visit.id, visit.title)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#C68080',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
