/**
 * Servicio de Citas - Booky
 * Gestión de citas, eventos y horarios para profesionales y clientes
 */

import { API_CONFIG } from '../../config/api';
import { authService } from '../auth/authService';

export type AppointmentStatus = 
  | 'Pendiente' 
  | 'Confirmada' 
  | 'Denegada'
  | 'Cancelada' 
  | 'Completada';

export interface ApiCita {
  IdCita: number;
  FechaCita: string;
  DuracionMinutos: number;
  PrecioAcordado: number;
  Estado: string;
  MensajeSolicitud: string;
  MotivoRechazo: string | null;
  MotivoCancelacion: string | null;
  FechaSolicitud: string;
  FechaRespuesta: string | null;
  CedulaUsuario: string;
  NombreUsuario: string;
  EmailUsuario: string;
  TelefonoUsuario: string;
  Profesion: string;
  DescripcionPerfil: string;
  Direccion: string;
  NombreProfesional: string;
  EmailProfesional: string;
  TelefonoProfesional: string;
  NombreServicio: string;
  IdProfesional: number;  
  CalificacionPromedio: number;  
  EstadoCalificacion: string;  
}

export interface Appointment {
  id: string;
  idCita: number;
  fechaCita: Date;
  duracionMinutos: number;
  precioAcordado: number;
  estado: AppointmentStatus;
  mensajeSolicitud: string;
  motivoRechazo: string | null;
  motivoCancelacion: string | null;
  fechaSolicitud: Date;
  fechaRespuesta: Date | null;
  cedulaUsuario: string;
  nombreUsuario: string;
  emailUsuario: string;
  telefonoUsuario: string;
  profesion: string;
  descripcionPerfil: string;
  direccion: string;
  nombreProfesional: string;
  emailProfesional: string;
  telefonoProfesional: string;
  nombreServicio: string;
  idProfesional: number;  
  calificacionPromedio: number;  
  estadoCalificacion: 'Calificada' | 'No Calificada';  
}

export interface ApiEvento {
  IdEvento: number;
  NombreEvento: string;
  Descripcion: string;
  FechaHoraInicio: string;
  FechaHoraFin: string;
  Estado: string;
  FechaCreacion: string;
}

export interface ProfessionalEvent {
  idEvento: number;
  nombreEvento: string;
  descripcion: string;
  fechaHoraInicio: Date;
  fechaHoraFin: Date;
  estado: string;
  fechaCreacion: Date;
}

export interface ApiHorario {
  IdHorario: number;
  FechaDiaSemana: string;
  HoraInicio: string;
  HoraFin: string;
  Estado: string;
}

export interface WorkingSchedule {
  idHorario: number;
  fechaDiaSemana: Date;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

export interface ApiError {
  ErrorCode: number;
  Message: string;
}

export interface ListarCitasClienteResponse {
  Citas: ApiCita[];
  error: ApiError[] | null;
  resultado: boolean;
}

export interface EventosProfesionalResponse {
  Eventos: ApiEvento[];
  error: ApiError[] | null;
  resultado: boolean;
}

export interface HorariosProfesionalResponse {
  Horarios: ApiHorario[];
  error: ApiError[] | null;
  resultado: boolean;
}

export interface ReprogramarCitaRequest {
  IdCita: number;
  NuevaFechaCita: string;
}

export interface ReprogramarCitaResponse {
  error: ApiError[] | null;
  resultado: boolean;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isNetworkError?: boolean;
}

export interface ReqMetricasCancelacion {
  IdCita: number;
}

export interface ResMetricasCancelacion {
  resultado: boolean;
  error: ApiError[] | null;
  Mensaje: string;
  TotalCitas: number;
  CitasCanceladas: number;
  PorcentajeCancelacion: number;
  CategoriaRiesgo: string;
  FechaCalculo: string;
}

export interface CancellationMetrics {
  totalCitas: number;
  citasCanceladas: number;
  porcentajeCancelacion: number;
  categoriaRiesgo: string;
  fechaCalculo: Date;
}

// =============================================
// FUNCIONES DE MAPEO
// =============================================

/**
 * Mapea una cita de la API al modelo local
 */
const mapApiCitaToAppointment = (apiCita: ApiCita): Appointment => {
  const id = `${apiCita.CedulaUsuario}-${apiCita.FechaCita}-${apiCita.NombreServicio}`;
  
  return {
    id,
    idCita: apiCita.IdCita,
    fechaCita: new Date(apiCita.FechaCita),
    duracionMinutos: apiCita.DuracionMinutos,
    precioAcordado: apiCita.PrecioAcordado,
    estado: normalizeEstado(apiCita.Estado),
    mensajeSolicitud: apiCita.MensajeSolicitud || '',
    motivoRechazo: apiCita.MotivoRechazo || null,
    motivoCancelacion: apiCita.MotivoCancelacion || null,
    fechaSolicitud: new Date(apiCita.FechaSolicitud),
    fechaRespuesta: apiCita.FechaRespuesta ? new Date(apiCita.FechaRespuesta) : null,
    cedulaUsuario: apiCita.CedulaUsuario,
    nombreUsuario: apiCita.NombreUsuario,
    emailUsuario: apiCita.EmailUsuario,
    telefonoUsuario: apiCita.TelefonoUsuario,
    profesion: apiCita.Profesion,
    descripcionPerfil: apiCita.DescripcionPerfil,
    direccion: apiCita.Direccion,
    nombreProfesional: apiCita.NombreProfesional,
    emailProfesional: apiCita.EmailProfesional,
    telefonoProfesional: apiCita.TelefonoProfesional,
    nombreServicio: apiCita.NombreServicio,
    idProfesional: apiCita.IdProfesional, 
    calificacionPromedio: apiCita.CalificacionPromedio, 
    estadoCalificacion: apiCita.EstadoCalificacion === 'Calificada' ? 'Calificada' : 'No Calificada', 
  };
};

/**
 * Mapea un evento de la API al modelo local
 */
const mapApiEventoToProfessionalEvent = (apiEvento: ApiEvento): ProfessionalEvent => {
  return {
    idEvento: apiEvento.IdEvento,
    nombreEvento: apiEvento.NombreEvento,
    descripcion: apiEvento.Descripcion,
    fechaHoraInicio: new Date(apiEvento.FechaHoraInicio),
    fechaHoraFin: new Date(apiEvento.FechaHoraFin),
    estado: apiEvento.Estado,
    fechaCreacion: new Date(apiEvento.FechaCreacion),
  };
};

/**
 * Mapea un horario de la API al modelo local
 */
const mapApiHorarioToWorkingSchedule = (apiHorario: ApiHorario): WorkingSchedule => {
  return {
    idHorario: apiHorario.IdHorario,
    fechaDiaSemana: new Date(apiHorario.FechaDiaSemana),
    horaInicio: apiHorario.HoraInicio,
    horaFin: apiHorario.HoraFin,
    estado: apiHorario.Estado,
  };
};

export interface AprobarDenegarCitaRequest {
  IdCita: number;
  Aprobada: boolean;
  MotivoRechazo?: string;
}

export interface AprobarDenegarCitaResponse {
  resultado: boolean;
  error: ApiError[] | null;
}

export interface CancelarCitaRequest {
  IdCita: number;
  MotivoCancelacion: string;
}

export interface CancelarCitaResponse {
  error: ApiError[] | null;
  resultado: boolean;
}

export interface CalificarProfesionalRequest {
  IdCita: number;
  Calificacion: number;
}

export interface CalificarProfesionalResponse {
  error: ApiError[] | null;
  resultado: boolean;
}

/**
 * Normaliza el estado de la cita
 */
const normalizeEstado = (estado: string): AppointmentStatus => {
  const estadoLower = estado.toLowerCase().trim();
  
  if (estadoLower.includes('pendiente')) return 'Pendiente';
  if (estadoLower.includes('confirmada') || estadoLower.includes('aceptada')) return 'Confirmada';
  if (estadoLower.includes('denegada') || estadoLower.includes('rechazada')) return 'Denegada';
  if (estadoLower.includes('cancelada')) return 'Cancelada';
  if (estadoLower.includes('completada') || estadoLower.includes('finalizada')) return 'Completada';
  
  return 'Pendiente';
};

// =============================================
// SERVICIO DE CITAS
// =============================================

class AppointmentService {
  /**
   * Lista todas las citas del cliente autenticado
   */
  async getClientAppointments(): Promise<ServiceResponse<Appointment[]>> {
    try {
      console.log('📅 AppointmentService: Obteniendo citas del cliente...');

      const token = await authService.getToken();
      if (!token) {
        console.log('📅 AppointmentService: No hay token disponible');
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LISTAR_CITAS_CLIENTE}`;
      console.log('📅 AppointmentService: URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        const errorText = await response.text();
        
        return {
          success: false,
          error: `Error al obtener las citas (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: ListarCitasClienteResponse = await response.json();
      console.log('📅 AppointmentService: Datos recibidos:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudieron obtener las citas';
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const appointments: Appointment[] = (data.Citas || []).map(mapApiCitaToAppointment);
      
      console.log('📅 AppointmentService: Citas procesadas:', appointments.length);
      
      return {
        success: true,
        data: appointments,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al obtener citas:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
 * Obtiene las métricas de cancelación para una cita
 */
  async getCancellationMetrics(idCita: number): Promise<ServiceResponse<CancellationMetrics>> {
    try {
      console.log('📅 AppointmentService: Obteniendo métricas de cancelación...', { idCita });

      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}/obtenerPorcentajeCancelacion`;
      console.log('📅 AppointmentService: URL:', url);

      const requestBody: ReqMetricasCancelacion = {
        IdCita: idCita,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `Error al obtener métricas (${response.status}).`,
        };
      }

      const data: ResMetricasCancelacion = await response.json();

      if (!data.resultado || (data.error && data.error.length > 0)) {
        return {
          success: false,
          error: data.error?.[0]?.Message || 'No se pudieron obtener las métricas',
        };
      }

      const metrics: CancellationMetrics = {
        totalCitas: data.TotalCitas,
        citasCanceladas: data.CitasCanceladas,
        porcentajeCancelacion: data.PorcentajeCancelacion,
        categoriaRiesgo: data.CategoriaRiesgo,
        fechaCalculo: new Date(data.FechaCalculo),
      };

      return {
        success: true,
        data: metrics,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al obtener métricas:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Tiempo de espera agotado.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Error al obtener métricas de cancelación.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Lista todas las citas del profesional autenticado
   */
  async getProfessionalAppointments(): Promise<ServiceResponse<Appointment[]>> {
    try {
      console.log('📅 AppointmentService: Obteniendo citas del profesional...');

      const token = await authService.getToken();
      if (!token) {
        console.log('📅 AppointmentService: No hay token disponible');
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LISTAR_CITAS_PROFESIONAL}`;
      console.log('📅 AppointmentService: URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        return {
          success: false,
          error: `Error al obtener las citas (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: ListarCitasClienteResponse = await response.json();
      console.log('📅 AppointmentService: Datos recibidos:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudieron obtener las citas';
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const appointments: Appointment[] = (data.Citas || []).map(mapApiCitaToAppointment);
      
      console.log('📅 AppointmentService: Citas procesadas:', appointments.length);
      
      return {
        success: true,
        data: appointments,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al obtener citas:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Obtiene todos los eventos del profesional autenticado
   */
  async getProfessionalEvents(): Promise<ServiceResponse<ProfessionalEvent[]>> {
    try {
      console.log('📅 AppointmentService: Obteniendo eventos del profesional...');

      const token = await authService.getToken();
      if (!token) {
        console.log('📅 AppointmentService: No hay token disponible');
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTOS_PROFESIONAL}`;
      console.log('📅 AppointmentService: URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        return {
          success: false,
          error: `Error al obtener los eventos (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: EventosProfesionalResponse = await response.json();
      console.log('📅 AppointmentService: Datos recibidos:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudieron obtener los eventos';
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const events: ProfessionalEvent[] = (data.Eventos || []).map(mapApiEventoToProfessionalEvent);
      
      console.log('📅 AppointmentService: Eventos procesados:', events.length);
      
      return {
        success: true,
        data: events,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al obtener eventos:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Obtiene los horarios configurados del profesional autenticado
   */
  async getProfessionalSchedules(): Promise<ServiceResponse<WorkingSchedule[]>> {
    try {
      console.log('📅 AppointmentService: Obteniendo horarios del profesional...');

      const token = await authService.getToken();
      if (!token) {
        console.log('📅 AppointmentService: No hay token disponible');
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HORARIOS_PROFESIONAL}`;
      console.log('📅 AppointmentService: URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        return {
          success: false,
          error: `Error al obtener los horarios (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: HorariosProfesionalResponse = await response.json();
      console.log('📅 AppointmentService: Datos recibidos:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudieron obtener los horarios';
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const schedules: WorkingSchedule[] = (data.Horarios || []).map(mapApiHorarioToWorkingSchedule);
      
      console.log('📅 AppointmentService: Horarios procesados:', schedules.length);
      
      return {
        success: true,
        data: schedules,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al obtener horarios:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Reprograma una cita existente
   */
  async rescheduleAppointment(
    idCita: number,
    nuevaFecha: Date
  ): Promise<ServiceResponse<boolean>> {
    try {
      console.log('📅 AppointmentService: Reprogramando cita...', { idCita, nuevaFecha });

      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPROGRAMAR_CITA}`;
      console.log('📅 AppointmentService: URL:', url);

      const requestBody: ReprogramarCitaRequest = {
        IdCita: idCita,
        NuevaFechaCita: nuevaFecha.toISOString(),
      };

      console.log('📅 AppointmentService: Request body:', requestBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        const errorText = await response.text();
        console.log('📅 AppointmentService: Error HTTP:', errorText);
        
        return {
          success: false,
          error: `Error al reprogramar la cita (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: ReprogramarCitaResponse = await response.json();
      console.log('📅 AppointmentService: Respuesta recibida:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudo reprogramar la cita';
        
        console.log('📅 AppointmentService: Error en la respuesta:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log('📅 AppointmentService: Cita reprogramada exitosamente');
      
      return {
        success: true,
        data: true,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al reprogramar cita:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Aprueba o deniega una cita pendiente
   */
  async approveOrDenyAppointment(
    idCita: number,
    aprobada: boolean,
    motivoRechazo?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      console.log('📅 AppointmentService: Procesando cita...', { 
        idCita, 
        aprobada,
        motivoRechazo 
      });

      if (!aprobada && (!motivoRechazo || motivoRechazo.trim() === '')) {
        return {
          success: false,
          error: 'Debes proporcionar un motivo de rechazo.',
        };
      }

      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APROBAR_DENEGAR_CITA}`;
      console.log('📅 AppointmentService: URL:', url);

      const requestBody: AprobarDenegarCitaRequest = {
        IdCita: idCita,
        Aprobada: aprobada,
        ...(motivoRechazo && { MotivoRechazo: motivoRechazo.trim() }),
      };

      console.log('📅 AppointmentService: Request body:', requestBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        const errorText = await response.text();
        console.log('📅 AppointmentService: Error HTTP:', errorText);
        
        return {
          success: false,
          error: `Error al procesar la cita (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: AprobarDenegarCitaResponse = await response.json();
      console.log('📅 AppointmentService: Respuesta recibida:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudo procesar la cita';
        
        console.log('📅 AppointmentService: Error en la respuesta:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log(`📅 AppointmentService: Cita ${aprobada ? 'aprobada' : 'denegada'} exitosamente`);
      
      return {
        success: true,
        data: true,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al procesar cita:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Cancela una cita existente
   */
  async cancelAppointment(
    idCita: number,
    cancellationReason: string
  ): Promise<ServiceResponse<boolean>> {
  try {
    console.log('📅 AppointmentService: Cancelando cita...', { 
      idCita, 
      cancellationReason 
    });

    if (!cancellationReason || cancellationReason.trim() === '') {
      return {
        success: false,
        error: 'Debes proporcionar un motivo de cancelación.',
      };
    }

    const token = await authService.getToken();
    if (!token) {
      return {
        success: false,
        error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
      };
    }

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CANCELAR_CITA}`;
    console.log('📅 AppointmentService: URL:', url);

    const requestBody: CancelarCitaRequest = {
      IdCita: idCita,
      MotivoCancelacion: cancellationReason.trim(),
    };

    console.log('📅 AppointmentService: Request body:', requestBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📅 AppointmentService: Status de respuesta:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        };
      }

      const errorText = await response.text();
      console.log('📅 AppointmentService: Error HTTP:', errorText);
      
      return {
        success: false,
        error: `Error al cancelar la cita (${response.status}). Intenta de nuevo.`,
      };
    }

    const data: CancelarCitaResponse = await response.json();
    console.log('📅 AppointmentService: Respuesta recibida:', data);

    if (!data || typeof data.resultado !== 'boolean') {
      return {
        success: false,
        error: 'Respuesta inválida del servidor. Intenta de nuevo.',
      };
    }

    if (!data.resultado || (data.error && data.error.length > 0)) {
      const errorMessage = data.error && data.error.length > 0 
        ? data.error[0].Message 
        : 'No se pudo cancelar la cita';
      
      console.log('📅 AppointmentService: Error en la respuesta:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log('📅 AppointmentService: Cita cancelada exitosamente');
    
    return {
      success: true,
      data: true,
    };

  } catch (error: any) {
    console.log('📅 AppointmentService: Error al cancelar cita:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
        isNetworkError: true,
      };
    }

    if (error.message?.toLowerCase().includes('network') || 
        error.message?.toLowerCase().includes('fetch')) {
      return {
        success: false,
        error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
        isNetworkError: true,
      };
    }

    return {
      success: false,
      error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
      isNetworkError: false,
    };
  }
}

  /**
   * Califica al profesional después de completar una cita
   */
  async rateProfessional(
    idCita: number,
    rating: number
  ): Promise<ServiceResponse<boolean>> {
    try {
      console.log('📅 AppointmentService: Calificando profesional...', { 
        idCita,
        rating 
      });

      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: 'La calificación debe estar entre 1 y 5 estrellas.',
        };
      }

      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CALIFICAR_PROFESIONAL}`;
      console.log('📅 AppointmentService: URL:', url);

      const requestBody: CalificarProfesionalRequest = {
        IdCita: idCita,
        Calificacion: rating,
      };

      console.log('📅 AppointmentService: Request body:', requestBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 AppointmentService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        const errorText = await response.text();
        console.log('📅 AppointmentService: Error HTTP:', errorText);
        
        return {
          success: false,
          error: `Error al calificar al profesional (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: CalificarProfesionalResponse = await response.json();
      console.log('📅 AppointmentService: Respuesta recibida:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudo calificar al profesional';
        
        console.log('📅 AppointmentService: Error en la respuesta:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log('📅 AppointmentService: Profesional calificado exitosamente');
      
      return {
        success: true,
        data: true,
      };

    } catch (error: any) {
      console.log('📅 AppointmentService: Error al calificar profesional:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La solicitud tardó demasiado. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      if (error.message?.toLowerCase().includes('network') || 
          error.message?.toLowerCase().includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        isNetworkError: false,
      };
    }
  }

  /**
   * Filtra citas por estado
   */
  filterAppointmentsByStatus(
    appointments: Appointment[],
    status: AppointmentStatus | 'Todas'
  ): Appointment[] {
    if (status === 'Todas') {
      return appointments;
    }
    return appointments.filter(apt => apt.estado === status);
  }

  /**
   * Ordena citas por fecha
   */
  sortAppointmentsByDate(appointments: Appointment[], ascending = false): Appointment[] {
    return [...appointments].sort((a, b) => {
      const dateA = a.fechaCita.getTime();
      const dateB = b.fechaCita.getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Cuenta las citas por estado
   */
  getAppointmentCountByStatus(appointments: Appointment[]): Record<AppointmentStatus | 'Todas', number> {
    return {
      Todas: appointments.length,
      Pendiente: appointments.filter(a => a.estado === 'Pendiente').length,
      Confirmada: appointments.filter(a => a.estado === 'Confirmada').length,
      Denegada: appointments.filter(a => a.estado === 'Denegada').length,   
      Cancelada: appointments.filter(a => a.estado === 'Cancelada').length,
      Completada: appointments.filter(a => a.estado === 'Completada').length,
    };
  }
}

export const appointmentService = new AppointmentService();