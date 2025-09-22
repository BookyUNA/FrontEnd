/**
 * BottomNavigationBar - Booky
 * Componente de navegación inferior para la aplicación
 * Incluye diferentes tabs según el tipo de usuario
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

export type BottomNavTabType = 'home' | 'services' | 'professionalServices' | 'profile';

interface BottomNavigationBarProps {
  activeTab: BottomNavTabType;
  onTabPress: (tab: BottomNavTabType) => void;
  isProfessional?: boolean;
}

interface TabItemProps {
  tab: BottomNavTabType;
  isActive: boolean;
  onPress: () => void;
  iconName: string;
  label: string;
}

const TabItem: React.FC<TabItemProps> = ({ 
  tab, 
  isActive, 
  onPress, 
  iconName, 
  label 
}) => {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tabContent}>
        <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
          <Icon 
            name={iconName}
            size={20}
            color={colors.primary.contrast}
            style={[styles.icon, isActive && styles.iconActive]}
          />
        </View>
        
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {label}
        </Text>
        
        {isActive && <View style={styles.activeIndicator} />}
      </View>
    </TouchableOpacity>
  );
};

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabPress,
  isProfessional = false,
}) => {
  // Configuración base de tabs
  const baseTabs = [
    {
      key: 'home' as BottomNavTabType,
      iconName: 'home',
      label: 'Inicio',
    },
  ];

  // Tab de servicios para profesionales
  const servicesTab = {
    key: 'services' as BottomNavTabType,
    iconName: 'briefcase',
    label: 'Mis Servicios',
  };

  // Tab de servicios profesionales para clientes
  const professionalServicesTab = {
    key: 'professionalServices' as BottomNavTabType,
    iconName: 'search',
    label: 'Profesionales',
  };

  // Tab de perfil
  const profileTab = {
    key: 'profile' as BottomNavTabType,
    iconName: 'user',
    label: 'Perfil',
  };

  // Construir array de tabs según el rol
  const tabs = isProfessional 
    ? [...baseTabs, servicesTab, profileTab] 
    : [...baseTabs, professionalServicesTab, profileTab];

  return (
    <View style={styles.container}>
      <View style={styles.shadow} />
      
      <View style={styles.content}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab.key}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
            iconName={tab.iconName}
            label={tab.label}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.main,
    borderTopWidth: 1,
    borderTopColor: colors.primary.dark,
  },

  shadow: {
    height: 1,
    backgroundColor: colors.primary.dark,
    opacity: 0.3,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: 'transparent',
  },

  iconContainerActive: {
    backgroundColor: colors.primary.contrast + '20',
  },

  icon: {
    opacity: 0.7,
  },

  iconActive: {
    opacity: 1,
  },

  tabLabel: {
    ...typography.styles.caption,
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.medium,
    opacity: 0.8,
    textAlign: 'center',
    fontSize: 10,
  },

  tabLabelActive: {
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.semibold,
    opacity: 1,
  },

  activeIndicator: {
    position: 'absolute',
    bottom: -spacing.sm,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.contrast,
  },
});