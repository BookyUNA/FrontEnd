/**
 * Componente de Horario del Profesional - Booky
 * Muestra el calendario diario con citas, eventos y slots disponibles
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
import { 
  appointmentService, 
  Appointment, 
  ProfessionalEvent, 
  WorkingSchedule 
} from '../../services/Appointment/AppointmentService';
import { CreateEventModal } from '../../components/appointments/CreateEventModal';
import { ConfigureScheduleModal } from '../../components/appointments/ConfigureScheduleModal';

const SLOT_DURATION = 30;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 18;
const SLOT_HEIGHT = 60;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimeSlot {
  time: Date;
  hour: number;
  minute: number;
  isAvailable: boolean;
  appointment?: Appointment;
  event?: ProfessionalEvent;
}

interface DaySchedule {
  startHour: number;
  endHour: number;
  isConfigured: boolean;
}

export const ProfessionalSchedule: React.FC = () => {
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
  const [events, setEvents] = useState<ProfessionalEvent[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [daySchedule, setDaySchedule] = useState<DaySchedule>({
    startHour: DEFAULT_START_HOUR,
    endHour: DEFAULT_END_HOUR,
    isConfigured: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(getCostaRicaDate());
  const [fabMenuVisible, setFabMenuVisible] = useState<boolean>(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState<boolean>(false);
  const [configureScheduleModalVisible, setConfigureScheduleModalVisible] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const fabRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAllData();
    
    const timer = setInterval(() => {
      setCurrentTime(getCostaRicaDate());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    updateDaySchedule();
    generateTimeSlots();
  }, [selectedDate, appointments, events, schedules]);

  useEffect(() => {
    Animated.timing(fabRotation, {
      toValue: fabMenuVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fabMenuVisible]);

  /**
   * Carga todas las citas, eventos y horarios del profesional
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [appointmentsResponse, eventsResponse, schedulesResponse] = await Promise.all([
        appointmentService.getProfessionalAppointments(),
        appointmentService.getProfessionalEvents(),
        appointmentService.getProfessionalSchedules(),
      ]);
      
      if (appointmentsResponse.success && appointmentsResponse.data) {
        setAppointments(appointmentsResponse.data);
      }

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      }

      if (schedulesResponse.success && schedulesResponse.data) {
        setSchedules(schedulesResponse.data);
      }
    } catch (error) {
      console.log('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  /**
   * Actualiza el horario configurado para el día seleccionado
   */
  const updateDaySchedule = () => {
    const selectedDateStr = selectedDate.toDateString();
    
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.fechaDiaSemana);
      return scheduleDate.toDateString() === selectedDateStr && schedule.estado === 'Activa';
    });

    if (daySchedules.length === 0) {
      setDaySchedule({
        startHour: DEFAULT_START_HOUR,
        endHour: DEFAULT_END_HOUR,
        isConfigured: false,
      });
      return;
    }

    const parseTime = (timeString: string): number => {
      const [hours] = timeString.split(':').map(Number);
      return hours;
    };

    const minStartHour = Math.min(...daySchedules.map(s => parseTime(s.horaInicio)));
    const maxEndHour = Math.max(...daySchedules.map(s => parseTime(s.horaFin)));

    setDaySchedule({
      startHour: minStartHour,
      endHour: maxEndHour,
      isConfigured: true,
    });
  };

  /**
   * Genera los slots de tiempo basados en las citas y eventos del día
   */
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const { startHour, endHour, isConfigured } = daySchedule;

    if (!isConfigured) {
      setTimeSlots([]);
      return;
    }

    const totalSlots = ((endHour - startHour) * 60) / SLOT_DURATION;
    const selectedDateStr = selectedDate.toDateString();

    const dayAppointments = appointments.filter(apt => {
      const aptDateStr = apt.fechaCita.toDateString();
      return aptDateStr === selectedDateStr && apt.estado !== 'Cancelada' && apt.estado !== 'Denegada';
    });

    const dayEvents = events.filter(event => {
      const eventDateStr = event.fechaHoraInicio.toDateString();
      return eventDateStr === selectedDateStr && event.estado === 'Activo';
    });

    for (let i = 0; i < totalSlots; i++) {
      const hour = startHour + Math.floor((i * SLOT_DURATION) / 60);
      const minute = (i * SLOT_DURATION) % 60;
      
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, minute, 0, 0);

      const appointment = dayAppointments.find(apt => {
        const aptStart = apt.fechaCita;
        const aptEnd = new Date(aptStart.getTime() + apt.duracionMinutos * 60000);
        return slotTime >= aptStart && slotTime < aptEnd;
      });

      const event = dayEvents.find(evt => {
        const eventStart = evt.fechaHoraInicio;
        const eventEnd = evt.fechaHoraFin;
        return slotTime >= eventStart && slotTime < eventEnd;
      });

      const isOccupiedByPreviousAppointment = dayAppointments.some(apt => {
        const aptStart = apt.fechaCita;
        const aptEnd = new Date(aptStart.getTime() + apt.duracionMinutos * 60000);
        return slotTime > aptStart && slotTime < aptEnd;
      });

      const isOccupiedByPreviousEvent = dayEvents.some(evt => {
        const eventStart = evt.fechaHoraInicio;
        const eventEnd = evt.fechaHoraFin;
        return slotTime > eventStart && slotTime < eventEnd;
      });

      if (!isOccupiedByPreviousAppointment && !isOccupiedByPreviousEvent) {
        slots.push({
          time: slotTime,
          hour,
          minute,
          isAvailable: !appointment && !event,
          appointment,
          event,
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
    const { startHour, endHour } = daySchedule;

    if (currentHour < startHour || currentHour >= endHour) return null;

    const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;
    const slotIndex = Math.floor(minutesSinceStart / SLOT_DURATION);
    const minuteIntoSlot = minutesSinceStart % SLOT_DURATION;
    
    return slotIndex * SLOT_HEIGHT + (minuteIntoSlot / SLOT_DURATION) * SLOT_HEIGHT;
  };

  /**
   * Calcula la altura de un bloque basado en su duración
   */
  const getBlockHeight = (durationMinutes: number): number => {
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
    loadAllData();
  };

  /**
   * Renderiza un slot de tiempo (cita o evento)
   */
  const renderTimeSlot = (slot: TimeSlot, index: number) => {
    if (slot.appointment) {
      const isFirstSlot = index === 0 || 
        !timeSlots[index - 1].appointment || 
        timeSlots[index - 1].appointment?.idCita !== slot.appointment.idCita;

      if (!isFirstSlot) return null;

      const height = getBlockHeight(slot.appointment.duracionMinutos);
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

    if (slot.event) {
      const isFirstSlot = index === 0 || 
        !timeSlots[index - 1].event || 
        timeSlots[index - 1].event?.idEvento !== slot.event.idEvento;

      if (!isFirstSlot) return null;

      const durationMinutes = (slot.event.fechaHoraFin.getTime() - slot.event.fechaHoraInicio.getTime()) / 60000;
      const height = getBlockHeight(durationMinutes);

      return (
        <View
          key={`event-${slot.event.idEvento}`}
          style={[
            styles.eventSlot,
            { minHeight: height },
          ]}
        >
          <View style={styles.eventIndicator} />
          
          <View style={styles.eventContent}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTime}>
                {formatTime(slot.hour, slot.minute)}
              </Text>
              <View style={styles.eventBadge}>
                <Icon name="calendar" size={10} color={colors.text.inverse} />
                <Text style={styles.eventBadgeText}>Evento</Text>
              </View>
            </View>

            <Text style={styles.eventName}>
              {slot.event.nombreEvento}
            </Text>

            <Text style={styles.eventDescription} numberOfLines={2}>
              {slot.event.descripcion}
            </Text>

            <View style={styles.durationContainer}>
              <Icon name="clock" size={11} color={colors.text.secondary} />
              <Text style={styles.duration}>
                {Math.round(durationMinutes)}min
              </Text>
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

  const currentTimePos = getCurrentTimePosition();
  const fabRotate = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

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

      {!daySchedule.isConfigured ? (
        <View style={styles.noScheduleContainer}>
          <Icon name="calendar-times" size={48} color={colors.text.tertiary} />
          <Text style={styles.noScheduleTitle}>Horario no configurado</Text>
          <Text style={styles.noScheduleText}>
            Este día aún no tiene un horario configurado.
          </Text>
          <TouchableOpacity 
            style={styles.configureButton}
            onPress={handleConfigureSchedule}
          >
            <Icon name="cog" size={16} color={colors.text.inverse} />
            <Text style={styles.configureButtonText}>Configurar horario</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.slotsContainer}>
            {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
          </View>

          {currentTimePos !== null && (
            <View style={[styles.currentTimeLine, { top: currentTimePos }]}>
              <View style={styles.currentTimeDot} />
              <View style={styles.currentTimeLineBar} />
              <Text style={styles.currentTimeText}>
                {formatTime(currentTime.getHours(), currentTime.getMinutes())}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={toggleFabMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
          <Icon name="plus" size={24} color={colors.text.inverse} />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={fabMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFabMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.fabMenuOverlay}
          activeOpacity={1}
          onPress={() => setFabMenuVisible(false)}
        >
          <View style={styles.fabMenuContainer}>
            <TouchableOpacity 
              style={styles.fabMenuItem}
              onPress={handleConfigureSchedule}
            >
              <View style={styles.fabMenuIconContainer}>
                <Icon name="cog" size={18} color={colors.primary.main} />
              </View>
              <Text style={styles.fabMenuText}>Configurar horario</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.fabMenuItem}
              onPress={handleCreateEvent}
            >
              <View style={styles.fabMenuIconContainer}>
                <Icon name="calendar-plus" size={18} color={colors.primary.main} />
              </View>
              <Text style={styles.fabMenuText}>Crear evento</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <CreateEventModal
        visible={createEventModalVisible}
        onClose={() => setCreateEventModalVisible(false)}
        onSuccess={handleEventSuccess}
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

  noScheduleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  noScheduleTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },

  noScheduleText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    marginTop: spacing.md,
  },

  configureButtonText: {
    ...typography.styles.body,
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

  eventSlot: {
    backgroundColor: colors.primary.light,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
    flexDirection: 'row',
  },

  eventIndicator: {
    width: 4,
    backgroundColor: colors.primary.main,
  },

  eventContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },

  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  eventTime: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },

  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
  },

  eventBadgeText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 11,
  },

  eventName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },

  eventDescription: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 13,
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