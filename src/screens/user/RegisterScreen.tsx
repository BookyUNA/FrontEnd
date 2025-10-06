/**
 * Pantalla de Registro - Booky (MEJORADA)
 * Sistema de reservas para profesionales independientes
 * MEJORADO: Validación en tiempo real y scroll automático a errores
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';

// Importaciones locales
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/forms/Input';
import { Button } from '../../components/forms/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Picker } from '../../components/forms/Picker';
import { useForm } from '../../hooks/useForm';
import { validateRegisterForm, sanitizeFormData, validators } from '../../utils/validation';
import { RegisterFormData, AuthScreenProps } from '../../types/auth';
import { userService } from '../../services/user';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout, spacing } from '../../styles/spacing';

// Valores iniciales del formulario
const initialFormValues: RegisterFormData = {
  nombreCompleto: '',
  cedula: '',
  email: '',
  telefono: '',
  rol: 'Cliente', // Valor por defecto
  password: '',
  confirmPassword: '',
};

// Opciones para el campo de rol
const roleOptions = [
  { label: 'Cliente', value: 'Cliente' },
  { label: 'Profesional', value: 'Profesional' },
];

interface RegisterScreenProps extends AuthScreenProps {
  onRegisterSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  navigation, 
  onRegisterSuccess 
}) => {
  // Referencias para el scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const errorViewRef = useRef<View>(null);
  
  // Estados adicionales para manejo de errores
  const [generalError, setGeneralError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);
  
  // Estados para validación en vivo
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({});

  // Hook personalizado para manejo del formulario
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearFieldError,
    setFieldError,
  } = useForm<RegisterFormData>({
    initialValues: initialFormValues,
    validationSchema: validateRegisterForm,
    onSubmit: handleRegister,
  });

  // Efecto para hacer scroll automático cuando aparece un error general
  useEffect(() => {
    if (showError && errorViewRef.current && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        });
      }, 100);
    }
  }, [showError]);

  // Función de validación en tiempo real
  const validateFieldLive = (field: keyof RegisterFormData, value: string) => {
    let validationResult;
    
    switch (field) {
      case 'nombreCompleto':
        validationResult = validators.nombreCompleto(value);
        break;
      case 'cedula':
        validationResult = validators.cedula(value);
        break;
      case 'email':
        validationResult = validators.email(value);
        break;
      case 'telefono':
        validationResult = validators.telefono(value);
        break;
      case 'password':
        validationResult = validators.password(value);
        break;
      case 'confirmPassword':
        validationResult = validators.confirmPassword(values.password, value);
        break;
      case 'rol':
        validationResult = validators.rol(value);
        break;
      default:
        validationResult = { isValid: true };
    }

    // Actualizar errores en vivo
    if (!validationResult.isValid && value.length > 0) {
      setLiveErrors(prev => ({
        ...prev,
        [field]: validationResult.errorMessage || ''
      }));
    } else {
      setLiveErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    return validationResult;
  };

  // Función para manejar cambios en los campos con validación en vivo
  const handleFieldChange = (field: keyof RegisterFormData) => (value: string) => {
    // Limpiar errores generales cuando el usuario empieza a escribir
    if (showError) {
      setShowError(false);
      setGeneralError('');
      setIsNetworkError(false);
    }
    
    // Limpiar errores específicos del campo del formulario
    if (errors[field]) {
      clearFieldError(field);
    }
    
    // Actualizar el valor del campo
    handleChange(field)(value);
    
    // Validación en tiempo real (solo si el campo no está vacío o es confirmPassword)
    if (value.length > 0 || field === 'confirmPassword') {
      validateFieldLive(field, value);
    } else {
      // Limpiar error en vivo si el campo está vacío
      setLiveErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validación especial para confirmPassword cuando cambia password
    if (field === 'password' && values.confirmPassword) {
      validateFieldLive('confirmPassword', values.confirmPassword);
    }
  };

  // Función para obtener el error a mostrar (prioriza errores del submit sobre errores en vivo)
  const getFieldError = (field: keyof RegisterFormData): string | undefined => {
    return errors[field]?.errorMessage || liveErrors[field];
  };

  // FUNCIÓN DE REGISTRO MEJORADA
  async function handleRegister(formData: RegisterFormData) {
    try {
      console.log('🔥 INICIANDO PROCESO DE REGISTRO...');
      
      // Limpiar errores previos
      setGeneralError('');
      setShowError(false);
      setIsNetworkError(false);
      
      // Sanitizar datos del formulario
      const sanitizedData = sanitizeFormData(formData);
      
      // Validación adicional antes de enviar
      const requiredFields: (keyof RegisterFormData)[] = ['nombreCompleto', 'cedula', 'email', 'telefono', 'password'];
      const missingFields = requiredFields.filter(field => !sanitizedData[field]);
      
      if (missingFields.length > 0) {
        const errorMsg = 'Por favor, completa todos los campos obligatorios';
        console.log('❌ Error de validación:', errorMsg);
        setGeneralError(errorMsg);
        setShowError(true);
        return;
      }

      // Validaciones específicas usando el servicio de usuario
      if (!userService.validateCedula(sanitizedData.cedula)) {
        const errorMsg = 'El formato de la cédula no es válido';
        console.log('❌ Error de validación de cédula:', errorMsg);
        setGeneralError(errorMsg);
        setShowError(true);
        return;
      }

      if (!userService.validatePhone(sanitizedData.telefono)) {
        const errorMsg = 'El formato del teléfono no es válido (debe ser un número costarricense)';
        console.log('❌ Error de validación de teléfono:', errorMsg);
        setGeneralError(errorMsg);
        setShowError(true);
        return;
      }

      console.log('✅ Validaciones locales pasadas, enviando al servidor...');
      
      // Preparar datos para el servicio (sin confirmPassword)
      const registerData = {
        nombreCompleto: sanitizedData.nombreCompleto,
        cedula: sanitizedData.cedula,
        email: sanitizedData.email,
        telefono: sanitizedData.telefono,
        rol: sanitizedData.rol,
        password: sanitizedData.password,
      };

      console.log('📤 Datos a enviar:', {
        ...registerData,
        password: '[OCULTA]'
      });

      // Llamar al servicio de registro
      console.log('🔄 Llamando a userService.registerUser...');
      const result = await userService.registerUser(registerData);
      
      console.log('📥 Resultado del registro:', result);
      
      // Verificar el resultado
      if (result.success) {
        console.log('🎉 REGISTRO EXITOSO - Redirigiendo a verificación de correo');
        
        // Mostrar mensaje de registro exitoso y redirigir
        Alert.alert(
          '¡Registro Exitoso! 🎉',
          'Tu cuenta ha sido creada exitosamente. Ahora debes verificar tu correo electrónico para completar el proceso.',
          [
            {
              text: 'Verificar Correo',
              style: 'default',
              onPress: () => {
                // Ejecutar callback de éxito si existe
                if (onRegisterSuccess) {
                  onRegisterSuccess();
                }
                
                // Navegar a la pantalla de verificación de correo
                if (navigation?.navigate) {
                  navigation.navigate('EmailVerification', {
                    email: sanitizedData.email,
                    fromRegister: true,
                  });
                } else {
                  console.warn('Navigation no disponible para EmailVerification');
                }
              },
            },
          ],
          { cancelable: false }
        );
        
      } else {
        // Manejo de errores de la API
        console.log('❌ REGISTRO FALLIDO - Mostrando error al usuario');
        console.log('Error recibido:', result.error);
        console.log('Es error de red:', result.isNetworkError);
        
        // Mostrar error específico del servidor o genérico
        const errorMessage = result.error || 'Error en el registro. Por favor, intenta nuevamente.';
        console.log('Mensaje de error para mostrar:', errorMessage);
        
        setGeneralError(errorMessage);
        setShowError(true);
        setIsNetworkError(result.isNetworkError || false);
      }
      
    } catch (error: any) {
      console.log('💥 ERROR INESPERADO en handleRegister:', error);
      const errorMessage = 'Ha ocurrido un error inesperado. Por favor, verifica tu conexión e intenta nuevamente.';
      setGeneralError(errorMessage);
      setShowError(true);
      setIsNetworkError(true);
    }
  }

  // Navegar de vuelta al login
  const navigateToLogin = () => {
    console.log('Navegando a login...');
    if (navigation?.navigate) {
      navigation.navigate('Login');
    } else {
      console.warn('Navigation no disponible para Login');
    }
  };

  // Función para reintentar cuando hay error de red
  const handleRetry = () => {
    console.log('🔄 Reintentando registro...');
    if (values.nombreCompleto && values.cedula && values.email && values.telefono && values.password) {
      handleSubmit();
    } else {
      setGeneralError('Por favor, completa todos los campos antes de reintentar');
      setShowError(true);
      setIsNetworkError(false);
    }
  };

  return (
    <SafeContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header con Logo */}
          <View style={styles.header}>
            <Logo size="large" showTagline />
            <Text style={styles.welcomeText}>
              Crea tu cuenta en Booky
            </Text>
            <Text style={styles.subtitleText}>
              Completa todos los campos para registrarte
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              {/* MEJORADO: Mensaje de error general con scroll automático */}
              {showError && (
                <View ref={errorViewRef} style={styles.errorContainer}>
                  <ErrorMessage 
                    message={generalError}
                    visible={showError}
                    style={styles.errorMessage}
                  />
                  {isNetworkError && (
                    <TouchableOpacity
                      onPress={handleRetry}
                      style={styles.retryButton}
                      activeOpacity={0.7}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.retryButtonText}>
                        📡 Reintentar conexión
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Campo Nombre Completo */}
              <Input
                label="Nombre Completo"
                value={values.nombreCompleto}
                onChangeText={handleFieldChange('nombreCompleto')}
                placeholder="Ingresa tu nombre completo"
                error={getFieldError('nombreCompleto')}
                autoComplete="name"
                autoCapitalize="words"
                required
              />

              {/* Campo Cédula con validación en vivo */}
              <Input
                label="Cédula"
                value={values.cedula}
                onChangeText={handleFieldChange('cedula')}
                placeholder="123456789 (9 dígitos)"
                error={getFieldError('cedula')}
                keyboardType="numeric"
                autoCapitalize="none"
                maxLength={9}
                required
                helperText="Debe tener exactamente 9 números"
              />

              {/* Campo Email */}
              <Input
                label="Correo Electrónico"
                value={values.email}
                onChangeText={handleFieldChange('email')}
                placeholder="ejemplo@correo.com"
                error={getFieldError('email')}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                required
              />

              {/* Campo Teléfono con validación en vivo */}
              <Input
                label="Teléfono"
                value={values.telefono}
                onChangeText={handleFieldChange('telefono')}
                placeholder="88888888 (8 dígitos)"
                error={getFieldError('telefono')}
                keyboardType="phone-pad"
                autoComplete="tel"
                autoCapitalize="none"
                maxLength={8}
                required
                helperText="Número costarricense de 8 dígitos"
              />

              {/* Campo Rol */}
              <Picker
                label="Rol"
                value={values.rol}
                onValueChange={handleFieldChange('rol')}
                options={roleOptions}
                error={getFieldError('rol')}
                required
              />

              {/* Información sobre roles */}
              <View style={styles.roleInfoContainer}>
                {values.rol === 'Cliente' && (
                  <Text style={styles.roleInfoText}>
                    📱 Como Cliente: Podrás reservar citas con profesionales de manera fácil y rápida
                  </Text>
                )}
                {values.rol === 'Profesional' && (
                  <Text style={styles.roleInfoText}>
                    💼 Como Profesional: Tendrás tu propio sistema de reservas para gestionar tus citas y clientes
                  </Text>
                )}
                {!values.rol && (
                  <Text style={styles.roleInfoText}>
                    ℹ️ Selecciona tu rol para ver más información
                  </Text>
                )}
              </View>

              {/* Campo Contraseña con validación en vivo */}
              <Input
                label="Contraseña"
                value={values.password}
                onChangeText={handleFieldChange('password')}
                placeholder="Crea una contraseña segura"
                error={getFieldError('password')}
                secureTextEntry
                autoComplete="new-password"
                autoCapitalize="none"
                required
                helperText="Mín. 8 caracteres, mayúsculas, minúsculas y números"
              />

              {/* Campo Confirmar Contraseña con validación en vivo */}
              <Input
                label="Confirmar Contraseña"
                value={values.confirmPassword}
                onChangeText={handleFieldChange('confirmPassword')}
                placeholder="Confirma tu contraseña"
                error={getFieldError('confirmPassword')}
                secureTextEntry
                autoComplete="new-password"
                autoCapitalize="none"
                required
              />

              {/* Información adicional */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  • Los campos se validan en tiempo real mientras escribes
                </Text>
                <Text style={styles.infoText}>
                  • La cédula debe tener exactamente 9 números
                </Text>
                <Text style={styles.infoText}>
                  • Recibirás un código de verificación en tu correo
                </Text>
              </View>

              {/* Botón de Registro */}
              <View style={styles.buttonContainer}>
                <Button
                  title={isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  variant="primary"
                />
              </View>
            </View>
          </View>

          {/* Footer con link al login */}
          <View style={styles.footer}>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                ¿Ya tienes cuenta?{' '}
              </Text>
              <TouchableOpacity
                onPress={navigateToLogin}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={[
                  styles.loginLink,
                  isSubmitting && styles.disabledText
                ]}>
                  Inicia sesión aquí
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing['6xl'],
    paddingBottom: spacing['2xl'],
  },

  welcomeText: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  subtitleText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Formulario
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  form: {
    paddingHorizontal: spacing.sm,
  },

  // MEJORADO: Mensaje de error con mejor posicionamiento
  errorContainer: {
    marginBottom: spacing.md,
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.states.error,
    // Asegurar que esté en la parte superior
    marginTop: -spacing.md,
  },

  errorMessage: {
    marginBottom: spacing.sm,
  },

  retryButton: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },

  retryButtonText: {
    ...typography.styles.bodySmall,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },

  // Información adicional
  infoContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },

  infoText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },

  // Información sobre roles
  roleInfoContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },

  roleInfoText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'left',
  },

  // Estilo para elementos deshabilitados
  disabledText: {
    opacity: 0.5,
  },

  buttonContainer: {
    marginTop: spacing.md,
  },

  // Footer
  footer: {
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.xl,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },

  loginLink: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});