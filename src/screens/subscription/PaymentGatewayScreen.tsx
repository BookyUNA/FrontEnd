/**
 * Pantalla de Pasarela de Pago - Booky (ACTUALIZADA)
 * Sistema de reservas para profesionales independientes
 * Formulario de pago para planes de suscripción
 * Integrada con paymentService para procesamiento real de pagos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { paymentService, PaymentFormData, PlanType } from '../../services/professionals';
import { authService } from '../../services/auth/authService';

interface PaymentGatewayScreenProps {
  navigation?: any;
  onLogout?: () => void;
  route?: {
    params?: {
      plan?: {
        id: PlanType;
        name: string;
        price: string;
        priceInColones: number;
        color: string;
      };
    };
  };
}

export const PaymentGatewayScreen: React.FC<PaymentGatewayScreenProps> = ({ 
  navigation, 
  onLogout,
  route 
}) => {
  const selectedPlan = route?.params?.plan;

  // Estados del formulario
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Estados de control
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(true);

  useEffect(() => {
    loadUserData();
  }, []);

  // Cargar datos del usuario autenticado
  const loadUserData = async () => {
    try {
      setIsLoadingUserData(true);

      // Verificar autenticación
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        Alert.alert(
          'Error de Autenticación',
          'Debes estar autenticado para realizar un pago.',
          [
            {
              text: 'Ir a Login',
              onPress: () => navigation?.navigate('Login'),
            },
          ]
        );
        return;
      }

      // Obtener datos del usuario
      const userData = await authService.getUserData();
      if (userData) {
        // Prellenar algunos campos basados en el token
        setEmail(''); // Usar ID como base para email
        setName(''); // El usuario debe ingresar su nombre
        setPhone(''); // El usuario debe ingresar su teléfono
      }

    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos del usuario. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Formatear número de tarjeta
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  // Formatear fecha de expiración
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  // Formatear teléfono
  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    // Formato para Costa Rica: +506 XXXX-XXXX
    if (cleaned.length <= 8) {
      if (cleaned.length > 4) {
        return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
      }
      return cleaned;
    }
    return cleaned.substring(0, 8);
  };

  // Manejar cambios en los campos
  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleExpiryDateChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.substring(0, 4));
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
  };

  // Validar formulario
  const validateForm = (): { isValid: boolean; error?: string } => {
    // Validar número de tarjeta
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      return { isValid: false, error: 'Número de tarjeta inválido (13-19 dígitos)' };
    }

    // Validar titular
    if (!cardHolder || cardHolder.trim().length < 3) {
      return { isValid: false, error: 'Nombre del titular requerido (mínimo 3 caracteres)' };
    }

    // Validar fecha de expiración
    if (!expiryDate || expiryDate.length !== 5) {
      return { isValid: false, error: 'Fecha de expiración inválida (MM/YY)' };
    }

    // Validar que la fecha no esté expirada
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) {
      return { isValid: false, error: 'Mes de expiración inválido (01-12)' };
    }
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return { isValid: false, error: 'La tarjeta ha expirado' };
    }

    // Validar CVV
    if (!cvv || cvv.length < 3) {
      return { isValid: false, error: 'CVV inválido (3-4 dígitos)' };
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { isValid: false, error: 'Email inválido' };
    }

    // Validar nombre
    if (!name || name.trim().length < 3) {
      return { isValid: false, error: 'Nombre completo requerido (mínimo 3 caracteres)' };
    }

    // Validar teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone || cleanPhone.length < 8) {
      return { isValid: false, error: 'Teléfono inválido (8 dígitos)' };
    }

    return { isValid: true };
  };

  // Procesar pago
  const handleProcessPayment = async () => {
    // Validar formulario
    const validation = validateForm();
    if (!validation.isValid) {
      Alert.alert('Error de Validación', validation.error || 'Datos inválidos');
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Error', 'No se encontró información del plan seleccionado');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💳 Iniciando proceso de pago real...');

      // Preparar datos de pago
      const paymentData: PaymentFormData = {
        cardNumber: cardNumber,
        cardHolder: cardHolder.trim(),
        expiryDate: expiryDate,
        cvv: cvv,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: `+506${phone.replace(/\D/g, '')}`, // Formato internacional para Costa Rica
      };

      // Obtener información del plan
      const planInfo = paymentService.getPlanInfo(selectedPlan.id);
      
      // Actualizar precio real del plan
      const selectedPlanData = {
        ...planInfo,
        price: selectedPlan.priceInColones,
      };

      console.log('💳 Datos del pago:', {
        plan: selectedPlanData.name,
        price: selectedPlanData.price,
        email: paymentData.email,
        name: paymentData.name,
        phone: paymentData.phone,
      });

      // Procesar pago con el servicio
      const result = await paymentService.processPaymentAndAssignPlan(
        paymentData,
        selectedPlanData
      );

      console.log('💳 Resultado del pago:', result);

      if (result.success) {
        // Pago exitoso
        Alert.alert(
          '¡Pago Exitoso!',
          result.message,
          [
            {
              text: 'Continuar',
              onPress: () => {
                // Navegar de vuelta a la pantalla anterior
                navigation?.goBack();
                
                // Si el plan fue asignado, sugerir re-login
                if (result.planAssigned) {
                  setTimeout(() => {
                    Alert.alert(
                      'Plan Actualizado',
                      'Tu plan ha sido actualizado exitosamente. Debes cerrar sesión ahora para acceder a todas las funciones de tu nuevo plan.',
                      [
                        {
                          text: 'Cerrar Sesión',
                          onPress: () => {
                            if (onLogout) {
                              onLogout();
                            }
                          }
                        }
                      ]
                    );
                  }, 1000);
                }
              },
            },
          ]
        );
        
      } else {
        // Error en el pago
        let errorTitle = 'Error en el Pago';
        let errorMessage = result.message;
        let actionText = 'Intentar Nuevamente';

        if (result.isNetworkError) {
          errorTitle = 'Error de Conexión';
          errorMessage = 'Verifica tu conexión a internet e intenta nuevamente.';
        } else if (result.paymentStatus === 'Pendiente') {
          errorTitle = 'Pago Pendiente';
          errorMessage = result.message;
          actionText = 'Entendido';
        }

        Alert.alert(
          errorTitle,
          errorMessage,
          [{ text: actionText }]
        );
      }

    } catch (error: any) {
      console.error('Error inesperado en el pago:', error);
      
      Alert.alert(
        'Error Inesperado',
        'Ocurrió un error inesperado durante el procesamiento del pago. Por favor, verifica tu conexión e intenta nuevamente.',
        [{ text: 'OK' }]
      );
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Si está cargando datos del usuario
  if (isLoadingUserData) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={30} color={colors.primary.main} />
          <Text style={styles.loadingText}>Preparando formulario de pago...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedPlan && (
          <View style={styles.planSummary}>
            <View style={styles.planSummaryHeader}>
              <Icon name="check-circle" size={24} color={selectedPlan.color} />
              <Text style={styles.planSummaryTitle}>Plan Seleccionado</Text>
            </View>
            
            <View style={styles.planSummaryContent}>
              <Text style={styles.planName}>{selectedPlan.name}</Text>
              <View style={styles.priceDetails}>
                <Text style={[styles.planPrice, { color: selectedPlan.color }]}>
                  {selectedPlan.price}
                </Text>
                <Text style={styles.priceInColones}>
                  ₡{selectedPlan.priceInColones.toLocaleString('es-CR')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <View style={styles.inputWrapper}>
              <Icon 
                name="user" 
                size={18} 
                color={colors.text.secondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre completo"
                placeholderTextColor={colors.text.secondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email *</Text>
            <View style={styles.inputWrapper}>
              <Icon 
                name="envelope" 
                size={18} 
                color={colors.text.secondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={colors.text.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <View style={styles.inputWrapper}>
              <Icon 
                name="phone" 
                size={18} 
                color={colors.text.secondary} 
                style={styles.inputIcon}
              />
              <View style={styles.phoneContainer}>
                <Text style={styles.countryCode}>+506</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="8888-7777"
                  placeholderTextColor={colors.text.secondary}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Tarjeta</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Tarjeta *</Text>
            <View style={styles.inputWrapper}>
              <Icon 
                name="credit-card" 
                size={18} 
                color={colors.text.secondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.text.secondary}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Titular de la Tarjeta *</Text>
            <View style={styles.inputWrapper}>
              <Icon 
                name="user" 
                size={18} 
                color={colors.text.secondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre como aparece en la tarjeta"
                placeholderTextColor={colors.text.secondary}
                value={cardHolder}
                onChangeText={setCardHolder}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Vencimiento *</Text>
              <View style={styles.inputWrapper}>
                <Icon 
                  name="calendar" 
                  size={18} 
                  color={colors.text.secondary} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.text.secondary}
                  value={expiryDate}
                  onChangeText={handleExpiryDateChange}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>CVV *</Text>
              <View style={styles.inputWrapper}>
                <Icon 
                  name="lock" 
                  size={18} 
                  color={colors.text.secondary} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={colors.text.secondary}
                  value={cvv}
                  onChangeText={handleCvvChange}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.securityInfo}>
          <Icon name="shield-alt" size={20} color={colors.states.success} />
          <Text style={styles.securityText}>
            Tu información está protegida con cifrado SSL de 256 bits. No almacenamos datos de tarjetas.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title={isProcessing ? "Procesando Pago..." : `Pagar ₡${selectedPlan?.priceInColones.toLocaleString('es-CR')}`}
            onPress={handleProcessPayment}
            variant="primary"
            fullWidth
            disabled={isProcessing}
            icon="lock"
            iconPosition="left"
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <Text style={[
              styles.cancelButtonText,
              isProcessing && styles.cancelButtonDisabled
            ]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  planSummary: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  planSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  planSummaryTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
  },

  planSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  planName: {
    ...typography.styles.h2,
    color: colors.text.primary,
  },

  priceDetails: {
    alignItems: 'flex-end',
  },

  planPrice: {
    ...typography.styles.h2,
    fontWeight: typography.fontWeight.bold,
  },

  priceInColones: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  inputContainer: {
    marginBottom: spacing.lg,
  },

  inputLabel: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
  },

  inputIcon: {
    marginRight: spacing.sm,
  },

  input: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },

  phoneContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  countryCode: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.sm,
  },

  phoneInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },

  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  halfWidth: {
    width: '48%',
  },

  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.states.success + '30',
  },

  securityText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16,
  },

  actionContainer: {
    marginTop: spacing.lg,
  },

  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },

  cancelButtonText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },

  cancelButtonDisabled: {
    opacity: 0.5,
  },
});