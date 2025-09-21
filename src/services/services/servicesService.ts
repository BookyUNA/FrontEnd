/**
 * Servicio de Servicios - Booky
 * Gestión de llamadas a la API de servicios profesionales
 */

import { apiService } from '../api/apiService';
import { authService } from '../auth/authService';
import { API_CONFIG } from '../../config/api';

// Tipos para servicios
export interface Servicio {
  IdServicio: number;
  Nombre: string;
  Descripcion: string;
  DuracionMinutos: number;
  Precio: number;
  PermiteDescuento: boolean;
  PorcentajeDescuento: number;
  FechaCreacion: string;
  Estado: boolean;
}

export interface Error {
  ErrorCode: number;
  Message: string;
}

// Request para listar servicios
export interface ReqListarServicio {
  nombre?: string;
}

// Response de listar servicios
export interface ResListarServicio {
  servicios: Servicio[];
  error: Error[];
  resultado: boolean;
}

// Resultado procesado
export interface ServicesResult {
  success: boolean;
  servicios?: Servicio[];
  error?: string;
  errors?: Error[];
  isNetworkError?: boolean;
}

// Request para cambiar estado de servicio
export interface ReqCambiarEstadoServicio {
  IdServicio: number;
}

// Response de cambiar estado de servicio
export interface ResCambiarEstadoServicio {
  EstadoServicio: boolean;
  error: Error[];
  resultado: boolean;
}

// Resultado procesado para cambiar estado
export interface ChangeServiceStateResult {
  success: boolean;
  newState?: boolean;
  error?: string;
  errors?: Error[];
  isNetworkError?: boolean;
}

class ServicesService {
  /**
   * Obtener servicios del profesional
   * @param searchTerm - Término de búsqueda opcional
   */
  async getServices(searchTerm?: string): Promise<ServicesResult> {
    try {
      console.log('📋 Obteniendo servicios...', { searchTerm });

      // Verificar autenticación
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Usuario no autenticado',
        };
      }

      // Verificar que sea profesional
      const isProfessional = await authService.isProfessional();
      if (!isProfessional) {
        return {
          success: false,
          error: 'Solo los profesionales pueden ver servicios',
        };
      }

      // Obtener token
      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'Token de acceso no disponible',
        };
      }

      // Preparar request
      const requestBody: ReqListarServicio = {};
      
      // Agregar término de búsqueda si existe
      if (searchTerm && searchTerm.trim()) {
        requestBody.nombre = searchTerm.trim();
      }

      console.log('📋 Request a API:', {
        endpoint: API_CONFIG.ENDPOINTS.LISTAR_SERVICIOS_PROFESIONAL,
        body: requestBody,
        hasToken: !!token,
      });

      // Realizar llamada a la API usando el método post
      const response = await apiService.post<ResListarServicio>(
        API_CONFIG.ENDPOINTS.LISTAR_SERVICIOS_PROFESIONAL,
        requestBody,
        token
      );

      console.log('📋 Response de API:', {
        success: response.success,
        status: response.status,
        hasData: !!response.data,
      });

      // Verificar errores de red
      if (!response.success && response.status === 0) {
        return {
          success: false,
          error: response.error || 'Error de conexión. Revisa tu internet e intenta nuevamente.',
          isNetworkError: true,
        };
      }

      // Verificar si hay datos
      if (!response.data) {
        return {
          success: false,
          error: 'No se recibieron datos del servidor',
        };
      }

      // Procesar response
      if (response.data.resultado) {
        // Éxito
        const services = response.data.servicios || [];
        
        console.log('📋 Servicios obtenidos exitosamente:', {
          total: services.length,
          activos: services.filter((service: Servicio) => service.Estado).length,
        });

        return {
          success: true,
          servicios: services,
        };
      } else {
        // Error del servidor
        const errorMessage = this.processErrors(response.data.error);
        console.warn('📋 Error del servidor:', errorMessage);

        return {
          success: false,
          error: errorMessage,
          errors: response.data.error,
        };
      }

    } catch (error: any) {
      //console.error('📋 Error al obtener servicios:', error);

      // Determinar tipo de error
      if (error?.response?.status) {
        const statusCode = error.response.status;
        
        if (statusCode === 401) {
          return {
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          };
        }
        
        if (statusCode === 403) {
          return {
            success: false,
            error: 'No tienes permisos para acceder a esta información.',
          };
        }
        
        if (statusCode >= 500) {
          return {
            success: false,
            error: 'Error interno del servidor. Intenta más tarde.',
            isNetworkError: true,
          };
        }
      }

      // Error de red o conexión
      if (error?.message?.includes('Network') || error?.code === 'NETWORK_ERROR') {
        return {
          success: false,
          error: 'Error de conexión. Revisa tu internet e intenta nuevamente.',
          isNetworkError: true,
        };
      }

      // Error genérico
      return {
        success: false,
        error: 'Error inesperado. Intenta nuevamente.',
      };
    }
  }

  /**
   * Buscar servicios por nombre
   * @param searchTerm - Término de búsqueda
   */
  async searchServices(searchTerm: string): Promise<ServicesResult> {
    return this.getServices(searchTerm);
  }

  /**
   * Obtener servicios activos únicamente
   */
  async getActiveServices(): Promise<ServicesResult> {
    try {
      const result = await this.getServices();
      
      if (result.success && result.servicios) {
        const activeServices = result.servicios.filter(service => service.Estado);
        
        return {
          ...result,
          servicios: activeServices,
        };
      }
      
      return result;
      
    } catch (error) {
      //console.error('📋 Error al obtener servicios activos:', error);
      return {
        success: false,
        error: 'Error al filtrar servicios activos',
      };
    }
  }

  /**
   * Verificar si el usuario puede gestionar servicios
   */
  async canManageServices(): Promise<boolean> {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      const isProfessional = await authService.isProfessional();
      
      return isAuthenticated && isProfessional;
      
    } catch (error) {
      //console.error('📋 Error al verificar permisos de servicios:', error);
      return false;
    }
  }

  /**
   * Procesar array de errores de la API
   */
  private processErrors(errors?: Error[]): string {
    if (!errors || errors.length === 0) {
      return 'Error desconocido del servidor';
    }

    // Si hay múltiples errores, tomar el primero
    const firstError = errors[0];
    
    // Mapear códigos de error comunes a mensajes amigables
    switch (firstError.ErrorCode) {
      case 401:
        return 'Sesión expirada. Inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'Servicios no encontrados.';
      case 500:
        return 'Error interno del servidor. Intenta más tarde.';
      default:
        return firstError.Message || 'Error del servidor';
    }
  }

  /**
   * Obtener estadísticas de servicios
   */
  async getServicesStats(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
  }> {
    try {
      const result = await this.getServices();
      
      if (result.success && result.servicios) {
        const total = result.servicios.length;
        const activos = result.servicios.filter(s => s.Estado).length;
        const inactivos = total - activos;
        
        return { total, activos, inactivos };
      }
      
      return { total: 0, activos: 0, inactivos: 0 };
      
    } catch (error) {
      //console.error('📋 Error al obtener estadísticas:', error);
      return { total: 0, activos: 0, inactivos: 0 };
    }
  }

  /**
   * Función de debug para verificar el estado del servicio
   */
  async debugServicesService(): Promise<void> {
    console.log('🔍 === DEBUG SERVICES SERVICE ===');
    
    const isAuth = await authService.isAuthenticated();
    const isPro = await authService.isProfessional();
    const canManage = await this.canManageServices();
    const token = await authService.getToken();
    
    console.log('- ¿Autenticado?:', isAuth);
    console.log('- ¿Es Profesional?:', isPro);
    console.log('- ¿Puede gestionar servicios?:', canManage);
    console.log('- ¿Tiene token?:', !!token);
    
    if (canManage) {
      try {
        console.log('- Probando obtener servicios...');
        const result = await this.getServices();
        console.log('- Resultado servicios:', {
          success: result.success,
          count: result.servicios?.length || 0,
          error: result.error,
        });
      } catch (error) {
        console.log('- Error al probar servicios:', error);
      }
    }
    
    console.log('🔍 === FIN DEBUG SERVICES SERVICE ===');
  }

  /**
 * Cambiar estado de un servicio (activar/desactivar)
 * @param serviceId - ID del servicio a cambiar estado
 */
  async changeServiceState(serviceId: number): Promise<ChangeServiceStateResult> {
    try {
      console.log('🔄 Cambiando estado de servicio...', { serviceId });

      // Verificar autenticación
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Usuario no autenticado',
        };
      }

      // Verificar que sea profesional
      const isProfessional = await authService.isProfessional();
      if (!isProfessional) {
        return {
          success: false,
          error: 'Solo los profesionales pueden cambiar el estado de servicios',
        };
      }

      // Obtener token
      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          error: 'Token de acceso no disponible',
        };
      }

      // Preparar request
      const requestBody: ReqCambiarEstadoServicio = {
        IdServicio: serviceId,
      };

      console.log('🔄 Request a API:', {
        endpoint: API_CONFIG.ENDPOINTS.CAMBIAR_ESTADO_SERVICIO,
        body: requestBody,
        hasToken: !!token,
      });

      // Realizar llamada a la API usando el método post
      const response = await apiService.post<ResCambiarEstadoServicio>(
        API_CONFIG.ENDPOINTS.CAMBIAR_ESTADO_SERVICIO,
        requestBody,
        token
      );

      console.log('🔄 Response de API:', {
        success: response.success,
        status: response.status,
        hasData: !!response.data,
      });

      // Verificar errores de red
      if (!response.success && response.status === 0) {
        return {
          success: false,
          error: response.error || 'Error de conexión. Revisa tu internet e intenta nuevamente.',
          isNetworkError: true,
        };
      }

      // Verificar si hay datos
      if (!response.data) {
        return {
          success: false,
          error: 'No se recibieron datos del servidor',
        };
      }

      // Procesar response
      if (response.data.resultado) {
        // Éxito
        console.log('🔄 Estado de servicio cambiado exitosamente:', {
          serviceId,
          newState: response.data.EstadoServicio,
        });

        return {
          success: true,
          newState: response.data.EstadoServicio,
        };
      } else {
        // Error del servidor
        const errorMessage = this.processErrors(response.data.error);
        console.warn('🔄 Error del servidor:', errorMessage);

        return {
          success: false,
          error: errorMessage,
          errors: response.data.error,
        };
      }

    } catch (error: any) {
      //console.error('🔄 Error al cambiar estado de servicio:', error);

      // Determinar tipo de error
      if (error?.response?.status) {
        const statusCode = error.response.status;
        
        if (statusCode === 401) {
          return {
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          };
        }
        
        if (statusCode === 403) {
          return {
            success: false,
            error: 'No tienes permisos para cambiar el estado de este servicio.',
          };
        }
        
        if (statusCode === 404) {
          return {
            success: false,
            error: 'Servicio no encontrado.',
          };
        }
        
        if (statusCode >= 500) {
          return {
            success: false,
            error: 'Error interno del servidor. Intenta más tarde.',
            isNetworkError: true,
          };
        }
      }

      // Error de red o conexión
      if (error?.message?.includes('Network') || error?.code === 'NETWORK_ERROR') {
        return {
          success: false,
          error: 'Error de conexión. Revisa tu internet e intenta nuevamente.',
          isNetworkError: true,
        };
      }

      // Error genérico
      return {
        success: false,
        error: 'Error inesperado al cambiar estado del servicio. Intenta nuevamente.',
      };
    }
  }
  
}

// Exportar instancia única del servicio
export const servicesService = new ServicesService();