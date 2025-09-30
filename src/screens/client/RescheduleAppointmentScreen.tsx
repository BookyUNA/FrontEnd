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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { Appointment, appointmentService } from '../../services/Appointment/AppointmentService';
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
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
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

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
    }
  };

  const combineDateTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  const handleReschedule = async () => {
    if (!appointment) return;

    const newDateTime = combineDateTime(selectedDate, selectedTime);
    const now = new Date();

    if (newDateTime <= now) {
      Alert.alert(
        'Fecha Inválida',
        'La fecha y hora seleccionadas deben ser futuras.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar Reprogramación',
      `¿Deseas reprogramar tu cita para el ${formatDate(newDateTime)} a las ${formatTime(newDateTime)}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            await performReschedule(newDateTime);
          },
        },
      ]
    );
  };

  const performReschedule = async (newDateTime: Date) => {
    if (!appointment) return;

    try {
      setIsProcessing(true);

      console.log('📅 Reprogramando cita:', {
        idCita: appointment.idCita,
        fechaActual: appointment.fechaCita,
        fechaNueva: newDateTime,
      });

      const result = await appointmentService.rescheduleAppointment(
        appointment,
        newDateTime
      );

      if (result.success) {
        Alert.alert(
          'Cita Reprogramada',
          'Tu cita ha sido reprogramada exitosamente. El profesional será notificado.',
          [
            {
              text: 'Entendido',
              onPress: () => {
                if (navigation?.goBack) {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'No se pudo reprogramar la cita. Intenta de nuevo.',
          [{ text: 'Entendido' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsProcessing(false);
    }
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
          <Icon name="calendar-alt" size={48} color={colors.primary.main} />
          <Text style={styles.title}>Reprogramar Cita</Text>
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

        <View style={styles.newDateTimeSection}>
          <Text style={styles.sectionTitle}>Nueva Fecha y Hora</Text>

          <View style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Fecha</Text>
            <Button
              title={formatDate(selectedDate)}
              onPress={() => setShowDatePicker(true)}
              icon="calendar"
              variant="outline"
              fullWidth
            />
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Hora</Text>
            <Button
              title={formatTime(selectedTime)}
              onPress={() => setShowTimePicker(true)}
              icon="clock"
              variant="outline"
              fullWidth
            />
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
                is24Hour={false}
              />
            )}
          </View>

          <View style={styles.previewCard}>
            <Icon name="info-circle" size={16} color={colors.states.info} />
            <Text style={styles.previewText}>
              Nueva cita programada para: {formatDate(selectedDate)} a las {formatTime(selectedTime)}
            </Text>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Icon name="bell" size={20} color={colors.states.warning} />
          <Text style={styles.noticeText}>
            El profesional será notificado de este cambio y podrá confirmar o rechazar la nueva fecha.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <Button
              title="Cancelar"
              onPress={handleCancel}
              variant="outline"
              fullWidth
              disabled={isProcessing}
            />
          </View>
          <View style={styles.buttonHalf}>
            <Button
              title={isProcessing ? "Procesando..." : "Confirmar"}
              onPress={handleReschedule}
              variant="primary"
              fullWidth
              disabled={isProcessing}
            />
          </View>
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
    marginBottom: spacing.xl,
  },

  newDateTimeSection: {
    marginBottom: spacing.xl,
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
    minWidth: 85,
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

  pickerCard: {
    marginBottom: spacing.md,
  },

  pickerLabel: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.states.info + '10',
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.states.info + '30',
    marginTop: spacing.sm,
  },

  previewText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
    fontSize: 14,
  },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.states.warning + '10',
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.states.warning + '30',
    marginBottom: spacing['2xl'],
  },

  noticeText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  buttonHalf: {
    flex: 1,
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