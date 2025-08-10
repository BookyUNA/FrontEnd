/**
 * Sistema tipográfico para Booky - LINEHEIGHT CORREGIDO
 * Solucionando el problema de texto aplastado
 */

export const typography = {
  // Familias de fuentes
  fontFamily: {
    primary: 'System',       
    secondary: 'System',     
  },

  // Tamaños de fuente optimizados
  fontSize: {
    xs: 16,      // Tamaño cómodo
    sm: 18,      // Tamaño cómodo
    base: 20,    // Base/normal - buen tamaño
    lg: 22,      // Grande
    xl: 24,      // Extra grande
    '2xl': 28,   // 2X grande
    '3xl': 34,   // 3X grande
    '4xl': 40,   // 4X grande
    '5xl': 48,   // 5X grande
  },

  // Pesos de fuente
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Alturas de línea CORREGIDAS - más espacio vertical
  lineHeight: {
    tight: 24,      // Altura fija en pixels
    normal: 28,     // Altura fija en pixels  
    relaxed: 32,    // Altura fija en pixels
    loose: 36,      // Altura fija en pixels
  },

  // Espaciado entre letras
  letterSpacing: {
    tight: -0.5,    
    normal: 0,        
    wide: 0.5,      
  },

  // Estilos predefinidos - LINEHEIGHT CORREGIDO
  styles: {
    h1: {
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 42,        // Altura fija en pixels
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 36,        // Altura fija en pixels
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,        // Altura fija en pixels
    },
    body: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 26,        // Altura fija en pixels - MÁS ESPACIO
    },
    bodySmall: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,        // Altura fija en pixels - MÁS ESPACIO
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,        // Altura fija en pixels - MÁS ESPACIO
    },
    button: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,        // Altura fija en pixels - MÁS ESPACIO
      letterSpacing: 0.5,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,        // Altura fija en pixels - MÁS ESPACIO
    },
  },
} as const;

// Tipo para acceso seguro a la tipografía
export type Typography = typeof typography;