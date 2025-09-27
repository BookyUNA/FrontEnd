/**
 * Interfaces para la funcionalidad de Solicitar Cita - Booky
 */

// Request para solicitar cita
export interface SolicitarCitaRequest {
  IdServicio: number;
  FechaCita: string; // ISO 8601 format
  MensajeSolicitud: string;
}

// Error en la respuesta
export interface ApiError {
  ErrorCode: number;
  Message: string;
}

// Response de solicitar cita
export interface SolicitarCitaResponse {
  IdCita: number;
  error: ApiError[];
  resultado: boolean;
}

// Interface para el formulario de reserva
export interface FormularioReserva {
  fecha: Date;
  hora: Date;
  observaciones: string;
}