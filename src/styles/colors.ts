/**
 * Paleta de colores para Booky
 * Sistema de reservas para profesionales independientes
 */

export const colors = {
  // Color principal de la marca
  primary: {
    main: '#8676F3',      // hsl(248, 84%, 71%) - Color principal
    dark: '#6B5AE8',      // Versión más oscura
    light: '#A395F7',     // Versión más clara
    contrast: '#FFFFFF',   // Texto sobre el color principal
  },

  // Colores secundarios
  secondary: {
    main: '#64748B',      // Gris azulado profesional
    dark: '#475569',      // Gris más oscuro
    light: '#94A3B8',     // Gris más claro
    contrast: '#FFFFFF',
  },

  // Colores de fondo
  background: {
    primary: '#FFFFFF',    // Fondo principal (blanco)
    secondary: '#F8FAFC',  // Fondo secundario (gris muy claro)
    tertiary: '#F1F5F9',  // Fondo terciario
    disabled: '#E2E8F0',  // Fondo deshabilitado
  },

  // Colores de texto
  text: {
    primary: '#1E293B',    // Texto principal (negro suave)
    secondary: '#64748B',  // Texto secundario (gris)
    tertiary: '#94A3B8',   // Texto terciario (gris claro)
    disabled: '#CBD5E1',   // Texto deshabilitado
    inverse: '#FFFFFF',    // Texto sobre fondos oscuros
  },

  // Colores de bordes
  border: {
    light: '#E2E8F0',     // Borde claro
    medium: '#CBD5E1',     // Borde medio
    dark: '#94A3B8',      // Borde oscuro
    focus: '#8676F3',     // Borde en estado focus
  },

  // Estados de componentes
  states: {
    success: '#10B981',    // Verde para éxito
    warning: '#F59E0B',    // Amarillo para advertencias
    error: '#EF4444',      // Rojo para errores
    info: '#3B82F6',       // Azul para información
  },

  // Overlay y sombras
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.25)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },

  // Sombras específicas
  shadow: {
    primary: 'rgba(134, 118, 243, 0.15)',  // Sombra del color principal
    neutral: 'rgba(0, 0, 0, 0.1)',         // Sombra neutra
  },
} as const;

// Tipo para acceso seguro a los colores
export type Colors = typeof colors;