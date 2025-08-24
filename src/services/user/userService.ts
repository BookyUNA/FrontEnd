/**
 * Servicio de Usuario - Booky
 * Gestión de operaciones relacionadas con usuarios
 */

import { apiService } from '../api/apiService';
import { API_CONFIG } from '../../config/api';
import { hashService } from '../../utils/hashService';

// Tipos para el servicio de usuario
export interface RegisterUserRequest {
  nombreCompleto: string;
  cedula: string;
  email: string;
  telefono: string;
  rol: string;
  password: string;
}

export interface RegisterUserResponse {
  error: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  resultado: boolean;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  errors?: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  isNetworkError?: boolean;
}

class UserService {
  /**
   * Registrar un nuevo usuario
   * La contraseña se hashea con SHA256 antes de enviarla
   */
  async registerUser(userData: RegisterUserRequest): Promise<RegisterResult> {
    try {
      console.log('👤 Iniciando proceso de registro de usuario...');
      
      // Validar que los datos estén presentes
      const requiredFields = ['nombreCompleto', 'cedula', 'email', 'telefono', 'rol', 'password'];
      const missingFields = requiredFields.filter(field => !userData[field as keyof RegisterUserRequest]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Faltan los siguientes campos: ${missingFields.join(', ')}`,
        };
      }

      // Hashear la contraseña con SHA256
      const hashedPassword = hashService.hashPassword(userData.password);

      // Preparar datos para el endpoint
      const registerData = {
        nombreCompleto: userData.nombreCompleto.trim(),
        cedula: userData.cedula.trim(),
        email: userData.email.toLowerCase().trim(),
        telefono: userData.telefono.trim(),
        rol: userData.rol,
        password: hashedPassword,
      };

      console.log('👤 Enviando datos de registro:', {
        ...registerData,
        password: registerData.password.substring(0, 8) + '...', // Solo para debug
      });

      // Realizar petición al endpoint
      const response = await apiService.post<RegisterUserResponse>(
        '/RegistrarUsuario',
        registerData
      );

      console.log('👤 Respuesta del servidor:', response);

      // Error de red
      if (!response.success && response.status === 0) {
        console.error('👤 Error de red en registro');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // Si la respuesta del servidor no es exitosa (pero hay respuesta)
      if (!response.success) {
        console.error('👤 Error del servidor:', response);
        return {
          success: false,
          error: response.error || 'Error del servidor. Por favor, intenta nuevamente.',
        };
      }

      // La API respondió correctamente, revisar el contenido
      const data = response.data;
      
      if (!data) {
        console.error('👤 Respuesta vacía del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar si el registro fue exitoso según la API
      if (data.resultado === true) {
        console.log('👤 Registro exitoso');
        return {
          success: true,
        };
      }

      // El registro falló según la API, verificar errores
      if (data.error && data.error.length > 0) {
        console.error('👤 Errores de registro:', data.error);
        
        // Obtener el primer error como mensaje principal
        const firstError = data.error[0];
        const errorMessage = firstError.Message || 'Error en el registro';
        
        return {
          success: false,
          error: errorMessage,
          errors: data.error,
        };
      }

      // Caso donde resultado es false pero no hay errores específicos
      console.error('👤 Registro falló sin errores específicos');
      return {
        success: false,
        error: 'No se pudo completar el registro. Por favor, intenta nuevamente.',
      };

    } catch (error: any) {
      console.error('👤 Error inesperado en registro:', error);
      return {
        success: false,
        error: error.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
      };
    }
  }

  /**
   * Validar formato de cédula costarricense - SIMPLIFICADO
   * Solo verifica que sean exactamente 9 números
   */
  validateCedula(cedula: string): boolean {
    // Remover espacios y guiones
    const cleanCedula = cedula.replace(/[\s-]/g, '');
    
    // Debe tener exactamente 9 dígitos
    return /^\d{9}$/.test(cleanCedula);
  }

  /**
   * Formatear cédula con guiones para mostrar
   */
  formatCedula(cedula: string): string {
    const cleanCedula = cedula.replace(/[\s-]/g, '');
    if (cleanCedula.length === 9) {
      return `${cleanCedula.substring(0, 1)}-${cleanCedula.substring(1, 5)}-${cleanCedula.substring(5, 9)}`;
    }
    return cedula;
  }

  /**
   * Validar formato de teléfono costarricense
   */
  validatePhone(phone: string): boolean {
    // Remover espacios, guiones y paréntesis
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    
    // Debe tener 8 dígitos y empezar con 2, 4, 6, 7, u 8
    return /^[24678]\d{7}$/.test(cleanPhone);
  }

  /**
   * Formatear teléfono para mostrar
   */
  formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    if (cleanPhone.length === 8) {
      return `${cleanPhone.substring(0, 4)}-${cleanPhone.substring(4, 8)}`;
    }
    return phone;
  }
}

// Instancia singleton del servicio
export const userService = new UserService();