/**
 * Pantalla de Login - Booky
 * Sistema de reservas para profesionales independientes
 */

import React from 'react';
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
// IMPORTACIÓN DIRECTA (temporal)
import { useForm } from '../../hooks/useForm.ts'; // Nota: añadí .ts explícitamente
import { validateLoginForm, sanitizeFormData } from '../../utils/validation';
import { LoginFormData, AuthScreenProps } from '../../types/auth';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout, spacing } from '../../styles/spacing';

// Valores iniciales del formulario
const initialFormValues: LoginFormData = {
  email: '',
  password: '',
};

export const LoginScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  // Hook personalizado para manejo del formulario
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldError,
  } = useForm<LoginFormData>({
    initialValues: initialFormValues,
    validationSchema: validateLoginForm,
    onSubmit: handleLogin,
  });

  // Función para manejar el login
  async function handleLogin(formData: LoginFormData) {
    try {
      // Sanitizar datos del formulario
      const sanitizedData = sanitizeFormData(formData);
      
      // Aquí harías la llamada a tu API de autenticación
      console.log('Datos de login:', sanitizedData);
      
      // Simulación de llamada a API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulación de respuesta exitosa
      const mockSuccess = Math.random() > 0.3; // 70% de éxito
      
      if (mockSuccess) {
        Alert.alert(
          'Login Exitoso',
          'Bienvenido a Booky',
          [
            {
              text: 'Continuar',
              onPress: () => {
                // Aquí navegarías a la pantalla principal
                console.log('Navegando a pantalla principal...');
              },
            },
          ]
        );
      } else {
        // Simular error de credenciales
        setFieldError('email', 'Credenciales incorrectas');
        setFieldError('password', 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert(
        'Error',
        'Ha ocurrido un error. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  }

  // Navegar a registro
  const navigateToRegister = () => {
    // navigation.navigate('Register');
    console.log('Navegando a registro...');
  };

  // Navegar a recuperar contraseña
  const navigateToForgotPassword = () => {
    // navigation.navigate('ForgotPassword');
    console.log('Navegando a recuperar contraseña...');
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
              {/* Campo Email */}
              <Input
                label="Correo electrónico"
                value={values.email}
                onChangeText={handleChange('email')}
                placeholder="ejemplo@correo.com"
                error={errors.email?.errorMessage}
                keyboardType="email-address"
                autoComplete="email"
                required
              />

              {/* Campo Contraseña */}
              <Input
                label="Contraseña"
                value={values.password}
                onChangeText={handleChange('password')}
                placeholder="Tu contraseña"
                error={errors.password?.errorMessage}
                secureTextEntry
                autoComplete="password"
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
                  title="Iniciar Sesión"
                  onPress={handleSubmit}
                  loading={isSubmitting}
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

  // Formulario
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  form: {
    paddingHorizontal: spacing.sm,
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