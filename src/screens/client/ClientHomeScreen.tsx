/**
 * Pantalla de Inicio para Clientes - Booky
 * Dashboard con resumen de actividad y accesos rápidos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { Logo } from '../../components/ui/Logo';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { appointmentService, Appointment } from '../../services/Appointment/AppointmentService';
import { authService } from '../../services/auth/authService';
import { BottomNavTabType } from '../../components/navigation';

const { width } = Dimensions.get('window');

// =============================================
// INTERFACES
// =============================================

interface ClientHomeScreenProps {
  navigation?: any;
}
interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

// =============================================
// UTILIDADES
// =============================================

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
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

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pendiente': return colors.states.warning;
    case 'confirmada': return colors.states.success;
    case 'denegada': return colors.states.error;
    case 'cancelada': return colors.text.secondary;
    case 'completada': return colors.primary.main;
    default: return colors.text.secondary;
  }
};

const getStatusIcon = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pendiente': return 'clock';
    case 'confirmada': return 'check-circle';
    case 'denegada': return 'times-circle';
    case 'cancelada': return 'ban';
    case 'completada': return 'check-double';
    default: return 'question-circle';
  }
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Estadísticas
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
  });

  // =============================================
  // EFECTOS
  // =============================================

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    loadUserName();
  }, []);

  // =============================================
  // FUNCIONES DE CARGA DE DATOS
  // =============================================

  const loadUserName = async () => {
    try {
        setUserName('Cliente');
      } catch (error) {
      console.log('Error al cargar nombre de usuario:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const result = await appointmentService.getClientAppointments();
      
      if (result.success && result.data) {
        const sortedAppointments = appointmentService.sortAppointmentsByDate(result.data, false);
        setAppointments(sortedAppointments);
        
        // Calcular estadísticas
        const pending = sortedAppointments.filter(a => a.estado === 'Pendiente').length;
        const confirmed = sortedAppointments.filter(a => a.estado === 'Confirmada').length;
        const completed = sortedAppointments.filter(a => a.estado === 'Completada').length;
        
        setStats({ pending, confirmed, completed });
        
        // Encontrar próxima cita
        const upcoming = sortedAppointments.find(
          a => (a.estado === 'Confirmada' || a.estado === 'Pendiente') && a.fechaCita > new Date()
        );
        setNextAppointment(upcoming || null);
      }
    } catch (error) {
      console.log('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // =============================================
  // HANDLERS
  // =============================================

  const handleNavigateToServices = () => {
    if (navigation?.navigate) {
      navigation.navigate('ProfessionalServices');
    }
  };

  const handleNavigateToAppointments = () => {
    if (navigation?.navigate) {
      navigation.navigate('ClientAppointments');
    }
  };

  const handleNavigateToProfile = () => {
    if (navigation?.navigate) {
      navigation.navigate('Profile');
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    // Navegar a detalles o abrir modal
    console.log('Ver detalles de cita:', appointment.id);
  };

  // =============================================
  // ACCIONES RÁPIDAS
  // =============================================

  const quickActions: QuickAction[] = [
    {
      id: 'browse-services',
      title: 'Explorar Servicios',
      subtitle: 'Busca profesionales',
      icon: 'search',
      color: colors.primary.main,
      onPress: handleNavigateToServices,
    },
    {
      id: 'my-appointments',
      title: 'Mis Citas',
      subtitle: 'Gestiona tus reservas',
      icon: 'calendar-alt',
      color: colors.states.info,
      onPress: handleNavigateToAppointments,
    },
    {
      id: 'profile',
      title: 'Mi Perfil',
      subtitle: 'Edita tu información',
      icon: 'user-circle',
      color: colors.states.success,
      onPress: handleNavigateToProfile,
    },
  ];

  // =============================================
  // COMPONENTES DE RENDERIZADO
  // =============================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Logo size="small" showTagline={false} />
      </View>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeLabel}>¡Bienvenido de vuelta!</Text>
      </View>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <View style={[styles.statsIconContainer, { backgroundColor: colors.states.warning + '15' }]}>
          <Icon name="clock" size={20} color={colors.states.warning} solid />
        </View>
        <Text style={styles.statsNumber}>{stats.pending}</Text>
        <Text style={styles.statsLabel}>Pendientes</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={[styles.statsIconContainer, { backgroundColor: colors.states.success + '15' }]}>
          <Icon name="check-circle" size={20} color={colors.states.success} solid />
        </View>
        <Text style={styles.statsNumber}>{stats.confirmed}</Text>
        <Text style={styles.statsLabel}>Confirmadas</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={[styles.statsIconContainer, { backgroundColor: colors.primary.main + '15' }]}>
          <Icon name="check-double" size={20} color={colors.primary.main} solid />
        </View>
        <Text style={styles.statsNumber}>{stats.completed}</Text>
        <Text style={styles.statsLabel}>Completadas</Text>
      </View>
    </View>
  );

  const renderNextAppointment = () => {
    if (!nextAppointment) {
      return (
        <View style={styles.nextAppointmentCard}>
          <View style={styles.nextAppointmentHeader}>
            <View style={styles.nextAppointmentTitleContainer}>
              <Icon name="calendar-check" size={18} color={colors.primary.main} />
              <Text style={styles.nextAppointmentTitle}>Próxima Cita</Text>
            </View>
          </View>
          <View style={styles.noAppointmentContent}>
            <Icon name="calendar-times" size={40} color={colors.text.tertiary} />
            <Text style={styles.noAppointmentText}>No tienes citas programadas</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={handleNavigateToServices}
              activeOpacity={0.7}
            >
              <Icon name="search" size={14} color={colors.primary.contrast} />
              <Text style={styles.browseButtonText}>Buscar Servicios</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const statusColor = getStatusColor(nextAppointment.estado);
    const statusIcon = getStatusIcon(nextAppointment.estado);

    return (
      <TouchableOpacity
        style={styles.nextAppointmentCard}
        onPress={() => handleAppointmentPress(nextAppointment)}
        activeOpacity={0.8}
      >
        <View style={styles.nextAppointmentHeader}>
          <View style={styles.nextAppointmentTitleContainer}>
            <Icon name="calendar-check" size={18} color={colors.primary.main} />
            <Text style={styles.nextAppointmentTitle}>Próxima Cita</Text>
          </View>
          <View style={[styles.miniStatusBadge, { backgroundColor: statusColor + '20' }]}>
            <Icon name={statusIcon} size={10} color={statusColor} solid />
            <Text style={[styles.miniStatusText, { color: statusColor }]}>
              {nextAppointment.estado}
            </Text>
          </View>
        </View>

        <View style={styles.appointmentContent}>
          <View style={styles.appointmentMainInfo}>
            <Icon name="briefcase" size={16} color={colors.text.primary} />
            <Text style={styles.appointmentServiceName} numberOfLines={1}>
              {nextAppointment.nombreServicio}
            </Text>
          </View>

          <View style={styles.appointmentProfessional}>
            <Icon name="user-tie" size={14} color={colors.text.secondary} />
            <Text style={styles.appointmentProfessionalName} numberOfLines={1}>
              {nextAppointment.nombreProfesional}
            </Text>
          </View>

          <View style={styles.appointmentDetails}>
            <View style={styles.appointmentDetailItem}>
              <Icon name="calendar" size={12} color={colors.text.secondary} />
              <Text style={styles.appointmentDetailText}>
                {formatDate(nextAppointment.fechaCita)}
              </Text>
            </View>
            <View style={styles.appointmentDetailItem}>
              <Icon name="clock" size={12} color={colors.text.secondary} />
              <Text style={styles.appointmentDetailText}>
                {formatTime(nextAppointment.fechaCita)}
              </Text>
            </View>
            <View style={styles.appointmentDetailItem}>
              <Icon name="hourglass-half" size={12} color={colors.text.secondary} />
              <Text style={styles.appointmentDetailText}>
                {nextAppointment.duracionMinutos} min
              </Text>
            </View>
          </View>

          <View style={styles.appointmentPrice}>
            <Text style={styles.priceLabel}>Precio</Text>
            <Text style={styles.priceValue}>
              ₡{nextAppointment.precioAcordado.toLocaleString('es-CR')}
            </Text>
          </View>
        </View>

        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>Ver Detalles</Text>
          <Icon name="chevron-right" size={12} color={colors.primary.main} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionCard}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
              <Icon name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentAppointments = () => {
    const recentAppointments = appointments.slice(0, 3);

    if (recentAppointments.length === 0) {
      return null;
    }

    return (
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <TouchableOpacity onPress={handleNavigateToAppointments}>
            <Text style={styles.viewAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          {recentAppointments.map((appointment) => {
            const statusColor = getStatusColor(appointment.estado);
            const statusIcon = getStatusIcon(appointment.estado);

            return (
              <TouchableOpacity
                key={appointment.id}
                style={styles.recentAppointmentCard}
                onPress={() => handleAppointmentPress(appointment)}
                activeOpacity={0.7}
              >
                <View style={styles.recentCardLeft}>
                  <View style={[styles.recentStatusDot, { backgroundColor: statusColor }]} />
                  <View style={styles.recentCardInfo}>
                    <Text style={styles.recentServiceName} numberOfLines={1}>
                      {appointment.nombreServicio}
                    </Text>
                    <Text style={styles.recentProfessionalName} numberOfLines={1}>
                      {appointment.nombreProfesional}
                    </Text>
                    <Text style={styles.recentDate}>
                      {formatDate(appointment.fechaCita)} • {formatTime(appointment.fechaCita)}
                    </Text>
                  </View>
                </View>

                <View style={styles.recentCardRight}>
                  <View style={[styles.recentStatusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Icon name={statusIcon} size={10} color={statusColor} solid />
                  </View>
                  <Icon name="chevron-right" size={12} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Icon name="spinner" size={40} color={colors.primary.main} />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );

  // =============================================
  // RENDER PRINCIPAL
  // =============================================

  if (isLoading) {
    return <View style={styles.container}>{renderLoadingState()}</View>;
  }

  return (
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
      {renderStatsCards()}
      {renderNextAppointment()}
      {renderQuickActions()}
      {renderRecentAppointments()}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    paddingTop: spacing['6xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderBottomLeftRadius: spacing.xl + 4,
    borderBottomRightRadius: spacing.xl + 4,
  },

  logoContainer: {
    marginBottom: spacing.md,
  },

  welcomeSection: {
    gap: spacing.xs,
  },

  welcomeLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.fontWeight.medium,
  },

  userName: {
    ...typography.styles.h1,
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },

  statsCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  statsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsNumber: {
    ...typography.styles.h1,
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
  },

  statsLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },

  nextAppointmentCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md + 2,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary.main + '20',
  },

  nextAppointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  nextAppointmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  nextAppointmentTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: 16,
  },

  miniStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    gap: spacing.xs - 2,
  },

  miniStatusText: {
    ...typography.styles.caption,
    fontWeight: typography.fontWeight.bold,
    fontSize: 10,
  },

  noAppointmentContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },

  noAppointmentText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  browseButtonText: {
    ...typography.styles.body,
    color: colors.primary.contrast,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 14,
  },

  appointmentContent: {
    gap: spacing.md,
  },

  appointmentMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  appointmentServiceName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    fontSize: 17,
  },

  appointmentProfessional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  appointmentProfessionalName: {
    ...typography.styles.body,
    color: colors.text.secondary,
    flex: 1,
  },

  appointmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },

  appointmentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  appointmentDetailText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },

  appointmentPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.light + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    marginTop: spacing.xs,
  },

  priceLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },

  priceValue: {
    ...typography.styles.h3,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
    fontSize: 18,
  },

  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },

  viewDetailsText: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 14,
  },

  quickActionsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  sectionTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    fontSize: 20,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickActionTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    fontSize: 13,
  },

  quickActionSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 11,
  },

  recentSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  viewAllText: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 14,
  },

  recentList: {
    gap: spacing.sm,
  },

  recentAppointmentCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  recentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },

  recentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  recentCardInfo: {
    flex: 1,
    gap: spacing.xs - 2,
  },

  recentServiceName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 14,
  },

  recentProfessionalName: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },

  recentDate: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },

  recentCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  recentStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSpacer: {
    height: spacing['4xl'],
  },
});