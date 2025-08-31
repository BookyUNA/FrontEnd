/**
 * Pantalla de Verificación de Correo Electrónico - Booky
 * Sistema de reservas para profesionales independientes
 * Solicita al usuario ingresar el código enviado por correo
 *  */

import React, { useState, useEffect } from 'react';
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
import { sanitizeFormData } from '../../utils/validation';
import { AuthScreenProps } from '../../types/auth';
import { userService } from '../../services/user/userService'; // ✅ ACTUALIZADO: Usando userService integrado
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface EmailVerificationFormData {
  code: string;
}

const initialFormValues: EmailVerificationFormData = {
  code: '',
};

interface EmailVerificationScreenProps extends AuthScreenProps {
  route?: {
    params?: {
      email?: string;
      fromRegister?: boolean;
    };
  };
  onVerificationSuccess?: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ 
  navigation, 
  route,
  onVerificationSuccess 
}) => {
  const [generalError, setGeneralError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  // Obtener email de los parámetros de navegación
  const userEmail = route?.params?.email || '';
  const fromRegister = route?.params?.fromRegister || false;

  // Validación del formulario
  function validateForm(data: EmailVerificationFormData) {
    const errors: any = {};

    if (!data.code) {
      errors.code = { errorMessage: 'El código de verificación es obligatorio' };
    } else if (data.code.length !== 6) {
      errors.code = { errorMessage: 'El código debe tener exactamente 6 números' };
    } else if (!/^\d{6}$/.test(data.code)) {
      errors.code = { errorMessage: 'El código solo puede contener números' };
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
    resetForm,
  } = useForm<EmailVerificationFormData>({
    initialValues: initialFormValues,
    validationSchema: validateForm,
    onSubmit: handleVerification,
  });

  // Función para limpiar errores cuando el usuario modifica los campos
  const handleFieldChange = (field: keyof EmailVerificationFormData) => (value: string) => {
    if (showError) {
      setShowError(false);
      setGeneralError('');
    }
    
    if (errors[field]) {
      clearFieldError(field);
    }
    
    handleChange(field)(value);
  };

  // Usa el servicio real de verificación
  async function handleVerification(formData: EmailVerificationFormData) {
    try {
      setGeneralError('');
      setShowError(false);
      
      const sanitizedData = sanitizeFormData(formData);
      
      if (!sanitizedData.code) {
        setGeneralError('Por favor, ingresa el código de verificación');
        setShowError(true);
        return;
      }

      if (!userEmail) {
        setGeneralError('Error: No se encontró el correo electrónico');
        setShowError(true);
        return;
      }

      console.log('📧 Iniciando verificación real:', {
        email: userEmail,
        code: sanitizedData.code,
        fromRegister
      });

      // Llamada al servicio de verificación integrado
      const result = await userService.verifyEmailCode(userEmail, sanitizedData.code);

      console.log('📧 Resultado de verificación:', result);

      if (result.success) {
        console.log('📧 ✅ Verificación exitosa');
        
        // Mostrar mensaje de éxito
        Alert.alert(
          '¡Correo Verificado! 🎉',
          fromRegister 
            ? 'Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.'
            : 'Tu correo electrónico ha sido verificado correctamente.',
          [
            {
              text: fromRegister ? 'Iniciar Sesión' : 'Continuar',
              style: 'default',
              onPress: () => {
                // Ejecutar callback de éxito si existe
                if (onVerificationSuccess) {
                  onVerificationSuccess();
                }
                
                // Navegar según el contexto
                if (navigation?.navigate) {
                  if (fromRegister) {
                    // Si viene del registro, ir al login con email pre-llenado
                    navigation.navigate('Login', {
                      email: userEmail,
                      verified: true
                    });
                  } else {
                    // Si viene de otro flujo, navegar apropiadamente
                    navigation.goBack();
                  }
                }
              },
            },
          ],
          { cancelable: false }
        );
        
      } else {
        console.error('📧 ❌ Error en verificación:', result.error);
        
        // Mostrar error específico del servidor o genérico
        const errorMessage = result.error || 'Código de verificación incorrecto. Intenta nuevamente.';
        setGeneralError(errorMessage);
        setShowError(true);
        
        // Limpiar el campo del código para reintento
        resetForm();
      }
      
    } catch (error) {
      console.error('📧 Error inesperado en verificación:', error);
      setGeneralError('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.');
      setShowError(true);
    }
  }

  // Usa el servicio real de reenvío
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setGeneralError('');
      setShowError(false);

      console.log('📧 Reenviando código real a:', userEmail);

      if (!userEmail) {
        setGeneralError('Error: No se encontró el correo electrónico');
        setShowError(true);
        return;
      }

      // ✅ IMPLEMENTACIÓN REAL: Llamada al servicio de reenvío integrado
      const result = await userService.resendEmailVerificationCode(userEmail);
      
      console.log('📧 Resultado de reenvío:', result);

      if (result.success) {
        Alert.alert(
          'Código Reenviado 📧',
          `Se ha enviado un nuevo código de verificación a ${userService.formatEmailForDisplay(userEmail)}`,
          [{ text: 'Entendido' }]
        );

        // Iniciar cooldown de 60 segundos
        setResendCooldown(60);
      } else {
        console.error('📧 ❌ Error en reenvío:', result.error);
        const errorMessage = result.error || 'No se pudo reenviar el código. Intenta nuevamente.';
        setGeneralError(errorMessage);
        setShowError(true);
      }
      
    } catch (error) {
      console.error('📧 Error inesperado en reenvío:', error);
      setGeneralError('No se pudo reenviar el código. Intenta nuevamente.');
      setShowError(true);
    } finally {
      setIsResending(false);
    }
  };

  // Navegar de vuelta al login
  const navigateToLogin = () => {
    console.log('Navegando a login...');
    if (navigation?.navigate) {
      navigation.navigate('Login', {
        email: userEmail
      });
    } else {
      console.warn('Navigation no disponible para Login');
    }
  };

  // Efecto para el cooldown del reenvío
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Función para formatear el email (usando el servicio integrado)
  const formatEmailForDisplay = (email: string) => {
    return userService.formatEmailForDisplay(email);
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
              Verifica tu correo
            </Text>
            <Text style={styles.subtitleText}>
              Hemos enviado un código de 6 dígitos a
            </Text>
            <Text style={styles.emailText}>
              {formatEmailForDisplay(userEmail)}
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
                </View>
              )}

              {/* Campo Código de Verificación */}
              <Input
                label="Código de verificación"
                value={values.code}
                onChangeText={handleFieldChange('code')}
                placeholder="123456"
                error={errors.code?.errorMessage}
                keyboardType="numeric"
                autoCapitalize="none"
                maxLength={6}
                required
              />

              {/* Información adicional */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  • Ingresa el código de 6 números que recibiste por correo
                </Text>
                <Text style={styles.infoText}>
                  • Revisa tu bandeja de entrada y spam
                </Text>
                <Text style={styles.infoText}>
                  • El código es válido por 15 minutos
                </Text>
              </View>

              {/* Botón de Verificar */}
              <View style={styles.buttonContainer}>
                <Button
                  title={isSubmitting ? 'Verificando...' : 'Verificar Código'}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || values.code.length !== 6}
                  fullWidth
                  variant="primary"
                />
              </View>

              {/* Botón de Reenviar Código */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  ¿No recibiste el código?{' '}
                </Text>
                <TouchableOpacity
                  onPress={handleResendCode}
                  activeOpacity={0.7}
                  disabled={resendCooldown > 0 || isResending || isSubmitting}
                  style={styles.resendButton}
                >
                  <Text style={[
                    styles.resendLink,
                    (resendCooldown > 0 || isResending || isSubmitting) && styles.disabledText
                  ]}>
                    {isResending 
                      ? 'Enviando...' 
                      : resendCooldown > 0 
                        ? `Reenviar en ${resendCooldown}s`
                        : 'Reenviar código'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer con link de vuelta al login */}
          <View style={styles.footer}>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                ¿Quieres usar otro correo?{' '}
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
                  Volver al inicio
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

  emailText: {
    ...typography.styles.body,
    color: colors.primary.main,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.semibold,
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

  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Reenvío de código
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },

  resendText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },

  resendButton: {
    paddingVertical: spacing.xs,
  },

  resendLink: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },

  // Estilo para elementos deshabilitados
  disabledText: {
    opacity: 0.5,
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
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
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