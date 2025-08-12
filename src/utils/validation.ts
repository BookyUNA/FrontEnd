/**
 * Utilidades de validación para formularios - CORREGIDO
 */

import { FormValidation, LoginFormData, RegisterFormData } from '../types/auth';

// Expresiones regulares para validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-\(\)]{10,}$/;

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

  // Validar nombre
  name: (name: string, fieldName: string = 'nombre'): { isValid: boolean; errorMessage?: string } => {
    if (!name.trim()) {
      return { isValid: false, errorMessage: `El ${fieldName} es requerido` };
    }
    if (name.trim().length < 2) {
      return { isValid: false, errorMessage: `El ${fieldName} debe tener al menos 2 caracteres` };
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
      return { isValid: false, errorMessage: `El ${fieldName} solo puede contener letras` };
    }
    return { isValid: true };
  },

  // Validar teléfono (opcional)
  phone: (phone: string): { isValid: boolean; errorMessage?: string } => {
    if (!phone) {
      return { isValid: true }; // Teléfono es opcional
    }
    if (!PHONE_REGEX.test(phone)) {
      return { isValid: false, errorMessage: 'El formato del teléfono no es válido' };
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

// Validación completa del formulario de registro
export const validateRegisterForm = (data: RegisterFormData): FormValidation => {
  const validation: FormValidation = {};

  // Validar email
  validation.email = validators.email(data.email);

  // Validar contraseña
  validation.password = validators.password(data.password);

  // Validar confirmación de contraseña
  validation.confirmPassword = validators.confirmPassword(data.password, data.confirmPassword);

  // Validar nombre
  validation.firstName = validators.name(data.firstName, 'nombre');

  // Validar apellido
  validation.lastName = validators.name(data.lastName, 'apellido');

  // Validar teléfono (opcional)
  validation.phone = validators.phone(data.phone || '');

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

// Limpiar espacios en blanco de los campos - CORREGIDO
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      // Crear un nuevo objeto en lugar de mutar directamente
      (sanitized as any)[key] = sanitized[key].trim();
    }
  });
  return sanitized;
};