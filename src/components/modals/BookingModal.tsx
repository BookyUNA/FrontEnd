/**
 * Modal para reservar cita - Booky
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import { ServicioCliente } from '../../services/services/clientServicesService';
import { FormularioReserva } from '../../services/Booking/booking';
import { bookingService } from '../../services/Booking/BookingService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  service: ServicioCliente | null;
  onSuccess?: (citaId: number) => void;
}

export const BookingModal = ({
  visible,
  onClose,
  service,
  onSuccess
}: BookingModalProps) => {
  const [formulario, setFormulario] = useState<FormularioReserva>({
    fecha: new Date(),
    hora: new Date(),
    observaciones: ''
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redondear hora a la hora exacta o media hora más cercana
  const roundToNearestHalfHour = (date: Date): Date => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    
    if (minutes < 15) {
      rounded.setMinutes(0);
    } else if (minutes < 45) {
      rounded.setMinutes(30);
    } else {
      rounded.setMinutes(0);
      rounded.setHours(rounded.getHours() + 1);
    }
    
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    
    return rounded;
  };

  const resetForm = () => {
    const now = new Date();
    setFormulario({
      fecha: new Date(),
      hora: roundToNearestHalfHour(now),
      observaciones: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const {
      type,
      nativeEvent: { timestamp },
    } = event;
    
    setShowDatePicker(Platform.OS === 'ios');
    
    if (type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      if (!bookingService.validarFecha(selectedDate)) {
        Alert.alert(
          'Fecha inválida',
          'No puedes seleccionar una fecha en el pasado.',
          [{ text: 'OK' }]
        );
        return;
      }
      setFormulario(prev => ({ ...prev, fecha: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const {
      type,
      nativeEvent: { timestamp },
    } = event;
    
    setShowTimePicker(Platform.OS === 'ios');
    
    if (type === 'dismissed') {
      return;
    }
    
    if (selectedTime) {
      // Redondear a hora exacta o media hora
      const roundedTime = roundToNearestHalfHour(selectedTime);
      
      setFormulario(prev => ({ ...prev, hora: roundedTime }));
    }
  };

  const handleSubmit = async () => {
    if (!service) return;

    // Validar que la hora sea exacta o media hora
    const minutes = formulario.hora.getMinutes();
    if (minutes !== 0 && minutes !== 30) {
      Alert.alert(
        'Hora inválida',
        'Solo se permiten reservas a las horas en punto o a las medias horas (ej: 9:00, 9:30, 10:00).',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validaciones
    if (!bookingService.validarFecha(formulario.fecha)) {
      Alert.alert('Error', 'La fecha seleccionada no es válida.');
      return;
    }

    const hours = formulario.hora.getHours();
    if (hours < 8 || hours >= 18) {
      Alert.alert('Error', 'La hora debe estar entre 8:00 AM y 6:00 PM.');
      return;
    }

    if (formulario.observaciones.trim().length === 0) {
      Alert.alert('Error', 'Por favor agrega algunas observaciones o notas.');
      return;
    }

    try {
      setLoading(true);

      const request = {
        IdServicio: service.idServicio,
        FechaCita: bookingService.formatearFechaParaAPI(formulario.fecha, formulario.hora),
        MensajeSolicitud: formulario.observaciones.trim()
      };

      console.log('=== REQUEST ENVIADO ===');
      console.log('IdServicio:', request.IdServicio);
      console.log('FechaCita:', request.FechaCita);
      console.log('MensajeSolicitud:', request.MensajeSolicitud);
      console.log('Request completo:', JSON.stringify(request, null, 2));

      const response = await bookingService.solicitarCita(request);

      console.log('=== RESPONSE RECIBIDO ===');
      console.log('Response completo:', JSON.stringify(response, null, 2));
      console.log('resultado:', response.resultado);
      console.log('IdCita:', response.IdCita);
      console.log('error array:', response.error);

      if (response.resultado) {
        Alert.alert(
          'Solicitud enviada',
          'Tu solicitud de cita ha sido enviada exitosamente. El profesional te contactará pronto.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onSuccess?.(response.IdCita);
              }
            }
          ]
        );
      } else {
        console.log('=== ERRORES DE LA API ===');
        if (response.error && response.error.length > 0) {
          response.error.forEach((err, index) => {
            console.log(`Error ${index + 1}:`, err);
            console.log(`  - ErrorCode: ${err.ErrorCode}`);
            console.log(`  - Message: ${err.Message}`);
          });
        } else {
          console.log('No hay errores en el array o está vacío');
        }

        const errores = response.error?.map(e => e.Message).join('\n') || 'Error desconocido - revisar consola';
        Alert.alert('Error', `No se pudo procesar la solicitud:\n${errores}`);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Ocurrió un error al enviar la solicitud. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!service) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Reservar Cita</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.nombreServicio}</Text>
              <Text style={styles.professionalInfo}>
                {service.nombreProfesional} - {service.profesion}
              </Text>
              <Text style={styles.serviceDetails}>
                Duración: {service.duracionMinutos} min | Precio: ${service.precio.toFixed(2)}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha preferida *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formulario.fecha.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora preferida *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formulario.hora.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>
              <Text style={styles.helpText}>
                Solo se permiten horas en punto o medias horas (ej: 9:00, 9:30)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observaciones y disponibilidad *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Ej: En caso de no poder a esta hora, mi disponibilidad es L: 8am-10am, V: 2pm-6pm"
                value={formulario.observaciones}
                onChangeText={(text) => setFormulario(prev => ({ ...prev, observaciones: text }))}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {formulario.observaciones.length}/500
              </Text>
            </View>

            <View style={styles.infoNote}>
              <Text style={styles.infoText}>
                📝 Esta es una solicitud. El profesional confirmará la disponibilidad y se pondrá en contacto contigo.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DatePicker
          testID="dateTimePicker"
          value={formulario.fecha}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DatePicker
          testID="timeTimePicker"
          value={formulario.hora}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
          minuteInterval={30}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    width: '90%',
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  serviceInfo: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  professionalInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  serviceDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateButton: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.dark,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  textArea: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.dark,
    fontSize: 14,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  infoNote: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.dark,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});