/**
 * BottomNavigationBar - Booky
 * Componente de navegación inferior para la aplicación
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

export type BottomNavTabType = 'home' | 'profile';

interface BottomNavigationBarProps {
  activeTab: BottomNavTabType;
  onTabPress: (tab: BottomNavTabType) => void;
}

interface TabItemProps {
  tab: BottomNavTabType;
  isActive: boolean;
  onPress: () => void;
  icon: string;
  label: string;
}

const TabItem: React.FC<TabItemProps> = ({ 
  tab, 
  isActive, 
  onPress, 
  icon, 
  label 
}) => {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tabContent}>
        {/* Icono */}
        <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
          <Text style={[styles.icon, isActive && styles.iconActive]}>
            {icon}
          </Text>
        </View>
        
        {/* Label */}
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {label}
        </Text>
        
        {/* Indicador activo */}
        {isActive && <View style={styles.activeIndicator} />}
      </View>
    </TouchableOpacity>
  );
};

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    {
      key: 'home' as BottomNavTabType,
      icon: '🏠',
      label: 'Inicio',
    },
    {
      key: 'profile' as BottomNavTabType,
      icon: '👤',
      label: 'Perfil',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Sombra superior */}
      <View style={styles.shadow} />
      
      {/* Contenido de navegación */}
      <View style={styles.content}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab.key}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.main, // Fondo principal morado
    borderTopWidth: 1,
    borderTopColor: colors.primary.dark, // Borde más oscuro para definición
  },

  shadow: {
    height: 1,
    backgroundColor: colors.primary.dark,
    opacity: 0.3,
  },

  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg, // Espacio adicional para iPhones con home indicator
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  iconContainer: {
    width: 25,
    height: 25,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: 'transparent',
  },

  iconContainerActive: {
    backgroundColor: colors.primary.contrast + '20', // Fondo blanco con opacidad para el activo
  },

  icon: {
    fontSize: 20,
    opacity: 0.7, // Un poco más visible sobre fondo morado
  },

  iconActive: {
    opacity: 1,
  },

  tabLabel: {
    ...typography.styles.caption,
    color: colors.primary.contrast, // Texto blanco sobre fondo morado
    fontWeight: typography.fontWeight.medium,
    opacity: 0.8,
  },

  tabLabelActive: {
    color: colors.primary.contrast, // Texto blanco para el activo
    fontWeight: typography.fontWeight.semibold,
    opacity: 1,
  },

  activeIndicator: {
    position: 'absolute',
    bottom: -spacing.sm,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.contrast, // Indicador blanco sobre fondo morado
  },
});