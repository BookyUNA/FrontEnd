/**
 * Pantalla de Inicio - Booky
 * Sistema de reservas para profesionales independientes
 * Actualizado con Bottom Navigation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

// Importaciones locales
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/forms/Button';
import { BottomNavigationBar, BottomNavTabType } from '../../components/navigation/BottomNavigationBar';
import { ProfileScreen } from '../profile/ProfileScreen';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { authService } from '../../services/auth/authService';

interface HomeScreenProps {
  navigation?: any;
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onLogout }) => {
  // Estado para manejar la tab activa
  const [activeTab, setActiveTab] = useState<BottomNavTabType>('home');
  
  // 🔍 DEBUG: Verificar token al cargar la pantalla
  React.useEffect(() => {
    const checkToken = async () => {
      const token = await authService.getToken();
      const isAuth = await authService.isAuthenticated();
      
      console.log('🔍 DEBUG - Token actual:', token ? token.substring(0, 20) + '...' : 'No hay token');
      console.log('🔍 DEBUG - ¿Está autenticado?:', isAuth);
    };
    
    checkToken();
  }, []);
  
  // Función para manejar el logout
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  // Función para manejar el cambio de tab
  const handleTabChange = (tab: BottomNavTabType) => {
    setActiveTab(tab);
  };

  // Renderizar el contenido de la pantalla de Inicio
  const renderHomeContent = () => (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="medium" showTagline />
        <Text style={styles.welcomeTitle}>
          ¡Bienvenido a Booky!
        </Text>
      </View>

      {/* Contenido Principal */}
      <View style={styles.content}>
        <Text style={styles.message}>
          🚧 Aplicación en construcción
        </Text>
        <Text style={styles.description}>
          Las funcionalidades principales están siendo desarrolladas.
        </Text>
      </View>

      {/* Botones de Debug */}
      <View style={styles.debugSection}>
        {/* 🔍 BOTÓN DEBUG TEMPORAL */}
        <Button
          title="🔍 Verificar Token"
          onPress={async () => {
            const token = await authService.getToken();
            const isAuth = await authService.isAuthenticated();
            
            Alert.alert(
              'Estado del Token',
              `Token: ${token ? 'SÍ EXISTE' : 'NO EXISTE'}\n` +
              `Autenticado: ${isAuth ? 'SÍ' : 'NO'}\n` +
              `Token (últimos 20 chars): ${token ? '...' + token.substring(token.length - 20) : 'Ninguno'}`
            );
          }}
          variant="secondary"
          fullWidth
        />
      </View>
    </View>
  );

  // Renderizar el contenido según la tab activa
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return renderHomeContent();
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        {activeTab === 'home' ? (
          <SafeContainer>
            {renderContent()}
          </SafeContainer>
        ) : (
          renderContent()
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigationBar
        activeTab={activeTab}
        onTabPress={handleTabChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  contentContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  header: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
  },

  welcomeTitle: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  message: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  description: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  debugSection: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'], // Espacio adicional para el bottom nav
  },
});