/**
 * Pantalla de Perfil - Booky
 * Sistema de reservas para profesionales independientes
 * Actualizada con logout completo
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

// Importaciones locales
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { authService } from '../../services/auth/authService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ProfileScreenProps {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onLogout, 
  isLoggingOut = false 
}) => {
  
  // Función para manejar el logout con confirmación completa
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
            try {
              console.log('🚪 ProfileScreen: Usuario confirmó logout, iniciando proceso...');
              
              // Llamar al servicio de logout (que incluye llamada al endpoint)
              const logoutResult = await authService.logout();
              
              console.log('🚪 ProfileScreen: Resultado del logout:', logoutResult);
              
              // Mostrar mensaje según el resultado
              if (logoutResult.success) {
                if (logoutResult.isNetworkError) {
                  // Error de red pero logout local exitoso
                  Alert.alert(
                    'Sesión Cerrada',
                    'Se cerró la sesión localmente. Hubo un problema de conexión con el servidor.',
                    [{
                      text: 'Entendido',
                      onPress: () => {
                        if (onLogout) {
                          onLogout();
                        }
                      }
                    }]
                  );
                } else {
                  // Logout completamente exitoso
                  console.log('🚪 ProfileScreen: Logout exitoso, redirigiendo al login...');
                  if (onLogout) {
                    onLogout();
                  }
                }
              } else {
                // Error en logout pero de todas formas redirigir
                console.warn('🚪 ProfileScreen: Logout con advertencias:', logoutResult.error);
                if (onLogout) {
                  onLogout();
                }
              }
              
            } catch (error: unknown) {
              console.error('🚪 ProfileScreen: Error inesperado en logout:', error);
              
              // En caso de error inesperado, forzar logout local
              Alert.alert(
                'Error',
                'Hubo un problema al cerrar sesión. Se cerrará la sesión localmente.',
                [{
                  text: 'Entendido',
                  onPress: () => {
                    if (onLogout) {
                      onLogout();
                    }
                  }
                }]
              );
            }
          },
        },
      ]
    );
  };
  
  return (
    <SafeContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
          <Text style={styles.subtitle}>
            Gestiona tu información personal
          </Text>
        </View>

        {/* Contenido Principal */}
        <View style={styles.content}>
          {/* Avatar Placeholder */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <Text style={styles.userName}>Usuario</Text>
            <Text style={styles.userEmail}>usuario@ejemplo.com</Text>
          </View>

          {/* Mensaje de construcción */}
          <View style={styles.constructionSection}>
            <Text style={styles.constructionMessage}>
              🚧 Sección en construcción
            </Text>
            <Text style={styles.constructionDescription}>
              Las funcionalidades de perfil están siendo desarrolladas.
              Próximamente podrás editar tu información personal, 
              configurar preferencias y gestionar tu cuenta.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={isLoggingOut ? "Cerrando Sesión..." : "Cerrar Sesión"}
            onPress={handleLogout}
            variant="outline"
            fullWidth
            loading={isLoggingOut}
            disabled={isLoggingOut}
            icon="sign-out-alt"
            iconPosition="left"
          />
        </View>
      </ScrollView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  header: {
    paddingTop: spacing['8xl'],
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  content: {
    flex: 1,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
  },

  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
  },

  avatarIcon: {
    fontSize: 40,
    opacity: 0.6,
  },

  userName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  userEmail: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },

  // Construction Section
  constructionSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },

  constructionMessage: {
    ...typography.styles.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  constructionDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed,
  },

  footer: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
});