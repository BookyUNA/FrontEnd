/**
 * Pantalla de Verificación de Correo Electrónico - Booky
 * Sistema de reservas para profesionales independientes
 * Funciona tanto con correo por parámetro como sin él
 */

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
import { userService } from '../../services/user/userService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface EmailVerificationFormData {
  email: string;
  code: string;
}

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

  // Obtener email de los parámetros de navegación (puede ser vacío)
  const emailFromParams = route?.params?.email || '';
  const fromRegister = route?.params?.fromRegister || false;
  
  // Determinar si hay email por parámetro
  const hasEmailParam = emailFromParams.trim().length > 0;

  // Valores iniciales del formulario
  const initialFormValues: EmailVerificationFormData = {
    email: emailFromParams,
    code: '',
  };

  // Validación del formulario
  function validateForm(data: EmailVerificationFormData) {
    const errors: any = {};

    // Validar email solo si no viene por parámetro
    if (!hasEmailParam) {
      if (!data.email) {
        errors.email = { errorMessage: 'El correo electrónico es obligatorio' };
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = { errorMessage: 'Ingresa un correo electrónico válido' };
      }
    }

    // Validar código siempre
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

  // Obtener el email a usar (del parámetro o del formulario)
  const getActiveEmail = (): string => {
    return hasEmailParam ? emailFromParams : values.email;
  };

  // Verificación de código
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

      const emailToUse = getActiveEmail();
      if (!emailToUse) {
        setGeneralError('Error: No se encontró el correo electrónico');
        setShowError(true);
        return;
      }

      console.log('📧 Iniciando verificación:', {
        email: emailToUse,
        code: sanitizedData.code,
        fromRegister,
        hasEmailParam
      });

      // Llamada al servicio de verificación
      const result = await userService.verifyEmailCode(emailToUse, sanitizedData.code);

      console.log('📧 Resultado de verificación:', result);

      if (result.success) {
        console.log('📧 Verificación exitosa');
        
        // Mostrar mensaje de éxito
        Alert.alert(
          'Correo Verificado',
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
                      email: emailToUse,
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
        console.log('📧 Error en verificación:', result.error);
        
        // Mostrar error específico del servidor o genérico
        const errorMessage = result.error || 'Código de verificación incorrecto. Intenta nuevamente.';
        setGeneralError(errorMessage);
        setShowError(true);
        
        // Limpiar solo el campo del código para reintento
        handleChange('code')('');
      }
      
    } catch (error) {
      console.log('📧 Error inesperado en verificación:', error);
      setGeneralError('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.');
      setShowError(true);
    }
  }

  // Reenvío de código
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;

    const emailToUse = getActiveEmail();
    
    // Validar que hay email válido
    if (!emailToUse || emailToUse.trim() === '') {
      setGeneralError('Ingresa tu correo electrónico antes de reenviar el código');
      setShowError(true);
      return;
    }

    // Validar formato del email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      setGeneralError('Ingresa un correo electrónico válido antes de reenviar el código');
      setShowError(true);
      return;
    }

    try {
      setIsResending(true);
      setGeneralError('');
      setShowError(false);

      console.log('📧 Reenviando código a:', emailToUse);

      // Llamada al servicio de reenvío
      const result = await userService.resendEmailVerificationCode(emailToUse);
      
      console.log('📧 Resultado de reenvío:', result);

      if (result.success) {
        Alert.alert(
          'Código Reenviado',
          `Se ha enviado un nuevo código de verificación a ${userService.formatEmailForDisplay(emailToUse)}`,
          [{ text: 'Entendido' }]
        );

        // Iniciar cooldown de 60 segundos
        setResendCooldown(60);
      } else {
        console.log('📧 Error en reenvío:', result.error);
        const errorMessage = result.error || 'No se pudo reenviar el código. Intenta nuevamente.';
        setGeneralError(errorMessage);
        setShowError(true);
      }
      
    } catch (error) {
      console.log('📧 Error inesperado en reenvío:', error);
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
        email: getActiveEmail()
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

  // Función para formatear el email
  const formatEmailForDisplay = (email: string) => {
    return userService.formatEmailForDisplay(email);
  };

  // Determinar si el botón de reenvío debe estar habilitado
  const isResendDisabled = resendCooldown > 0 || isResending || isSubmitting || !getActiveEmail() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getActiveEmail());

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
            
            {hasEmailParam ? (
              <>
                <Text style={styles.subtitleText}>
                  Hemos enviado un código de 6 dígitos a
                </Text>
                <Text style={styles.emailText}>
                  {formatEmailForDisplay(emailFromParams)}
                </Text>
              </>
            ) : (
              <Text style={styles.subtitleText}>
                Ingresa tu correo y el código de verificación que recibiste
              </Text>
            )}
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

              {/* Campo Email - Solo mostrar si no viene por parámetro */}
              {!hasEmailParam && (
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
                  disabled={isResendDisabled}
                  style={styles.resendButton}
                >
                  <Text style={[
                    styles.resendLink,
                    isResendDisabled && styles.disabledText
                  ]}>
                    {isResending 
                      ? 'Enviando...' 
                      : resendCooldown > 0 
                        ? `Reenviar en ${resendCooldown}s`
                        : 'Reenviar código'
                    }
                  </Text>
                </TouchableOpacity>
                
                {/* Texto adicional cuando no hay email por parámetro */}
                {!hasEmailParam && !getActiveEmail().trim() && (
                  <Text style={styles.emailRequiredText}>
                    Primero ingresa tu correo electrónico
                  </Text>
                )}
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

  emailRequiredText: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    width: '100%',
    fontStyle: 'italic',
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