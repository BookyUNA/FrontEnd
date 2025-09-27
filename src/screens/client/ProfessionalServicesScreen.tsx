/**
 * Pantalla de Servicios Profesionales - Booky
 * Para clientes que buscan servicios de profesionales
 */
import React, { useState } from 'react';
import {
  View,
  Alert,
  StyleSheet,
} from 'react-native';

import { ServiceSearch } from '../../components/search/ServiceSearch';
import { BookingModal } from '../../components/modals/BookingModal';
import { ServicioCliente } from '../../services/services/clientServicesService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

interface ProfessionalServicesScreenProps {
  navigation?: any;
}

export const ProfessionalServicesScreen: React.FC<ProfessionalServicesScreenProps> = ({ 
  navigation 
}) => {
  const [selectedService, setSelectedService] = useState<ServicioCliente | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleServiceSelect = (service: ServicioCliente) => {
    Alert.alert(
      'Servicio Seleccionado',
      `${service.nombreServicio}\n\n` +
      `Profesional: ${service.nombreProfesional}\n` +
      `Profesión: ${service.profesion}\n` +
      `Duración: ${service.duracionMinutos} minutos\n` +
      `Precio: ${service.precio.toFixed(2)}` +
      (service.permiteDescuento ? `\nDescuento disponible: ${service.porcentajeDescuento}%` : '') +
      `\n\nDescripción: ${service.descripcion}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Reservar',
          onPress: () => {
            setSelectedService(service);
            setShowBookingModal(true);
          }
        }
      ]
    );
  };

  const handleBookingSuccess = (citaId: number) => {
    console.log(`Cita creada exitosamente con ID: ${citaId}`);
    
    // Opcional: Navegar a una pantalla de confirmación o mis citas
    // navigation?.navigate('MisCitas');
    
    // Opcional: Mostrar un toast o notificación de éxito
    Alert.alert(
      'Éxito', 
      'Tu solicitud de cita ha sido enviada. Recibirás una confirmación pronto.',
      [{ text: 'OK' }]
    );
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedService(null);
  };

  return (
    <View style={styles.container}>
      <ServiceSearch onServiceSelect={handleServiceSelect} />
      
      <BookingModal
        visible={showBookingModal}
        onClose={handleCloseBookingModal}
        service={selectedService}
        onSuccess={handleBookingSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: spacing['8xl'],
  },
});