/**
 * Pantalla de Reseteo de Contraseña - Booky
 * Sistema de reservas para profesionales independientes
 * Permite al usuario ingresar un código y nueva contraseña
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
import { sanitizeFormData } from '../../utils/validation';
import { AuthScreenProps } from '../../types/auth';
import { authService } from '../../services/auth/authService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ResetPasswordFormData {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

const initialFormValues: ResetPasswordFormData = {
  code: '',
  newPassword: '',
  confirmPassword: '',
};

export const ResetPasswordScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [generalError, setGeneralError] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validación del formulario
  function validateForm(data: ResetPasswordFormData) {
    const errors: any = {};

    if (!data.code) {
      errors.code = { errorMessage: 'El código de verificación es obligatorio' };
    } else if (data.code.length !== 6) {
      errors.code = { errorMessage: 'El código debe tener 6 dígitos' };
    } else if (!/^\d{6}$/.test(data.code)) {
      errors.code = { errorMessage: 'El código solo debe contener números' };
    }

    if (!data.newPassword) {
      errors.newPassword = { errorMessage: 'La nueva contraseña es obligatoria' };
    } else if (data.newPassword.length < 8) {
      errors.newPassword = { errorMessage: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = { errorMessage: 'Confirma tu nueva contraseña' };
    } else if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = { errorMessage: 'Las contraseñas no coinciden' };
    }

    return errors;
  }

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearFieldError,
  } = useForm<ResetPasswordFormData>({
    initialValues: initialFormValues,
    validationSchema: validateForm,
    onSubmit: handlePasswordReset,
  });

  const handleFieldChange = (field: keyof ResetPasswordFormData) => (value: string) => {
    if (showError) {
      setShowError(false);
      setGeneralError('');
    }
    if (errors[field]) {
      clearFieldError(field);
    }
    handleChange(field)(value);
  };

  async function handlePasswordReset(formData: ResetPasswordFormData) {
    try {
      setGeneralError('');
      setShowError(false);

      const sanitizedData = sanitizeFormData(formData);

      // Validación adicional antes de enviar
      if (!sanitizedData.code || !sanitizedData.newPassword || !sanitizedData.confirmPassword) {
        setGeneralError('Por favor, completa todos los campos');
        setShowError(true);
        return;
      }

      if (sanitizedData.newPassword !== sanitizedData.confirmPassword) {
        setGeneralError('Las contraseñas no coinciden');
        setShowError(true);
        return;
      }

      console.log('Iniciando proceso de reseteo de contraseña...');

      // Llamar al servicio de reseteo de contraseña
      const result = await authService.resetPassword(
        sanitizedData.code,
        sanitizedData.newPassword,
        sanitizedData.confirmPassword
      );

      if (result.success) {
        console.log('Contraseña reseteada exitosamente');
        setIsSuccess(true);
      } else {
        console.log('Error al resetear contraseña:', result.error);
        
        if (result.isNetworkError) {
          setGeneralError('No se pudo conectar al servidor. Verifica tu conexión a internet.');
        } else {
          setGeneralError(result.error || 'Error al procesar la solicitud');
        }
        setShowError(true);
      }
    } catch (err) {
      console.error('Error inesperado en reset password:', err);
      setGeneralError('Ha ocurrido un error inesperado. Intenta nuevamente.');
      setShowError(true);
    }
  }

  const navigateToLogin = () => {
    console.log('Navegando al login...');
    if (navigation?.navigate) {
      navigation.navigate('Login');
    } else {
      console.warn('Navigation no disponible para Login');
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
          {/* Header */}
          <View style={styles.header}>
            <Logo size="large" showTagline />
            <Text style={styles.title}>
              {isSuccess ? 'Contraseña actualizada' : 'Nueva contraseña'}
            </Text>
            {!isSuccess && (
              <Text style={styles.subtitle}>
                Ingresa el código que recibiste por correo y tu nueva contraseña
              </Text>
            )}
          </View>

          <View style={styles.formContainer}>
            {!isSuccess ? (
              <View style={styles.form}>
                <ErrorMessage 
                  message={generalError} 
                  visible={showError}
                  style={styles.errorMessage}
                />

                <Input
                  label="Código de verificación"
                  value={values.code}
                  onChangeText={handleFieldChange('code')}
                  placeholder="123456"
                  error={errors.code?.errorMessage}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  required
                />

                <Input
                  label="Nueva contraseña"
                  value={values.newPassword}
                  onChangeText={handleFieldChange('newPassword')}
                  placeholder="Mínimo 8 caracteres"
                  error={errors.newPassword?.errorMessage}
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  required
                />

                <Input
                  label="Confirmar contraseña"
                  value={values.confirmPassword}
                  onChangeText={handleFieldChange('confirmPassword')}
                  placeholder="Repite tu nueva contraseña"
                  error={errors.confirmPassword?.errorMessage}
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  required
                />

                <View style={styles.buttonContainer}>
                  <Button
                    title={isSubmitting ? 'Actualizando...' : 'Cambiar Contraseña'}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    fullWidth
                    variant="primary"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <View style={styles.checkmark} />
                </View>
                <Text style={styles.successMessage}>
                  Tu contraseña ha sido actualizada exitosamente
                </Text>

                <View style={styles.buttonContainer}>
                  <Button
                    title="Iniciar Sesión"
                    onPress={navigateToLogin}
                    fullWidth
                    variant="primary"
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {!isSuccess && (
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={navigateToLogin}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={[
                  styles.backToLoginText,
                  isSubmitting && styles.disabledText
                ]}>
                  ¿Recordaste tu contraseña? Inicia sesión
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'space-between' },

  // Header
  header: { 
    alignItems: 'center', 
    paddingTop: spacing['8xl'], 
    paddingBottom: spacing['3xl'] 
  },
  title: { 
    ...typography.styles.h2, 
    color: colors.text.primary, 
    marginTop: spacing.lg, 
    textAlign: 'center',
  },
  subtitle: { 
    ...typography.styles.body, 
    color: colors.text.secondary, 
    textAlign: 'center', 
    marginTop: spacing.md 
  },

  // Formulario
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    paddingHorizontal: spacing.lg,
  },
  errorMessage: {
    marginBottom: spacing.md,
  },
  buttonContainer: { 
    marginTop: spacing.lg 
  },

  // Éxito
  successContainer: { 
    alignItems: 'center', 
    padding: spacing.lg 
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkmark: {
    width: 24,
    height: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.background.primary,
    transform: [{ rotate: '-45deg' }],
    marginTop: -4,
  },
  successMessage: { 
    ...typography.styles.body, 
    color: colors.text.secondary, 
    textAlign: 'center', 
    marginBottom: spacing.xl 
  },

  // Footer
  footer: { 
    alignItems: 'center', 
    paddingBottom: spacing['2xl'], 
    paddingTop: spacing.xl 
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    ...typography.styles.bodySmall,
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default ResetPasswordScreen;