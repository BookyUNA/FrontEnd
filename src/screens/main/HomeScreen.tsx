/**
 * Pantalla de Inicio - Booky
 * Sistema de reservas para profesionales independientes
 */

import React from 'react';
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
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { authService } from '../../services/auth/authService';

interface HomeScreenProps {
  navigation?: any;
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onLogout }) => {
  
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

  return (
    <SafeContainer>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
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

  footer: {
    paddingVertical: spacing.xl,
  },
});