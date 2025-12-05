import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function HistoryScreen() {
  const [visits, setVisits] = React.useState([]);

  React.useEffect(() => {
    const fetchVisits = async () => {
      const visitsCollection = collection(db, 'visits');
      const visitsQuery = query(
        visitsCollection,
        orderBy('date'),
        orderBy('time_to_start')
      );
      const visitSnapshot = await getDocs(visitsQuery);
      const visitList = visitSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVisits(visitList);
    };

    fetchVisits();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visit History Screen!</Text>
      {visits.map((visit) => (
        <View
          key={visit.id}
          style={styles.visitItem}>
          <Text style={styles.visitText}>Store: {visit.store_name}</Text>
          <Text style={styles.visitText}>Location: {visit.location}</Text>
          <Text style={styles.visitText}>Task: {visit.task_title}</Text>
          <Text style={styles.visitText}>Start: {visit.time_to_start}</Text>
          <Text style={styles.visitText}>
            Complete: {visit.time_to_complete}
          </Text>
          <Text style={styles.visitText}>Date: {visit.date}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6DFDB', // Updated to light color
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F', // Updated to dark color
  },
});
