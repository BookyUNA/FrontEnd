/**
 * Pantalla de Inicio - Booky
 * Sistema de reservas para profesionales independientes
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';

import { BottomNavigationBar, BottomNavTabType } from '../../components/navigation/BottomNavigationBar';
import { ProfileScreen } from '../profile/ProfileScreen';
import { ServicesScreen } from '../services/ServicesScreen';
import { ProfessionalServicesScreen } from '../client/ProfessionalServicesScreen';
import { ProfessionalSchedule } from '../../components/appointments/ProfessionalSchedule';
import { ClientHomeScreen } from '../client/ClientHomeScreen';  // IMPORTAR EL NUEVO COMPONENTE
import { colors } from '../../styles/colors';
import { authService } from '../../services/auth/authService';
import { ClientAppointmentsScreen } from '../client/ClientAppointmentsScreen';
import { ProfessionalAppointmentsScreen } from '../client/ProfessionalAppointmentsScreen';
import { SafeContainer } from '../../components/ui/SafeContainer';

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
    }
  };

  const renderProfessionalHomeContent = () => (
    <SafeContainer>
      <View style={styles.scheduleContainer}>
        <ProfessionalSchedule />
      </View>
    </SafeContainer>
  );

  // REEMPLAZAR renderClientHomeContent con el nuevo componente
  const renderClientHomeContent = () => (
    <ClientHomeScreen 
      navigation={navigation} 
    />
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

      case 'professionalAppointments':
        return (
          <ProfessionalAppointmentsScreen 
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

  scheduleContainer: {
    flex: 1,
  },
});