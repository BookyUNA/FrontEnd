/**
 * Tipos TypeScript para el sistema de autenticación - Actualizado con nuevos campos
 */

// Datos del formulario de login
export interface LoginFormData {
  email: string;
  password: string;
}

// Datos del formulario de registro - ACTUALIZADO con todos los campos requeridos
export interface RegisterFormData {
  nombreCompleto: string;
  cedula: string;
  email: string;
  telefono: string;
  rol: string;
  password: string;
  confirmPassword: string;
}

// Estado de validación de un campo
export interface FieldValidation {
  isValid: boolean;
  errorMessage?: string;
}

// Estado de validación del formulario completo
export interface FormValidation {
  [key: string]: FieldValidation;
}

// Datos del usuario autenticado - ACTUALIZADO
export interface User {
  id: string;
  nombreCompleto: string;
  cedula: string;
  email: string;
  telefono: string;
  rol: 'Cliente' | 'Profesional' | 'Admin';
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Respuesta de autenticación del servidor
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
  isNetworkError?: boolean;
}

// Estados de la autenticación
export type AuthState = 'idle' | 'loading' | 'authenticated' | 'error';

// Props para componentes de autenticación
export interface AuthScreenProps {
  navigation: any; // Tipo específico dependería del navegador usado
}

// Tipos específicos de autoComplete para React Native
export type AutoCompleteType = 
  | 'email' 
  | 'password' 
  | 'username' 
  | 'name' 
  | 'tel' 
  | 'new-password'
  | 'off' 
  | undefined;

// Props para el componente Input - ACTUALIZADO con maxLength
export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string; // NUEVO: Texto de ayuda
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: AutoCompleteType;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
}

// Props para el componente Button
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

// Props para el hook useForm
export interface UseFormProps<T> {
  initialValues: T;
  validationSchema?: (values: T) => FormValidation;
  onSubmit: (values: T) => void | Promise<void>;
}

// Return del hook useForm
export interface UseFormReturn<T> {
  values: T;
  errors: FormValidation;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (value: string) => void;
  handleSubmit: () => void;
  resetForm: () => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
}