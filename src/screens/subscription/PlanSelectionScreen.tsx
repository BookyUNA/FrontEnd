/**
 * Pantalla de Selección de Plan - Booky (ACTUALIZADA)
 * Sistema de reservas para profesionales independientes
 * Pantalla para seleccionar y gestionar planes de suscripción
 * Integrada con paymentService para manejo real de pagos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { paymentService, PlanType } from '../../services/professionals';
import { authService } from '../../services/auth/authService';

// =============================================
// INTERFACES Y TIPOS
// =============================================

interface PlanSelectionScreenProps {
  navigation?: any;
  onLogout?: () => void;
}

interface PlanData {
  id: PlanType;
  name: string;
  monthlyPrice: string;
  monthlyPriceInColones: number;
  annualPrice: string;
  annualPriceInColones: number;
  annualDiscount: string;
  isPopular?: boolean;
  isFree?: boolean;
  features: string[];
  description: string;
  color: string;
}

// Tipo para el periodo de facturación
type BillingPeriod = 'monthly' | 'annual';

// =============================================
// DATOS DE PLANES
// =============================================

const PLANS_DATA: PlanData[] = [
  {
    id: 'free',
    name: 'Plan Gratuito',
    monthlyPrice: 'Gratis',
    monthlyPriceInColones: 0,
    annualPrice: 'Gratis',
    annualPriceInColones: 0,
    annualDiscount: '',
    isFree: true,
    color: colors.states.success,
    description: 'Ideal para profesionales que están comenzando y quieren probar una herramienta eficiente para gestionar sus servicios.',
    features: [
      'Hasta 5 servicios registrados',
      'Gestión básica de citas y horarios',
      'Perfil profesional personalizable',
      'Acceso a funcionalidades básicas de reservas'
    ]
  },
  {
    id: 'basic',
    name: 'Plan Básico',
    monthlyPrice: '$9.99/mes',
    monthlyPriceInColones: 5015, // $9.99 × 502 CRC/USD
    annualPrice: '$99/año',
    annualPriceInColones: 49698, // $99 × 502 CRC/USD (17% descuento)
    annualDiscount: '17% descuento',
    color: colors.primary.main,
    description: 'Ideal para profesionales establecidos con clientela regular. Incluye funcionalidades avanzadas de gestión.',
    features: [
      'Todo lo que ofrece el plan gratuito',
      'Hasta 30 servicios registrados',
      'Herramientas avanzadas de gestión',
      'Configuraciones profesionales extendidas',
      'Nuevos features premium se añadirán en el futuro'
    ]
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    monthlyPrice: '$19.99/mes',
    monthlyPriceInColones: 10035, // $19.99 × 502 CRC/USD
    annualPrice: '$199/año',
    annualPriceInColones: 99898, // $199 × 502 CRC/USD (17% descuento)
    annualDiscount: '17% descuento',
    color: colors.states.warning,
    description: 'Para profesionales con alto volumen de trabajo que requieren análisis avanzados y herramientas profesionales completas.',
    features: [
      'Todo lo que incluye el plan básico',
      'Hasta 300 servicios registrados',
      'Estadísticas de clientes (% de cancelación)',
      'Información detallada al aceptar citas',
      'Análisis detallado de patrones de cancelación',
      'Nuevos features premium se añadirán en el futuro'
    ]
  }
];

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export const PlanSelectionScreen: React.FC<PlanSelectionScreenProps> = ({ navigation, onLogout }) => {
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>('free'); // Preseleccionar plan gratuito
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly'); // Estado para el periodo de facturación
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<boolean>(false);
  const [currentUserPlan, setCurrentUserPlan] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar datos iniciales
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener plan actual del usuario
      const isProfessional = await authService.isProfessional();
      if (isProfessional) {
        const planId = await authService.getUserPlanId();
        setCurrentUserPlan(planId);
        
        // Preseleccionar el plan actual
        switch (planId) {
          case 1:
            setSelectedPlan('free');
            break;
          case 2:
            setSelectedPlan('basic');
            break;
          case 3:
            setSelectedPlan('premium');
            break;
          default:
            setSelectedPlan('free');
        }
      }
      
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  };

  // Obtener precio según el periodo de facturación
  const getPriceForPlan = (plan: PlanData): { price: string; priceInColones: number } => {
    if (plan.isFree) {
      return { price: plan.monthlyPrice, priceInColones: plan.monthlyPriceInColones };
    }
    
    return billingPeriod === 'monthly' 
      ? { price: plan.monthlyPrice, priceInColones: plan.monthlyPriceInColones }
      : { price: plan.annualPrice, priceInColones: plan.annualPriceInColones };
  };

  // Manejar cambio de periodo de facturación
  const handleBillingPeriodChange = (period: BillingPeriod) => {
    setBillingPeriod(period);
  };

  // Manejar expansión/contracción de planes
  const handlePlanToggle = (planId: string) => {
    setExpandedPlans(prev => 
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  // Manejar selección de plan
  const handlePlanSelect = (planId: PlanType) => {
    setSelectedPlan(planId);
    console.log('Plan seleccionado:', planId);
  };

  // Confirmar selección de plan gratuito
  const handleFreePlanSelection = async () => {
    if (currentUserPlan === 1) {
      Alert.alert(
        'Plan Actual',
        'Ya tienes el plan gratuito activado.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsUpdatingPlan(true);

    try {
      console.log('💳 Activando plan gratuito...');

      // Obtener información del plan gratuito
      const freePlan = paymentService.getPlanInfo('free');
      
      // Datos dummy válidos para evitar validación (no se usarán en plan gratuito)
      const dummyPaymentData = {
        cardNumber: '4111111111111111', // Número de tarjeta de prueba válido
        cardHolder: 'Plan Gratuito',
        expiryDate: '12/30',
        cvv: '123',
        email: 'plan@gratuito.com',
        name: 'Plan Gratuito',
        phone: '+50612345678',
      };

      // El método detecta internamente que es plan gratuito y usa IdPagoOnvo = 0
      const result = await paymentService.processPaymentAndAssignPlan(
        dummyPaymentData,
        freePlan
      );

      if (result.success) {
        Alert.alert(
          '¡Plan Gratuito Activado!',
          result.message,
          [
            {
              text: 'Continuar',
              onPress: () => {
                // Refrescar datos locales
                setCurrentUserPlan(1);
                
                // Navegar de vuelta
                navigation?.goBack();
                
                // Logout obligatorio para actualizar token
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
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.message || 'No se pudo activar el plan gratuito. Intenta nuevamente.',
          [{ text: 'Intentar Nuevamente' }]
        );
      }

    } catch (error: any) {
      console.error('Error en selección de plan gratuito:', error);
      Alert.alert(
        'Error Inesperado',
        'Ocurrió un error al activar el plan gratuito. Verifica tu conexión e intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Confirmar selección de plan
  const handleConfirmPlanSelection = () => {
    const selectedPlanData = PLANS_DATA.find(plan => plan.id === selectedPlan);

    if (!selectedPlanData) {
      Alert.alert('Error', 'Por favor selecciona un plan');
      return;
    }

    // Verificar si es el plan actual
    const currentPlanNumber = currentUserPlan;
    const selectedPlanNumber = selectedPlanData.id === 'free' ? 1 : selectedPlanData.id === 'basic' ? 2 : 3;
    
    if (currentPlanNumber === selectedPlanNumber) {
      Alert.alert(
        'Plan Actual',
        `Ya tienes el ${selectedPlanData.name} activado.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Plan gratuito: activar directamente
    if (selectedPlanData.isFree) {
      handleFreePlanSelection();
      return;
    }

    // Obtener precio según periodo seleccionado
    const priceData = getPriceForPlan(selectedPlanData);

    // Planes de pago: navegar a pasarela de pago
    navigation?.navigate('PaymentGateway', {
      plan: {
        id: selectedPlanData.id,
        name: selectedPlanData.name,
        price: priceData.price,
        priceInColones: priceData.priceInColones,
        color: selectedPlanData.color,
        billingPeriod: billingPeriod,
      },
    });
  };

  // Renderizado del estado de carga
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Icon name="spinner" size={30} color={colors.primary.main} />
      <Text style={styles.loadingText}>Cargando planes...</Text>
    </View>
  );

  // Renderizado del selector de periodo de facturación
  const renderBillingPeriodSelector = () => (
    <View style={styles.billingPeriodContainer}>
      <Text style={styles.billingPeriodTitle}>Periodo de facturación</Text>
      <View style={styles.billingPeriodSelector}>
        <TouchableOpacity
          style={[
            styles.billingPeriodOption,
            billingPeriod === 'monthly' && styles.billingPeriodOptionActive
          ]}
          onPress={() => handleBillingPeriodChange('monthly')}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.billingPeriodOptionText,
            billingPeriod === 'monthly' && styles.billingPeriodOptionTextActive
          ]}>
            Mensual
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.billingPeriodOption,
            billingPeriod === 'annual' && styles.billingPeriodOptionActive
          ]}
          onPress={() => handleBillingPeriodChange('annual')}
          activeOpacity={0.8}
        >
          <View style={styles.annualOptionContent}>
            <Text style={[
              styles.billingPeriodOptionText,
              billingPeriod === 'annual' && styles.billingPeriodOptionTextActive
            ]}>
              Anual
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-17%</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizado del header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.subtitle}>
        Selecciona el plan que mejor se adapte a tu negocio
      </Text>
      
      {currentUserPlan && (
        <View style={styles.currentPlanContainer}>
          <Icon name="info-circle" size={16} color={colors.primary.main} />
          <Text style={styles.currentPlanText}>
            Plan actual: {currentUserPlan === 1 ? 'Gratuito' : currentUserPlan === 2 ? 'Básico' : 'Premium'}
          </Text>
        </View>
      )}
    </View>
  );

  // Renderizado de una tarjeta de plan
  const renderPlanCard = (plan: PlanData) => {
    const isSelected = selectedPlan === plan.id;
    const isExpanded = expandedPlans.includes(plan.id);
    const isCurrentPlan = currentUserPlan === (plan.id === 'free' ? 1 : plan.id === 'basic' ? 2 : 3);
    const priceData = getPriceForPlan(plan);
    
    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isCurrentPlan && styles.currentPlanCard
        ]}
      >
        {isCurrentPlan && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanBadgeText}>Plan Actual</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.planHeaderTouchable}
          onPress={() => handlePlanToggle(plan.id)}
          activeOpacity={0.8}
        >
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: plan.color }]}>
              <Icon 
                name={plan.isFree ? 'gift' : plan.id === 'premium' ? 'crown' : 'diamond'} 
                size={24} 
                color={colors.background.primary} 
              />
            </View>
            
            <View style={styles.planTitleContainer}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.planPrice, { color: plan.color }]}>
                  {priceData.price}
                </Text>
                {!plan.isFree && billingPeriod === 'annual' && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.originalPrice}>
                      {billingPeriod === 'annual' ? plan.monthlyPrice.replace('/mes', '') + ' x 12' : ''}
                    </Text>
                    <Text style={styles.discountText}>{plan.annualDiscount}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.expandIndicatorContainer}>
              <Icon 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.text.secondary} 
              />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.planExpandedContent}>
            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Incluye:</Text>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Icon 
                    name="check" 
                    size={14} 
                    color={plan.color} 
                    style={styles.featureIcon} 
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.selectPlanButton,
                { backgroundColor: plan.color },
                isSelected && styles.selectedPlanButton,
                isCurrentPlan && styles.currentPlanButton
              ]}
              onPress={() => handlePlanSelect(plan.id)}
              activeOpacity={0.8}
            >
              <Icon 
                name={isCurrentPlan ? "check-circle" : isSelected ? "check-circle" : "circle"} 
                size={18} 
                color={colors.background.primary} 
                style={styles.selectButtonIcon}
              />
              <Text style={styles.selectPlanButtonText}>
                {isCurrentPlan ? 'Plan Actual' : isSelected ? 'Plan Seleccionado' : 'Seleccionar Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Renderizado del botón de acción para planes
  const renderPlanActionButton = () => (
    <View style={styles.actionContainer}>
      <Button
        title={isUpdatingPlan ? "Procesando..." : "Actualizar Plan"}
        onPress={handleConfirmPlanSelection}
        variant="primary"
        fullWidth
        disabled={isUpdatingPlan}
        icon="credit-card"
        iconPosition="left"
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeContainer>
        {renderLoadingState()}
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
        {renderHeader()}
        {renderBillingPeriodSelector()}
        
        <View style={styles.plansContainer}>
          {PLANS_DATA.map(renderPlanCard)}
        </View>
        {renderPlanActionButton()}
      </ScrollView>
    </SafeContainer>
  );
};

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
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

  // Header
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },

  currentPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.main + '20',
    borderRadius: spacing.sm,
  },

  currentPlanText: {
    ...typography.styles.caption,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Selector de periodo de facturación
  billingPeriodContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },

  billingPeriodTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  billingPeriodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  billingPeriodOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    flex: 1,
    alignItems: 'center',
  },

  billingPeriodOptionActive: {
    backgroundColor: colors.primary.main,
  },

  billingPeriodOptionText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },

  billingPeriodOptionTextActive: {
    color: colors.background.primary,
  },

  annualOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  discountBadge: {
    backgroundColor: colors.states.success,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
    minWidth: 28,
    alignItems: 'center',
  },

  discountBadgeText: {
    ...typography.styles.caption,
    color: colors.background.primary,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },

  // Planes
  plansContainer: {
    marginBottom: spacing['3xl'],
  },

  planCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },

  planCardSelected: {
    borderColor: colors.primary.main,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  currentPlanCard: {
    borderColor: colors.states.success,
    backgroundColor: colors.states.success + '05',
  },

  currentPlanBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.states.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    zIndex: 1,
  },

  currentPlanBadgeText: {
    ...typography.styles.caption,
    color: colors.background.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 10,
  },

  planHeaderTouchable: {
    padding: spacing.lg,
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  planTitleContainer: {
    flex: 1,
  },

  expandIndicatorContainer: {
    marginLeft: spacing.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  planExpandedContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },

  planName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  planPrice: {
    ...typography.styles.h3,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },

  discountContainer: {
    flexDirection: 'column',
  },

  originalPrice: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },

  discountText: {
    ...typography.styles.caption,
    color: colors.states.success,
    fontWeight: typography.fontWeight.semibold,
  },

  // Botón de selección de plan
  selectPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    marginTop: spacing.lg,
  },

  selectedPlanButton: {
    opacity: 0.8,
  },

  currentPlanButton: {
    backgroundColor: colors.states.success,
  },

  selectButtonIcon: {
    marginRight: spacing.sm,
  },

  selectPlanButtonText: {
    ...typography.styles.body,
    color: colors.background.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  planDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  featuresContainer: {
    marginTop: spacing.md,
  },

  featuresTitle: {
    ...typography.styles.label,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  featureIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },

  featureText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
  },

  // Botón de acción
  actionContainer: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
});