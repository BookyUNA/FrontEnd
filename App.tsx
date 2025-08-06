/**
 * FrontBooky - App de Gestión de Citas
 * Sistema de reservas para profesionales independientes
 * 
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  useColorScheme,
  SafeAreaView,
} from 'react-native';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  };

  const textStyle = {
    color: isDarkMode ? '#ffffff' : '#333333',
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      
      <View style={styles.content}>
        <Text style={[styles.welcome, textStyle]}>
          Bienvenido a Booky
        </Text>
        <Text style={[styles.subtitle, textStyle]}>
          Tu aplicación de gestión de citas
        </Text>
        <View style={styles.decorativeElement} />
        <Text style={[styles.description, textStyle]}>
          Conectando profesionales independientes con sus clientes
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcome: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  decorativeElement: {
    width: 60,
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
});

export default App;