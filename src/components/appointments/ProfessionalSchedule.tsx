/**
 * Componente de Horario del Profesional - Booky
 * Muestra el calendario diario con citas y slots disponibles
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { appointmentService, Appointment } from '../../services/Appointment/AppointmentService';
import { CreateEventModal } from '../../components/appointments/CreateEventModal';
import { ConfigureScheduleModal } from '../../components/appointments/ConfigureScheduleModal';

const SLOT_DURATION = 30;
const START_HOUR = 7;
const END_HOUR = 18;
const SLOT_HEIGHT = 60;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimeSlot {
  time: Date;
  hour: number;
  minute: number;
  isAvailable: boolean;
  appointment?: Appointment;
}

export const ProfessionalSchedule: React.FC = () => {
  // Crear fecha en hora de Costa Rica (UTC-6)
  const getCostaRicaDate = () => {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const costaRicaTime = new Date(utcTime - (6 * 60 * 60 * 1000));
    
    console.log('🕐 Hora del sistema:', now.toLocaleString());
    console.log('🕐 Hora UTC:', new Date(utcTime).toISOString());
    console.log('🕐 Hora Costa Rica:', costaRicaTime.toLocaleString());
    console.log('🕐 Día semana CR:', ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][costaRicaTime.getDay()]);
    
    return costaRicaTime;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getCostaRicaDate());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(getCostaRicaDate());
  const [fabMenuVisible, setFabMenuVisible] = useState<boolean>(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState<boolean>(false);
  const [configureScheduleModalVisible, setConfigureScheduleModalVisible] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const fabRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAppointments();
    
    const timer = setInterval(() => {
      setCurrentTime(getCostaRicaDate());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    generateTimeSlots();
  }, [selectedDate, appointments]);

  // Animación del botón flotante
  useEffect(() => {
    Animated.timing(fabRotation, {
      toValue: fabMenuVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fabMenuVisible]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getProfessionalAppointments();
      
      if (response.success && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.log('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const totalSlots = ((END_HOUR - START_HOUR) * 60) / SLOT_DURATION;

    const selectedDateStr = selectedDate.toDateString();
    const dayAppointments = appointments.filter(apt => {
      const aptDateStr = apt.fechaCita.toDateString();
       return aptDateStr === selectedDateStr && apt.estado !== 'Cancelada' && apt.estado !== 'Denegada';  // CAMBIO
  });

    for (let i = 0; i < totalSlots; i++) {
      const hour = START_HOUR + Math.floor((i * SLOT_DURATION) / 60);
      const minute = (i * SLOT_DURATION) % 60;
      
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, minute, 0, 0);

      const appointment = dayAppointments.find(apt => {
        const aptStart = apt.fechaCita;
        const aptEnd = new Date(aptStart.getTime() + apt.duracionMinutos * 60000);
        return slotTime >= aptStart && slotTime < aptEnd;
      });

      const isOccupiedByPreviousAppointment = dayAppointments.some(apt => {
        const aptStart = apt.fechaCita;
        const aptEnd = new Date(aptStart.getTime() + apt.duracionMinutos * 60000);
        return slotTime > aptStart && slotTime < aptEnd;
      });

      if (!isOccupiedByPreviousAppointment) {
        slots.push({
          time: slotTime,
          hour,
          minute,
          isAvailable: !appointment,
          appointment,
        });
      }
    }

    setTimeSlots(slots);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(getCostaRicaDate());
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const isToday = (date: Date): boolean => {
    const today = getCostaRicaDate();
    return date.toDateString() === today.toDateString();
  };

  const getCurrentTimePosition = (): number | null => {
    if (!isToday(selectedDate)) return null;

    const now = getCostaRicaDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < START_HOUR || currentHour >= END_HOUR) return null;

    const minutesSinceStart = (currentHour - START_HOUR) * 60 + currentMinute;
    const slotIndex = Math.floor(minutesSinceStart / SLOT_DURATION);
    const minuteIntoSlot = minutesSinceStart % SLOT_DURATION;
    
    return slotIndex * SLOT_HEIGHT + (minuteIntoSlot / SLOT_DURATION) * SLOT_HEIGHT;
  };

  const getAppointmentHeight = (durationMinutes: number): number => {
    return (durationMinutes / SLOT_DURATION) * SLOT_HEIGHT;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Confirmada':
        return colors.states.success;
      case 'Pendiente':
        return colors.states.warning;
      case 'Completada':
        return colors.states.info;
      default:
        return colors.text.secondary;
    }
  };

  const toggleFabMenu = () => {
    setFabMenuVisible(!fabMenuVisible);
  };

  const handleConfigureSchedule = () => {
  setFabMenuVisible(false);
  setConfigureScheduleModalVisible(true);
};

  const handleCreateEvent = () => {
    setFabMenuVisible(false);
    setCreateEventModalVisible(true);
  };

  const handleEventSuccess = () => {
    loadAppointments();
  };

  const renderTimeSlot = (slot: TimeSlot, index: number) => {
    if (slot.appointment) {
      const isFirstSlot = index === 0 || 
        !timeSlots[index - 1].appointment || 
        timeSlots[index - 1].appointment?.idCita !== slot.appointment.idCita;

      if (!isFirstSlot) return null;

      const height = getAppointmentHeight(slot.appointment.duracionMinutos);
      const statusColor = getStatusColor(slot.appointment.estado);

      return (
        <View
          key={`appointment-${slot.appointment.idCita}`}
          style={[
            styles.appointmentSlot,
            { minHeight: height },
          ]}
        >
          <View style={[styles.appointmentIndicator, { backgroundColor: statusColor }]} />
          
          <View style={styles.appointmentContent}>
            <View style={styles.appointmentHeader}>
              <View style={styles.timeAndStatus}>
                <Text style={styles.appointmentTime}>
                  {formatTime(slot.hour, slot.minute)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{slot.appointment.estado}</Text>
                </View>
              </View>
              <Text style={styles.price}>
                ₡{slot.appointment.precioAcordado.toLocaleString()}
              </Text>
            </View>

            <Text style={styles.clientName}>
              {slot.appointment.nombreUsuario}
            </Text>

            <View style={styles.serviceRow}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {slot.appointment.nombreServicio}
              </Text>
              <View style={styles.durationContainer}>
                <Icon name="clock" size={11} color={colors.text.secondary} />
                <Text style={styles.duration}>
                  {slot.appointment.duracionMinutos}min
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={`slot-${index}`} style={styles.emptySlot}>
        <Text style={styles.slotTime}>
          {formatTime(slot.hour, slot.minute)}
        </Text>
        <Text style={styles.availableText}>Disponible</Text>
      </View>
    );
  };

  const fabRotationDegrees = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const currentTimePosition = getCurrentTimePosition();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Cargando horario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navButton}>
          <Icon name="chevron-left" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          {!isToday(selectedDate) && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Hoy</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => changeDate(1)} style={styles.navButton}>
          <Icon name="chevron-right" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        <View style={styles.slotsContainer}>
          {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
        </View>

        {currentTimePosition !== null && (
          <View 
            style={[
              styles.currentTimeLine,
              { top: currentTimePosition }
            ]}
          >
            <View style={styles.currentTimeDot} />
            <View style={styles.currentTimeLineBar} />
            <Text style={styles.currentTimeText}>
              {formatTime(currentTime.getHours(), currentTime.getMinutes())}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Horario:</Text>
        <Text style={styles.legendText}>
          {formatTime(START_HOUR, 0)} - {formatTime(END_HOUR, 0)}
        </Text>
      </View>

      {/* Botón flotante principal */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleFabMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: fabRotationDegrees }] }}>
          <Icon name="plus" size={24} color={colors.text.inverse} />
        </Animated.View>
      </TouchableOpacity>

      {/* Menú de opciones del FAB */}
      <Modal
        visible={fabMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFabMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.fabMenuOverlay}
          activeOpacity={1}
          onPress={() => setFabMenuVisible(false)}
        >
          <View style={styles.fabMenuContainer}>
            {/* Opción: Crear Evento */}
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={handleCreateEvent}
              activeOpacity={0.7}
            >
              <View style={styles.fabMenuIconContainer}>
                <Icon name="calendar-plus" size={20} color={colors.text.inverse} />
              </View>
              <Text style={styles.fabMenuText}>Crear Evento</Text>
            </TouchableOpacity>

            {/* Opción: Configurar Horario */}
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={handleConfigureSchedule}
              activeOpacity={0.7}
            >
              <View style={styles.fabMenuIconContainer}>
                <Icon name="cog" size={20} color={colors.text.inverse} />
              </View>
              <Text style={styles.fabMenuText}>Configurar Horario</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <CreateEventModal
        visible={createEventModalVisible}
        onClose={() => setCreateEventModalVisible(false)}
        onSuccess={handleEventSuccess}
        selectedDate={selectedDate}
      />
      <ConfigureScheduleModal
        visible={configureScheduleModalVisible}
        onClose={() => setConfigureScheduleModalVisible(false)}
        onSuccess={handleEventSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  navButton: {
    padding: spacing.sm,
  },

  dateContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  dateText: {
    ...typography.styles.h3,
    color: colors.text.primary,
  },

  todayButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
  },

  todayButtonText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },

  scrollView: {
    flex: 1,
  },

  slotsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  emptySlot: {
    height: SLOT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  slotTime: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  availableText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },

  appointmentSlot: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
    flexDirection: 'row',
  },

  appointmentIndicator: {
    width: 4,
  },

  appointmentContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },

  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timeAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },

  appointmentTime: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },

  statusText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 11,
  },

  clientName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },

  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  serviceName: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },

  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  duration: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },

  price: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: '700',
    fontSize: 15,
  },

  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },

  currentTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.states.error,
    marginLeft: spacing.md,
  },

  currentTimeLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.states.error,
  },

  currentTimeText: {
    ...typography.styles.caption,
    color: colors.states.error,
    fontWeight: '600',
    marginRight: spacing.md,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xs,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.xs,
  },

  legendTitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  legendText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },

  // Estilos del botón flotante
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Estilos del menú del FAB
  fabMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },

  fabMenuContainer: {
    marginBottom: spacing.xl + 56 + spacing.sm,
    marginRight: spacing.lg,
    gap: spacing.sm,
  },

  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 28,
    gap: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 200,
  },

  fabMenuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fabMenuText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
});