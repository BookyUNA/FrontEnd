/**
 * Sistema de espaciado para Booky
 * Configuración de márgenes, padding y dimensiones
 */

export const spacing = {
  // Espaciado base (múltiplos de 4px para consistencia)
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 12,     // 12px
  lg: 16,     // 16px
  xl: 20,     // 20px
  '2xl': 24,  // 24px
  '3xl': 32,  // 32px
  '4xl': 40,  // 40px
  '5xl': 48,  // 48px
  '6xl': 64,  // 64px
  '7xl': 80,  // 80px
  '8xl': 96,  // 96px
} as const;

// Configuraciones específicas para diferentes elementos
export const layout = {
  // Espaciado de contenedores
  container: {
    paddingHorizontal: spacing.lg,    // 16px lateral
    paddingVertical: spacing.xl,      // 20px vertical
  },

  // Espaciado de formularios
  form: {
    fieldSpacing: spacing.lg,         // 16px entre campos
    groupSpacing: spacing['2xl'],     // 24px entre grupos
    buttonSpacing: spacing['3xl'],    // 32px antes del botón
  },

  // Espaciado de tarjetas
  card: {
    padding: spacing.lg,              // 16px interno
    margin: spacing.sm,               // 8px externo
    borderRadius: spacing.sm,         // 8px radio
  },

  // Espaciado de botones
  button: {
    paddingVertical: spacing.md,      // 12px vertical
    paddingHorizontal: spacing.xl,    // 20px horizontal
    borderRadius: spacing.sm,         // 8px radio
  },

  // Espaciado de inputs
  input: {
    paddingVertical: spacing.lg,      // 16px vertical
    paddingHorizontal: spacing.lg,    // 16px horizontal
    borderRadius: spacing.sm,         // 8px radio
    marginBottom: spacing.xs,         // 4px debajo (para mensajes de error)
  },

  // Dimensiones comunes
  dimensions: {
    inputHeight: 48,                  // Altura estándar de inputs
    buttonHeight: 48,                 // Altura estándar de botones
    iconSize: 24,                     // Tamaño estándar de iconos
    logoHeight: 60,                   // Altura del logo
  },
} as const;

// Tipo para acceso seguro al espaciado
export type Spacing = typeof spacing;
export type Layout = typeof layout;