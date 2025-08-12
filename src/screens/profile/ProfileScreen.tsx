/**
 * Pantalla de Perfil - Booky
 * Sistema de reservas para profesionales independientes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Importaciones locales
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  
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
            title="Cerrar Sesión"
            onPress={() => {
              if (onLogout) {
                onLogout();
              }
            }}
            variant="outline"
            fullWidth
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

  // Options Section
  optionsSection: {
    marginBottom: spacing['2xl'],
  },

  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  optionsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.sm,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  optionIcon: {
    fontSize: 20,
    marginRight: spacing.lg,
    width: 24,
    textAlign: 'center',
  },

  optionText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    flex: 1,
  },

  footer: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
});