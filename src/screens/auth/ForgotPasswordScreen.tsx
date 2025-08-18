/**
 * Pantalla de Recuperación de Contraseña - Booky
 * Sistema de reservas para profesionales independientes
 * Solicita el email del usuario y envía un enlace de recuperación
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

interface ForgotPasswordFormData {
  email: string;
}

const initialFormValues: ForgotPasswordFormData = {
  email: '',
};

export const ForgotPasswordScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [generalError, setGeneralError] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  // Validación simple de email
  function validateForm(data: ForgotPasswordFormData) {
    const errors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.email) {
      errors.email = { errorMessage: 'El correo es obligatorio' };
    } else if (!emailRegex.test(data.email)) {
      errors.email = { errorMessage: 'Formato de correo inválido' };
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
  } = useForm<ForgotPasswordFormData>({
    initialValues: initialFormValues,
    validationSchema: validateForm,
    onSubmit: handlePasswordReset,
  });

  const handleFieldChange = (field: keyof ForgotPasswordFormData) => (value: string) => {
    if (showError) {
      setShowError(false);
      setGeneralError('');
    }
    if (errors[field]) {
      clearFieldError(field);
    }
    handleChange(field)(value);
  };

  async function handlePasswordReset(formData: ForgotPasswordFormData) {
    try {
      setGeneralError('');
      setShowError(false);

      const sanitizedData = sanitizeFormData(formData);

      if (!sanitizedData.email) {
        setGeneralError('Por favor, ingresa tu correo electrónico');
        setShowError(true);
        return;
      }

      const result = await authService.forgotPassword(sanitizedData.email);

      if (result.success) {
        setIsSuccess(true);
        setSentToEmail(sanitizedData.email);
      } else {
        setGeneralError(result.error || 'Error al procesar la solicitud');
        setShowError(true);
      }
    } catch (err) {
      console.error('Error en forgot password:', err);
      setGeneralError('Ha ocurrido un error inesperado. Intenta nuevamente.');
      setShowError(true);
    }
  }

  const navigateToResetPassword = () => {
    if (navigation?.navigate) {
      navigation.navigate('ResetPassword');
    }
  };

  const navigateToLogin = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else {
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
              {isSuccess ? '¡Solicitud enviada!' : 'Recuperar contraseña'}
            </Text>
            {!isSuccess && (
              <Text style={styles.subtitle}>
                Ingresa tu correo electrónico y te enviaremos las instrucciones
                para restablecer tu contraseña
              </Text>
            )}
          </View>

          <View style={styles.formContainer}>
            {!isSuccess ? (
              <View>
                <ErrorMessage message={generalError} visible={showError} />

                <Input
                  label="Correo electrónico"
                  value={values.email}
                  onChangeText={handleFieldChange('email')}
                  placeholder="ejemplo@correo.com"
                  error={errors.email?.errorMessage}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />

                <View style={styles.buttonContainer}>
                  <Button
                    title={isSubmitting ? 'Enviando...' : 'Recuperar Contraseña'}
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
                  Hemos enviado un correo con instrucciones a:
                </Text>
                <Text style={styles.emailHighlight}>{sentToEmail}</Text>

                <View style={styles.buttonContainer}>
                  <Button
                    title="Cambiar Contraseña"
                    onPress={navigateToResetPassword}
                    fullWidth
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={navigateToLogin} disabled={isSubmitting}>
              <Text style={styles.footerText}>← Volver al inicio de sesión</Text>
            </TouchableOpacity>
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
    marginBottom: spacing.sm 
  },
  emailHighlight: { 
    ...typography.styles.body, 
    color: colors.primary.main, 
    fontWeight: typography.fontWeight.semibold, 
    marginBottom: spacing.lg 
  },

  // Footer
  footer: { 
    alignItems: 'center', 
    paddingBottom: spacing['2xl'], 
    paddingTop: spacing.xl 
  },
  footerText: { 
    ...typography.styles.body, 
    color: colors.primary.main, 
    textDecorationLine: 'underline' 
  },
});
