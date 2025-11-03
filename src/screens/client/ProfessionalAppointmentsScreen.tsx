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
  AppointmentStatus,
  CancellationMetrics
} from '../../services/Appointment/AppointmentService';
import { storageService } from '../../services/storage/simpleStorageService';
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
  const [cancellationMetrics, setCancellationMetrics] = useState<CancellationMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [professionalPlan, setProfessionalPlan] = useState<number>(1);

  useEffect(() => {
    loadAppointments();
    loadProfessionalPlan();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [appointments, selectedFilter]);

  // Cargar plan del profesional desde storageService
  const loadProfessionalPlan = async () => {
    try {
      console.log('📅 Cargando plan del profesional desde storage...');
      
      // Obtener plan ID desde el storage service
      const planId = await storageService.getUserPlanId();
      
      // Si no hay plan guardado, usar plan gratis por defecto
      let finalPlanId = planId || 1;
      
      // Validar que el plan existe (1, 2, o 3)
      if (![1, 2, 3].includes(finalPlanId)) {
        console.log('📅 Plan ID inválido, usando plan gratis por defecto');
        finalPlanId = 1;
      }
      
      setProfessionalPlan(finalPlanId);
      console.log('📅 Plan del profesional cargado:', finalPlanId);
      
    } catch (error) {
      console.log('📅 Error al cargar plan del profesional:', error);
      setProfessionalPlan(1); // Plan gratis por defecto en caso de error
    }
  };

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

  const loadCancellationMetrics = async (idCita: number) => {
    // Solo cargar métricas si el plan es Premium (3)
    if (professionalPlan !== 3) {
      return;
    }

    setIsLoadingMetrics(true);
    try {
      const result = await appointmentService.getCancellationMetrics(idCita);
      if (result.success && result.data) {
        setCancellationMetrics(result.data);
      }
    } catch (error) {
      console.log('Error cargando métricas:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    console.log('📅 ProfessionalAppointmentsScreen: Mostrando detalles de cita:', appointment.id);
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
    
    // Cargar métricas si la cita está pendiente y el plan es Premium
    if (appointment.estado === 'Pendiente') {
      loadCancellationMetrics(appointment.idCita);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedAppointment(null);
    setCancellationMetrics(null);
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
            
            const result = await appointmentService.approveOrDenyAppointment(
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
                    loadAppointments();
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
      'Debes proporcionar un motivo para denegar la cita.',
      [{ text: 'Entendido' }]
    );
    return;
  }

  if (!selectedAppointment) return;

  setIsProcessingRejection(true);

  try {
    console.log('📅 Denegando cita:', selectedAppointment.idCita);
    
    const result = await appointmentService.approveOrDenyAppointment(
      selectedAppointment.idCita,
      false,
      rejectionReason.trim()
    );

    if (result.success) {
      setIsRejectionModalVisible(false);
      setRejectionReason('');
      
      Alert.alert(
        'Cita Denegada',
        'La cita ha sido denegada. El cliente será notificado.',
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
          result.error || 'No se pudo denegar la cita. Verifica tu conexión a internet.',
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'No se pudo denegar la cita. Intenta de nuevo.',
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

  const renderCancellationMetrics = () => {
    // Solo mostrar métricas para plan Premium (3)
    if (professionalPlan !== 3 || !cancellationMetrics) return null;

    const getRiskColor = (categoria: string) => {
      switch (categoria.toLowerCase()) {
        case 'alto': return colors.states.error;
        case 'medio': return colors.states.warning;
        case 'bajo': return colors.states.success;
        default: return colors.text.secondary;
      }
    };

    const riskColor = getRiskColor(cancellationMetrics.categoriaRiesgo);

    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsHeader}>
          <Icon name="chart-bar" size={14} color={colors.text.secondary} />
          <Text style={styles.metricsTitle}>Historial del Cliente</Text>
        </View>
        <View style={styles.metricsContent}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Citas totales:</Text>
            <Text style={styles.metricValue}>{cancellationMetrics.totalCitas}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Cancelaciones:</Text>
            <Text style={styles.metricValue}>{cancellationMetrics.citasCanceladas}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>% Cancelación:</Text>
            <Text style={[styles.metricValue, { color: riskColor }]}>
              {cancellationMetrics.porcentajeCancelacion.toFixed(1)}%
            </Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
            <Icon name="info-circle" size={10} color={riskColor} />
            <Text style={[styles.riskText, { color: riskColor }]}>
              Riesgo {cancellationMetrics.categoriaRiesgo}
            </Text>
          </View>
        </View>
      </View>
    );
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

        {appointment.estado === 'Completada' && (
          <View style={styles.ratingInfoContainer}>
            <View style={styles.ratingInfoCentered}>
              <Icon
                name={appointment.estadoCalificacion === 'Calificada' ? 'star' : 'star-half-alt'}
                size={14}
                color={appointment.estadoCalificacion === 'Calificada' ? colors.states.warning : colors.text.secondary}
              />
              <Text style={styles.ratingLabel}>
                {appointment.estadoCalificacion === 'Calificada' ? 'Calificada por el cliente' : 'Pendiente de calificación'}
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
            : `No tienes citas ${selectedFilter.toLowerCase()}`}
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
              <Text style={styles.modalTitle}>Detalles</Text>
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

              {isPending && professionalPlan === 3 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Análisis de Riesgo</Text>
                  {isLoadingMetrics ? (
                    <View style={styles.metricsLoading}>
                      <Icon name="spinner" size={14} color={colors.text.secondary} />
                      <Text style={styles.metricsLoadingText}>Cargando historial...</Text>
                    </View>
                  ) : (
                    renderCancellationMetrics()
                  )}
                </View>
              )}

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

  filterTabTodas: {
    backgroundColor: colors.primary.light + '20',
    borderWidth: 2,
    borderColor: colors.primary.light,
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

  appointmentCardPending: {
    borderLeftWidth: 5,
    borderLeftColor: colors.states.warning,
    backgroundColor: colors.states.warning + '08',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  clientName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 15,
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
    alignItems: 'center',
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

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 4,
    backgroundColor: colors.states.warning,
    borderRadius: 24,
    gap: spacing.sm,
    shadowColor: colors.states.warning,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  pendingBadgeText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    fontSize: 12,
    letterSpacing: 0.5,
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
    justifyContent: 'flex-end',
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
    alignItems: 'center',
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

  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md + 2,
  },

  actionButton: {
    flex: 1,
  },

  rejectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  rejectionModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.xl + 4,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },

  rejectionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
    backgroundColor: colors.states.error + '12',
  },

  rejectionModalTitle: {
    ...typography.styles.h2,
    color: colors.states.error,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    fontSize: 19,
  },

  rejectionModalBody: {
    padding: spacing.lg + 4,
  },

  rejectionModalText: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginBottom: spacing.lg + 4,
    lineHeight: 24,
    fontSize: 15,
  },

  rejectionModalClientName: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    fontSize: 16,
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
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: spacing.md,
    padding: spacing.md + 2,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 110,
    maxHeight: 160,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

  ratingInfoCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
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

  metricsContainer: {
    backgroundColor: colors.background.secondary + '80',
    borderRadius: spacing.sm + 2,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.light,
  },

  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },

  metricsTitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  metricsContent: {
    gap: spacing.xs,
  },

  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metricLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },

  metricValue: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },

  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.xs + 2,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },

  riskText: {
    ...typography.styles.caption,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  metricsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },

  metricsLoadingText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },
});