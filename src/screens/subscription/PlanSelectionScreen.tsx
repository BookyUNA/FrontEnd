/**
 * Pantalla de Selección de Plan - Booky
 * Sistema de reservas para profesionales independientes
 * Pantalla para seleccionar y gestionar planes de suscripción
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

// =============================================
// INTERFACES
// =============================================

interface PlanSelectionScreenProps {
  navigation?: any;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export const PlanSelectionScreen: React.FC<PlanSelectionScreenProps> = ({ navigation }) => {
  
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Icon name="spinner" size={30} color={colors.primary.main} />
      <Text style={styles.loadingText}>Cargando planes...</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Planes de Suscripción</Text>
      <Text style={styles.subtitle}>
        Selecciona el plan que mejor se adapte a tu negocio
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeContainer>
        {renderLoadingState()}
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        {/* Contenido de planes - pendiente de implementar */}
        <View style={styles.placeholderContainer}>
          <Icon name="credit-card" size={50} color={colors.text.secondary} />
          <Text style={styles.placeholderText}>
            Contenido de planes en desarrollo
          </Text>
        </View>
      </ScrollView>
    </SafeContainer>
  );
};

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
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

  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  placeholderText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});