import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './components/Navigation';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'react-native';

const COLORS = {
  light: '#E6DFDB',
  dark: '#211C1F',
  accent: '#ADB9E3',
  accent2: '#C68080',
};

export default function App() {
  return (
    <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.light} // Updated to use COLORS
        />
        <Navigation />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
