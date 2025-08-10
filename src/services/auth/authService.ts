/**
 * Servicio de Autenticación - Booky
 * Actualizado con hash SHA256 para contraseñas
 */

import { apiService } from '../api/apiService';
import { API_CONFIG } from '../../config/api';
import { ReqInicioSesion, ResInicioSesion, ApiError } from '../../types/api';
import { LoginFormData } from '../../types/auth';
import { hashService } from '../../utils/hashService';

export interface LoginResult {
  success: boolean;
  token?: string;
  error?: string;
  isNetworkError?: boolean;
}

class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   * La contraseña se hashea con SHA256 antes de enviarla
   */
  async login(credentials: LoginFormData): Promise<LoginResult> {
    try {
      // Validar que los datos estén presentes
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'El correo electrónico y la contraseña son obligatorios',
        };
      }

      // Hashear la contraseña con SHA256
      const hashedPassword = hashService.hashPassword(credentials.password);

      // Preparar datos para el endpoint con contraseña hasheada
      const loginData: ReqInicioSesion = {
        email: credentials.email.toLowerCase().trim(),
        password: hashedPassword, // Contraseña ya hasheada
      };

      console.log('Enviando datos de login:', {
        email: loginData.email,
        passwordHash: loginData.password.substring(0, 8) + '...', // Solo para debug
      });

      // Realizar petición al endpoint
      const response = await apiService.post<ResInicioSesion>(
        API_CONFIG.ENDPOINTS.LOGIN,
        loginData
      );

      // Error de red
      if (!response.success && response.status === 0) {
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
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
        console.log('Login exitoso, token recibido');
        
        // TODO: Aquí se puede guardar el token en el almacenamiento seguro
        // await SecureStore.setItemAsync('authToken', loginResponse.token);
        
        return {
          success: true,
          token: loginResponse.token,
        };
      }

      // Login fallido - extraer mensaje de error
      const errorMessage = this.extractErrorMessage(loginResponse.error);
      
      console.log('Login fallido:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };

    } catch (error: any) {
      console.error('Error en AuthService.login:', error);
      
      // Verificar si es un error de hash
      if (error.message && error.message.includes('hashear')) {
        return {
          success: false,
          error: 'Error al procesar la contraseña',
        };
      }
      
      return {
        success: false,
        error: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
      };
    }
  }

  /**
   * Registrar nuevo usuario
   * También hashea la contraseña antes de enviarla
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<LoginResult> {
    try {
      // Hashear la contraseña
      const hashedPassword = hashService.hashPassword(userData.password);

      const registerData = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
      };

      // TODO: Implementar llamada al endpoint de registro
      console.log('Datos de registro preparados (contraseña hasheada)');
      
      return {
        success: false,
        error: 'Función de registro no implementada aún',
      };

    } catch (error: any) {
      console.error('Error en AuthService.register:', error);
      return {
        success: false,
        error: 'Error al registrar usuario',
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
      case 20001:
        return 'El usuario no existe';
      case 20002:
        return 'La cuenta está desactivada';
      case 50001:
        return 'Error interno del servidor. Intenta más tarde.';
      default:
        return firstError.Message || 'Error de autenticación';
    }
  }

  /**
   * Cambiar contraseña
   * Hashea tanto la contraseña actual como la nueva
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<LoginResult> {
    try {
      const hashedCurrentPassword = hashService.hashPassword(currentPassword);
      const hashedNewPassword = hashService.hashPassword(newPassword);

      // TODO: Implementar llamada al endpoint de cambio de contraseña
      console.log('Preparando cambio de contraseña con hashes SHA256');
      
      return {
        success: false,
        error: 'Función de cambio de contraseña no implementada aún',
      };

    } catch (error: any) {
      console.error('Error en AuthService.changePassword:', error);
      return {
        success: false,
        error: 'Error al cambiar contraseña',
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      // TODO: Limpiar token del almacenamiento seguro
      // await SecureStore.deleteItemAsync('authToken');
      
      // TODO: Llamada al endpoint de logout para invalidar token en el servidor
      console.log('Usuario deslogueado');
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  /**
   * Verificar si hay token válido
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // TODO: Verificar token en almacenamiento seguro
      // const token = await SecureStore.getItemAsync('authToken');
      // return !!token;
      
      return false;
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      return false;
    }
  }

  /**
   * Obtener token actual
   */
  async getToken(): Promise<string | null> {
    try {
      // TODO: Obtener token del almacenamiento seguro
      // return await SecureStore.getItemAsync('authToken');
      
      return null;
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }
}

// Instancia singleton del servicio
export const authService = new AuthService();