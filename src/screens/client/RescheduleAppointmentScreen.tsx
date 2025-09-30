/**
 * Pantalla de Reprogramación de Cita - Booky
 * Permite al cliente reprogramar una cita existente
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { Appointment } from '../../services/Appointment/AppointmentService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface RescheduleAppointmentScreenProps {
  route?: {
    params?: {
      appointment: Appointment;
    };
  };
  navigation?: any;
}

export const RescheduleAppointmentScreen: React.FC<RescheduleAppointmentScreenProps> = ({ 
  route,
  navigation 
}) => {
  const appointment = route?.params?.appointment;
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleTimeString('es-ES', options);
  };

  const handleReschedule = () => {
    Alert.alert(
      'En Desarrollo',
      'La funcionalidad de reprogramación estará disponible próximamente.',
      [{ text: 'Entendido' }]
    );
  };

  const handleCancel = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  if (!appointment) {
    return (
      <SafeContainer>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={60} color={colors.states.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            No se pudo cargar la información de la cita.
          </Text>
          <Button
            title="Volver"
            onPress={handleCancel}
            variant="outline"
          />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Selecciona una nueva fecha y hora para tu cita
          </Text>
        </View>

        <View style={styles.currentAppointmentSection}>
          <Text style={styles.sectionTitle}>Cita Actual</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="briefcase" size={16} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Servicio:</Text>
              <Text style={styles.infoValue}>{appointment.nombreServicio}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="user-tie" size={16} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Profesional:</Text>
              <Text style={styles.infoValue}>{appointment.nombreProfesional}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Icon name="calendar" size={16} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>{formatDate(appointment.fechaCita)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="clock" size={16} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Hora:</Text>
              <Text style={styles.infoValue}>{formatTime(appointment.fechaCita)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="hourglass-half" size={16} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Duración:</Text>
              <Text style={styles.infoValue}>{appointment.duracionMinutos} minutos</Text>
            </View>
          </View>
        </View>

        <View style={styles.developmentNotice}>
          <Icon name="tools" size={32} color={colors.states.info} />
          <Text style={styles.developmentTitle}>Funcionalidad en Desarrollo</Text>
          <Text style={styles.developmentMessage}>
            Esta funcionalidad está siendo desarrollada. Pronto podrás:
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={14} color={colors.states.success} />
              <Text style={styles.featureText}>Ver horarios disponibles del profesional</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={14} color={colors.states.success} />
              <Text style={styles.featureText}>Seleccionar una nueva fecha y hora</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={14} color={colors.states.success} />
              <Text style={styles.featureText}>Enviar solicitud de reprogramación</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={14} color={colors.states.success} />
              <Text style={styles.featureText}>Recibir confirmación del profesional</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Volver"
          onPress={handleCancel}
          variant="outline"
          fullWidth
          disabled={isProcessing}
        />
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
    paddingTop: spacing['4xl'],
    paddingBottom: spacing.xl,
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  currentAppointmentSection: {
    marginBottom: spacing['2xl'],
  },

  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },

  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  infoLabel: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    minWidth: 80,
  },

  infoValue: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },

  developmentNotice: {
    backgroundColor: colors.states.info + '10',
    borderRadius: spacing.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.states.info + '30',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },

  developmentTitle: {
    ...typography.styles.h3,
    color: colors.states.info,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  developmentMessage: {
    ...typography.styles.body,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  featuresList: {
    width: '100%',
    gap: spacing.md,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  featureText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  errorTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  errorMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});