/**
 * Pantalla de Selección de Plan - Booky
 * Sistema de reservas para profesionales independientes
 * Pantalla para seleccionar y gestionar planes de suscripción
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

// =============================================
// INTERFACES Y TIPOS
// =============================================

interface PlanSelectionScreenProps {
  navigation?: any;
}

interface PlanData {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  isPopular?: boolean;
  isFree?: boolean;
  features: string[];
  description: string;
  color: string;
}

interface AdditionalService {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
}

// =============================================
// DATOS DE PLANES Y SERVICIOS
// =============================================

const PLANS_DATA: PlanData[] = [
  {
    id: 'free',
    name: 'Plan Gratuito',
    price: 'Gratis',
    isFree: true,
    color: colors.states.success,
    description: 'Ideal para profesionales que están comenzando o tienen pocos servicios y quieran contar con una herramienta eficiente.',
    features: [
      'Hasta 5 servicios registrados',
      'Posibilidad de contar hasta con 30 clientes',
      'Política de cancelación con máximo de 24 horas',
      'Posibilidad de establecer horario profesional'
    ]
  },
  {
    id: 'basic',
    name: 'Plan Básico',
    price: '$9.99/mes',
    originalPrice: '$99/año',
    discount: '17% descuento',
    color: colors.primary.main,
    description: 'Ideal para profesionales asentados con una clientela más extensa.',
    features: [
      'Todo lo que ofrece el plan gratuito',
      'Hasta 30 servicios registrados',
      'Posibilidad de contar hasta con 120 clientes',
      'Lista de espera de hasta 50 clientes',
      'Política de cancelación ilimitada'
    ]
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: '$39.99/mes',
    originalPrice: '$399/año',
    discount: '17% descuento',
    color: colors.states.warning,
    description: 'Para profesionales con necesidades avanzadas y clientela extensa.',
    features: [
      'Todo lo que incluye el plan básico',
      'Hasta 300 servicios registrados',
      'Clientes ilimitados',
      'Lista de espera ilimitada',
      'Una campaña de anuncio mensual (hasta 1000 clientes)'
    ]
  }
];

const ADDITIONAL_SERVICES: AdditionalService[] = [
  {
    id: 'premium_positioning',
    name: 'Sistema de Posicionamiento Premium',
    description: 'Aparece destacado en los resultados de búsqueda con posicionamiento rotativo y etiqueta identificativa.',
    price: '$9.99/mes',
    icon: 'star'
  }
];

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export const PlanSelectionScreen: React.FC<PlanSelectionScreenProps> = ({ navigation }) => {
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>('free'); // Preseleccionar plan gratuito
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'services'>('plans');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Manejar expansión/contracción de planes
  const handlePlanToggle = (planId: string) => {
    setExpandedPlans(prev => 
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  // Manejar selección de plan
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    console.log('Plan seleccionado:', planId);
  };

  // Manejar selección de servicios adicionales
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Confirmar selección de plan
  const handleConfirmPlanSelection = () => {
    const selectedPlanData = PLANS_DATA.find(plan => plan.id === selectedPlan);

    Alert.alert(
      'Confirmar Cambio de Plan',
      `¿Deseas cambiar tu plan actual a: ${selectedPlanData?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            Alert.alert(
              'Plan Actualizado',
              'Funcionalidad de procesamiento de pago en desarrollo.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  // Confirmar servicios adicionales
  const handleConfirmServicesSelection = () => {
    const selectedServicesData = ADDITIONAL_SERVICES.filter(service => 
      selectedServices.includes(service.id)
    );

    if (selectedServicesData.length === 0) {
      Alert.alert(
        'Sin Servicios',
        'No has seleccionado ningún servicio adicional.',
        [{ text: 'OK' }]
      );
      return;
    }

    const servicesText = selectedServicesData.map(s => `• ${s.name} (${s.price})`).join('\n');
    
    Alert.alert(
      'Confirmar Servicios Adicionales',
      `Servicios seleccionados:\n\n${servicesText}\n\n¿Deseas proceder con la compra?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            Alert.alert(
              'Servicios Contratados',
              'Funcionalidad de procesamiento de pago en desarrollo.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  // Renderizado del estado de carga
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Icon name="spinner" size={30} color={colors.primary.main} />
      <Text style={styles.loadingText}>Cargando planes...</Text>
    </View>
  );

  // Renderizado del header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.subtitle}>
        {activeTab === 'plans' 
          ? 'Selecciona el plan que mejor se adapte a tu negocio'
          : 'Potencia tu negocio con servicios adicionales'
        }
      </Text>
    </View>
  );

  // Renderizado de las pestañas
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'plans' && styles.activeTab
        ]}
        onPress={() => setActiveTab('plans')}
        activeOpacity={0.8}
      >
        <Icon 
          name="credit-card" 
          size={18} 
          color={activeTab === 'plans' ? colors.primary.main : colors.text.secondary} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'plans' && styles.activeTabText
        ]}>
          Planes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'services' && styles.activeTab
        ]}
        onPress={() => setActiveTab('services')}
        activeOpacity={0.8}
      >
        <Icon 
          name="star" 
          size={18} 
          color={activeTab === 'services' ? colors.primary.main : colors.text.secondary} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'services' && styles.activeTabText
        ]}>
          Servicios Extra
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizado de una tarjeta de plan
  const renderPlanCard = (plan: PlanData) => {
    const isSelected = selectedPlan === plan.id;
    const isExpanded = expandedPlans.includes(plan.id);
    
    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.isPopular && styles.popularPlan
        ]}
      >

        <TouchableOpacity
          style={styles.planHeaderTouchable}
          onPress={() => handlePlanToggle(plan.id)}
          activeOpacity={0.8}
        >
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: plan.color }]}>
              <Icon 
                name={plan.isFree ? 'gift' : plan.isPopular ? 'crown' : 'diamond'} 
                size={24} 
                color={colors.background.primary} 
              />
            </View>
            
            <View style={styles.planTitleContainer}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.planPrice, { color: plan.color }]}>
                  {plan.price}
                </Text>
                {plan.originalPrice && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                    <Text style={styles.discountText}>{plan.discount}</Text>
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
                isSelected && styles.selectedPlanButton
              ]}
              onPress={() => handlePlanSelect(plan.id)}
              activeOpacity={0.8}
            >
              <Icon 
                name={isSelected ? "check-circle" : "circle"} 
                size={18} 
                color={colors.background.primary} 
                style={styles.selectButtonIcon}
              />
              <Text style={styles.selectPlanButtonText}>
                {isSelected ? 'Plan Seleccionado' : 'Seleccionar Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Renderizado de servicios adicionales
  const renderAdditionalServices = () => (
    <View style={styles.additionalServicesContainer}>
      {ADDITIONAL_SERVICES.map((service) => {
        const isSelected = selectedServices.includes(service.id);
        
        return (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              isSelected && styles.serviceCardSelected
            ]}
            onPress={() => handleServiceToggle(service.id)}
            activeOpacity={0.8}
          >
            <View style={styles.serviceHeader}>
              <View style={styles.serviceIconContainer}>
                <Icon name={service.icon} size={20} color={colors.primary.main} />
              </View>
              
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>{service.price}</Text>
              </View>

              <View style={styles.serviceToggle}>
                <Icon 
                  name={isSelected ? "toggle-on" : "toggle-off"} 
                  size={28} 
                  color={isSelected ? colors.states.success : colors.text.secondary} 
                />
              </View>
            </View>

            <Text style={styles.serviceDescription}>{service.description}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Renderizado del botón de acción para planes
  const renderPlanActionButton = () => (
    <View style={styles.actionContainer}>
      <Button
        title="Actualizar Plan"
        onPress={handleConfirmPlanSelection}
        variant="primary"
        fullWidth
        icon="credit-card"
        iconPosition="left"
      />
    </View>
  );

  // Renderizado del botón de acción para servicios
  const renderServicesActionButton = () => (
    <View style={styles.actionContainer}>
      <Button
        title={selectedServices.length > 0 ? "Contratar Servicios" : "Sin servicios seleccionados"}
        onPress={handleConfirmServicesSelection}
        variant={selectedServices.length > 0 ? "primary" : "outline"}
        fullWidth
        disabled={selectedServices.length === 0}
        icon="star"
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
        {renderTabs()}
        
        {activeTab === 'plans' ? (
          <>
            <View style={styles.plansContainer}>
              {PLANS_DATA.map(renderPlanCard)}
            </View>
            {renderPlanActionButton()}
          </>
        ) : (
          <>
            {renderAdditionalServices()}
            {renderServicesActionButton()}
          </>
        )}
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

  // Pestañas
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
  },

  activeTab: {
    backgroundColor: colors.background.primary,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  tabText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },

  activeTabText: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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

  planHeaderTouchable: {
    padding: spacing.lg,
  },

  popularPlan: {
    // Estilo removido - ya no se usa
  },

  popularBadge: {
    // Estilo removido - ya no se usa
  },

  popularBadgeText: {
    // Estilo removido - ya no se usa
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

  selectedIndicator: {
    marginLeft: spacing.sm,
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

  // Servicios adicionales
  additionalServicesContainer: {
    marginBottom: spacing['3xl'],
  },

  sectionTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  sectionSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  serviceCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  serviceCardSelected: {
    borderColor: colors.states.success,
  },

  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  serviceInfo: {
    flex: 1,
  },

  serviceName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  servicePrice: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },

  serviceToggle: {
    marginLeft: spacing.sm,
  },

  serviceDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  // Botón de acción
  actionContainer: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
});