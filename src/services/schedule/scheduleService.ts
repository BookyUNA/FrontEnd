/**
 * Servicio de Horarios - Booky
 * Gestión de horarios de disponibilidad del profesional
 */

import { API_CONFIG } from '../../config/api';
import { authService } from '../auth/authService';

export interface HorarioProfesional {
  HoraInicio: string;
  HoraFin: string;
  FechaDiaSemana: string;
  Estado?: string;
}

export interface AddSchedulesRequest {
  horarios: HorarioProfesional[];
}

export interface ApiError {
  ErrorCode: number;
  Message: string;
}

export interface AddSchedulesResponse {
  resultado: boolean;
  error: ApiError[];
  HorariosFallidos: string[];
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isNetworkError?: boolean;
}

class ScheduleService {
  /**
   * Agrega múltiples horarios de disponibilidad del profesional
   */
  async addSchedules(request: AddSchedulesRequest): Promise<ServiceResponse<AddSchedulesResponse>> {
    try {
      console.log('📅 ScheduleService: Agregando horarios...', {
        totalHorarios: request.horarios.length,
      });

      const token = await authService.getToken();
      if (!token) {
        console.log('📅 ScheduleService: No hay token disponible');
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AGREGAR_HORARIOS}`;
      console.log('📅 ScheduleService: URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 ScheduleService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('📅 ScheduleService: Token inválido o expirado');
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        const errorText = await response.text();
        console.log('📅 ScheduleService: Error HTTP:', errorText);
        
        return {
          success: false,
          error: `Error al agregar horarios (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: AddSchedulesResponse = await response.json();
      console.log('📅 ScheduleService: Datos recibidos:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        console.log('📅 ScheduleService: Respuesta inválida del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado) {
        let errorMessage = 'No se pudieron agregar los horarios';
        
        if (data.error && data.error.length > 0) {
          errorMessage = data.error[0].Message;
        } else if (data.HorariosFallidos && data.HorariosFallidos.length > 0) {
          errorMessage = `${data.HorariosFallidos.length} horarios no se pudieron agregar. Revisa las fechas e intenta nuevamente.`;
        }
        
        console.log('📅 ScheduleService: Error en la respuesta:', errorMessage);
        return {
          success: false,
          error: errorMessage,
          data: data,
        };
      }

      console.log('📅 ScheduleService: Horarios agregados exitosamente');
      
      return {
        success: true,
        data: data,
      };

    } catch (error: any) {
      console.log('📅 ScheduleService: Error al agregar horarios:', error);

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
}

export const scheduleService = new ScheduleService();