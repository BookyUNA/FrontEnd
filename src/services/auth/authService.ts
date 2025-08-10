/**
 * Servicio de Autenticación - Booky
 */

// CORRECCIÓN: Importar desde la ruta correcta
import { apiService } from '../api/apiService';
import { API_CONFIG } from '../../config/api';
import { ReqInicioSesion, ResInicioSesion, ApiError } from '../../types/api';
import { LoginFormData } from '../../types/auth';

export interface LoginResult {
  success: boolean;
  token?: string;
  error?: string;
  isNetworkError?: boolean;
}

class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  async login(credentials: LoginFormData): Promise<LoginResult> {
    try {
      // Preparar datos para el endpoint
      const loginData: ReqInicioSesion = {
        email: credentials.email,
        password: credentials.password,
      };

      // Realizar petición al endpoint
      const response = await apiService.post<ResInicioSesion>(
        API_CONFIG.ENDPOINTS.LOGIN,
        loginData
      );

      // Error de red
      if (!response.success && response.status === 0) {
        return {
          success: false,
          error: response.error || 'Error de conexión',
          isNetworkError: true,
        };
      }

      // Respuesta del servidor recibida
      const loginResponse = response.data;
      
      if (!loginResponse) {
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Login exitoso
      if (loginResponse.resultado && loginResponse.token) {
        return {
          success: true,
          token: loginResponse.token,
        };
      }

      // Login fallido - extraer mensaje de error
      const errorMessage = this.extractErrorMessage(loginResponse.error);
      
      return {
        success: false,
        error: errorMessage,
      };

    } catch (error: any) {
      console.error('Error en AuthService.login:', error);
      return {
        success: false,
        error: 'Ha ocurrido un error inesperado',
      };
    }
  }

  /**
   * Extraer mensaje de error más específico de la respuesta
   */
  private extractErrorMessage(errors: ApiError[]): string {
    if (!errors || errors.length === 0) {
      return 'Error desconocido';
    }

    // Tomar el primer error (generalmente el más relevante)
    const firstError = errors[0];
    
    // Mapear códigos de error conocidos a mensajes más específicos
    switch (firstError.ErrorCode) {
      case 1:
        return 'El correo electrónico y la contraseña son obligatorios';
      case 20003:
        return 'Usuario o contraseña incorrectos';
      default:
        return firstError.Message || 'Error de autenticación';
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    // Aquí se podría hacer llamada al backend para invalidar token
    // Por ahora solo limpiamos el almacenamiento local
    // TODO: Implementar llamada al endpoint de logout
  }

  /**
   * Verificar si hay token válido
   */
  isAuthenticated(): boolean {
    // TODO: Implementar verificación de token
    return false;
  }
}

// Instancia singleton del servicio
export const authService = new AuthService();