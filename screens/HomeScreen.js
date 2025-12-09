import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { db } from '../firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalVisits: 0,
    visitsToday: 0,
    totalTimeSpent: 0,
    averageTime: 0,
  });
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const processVisits = (visitList) => {
    const pendingVisits = visitList.filter((visit) => !visit.completed);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = pendingVisits.filter((v) => v.date === today);

    let totalMinutes = 0;
    pendingVisits.forEach((visit) => {
      if (visit.allotted_minutes) {
        totalMinutes += parseInt(visit.allotted_minutes, 10);
      }
    });

    setStats({
      totalVisits: pendingVisits.length,
      visitsToday: todayVisits.length,
      totalTimeSpent: totalMinutes,
      averageTime:
        pendingVisits.length > 0
          ? Math.round(totalMinutes / pendingVisits.length)
          : 0,
    });

    // Get 3 most recent visits
    const recent = pendingVisits
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time_to_start.localeCompare(a.time_to_start);
      })
      .slice(0, 3);

    setRecentVisits(recent);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      const visitsCollection = collection(db, 'visits');
      const unsubscribe = onSnapshot(
        visitsCollection,
        (snapshot) => {
          try {
            const visitList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            processVisits(visitList);
          } catch (error) {
            console.error('Error loading stats:', error);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error setting up listener:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const visitsCollection = collection(db, 'visits');
    getDocs(visitsCollection)
      .then((snapshot) => {
        const visitList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        processVisits(visitList);
        setRefreshing(false);
      })
      .catch((error) => {
        console.error('Error refreshing visits:', error);
        setRefreshing(false);
      });
  }, []);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Welcome to MerchTrax!</Text>
        <Text style={styles.subtitle}>
          Manage your store visits efficiently
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✓</Text>
          <Text style={styles.statValue}>{stats.totalVisits}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{stats.visitsToday}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{stats.totalTimeSpent}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      {/* Average Time Card */}
      <View style={styles.averageCard}>
        <View style={styles.averageContent}>
          <Text style={styles.averageLabel}>Average Time Per Visit</Text>
          <Text style={styles.averageValue}>{stats.averageTime} min</Text>
        </View>
        <Text style={styles.averageIcon}>📊</Text>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('History')}>
          <Text style={styles.buttonIcon}>📜</Text>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Visits')}>
          <Text style={styles.buttonIcon}>📋</Text>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('Add')}>
          <Text style={styles.buttonIcon}>➕</Text>
          <Text style={styles.buttonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6DFDB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ADB9E3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#211C1F',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  averageCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ADB9E3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averageIcon: {
    fontSize: 40,
  },
  averageContent: {
    flex: 1,
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#211C1F',
  },
  recentSection: {
    display: 'none',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#211C1F',
    marginBottom: 12,
  },
  recentVisitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ADB9E3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  visitStore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#211C1F',
  },
  visitLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  visitTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  visitMeta: {
    alignItems: 'flex-end',
  },
  visitDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#43DABC',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noVisitsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    flex: 1,
  },
  buttonIcon: {
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: '#211C1F',
  },
  secondaryButton: {
    backgroundColor: '#ADB9E3',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#211C1F',
  },
  spacer: {
    height: 20,
  },
});
