/**
 * Servicio de Usuario - Booky
 * Gestión de operaciones relacionadas con usuarios y verificación de email
 */

import { apiService } from '../api/apiService';
import { API_CONFIG } from '../../config/api';
import { hashService } from '../../utils/hashService';
import { authService } from '../auth/authService';

// Tipos para el servicio de usuario
export interface RegisterUserRequest {
  Nombre: string;
  cedula: string;
  email: string;
  Telefono: string;
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

// Tipos para verificación de email
export interface VerifyEmailRequest {
  email: string;
  codigo: string;
}

export interface VerifyEmailResponse {
  error: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  resultado: boolean;
}

export interface VerifyEmailResult {
  success: boolean;
  error?: string;
  errors?: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  isNetworkError?: boolean;
}

// Tipos para el reenvío de código de verificación
export interface ResendVerificationCodeRequest {
  email: string;
}

export interface ResendVerificationCodeResponse {
  error: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  resultado: boolean;
}

export interface ResendCodeResult {
  success: boolean;
  error?: string;
  errors?: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  isNetworkError?: boolean;
}

export interface ApiProfileResponse {
  Nombre: string;
  Correo: string;
  Cedula: string;
  Telefono: string;
  error?: { ErrorCode: number; Message: string }[];
  resultado: boolean;
}

export interface EditProfileRequest {
  Nombre: string;
  Telefono: string;
}

export interface EditProfileResponse {
  Nombre: string;
  Telefono: string;
  error: Array<{
    ErrorCode: number;
    Message: string;
  }>;
  resultado: boolean;
}

export interface EditProfileResult {
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
      const requiredFields = ['Nombre', 'cedula', 'email', 'Telefono', 'rol', 'password'];
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
        Nombre: userData.Nombre.trim(),
        cedula: userData.cedula.trim(),
        email: userData.email.toLowerCase().trim(),
        Telefono: userData.Telefono.trim(),
        rol: userData.rol,
        password: hashedPassword,
      };

      console.log('👤 Enviando datos de registro:', {
        ...registerData,
        password: registerData.password.substring(0, 8) + '...', // Solo para debug
      });

      // Realizar petición al endpoint
      const response = await apiService.post<RegisterUserResponse>(
        API_CONFIG.ENDPOINTS.REGISTER_USER,
        registerData
      );

      console.log('👤 Respuesta del servidor:', response);

      // Verificar primero errores de red/conexión
      if (!response.success && response.status === 0) {
        console.error('👤 Error de red en registro');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // Verificar si llegaron datos del servidor
      const data = response.data;
      
      if (!data) {
        console.error('👤 Respuesta vacía del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar PRIMERO si el registro fue exitoso según la API
      // La API devuelve resultado: true para éxito, false para error
      if (data.resultado === true) {
        console.log('👤 ✅ Registro exitoso según la API');
        return {
          success: true,
        };
      }

      // Si resultado es false, es un error de negocio de la API
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
   * Verificar código de email
   * Implementa el endpoint POST api/VerificarEmail
   */
  async verifyEmailCode(email: string, codigo: string): Promise<VerifyEmailResult> {
    try {
      console.log('👤📧 Iniciando verificación de código de email...');
      
      // Validar que los datos estén presentes
      if (!email || email.trim() === '') {
        return {
          success: false,
          error: 'El correo electrónico es obligatorio',
        };
      }

      if (!codigo || codigo.trim() === '') {
        return {
          success: false,
          error: 'El código de verificación es obligatorio',
        };
      }

      // Validar formato del código (debe ser 6 dígitos)
      const cleanCode = codigo.trim();
      if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        return {
          success: false,
          error: 'El código debe tener exactamente 6 dígitos numéricos',
        };
      }

      // Preparar datos para el endpoint
      const verifyData: VerifyEmailRequest = {
        email: email.toLowerCase().trim(),
        codigo: cleanCode,
      };

      console.log('👤📧 Enviando datos de verificación:', {
        email: verifyData.email,
        codigo: verifyData.codigo,
      });

      // Realizar petición al endpoint
      const response = await apiService.post<VerifyEmailResponse>(
        API_CONFIG.ENDPOINTS.VERIFY_EMAIL,
        verifyData
      );

      console.log('👤📧 Respuesta del servidor:', response);

      // Verificar errores de red/conexión
      if (!response.success && response.status === 0) {
        console.error('👤📧 Error de red en verificación');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // Verificar si llegaron datos del servidor
      const data = response.data;
      
      if (!data) {
        console.error('👤📧 Respuesta vacía del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar si la verificación fue exitosa según la API
      // La API devuelve resultado: true para éxito, false para error
      if (data.resultado === true) {
        console.log('👤📧 ✅ Verificación exitosa según la API');
        return {
          success: true,
        };
      }

      // Si resultado es false, es un error de negocio de la API
      console.log('👤📧 ❌ Verificación falló según la API (resultado: false)');
      
      // Extraer y mostrar errores específicos
      if (data.error && data.error.length > 0) {
        
        // Obtener el primer error como mensaje principal
        const firstError = data.error[0];
        const errorMessage = firstError.Message || 'Error en la verificación del código';
        
        console.log('👤📧 Mensaje de error para mostrar al usuario:', errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          errors: data.error,
        };
      }

      // Caso donde resultado es false pero no hay errores específicos
      console.error('👤📧 Verificación falló sin errores específicos en la respuesta');
      return {
        success: false,
        error: 'Código de verificación incorrecto. Por favor, intenta nuevamente.',
      };

    } catch (error: any) {
      console.error('👤📧 Error inesperado en verificación:', error);
      return {
        success: false,
        error: error.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
        isNetworkError: true,
      };
    }
  }

  /**
   * Reenviar código de verificación de email
   * Implementa el endpoint POST api/GenerarNuevoCodigoVerificacion
   */
  async resendEmailVerificationCode(email: string): Promise<ResendCodeResult> {
    try {
      console.log('👤📧 Iniciando reenvío de código de verificación...');
      
      // Validar que el email esté presente
      if (!email || email.trim() === '') {
        return {
          success: false,
          error: 'El correo electrónico es obligatorio',
        };
      }

      const cleanEmail = email.toLowerCase().trim();
      console.log('👤📧 Preparando reenvío de código para:', cleanEmail);

      // Preparar datos para el endpoint específico de reenvío de verificación
      const resendData: ResendVerificationCodeRequest = { 
        email: cleanEmail 
      };
      
      console.log('👤📧 Enviando solicitud de reenvío:', resendData);
      
      // Realizar petición al endpoint específico
      const response = await apiService.post<ResendVerificationCodeResponse>(
        API_CONFIG.ENDPOINTS.RESEND_VERIFICATION_CODE,
        resendData
      );

      console.log('👤📧 Respuesta del reenvío:', response);

      // Verificar errores de red/conexión
      if (!response.success && response.status === 0) {
        console.error('👤📧 Error de red en reenvío');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      const data = response.data;

      if (!data) {
        console.error('👤📧 Respuesta vacía del servidor para reenvío');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar si el reenvío fue exitoso según la API
      if (data.resultado === true) {
        console.log('👤📧 ✅ Reenvío exitoso según la API');
        return { 
          success: true 
        };
      }

      // Si resultado es false, es un error de negocio de la API
      console.log('👤📧 ❌ Reenvío falló según la API (resultado: false)');
      
      // Manejar errores específicos de la API
      if (data.error && data.error.length > 0) {
        const firstError = data.error[0];
        const errorMessage = firstError.Message || 'Error al reenviar el código';
        
        console.log('👤📧 Mensaje de error de reenvío:', errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          errors: data.error,
        };
      }

      // Caso donde resultado es false pero no hay errores específicos
      console.error('👤📧 Reenvío falló sin errores específicos');
      return {
        success: false,
        error: 'No se pudo reenviar el código de verificación.',
      };

    } catch (error: any) {
      console.error('👤📧 Error inesperado en reenvío:', error);
      return {
        success: false,
        error: error.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
        isNetworkError: true,
      };
    }
  }

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

  /**
 * Actualizar información del perfil de usuario
 * Solo permite editar Nombre y Telefono
 */
  async updateProfile(profileData: EditProfileRequest): Promise<EditProfileResult> {
    try {
      console.log('✏️ UserService: Iniciando actualización de perfil...');
      
      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'No se encontró token de autenticación',
        };
      }

      // Validar datos requeridos
      if (!profileData.Nombre || profileData.Nombre.trim().length < 2) {
        return {
          success: false,
          error: 'El nombre completo debe tener al menos 2 caracteres',
        };
      }

      // Preparar datos para el endpoint
      const updateData: EditProfileRequest = {
        Nombre: profileData.Nombre.trim(),
        Telefono: profileData.Telefono.trim(),
      };

      console.log('✏️ UserService: Enviando datos de actualización:', {
        Nombre: updateData.Nombre,
        Telefono: updateData.Telefono,
      });

      // Realizar petición al endpoint
      const response = await apiService.put<EditProfileResponse>(
        API_CONFIG.ENDPOINTS.EDIT_PROFILE,
        updateData,
        token
      );

      console.log('✏️ UserService: Respuesta del servidor:', response);

      // Verificar errores de red/conexión
      if (!response.success && response.status === 0) {
        console.error('✏️ UserService: Error de red en actualización');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // Verificar si llegaron datos del servidor
      const data = response.data;
      
      if (!data) {
        console.error('✏️ UserService: Respuesta vacía del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar si la actualización fue exitosa según la API
      if (data.resultado === true) {
        console.log('✏️ UserService: ✅ Actualización exitosa según la API');
        return {
          success: true,
        };
      }

      // Si resultado es false, es un error de negocio de la API
      console.log('✏️ UserService: ❌ Actualización falló según la API (resultado: false)');
      
      // Extraer y mostrar errores específicos
      if (data.error && data.error.length > 0) {
        const firstError = data.error[0];
        const errorMessage = firstError.Message || 'Error al actualizar el perfil';
        
        console.log('✏️ UserService: Mensaje de error para mostrar al usuario:', errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          errors: data.error,
        };
      }

      // Caso donde resultado es false pero no hay errores específicos
      console.error('✏️ UserService: Actualización falló sin errores específicos en la respuesta');
      return {
        success: false,
        error: 'No se pudo actualizar el perfil. Por favor, intenta nuevamente.',
      };

    } catch (error: any) {
      console.error('✏️ UserService: Error inesperado en actualización:', error);
      return {
        success: false,
        error: error.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
        isNetworkError: true,
      };
    }
  }

  // UTILIDADES PARA EMAIL
  /**
   * Validar formato de código de verificación
   */ 
  validateVerificationCode(code: string): boolean {
    if (!code) return false;
    
    // Remover espacios
    const cleanCode = code.replace(/\s/g, '');
    
    // Verificar que sean exactamente 6 dígitos
    return /^\d{6}$/.test(cleanCode);
  }

  /**
   * Formatear código para mostrar (agregar espacios cada 3 dígitos)
   */
  formatVerificationCode(code: string): string {
    if (!code) return code;
    
    const clean = code.replace(/\s/g, '');
    
    if (clean.length === 6) {
      return `${clean.substring(0, 3)} ${clean.substring(3, 6)}`;
    }
    
    return code;
  }

  /**
   * Formatear email para mostrar (ocultar parte del dominio para privacidad)
   */
  formatEmailForDisplay(email: string): string {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '***' + localPart.slice(-1)
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  }

  // FUNCIONALIDADES EXISTENTES DE VALIDACIÓN
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
/**
   * Validar formato de teléfono costarricense
   * Debe tener exactamente 8 dígitos y empezar con 2, 6, 7 u 8
   */
  validateCostaRicanPhone(phone: string): boolean {
    if (!phone) return true; // Teléfono es opcional
    
    // Remover espacios, guiones y paréntesis
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Verificar que sean exactamente 8 dígitos
    if (!/^\d{8}$/.test(cleanPhone)) {
      return false;
    }
    
    // Verificar que empiece con 2, 6, 7 u 8
    const firstDigit = cleanPhone.charAt(0);
    return ['2', '6', '7', '8'].includes(firstDigit);
  }

  /**
   * Validar formato de teléfono costarricense (versión anterior - mantener por compatibilidad)
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