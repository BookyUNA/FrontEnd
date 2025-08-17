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
    };

    let lastError: any;
    
    // Reintentos en caso de error de red
    for (let attempt = 1; attempt <= NETWORK_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        // Implementar timeout usando AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        console.log(`🌐 API Request [Intento ${attempt}]:`, {
          method: config.method || 'GET',
          url,
          headers: config.headers,
        });
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        // Limpiar el timeout si la petición se completa
        clearTimeout(timeoutId);
        
        console.log(`🌐 API Response:`, {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });
        
        // La respuesta se considera exitosa si el servidor responde
        // independientemente del código de estado
        const data = await response.json();
        
        console.log(`🌐 API Data:`, data);
        
        return {
          success: response.ok,
          data,
          status: response.status,
        };
      } catch (error: any) {
        lastError = error;
        
        console.error(`🌐 API Error [Intento ${attempt}]:`, error);
        
        // Verificar si es un error de timeout
        if (error.name === 'AbortError') {
          lastError = new Error('Timeout: La petición tardó demasiado tiempo');
        }
        
        // Si no es el último intento, esperar antes de reintentar
        if (attempt < NETWORK_CONFIG.RETRY_ATTEMPTS) {
          console.log(`🌐 Reintentando en ${NETWORK_CONFIG.RETRY_DELAY * attempt}ms...`);
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

    console.error('🌐 API Request Failed:', networkError);

    return {
      success: false,
      error: networkError.message,
      status: 0,
    };
  }

  /**
   * Método GET
   */
  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Método POST
   */
  async post<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método PUT
   */
  async put<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método DELETE
   */
  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
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