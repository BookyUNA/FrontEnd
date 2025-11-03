/**
 * Modal de Detalles del Servicio - Booky
 * Modal personalizado para mostrar información detallada del servicio seleccionado
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { ServicioCliente } from '../../services/services/clientServicesService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ServiceDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  service: ServicioCliente | null;
  onReserve: (service: ServicioCliente) => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  visible,
  onClose,
  service,
  onReserve,
}) => {
  if (!service) return null;

  const handleReserve = () => {
    onReserve(service);
    // No cerrar inmediatamente, dejar que el componente padre maneje la transición
  };

  const ratingValue = (service as any).calificacionPromedio;
  const hasRating = ratingValue !== undefined && ratingValue !== null;

  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.ratingContainer}>
        {/* Estrellas llenas */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Icon
            key={`full-${index}`}
            name="star"
            size={16}
            color={colors.states.warning}
            solid
          />
        ))}
        
        {/* Media estrella */}
        {hasHalfStar && (
          <Icon
            name="star-half-alt"
            size={16}
            color={colors.states.warning}
            solid
          />
        )}
        
        {/* Estrellas vacías */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Icon
            key={`empty-${index}`}
            name="star"
            size={16}
            color={colors.border.medium}
          />
        ))}
        
        <Text style={styles.ratingText}>
          {rating.toFixed(1)} / 5.0
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles del Servicio</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="times" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Contenido */}
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Nombre del servicio */}
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.nombreServicio}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>₡{service.precio.toFixed(2)}</Text>
                    {service.permiteDescuento && (
                      <View style={styles.discountBadge}>
                        <Icon name="percent" size={12} color={colors.states.success} />
                        <Text style={styles.discountText}>
                          {service.porcentajeDescuento}% desc.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Información del profesional */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Icon name="user" size={16} color={colors.primary.main} />
                    <Text style={styles.infoLabel}>Profesional</Text>
                    <Text style={styles.infoValue}>{service.nombreProfesional}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="briefcase" size={16} color={colors.primary.main} />
                    <Text style={styles.infoLabel}>Profesión</Text>
                    <Text style={styles.infoValue}>{service.profesion}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="clock" size={16} color={colors.primary.main} />
                    <Text style={styles.infoLabel}>Duración</Text>
                    <Text style={styles.infoValue}>{service.duracionMinutos} minutos</Text>
                  </View>

                  {hasRating && (
                    <View style={styles.infoRow}>
                      <Icon name="star" size={16} color={colors.primary.main} />
                      <Text style={styles.infoLabel}>Calificación</Text>
                      <View style={styles.infoValueContainer}>
                        {renderRatingStars(ratingValue)}
                      </View>
                    </View>
                  )}
                </View>

                {/* Descripción */}
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Descripción</Text>
                  <Text style={styles.descriptionText}>{service.descripcion}</Text>
                </View>
              </ScrollView>

              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cerrar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reserveButton} 
                  onPress={handleReserve}
                >
                  <Text style={styles.reserveButtonText}>Reservar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
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
    flex: 1,
  },

  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },

  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  serviceHeader: {
    marginBottom: spacing.lg,
  },

  serviceName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  price: {
    ...typography.styles.h3,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },

  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.states.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },

  discountText: {
    ...typography.styles.caption,
    color: colors.states.success,
    fontWeight: typography.fontWeight.semibold,
  },

  infoSection: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  infoLabel: {
    ...typography.styles.body,
    color: colors.text.secondary,
    flex: 1,
  },

  infoValue: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    flex: 2,
    textAlign: 'right',
  },

  infoValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  ratingText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },

  descriptionSection: {
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },

  descriptionText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },

  actionButtons: {
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
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: 'center',
  },

  cancelButtonText: {
    ...typography.styles.button,
    color: colors.text.secondary,
  },

  reserveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },

  reserveButtonText: {
    ...typography.styles.button,
    color: colors.primary.contrast,
  },
});