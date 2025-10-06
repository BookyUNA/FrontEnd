/**
 * Servicio para gestión de citas - Booky
 */
import { API_CONFIG } from '../../config/api';
import { apiService } from '../api/apiService';
import { authService } from '../auth/authService';
import {
  SolicitarCitaRequest,
  SolicitarCitaResponse
} from './booking';

class BookingService {
  /**
   * Solicita una nueva cita
   */
  async solicitarCita(request: SolicitarCitaRequest): Promise<SolicitarCitaResponse> {
    try {
      console.log('=== BOOKING SERVICE ===');
      console.log('URL completa:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SOLICITAR_CITA}`);
      console.log('Request body:', JSON.stringify(request, null, 2));

      // Verificar autenticación
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener token
      const token = await authService.getToken();
      if (!token) {
        throw new Error('Token de acceso no disponible');
      }

      // Realizar request con token
      const response = await apiService.post<SolicitarCitaResponse>(
        API_CONFIG.ENDPOINTS.SOLICITAR_CITA,
        request,
        token
      );

      console.log('Response data:', JSON.stringify(response.data, null, 2));

      // Verificamos que la respuesta exista
      if (!response || !response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return response.data;
    } catch (error: any) {
      console.log('=== ERROR EN BOOKING SERVICE ===');
      console.log('Error completo:', error);
      console.log('Error message:', error?.message);

      if (error?.response) {
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);
      }

      // Errores comunes
      if (error?.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      if (error?.response?.status === 403) {
        throw new Error('No tienes permisos para solicitar citas.');
      }

      if (error?.response?.status >= 500) {
        throw new Error('Error interno del servidor. Intenta más tarde.');
      }

      throw error;
    }
  }

  /**
   * Convierte fecha y hora a formato ISO 8601 para la API
   */
  formatearFechaParaAPI(fecha: Date, hora: Date): string {
    const fechaCompleta = new Date(fecha);
    fechaCompleta.setHours(hora.getHours());
    fechaCompleta.setMinutes(hora.getMinutes());
    fechaCompleta.setSeconds(0);
    fechaCompleta.setMilliseconds(0);

    return fechaCompleta.toISOString();
  }

  /**
   * Valida si una fecha es válida para reserva (no puede ser en el pasado)
   */
  validarFecha(fecha: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSeleccionada = new Date(fecha);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    return fechaSeleccionada >= hoy;
  }

  /**
   * Valida si una hora es válida (horario laboral, por ejemplo)
   */
  validarHora(hora: Date): boolean {
    const horaNum = hora.getHours();
    const minutos = hora.getMinutes();

    // Validar horario laboral (8:00 AM - 6:00 PM)
    if (horaNum < 8 || horaNum >= 18) {
      return false;
    }

    // Validar que los minutos sean en intervalos de 15
    if (minutos % 15 !== 0) {
      return false;
    }

    return true;
  }
}

export const bookingService = new BookingService();
