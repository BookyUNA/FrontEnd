/**
 * Pantalla de Pasarela de Pago - Booky
 * Sistema de reservas para profesionales independientes
 * Formulario de pago para planes de suscripción
 */

import React, { useState } from 'react';
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

interface PaymentGatewayScreenProps {
  navigation?: any;
  route?: {
    params?: {
      plan?: {
        id: string;
        name: string;
        price: string;
        color: string;
      };
    };
  };
}

export const PaymentGatewayScreen: React.FC<PaymentGatewayScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const selectedPlan = route?.params?.plan;

  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

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

  const validateForm = (): boolean => {
    if (cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Error', 'Número de tarjeta inválido');
      return false;
    }

    if (cardHolder.trim().length < 3) {
      Alert.alert('Error', 'Nombre del titular requerido');
      return false;
    }

    if (expiryDate.length !== 5) {
      Alert.alert('Error', 'Fecha de vencimiento inválida');
      return false;
    }

    if (cvv.length < 3) {
      Alert.alert('Error', 'CVV inválido');
      return false;
    }

    return true;
  };

  const handleProcessPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Pago Procesado',
        `Tu suscripción al ${selectedPlan?.name} ha sido activada.\n\nFuncionalidad de pago en desarrollo.`,
        [
          {
            text: 'Continuar',
            onPress: () => navigation?.goBack(),
          },
        ]
      );
    }, 2000);
  };

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
              <Text style={[styles.planPrice, { color: selectedPlan.color }]}>
                {selectedPlan.price}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Tarjeta</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Tarjeta</Text>
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
            <Text style={styles.inputLabel}>Titular de la Tarjeta</Text>
            <View style={styles.inputWrapper}>
              <Icon 
                name="user" 
                size={18} 
                color={colors.text.secondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre completo como aparece en la tarjeta"
                placeholderTextColor={colors.text.secondary}
                value={cardHolder}
                onChangeText={setCardHolder}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Fecha de Vencimiento</Text>
              <View style={styles.inputWrapper}>
                <Icon 
                  name="calendar" 
                  size={18} 
                  color={colors.text.secondary} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.text.secondary}
                  value={expiryDate}
                  onChangeText={handleExpiryDateChange}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>CVV</Text>
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

        <View style={styles.actionContainer}>
          <Button
            title={isProcessing ? "Procesando..." : "Procesar Pago"}
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
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
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

  planPrice: {
    ...typography.styles.h2,
    fontWeight: typography.fontWeight.bold,
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
});