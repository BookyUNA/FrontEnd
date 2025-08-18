/**
 * Pantalla de Reestablecimiento de Contraseña - Booky
 * Sistema de reservas para profesionales independientes
 * Permite al usuario solicitar un enlace de recuperación de contraseña
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
} from 'react-native';

// Importaciones locales
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/forms/Input';
import { Button } from '../../components/forms/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useForm } from '../../hooks/useForm';
import { validateLoginForm, sanitizeFormData } from '../../utils/validation';
import { AuthScreenProps } from '../../types/auth';
import { authService } from '../../services/auth/authService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout, spacing } from '../../styles/spacing';

// Interfaz para los datos del formulario
interface ForgotPasswordFormData {
  email: string;
}

// Valores iniciales del formulario
const initialFormValues: ForgotPasswordFormData = {
  email: '',
};

interface ForgotPasswordScreenProps extends AuthScreenProps {
  onPasswordResetSuccess?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ 
  navigation, 
  onPasswordResetSuccess 
}) => {
  // Estados para manejo de errores y éxito
  const [generalError, setGeneralError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [sentToEmail, setSentToEmail] = useState<string>('');

  // Hook personalizado para manejo del formulario
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearFieldError,
  } = useForm<ForgotPasswordFormData>({
    initialValues: initialFormValues,
    validationSchema: validateForgotPasswordForm,
    onSubmit: handlePasswordReset,
  });

  // Función de validación específica para este formulario
  function validateForgotPasswordForm(data: ForgotPasswordFormData) {
    // Crear un objeto temporal con los datos necesarios para reutilizar la validación existente
    const tempLoginData = {
      email: data.email,
      password: 'temp', // Valor temporal para que pase la validación de login
    };
    
    // Usar la validación existente pero solo retornar la validación del email
    const loginValidation = validateLoginForm(tempLoginData);
    
    return {
      email: loginValidation.email,
    };
  }

  // Función para limpiar errores cuando el usuario modifica los campos
  const handleFieldChange = (field: keyof ForgotPasswordFormData) => (value: string) => {
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

  // Función para manejar el envío de solicitud de recuperación
  async function handlePasswordReset(formData: ForgotPasswordFormData) {
    try {
      // Limpiar errores previos
      setGeneralError('');
      setShowError(false);
      
      // Sanitizar datos del formulario
      const sanitizedData = sanitizeFormData(formData);
      
      // Validación adicional antes de enviar
      if (!sanitizedData.email) {
        setGeneralError('Por favor, ingresa tu correo electrónico');
        setShowError(true);
        return;
      }

      console.log('Iniciando proceso de recuperación para:', sanitizedData.email);
      
      // Llamada al servicio de recuperación de contraseña
      const result = await authService.forgotPassword(sanitizedData.email);
      
      if (result.success) {
        // Solicitud exitosa
        console.log('Solicitud de recuperación enviada exitosamente');
        setSentToEmail(sanitizedData.email);
        setIsSuccess(true);
        
        // Notificar al componente padre si existe callback
        if (onPasswordResetSuccess) {
          onPasswordResetSuccess();
        }
      } else {
        // Error en la solicitud
        const errorMessage = result.error || 'Error al procesar la solicitud';
        
        console.log('Error en recuperación:', errorMessage);
        
        if (result.isNetworkError) {
          setGeneralError('No se pudo conectar al servidor. Verifica tu conexión a internet.');
        } else {
          setGeneralError(errorMessage);
        }
        setShowError(true);
      }
    } catch (error) {
      console.error('Error inesperado en recuperación:', error);
      setGeneralError('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.');
      setShowError(true);
    }
  }

  // Navegar a pantalla de cambio de contraseña
  const navigateToResetPassword = () => {
    console.log('Navegando a cambiar contraseña...');
    // TODO: Implementar navegación cuando esté disponible
    if (navigation?.navigate) {
      navigation.navigate('ResetPassword');
    }
  };

  // Navegar de vuelta al login
  const navigateToLogin = () => {
    console.log('Navegando al login...');
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  // Función para reiniciar el formulario (en caso de querer intentar con otro email)
  const resetForm = () => {
    setIsSuccess(false);
    setSentToEmail('');
    setGeneralError('');
    setShowError(false);
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
              {isSuccess 
                ? '¡Solicitud enviada!'
                : 'Recuperar contraseña'
              }
            </Text>
            {!isSuccess && (
              <Text style={styles.descriptionText}>
                Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña
              </Text>
            )}
          </View>

          {/* Contenido principal */}
          <View style={styles.formContainer}>
            {!isSuccess ? (
              // Formulario de solicitud
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

                {/* Botón de enviar solicitud */}
                <View style={styles.buttonContainer}>
                  <Button
                    title={isSubmitting ? 'Enviando solicitud...' : 'Recuperar Contraseña'}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    fullWidth
                    variant="primary"
                  />
                </View>
              </View>
            ) : (
              // Vista de éxito
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <Text style={styles.successIcon}>✓</Text>
                </View>
                
                <Text style={styles.successTitle}>
                  Correo enviado
                </Text>
                
                <Text style={styles.successMessage}>
                  Hemos enviado las instrucciones para restablecer tu contraseña a:
                </Text>
                
                <Text style={styles.emailHighlight}>
                  {sentToEmail}
                </Text>
                
                <Text style={styles.successNote}>
                  Revisa tu bandeja de entrada y carpeta de spam. Si no recibes el correo en unos minutos, verifica que la dirección sea correcta.
                </Text>

                {/* Botón para ir a cambiar contraseña */}
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cambiar Contraseña"
                    onPress={navigateToResetPassword}
                    fullWidth
                    variant="primary"
                  />
                </View>

                {/* Opción para intentar con otro email */}
                <TouchableOpacity
                  style={styles.tryAgainContainer}
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tryAgainText}>
                    ¿Usar otro correo electrónico?
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer con link de vuelta al login */}
          <View style={styles.footer}>
            <View style={styles.backToLoginContainer}>
              <TouchableOpacity
                onPress={navigateToLogin}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={styles.backToLoginText}>
                  ← Volver al inicio de sesión
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
    paddingTop: spacing['8xl'], // Mismo espaciado que Login
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },

  welcomeText: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  descriptionText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
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

  buttonContainer: {
    marginTop: spacing.xl,
  },

  // Vista de éxito
  successContainer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },

  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  successIcon: {
    fontSize: 36,
    color: colors.primary.main,
    fontWeight: 'bold',
  },

  successTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  successMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },

  emailHighlight: {
    ...typography.styles.body,
    color: colors.primary.main,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },

  successNote: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  tryAgainContainer: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },

  tryAgainText: {
    ...typography.styles.bodySmall,
    color: colors.primary.main,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },

  // Footer
  footer: {
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.xl,
  },

  backToLoginContainer: {
    alignItems: 'center',
  },

  backToLoginText: {
    ...typography.styles.body,
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
});