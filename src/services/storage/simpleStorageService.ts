/**
 * Servicio de Almacenamiento Simple - Booky
 * Almacenamiento en memoria (más fácil que AsyncStorage)
 */

class SimpleStorageService {
  // Variables privadas para almacenar datos en memoria
  private authToken: string | null = null;
  private userData: any = null;

  /**
   * Guardar token de autenticación
   */
  async saveAuthToken(token: string): Promise<void> {
    try {
      this.authToken = token;
      console.log('Token guardado en memoria');
    } catch (error) {
      console.error('Error al guardar token:', error);
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
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Eliminar token de autenticación
   */
  async removeAuthToken(): Promise<void> {
    try {
      this.authToken = null;
      console.log('Token eliminado de memoria');
    } catch (error) {
      console.error('Error al eliminar token:', error);
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
      console.error('Error al verificar token:', error);
      return false;
    }
  }

  /**
   * Guardar datos del usuario (opcional)
   */
  async saveUserData(userData: any): Promise<void> {
    try {
      this.userData = userData;
      console.log('Datos de usuario guardados en memoria');
    } catch (error) {
      console.error('Error al guardar datos de usuario:', error);
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
      console.error('Error al obtener datos de usuario:', error);
      return null;
    }
  }

  /**
   * Limpiar todos los datos almacenados
   */
  async clearAll(): Promise<void> {
    try {
      this.authToken = null;
      this.userData = null;
      console.log('Todos los datos limpiados de memoria');
    } catch (error) {
      console.error('Error al limpiar datos:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const storageService = new SimpleStorageService();