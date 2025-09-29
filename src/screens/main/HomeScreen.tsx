/**
 * Pantalla de Inicio - Booky
 * Sistema de reservas para profesionales independientes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/forms/Button';
import { BottomNavigationBar, BottomNavTabType } from '../../components/navigation/BottomNavigationBar';
import { ProfileScreen } from '../profile/ProfileScreen';
import { ServicesScreen } from '../services/ServicesScreen';
import { ProfessionalServicesScreen } from '../client/ProfessionalServicesScreen';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { authService } from '../../services/auth/authService';
import { ClientAppointmentsScreen } from '../client/ClientAppointmentsScreen';

interface HomeScreenProps {
  navigation?: any;
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, onLogout }) => {
  const [activeTab, setActiveTab] = useState<BottomNavTabType>('home');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  
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

        setUserRole(role);
        setIsProfessional(isProf);
        setIsClient(role === 'Cliente');
        
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
        // Error silencioso en verificación de autenticación
      }
    };
    
    checkUserAuth();
  }, []);
  
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
      // Error silencioso, forzar logout local
      if (onLogout) {
        onLogout();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTabChange = (tab: BottomNavTabType) => {
    setActiveTab(tab);
    console.log('📱 Cambiando a tab:', tab);
  };

  const handleCreateService = () => {
    if (navigation?.navigate) {
      navigation.navigate('CreateService');
    } else {
      Alert.alert(
        'Crear Servicio',
        'La funcionalidad para crear servicios estará disponible próximamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderProfessionalHomeContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size="medium" showTagline />
        <Text style={styles.welcomeTitle}>
          ¡Bienvenido Profesional!
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          🚧 Aplicación en construcción
        </Text>
        <Icon name="rocket" size={50} color={colors.text.primary} />
        <Text style={styles.description}>
          Las funcionalidades principales están siendo desarrolladas.
        </Text>
      </View>

      <View style={styles.debugSection}>
        <Button
          title="🔍 Verificar Estado Completo"
          onPress={async () => {
            try {
              await authService.debugAuthState();
              
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
                `Token preview: ${token ? token.substring(0, 30) + '...' : 'N/A'}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              // Error silencioso en debug
            }
          }}
          variant="outline"
        />
      </View>
    </View>
  );

  const renderClientHomeContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size="medium" showTagline />
        <Text style={styles.welcomeTitle}>
          ¡Bienvenido Cliente!
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          🚧 Aplicación en construcción
        </Text>
        <Icon name="search" size={50} color={colors.text.primary} />
        <Text style={styles.description}>
          Pronto podrás buscar y reservar servicios profesionales.
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (isClient) {
          return renderClientHomeContent();
        } else if (isProfessional) {
          return renderProfessionalHomeContent();
        } else {
          return renderProfessionalHomeContent();
        }
      
      case 'services':
        if (isProfessional) {
          return (
            <ServicesScreen 
              navigation={navigation}
              onCreateService={handleCreateService}
            />
          );
        } else {
          return renderClientHomeContent();
        }

      case 'professionalServices':
        return (
          <ProfessionalServicesScreen 
            navigation={navigation}
          />
        );
        
      case 'appointments':
      return (
        <ClientAppointmentsScreen 
          navigation={navigation}
        />
      );  

      case 'profile':
        return (
          <ProfileScreen
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            navigation={navigation} 
          />
        );
      
      default:
        return isClient ? renderClientHomeContent() : renderProfessionalHomeContent();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentContainer}>
        {activeTab === 'profile' ? (
          <SafeContainer>
            {renderContent()}
          </SafeContainer>
        ) : (
          renderContent()
        )}
      </View>

      <BottomNavigationBar
        activeTab={activeTab}
        onTabPress={handleTabChange}
        isProfessional={isProfessional}
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
    marginTop: spacing.lg,
  },

  debugSection: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
});