/**
 * Modal para crear eventos personalizados en el calendario
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { eventService } from '../../services/events';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: Date;
}

export interface EventData {
  NombreEvento: string;
  Descripcion: string;
  FechaHoraInicio: string;
  FechaHoraFin: string;
}

type MessageType = 'success' | 'error' | null;

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSuccess,
  selectedDate,
}) => {
  const getInitialDate = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setHours(9, 0, 0, 0);
      return date;
    }
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    return now;
  };

  const [nombreEvento, setNombreEvento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date>(getInitialDate());
  const [fechaFin, setFechaFin] = useState<Date>(() => {
    const endDate = getInitialDate();
    endDate.setHours(17, 0, 0, 0);
    return endDate;
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>(null);

  // Cuando se muestra mensaje de éxito, esperar 2 segundos y cerrar
  useEffect(() => {
    if (messageType === 'success') {
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [messageType]);

  const resetForm = () => {
    setNombreEvento('');
    setDescripcion('');
    const initialDate = getInitialDate();
    setFechaInicio(initialDate);
    const endDate = new Date(initialDate);
    endDate.setHours(17, 0, 0, 0);
    setFechaFin(endDate);
    setErrors({});
    setLoading(false);
    setMessage(null);
    setMessageType(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombreEvento.trim()) {
      newErrors.nombreEvento = 'El nombre del evento es requerido';
    }

    if (fechaInicio >= fechaFin) {
      newErrors.fechaFin = 'La hora de fin debe ser posterior a la de inicio';
    }

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

    const eventData: EventData = {
      NombreEvento: nombreEvento.trim(),
      Descripcion: descripcion.trim(),
      FechaHoraInicio: fechaInicio.toISOString(),
      FechaHoraFin: fechaFin.toISOString(),
    };

    try {
      const response = await eventService.createEvent(eventData);

      if (response.success && response.data) {
        // Mensaje de éxito
        const horariosMsg = response.data.HorariosDesactivados > 0 
          ? ` Se desactivaron ${response.data.HorariosDesactivados} horarios.`
          : '';
        
        setMessage(`¡Evento creado exitosamente!${horariosMsg}`);
        setMessageType('success');
        
        // Llamar callback de éxito DESPUÉS de mostrar el mensaje
        // El modal se cerrará automáticamente después de 2 segundos
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2100);
      } else {
        // Mensaje de error
        setMessage(response.error || 'Error desconocido al crear el evento');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error al conectar con el servidor. Intenta nuevamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newStartDate = new Date(selectedDate);
      newStartDate.setHours(fechaInicio.getHours(), fechaInicio.getMinutes(), 0, 0);
      setFechaInicio(newStartDate);
      
      const newEndDate = new Date(selectedDate);
      newEndDate.setHours(fechaFin.getHours(), fechaFin.getMinutes(), 0, 0);
      setFechaFin(newEndDate);
    }
  };

  const onChangeStartTime = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartDate = new Date(fechaInicio);
      newStartDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setFechaInicio(newStartDate);

      // Si hora de inicio >= hora fin, ajustar hora fin
      if (newStartDate >= fechaFin) {
        const newEndDate = new Date(newStartDate);
        newEndDate.setHours(newStartDate.getHours() + 1, newStartDate.getMinutes(), 0, 0);
        setFechaFin(newEndDate);
      }
    }
  };

  const onChangeEndTime = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newEndDate = new Date(fechaInicio);
      newEndDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setFechaFin(newEndDate);
    }
  };

  const formatDate = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
            <Text style={styles.modalTitle}>Crear Evento</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="times" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del evento *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.nombreEvento && styles.inputError
                ]}
                placeholder="Ej: Vacaciones de verano"
                value={nombreEvento}
                onChangeText={(text) => {
                  setNombreEvento(text);
                  if (errors.nombreEvento) {
                    setErrors({ ...errors, nombreEvento: '' });
                  }
                }}
                maxLength={100}
                placeholderTextColor={colors.text.tertiary}
                editable={!loading && messageType !== 'success'}
              />
              {errors.nombreEvento && (
                <Text style={styles.errorText}>{errors.nombreEvento}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción del evento"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
                placeholderTextColor={colors.text.tertiary}
                editable={!loading && messageType !== 'success'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
                disabled={loading || messageType === 'success'}
              >
                <Icon name="calendar" size={16} color={colors.primary.main} />
                <Text style={styles.dateButtonText}>{formatDate(fechaInicio)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeInputGroup}>
                <Text style={styles.label}>Hora inicio *</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowStartTimePicker(true)}
                  disabled={loading || messageType === 'success'}
                >
                  <Icon name="clock" size={16} color={colors.primary.main} />
                  <Text style={styles.timeButtonText}>{formatTime(fechaInicio)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeInputGroup}>
                <Text style={styles.label}>Hora fin *</Text>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    errors.fechaFin && styles.inputError
                  ]}
                  onPress={() => setShowEndTimePicker(true)}
                  disabled={loading || messageType === 'success'}
                >
                  <Icon name="clock" size={16} color={colors.primary.main} />
                  <Text style={styles.timeButtonText}>{formatTime(fechaFin)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.fechaFin && (
              <Text style={styles.errorText}>{errors.fechaFin}</Text>
            )}
          </ScrollView>

          {/* Mensaje de éxito o error */}
          {message && (
            <View style={[
              styles.messageContainer,
              messageType === 'success' ? styles.successMessage : styles.errorMessage
            ]}>
              <Icon 
                name={messageType === 'success' ? 'check-circle' : 'exclamation-circle'} 
                size={16} 
                color={messageType === 'success' ? colors.states.success : colors.states.error} 
              />
              <Text style={[
                styles.messageText,
                messageType === 'success' ? styles.successText : styles.errorMessageText
              ]}>
                {message}
              </Text>
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton, 
                (loading || messageType === 'success') && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={loading || messageType === 'success'}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Evento</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Date/Time Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={fechaInicio}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeStartDate}
              minimumDate={new Date()}
            />
          )}

          {showStartTimePicker && (
            <DateTimePicker
              value={fechaInicio}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeStartTime}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={fechaFin}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeEndTime}
              minimumDate={fechaInicio}
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

  inputGroup: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  input: {
    ...typography.styles.body,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
  },

  inputError: {
    borderColor: colors.states.error,
  },

  textArea: {
    minHeight: 80,
    paddingTop: spacing.sm,
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

  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  timeInputGroup: {
    flex: 1,
  },

  timeButton: {
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

  timeButtonText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  errorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    marginTop: spacing.xs,
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

  errorMessageText: {
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