/**
 * Modal para configurar horarios semanales del profesional
 * Permite definir un rango de fechas y patrones de días con horarios específicos
 */

import React, { useState, useEffect } from 'react';
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
import { scheduleService, HorarioProfesional } from '../../services/schedule';

interface ConfigureScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
type DatePickerMode = 'start' | 'end' | null;

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

  const getNextMonday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  };

  const getOneMonthLater = (fromDate: Date): Date => {
    const date = new Date(fromDate);
    date.setMonth(date.getMonth() + 1);
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const [fechaInicio, setFechaInicio] = useState<Date>(getNextMonday());
  const [fechaFin, setFechaFin] = useState<Date>(getOneMonthLater(getNextMonday()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<DatePickerMode>(null);
  
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    diasSemana.map((dia) => ({
      id: `day-${dia.index}`,
      dayName: dia.name,
      dayIndex: dia.index,
      enabled: dia.index >= 1 && dia.index <= 5,
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
  const [generatedDatesCount, setGeneratedDatesCount] = useState<number>(0);

  useEffect(() => {
    calculateGeneratedDates();
  }, [fechaInicio, fechaFin, schedules]);

  useEffect(() => {
    if (messageType === 'success') {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [messageType]);

  const calculateGeneratedDates = () => {
    const enabledDays = schedules.filter(s => s.enabled).map(s => s.dayIndex);
    if (enabledDays.length === 0) {
      setGeneratedDatesCount(0);
      return;
    }

    let count = 0;
    const current = new Date(fechaInicio);
    const end = new Date(fechaFin);

    while (current <= end) {
      if (enabledDays.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    setGeneratedDatesCount(count);
  };

  const resetForm = () => {
    const nextMonday = getNextMonday();
    setFechaInicio(nextMonday);
    setFechaFin(getOneMonthLater(nextMonday));
    setSchedules(
      diasSemana.map((dia) => ({
        id: `day-${dia.index}`,
        dayName: dia.name,
        dayIndex: dia.index,
        enabled: dia.index >= 1 && dia.index <= 5,
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

  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate && datePickerMode) {
      if (datePickerMode === 'start') {
        const newStartDate = new Date(selectedDate);
        newStartDate.setHours(0, 0, 0, 0);
        setFechaInicio(newStartDate);
        
        if (newStartDate > fechaFin) {
          const newEndDate = getOneMonthLater(newStartDate);
          setFechaFin(newEndDate);
        }
      } else {
        const newEndDate = new Date(selectedDate);
        newEndDate.setHours(23, 59, 59, 999);
        setFechaFin(newEndDate);
      }
    }
    
    setDatePickerMode(null);
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
      newErrors.general = 'Debes seleccionar al menos un día de la semana';
    }

    if (fechaInicio > fechaFin) {
      newErrors.dateRange = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    enabledSchedules.forEach((schedule) => {
      if (schedule.horaInicio >= schedule.horaFin) {
        newErrors[schedule.id] = 'La hora de fin debe ser posterior a la de inicio';
      }
    });

    if (generatedDatesCount === 0) {
      newErrors.general = 'No se generarán horarios con la configuración actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSpecificDates = (): HorarioProfesional[] => {
    const horarios: HorarioProfesional[] = [];
    const current = new Date(fechaInicio);
    const end = new Date(fechaFin);

    const enabledSchedulesMap = new Map(
      schedules.filter(s => s.enabled).map(s => [s.dayIndex, s])
    );

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const schedule = enabledSchedulesMap.get(dayOfWeek);
      
      if (schedule) {
        horarios.push({
          HoraInicio: formatTimeForAPI(schedule.horaInicio),
          HoraFin: formatTimeForAPI(schedule.horaFin),
          FechaDiaSemana: formatDateForAPI(current),
          Estado: 'Activa',
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    return horarios;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setMessageType(null);

    const horarios = generateSpecificDates();

    console.log('📅 ConfigureScheduleModal: Enviando horarios al servicio');
    console.log(`📅 Total de horarios generados: ${horarios.length}`);

    try {
      const response = await scheduleService.addSchedules({ horarios });

      if (response.success && response.data) {
        const failedCount = response.data.HorariosFallidos?.length || 0;
        
        if (failedCount === 0) {
          setMessage(`¡Horarios configurados exitosamente! Se crearon ${horarios.length} horarios.`);
          setMessageType('success');
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          const successCount = horarios.length - failedCount;
          setMessage(`Se crearon ${successCount} horarios. ${failedCount} horarios no pudieron agregarse (fechas pasadas o duplicados).`);
          setMessageType('error');
        }
      } else {
        setMessage(response.error || 'Error al configurar los horarios. Intenta nuevamente.');
        setMessageType('error');
      }
    } catch (error) {
      console.log('📅 ConfigureScheduleModal: Error inesperado:', error);
      setMessage('Error al conectar con el servidor. Intenta nuevamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeForAPI = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = '00';
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
                Define el rango de fechas y selecciona los días de la semana con sus horarios. 
                Se crearán horarios específicos para cada fecha que coincida.
              </Text>
            </View>

            {errors.general && (
              <View style={styles.errorBox}>
                <Icon name="exclamation-circle" size={16} color={colors.states.error} />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rango de fechas</Text>
              
              <View style={styles.dateRangeContainer}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Desde</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => openDatePicker('start')}
                  >
                    <Icon name="calendar" size={14} color={colors.primary.main} />
                    <Text style={styles.dateButtonText}>
                      {formatDate(fechaInicio)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Hasta</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => openDatePicker('end')}
                  >
                    <Icon name="calendar" size={14} color={colors.primary.main} />
                    <Text style={styles.dateButtonText}>
                      {formatDate(fechaFin)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {errors.dateRange && (
                <View style={styles.fieldErrorContainer}>
                  <Icon name="exclamation-triangle" size={12} color={colors.states.error} />
                  <Text style={styles.dayErrorText}>{errors.dateRange}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Días y horarios</Text>
                {schedules.filter((s) => s.enabled).length > 1 && (
                  <TouchableOpacity
                    style={styles.applyAllButtonSmall}
                    onPress={applyToAllDays}
                    activeOpacity={0.7}
                  >
                    <Icon name="copy" size={12} color={colors.primary.main} />
                    <Text style={styles.applyAllTextSmall}>Copiar al resto</Text>
                  </TouchableOpacity>
                )}
              </View>

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
                            <Icon name="check" size={12} color={colors.text.inverse} />
                          )}
                        </View>
                        <Text style={styles.dayName}>{schedule.dayName}</Text>
                      </View>
                    </TouchableOpacity>

                    {schedule.enabled && (
                      <View style={styles.timeControls}>
                        <View style={styles.timeInputGroup}>
                          <Text style={styles.timeLabel}>Inicio</Text>
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => openTimePicker(schedule.id, 'start')}
                          >
                            <Icon name="clock" size={12} color={colors.primary.main} />
                            <Text style={styles.timeButtonText}>
                              {formatTime(schedule.horaInicio)}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.timeSeparator}>
                          <Icon name="arrow-right" size={12} color={colors.text.tertiary} />
                        </View>

                        <View style={styles.timeInputGroup}>
                          <Text style={styles.timeLabel}>Fin</Text>
                          <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => openTimePicker(schedule.id, 'end')}
                          >
                            <Icon name="clock" size={12} color={colors.primary.main} />
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
            </View>

            {generatedDatesCount > 0 && (
              <View style={styles.previewBox}>
                <Icon name="calendar-check" size={16} color={colors.states.success} />
                <Text style={styles.previewText}>
                  Se crearán <Text style={styles.previewBold}>{generatedDatesCount} horarios</Text> específicos
                </Text>
              </View>
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

          {showDatePicker && (
            <DateTimePicker
              value={datePickerMode === 'start' ? fechaInicio : fechaFin}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
          )}

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

  section: {
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.sm,
  },

  dateRangeContainer: {
    gap: spacing.md,
  },

  dateInputGroup: {
    gap: spacing.xs,
  },

  dateLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  dateButtonText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },

  schedulesContainer: {
    gap: spacing.sm,
  },

  dayScheduleCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
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
    fontSize: 14,
  },

  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },

  timeInputGroup: {
    flex: 1,
  },

  timeLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontSize: 11,
  },

  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },

  timeButtonText: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },

  timeSeparator: {
    paddingTop: 16,
  },

  dayErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },

  dayErrorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    fontSize: 11,
  },

  applyAllButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.light + '20',
    borderRadius: 6,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.light,
  },

  applyAllTextSmall: {
    ...typography.styles.caption,
    color: colors.primary.main,
    fontWeight: '600',
    fontSize: 11,
  },

  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.states.success + '15',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  previewText: {
    ...typography.styles.body,
    color: colors.states.success,
    flex: 1,
  },

  previewBold: {
    fontWeight: '700',
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