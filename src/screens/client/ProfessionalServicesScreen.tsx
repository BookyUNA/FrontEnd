/**
 * Pantalla de Servicios Profesionales - Booky
 * Para clientes que buscan servicios de profesionales
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { SafeContainer } from '../../components/ui/SafeContainer';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ProfessionalServicesScreenProps {
  navigation?: any;
}

export const ProfessionalServicesScreen: React.FC<ProfessionalServicesScreenProps> = ({ 
  navigation 
}) => {
  return (
    <SafeContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Servicios Profesionales
          </Text>
          <Text style={styles.subtitle}>
            Encuentra el profesional perfecto para ti
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.message}>
            🔍 Búsqueda de profesionales
          </Text>
          <Text style={styles.description}>
            Esta pantalla estará disponible próximamente.
          </Text>
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
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
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
});