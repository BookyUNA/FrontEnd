/**
 * Pantalla de Citas del Cliente - Booky
 * Vista de gestión de citas para usuarios clientes
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
  TouchableWithoutFeedback,
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

// =============================================
// INTERFACES
// =============================================

interface ClientAppointmentsScreenProps {
  navigation?: any;
}

type FilterStatus = AppointmentStatus | 'Todas';

interface MenuOption {
  id: string;
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

// =============================================
// UTILIDADES
// =============================================

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
  switch (status.toLowerCase()) {
    case 'pendiente': return colors.states.warning;
    case 'confirmada': return colors.states.success;
    case 'denegada': return colors.states.error;  // CAMBIO
    case 'cancelada': return colors.text.secondary;
    case 'completada': return colors.primary.main;
    default: return colors.text.secondary;
  }
};

const getStatusIcon = (status: AppointmentStatus): string => {
  switch (status.toLowerCase()) {
    case 'pendiente': return 'clock';
    case 'confirmada': return 'check-circle';
    case 'denegada': return 'times-circle';  // CAMBIO
    case 'cancelada': return 'ban';
    case 'completada': return 'check-double';
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


// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export const ClientAppointmentsScreen: React.FC<ClientAppointmentsScreenProps> = ({ 
  navigation 
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('Todas');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isRating, setIsRating] = useState<boolean>(false);

  // =============================================
  // EFECTOS
  // =============================================

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [appointments, selectedFilter]);

  // =============================================
  // FUNCIONES DE CARGA DE DATOS
  // =============================================

  const loadAppointments = async () => {
    try {
      console.log('📅 ClientAppointmentsScreen: Cargando citas...');
      
      const result = await appointmentService.getClientAppointments();
      
      if (result.success && result.data) {
        console.log('📅 ClientAppointmentsScreen: Citas cargadas:', result.data.length);
        const sortedAppointments = appointmentService.sortAppointmentsByDate(result.data, false);
        setAppointments(sortedAppointments);
      } else {
        console.log('📅 ClientAppointmentsScreen: Error al cargar citas:', result.error);
        
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
      console.log('📅 ClientAppointmentsScreen: Error inesperado:', error);
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

  // =============================================
  // HANDLERS
  // =============================================

  const handleFilterChange = (filter: FilterStatus) => {
    console.log('📅 ClientAppointmentsScreen: Cambiando filtro a:', filter);
    setSelectedFilter(filter);
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    console.log('📅 ClientAppointmentsScreen: Mostrando detalles de cita:', appointment.id);
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  const handleLongPress = (appointment: Appointment) => {
    console.log('📅 ClientAppointmentsScreen: Mostrando menú contextual para cita:', appointment.id);
    setSelectedAppointment(appointment);
    setShowContextMenu(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedAppointment(null);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
    setSelectedAppointment(null);
  };

  const handleRescheduleAppointment = () => {
    if (selectedAppointment && navigation?.navigate) {
      console.log('📅 Redirigiendo a reprogramar cita:', selectedAppointment.id);
      navigation.navigate('RescheduleAppointment', { appointment: selectedAppointment });
    } else if (selectedAppointment) {
      Alert.alert(
        'Reprogramar Cita',
        `Funcionalidad para reprogramar la cita con ${selectedAppointment.nombreProfesional} en desarrollo.`,
        [{ text: 'OK' }]
      );
    }
    closeContextMenu();
  };

  const handleCancelAppointment = () => {
    setIsModalVisible(false);
    setShowCancelModal(true);
  };

  const handleConfirmCancellation = async () => {
    if (!selectedAppointment) return;

    if (!cancellationReason.trim()) {
      Alert.alert(
        'Motivo Requerido',
        'Por favor, proporciona un motivo para cancelar la cita.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    setIsCancelling(true);

    try {
      const result = await appointmentService.cancelAppointment(
        selectedAppointment.idCita,
        cancellationReason
      );

      if (result.success) {
        Alert.alert(
          'Cita Cancelada',
          'La cita ha sido cancelada exitosamente.',
          [
            {
              text: 'Entendido',
              onPress: () => {
                setShowCancelModal(false);
                setCancellationReason('');
                setSelectedAppointment(null);
                loadAppointments();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'No se pudo cancelar la cita. Intenta de nuevo.',
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
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setCancellationReason('');
  };  

  const handleViewDetails = () => {
    if (selectedAppointment) {
      setShowContextMenu(false);
      setIsModalVisible(true);
    }
  };

const handleRateAppointment = () => {
  if (selectedAppointment) {
    setShowContextMenu(false);
    setShowRatingModal(true);
    setSelectedRating(0);
  }
};

const handleConfirmRating = async () => {
  if (!selectedAppointment || selectedRating === 0) {
    Alert.alert(
      'Selecciona una Calificación',
      'Por favor, selecciona al menos una estrella para calificar.',
      [{ text: 'Entendido' }]
    );
    return;
  }

  setIsRating(true);

  try {
    const result = await appointmentService.rateProfessional(
      selectedAppointment.idCita,
      selectedRating
    );

    if (result.success) {
      Alert.alert(
        '¡Calificación Enviada!',
        `Has calificado a ${selectedAppointment.nombreProfesional} con ${selectedRating} estrella${selectedRating !== 1 ? 's' : ''}.`,
        [
          {
            text: 'Entendido',
            onPress: () => {
              setShowRatingModal(false);
              setSelectedRating(0);
              setSelectedAppointment(null);
              loadAppointments();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Error',
        result.error || 'No se pudo enviar la calificación. Intenta de nuevo.',
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
    setIsRating(false);
  }
};

const handleCloseRatingModal = () => {
  setShowRatingModal(false);
  setSelectedRating(0);
};

const canRateAppointment = (appointment: Appointment): boolean => {
  return appointment.estado === 'Completada' && appointment.estadoCalificacion === 'No Calificada';
};

const getMenuOptions = (): MenuOption[] => {
  const options: MenuOption[] = [
    {
      id: 'view-details',
      title: 'Ver Detalles',
      icon: 'eye',
      color: colors.primary.main,
      onPress: handleViewDetails,
    },
  ];

  if (selectedAppointment) {
    // Opción de reprogramar para citas Pendiente o Confirmada
    if (selectedAppointment.estado === 'Pendiente' || 
        selectedAppointment.estado === 'Confirmada') {
      options.push({
        id: 'reschedule',
        title: 'Reprogramar',
        icon: 'calendar-alt',
        color: colors.states.info,
        onPress: handleRescheduleAppointment,
      });
    }

    // Opción de calificar para citas Confirmadas que ya pasaron
    if (canRateAppointment(selectedAppointment)) {
      options.push({
        id: 'rate',
        title: 'Calificar Profesional',
        icon: 'star',
        color: colors.states.warning,
        onPress: handleRateAppointment,
      });
    }
  }

  return options;
};

  // =============================================
  // COMPONENTES DE RENDERIZADO
  // =============================================

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mis Citas</Text>
      <Text style={styles.subtitle}>
        Gestiona y consulta tus citas agendadas
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

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(appointment)}
        onLongPress={() => handleLongPress(appointment)}
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
          <View style={styles.professionalInfo}>
            <Icon name="user-tie" size={14} color={colors.text.secondary} />
            <Text style={styles.professionalName} numberOfLines={1}>
              {appointment.nombreProfesional}
            </Text>
          </View>
          <Text style={styles.profession} numberOfLines={1}>
            {appointment.profesion}
          </Text>
        </View>

      {appointment.calificacionPromedio > 0 && (
        <View style={styles.ratingInfoContainer}>
          <View style={styles.ratingInfo}>
            <Icon name="award" size={12} color={colors.primary.main} />
            <Text style={styles.ratingLabel}>Calificación del profesional:</Text>
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
              ? 'No tienes citas' 
              : `No tienes citas ${selectedFilter.toLowerCase()}`}
          </Text>
          <Text style={styles.emptyMessage}>
            {selectedFilter === 'Todas'
              ? 'Agenda tu primera cita con un profesional'
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

  const renderContextMenu = () => {
    if (!selectedAppointment) return null;

    const menuOptions = getMenuOptions();

    return (
      <Modal
        visible={showContextMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeContextMenu}
      >
        <TouchableWithoutFeedback onPress={closeContextMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.contextMenu}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle} numberOfLines={1}>
                    {selectedAppointment.nombreServicio}
                  </Text>
                  <TouchableOpacity
                    onPress={closeContextMenu}
                    style={styles.closeButton}
                  >
                    <Icon name="times" size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.menuOptions}>
                  {menuOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.menuOption,
                        index < menuOptions.length - 1 && styles.menuOptionWithBorder
                      ]}
                      onPress={option.onPress}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.optionIcon,
                          { backgroundColor: (option.color || colors.text.secondary) + '15' }
                        ]}>
                          <Icon 
                            name={option.icon} 
                            size={16} 
                            color={option.color || colors.text.secondary} 
                          />
                        </View>
                        <Text style={[
                          styles.optionText,
                          { color: option.color || colors.text.primary }
                        ]}>
                          {option.title}
                        </Text>
                      </View>
                      <Icon 
                        name="chevron-right" 
                        size={12} 
                        color={colors.text.tertiary} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedAppointment) return null;

    const statusColor = getStatusColor(selectedAppointment.estado);
    const statusIcon = getStatusIcon(selectedAppointment.estado);

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
                <Text style={styles.modalSectionTitle}>Profesional</Text>
                <View style={styles.modalField}>
                  <Icon name="user-tie" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {selectedAppointment.nombreProfesional}
                  </Text>
                </View>
                <View style={styles.modalField}>
                  <Icon name="briefcase" size={14} color={colors.text.secondary} />
                  <Text style={styles.modalFieldValue}>
                    {selectedAppointment.profesion}
                  </Text>
                </View>
                {selectedAppointment.emailProfesional && (
                  <View style={styles.modalField}>
                    <Icon name="envelope" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.emailProfesional}
                    </Text>
                  </View>
                )}
                {selectedAppointment.telefonoProfesional && (
                  <View style={styles.modalField}>
                    <Icon name="phone" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.telefonoProfesional}
                    </Text>
                  </View>
                )}
                {selectedAppointment.direccion && (
                  <View style={styles.modalField}>
                    <Icon name="map-marker-alt" size={14} color={colors.text.secondary} />
                    <Text style={styles.modalFieldValue}>
                      {selectedAppointment.direccion}
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
              <Text style={styles.modalSectionTitle}>Calificación del Profesional</Text>
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
                    name={selectedAppointment.estadoCalificacion === 'Calificada' ? 'check-circle' : 'clock'} 
                    size={14} 
                    color={selectedAppointment.estadoCalificacion === 'Calificada' ? colors.states.success : colors.states.warning} 
                  />
                  <Text style={styles.modalFieldValue}>
                    {selectedAppointment.estadoCalificacion === 'Calificada' 
                      ? 'Ya has calificado este servicio' 
                      : 'Pendiente de calificar'}
                  </Text>
                </View>
              </View>
            )}

              {selectedAppointment.mensajeSolicitud && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Mensaje de Solicitud</Text>
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
              {(selectedAppointment.estado === 'Pendiente' || 
                selectedAppointment.estado === 'Confirmada') && (
                <Button
                  title="Cancelar Cita"
                  onPress={handleCancelAppointment}
                  variant="secondary"
                  fullWidth
                />
              )}

              <Button
                title="Cerrar"
                onPress={handleCloseModal}
                variant="primary"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    );

  };

const renderRatingModal = () => {
  if (!selectedAppointment) return null;

  return (
    <Modal
      visible={showRatingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseRatingModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.ratingModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Calificar Profesional</Text>
            <TouchableOpacity 
              onPress={handleCloseRatingModal} 
              style={styles.closeButton}
              disabled={isRating}
            >
              <Icon name="times" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ratingModalBody}
          >
            <View style={styles.ratingProfessionalInfo}>
              <Icon name="user-tie" size={48} color={colors.primary.main} />
              <Text style={styles.ratingProfessionalName}>
                {selectedAppointment.nombreProfesional}
              </Text>
              <Text style={styles.ratingProfession}>
                {selectedAppointment.profesion}
              </Text>
              <Text style={styles.ratingServiceName}>
                {selectedAppointment.nombreServicio}
              </Text>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>
                ¿Cómo calificarías el servicio?
              </Text>
              <Text style={styles.ratingSubtitle}>
                Tu opinión nos ayuda a mejorar
              </Text>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => !isRating && setSelectedRating(star)}
                    activeOpacity={0.7}
                    style={styles.starButton}
                    disabled={isRating}
                  >
                    <Icon
                      name={selectedRating >= star ? 'star' : 'star'}
                      size={48}
                      color={selectedRating >= star ? colors.states.warning : colors.border.light}
                      solid={selectedRating >= star}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {selectedRating > 0 && (
                <View style={styles.ratingFeedback}>
                  <Text style={styles.ratingFeedbackText}>
                    {selectedRating === 1 && '😞 Muy insatisfecho'}
                    {selectedRating === 2 && '😕 Insatisfecho'}
                    {selectedRating === 3 && '😐 Neutral'}
                    {selectedRating === 4 && '😊 Satisfecho'}
                    {selectedRating === 5 && '🤩 Muy satisfecho'}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              onPress={handleCloseRatingModal}
              variant="secondary"
              fullWidth
              disabled={isRating}
            />
            <Button
              title={isRating ? "Enviando..." : "Enviar Calificación"}
              onPress={handleConfirmRating}
              variant="primary"
              fullWidth
              disabled={isRating || selectedRating === 0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const renderCancelModal = () => {
  if (!selectedAppointment) return null;

  return (
    <Modal
      visible={showCancelModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseCancelModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cancelModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cancelar Cita</Text>
            <TouchableOpacity 
              onPress={handleCloseCancelModal} 
              style={styles.closeButton}
              disabled={isCancelling}
            >
              <Icon name="times" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cancelWarning}>
              <Icon name="exclamation-triangle" size={24} color={colors.states.warning} />
              <Text style={styles.cancelWarningText}>
                ¿Estás seguro que deseas cancelar esta cita?
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Detalles de la Cita</Text>
              <View style={styles.modalField}>
                <Icon name="briefcase" size={14} color={colors.text.secondary} />
                <Text style={styles.modalFieldValue}>
                  {selectedAppointment.nombreServicio}
                </Text>
              </View>
              <View style={styles.modalField}>
                <Icon name="user-tie" size={14} color={colors.text.secondary} />
                <Text style={styles.modalFieldValue}>
                  {selectedAppointment.nombreProfesional}
                </Text>
              </View>
              <View style={styles.modalField}>
                <Icon name="calendar" size={14} color={colors.text.secondary} />
                <Text style={styles.modalFieldValue}>
                  {formatDate(selectedAppointment.fechaCita)} - {formatTime(selectedAppointment.fechaCita)}
                </Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>
                Motivo de Cancelación *
              </Text>
              <TextInput
                style={styles.cancellationInput}
                placeholder="Explica el motivo de la cancelación..."
                placeholderTextColor={colors.text.tertiary}
                value={cancellationReason}
                onChangeText={setCancellationReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                editable={!isCancelling}
              />
              <Text style={styles.characterCount}>
                {cancellationReason.length}/500
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Volver"
              onPress={handleCloseCancelModal}
              variant="secondary"
              fullWidth
              disabled={isCancelling}
            />
            <Button
              title={isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
              onPress={handleConfirmCancellation}
              variant="secondary"
              fullWidth
              disabled={isCancelling}
            />
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

  // =============================================
  // RENDER PRINCIPAL
  // =============================================

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
      {renderContextMenu()}
      {renderDetailsModal()}
      {renderCancelModal()}
      {renderRatingModal()}
    </SafeContainer>
  );
};

// =============================================
// ESTILOS
// =============================================

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
    paddingBottom: spacing.xl + 4,
    alignItems: 'center',
    backgroundColor: colors.primary.light + '08',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: spacing.xl,
    borderBottomRightRadius: spacing.xl,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm + 2,
    fontSize: 32,
    letterSpacing: -0.5,
  },  

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
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
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 4,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.lg + 4,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    gap: spacing.xs + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  filterTabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  filterTabText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  filterTabTextActive: {
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.semibold,
  },

  filterBadge: {
    backgroundColor: colors.border.light,
    borderRadius: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterBadgeActive: {
    backgroundColor: colors.primary.contrast + '40',
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
    borderRadius: spacing.md + 2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: spacing.xs,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md + 2,
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
    fontSize: 17,
    lineHeight: 23,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.md + 2,
    borderRadius: 14,
    gap: spacing.sm,
    minWidth: 95,
    justifyContent: 'center',
  },

  statusText: {
    ...typography.styles.caption,
    fontWeight: typography.fontWeight.bold,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  cardContent: {
    marginBottom: spacing.lg,
    gap: spacing.sm + 2,
  },

  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  professionalName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 15,
    flex: 1,
  },

  profession: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginLeft: spacing.lg + spacing.sm,
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
    backgroundColor: colors.primary.light + '15',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
  },

  price: {
    ...typography.styles.h2,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
    fontSize: 19,
    letterSpacing: -0.5,
  },

  pastIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.states.warning + '25',
    borderRadius: 8,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.states.warning + '40',
  },

  pastIndicatorText: {
    ...typography.styles.caption,
    color: colors.states.warning,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 11,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'] + spacing.xl,
    paddingHorizontal: spacing.xl + spacing.md,
  },

  emptyTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg + 4,
    marginBottom: spacing.md,
    fontSize: 22,
  },

  emptyMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  contextMenu: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  menuTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuOptions: {
    paddingVertical: spacing.sm,
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  menuOptionWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  optionText: {
    ...typography.styles.body,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },

  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.xl + 4,
    borderTopRightRadius: spacing.xl + 4,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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

  modalBody: {
    padding: spacing.lg,
  },

  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.xl + 4,
    borderRadius: 18,
    marginBottom: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  modalStatusText: {
    ...typography.styles.h3,
    fontWeight: typography.fontWeight.bold,
  },

  modalSection: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light + '60',
  },

  modalSectionTitle: {
    ...typography.styles.label,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md + 2,
    textTransform: 'uppercase',
    fontSize: 13,
    letterSpacing: 1,
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
    padding: spacing.md + 4,
    borderRadius: spacing.md,
    lineHeight: 24,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.light,
  },

  modalFooter: {
    padding: spacing.lg + 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary + '40',
  },

  cancelModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.xl + 4,
    borderTopRightRadius: spacing.xl + 4,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  cancelWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.states.warning + '15',
    padding: spacing.lg,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  cancelWarningText: {
    ...typography.styles.body,
    color: colors.states.warning,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },

  cancellationInput: {
    ...typography.styles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: spacing.md,
    padding: spacing.md + 2,
    minHeight: 110,
    maxHeight: 160,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  characterCount: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },  

  ratingModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.xl + 4,
    borderTopRightRadius: spacing.xl + 4,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  ratingModalBody: {
    alignItems: 'center',
  },

  ratingProfessionalInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    width: '100%',
  },

  ratingProfessionalName: {
    ...typography.styles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  ratingProfession: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  ratingServiceName: {
    ...typography.styles.caption,
    color: colors.primary.main,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },

  ratingSection: {
    width: '100%',
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  ratingTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  ratingSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },

  starButton: {
    padding: spacing.xs,
  },

  ratingFeedback: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
  },

  ratingFeedbackText: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },

  ratingInfoContainer: {
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.primary.light + '08',
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },

  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  ratingLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },

  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.lg + spacing.xs,
  },

  ratingNumber: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.primary.light + '25',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },

  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    backgroundColor: colors.primary.light + '12',
    padding: spacing.md + 4,
    borderRadius: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },

  modalRatingValue: {
    ...typography.styles.h3,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
    fontSize: 18,
  },
});