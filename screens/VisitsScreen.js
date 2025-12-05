import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function VisitsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is the Visits Screen!</Text>
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
