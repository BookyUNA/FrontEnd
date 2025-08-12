/**
 * Servicio de API - Booky
 * Gestión centralizada de peticiones HTTP
 */

import { API_CONFIG, DEFAULT_HEADERS, NETWORK_CONFIG } from '../../config/api';
import { ApiResponse, NetworkError } from '../../types/api';

class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Método genérico para realizar peticiones HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
      // CORRECCIÓN: Remover timeout de RequestInit ya que no es estándar
      // El timeout se manejará con AbortController
    };

    let lastError: any;
    
    // Reintentos en caso de error de red
    for (let attempt = 1; attempt <= NETWORK_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        // CORRECCIÓN: Implementar timeout usando AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        // Limpiar el timeout si la petición se completa
        clearTimeout(timeoutId);
        
        // La respuesta se considera exitosa si el servidor responde
        // independientemente del código de estado
        const data = await response.json();
        
        return {
          success: response.ok,
          data,
          status: response.status,
        };
      } catch (error: any) {
        lastError = error;
        
        // Verificar si es un error de timeout
        if (error.name === 'AbortError') {
          lastError = new Error('Timeout: La petición tardó demasiado tiempo');
        }
        
        // Si no es el último intento, esperar antes de reintentar
        if (attempt < NETWORK_CONFIG.RETRY_ATTEMPTS) {
          await this.delay(NETWORK_CONFIG.RETRY_DELAY * attempt);
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    const networkError: NetworkError = {
      message: lastError?.message || 'Error de conexión. Verifica tu conexión a internet.',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    };

    return {
      success: false,
      error: networkError.message,
      status: 0,
    };
  }

  /**
   * Método GET
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Método POST
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método PUT
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método DELETE
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Utilidad para delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instancia singleton del servicio
export const apiService = new ApiService();