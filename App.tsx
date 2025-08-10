/**
 * FrontBooky - App de Gestión de Citas
 * Sistema de reservas para profesionales independientes
 * Actualizado con manejo de estado de autenticación
 * 
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { HomeScreen } from './src/screens/main/HomeScreen';
import { authService } from './src/services/auth/authService';
import { SafeContainer } from './src/components/ui/SafeContainer';
import { colors } from './src/styles/colors';
import { typography } from './src/styles/typography';
import { spacing } from './src/styles/spacing';

function App(): React.JSX.Element {
  // Estado para controlar si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verificar estado de autenticación al iniciar la app
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  // Función para verificar si el usuario ya está autenticado
  const checkAuthenticationStatus = async () => {
    try {
      console.log('Verificando estado de autenticación...');
      
      // Verificar si hay un token válido guardado
      const isUserAuthenticated = await authService.isAuthenticated();
      
      setIsAuthenticated(isUserAuthenticated);
      console.log('Estado de autenticación:', isUserAuthenticated ? 'Autenticado' : 'No autenticado');
      
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar login exitoso
  const handleLoginSuccess = () => {
    console.log('Login exitoso, cambiando estado...');
    setIsAuthenticated(true);
  };

  // Función para manejar logout
  const handleLogout = () => {
    console.log('Logout exitoso, cambiando estado...');
    setIsAuthenticated(false);
  };

  // Mostrar loading mientras se verifica el estado
  if (isLoading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeContainer>
    );
  }

  // Renderizar la pantalla apropiada basada en el estado de autenticación
  if (isAuthenticated) {
    return (
      <HomeScreen 
        navigation={null} 
        onLogout={handleLogout} 
      />
    );
  } else {
    return (
      <LoginScreen 
        navigation={null} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  
  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
});

export default App;