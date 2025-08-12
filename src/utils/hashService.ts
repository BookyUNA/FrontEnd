/**
 * Servicio de Hash - Booky
 * Funciones para hashear datos sensibles
 */

import CryptoJS from 'crypto-js';

export class HashService {
  /**
   * Hashea una contraseña con SHA256
   * @param password - Contraseña en texto plano
   * @returns Hash SHA256 de la contraseña
   */
  static hashPassword(password: string): string {
    if (!password) {
      throw new Error('La contraseña no puede estar vacía');
    }

    try {
      // Generar hash SHA256
      const hash = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
      return hash;
    } catch (error) {
      console.error('Error al hashear contraseña:', error);
      throw new Error('Error al procesar la contraseña');
    }
  }

  /**
   * Valida que un hash sea válido (longitud y formato)
   * @param hash - Hash a validar
   * @returns true si es un hash SHA256 válido
   */
  static isValidSHA256Hash(hash: string): boolean {
    // Un hash SHA256 tiene exactamente 64 caracteres hexadecimales
    const sha256Regex = /^[a-f0-9]{64}$/i;
    return sha256Regex.test(hash);
  }

  /**
   * Genera un salt aleatorio para uso futuro si es necesario
   * @param length - Longitud del salt (default: 32)
   * @returns Salt aleatorio
   */
  static generateSalt(length: number = 32): string {
    const randomBytes = CryptoJS.lib.WordArray.random(length / 2);
    return randomBytes.toString(CryptoJS.enc.Hex);
  }
}

export const hashService = HashService;