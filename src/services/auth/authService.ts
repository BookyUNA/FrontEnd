/**
 * Servicio de Autenticación - Booky (ACTUALIZADO)
 * Actualizado con hash SHA256 para contraseñas, storage simple y logout completo
 * Incluye funcionalidad de recuperación de contraseña
 * NUEVO: Decodificación de JWT y manejo de roles de usuario
 */

import { apiService } from '../api/apiService';
import { API_CONFIG } from '../../config/api';
import { ReqInicioSesion, ResInicioSesion, ResCierreSesion, ApiError } from '../../types/api';
import { LoginFormData } from '../../types/auth';
import { hashService } from '../../utils/hashService';
import { storageService } from '../storage/simpleStorageService';
import { jwtDecoder, DecodedUserData } from '../../utils/jwtDecoder';

export interface LoginResult {
  success: boolean;
  token?: string;
  userRole?: string;
  userData?: DecodedUserData;
  error?: string;
  isNetworkError?: boolean;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
  isNetworkError?: boolean;
}

export interface ForgotPasswordResult {
  success: boolean;
  error?: string;
  isNetworkError?: boolean;
}

class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   * La contraseña se hashea con SHA256 antes de enviarla
   * ACTUALIZADO: Ahora decodifica el JWT y guarda el rol del usuario
   */
  async login(credentials: LoginFormData): Promise<LoginResult> {
    try {
      console.log('🔐 Iniciando proceso de login...');
      
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

      console.log('🔐 Enviando datos de login:', {
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
        console.error('🔐 Error de red en login');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // Respuesta del servidor recibida
      const loginResponse = response.data;
      
      if (!loginResponse) {
        console.error('🔐 Respuesta inválida del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Login exitoso
      if (loginResponse.resultado && loginResponse.token) {
        console.log('🔐 Login exitoso, token recibido');
        
        // ✅ DECODIFICAR JWT y extraer datos del usuario
        const userData = jwtDecoder.extractUserData(loginResponse.token);
        
        if (!userData) {
          console.error('🔐 Error al decodificar token JWT');
          return {
            success: false,
            error: 'Token recibido inválido',
          };
        }

        // Verificar si el token ha expirado
        if (userData.isExpired) {
          console.error('🔐 Token recibido ya ha expirado');
          return {
            success: false,
            error: 'El token de sesión ha expirado',
          };
        }

        console.log('🔐 Datos del usuario decodificados:', {
          userId: userData.userId,
          role: userData.role,
          expiresAt: new Date(userData.expiresAt * 1000).toISOString()
        });
        
        // ✅ GUARDAR TOKEN en memoria
        try {
          await storageService.saveAuthToken(loginResponse.token);
          console.log('🔐 Token guardado en memoria exitosamente');
        } catch (storageError) {
          console.error('🔐 Error al guardar token:', storageError);
          // No fallar el login por error de storage
        }

        // ✅ GUARDAR ROL en memoria
        try {
          await storageService.saveUserRole(userData.role);
          console.log('🔐 Rol guardado en memoria exitosamente:', userData.role);
        } catch (storageError) {
          console.error('🔐 Error al guardar rol:', storageError);
          // No fallar el login por error de storage
        }
        
        return {
          success: true,
          token: loginResponse.token,
          userRole: userData.role,
          userData: userData,
        };
      }

      // Login fallido - extraer mensaje de error
      const errorMessage = this.extractErrorMessage(loginResponse.error);
      
      console.log('🔐 Login fallido:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };

    } catch (error: any) {
      console.error('🔐 Error inesperado en login:', error);
      
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
   * Cerrar sesión - Implementación completa con endpoint
   * ACTUALIZADO: Limpia también el rol del usuario
   */
  async logout(): Promise<LogoutResult> {
    try {
      console.log('🚪 Iniciando proceso de logout...');
      
      // Obtener token actual antes de eliminarlo
      const currentToken = await storageService.getAuthToken();
      
      if (!currentToken) {
        console.log('🚪 No hay token para cerrar sesión, limpiando datos locales...');
        // Limpiar datos locales por si acaso
        await storageService.clearAll();
        return {
          success: true,
        };
      }

      console.log('🚪 Token encontrado, llamando endpoint de logout...', {
        tokenPreview: currentToken.substring(0, 20) + '...'
      });

      // Llamar al endpoint de logout para invalidar token en el servidor
      const response = await apiService.post<ResCierreSesion>(
        API_CONFIG.ENDPOINTS.LOGOUT,
        {}, // Body vacío para logout
        currentToken // Token en Authorization header
      );

      // Verificar respuesta del servidor
      if (response.success && response.data?.resultado) {
        console.log('🚪 Logout exitoso en el servidor');
      } else {
        console.warn('🚪 Logout falló en el servidor, pero continuando con limpieza local:', {
          serverResponse: response.data,
          status: response.status,
          error: response.error
        });
        
        // Extraer mensaje de error si existe
        const errorMessage = response.data?.error ? 
          this.extractErrorMessage(response.data.error) : 
          'Error al cerrar sesión en el servidor';

        // No retornar error aquí - siempre limpiar datos locales
        console.log('🚪 Error del servidor:', errorMessage, '- Limpiando datos locales de todas formas');
      }

      // ✅ SIEMPRE LIMPIAR TODOS LOS DATOS de memoria, sin importar la respuesta del servidor
      await storageService.clearAll();
      console.log('🚪 Token y rol eliminados de memoria exitosamente');
      
      console.log('🚪 Usuario deslogueado completamente');
      
      return {
        success: true,
      };
      
    } catch (error: any) {
      console.error('🚪 Error en proceso de logout:', error);
      
      // En caso de error, SIEMPRE limpiar datos locales
      try {
        await storageService.clearAll();
        console.log('🚪 Datos limpiados después de error');
      } catch (cleanupError) {
        console.error('🚪 Error al limpiar datos después de fallo:', cleanupError);
      }
      
      // Verificar si es error de red
      if (error.message && (error.message.includes('conexión') || error.message.includes('network'))) {
        return {
          success: true, // Consideramos exitoso porque limpiamos datos locales
          error: 'Se cerró la sesión localmente. Error de conexión al servidor.',
          isNetworkError: true,
        };
      }
      
      // Otros errores
      return {
        success: true, // Consideramos exitoso porque limpiamos datos locales
        error: 'Se cerró la sesión localmente. Error al comunicarse con el servidor.',
      };
    }
  }

  /**
   * Obtener rol del usuario actual
   * NUEVO: Método para obtener el rol desde storage o decodificando el token
   */
  async getUserRole(): Promise<string | null> {
    try {
      // Primero intentar obtener desde storage
      const roleFromStorage = await storageService.getUserRole();
      
      if (roleFromStorage) {
        console.log('👤 Rol obtenido desde storage:', roleFromStorage);
        return roleFromStorage;
      }

      // Si no hay rol en storage, intentar decodificar token actual
      const currentToken = await storageService.getAuthToken();
      
      if (!currentToken) {
        console.log('👤 No hay token disponible para obtener rol');
        return null;
      }

      const roleFromToken = jwtDecoder.getUserRole(currentToken);
      
      if (roleFromToken) {
        // Guardar rol en storage para próximas consultas
        await storageService.saveUserRole(roleFromToken);
        console.log('👤 Rol obtenido desde token y guardado en storage:', roleFromToken);
        return roleFromToken;
      }

      console.log('👤 No se pudo obtener rol del usuario');
      return null;
      
    } catch (error) {
      console.error('👤 Error al obtener rol del usuario:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario actual es profesional
   * NUEVO: Método de conveniencia para verificar rol profesional
   */
  async isProfessional(): Promise<boolean> {
    try {
      const role = await this.getUserRole();
      return role === 'Profesional';
    } catch (error) {
      console.error('👤 Error al verificar si es profesional:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario actual es cliente
   * NUEVO: Método de conveniencia para verificar rol cliente
   */
  async isClient(): Promise<boolean> {
    try {
      const role = await this.getUserRole();
      return role === 'Cliente';
    } catch (error) {
      console.error('👤 Error al verificar si es cliente:', error);
      return false;
    }
  }

  /**
   * Obtener datos completos del usuario desde el token
   * NUEVO: Método para obtener toda la información del token
   */
  async getUserData(): Promise<DecodedUserData | null> {
    try {
      const currentToken = await storageService.getAuthToken();
      
      if (!currentToken) {
        console.log('👤 No hay token disponible para obtener datos');
        return null;
      }

      const userData = jwtDecoder.extractUserData(currentToken);
      
      if (userData) {
        console.log('👤 Datos del usuario obtenidos:', {
          userId: userData.userId,
          role: userData.role,
          isExpired: userData.isExpired
        });
      }

      return userData;
      
    } catch (error) {
      console.error('👤 Error al obtener datos del usuario:', error);
      return null;
    }
  }

  /**
   * Verificar si el token actual es válido (no expirado)
   * ACTUALIZADO: Usa el decoder para verificar expiración
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const currentToken = await storageService.getAuthToken();
      
      if (!currentToken) {
        return false;
      }

      return !jwtDecoder.isTokenExpired(currentToken);
      
    } catch (error) {
      console.error('🔍 Error al verificar validez del token:', error);
      return false;
    }
  }

  /**
   * Función de debug para verificar el estado completo de autenticación
   * NUEVO: Función mejorada que muestra token y rol
   */
  async debugAuthState(): Promise<void> {
    console.log('🔍 === DEBUG ESTADO AUTENTICACIÓN ===');
    
    const token = await storageService.getAuthToken();
    const role = await storageService.getUserRole();
    const isAuth = await this.isAuthenticated();
    const isValidToken = await this.isTokenValid();
    const userData = await this.getUserData();
    
    console.log('- Token existe:', !!token);
    console.log('- Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('- Rol guardado:', role);
    console.log('- ¿Autenticado?:', isAuth);
    console.log('- ¿Token válido?:', isValidToken);
    
    if (userData) {
      console.log('- Datos del token:');
      console.log('  - User ID:', userData.userId);
      console.log('  - Rol desde token:', userData.role);
      console.log('  - ¿Expirado?:', userData.isExpired);
      console.log('  - Expira en:', new Date(userData.expiresAt * 1000).toISOString());
    }

    if (token) {
      jwtDecoder.debugToken(token);
    }

    await storageService.debugStorage();
    
    console.log('🔍 === FIN DEBUG AUTENTICACIÓN ===');
  }

  // ... resto de métodos anteriores (forgotPassword, resetPassword, etc.)
  // Los mantengo igual que antes por brevedad

  /**
   * Solicitar recuperación de contraseña
   * Envía email para restablecer contraseña
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    try {
      console.log('🔑 Iniciando proceso de recuperación de contraseña...');

      // Validar que el email esté presente
      if (!email || email.trim() === '') {
        return {
          success: false,
          error: 'El correo electrónico es obligatorio',
        };
      }

      const cleanEmail = email.toLowerCase().trim();
      console.log('🔑 Preparando solicitud de recuperación para:', cleanEmail);

      const requestData = { email: cleanEmail };
      const response = await apiService.post(
        API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
        requestData
      );

      if (!response.success && response.status === 0) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      const data = response.data as any;

      if (!data) {
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar si la operación fue exitosa
      if (data.resultado === true) {
        return { success: true };
      }

      // Extraer mensaje de error si existe
      let errorMessage = 'Error desconocido';
      
      if (data.error && Array.isArray(data.error) && data.error.length > 0) {
        errorMessage = data.error[0]?.Message || 'Error desconocido';
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      }
      
      return { success: false, error: errorMessage };

    } catch (error: any) {
      console.error('🔑 Error inesperado en recuperación de contraseña:', error);

      if (error.message && (error.message.includes('conexión') || error.message.includes('network'))) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
      };
    }
  }

  /**
   * Restablecer contraseña
   * Requiere: código recibido por email + nueva contraseña + confirmación
   */
  async resetPassword(code: string, newPassword: string, confirmPassword: string): Promise<ForgotPasswordResult> {
    try {
      console.log('🔒 Iniciando proceso de reseteo de contraseña...');

      // Validar que todos los datos estén presentes
      if (!code || !newPassword || !confirmPassword) {
        return {
          success: false,
          error: 'Todos los campos son obligatorios',
        };
      }

      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          error: 'Las contraseñas no coinciden',
        };
      }

      // Validar código de 6 dígitos numéricos
      if (!/^\d{6}$/.test(code)) {
        return {
          success: false,
          error: 'El código debe tener 6 dígitos numéricos',
        };
      }

      // Hashear las contraseñas
      const hashedNewPassword = hashService.hashPassword(newPassword);
      const hashedConfirmPassword = hashService.hashPassword(confirmPassword);

      console.log('🔒 Preparando datos de reseteo con contraseñas hasheadas');

      const requestData = {
        CodigoRecuperacion: code,
        NuevaContrasenaHash: hashedNewPassword,
        ConfirmacionContrasenaHash: hashedConfirmPassword,
      };

      console.log('🔒 Enviando solicitud de reseteo al servidor...');

      const response = await apiService.post(
        API_CONFIG.ENDPOINTS.RESET_PASSWORD,
        requestData
      );

      // Error de red
      if (!response.success && response.status === 0) {
        console.error('🔒 Error de red en reseteo de contraseña');
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      const data = response.data as any;

      if (!data) {
        console.error('🔒 Respuesta inválida del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Verificar si el reseteo fue exitoso
      if (data.resultado === true) {
        console.log('🔒 Contraseña reseteada exitosamente');
        return { success: true };
      }

      // Extraer mensaje de error si existe
      let errorMessage = 'Error al cambiar la contraseña';
      
      if (data.error && Array.isArray(data.error) && data.error.length > 0) {
        errorMessage = this.extractErrorMessage(data.error);
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      }
      
      console.log('🔒 Error al resetear contraseña:', errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };

    } catch (error: any) {
      console.error('🔒 Error inesperado en resetPassword:', error);

      // Verificar si es un error de hash
      if (error.message && error.message.includes('hashear')) {
        return {
          success: false,
          error: 'Error al procesar las contraseñas',
        };
      }

      if (error.message && (error.message.includes('conexión') || error.message.includes('network'))) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
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
      console.log('📝 Preparando registro de usuario...');
      
      // Hashear la contraseña
      const hashedPassword = hashService.hashPassword(userData.password);

      const registerData = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
      };

      // TODO: Implementar llamada al endpoint de registro
      console.log('📝 Datos de registro preparados (contraseña hasheada)');
      
      return {
        success: false,
        error: 'Función de registro no implementada aún',
      };

    } catch (error: any) {
      console.error('📝 Error en AuthService.register:', error);
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
      case 20004:
        return 'No se encontró una cuenta asociada a este correo electrónico';
      case 30001:
        return 'El código de recuperación es inválido o ha expirado';
      case 30002:
        return 'El código de recuperación ya fue utilizado';
      case 30003:
        return 'Las contraseñas no coinciden';
      case 30004:
        return 'La nueva contraseña no cumple con los requisitos de seguridad';
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
      console.log('🔑 Preparando cambio de contraseña...');
      
      const hashedCurrentPassword = hashService.hashPassword(currentPassword);
      const hashedNewPassword = hashService.hashPassword(newPassword);

      // TODO: Implementar llamada al endpoint de cambio de contraseña
      console.log('🔑 Preparando cambio de contraseña con hashes SHA256');
      
      return {
        success: false,
        error: 'Función de cambio de contraseña no implementada aún',
      };

    } catch (error: any) {
      console.error('🔑 Error en AuthService.changePassword:', error);
      return {
        success: false,
        error: 'Error al cambiar contraseña',
      };
    }
  }

  /**
   * Verificar si hay token válido
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Verificar si hay token en memoria
      const hasToken = await storageService.hasAuthToken();
      
      if (!hasToken) {
        console.log('🔍 No hay token - usuario no autenticado');
        return false;
      }

      // Verificar si el token es válido (no expirado)
      const isValid = await this.isTokenValid();
      
      console.log('🔍 Estado de autenticación:', isValid ? 'Autenticado' : 'Token expirado');
      return isValid;
      
    } catch (error) {
      console.error('🔍 Error al verificar autenticación:', error);
      return false;
    }
  }

  /**
   * Obtener token actual
   */
  async getToken(): Promise<string | null> {
    try {
      // Obtener token de memoria
      const token = await storageService.getAuthToken();
      return token;
      
    } catch (error) {
      console.error('🔍 Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Limpiar todos los datos de autenticación
   */
  async clearAuthData(): Promise<void> {
    try {
      await storageService.clearAll();
      console.log('🧹 Todos los datos de autenticación limpiados');
    } catch (error) {
      console.error('🧹 Error al limpiar datos:', error);
    }
  }
}

// Instancia singleton del servicio
export const authService = new AuthService();