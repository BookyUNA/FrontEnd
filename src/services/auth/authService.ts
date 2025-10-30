/**
 * Servicio de Autenticación - Booky (ACTUALIZADO)
 * Actualizado con hash SHA256 para contraseñas, storage simple y logout completo
 * Incluye funcionalidad de recuperación de contraseña
 * Decodificación de JWT y manejo de roles de usuario
 * NUEVO: Soporte para planId de usuarios profesionales
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
  userPlanId?: number; // ID del plan para profesionales
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
   * Decodifica el JWT y guarda el rol del usuario y planId (si es profesional)
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
        console.log('🔐 Error de red en login');
        return {
          success: false,
          error: response.error || 'Error de conexión. Verifica tu conexión a internet.',
          isNetworkError: true,
        };
      }

      // Respuesta del servidor recibida
      const loginResponse = response.data;
      
      if (!loginResponse) {
        console.log('🔐 Respuesta inválida del servidor');
        return {
          success: false,
          error: 'Respuesta inválida del servidor',
        };
      }

      // Login exitoso
      if (loginResponse.resultado && loginResponse.token) {
        console.log('🔐 Login exitoso, token recibido');
        
        // DECODIFICAR JWT y extraer datos del usuario
        const userData = jwtDecoder.extractUserData(loginResponse.token);
        
        if (!userData) {
          console.log('🔐 Error al decodificar token JWT');
          return {
            success: false,
            error: 'Token recibido inválido',
          };
        }

        // Verificar si el token ha expirado
        if (userData.isExpired) {
          console.log('🔐 Token recibido ya ha expirado');
          return {
            success: false,
            error: 'El token de sesión ha expirado',
          };
        }

        console.log('🔐 Datos del usuario decodificados:', {
          userId: userData.userId,
          role: userData.role,
          planId: userData.planId,
          expiresAt: new Date(userData.expiresAt * 1000).toISOString()
        });
        
        // GUARDAR TOKEN en memoria
        try {
          await storageService.saveAuthToken(loginResponse.token);
          console.log('🔐 Token guardado en memoria exitosamente');
        } catch (storageError) {
          console.log('🔐 Error al guardar token:', storageError);
          // No fallar el login por error de storage
        }

        // GUARDAR ROL en memoria
        try {
          await storageService.saveUserRole(userData.role);
          console.log('🔐 Rol guardado en memoria exitosamente:', userData.role);
        } catch (storageError) {
          console.log('🔐 Error al guardar rol:', storageError);
          // No fallar el login por error de storage
        }

        // GUARDAR PLAN ID en memoria (solo para profesionales)
        if (userData.role === 'Profesional') {
          try {
            const planId = userData.planId || 1; // Usar 1 por defecto si no viene
            await storageService.saveUserPlanId(planId);
            console.log('📋 Plan ID guardado en memoria exitosamente:', planId);
          } catch (storageError) {
            console.log('📋 Error al guardar plan ID:', storageError);
            // No fallar el login por error de storage
          }
        }
        
        return {
          success: true,
          token: loginResponse.token,
          userRole: userData.role,
          userPlanId: userData.planId,
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
      console.log('🔐 Error inesperado en login:', error);
      
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
   * Limpia token, rol y plan ID del usuario
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

      // SIEMPRE LIMPIAR TODOS LOS DATOS de memoria, sin importar la respuesta del servidor
      await storageService.clearAll();
      console.log('🚪 Token, rol y plan ID eliminados de memoria exitosamente');
      
      console.log('🚪 Usuario deslogueado completamente');
      
      return {
        success: true,
      };
      
    } catch (error: any) {
      console.log('🚪 Error en proceso de logout:', error);
      
      // En caso de error, SIEMPRE limpiar datos locales
      try {
        await storageService.clearAll();
        console.log('🚪 Datos limpiados después de error');
      } catch (cleanupError) {
        console.log('🚪 Error al limpiar datos después de fallo:', cleanupError);
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
   * Método para obtener el rol desde storage o decodificando el token
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
      console.log('👤 Error al obtener rol del usuario:', error);
      return null;
    }
  }

  /**
   * Obtener plan ID del usuario actual (solo para profesionales)
   * Método para obtener el planId desde storage o decodificando el token
   */
  async getUserPlanId(): Promise<number | null> {
    try {
      // Primero verificar que sea profesional
      const userRole = await this.getUserRole();
      if (userRole !== 'Profesional') {
        console.log('📋 Usuario no es profesional, no tiene plan ID');
        return null;
      }

      // Intentar obtener desde storage
      const planIdFromStorage = await storageService.getUserPlanId();
      
      if (planIdFromStorage) {
        console.log('📋 Plan ID obtenido desde storage:', planIdFromStorage);
        return planIdFromStorage;
      }

      // Si no hay planId en storage, intentar decodificar token actual
      const currentToken = await storageService.getAuthToken();
      
      if (!currentToken) {
        console.log('📋 No hay token disponible para obtener plan ID');
        return null;
      }

      const planIdFromToken = jwtDecoder.getUserPlanId(currentToken);
      
      if (planIdFromToken) {
        // Guardar planId en storage para próximas consultas
        await storageService.saveUserPlanId(planIdFromToken);
        console.log('📋 Plan ID obtenido desde token y guardado en storage:', planIdFromToken);
        return planIdFromToken;
      }

      // Si no viene en el token, usar 1 por defecto para profesionales
      const defaultPlanId = 1;
      await storageService.saveUserPlanId(defaultPlanId);
      console.log('📋 Plan ID no encontrado en token, usando valor por defecto:', defaultPlanId);
      return defaultPlanId;
      
    } catch (error) {
      console.log('📋 Error al obtener plan ID del usuario:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario actual es profesional
   * Método de conveniencia para verificar rol profesional
   */
  async isProfessional(): Promise<boolean> {
    try {
      const role = await this.getUserRole();
      return role === 'Profesional';
    } catch (error) {
      console.log('👤 Error al verificar si es profesional:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario actual es cliente
   * Método de conveniencia para verificar rol cliente
   */
  async isClient(): Promise<boolean> {
    try {
      const role = await this.getUserRole();
      return role === 'Cliente';
    } catch (error) {
      console.log('👤 Error al verificar si es cliente:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario tiene un plan específico
   * Método de conveniencia para verificar plan del profesional
   */
  async hasSpecificPlan(targetPlanId: number): Promise<boolean> {
    try {
      const planId = await this.getUserPlanId();
      return planId === targetPlanId;
    } catch (error) {
      console.log('📋 Error al verificar plan específico:', error);
      return false;
    }
  }

  /**
   * Obtener datos completos del usuario desde el token
   * Método para obtener toda la información del token
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
          planId: userData.planId,
          isExpired: userData.isExpired
        });
      }

      return userData;
      
    } catch (error) {
      console.log('👤 Error al obtener datos del usuario:', error);
      return null;
    }
  }

  /**
   * Verificar si el token actual es válido (no expirado)
   * Usa el decoder para verificar expiración
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const currentToken = await storageService.getAuthToken();
      
      if (!currentToken) {
        return false;
      }

      return !jwtDecoder.isTokenExpired(currentToken);
      
    } catch (error) {
      console.log('🔍 Error al verificar validez del token:', error);
      return false;
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
      console.log('🔍 Error al verificar autenticación:', error);
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
      console.log('🔍 Error al obtener token:', error);
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
      console.log('🧹 Error al limpiar datos:', error);
    }
  }

  /**
   * Función de debug para verificar el estado completo de autenticación
   * Función mejorada que muestra token, rol y plan ID
   */
  async debugAuthState(): Promise<void> {
    console.log('🔍 === DEBUG ESTADO AUTENTICACIÓN ===');
    
    const token = await storageService.getAuthToken();
    const role = await storageService.getUserRole();
    const planId = await storageService.getUserPlanId();
    const isAuth = await this.isAuthenticated();
    const isValidToken = await this.isTokenValid();
    const userData = await this.getUserData();
    
    console.log('- Token existe:', !!token);
    console.log('- Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('- Rol guardado:', role);
    console.log('- Plan ID guardado:', planId);
    console.log('- ¿Autenticado?:', isAuth);
    console.log('- ¿Token válido?:', isValidToken);
    
    if (userData) {
      console.log('- Datos del token:');
      console.log('  - User ID:', userData.userId);
      console.log('  - Rol desde token:', userData.role);
      console.log('  - Plan ID desde token:', userData.planId);
      console.log('  - ¿Expirado?:', userData.isExpired);
      console.log('  - Expira en:', new Date(userData.expiresAt * 1000).toISOString());
    }

    if (token) {
      jwtDecoder.debugToken(token);
    }

    await storageService.debugStorage();
    
    console.log('🔍 === FIN DEBUG AUTENTICACIÓN ===');
  }

  /**
   * Extraer mensaje de error de la respuesta del servidor
   */
  private extractErrorMessage(errors: ApiError[] | undefined): string {
    if (!errors || errors.length === 0) {
      return 'Error desconocido del servidor';
    }

    const firstError = errors[0];
    
    switch (firstError.ErrorCode) {
      case 20003:
        return 'Credenciales incorrectas. Verifica tu email y contraseña.';
      case 1:
        return 'Datos requeridos faltantes. Verifica tu información.';
      case 999:
        return 'Error interno del servidor. Intenta más tarde.';
      default:
        return firstError.Message || 'Error de autenticación';
    }
  }

  // Métodos adicionales como forgotPassword, resetPassword, changePassword...
  // (se mantienen igual que en la versión anterior)
}

// Instancia singleton del servicio
export const authService = new AuthService();