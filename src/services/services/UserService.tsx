import { apiService } from '../api/apiService';
import { API_CONFIG } from '../../config/api';
import { authService } from '../auth/authService';

export interface ApiProfileResponse {
  Nombre: string;
  Correo: string;
  Cedula: string;
  Telefono: string;
  error?: { ErrorCode: number; Message: string }[];
  resultado: boolean;
}

class UserService {
  async getProfile(): Promise<ApiProfileResponse> {
    try {
      console.log('🔍 UserService: Obteniendo perfil del usuario...');
      
      const token = await authService.getToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Usar GET en lugar de POST según la documentación de la API
      const response = await apiService.get<ApiProfileResponse>(
        API_CONFIG.ENDPOINTS.PROFILE,
        token
      );

      console.log('🔍 UserService: Respuesta recibida:', response);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'No se pudo obtener respuesta del servidor');
      }

      if (!response.data.resultado) {
        const errorMessage = response.data.error?.[0]?.Message || 'Error desconocido del servidor';
        throw new Error(errorMessage);
      }

      console.log('🔍 UserService: Perfil obtenido exitosamente');
      return response.data;
      
    } catch (error) {
      console.error('🔍 UserService: Error obteniendo perfil:', error);
      throw error;
    }
  }
}

export const userService = new UserService();