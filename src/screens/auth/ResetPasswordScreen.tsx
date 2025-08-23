/**
 * Pantalla de Reseteo de Contraseña - Booky (PLANTILLA)
 * Sistema de reservas para profesionales independientes
 * Permite al usuario ingresar un código y nueva contraseña
 * 
 * NOTA: Esta es una plantilla sin funcionalidad real.
 * TODO: Implementar la lógica de reseteo cuando se desarrolle el backend
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
    } else if (data.code.length < 6) {
      errors.code = { errorMessage: 'El código debe tener al menos 6 caracteres' };
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

      // TODO: Implementar la lógica real de reseteo de contraseña
      // const result = await authService.resetPassword(
      //   sanitizedData.code,
      //   sanitizedData.newPassword
      // );

      // Por ahora simulamos éxito después de 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular éxito para propósitos de demo
      setIsSuccess(true);

      // TODO: Manejar errores reales del servicio
      // if (result.success) {
      //   setIsSuccess(true);
      // } else {
      //   setGeneralError(result.error || 'Error al procesar la solicitud');
      //   setShowError(true);
      // }
    } catch (err) {
      console.error('Error en reset password:', err);
      setGeneralError('Ha ocurrido un error inesperado. Intenta nuevamente.');
      setShowError(true);
    }
  }

  const navigateToLogin = () => {
    if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Logo size="large" showTagline />
            <Text style={styles.title}>
              {isSuccess ? '¡Contraseña actualizada!' : 'Nueva contraseña'}
            </Text>
            {!isSuccess && (
              <Text style={styles.subtitle}>
                Ingresa el código que recibiste por correo y tu nueva contraseña
                {'\n\n'}
                
              </Text>
            )}
          </View>

          <View style={styles.formContainer}>
            {!isSuccess ? (
              <View>
                <ErrorMessage message={generalError} visible={showError} />

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
                  />
                </View>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successMessage}>
                  Tu contraseña ha sido actualizada exitosamente
                </Text>

                <View style={styles.buttonContainer}>
                  <Button
                    title="Iniciar Sesión"
                    onPress={navigateToLogin}
                    fullWidth
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
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
  templateNote: {
    ...typography.styles.caption,
    color: colors.states.warning,
    fontStyle: 'italic',
  },

  // Formulario
  formContainer: { paddingHorizontal: spacing.lg },
  buttonContainer: { marginTop: spacing.lg },

  // Éxito
  successContainer: { alignItems: 'center', padding: spacing.lg },
  successIcon: { 
    ...typography.styles.h1, 
    color: colors.primary.main, 
    marginBottom: spacing.lg 
  },
  successMessage: { 
    ...typography.styles.body, 
    color: colors.text.secondary, 
    textAlign: 'center', 
    marginBottom: spacing.lg 
  },

  // Footer
  footer: { 
    alignItems: 'center', 
    paddingBottom: spacing['2xl'], 
    paddingTop: spacing.xl 
  },
});