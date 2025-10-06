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
    case 'rechazada': return colors.states.error;
    case 'cancelada': return colors.text.secondary;
    case 'completada': return colors.primary.main;
    default: return colors.text.secondary;
  }
};

const getStatusIcon = (status: AppointmentStatus): string => {
  switch (status.toLowerCase()) {
    case 'pendiente': return 'clock';
    case 'confirmada': return 'check-circle';
    case 'rechazada': return 'times-circle';
    case 'cancelada': return 'ban';
    case 'completada': return 'check-double';
    default: return 'question-circle';
  }
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

    // Solo mostrar opción de reprogramar para citas Pendiente o Confirmada
    if (selectedAppointment && 
        (selectedAppointment.estado === 'Pendiente' || selectedAppointment.estado === 'Confirmada')) {
      options.push({
        id: 'reschedule',
        title: 'Reprogramar',
        icon: 'calendar-alt',
        color: colors.states.info,
        onPress: handleRescheduleAppointment,
      });
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
    const filters: FilterStatus[] = ['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Rechazada', 'Cancelada'];
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

  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  professionalName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
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

cancelModalContent: {
  backgroundColor: colors.background.primary,
  borderTopLeftRadius: spacing.xl,
  borderTopRightRadius: spacing.xl,
  maxHeight: '85%',
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
  borderWidth: 1,
  borderColor: colors.border.light,
  borderRadius: spacing.sm,
  padding: spacing.md,
  minHeight: 100,
  maxHeight: 150,
},

characterCount: {
  ...typography.styles.caption,
  color: colors.text.tertiary,
  textAlign: 'right',
  marginTop: spacing.xs,
},  
});