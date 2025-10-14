/**
 * Servicio de Eventos - Booky
 * Gestión de eventos del profesional
 */

import { API_CONFIG } from '../../config/api';
import { authService } from '../auth/authService';

export interface CreateEventRequest {
  NombreEvento: string;
  Descripcion: string;
  FechaHoraInicio: string;
  FechaHoraFin: string;
}

export interface ApiError {
  ErrorCode: number;
  Message: string;
}

export interface CreateEventResponse {
  resultado: boolean;
  error: ApiError[];
  IdEvento: number;
  HorariosDesactivados: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isNetworkError?: boolean;
}

class EventService {
  /**
   * Crea un evento que bloquea la disponibilidad del profesional
   */
  async createEvent(eventData: CreateEventRequest): Promise<ServiceResponse<CreateEventResponse>> {
    try {
      console.log('📅 EventService: Creando evento...', eventData);

      const token = await authService.getToken();
      if (!token) {
        console.log('📅 EventService: No hay token disponible');
        return {
          success: false,
          error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        };
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREAR_EVENTO}`;
      console.log('📅 EventService: URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📅 EventService: Status de respuesta:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('📅 EventService: Token inválido o expirado');
          return {
            success: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          };
        }

        const errorText = await response.text();
        console.log('📅 EventService: Error HTTP:', errorText);
        
        return {
          success: false,
          error: `Error al crear el evento (${response.status}). Intenta de nuevo.`,
        };
      }

      const data: CreateEventResponse = await response.json();
      console.log('📅 EventService: Datos recibidos:', data);

      if (!data || typeof data.resultado !== 'boolean') {
        console.log('📅 EventService: Respuesta inválida del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor. Intenta de nuevo.',
        };
      }

      if (!data.resultado || (data.error && data.error.length > 0)) {
        const errorMessage = data.error && data.error.length > 0 
          ? data.error[0].Message 
          : 'No se pudo crear el evento';
        
        console.log('📅 EventService: Error en la respuesta:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log('📅 EventService: Evento creado exitosamente');
      
      return {
        success: true,
        data: data,
      };

    } catch (error: any) {
      console.log('📅 EventService: Error al crear evento:', error);

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

export const eventService = new EventService();