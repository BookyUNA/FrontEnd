/**
 * Servicio de Usuario - Booky (CORREGIDO)
 * Gestión de operaciones relacionadas con usuarios
 * CORREGIDO: Mejor manejo de errores de API y respuestas del servidor
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
   * CORREGIDO: Mejor manejo de la respuesta del servidor
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

      // CORREGIDO: Verificar primero errores de red/conexión
      if (!response.success && response.status === 0) {
        console.error('👤 Error de red en registro');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // CORREGIDO: Verificar si llegaron datos del servidor
      const data = response.data;
      
      if (!data) {
        console.error('👤 Respuesta vacía del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // CORREGIDO: Verificar PRIMERO si el registro fue exitoso según la API
      // La API devuelve resultado: true para éxito, false para error
      if (data.resultado === true) {
        console.log('👤 ✅ Registro exitoso según la API');
        return {
          success: true,
        };
      }

      // CORREGIDO: Si resultado es false, es un error de negocio de la API
      console.log('👤 ❌ Registro falló según la API (resultado: false)');
      
      // Extraer y mostrar errores específicos
      if (data.error && data.error.length > 0) {
        
        // Obtener el primer error como mensaje principal
        const firstError = data.error[0];
        const errorMessage = firstError.Message || 'Error en el registro';
        
        console.log('👤 Mensaje de error para mostrar al usuario:', errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          errors: data.error,
        };
      }

      // Caso donde resultado es false pero no hay errores específicos
      console.error('👤 Registro falló sin errores específicos en la respuesta');
      return {
        success: false,
        error: 'No se pudo completar el registro. Por favor, intenta nuevamente.',
      };

    } catch (error: any) {
      console.error('👤 Error inesperado en registro:', error);
      return {
        success: false,
        error: error.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
        isNetworkError: true,
      };
    }
  }

  /**
   * Validar formato de cédula costarricense
   * Formato esperado: 9 dígitos (con o sin guiones)
   */
  validateCedula(cedula: string): boolean {
    if (!cedula) return false;
    
    // Remover guiones y espacios
    const cleanCedula = cedula.replace(/[\s-]/g, '');
    
    // Verificar que sean exactamente 9 dígitos
    return /^\d{9}$/.test(cleanCedula);
  }

  /**
   * Validar formato de teléfono costarricense
   * Formato esperado: 8 dígitos (puede tener guión después del 4to dígito)
   */
  validatePhone(phone: string): boolean {
    if (!phone) return false;
    
    // Remover guiones, espacios y paréntesis
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Verificar que sean 8 dígitos para números de Costa Rica
    if (/^\d{8}$/.test(cleanPhone)) {
      return true;
    }
    
    // También aceptar con código de país +506
    if (cleanPhone.length === 11 && cleanPhone.startsWith('506')) {
      return /^506\d{8}$/.test(cleanPhone);
    }
    
    return false;
  }

  /**
   * Formatear cédula para mostrar
   */
  formatCedula(cedula: string): string {
    if (!cedula) return cedula;
    
    const clean = cedula.replace(/[\s-]/g, '');
    
    if (clean.length === 9) {
      return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5, 9)}`;
    }
    
    return cedula;
  }

  /**
   * Formatear teléfono para mostrar
   */
  formatPhone(phone: string): string {
    if (!phone) return phone;
    
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    
    if (clean.length === 8) {
      return `${clean.substring(0, 4)}-${clean.substring(4, 8)}`;
    }
    
    return phone;
  }
}

// Instancia singleton del servicio
export const userService = new UserService();