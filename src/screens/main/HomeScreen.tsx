/**
 * Pantalla de Inicio - Booky (ACTUALIZADA)
 * Sistema de reservas para profesionales independientes
 * Actualizado con Bottom Navigation y logout completo
 * NUEVO: Detección de rol de usuario y debug mejorado
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

// Importaciones locales
import Icon from 'react-native-vector-icons/FontAwesome5';
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
  
  // Estado para controlar el loading del logout
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  
  // Estado para almacenar el rol del usuario
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState<boolean>(false);
  
  // 🔍 DEBUG: Verificar token y rol al cargar la pantalla
  React.useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const token = await authService.getToken();
        const isAuth = await authService.isAuthenticated();
        const role = await authService.getUserRole();
        const isProf = await authService.isProfessional();
        const userData = await authService.getUserData();
        
        console.log('🔍 DEBUG HomeScreen - Estado completo:', {
          hasToken: !!token,
          isAuthenticated: isAuth,
          userRole: role,
          isProfessional: isProf,
          userData: userData
        });

        // Actualizar estados locales
        setUserRole(role);
        setIsProfessional(isProf);
        
        if (token && userData) {
          console.log('🔍 DEBUG HomeScreen - Token válido:', {
            tokenPreview: token.substring(0, 20) + '...',
            userId: userData.userId,
            role: userData.role,
            isExpired: userData.isExpired,
            expiresAt: new Date(userData.expiresAt * 1000).toLocaleString()
          });
        }
        
      } catch (error) {
        console.error('🔍 Error al verificar autenticación:', error);
      }
    };
    
    checkUserAuth();
  }, []);
  
  // Función simplificada para pasar logout a ProfileScreen
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('🚪 Iniciando logout desde HomeScreen...');
      
      const logoutResult = await authService.logout();
      console.log('🚪 Resultado del logout:', logoutResult);
      
      if (onLogout) {
        onLogout();
      }
    } catch (error: unknown) {
      console.error('🚪 Error en logout:', error);
      // Forzar logout local
      if (onLogout) {
        onLogout();
      }
    } finally {
      setIsLoggingOut(false);
    }
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
        <Icon name="rocket" size={50} color='black' />
        <Text style={styles.description}>
          Las funcionalidades principales están siendo desarrolladas.
        </Text>
        
      </View>

      {/* Botones de Debug */}
      <View style={styles.debugSection}>
        {/* 🔍 BOTÓN DEBUG MEJORADO */}
        <Button
          title="🔍 Verificar Estado Completo"
          onPress={async () => {
            try {
              // Usar el nuevo método de debug completo
              await authService.debugAuthState();
              
              // También mostrar en Alert para el usuario
              const token = await authService.getToken();
              const isAuth = await authService.isAuthenticated();
              const role = await authService.getUserRole();
              const isProf = await authService.isProfessional();
              const userData = await authService.getUserData();
              
              Alert.alert(
                'Estado Completo de Autenticación',
                `Token: ${token ? 'SÍ EXISTE' : 'NO EXISTE'}\n` +
                `Autenticado: ${isAuth ? 'SÍ' : 'NO'}\n` +
                `Rol: ${role || 'Sin rol'}\n` +
                `¿Es Profesional?: ${isProf ? 'SÍ' : 'NO'}\n` +
                `User ID: ${userData?.userId || 'N/A'}\n` +
                `Token expirado: ${userData?.isExpired ? 'SÍ' : 'NO'}\n` +
                `Token preview: ${token ? '...' + token.substring(token.length - 20) : 'Ninguno'}`
              );
            } catch (error) {
              console.error('Error en debug:', error);
              Alert.alert('Error', 'Error al obtener estado de autenticación');
            }
          }}
          variant="secondary"
          fullWidth
          disabled={isLoggingOut}
        />

        {/* Botón para probar decodificación de token específico */}
        <View style={{ marginTop: spacing.md }}>
          <Button
            title="🧪 Probar Token de Ejemplo"
            onPress={() => {
              const exampleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkNsaWVudGUiLCJqdGkiOiI2YzYxNGE0Mi1lYTRjLTQ4YzUtOWIwZS00MGExZmE3NTE2ZmEiLCJpYXQiOjE3NTY3MDI2MjAsImV4cCI6MTc1NjcxNzAyMCwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzMTgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo0NDMxOCJ9.t0heqGMX8n95ZR8eECwNdD-EEvWTH7Z9-cac7Zs6-FE";
              
              // Importar el decoder para prueba
              import('../../utils/jwtDecoder').then(({ jwtDecoder }) => {
                console.log('🧪 Probando token de ejemplo...');
                jwtDecoder.debugToken(exampleToken);
                
                const userData = jwtDecoder.extractUserData(exampleToken);
                
                Alert.alert(
                  'Token de Ejemplo Decodificado',
                  userData ? 
                    `User ID: ${userData.userId}\n` +
                    `Rol: ${userData.role}\n` +
                    `¿Expirado?: ${userData.isExpired ? 'SÍ' : 'NO'}\n` +
                    `Expira: ${new Date(userData.expiresAt * 1000).toLocaleString()}`
                    : 'Error al decodificar token de ejemplo'
                );
              });
            }}
            variant="outline"
            fullWidth
            disabled={isLoggingOut}
          />
        </View>
      </View>
    </View>
  );

  // Renderizar el contenido según la tab activa
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} isLoggingOut={isLoggingOut} />;
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
    paddingTop: spacing['8xl'],
    paddingBottom: spacing['2xl'],
  },

  welcomeTitle: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  roleContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary.main + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },

  roleText: {
    ...typography.styles.h3,
    color: colors.primary.main,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
  },

  roleSubtext: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
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

  professionalInfo: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.states.success + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.states.success + '30',
  },

  professionalText: {
    ...typography.styles.body,
    color: colors.states.success,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },

  debugSection: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'], // Espacio adicional para el bottom nav
  },
});