/**
 * Pantalla de Login - Booky
 * Sistema de reservas para profesionales independientes
 * Actualizado con hash SHA256 para contraseñas y navegación
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
import { useForm } from '../../hooks/useForm';
import { validateLoginForm, sanitizeFormData } from '../../utils/validation';
import { LoginFormData, AuthScreenProps } from '../../types/auth';
import { authService } from '../../services/auth/authService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout, spacing } from '../../styles/spacing';

// Valores iniciales del formulario
const initialFormValues: LoginFormData = {
  email: '',
  password: '',
};

interface LoginScreenProps extends AuthScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  navigation, 
  onLoginSuccess 
}) => {
  // Estados adicionales para manejo de errores
  const [generalError, setGeneralError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  // Hook personalizado para manejo del formulario
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldError,
    clearFieldError,
  } = useForm<LoginFormData>({
    initialValues: initialFormValues,
    validationSchema: validateLoginForm,
    onSubmit: handleLogin,
  });

  // Función para limpiar errores cuando el usuario modifica los campos
  const handleFieldChange = (field: keyof LoginFormData) => (value: string) => {
    // Limpiar errores generales cuando el usuario empieza a escribir
    if (showError) {
      setShowError(false);
      setGeneralError('');
    }
    
    // Limpiar errores específicos del campo
    if (errors[field]) {
      clearFieldError(field);
    }
    
    // Actualizar el valor del campo
    handleChange(field)(value);
  };

  // Función para manejar el login con hash SHA256
  async function handleLogin(formData: LoginFormData) {
    try {
      // Limpiar errores previos
      setGeneralError('');
      setShowError(false);
      
      // Sanitizar datos del formulario
      const sanitizedData = sanitizeFormData(formData);
      
      // Validación adicional antes de enviar
      if (!sanitizedData.email || !sanitizedData.password) {
        setGeneralError('Por favor, completa todos los campos');
        setShowError(true);
        return;
      }

      console.log('Iniciando proceso de login para:', sanitizedData.email);
      
      // Llamada al servicio de autenticación (la contraseña se hashea internamente)
      const result = await authService.login(sanitizedData);
      
      if (result.success && result.token) {
        // Login exitoso
        console.log('Login exitoso, redirigiendo...');
        
        // Notificar al componente padre sobre el login exitoso
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // Fallback: mostrar alert si no hay callback
          Alert.alert(
            'Login Exitoso',
            'Bienvenido a Booky',
            [
              {
                text: 'Continuar',
                onPress: () => {
                  console.log('Login completado');
                },
              },
            ]
          );
        }
      } else {
        // Login fallido - mostrar error específico
        const errorMessage = result.error || 'Error de autenticación';
        
        console.log('Login fallido:', errorMessage);
        
        if (result.isNetworkError) {
          // Error de red - mostrar mensaje de conexión
          setGeneralError('No se pudo conectar al servidor. Verifica tu conexión a internet.');
        } else {
          // Error de credenciales u otros errores
          setGeneralError(errorMessage);
        }
        setShowError(true);
      }
    } catch (error) {
      console.error('Error inesperado en login:', error);
      setGeneralError('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.');
      setShowError(true);
    }
  }

  // Navegar a registro
  const navigateToRegister = () => {
    console.log('Navegando a registro...');
    // TODO: Implementar navegación cuando esté disponible
    if (navigation?.navigate) {
      navigation.navigate('Register');
    }
  };

  // Navegar a recuperar contraseña
  const navigateToForgotPassword = () => {
    console.log('Navegando a recuperar contraseña...');
    // TODO: Implementar navegación cuando esté disponible
    if (navigation?.navigate) {
      navigation.navigate('ForgotPassword');
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
              Inicia sesión en tu cuenta
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              {/* Mensaje de error general */}
              <ErrorMessage 
                message={generalError}
                visible={showError}
                style={styles.errorMessage}
              />

              {/* Campo Email */}
              <Input
                label="Correo electrónico"
                value={values.email}
                onChangeText={handleFieldChange('email')}
                placeholder="ejemplo@correo.com"
                error={errors.email?.errorMessage}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                required
              />

              {/* Campo Contraseña */}
              <Input
                label="Contraseña"
                value={values.password}
                onChangeText={handleFieldChange('password')}
                placeholder="Tu contraseña"
                error={errors.password?.errorMessage}
                secureTextEntry
                autoComplete="password"
                autoCapitalize="none"
                required
              />

              {/* Link para recuperar contraseña */}
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={navigateToForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              {/* Botón de Login */}
              <View style={styles.buttonContainer}>
                <Button
                  title={isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  variant="primary"
                />
              </View>
            </View>
          </View>

          {/* Footer con link a registro */}
          <View style={styles.footer}>
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                ¿No tienes cuenta?{' '}
              </Text>
              <TouchableOpacity
                onPress={navigateToRegister}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={styles.registerLink}>
                  Regístrate aquí
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
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['3xl'],
  },

  welcomeText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  securityText: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
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
  errorMessage: {
    marginBottom: spacing.md,
  },

  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: layout.form.buttonSpacing,
  },

  forgotPasswordText: {
    ...typography.styles.bodySmall,
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },

  buttonContainer: {
    marginTop: spacing.md,
  },

  // Footer
  footer: {
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.xl,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  registerText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },

  registerLink: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});