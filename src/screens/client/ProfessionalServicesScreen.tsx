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
import { ServiceDetailsModal } from '../../components/modals/ServiceDetailsModal';
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
  const [showServiceDetailsModal, setShowServiceDetailsModal] = useState(false);

  const handleServiceSelect = (service: ServicioCliente) => {
    setSelectedService(service);
    setShowServiceDetailsModal(true);
  };

  const handleReserveFromModal = (service: ServicioCliente) => {
    // Primero cerrar el modal de detalles
    setShowServiceDetailsModal(false);
    
    // Luego abrir el modal de reserva con un delay que permita la animación de cierre
    setTimeout(() => {
      setSelectedService(service);
      setShowBookingModal(true);
    }, 200);
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
    // Limpiar el servicio seleccionado cuando se cierre el modal de reserva
    setTimeout(() => {
      setSelectedService(null);
    }, 200);
  };

  const handleCloseServiceDetailsModal = () => {
    setShowServiceDetailsModal(false);
    // Limpiar el servicio con delay para permitir animaciones
    setTimeout(() => {
      setSelectedService(null);
    }, 300);
  };

  return (
    <View style={styles.container}>
      <ServiceSearch onServiceSelect={handleServiceSelect} />
      
      <ServiceDetailsModal
        visible={showServiceDetailsModal}
        onClose={handleCloseServiceDetailsModal}
        service={selectedService}
        onReserve={handleReserveFromModal}
      />
      
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