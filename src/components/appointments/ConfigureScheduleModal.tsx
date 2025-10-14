/**
 * Modal para configurar horarios semanales del profesional
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ConfigureScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface HorarioProfesional {
  HoraInicio: string;
  HoraFin: string;
  FechaDiaSemana: string;
  Estado: string;
}

interface DaySchedule {
  id: string;
  dayName: string;
  dayIndex: number;
  enabled: boolean;
  horaInicio: Date;
  horaFin: Date;
}

type MessageType = 'success' | 'error' | null;

export const ConfigureScheduleModal: React.FC<ConfigureScheduleModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const diasSemana = [
    { name: 'Lunes', index: 1 },
    { name: 'Martes', index: 2 },
    { name: 'Miércoles', index: 3 },
    { name: 'Jueves', index: 4 },
    { name: 'Viernes', index: 5 },
    { name: 'Sábado', index: 6 },
    { name: 'Domingo', index: 0 },
  ];

  const getDefaultTime = (hour: number): Date => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const [schedules, setSchedules] = useState<DaySchedule[]>(
    diasSemana.map((dia) => ({
      id: `day-${dia.index}`,
      dayName: dia.name,
      dayIndex: dia.index,
      enabled: false,
      horaInicio: getDefaultTime(8),
      horaFin: getDefaultTime(17),
    }))
  );

  const [editingTimeSlot, setEditingTimeSlot] = useState<{
    dayId: string;
    type: 'start' | 'end';
  } | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>(null);

  const resetForm = () => {
    setSchedules(
      diasSemana.map((dia) => ({
        id: `day-${dia.index}`,
        dayName: dia.name,
        dayIndex: dia.index,
        enabled: false,
        horaInicio: getDefaultTime(8),
        horaFin: getDefaultTime(17),
      }))
    );
    setErrors({});
    setLoading(false);
    setMessage(null);
    setMessageType(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleDay = (dayId: string) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === dayId
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    );
  };

  const openTimePicker = (dayId: string, type: 'start' | 'end') => {
    const schedule = schedules.find((s) => s.id === dayId);
    if (!schedule) return;

    setTempTime(type === 'start' ? schedule.horaInicio : schedule.horaFin);
    setEditingTimeSlot({ dayId, type });
    setShowTimePicker(true);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime && editingTimeSlot) {
      setSchedules((prev) =>
        prev.map((schedule) => {
          if (schedule.id === editingTimeSlot.dayId) {
            const updatedSchedule = { ...schedule };
            
            if (editingTimeSlot.type === 'start') {
              updatedSchedule.horaInicio = selectedTime;
              
              if (selectedTime >= schedule.horaFin) {
                const newEndTime = new Date(selectedTime);
                newEndTime.setHours(selectedTime.getHours() + 1);
                updatedSchedule.horaFin = newEndTime;
              }
            } else {
              updatedSchedule.horaFin = selectedTime;
            }
            
            return updatedSchedule;
          }
          return schedule;
        })
      );
    }

    setEditingTimeSlot(null);
  };

  const applyToAllDays = () => {
    const firstEnabledSchedule = schedules.find((s) => s.enabled);
    if (!firstEnabledSchedule) return;

    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.enabled
          ? {
              ...schedule,
              horaInicio: new Date(firstEnabledSchedule.horaInicio),
              horaFin: new Date(firstEnabledSchedule.horaFin),
            }
          : schedule
      )
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const enabledSchedules = schedules.filter((s) => s.enabled);

    if (enabledSchedules.length === 0) {
      newErrors.general = 'Debes seleccionar al menos un día';
    }

    enabledSchedules.forEach((schedule) => {
      if (schedule.horaInicio >= schedule.horaFin) {
        newErrors[schedule.id] = 'La hora de fin debe ser posterior a la de inicio';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setMessageType(null);

    const enabledSchedules = schedules.filter((s) => s.enabled);

    const horarios: HorarioProfesional[] = enabledSchedules.map((schedule) => {
      const fechaDiaSemana = new Date();
      fechaDiaSemana.setDate(
        fechaDiaSemana.getDate() + 
        ((schedule.dayIndex - fechaDiaSemana.getDay() + 7) % 7)
      );

      return {
        HoraInicio: formatTimeForAPI(schedule.horaInicio),
        HoraFin: formatTimeForAPI(schedule.horaFin),
        FechaDiaSemana: fechaDiaSemana.toISOString(),
        Estado: 'Activo',
      };
    });

    console.log('Horarios a guardar:', JSON.stringify({ horarios }, null, 2));

    setTimeout(() => {
      setMessage('Horarios configurados exitosamente');
      setMessageType('success');
      setLoading(false);
      
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 2000);
    }, 1000);
  };

  const formatTimeForAPI = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = '00';
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configurar Horario</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="times" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBox}>
              <Icon name="info-circle" size={16} color={colors.states.info} />
              <Text style={styles.infoText}>
                Selecciona los días y configura el horario de atención. Puedes aplicar el mismo horario a todos los días seleccionados.
              </Text>
            </View>

            {errors.general && (
              <View style={styles.errorBox}>
                <Icon name="exclamation-circle" size={16} color={colors.states.error} />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <View style={styles.schedulesContainer}>
              {schedules.map((schedule) => (
                <View key={schedule.id} style={styles.dayScheduleCard}>
                  <TouchableOpacity
                    style={styles.dayHeader}
                    onPress={() => toggleDay(schedule.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          schedule.enabled && styles.checkboxChecked,
                        ]}
                      >
                        {schedule.enabled && (
                          <Icon name="check" size={14} color={colors.text.inverse} />
                        )}
                      </View>
                      <Text style={styles.dayName}>{schedule.dayName}</Text>
                    </View>

                    {schedule.enabled && (
                      <Text style={styles.dayStatus}>Activo</Text>
                    )}
                  </TouchableOpacity>

                  {schedule.enabled && (
                    <View style={styles.timeControls}>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeLabel}>Inicio</Text>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => openTimePicker(schedule.id, 'start')}
                        >
                          <Icon name="clock" size={14} color={colors.primary.main} />
                          <Text style={styles.timeButtonText}>
                            {formatTime(schedule.horaInicio)}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.timeSeparator}>
                        <Icon name="arrow-right" size={14} color={colors.text.tertiary} />
                      </View>

                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeLabel}>Fin</Text>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => openTimePicker(schedule.id, 'end')}
                        >
                          <Icon name="clock" size={14} color={colors.primary.main} />
                          <Text style={styles.timeButtonText}>
                            {formatTime(schedule.horaFin)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {errors[schedule.id] && (
                    <View style={styles.dayErrorContainer}>
                      <Icon name="exclamation-triangle" size={12} color={colors.states.error} />
                      <Text style={styles.dayErrorText}>{errors[schedule.id]}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {schedules.filter((s) => s.enabled).length > 1 && (
              <TouchableOpacity
                style={styles.applyAllButton}
                onPress={applyToAllDays}
                activeOpacity={0.7}
              >
                <Icon name="copy" size={16} color={colors.primary.main} />
                <Text style={styles.applyAllText}>
                  Aplicar horario del primer día a todos
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {message && (
            <View
              style={[
                styles.messageContainer,
                messageType === 'success' ? styles.successMessage : styles.errorMessage,
              ]}
            >
              <Icon
                name={messageType === 'success' ? 'check-circle' : 'exclamation-circle'}
                size={16}
                color={
                  messageType === 'success' ? colors.states.success : colors.states.error
                }
              />
              <Text
                style={[
                  styles.messageText,
                  messageType === 'success' ? styles.successText : styles.errorTextMessage,
                ]}
              >
                {message}
              </Text>
            </View>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Horario</Text>
              )}
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  modalTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
  },

  closeButton: {
    padding: spacing.sm,
  },

  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.states.info + '15',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  infoText: {
    ...typography.styles.caption,
    color: colors.states.info,
    flex: 1,
    lineHeight: 18,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.states.error + '15',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  errorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    flex: 1,
  },

  schedulesContainer: {
    gap: spacing.md,
  },

  dayScheduleCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },

  dayName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },

  dayStatus: {
    ...typography.styles.caption,
    color: colors.states.success,
    fontWeight: '600',
  },

  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },

  timeInputGroup: {
    flex: 1,
  },

  timeLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontSize: 12,
  },

  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },

  timeButtonText: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  timeSeparator: {
    paddingTop: 20,
  },

  dayErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },

  dayErrorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    fontSize: 11,
  },

  applyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.light + '20',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.light,
  },

  applyAllText: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },

  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: 8,
  },

  successMessage: {
    backgroundColor: colors.states.success + '15',
  },

  errorMessage: {
    backgroundColor: colors.states.error + '15',
  },

  messageText: {
    ...typography.styles.body,
    flex: 1,
  },

  successText: {
    color: colors.states.success,
  },

  errorTextMessage: {
    color: colors.states.error,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  cancelButtonText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary.main,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    ...typography.styles.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});