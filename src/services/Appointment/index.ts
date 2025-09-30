/**
 * Exportaciones del módulo de Citas
 * services/appointments/index.ts
 */

export { 
  appointmentService,
  type Appointment,
  type AppointmentStatus,
  type ApiCita,
  type ServiceResponse,
} from './appointmentService';

/**
 * Exportaciones de la pantalla de Citas
 * screens/appointments/index.ts
 */

export { ClientAppointmentsScreen } from '../../screens/client/ClientAppointmentsScreen';
export { ProfessionalAppointmentsScreen } from '../../screens/client/ProfessionalAppointmentsScreen';