/**
 * Servicio de Almacenamiento Simple - Booky (ACTUALIZADO)
 * Almacenamiento en memoria (más fácil que AsyncStorage)
 * Ahora incluye almacenamiento del rol del usuario
 */

class SimpleStorageService {
  // Variables privadas para almacenar datos en memoria
  private authToken: string | null = null;
  private userRole: string | null = null;
  private userData: any = null;

  /**
   * Guardar token de autenticación
   */
  async saveAuthToken(token: string): Promise<void> {
    try {
      this.authToken = token;
      console.log('🔐 Token guardado en memoria');
    } catch (error) {
      console.log('🔐 Error al guardar token:', error);
      throw error;
    }
  }

  /**
   * Obtener token de autenticación
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return this.authToken;
    } catch (error) {
      console.log('🔐 Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Eliminar token de autenticación
   */
  async removeAuthToken(): Promise<void> {
    try {
      this.authToken = null;
      console.log('🔐 Token eliminado de memoria');
    } catch (error) {
      console.log('🔐 Error al eliminar token:', error);
      throw error;
    }
  }

  /**
   * Verificar si existe token
   */
  async hasAuthToken(): Promise<boolean> {
    try {
      return !!this.authToken;
    } catch (error) {
      console.log('🔐 Error al verificar token:', error);
      return false;
    }
  }

  /**
   * Guardar rol del usuario
   */
  async saveUserRole(role: string): Promise<void> {
    try {
      this.userRole = role;
      console.log('👤 Rol de usuario guardado en memoria:', role);
    } catch (error) {
      console.log('👤 Error al guardar rol:', error);
      throw error;
    }
  }

  /**
   * Obtener rol del usuario
   */
  async getUserRole(): Promise<string | null> {
    try {
      return this.userRole;
    } catch (error) {
      console.log('👤 Error al obtener rol:', error);
      return null;
    }
  }

  /**
   * Eliminar rol del usuario
   */
  async removeUserRole(): Promise<void> {
    try {
      this.userRole = null;
      console.log('👤 Rol eliminado de memoria');
    } catch (error) {
      console.log('👤 Error al eliminar rol:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  async hasRole(targetRole: string): Promise<boolean> {
    try {
      const currentRole = await this.getUserRole();
      return currentRole === targetRole;
    } catch (error) {
      console.log('👤 Error al verificar rol:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario es profesional
   */
  async isProfessional(): Promise<boolean> {
    try {
      return await this.hasRole('Profesional');
    } catch (error) {
      console.log('👤 Error al verificar si es profesional:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario es cliente
   */
  async isClient(): Promise<boolean> {
    try {
      return await this.hasRole('Cliente');
    } catch (error) {
      console.log('👤 Error al verificar si es cliente:', error);
      return false;
    }
  }

  /**
   * Guardar datos del usuario (opcional)
   */
  async saveUserData(userData: any): Promise<void> {
    try {
      this.userData = userData;
      console.log('👤 Datos de usuario guardados en memoria');
    } catch (error) {
      console.log('👤 Error al guardar datos de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener datos del usuario (opcional)
   */
  async getUserData(): Promise<any | null> {
    try {
      return this.userData;
    } catch (error) {
      console.log('👤 Error al obtener datos de usuario:', error);
      return null;
    }
  }

  /**
   * Limpiar todos los datos almacenados
   */
  async clearAll(): Promise<void> {
    try {
      this.authToken = null;
      this.userRole = null;
      this.userData = null;
      console.log('🧹 Todos los datos limpiados de memoria');
    } catch (error) {
      console.log('🧹 Error al limpiar datos:', error);
      throw error;
    }
  }

  /**
   * Función de debug para mostrar el estado actual del storage
   */
  async debugStorage(): Promise<void> {
    console.log('🔍 === DEBUG STORAGE ===');
    console.log('- Token existe:', !!this.authToken);
    console.log('- Token preview:', this.authToken ? this.authToken.substring(0, 20) + '...' : 'null');
    console.log('- Rol actual:', this.userRole);
    console.log('- Datos de usuario:', !!this.userData ? 'Existen' : 'No existen');
    console.log('🔍 === FIN DEBUG STORAGE ===');
  }
}

// Instancia singleton del servicio
export const storageService = new SimpleStorageService();