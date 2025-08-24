/**
 * Pantalla de Registro - Booky
 * Sistema de reservas para profesionales independientes
 * Formulario completo de registro con integración a la API real
 */

import React, { useState } from 'react';
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
import { validateRegisterForm, sanitizeFormData } from '../../utils/validation';
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
  // Estados adicionales para manejo de errores
  const [generalError, setGeneralError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);

  // Hook personalizado para manejo del formulario
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearFieldError,
  } = useForm<RegisterFormData>({
    initialValues: initialFormValues,
    validationSchema: validateRegisterForm,
    onSubmit: handleRegister,
  });

  // Función para limpiar errores cuando el usuario modifica los campos
  const handleFieldChange = (field: keyof RegisterFormData) => (value: string) => {
    // Limpiar errores generales cuando el usuario empieza a escribir
    if (showError) {
      setShowError(false);
      setGeneralError('');
      setIsNetworkError(false);
    }
    
    // Limpiar errores específicos del campo
    if (errors[field]) {
      clearFieldError(field);
    }
    
    // Actualizar el valor del campo
    handleChange(field)(value);
  };

  // Función para manejar el registro
  async function handleRegister(formData: RegisterFormData) {
    try {
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
        setGeneralError('Por favor, completa todos los campos obligatorios');
        setShowError(true);
        return;
      }

      // Validaciones específicas usando el servicio de usuario
      if (!userService.validateCedula(sanitizedData.cedula)) {
        setGeneralError('El formato de la cédula no es válido');
        setShowError(true);
        return;
      }

      if (!userService.validatePhone(sanitizedData.telefono)) {
        setGeneralError('El formato del teléfono no es válido (debe ser un número costarricense)');
        setShowError(true);
        return;
      }

      console.log('Iniciando proceso de registro:', {
        ...sanitizedData,
        password: '[OCULTA]', // No mostrar la contraseña en logs
        confirmPassword: '[OCULTA]'
      });
      
      // Preparar datos para el servicio (sin confirmPassword)
      const registerData = {
        nombreCompleto: sanitizedData.nombreCompleto,
        cedula: sanitizedData.cedula,
        email: sanitizedData.email,
        telefono: sanitizedData.telefono,
        rol: sanitizedData.rol,
        password: sanitizedData.password,
      };

      // Llamar al servicio de registro
      const result = await userService.registerUser(registerData);
      
      if (result.success) {
        console.log('Registro exitoso');
        
        // Mostrar mensaje de éxito
        Alert.alert(
          '¡Registro Exitoso! 🎉',
          'Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión con tu correo electrónico y contraseña.',
          [
            {
              text: 'Iniciar Sesión',
              style: 'default',
              onPress: () => {
                // Ejecutar callback de éxito si existe
                if (onRegisterSuccess) {
                  onRegisterSuccess();
                }
                
                // Navegar al login
                if (navigation?.navigate) {
                  navigation.navigate('Login', {
                    email: sanitizedData.email, // Pre-llenar el email en login
                  });
                }
              },
            },
          ],
          { cancelable: false }
        );
        
      } else {
        console.error('Error en registro:', result.error);
        
        // Mostrar error específico del servidor
        setGeneralError(result.error || 'Error en el registro. Por favor, intenta nuevamente.');
        setShowError(true);
        setIsNetworkError(result.isNetworkError || false);
        
        // Si hay errores específicos, mostrarlos en consola para debug
        if (result.errors && result.errors.length > 0) {
          console.error('Errores específicos:', result.errors);
        }
      }
      
    } catch (error) {
      console.error('Error inesperado en registro:', error);
      setGeneralError('Ha ocurrido un error inesperado. Por favor, verifica tu conexión e intenta nuevamente.');
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
              {/* Mensaje de error general */}
              {showError && (
                <View style={styles.errorContainer}>
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
                error={errors.nombreCompleto?.errorMessage}
                autoComplete="name"
                autoCapitalize="words"
                required
              />

              {/* Campo Cédula */}
              <Input
                label="Cédula"
                value={values.cedula}
                onChangeText={handleFieldChange('cedula')}
                placeholder="1-2345-6789"
                error={errors.cedula?.errorMessage}
                keyboardType="numeric"
                autoCapitalize="none"
                maxLength={11} // Para formato con guiones
                required
              />

              {/* Campo Email */}
              <Input
                label="Correo Electrónico"
                value={values.email}
                onChangeText={handleFieldChange('email')}
                placeholder="ejemplo@correo.com"
                error={errors.email?.errorMessage}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                required
              />

              {/* Campo Teléfono */}
              <Input
                label="Teléfono"
                value={values.telefono}
                onChangeText={handleFieldChange('telefono')}
                placeholder="8888-8888"
                error={errors.telefono?.errorMessage}
                keyboardType="phone-pad"
                autoComplete="tel"
                autoCapitalize="none"
                maxLength={9} // Para formato con guión
                required
              />

              {/* Campo Rol */}
              <Picker
                label="Rol"
                value={values.rol}
                onValueChange={handleFieldChange('rol')}
                options={roleOptions}
                error={errors.rol?.errorMessage}
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

              {/* Campo Contraseña */}
              <Input
                label="Contraseña"
                value={values.password}
                onChangeText={handleFieldChange('password')}
                placeholder="Crea una contraseña segura"
                error={errors.password?.errorMessage}
                secureTextEntry
                autoComplete="new-password"
                autoCapitalize="none"
                required
              />

              {/* Campo Confirmar Contraseña */}
              <Input
                label="Confirmar Contraseña"
                value={values.confirmPassword}
                onChangeText={handleFieldChange('confirmPassword')}
                placeholder="Confirma tu contraseña"
                error={errors.confirmPassword?.errorMessage}
                secureTextEntry
                autoComplete="new-password"
                autoCapitalize="none"
                required
              />

              {/* Información adicional */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  • La contraseña debe tener al menos 8 caracteres
                </Text>
                <Text style={styles.infoText}>
                  • Debe incluir mayúsculas, minúsculas y números
                </Text>
                <Text style={styles.infoText}>
                  • Los datos se validan según estándares costarricenses
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
    paddingTop: spacing['6xl'], // Un poco menos que login para dar más espacio al formulario
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

  // Mensaje de error
  errorContainer: {
    marginBottom: spacing.md,
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

  // Información adicional sobre contraseñas
  infoContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
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