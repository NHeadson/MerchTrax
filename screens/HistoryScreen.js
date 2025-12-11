import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore';

export default function HistoryScreen() {
  const [completedVisits, setCompletedVisits] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const formatTime = (timeString) => {
    if (!timeString) return '';
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

  const processCompletedVisits = (visitList) => {
    // Group visits by date
    const groupedVisits = visitList.reduce((groups, visit) => {
      const dateKey = visit.date || 'Unknown Date';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(visit);
      return groups;
    }, {});

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(groupedVisits).sort((a, b) => {
      // To reliably sort "YYYY-MM-DD", they can be compared as strings
      if (a < b) return 1;
      if (a > b) return -1;
      return 0;
    });

    // Create array with sorted dates and visits, with formatted date headers
    const sortedGroupedVisits = sortedDates.map((date) => {
      // The date string from Firestore is "YYYY-MM-DD".
      // To avoid timezone issues with `new Date()`, we can append a time.
      const dateObj = new Date(`${date}T00:00:00`);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        date: formattedDate, // Use the formatted date for the header
        visits: groupedVisits[date].sort((a, b) => {
          const timeA = a.time_to_start || '00:00';
          const timeB = b.time_to_start || '00:00';
          return timeA.localeCompare(timeB);
        }),
      };
    });

    setCompletedVisits(sortedGroupedVisits);
  };

  React.useEffect(() => {
    const visitsCollection = collection(db, 'visits');
    const visitsQuery = query(visitsCollection, orderBy('date'));

    // Set up real-time listener for completed visits
    const unsubscribe = onSnapshot(
      visitsQuery,
      (visitSnapshot) => {
        try {
          const visitList = visitSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((visit) => visit.completed); // Filter for completed visits only
          processCompletedVisits(visitList);
        } catch (error) {
          console.error('Error processing completed visits:', error);
          Alert.alert('Error', 'Failed to load history');
          setCompletedVisits([]);
        }
      },
      (error) => {
        console.error('Error setting up history listener:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const confirmDelete = (visitId, visitTitle) => {
    Alert.alert(
      'Delete Visit',
      `Are you sure you want to delete this visit from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'visits', visitId));
              Alert.alert('Success', 'Visit deleted from history');
            } catch (error) {
              console.error('Error deleting visit:', error);
              Alert.alert('Error', 'Failed to delete visit');
            }
          },
        },
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const visitsCollection = collection(db, 'visits');
    const visitsQuery = query(visitsCollection, orderBy('date'));

    getDocs(visitsQuery)
      .then((snapshot) => {
        const visitList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((visit) => visit.completed); // Filter for completed visits only
        processCompletedVisits(visitList);
        setRefreshing(false);
      })
      .catch((error) => {
        console.error('Error refreshing history:', error);
        setRefreshing(false);
      });
  }, []);

  if (completedVisits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={80}
            color="#ADB9E3"
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateTitle}>No Completed Visits</Text>
          <Text style={styles.emptyStateMessage}>
            Visits you complete will appear here in your history.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visit History</Text>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}>
        {completedVisits.map((group, index) => (
          <View
            key={index}
            style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{group.date}</Text>
            {group.visits.map((visit) => (
              <View
                key={visit.id}
                style={styles.visitCard}>
                <View style={styles.visitContent}>
                  <Text
                    style={styles.visitTitle}
                    numberOfLines={1}>
                    {visit.store_name}
                  </Text>
                  <Text
                    style={styles.visitSubtitle}
                    numberOfLines={1}>
                    {visit.task_title} • {visit.location}
                  </Text>
                  <Text style={styles.visitText}>
                    Start: {formatTime(visit.time_to_start)}
                  </Text>
                  <Text style={styles.visitText}>
                    Estimated Time:{' '}
                    {calculateAllottedTime(visit.allotted_minutes)}
                  </Text>
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#43DABC"
                    />
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete visit ${visit.store_name}`}
                  onPress={() => confirmDelete(visit.id, visit.store_name)}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#DC143C"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
    paddingLeft: 5,
    backgroundColor: COLORS.accent2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  visitContent: {
    flex: 1,
    marginRight: 12,
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#211C1F',
    marginBottom: 4,
  },
  visitSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    flex: 1,
  },
  visitText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#43DABC',
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
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
    color: COLORS.dark,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
