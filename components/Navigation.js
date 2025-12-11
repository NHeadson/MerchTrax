import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import VisitsScreen from '../screens/VisitsScreen';
import TimerScreen from '../screens/TimerScreen';
import AddVisitScreen from '../screens/AddVisitScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeStack_Home"
        component={HomeScreen}
        options={{
          headerStyle: { backgroundColor: COLORS.dark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitle: 'Home',
        }}
      />
    </Stack.Navigator>
  );
}

function AddButton() {
  const navigation = useNavigation(); // Access navigation using the hook

  return (
    <TouchableOpacity
      style={styles.addButton}
      accessibilityRole="button"
      accessibilityLabel="Add a new visit"
      onPress={() => navigation.navigate('Add')}>
      <Ionicons
        name="add"
        size={32}
        color={styles.addButtonIcon.color}
      />
    </TouchableOpacity>
  );
}

function VisitsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VisitsStack_Visits"
        component={VisitsScreen}
        options={{
          headerStyle: { backgroundColor: COLORS.dark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitle: 'Visits',
        }}
      />
    </Stack.Navigator>
  );
}

function TimerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TimerStack_Timer"
        component={TimerScreen}
        options={{
          headerStyle: { backgroundColor: COLORS.dark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitle: 'Timer',
        }}
      />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HistoryStack_History"
        component={HistoryScreen}
        options={{
          headerStyle: { backgroundColor: COLORS.dark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitle: 'History',
        }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Visits') {
              iconName = 'list';
            } else if (route.name === 'Timer') {
              iconName = 'time';
            } else if (route.name === 'History') {
              iconName = 'calendar';
            }

            return (
              <Ionicons
                name={iconName}
                size={size}
                color={color}
              />
            );
          },
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: COLORS.dark,
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: COLORS.accent2,
        })}>
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Visits"
          component={VisitsStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Add"
          component={AddVisitScreen}
          options={{
            tabBarButton: (props) => (
              <AddButton navigation={props.navigation} />
            ),
            headerStyle: { backgroundColor: COLORS.dark },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerTitle: 'Add a New Visit',
          }}
        />
        <Tab.Screen
          name="Timer"
          component={TimerStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="History"
          component={HistoryStack}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent2, // Accent color for button background
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addButtonIcon: {
    color: COLORS.dark, // Dark color for icon
  },
});
