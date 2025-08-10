/**
 * Tipos TypeScript para las respuestas de la API
 */

// Request de inicio de sesión
export interface ReqInicioSesion {
  email: string;
  password: string;
}

// Error en la respuesta de la API
export interface ApiError {
  ErrorCode: number;
  Message: string;
}

// Response de inicio de sesión
export interface ResInicioSesion {
  token: string | null;
  error: ApiError[];
  resultado: boolean;
}

// Tipos de error más comunes basados en los ejemplos
export enum ErrorCodes {
  REQUIRED_FIELDS = 1,
  INVALID_CREDENTIALS = 20003,
  NETWORK_ERROR = 999,
}

// Response genérica de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

// Error de red
export interface NetworkError {
  message: string;
  code: string;
  isNetworkError: boolean;
}