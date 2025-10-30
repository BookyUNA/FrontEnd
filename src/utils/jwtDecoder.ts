/**
 * Utilidad para decodificar JWT - Booky
 * Decodifica tokens JWT para extraer información del payload
 * Actualizado con soporte para IdPlan
 */

// Interfaz para el payload del JWT
export interface JWTPayload {
  sub: string; // ID del usuario
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string; // Rol del usuario
  jti: string; // JWT ID
  iat: number; // Issued at
  exp: number; // Expiration time
  iss: string; // Issuer
  aud: string; // Audience
  IdPlan?: string; // ID del plan (solo para profesionales)
}

// Interfaz simplificada para los datos que nos interesan
export interface DecodedUserData {
  userId: string;
  role: string;
  planId?: number; // ID del plan (solo para profesionales)
  issuedAt: number;
  expiresAt: number;
  isExpired: boolean;
}

class JWTDecoder {
  /**
   * Decodifica un token JWT y extrae el payload
   * @param token - Token JWT completo
   * @returns Payload decodificado o null si hay error
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      if (!token || typeof token !== 'string') {
        console.log('🔍 Token inválido o vacío');
        return null;
      }

      // Dividir el JWT en sus partes (header.payload.signature)
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        console.log('🔍 Formato de JWT inválido - debe tener 3 partes');
        return null;
      }

      const payload = parts[1];
      
      // Decodificar la parte del payload desde base64url
      const decodedPayload = this.base64UrlDecode(payload);
      
      if (!decodedPayload) {
        console.log('🔍 Error al decodificar payload');
        return null;
      }

      // Parsear JSON
      const parsedPayload: JWTPayload = JSON.parse(decodedPayload);
      
      console.log('🔍 Token decodificado exitosamente:', {
        userId: parsedPayload.sub,
        role: parsedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        planId: parsedPayload.IdPlan,
        expiresAt: new Date(parsedPayload.exp * 1000).toISOString()
      });

      return parsedPayload;

    } catch (error) {
      console.log('🔍 Error al decodificar JWT:', error);
      return null;
    }
  }

  /**
   * Extrae datos específicos del usuario del token
   * @param token - Token JWT completo
   * @returns Datos del usuario o null si hay error
   */
  static extractUserData(token: string): DecodedUserData | null {
    try {
      const payload = this.decodeToken(token);
      
      if (!payload) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
      const userRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      const userData: DecodedUserData = {
        userId: payload.sub,
        role: userRole,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        isExpired: payload.exp < now
      };

      // Solo agregar planId si el usuario es profesional
      if (userRole === 'Profesional') {
        // Convertir IdPlan a número, usar 1 por defecto si no existe
        const planIdFromToken = payload.IdPlan;
        userData.planId = planIdFromToken ? parseInt(planIdFromToken, 10) : 1;
        
        console.log('🔍 Plan ID extraído para profesional:', userData.planId);
      }

      return userData;

    } catch (error) {
      console.log('🔍 Error al extraer datos del usuario:', error);
      return null;
    }
  }

  /**
   * Verifica si un token ha expirado
   * @param token - Token JWT completo
   * @returns true si ha expirado, false si aún es válido
   */
  static isTokenExpired(token: string): boolean {
    try {
      const userData = this.extractUserData(token);
      return userData ? userData.isExpired : true;
    } catch (error) {
      console.log('🔍 Error al verificar expiración:', error);
      return true;
    }
  }

  /**
   * Obtiene solo el rol del usuario del token
   * @param token - Token JWT completo
   * @returns Rol del usuario o null si hay error
   */
  static getUserRole(token: string): string | null {
    try {
      const userData = this.extractUserData(token);
      return userData ? userData.role : null;
    } catch (error) {
      console.log('🔍 Error al obtener rol:', error);
      return null;
    }
  }

  /**
   * Obtiene solo el ID del plan del token (solo para profesionales)
   * @param token - Token JWT completo
   * @returns ID del plan o null si hay error o no es profesional
   */
  static getUserPlanId(token: string): number | null {
    try {
      const userData = this.extractUserData(token);
      return userData && userData.planId ? userData.planId : null;
    } catch (error) {
      console.log('🔍 Error al obtener plan ID:', error);
      return null;
    }
  }

  /**
   * Decodifica una cadena base64url
   * @param str - Cadena en formato base64url
   * @returns Cadena decodificada o null si hay error
   */
  private static base64UrlDecode(str: string): string | null {
    try {
      // Convertir base64url a base64 estándar
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      
      // Agregar padding si es necesario
      const padding = base64.length % 4;
      if (padding) {
        base64 += '='.repeat(4 - padding);
      }

      // Decodificar usando atob (base64 decode)
      const decoded = atob(base64);
      
      return decoded;

    } catch (error) {
      console.log('🔍 Error en base64UrlDecode:', error);
      return null;
    }
  }

  /**
   * Función de debug para mostrar toda la información del token
   * @param token - Token JWT completo
   */
  static debugToken(token: string): void {
    console.log('🔍 === DEBUG TOKEN ===');
    console.log('Token completo:', token);
    
    const payload = this.decodeToken(token);
    if (payload) {
      console.log('Payload decodificado:');
      console.log('- User ID:', payload.sub);
      console.log('- Rol:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
      console.log('- Plan ID:', payload.IdPlan || 'No disponible');
      console.log('- JWT ID:', payload.jti);
      console.log('- Emitido en:', new Date(payload.iat * 1000).toISOString());
      console.log('- Expira en:', new Date(payload.exp * 1000).toISOString());
      console.log('- ¿Expirado?:', this.isTokenExpired(token));
    } else {
      console.log('Error al decodificar token');
    }
    console.log('🔍 === FIN DEBUG ===');
  }
}

export const jwtDecoder = JWTDecoder;