/**
 * Utilidades de validación para formularios - ACTUALIZADO con nuevos campos
 */

import { FormValidation, LoginFormData, RegisterFormData } from '../types/auth';

// Expresiones regulares para validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-\(\)]{8,}$/; // Ajustado para números de Costa Rica
const CEDULA_REGEX = /^\d{9}$/; // Cédula costarricense: 9 dígitos exactos

// Validaciones individuales
export const validators = {
  // Validar email
  email: (email: string): { isValid: boolean; errorMessage?: string } => {
    if (!email.trim()) {
      return { isValid: false, errorMessage: 'El email es requerido' };
    }
    if (!EMAIL_REGEX.test(email)) {
      return { isValid: false, errorMessage: 'El formato del email no es válido' };
    }
    return { isValid: true };
  },

  // Validar contraseña
  password: (password: string): { isValid: boolean; errorMessage?: string } => {
    if (!password) {
      return { isValid: false, errorMessage: 'La contraseña es requerida' };
    }
    if (password.length < 8) {
      return { isValid: false, errorMessage: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, errorMessage: 'La contraseña debe contener al menos una letra minúscula' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, errorMessage: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, errorMessage: 'La contraseña debe contener al menos un número' };
    }
    return { isValid: true };
  },

  // Validar confirmación de contraseña
  confirmPassword: (password: string, confirmPassword: string): { isValid: boolean; errorMessage?: string } => {
    if (!confirmPassword) {
      return { isValid: false, errorMessage: 'Confirma tu contraseña' };
    }
    if (password !== confirmPassword) {
      return { isValid: false, errorMessage: 'Las contraseñas no coinciden' };
    }
    return { isValid: true };
  },

  // Validar nombre completo
  nombreCompleto: (nombre: string): { isValid: boolean; errorMessage?: string } => {
    if (!nombre.trim()) {
      return { isValid: false, errorMessage: 'El nombre completo es requerido' };
    }
    if (nombre.trim().length < 5) {
      return { isValid: false, errorMessage: 'El nombre debe tener al menos 5 caracteres' };
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nombre.trim())) {
      return { isValid: false, errorMessage: 'El nombre solo puede contener letras y espacios' };
    }
    // Verificar que tenga al menos un nombre y un apellido
    const palabras = nombre.trim().split(/\s+/);
    if (palabras.length < 2) {
      return { isValid: false, errorMessage: 'Ingresa al menos nombre y apellido' };
    }
    return { isValid: true };
  },

  // Validar cédula costarricense - SIMPLIFICADO: solo 9 números exactos
  cedula: (cedula: string): { isValid: boolean; errorMessage?: string } => {
    if (!cedula.trim()) {
      return { isValid: false, errorMessage: 'La cédula es requerida' };
    }
    
    // Remover espacios y guiones
    const cleanCedula = cedula.replace(/[\s-]/g, '');
    
    // Verificar que sean exactamente 9 dígitos
    if (!CEDULA_REGEX.test(cleanCedula)) {
      return { isValid: false, errorMessage: 'La cédula debe tener exactamente 9 números' };
    }
    
    return { isValid: true };
  },

  // Validar teléfono
  telefono: (telefono: string): { isValid: boolean; errorMessage?: string } => {
    if (!telefono.trim()) {
      return { isValid: false, errorMessage: 'El teléfono es requerido' };
    }
    
    // Remover espacios, guiones y paréntesis para validación
    const cleanPhone = telefono.replace(/[\s\-\(\)]/g, '');
    
    if (!PHONE_REGEX.test(cleanPhone)) {
      return { isValid: false, errorMessage: 'El formato del teléfono no es válido' };
    }
    
    // Validar longitud para números costarricenses (8 dígitos sin código de país)
    if (cleanPhone.length === 8 && /^\d{8}$/.test(cleanPhone)) {
      return { isValid: true };
    }
    
    // O con código de país (+506)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('506')) {
      return { isValid: true };
    }
    
    return { isValid: false, errorMessage: 'Ingresa un número de teléfono válido de Costa Rica' };
  },

  // Validar rol
  rol: (rol: string): { isValid: boolean; errorMessage?: string } => {
    const rolesValidos = ['Cliente', 'Profesional']; // Admin removido
    
    if (!rol) {
      return { isValid: false, errorMessage: 'Selecciona un rol' };
    }
    
    if (!rolesValidos.includes(rol)) {
      return { isValid: false, errorMessage: 'Selecciona un rol válido' };
    }
    
    return { isValid: true };
  },
};

// Validación completa del formulario de login
export const validateLoginForm = (data: LoginFormData): FormValidation => {
  const validation: FormValidation = {};

  // Validar email
  const emailValidation = validators.email(data.email);
  validation.email = emailValidation;

  // Validar contraseña (solo si no está vacía, para login)
  if (!data.password) {
    validation.password = { isValid: false, errorMessage: 'La contraseña es requerida' };
  } else {
    validation.password = { isValid: true };
  }

  return validation;
};

// Validación completa del formulario de registro - ACTUALIZADA
export const validateRegisterForm = (data: RegisterFormData): FormValidation => {
  const validation: FormValidation = {};

  // Validar nombre completo
  validation.nombreCompleto = validators.nombreCompleto(data.nombreCompleto);

  // Validar cédula
  validation.cedula = validators.cedula(data.cedula);

  // Validar email
  validation.email = validators.email(data.email);

  // Validar teléfono
  validation.telefono = validators.telefono(data.telefono);

  // Validar rol
  validation.rol = validators.rol(data.rol);

  // Validar contraseña
  validation.password = validators.password(data.password);

  // Validar confirmación de contraseña
  validation.confirmPassword = validators.confirmPassword(data.password, data.confirmPassword);

  return validation;
};

// Verificar si el formulario es válido
export const isFormValid = (validation: FormValidation): boolean => {
  return Object.values(validation).every(field => field.isValid);
};

// Obtener el primer error del formulario
export const getFirstError = (validation: FormValidation): string | null => {
  const firstInvalidField = Object.values(validation).find(field => !field.isValid);
  return firstInvalidField?.errorMessage || null;
};

// Limpiar espacios en blanco de los campos
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitized[key].trim();
    }
  });
  return sanitized;
};