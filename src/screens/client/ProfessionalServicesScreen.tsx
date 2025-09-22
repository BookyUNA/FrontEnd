/**
 * Pantalla de Servicios Profesionales - Booky
 * Para clientes que buscan servicios de profesionales
 */

import React from 'react';
import {
  View,
  Alert,
  StyleSheet,
} from 'react-native';

import { ServiceSearch } from '../../components/search/ServiceSearch';
import { ServicioCliente } from '../../services/services/clientServicesService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

interface ProfessionalServicesScreenProps {
  navigation?: any;
}

export const ProfessionalServicesScreen: React.FC<ProfessionalServicesScreenProps> = ({ 
  navigation 
}) => {
  
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
            Alert.alert(
              'Próximamente',
              'La funcionalidad de reservas estará disponible pronto.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ServiceSearch onServiceSelect={handleServiceSelect} />
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