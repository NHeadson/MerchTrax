import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Button } from 'react-native';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const [count, setCount] = React.useState(0); // Local state for the counter

  React.useEffect(() => {
    console.log(`Count updated: ${count}`); // Logs whenever the count changes
  }, [count]); // Dependency array: Runs only when `count` changes

  React.useEffect(() => {
    const addSampleVisit = async () => {
      const visitsCollection = collection(db, 'visits');
      await addDoc(visitsCollection, {
        store_name: 'Store A',
        address: '123 Main St',
        allotted_time: 30,
        completed: false,
      });
      console.log('Sample visit added to Firestore');
    };

    addSampleVisit();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Welcome to MerchTrax!</Text>
      <Text>Counter: {count}</Text>
      <Button
        title="Increase Counter"
        onPress={() => setCount(count + 1)}
      />
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Text>This is the Details Screen!</Text>
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
      />
    </Stack.Navigator>
  );
}

function HistoryScreen() {
  const [visits, setVisits] = React.useState([]);

  React.useEffect(() => {
    const fetchVisits = async () => {
      const visitsCollection = collection(db, 'visits');
      const visitSnapshot = await getDocs(visitsCollection);
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
      <Text>This is the History Screen!</Text>
      {visits.map((visit) => (
        <Text key={visit.id}>{visit.store_name} - {visit.address}</Text>
      ))}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
