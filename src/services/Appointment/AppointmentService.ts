/**
 * Servicio de Citas - Booky
 * Gestión de citas para clientes
 */

import { API_CONFIG } from '../../config/api';
import { authService } from '../auth/authService';

export type AppointmentStatus = 
  | 'Pendiente' 
  | 'Confirmada' 
  | 'Rechazada' 
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
  // Información del usuario (cliente)
  cedulaUsuario: string;
  nombreUsuario: string;
  emailUsuario: string;
  telefonoUsuario: string;
  // Información del profesional
  profesion: string;
  descripcionPerfil: string;
  direccion: string;
  nombreProfesional: string;
  emailProfesional: string;
  telefonoProfesional: string;
  // Información del servicio
  nombreServicio: string;
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

// =============================================
// FUNCIONES DE MAPEO
// =============================================

/**
 * Mapea una cita de la API al modelo local
 */
const mapApiCitaToAppointment = (apiCita: ApiCita): Appointment => {
  // Generar un ID único basado en los datos de la cita
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

/**
 * Normaliza el estado de la cita
 */
const normalizeEstado = (estado: string): AppointmentStatus => {
  const estadoLower = estado.toLowerCase().trim();
  
  if (estadoLower.includes('pendiente')) return 'Pendiente';
  if (estadoLower.includes('confirmada') || estadoLower.includes('aceptada')) return 'Confirmada';
  if (estadoLower.includes('rechazada')) return 'Rechazada';
  if (estadoLower.includes('cancelada')) return 'Cancelada';
  if (estadoLower.includes('completada') || estadoLower.includes('finalizada')) return 'Completada';
  
  // Por defecto, retornar el estado como viene (con validación de tipo)
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
        //console.error('📅 AppointmentService: No hay token disponible');
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
 * Lista todas las citas del profesional autenticado
 */
async getProfessionalAppointments(): Promise<ServiceResponse<Appointment[]>> {
  try {
    console.log('📅 AppointmentService: Obteniendo citas del profesional...');

    const token = await authService.getToken();
    if (!token) {
      //console.error('📅 AppointmentService: No hay token disponible');
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
        //console.error('📅 AppointmentService: Token inválido o expirado');
        return {
          success: false,
          error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        };
      }

      const errorText = await response.text();
      //console.error('📅 AppointmentService: Error HTTP:', errorText);
      
      return {
        success: false,
        error: `Error al obtener las citas (${response.status}). Intenta de nuevo.`,
      };
    }

    const data: ListarCitasClienteResponse = await response.json();
    console.log('📅 AppointmentService: Datos recibidos:', data);

    if (!data || typeof data.resultado !== 'boolean') {
      //console.error('📅 AppointmentService: Respuesta inválida del servidor');
      return {
        success: false,
        error: 'Respuesta inválida del servidor. Intenta de nuevo.',
      };
    }

    if (!data.resultado || (data.error && data.error.length > 0)) {
      const errorMessage = data.error && data.error.length > 0 
        ? data.error[0].Message 
        : 'No se pudieron obtener las citas';
      
      //console.error('📅 AppointmentService: Error en la respuesta:', errorMessage);
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
    //console.error('📅 AppointmentService: Error en getProfessionalAppointments:', error);

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

  async rescheduleAppointment(
    appointment: Appointment,
    newDate: Date
  ): Promise<ServiceResponse<boolean>> {
    try {
      console.log('📅 AppointmentService: Reprogramando cita...', { 
        idCita: appointment.idCita,
        newDate 
      });

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
        IdCita: appointment.idCita,
        NuevaFechaCita: newDate.toISOString(),
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
        console.log('📅 AppointmentService: Error response:', errorText);
        
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
      console.log('📅 AppointmentService: Error al reprogramar:', error);

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
 * Aprueba o deniega una cita como profesional
 */
async approveOrRejectAppointment(
  idCita: number,
  approved: boolean,
  rejectionReason?: string
): Promise<ServiceResponse<boolean>> {
  try {
    console.log('📅 AppointmentService: Procesando decisión de cita...', { 
      idCita,
      approved,
      rejectionReason 
    });

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
      Aprobada: approved,
    };

    // Solo incluir motivo de rechazo si la cita fue rechazada
    if (!approved && rejectionReason && rejectionReason.trim()) {
      requestBody.MotivoRechazo = rejectionReason.trim();
    }

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
      //console.error('📅 AppointmentService: Error HTTP:', errorText);
      
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
        : approved 
          ? 'No se pudo confirmar la cita' 
          : 'No se pudo rechazar la cita';
      
      //console.error('📅 AppointmentService: Error en la respuesta:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log(`📅 AppointmentService: Cita ${approved ? 'confirmada' : 'rechazada'} exitosamente`);
    
    return {
      success: true,
      data: true,
    };

  } catch (error: any) {
    //console.error('📅 AppointmentService: Error al procesar decisión:', error);

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
 * Cancela una cita como cliente
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
      //console.error('📅 AppointmentService: Error HTTP:', errorText);
      
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
      
      //console.error('📅 AppointmentService: Error en la respuesta:', errorMessage);
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
    //console.error('📅 AppointmentService: Error al cancelar cita:', error);

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
   * Ordena citas por fecha (más recientes primero)
   */
  sortAppointmentsByDate(appointments: Appointment[], ascending = false): Appointment[] {
    return [...appointments].sort((a, b) => {
      const dateA = a.fechaCita.getTime();
      const dateB = b.fechaCita.getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  getAppointmentCountByStatus(appointments: Appointment[]): Record<AppointmentStatus | 'Todas', number> {
    return {
      Todas: appointments.length,
      Pendiente: appointments.filter(a => a.estado === 'Pendiente').length,
      Confirmada: appointments.filter(a => a.estado === 'Confirmada').length,
      Rechazada: appointments.filter(a => a.estado === 'Rechazada').length,
      Cancelada: appointments.filter(a => a.estado === 'Cancelada').length,
      Completada: appointments.filter(a => a.estado === 'Completada').length,
    };
  }
}

export const appointmentService = new AppointmentService();