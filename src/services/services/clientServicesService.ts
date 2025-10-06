/**
 * Servicio de Servicios para Clientes - Booky
 * Gestión de búsqueda de servicios para usuarios con rol Cliente
 */

import { apiService } from '../api/apiService';
import { authService } from '../auth/authService';
import { API_CONFIG } from '../../config/api';

// Tipos para servicios de clientes
export interface ServicioCliente {
  idServicio: number;
  nombreServicio: string;
  descripcion: string;
  duracionMinutos: number;
  precio: number;
  permiteDescuento: boolean;
  porcentajeDescuento: number;
  fechaCreacion: string;
  nombreProfesional: string;
  profesion: string;
}

export interface Error {
  ErrorCode: number;
  Message: string;
}

// Request para buscar servicios con filtros
export interface ReqBuscarServicios {
  nombreServicio?: string;
  nombreProfesional?: string;
  profesion?: string;
}

// Response de buscar servicios
export interface ResBuscarServicios {
  servicios: ServicioCliente[];
  error: Error[];
  resultado: boolean;
}

// Resultado procesado
export interface SearchServicesResult {
  success: boolean;
  servicios?: ServicioCliente[];
  error?: string;
  errors?: Error[];
  isNetworkError?: boolean;
}

class ClientServicesService {
  /**
   * Buscar servicios con filtros
   * @param filters - Filtros de búsqueda
   */
  async searchServices(filters: ReqBuscarServicios = {}): Promise<SearchServicesResult> {
    try {
      console.log('🔍 Buscando servicios para cliente...', { filters });

      // Verificar autenticación
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Usuario no autenticado',
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

      // Preparar request con filtros limpios
      const requestBody: ReqBuscarServicios = {};
      
      if (filters.nombreServicio && filters.nombreServicio.trim()) {
        requestBody.nombreServicio = filters.nombreServicio.trim();
      }
      
      if (filters.nombreProfesional && filters.nombreProfesional.trim()) {
        requestBody.nombreProfesional = filters.nombreProfesional.trim();
      }
      
      if (filters.profesion && filters.profesion.trim()) {
        requestBody.profesion = filters.profesion.trim();
      }

      console.log('🔍 Request a API:', {
        endpoint: API_CONFIG.ENDPOINTS.LISTAR_SERVICIOS_FILTROS,
        body: requestBody,
        hasToken: !!token,
      });

      // Realizar llamada a la API
      const response = await apiService.post<ResBuscarServicios>(
        API_CONFIG.ENDPOINTS.LISTAR_SERVICIOS_FILTROS,
        requestBody,
        token
      );

      console.log('🔍 Response de API:', {
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
        const servicios = response.data.servicios || [];
        
        console.log('🔍 Servicios encontrados:', {
          total: servicios.length,
          conDescuento: servicios.filter((s: ServicioCliente) => s.permiteDescuento).length,
        });

        return {
          success: true,
          servicios: servicios,
        };
      } else {
        // Error del servidor
        const errorMessage = this.processErrors(response.data.error);
        console.warn('🔍 Error del servidor:', errorMessage);

        return {
          success: false,
          error: errorMessage,
          errors: response.data.error,
        };
      }

    } catch (error: any) {
      console.log('🔍 Error al buscar servicios:', error);

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
            error: 'No tienes permisos para buscar servicios.',
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
   * Obtener todos los servicios disponibles
   */
  async getAllServices(): Promise<SearchServicesResult> {
    return this.searchServices({});
  }

  /**
   * Buscar servicios por nombre del servicio
   * @param nombre - Nombre del servicio a buscar
   */
  async searchByServiceName(nombre: string): Promise<SearchServicesResult> {
    return this.searchServices({ nombreServicio: nombre });
  }

  /**
   * Buscar servicios por nombre del profesional
   * @param nombre - Nombre del profesional a buscar
   */
  async searchByProfessionalName(nombre: string): Promise<SearchServicesResult> {
    return this.searchServices({ nombreProfesional: nombre });
  }

  /**
   * Buscar servicios por profesión
   * @param profesion - Profesión a buscar
   */
  async searchByProfession(profesion: string): Promise<SearchServicesResult> {
    return this.searchServices({ profesion: profesion });
  }

  /**
   * Verificar si el usuario puede buscar servicios
   */
  async canSearchServices(): Promise<boolean> {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      return isAuthenticated;
      
    } catch (error) {
      console.log('🔍 Error al verificar permisos de búsqueda:', error);
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

    const firstError = errors[0];
    
    // Mapear códigos de error comunes
    switch (firstError.ErrorCode) {
      case 401:
        return 'Sesión expirada. Inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'No se encontraron servicios.';
      case 500:
        return 'Error interno del servidor. Intenta más tarde.';
      default:
        return firstError.Message || 'Error del servidor';
    }
  }

  /**
   * Obtener estadísticas de los servicios encontrados
   */
  getServicesStats(servicios: ServicioCliente[]): {
    total: number;
    conDescuento: number;
    profesiones: string[];
    precioPromedio: number;
  } {
    if (!servicios || servicios.length === 0) {
      return {
        total: 0,
        conDescuento: 0,
        profesiones: [],
        precioPromedio: 0,
      };
    }

    const total = servicios.length;
    const conDescuento = servicios.filter(s => s.permiteDescuento).length;
    const profesiones = Array.from(new Set(servicios.map(s => s.profesion)));
    const precioPromedio = servicios.reduce((sum, s) => sum + s.precio, 0) / total;

    return {
      total,
      conDescuento,
      profesiones,
      precioPromedio: Math.round(precioPromedio * 100) / 100,
    };
  }

  /**
   * Función de debug para verificar el estado del servicio
   */
  async debugClientServicesService(): Promise<void> {
    console.log('🔍 === DEBUG CLIENT SERVICES SERVICE ===');
    
    const isAuth = await authService.isAuthenticated();
    const canSearch = await this.canSearchServices();
    const token = await authService.getToken();
    
    console.log('- ¿Autenticado?:', isAuth);
    console.log('- ¿Puede buscar servicios?:', canSearch);
    console.log('- ¿Tiene token?:', !!token);
    
    if (canSearch) {
      try {
        console.log('- Probando búsqueda de servicios...');
        const result = await this.getAllServices();
        console.log('- Resultado búsqueda:', {
          success: result.success,
          count: result.servicios?.length || 0,
          error: result.error,
        });
      } catch (error) {
        console.log('- Error al probar búsqueda:', error);
      }
    }
    
    console.log('🔍 === FIN DEBUG CLIENT SERVICES SERVICE ===');
  }
}

// Exportar instancia única del servicio
export const clientServicesService = new ClientServicesService();