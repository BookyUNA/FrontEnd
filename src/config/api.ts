/**
 * Configuración de la API - Booky
 */

// Base URL para todas las peticiones API
export const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:61288/api',
  ENDPOINTS: {
    LOGIN: '/Login',
    LOGOUT: '/cerrarsesion',
    REGISTER: '/Register',
    FORGOT_PASSWORD: '/generarNuevoCodigo',
  },
  TIMEOUT: 10000, // 10 segundos
} as const;

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

// Configuración de red
export const NETWORK_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
} as const;