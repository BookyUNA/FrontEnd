/**
 * Pantalla de Reprogramación de Cita - Booky
 * Permite al cliente reprogramar una cita existente
 * Solo permite horas exactas o medias horas
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
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
  
  // Inicializar con la fecha/hora de la cita original
  const getInitialDate = () => {
    return appointment ? new Date(appointment.fechaCita) : new Date();
  };
  
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  const [selectedTime, setSelectedTime] = useState<Date>(getInitialDate());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [tempDay, setTempDay] = useState<number>(getInitialDate().getDate());
  const [tempMonth, setTempMonth] = useState<number>(getInitialDate().getMonth());
  const [tempYear, setTempYear] = useState<number>(getInitialDate().getFullYear());
  const [tempHour, setTempHour] = useState<number>(getInitialDate().getHours());
  const [tempMinute, setTempMinute] = useState<number>(getInitialDate().getMinutes());
  const [tempAmPm, setTempAmPm] = useState<'AM' | 'PM'>('AM');

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

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const openDatePicker = () => {
    setTempDay(selectedDate.getDate());
    setTempMonth(selectedDate.getMonth());
    setTempYear(selectedDate.getFullYear());
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    let hours = selectedTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    
    setTempHour(hours);
    setTempMinute(selectedTime.getMinutes());
    setTempAmPm(ampm);
    setShowTimePicker(true);
  };

  const confirmDate = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const confirmTime = () => {
    // Validar que sea hora exacta o media hora
    if (tempMinute !== 0 && tempMinute !== 30) {
      Alert.alert(
        'Hora inválida',
        'Solo se permiten horas en punto (00) o medias horas (30).',
        [{ text: 'OK' }]
      );
      return;
    }

    let hours = tempHour;
    if (tempAmPm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (tempAmPm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const newTime = new Date();
    newTime.setHours(hours);
    newTime.setMinutes(tempMinute);
    setSelectedTime(newTime);
    setShowTimePicker(false);
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

    // Validar que sea hora exacta o media hora
    const minutes = newDateTime.getMinutes();
    if (minutes !== 0 && minutes !== 30) {
      Alert.alert(
        'Hora inválida',
        'Solo se permiten reservas a las horas en punto o a las medias horas (ej: 9:00, 9:30, 10:00).',
        [{ text: 'OK' }]
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
        appointment.idCita,
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

  const renderDatePickerModal = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
    const days = Array.from({ length: getDaysInMonth(tempMonth, tempYear) }, (_, i) => i + 1);

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerModalTitle}>Seleccionar Fecha</Text>
                
                <View style={styles.pickerRow}>
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerColumnLabel}>Día</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {days.map(day => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.pickerItem,
                            tempDay === day && styles.pickerItemActive
                          ]}
                          onPress={() => setTempDay(day)}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            tempDay === day && styles.pickerItemTextActive
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerColumnLabel}>Mes</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {months.map((month, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.pickerItem,
                            tempMonth === index && styles.pickerItemActive
                          ]}
                          onPress={() => {
                            setTempMonth(index);
                            const maxDay = getDaysInMonth(index, tempYear);
                            if (tempDay > maxDay) {
                              setTempDay(maxDay);
                            }
                          }}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            tempMonth === index && styles.pickerItemTextActive
                          ]}>
                            {month}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerColumnLabel}>Año</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {years.map(year => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerItem,
                            tempYear === year && styles.pickerItemActive
                          ]}
                          onPress={() => setTempYear(year)}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            tempYear === year && styles.pickerItemTextActive
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.pickerButtons}>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.pickerButtonCancel]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.pickerButtonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.pickerButtonConfirm]}
                    onPress={confirmDate}
                  >
                    <Text style={styles.pickerButtonTextConfirm}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderTimePickerModal = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    // Solo permitir minutos 0 y 30
    const minutes = [0, 30];

    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerModalTitle}>Seleccionar Hora</Text>
                <Text style={styles.pickerHelpText}>
                  Solo horas en punto o medias horas (8 AM - 6 PM)
                </Text>
                
                <View style={styles.pickerRow}>
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerColumnLabel}>Hora</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {hours.map(hour => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.pickerItem,
                            tempHour === hour && styles.pickerItemActive
                          ]}
                          onPress={() => setTempHour(hour)}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            tempHour === hour && styles.pickerItemTextActive
                          ]}>
                            {hour}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerColumnLabel}>Minuto</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {minutes.map(minute => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.pickerItem,
                            tempMinute === minute && styles.pickerItemActive
                          ]}
                          onPress={() => setTempMinute(minute)}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            tempMinute === minute && styles.pickerItemTextActive
                          ]}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerColumnLabel}>AM/PM</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {['AM', 'PM'].map(period => (
                        <TouchableOpacity
                          key={period}
                          style={[
                            styles.pickerItem,
                            tempAmPm === period && styles.pickerItemActive
                          ]}
                          onPress={() => setTempAmPm(period as 'AM' | 'PM')}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            tempAmPm === period && styles.pickerItemTextActive
                          ]}>
                            {period}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.pickerButtons}>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.pickerButtonCancel]}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.pickerButtonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.pickerButtonConfirm]}
                    onPress={confirmTime}
                  >
                    <Text style={styles.pickerButtonTextConfirm}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
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
              onPress={openDatePicker}
              icon="calendar"
              variant="outline"
              fullWidth
            />
          </View>

          <View style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Hora</Text>
            <Button
              title={formatTime(selectedTime)}
              onPress={openTimePicker}
              icon="clock"
              variant="outline"
              fullWidth
            />
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

      {renderDatePickerModal()}
      {renderTimePickerModal()}

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  pickerModal: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },

  pickerModalTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  pickerHelpText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },

  pickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  pickerColumn: {
    flex: 1,
  },

  pickerColumnLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },

  pickerScroll: {
    maxHeight: 200,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  pickerItemActive: {
    backgroundColor: colors.primary.main,
  },

  pickerItemText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontSize: 16,
  },

  pickerItemTextActive: {
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.semibold,
  },

  pickerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  pickerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },

  pickerButtonCancel: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  pickerButtonConfirm: {
    backgroundColor: colors.primary.main,
  },

  pickerButtonTextCancel: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  pickerButtonTextConfirm: {
    ...typography.styles.body,
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.semibold,
  },
});