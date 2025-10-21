/**
 * Pantalla de Citas del Profesional - Booky
 * Vista de gestión de citas para usuarios profesionales
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { 
  appointmentService, 
  Appointment, 
  AppointmentStatus 
} from '../../services/Appointment/AppointmentService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ProfessionalAppointmentsScreenProps {
  navigation?: any;
}

type FilterStatus = AppointmentStatus | 'Todas';

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
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

const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case 'Pendiente': return colors.states.warning;
    case 'Confirmada': return colors.states.success;
    case 'Denegada': return colors.states.error; 
    case 'Cancelada': return colors.text.secondary;
    case 'Completada': return colors.primary.main;
    default: return colors.text.secondary;
  }
};

const getStatusIcon = (status: AppointmentStatus): string => {
  switch (status) {
    case 'Pendiente': return 'clock';
    case 'Confirmada': return 'check-circle';
    case 'Denegada': return 'times-circle';  
    case 'Cancelada': return 'ban';
    case 'Completada': return 'check-double';
    default: return 'question-circle';
  }
};

const renderRatingStars = (rating: number, size: number = 12) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon key={`full-${i}`} name="star" size={size} color={colors.states.warning} solid />
      ))}
      {hasHalfStar && (
        <Icon name="star-half-alt" size={size} color={colors.states.warning} solid />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon key={`empty-${i}`} name="star" size={size} color={colors.border.light} />
      ))}
    </View>
  );
};

export const ProfessionalAppointmentsScreen: React.FC<ProfessionalAppointmentsScreenProps> = ({ 
  navigation 
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('Todas');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isRejectionModalVisible, setIsRejectionModalVisible] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessingRejection, setIsProcessingRejection] = useState<boolean>(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [appointments, selectedFilter]);

  const loadAppointments = async () => {
    try {
      console.log('📅 ProfessionalAppointmentsScreen: Cargando citas...');
      
      const result = await appointmentService.getProfessionalAppointments();
      
      if (result.success && result.data) {
        console.log('📅 ProfessionalAppointmentsScreen: Citas cargadas:', result.data.length);
        const sortedAppointments = appointmentService.sortAppointmentsByDate(result.data, false);
        setAppointments(sortedAppointments);
      } else {
        console.log('📅 ProfessionalAppointmentsScreen: Error al cargar citas:', result.error);
        
        if (result.isNetworkError) {
          Alert.alert(
            'Error de Conexión',
            result.error || 'No se pudieron cargar las citas. Verifica tu conexión a internet.',
            [{ text: 'Entendido' }]
          );
        } else {
          Alert.alert(
            'Error',
            result.error || 'No se pudieron cargar las citas. Intenta de nuevo.',
            [{ text: 'Entendido' }]
          );
        }
        setAppointments([]);
      }
    } catch (error) {
      console.log('📅 ProfessionalAppointmentsScreen: Error inesperado:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  }, []);

  const applyFilter = () => {
    const filtered = appointmentService.filterAppointmentsByStatus(appointments, selectedFilter);
    setFilteredAppointments(filtered);
  };

  const handleFilterChange = (filter: FilterStatus) => {
    console.log('📅 ProfessionalAppointmentsScreen: Cambiando filtro a:', filter);
    setSelectedFilter(filter);
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    console.log('📅 ProfessionalAppointmentsScreen: Mostrando detalles de cita:', appointment.id);
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedAppointment(null);
  };

const handleConfirmAppointment = async () => {
  if (!selectedAppointment) return;

  Alert.alert(
    'Confirmar Cita',
    `¿Deseas confirmar la cita con ${selectedAppointment.nombreUsuario}?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'default',
        onPress: async () => {
          try {
            console.log('📅 Confirmando cita:', selectedAppointment.idCita);
            
            const result = await appointmentService.approveOrRejectAppointment(
              selectedAppointment.idCita,
              true
            );

            if (result.success) {
              Alert.alert(
                'Éxito',
                'La cita ha sido confirmada correctamente.',
                [{ 
                  text: 'Entendido',
                  onPress: () => {
                    handleCloseModal();
                    loadAppointments(); // Recargar lista de citas
                  }
                }]
              );
            } else {
              if (result.isNetworkError) {
                Alert.alert(
                  'Error de Conexión',
                  result.error || 'No se pudo confirmar la cita. Verifica tu conexión a internet.',
                  [{ text: 'Entendido' }]
                );
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'No se pudo confirmar la cita. Intenta de nuevo.',
                  [{ text: 'Entendido' }]
                );
              }
            }
          } catch (error) {
            Alert.alert(
              'Error',
              'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
              [{ text: 'Entendido' }]
            );
          }
        }
      }
    ]
  );
};

const handleRejectAppointment = () => {
  if (!selectedAppointment) return;
  
  setRejectionReason('');
  setIsRejectionModalVisible(true);
};

const handleConfirmRejection = async () => {
  if (!rejectionReason.trim()) {
    Alert.alert(
      'Motivo Requerido',
      'Debes proporcionar un motivo para denegar la cita.',  // CAMBIO
      [{ text: 'Entendido' }]
    );
    return;
  }

  if (!selectedAppointment) return;

  setIsProcessingRejection(true);

  try {
    console.log('📅 Denegando cita:', selectedAppointment.idCita);  // CAMBIO
    
    const result = await appointmentService.approveOrRejectAppointment(
      selectedAppointment.idCita,
      false,
      rejectionReason.trim()
    );

    if (result.success) {
      setIsRejectionModalVisible(false);
      setRejectionReason('');
      
      Alert.alert(
        'Cita Denegada',  // CAMBIO
        'La cita ha sido denegada. El cliente será notificado.',  // CAMBIO
        [{ 
          text: 'Entendido',
          onPress: () => {
            handleCloseModal();
            loadAppointments();
          }
        }]
      );
    } else {
      if (result.isNetworkError) {
        Alert.alert(
          'Error de Conexión',
          result.error || 'No se pudo denegar la cita. Verifica tu conexión a internet.',  // CAMBIO
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'No se pudo denegar la cita. Intenta de nuevo.',  // CAMBIO
          [{ text: 'Entendido' }]
        );
      }
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
      [{ text: 'Entendido' }]
    );
  } finally {
    setIsProcessingRejection(false);
  }
};

const handleCancelRejection = () => {
  setIsRejectionModalVisible(false);
  setRejectionReason('');
};

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mis Citas</Text>
      <Text style={styles.subtitle}>
        Gestiona las solicitudes de tus clientes
      </Text>
    </View>
  );

  const renderFilterTabs = () => {
    const filters: FilterStatus[] = ['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Denegada', 'Cancelada']; 
    const counts = appointmentService.getAppointmentCountByStatus(appointments);

    return (
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter;
            const count = counts[filter] || 0;
            
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                ]}
                onPress={() => handleFilterChange(filter)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}>
                  {filter}
                </Text>
                <View style={[
                  styles.filterBadge,
                  isActive && styles.filterBadgeActive,
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    isActive && styles.filterBadgeTextActive,
                  ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const statusColor = getStatusColor(appointment.estado);
    const statusIcon = getStatusIcon(appointment.estado);
    const isPast = appointment.fechaCita < new Date();
    const isPending = appointment.estado === 'Pendiente';

    return (
      <TouchableOpacity
        key={appointment.id}
        style={[
          styles.appointmentCard,
          isPending && styles.appointmentCardPending,
        ]}
        onPress={() => handleAppointmentPress(appointment)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <Icon name="briefcase" size={16} color={colors.primary.main} />
            <Text style={styles.serviceName} numberOfLines={1}>
              {appointment.nombreServicio}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Icon name={statusIcon} size={12} color={statusColor} solid />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {appointment.estado}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.clientInfo}>
            <Icon name="user" size={14} color={colors.text.secondary} />
            <Text style={styles.clientName} numberOfLines={1}>
              {appointment.nombreUsuario}
            </Text>
          </View>
          {appointment.telefonoUsuario && (
            <View style={styles.clientContact}>
              <Icon name="phone" size={12} color={colors.text.secondary} />
              <Text style={styles.contactText} numberOfLines={1}>
                {appointment.telefonoUsuario}
              </Text>
            </View>
          )}
        </View>

        {appointment.calificacionPromedio > 0 && (
            <View style={styles.ratingInfoContainer}>
              <View style={styles.ratingInfo}>
                <Icon name="award" size={12} color={colors.primary.main} />
                <Text style={styles.ratingLabel}>Calificación promedio:</Text>
              </View>
              <View style={styles.ratingValue}>
                {renderRatingStars(appointment.calificacionPromedio, 14)}
                <Text style={styles.ratingNumber}>
                  {appointment.calificacionPromedio.toFixed(1)}
                </Text>
              </View>
            </View>
          )}

        <View style={styles.cardFooter}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTime}>
              <Icon name="calendar" size={12} color={colors.text.secondary} />
              <Text style={styles.dateTimeText}>
                {formatDate(appointment.fechaCita)}
              </Text>
            </View>
            <View style={styles.dateTime}>
              <Icon name="clock" size={12} color={colors.text.secondary} />
              <Text style={styles.dateTimeText}>
                {formatTime(appointment.fechaCita)} ({appointment.duracionMinutos} min)
              </Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ₡{appointment.precioAcordado.toLocaleString('es-CR')}
            </Text>
          </View>
        </View>

        {isPast && appointment.estado !== 'Completada' && (
          <View style={styles.pastIndicator}>
            <Icon name="exclamation-triangle" size={10} color={colors.states.warning} />
            <Text style={styles.pastIndicatorText}>Cita pasada</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.pendingBadge}>
            <Icon name="bell" size={10} color={colors.states.warning} />
            <Text style={styles.pendingBadgeText}>Requiere atención</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAppointmentsList = () => {
  if (filteredAppointments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="calendar-times" size={60} color={colors.text.secondary} />
        <Text style={styles.emptyTitle}>
          {selectedFilter === 'Todas' 
            ? 'No tienes citas registradas' 
            : `No tienes citas ${selectedFilter.toLowerCase()}`}  {/* esto mostrará "denegadas" */}
        </Text>
        <Text style={styles.emptyMessage}>
          {selectedFilter === 'Pendiente'
            ? 'Cuando recibas solicitudes de citas, aparecerán aquí'
            : 'Intenta cambiar el filtro para ver otras citas'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.appointmentsList}>
      {filteredAppointments.map(renderAppointmentCard)}
    </View>
  );
};

  const renderDetailsModal = () => {
    if (!selectedAppointment) return null;

    const statusColor = getStatusColor(selectedAppointment.estado);
    const statusIcon = getStatusIcon(selectedAppointment.estado);
    const isPending = selectedAppointment.estado === 'Pendiente';

    return (
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Cita</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Icon name="times" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.modalStatusBadge, { backgroundColor: statusColor + '20' }]}>
                <Icon name={statusIcon} size={20} color={statusColor} solid />
                <Text style={[styles.modalStatusText, { color: statusColor }]}>
                  {selectedAppointment.estado}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Servicio</Text>
                <View style={styles.modalField}>
                  <Icon name="briefcase" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {selectedAppointment.nombreServicio}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Cliente</Text>
                <View style={styles.modalField}>
                  <Icon name="user" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {selectedAppointment.nombreUsuario}
                  </Text>
                </View>
                {selectedAppointment.cedulaUsuario && (
                  <View style={styles.modalField}>
                    <Icon name="id-card" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.cedulaUsuario}
                    </Text>
                  </View>
                )}
                {selectedAppointment.emailUsuario && (
                  <View style={styles.modalField}>
                    <Icon name="envelope" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.emailUsuario}
                    </Text>
                  </View>
                )}
                {selectedAppointment.telefonoUsuario && (
                  <View style={styles.modalField}>
                    <Icon name="phone" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.telefonoUsuario}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Fecha y Hora</Text>
                <View style={styles.modalField}>
                  <Icon name="calendar" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {formatDate(selectedAppointment.fechaCita)}
                  </Text>
                </View>
                <View style={styles.modalField}>
                  <Icon name="clock" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {formatTime(selectedAppointment.fechaCita)}
                  </Text>
                </View>
                <View style={styles.modalField}>
                  <Icon name="hourglass-half" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {selectedAppointment.duracionMinutos} minutos
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Precio</Text>
                <View style={styles.modalField}>
                  <Icon name="money-bill-wave" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    ₡{selectedAppointment.precioAcordado.toLocaleString('es-CR')}
                  </Text>
                </View>
              </View>

              {selectedAppointment.calificacionPromedio > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Tu Calificación Promedio</Text>
                  <View style={styles.modalRatingContainer}>
                    {renderRatingStars(selectedAppointment.calificacionPromedio, 18)}
                    <Text style={styles.modalRatingValue}>
                      {selectedAppointment.calificacionPromedio.toFixed(1)} de 5.0
                    </Text>
                  </View>
                </View>
              )}

              {selectedAppointment.estado === 'Completada' && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Estado de Calificación</Text>
                  <View style={styles.modalField}>
                    <Icon 
                      name={selectedAppointment.estadoCalificacion === 'Calificada' ? 'star' : 'star-half-alt'} 
                      size={14} 
                      color={selectedAppointment.estadoCalificacion === 'Calificada' ? colors.states.warning : colors.text.secondary} 
                    />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.estadoCalificacion === 'Calificada' 
                        ? 'El cliente calificó este servicio' 
                        : 'Pendiente de calificación del cliente'}
                    </Text>
                  </View>
                </View>
              )}

              {selectedAppointment.mensajeSolicitud && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Mensaje del Cliente</Text>
                  <Text style={styles.modalMessage}>
                    {selectedAppointment.mensajeSolicitud}
                  </Text>
                </View>
              )}

              {selectedAppointment.motivoRechazo && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.states.error }]}>
                    Motivo de Rechazo
                  </Text>
                  <Text style={[styles.modalMessage, { color: colors.states.error }]}>
                    {selectedAppointment.motivoRechazo}
                  </Text>
                </View>
              )}

              {selectedAppointment.motivoCancelacion && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Motivo de Cancelación</Text>
                  <Text style={styles.modalMessage}>
                    {selectedAppointment.motivoCancelacion}
                  </Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Información Adicional</Text>
                <View style={styles.modalField}>
                  <Icon name="paper-plane" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    Solicitada: {formatDate(selectedAppointment.fechaSolicitud)}
                  </Text>
                </View>
                {selectedAppointment.fechaRespuesta && (
                  <View style={styles.modalField}>
                    <Icon name="reply" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      Respondida: {formatDate(selectedAppointment.fechaRespuesta)}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {isPending ? (
                <View style={styles.actionButtonsRow}>
                  <View style={styles.actionButton}>
                    <Button
                      title="Rechazar"
                      onPress={handleRejectAppointment}
                      variant="outline"
                      icon="times"
                      iconPosition="left"
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Confirmar"
                      onPress={handleConfirmAppointment}
                      variant="primary"
                      icon="check"
                      iconPosition="left"
                    />
                  </View>
                </View>
              ) : (
                <Button
                  title="Cerrar"
                  onPress={handleCloseModal}
                  variant="primary"
                  fullWidth
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  const renderRejectionModal = () => {
  if (!selectedAppointment) return null;

  return (
    <Modal
      visible={isRejectionModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancelRejection}
    >
      <View style={styles.rejectionModalOverlay}>
        <View style={styles.rejectionModalContent}>
          <View style={styles.rejectionModalHeader}>
            <Icon name="exclamation-circle" size={24} color={colors.states.error} />
            <Text style={styles.rejectionModalTitle}>Denegar Cita</Text>
          </View>

          <View style={styles.rejectionModalBody}>
            <Text style={styles.rejectionModalText}>
              Estás a punto de denegar la cita con <Text style={styles.rejectionModalClientName}>{selectedAppointment.nombreUsuario}</Text>
            </Text>
            
            <Text style={styles.rejectionModalLabel}>
              Motivo de denegación <Text style={styles.requiredAsterisk}>*</Text>  
            </Text>
            
            <TextInput
              style={styles.rejectionTextInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Ej: No tengo disponibilidad en esa fecha"
              placeholderTextColor={colors.text.secondary}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
              editable={!isProcessingRejection}
            />
            
            <Text style={styles.characterCounter}>
              {rejectionReason.length}/200 caracteres
            </Text>
          </View>

          <View style={styles.rejectionModalFooter}>
            <View style={styles.rejectionButtonsRow}>
              <View style={styles.rejectionButton}>
                <Button
                  title="Cancelar"
                  onPress={handleCancelRejection}
                  variant="outline"
                  disabled={isProcessingRejection}
                />
              </View>
              <View style={styles.rejectionButton}>
                <Button
                  title={isProcessingRejection ? "Denegando..." : "Denegar Cita"}  
                  onPress={handleConfirmRejection}
                  variant="primary"
                  loading={isProcessingRejection}
                  disabled={isProcessingRejection || !rejectionReason.trim()}
                  icon="times-circle"
                  iconPosition="left"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Icon name="spinner" size={40} color={colors.primary.main} />
      <Text style={styles.loadingText}>Cargando citas...</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeContainer>
        {renderLoadingState()}
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {renderHeader()}
        {renderFilterTabs()}
        {renderAppointmentsList()}
      </ScrollView>
      {renderDetailsModal()}
      {renderRejectionModal()}
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  header: {
    paddingTop: spacing['8xl'],
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  filterContainer: {
    marginBottom: spacing.lg,
  },

  filterScrollContent: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs,
  },

  filterTabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },

  filterTabText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    fontSize: 14,
  },

  filterTabTextActive: {
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.semibold,
  },

  filterBadge: {
    backgroundColor: colors.border.light,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterBadgeActive: {
    backgroundColor: colors.primary.contrast + '30',
  },

  filterBadgeText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: 12,
  },

  filterBadgeTextActive: {
    color: colors.primary.contrast,
  },

  appointmentsList: {
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },

  appointmentCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  appointmentCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: colors.states.warning,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },

  serviceName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },

  statusText: {
    ...typography.styles.caption,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 11,
  },

  cardContent: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },

  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  clientName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },

  clientContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.lg + spacing.sm,
  },

  contactText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },

  dateTimeContainer: {
    flex: 1,
    gap: spacing.xs,
  },

  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  dateTimeText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },

  priceContainer: {
    alignItems: 'flex-end',
  },

  price: {
    ...typography.styles.h3,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },

  pastIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.states.warning + '20',
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },

  pastIndicatorText: {
    ...typography.styles.caption,
    color: colors.states.warning,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 11,
  },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.states.warning + '30',
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },

  pendingBadgeText: {
    ...typography.styles.caption,
    color: colors.states.warning,
    fontWeight: typography.fontWeight.bold,
    fontSize: 11,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  emptyMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  modalTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  closeButton: {
    padding: spacing.xs,
  },

  modalBody: {
    padding: spacing.lg,
  },

  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },

  modalStatusText: {
    ...typography.styles.h3,
    fontWeight: typography.fontWeight.bold,
  },

  modalSection: {
    marginBottom: spacing.xl,
  },

  modalSectionTitle: {
    ...typography.styles.label,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    fontSize: 12,
  },

  modalField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  modalFieldValue: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  modalMessage: {
    ...typography.styles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: spacing.sm,
    lineHeight: 22,
  },

  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },

  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  actionButton: {
    flex: 1,
  },

  // Estilos del modal de rechazo
  rejectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  rejectionModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  rejectionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },

  rejectionModalTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },

  rejectionModalBody: {
    padding: spacing.lg,
  },

  rejectionModalText: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  rejectionModalClientName: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },

  rejectionModalLabel: {
    ...typography.styles.label,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },

  requiredAsterisk: {
    color: colors.states.error,
  },

  rejectionTextInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 100,
    maxHeight: 150,
  },

  characterCounter: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  rejectionModalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },

  rejectionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  rejectionButton: {
    flex: 1,
  },
  ratingInfoContainer: {
  paddingTop: spacing.sm,
  marginTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.border.light,
  gap: spacing.xs,
},

ratingInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
},

ratingLabel: {
  ...typography.styles.caption,
  color: colors.text.secondary,
  fontSize: 11,
  fontWeight: typography.fontWeight.medium,
},

ratingValue: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  marginLeft: spacing.lg + spacing.xs,
},

ratingNumber: {
  ...typography.styles.caption,
  color: colors.primary.main,
  fontSize: 12,
  fontWeight: typography.fontWeight.bold,
},

modalRatingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,
  backgroundColor: colors.background.secondary,
  padding: spacing.md,
  borderRadius: spacing.sm,
},

modalRatingValue: {
  ...typography.styles.h3,
  color: colors.primary.main,
  fontWeight: typography.fontWeight.bold,
},
});