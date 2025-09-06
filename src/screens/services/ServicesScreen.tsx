/**
 * Pantalla de Servicios - Booky
 * Pantalla principal para gestión de servicios del profesional
 * Incluye buscador, listado y opción para crear servicios
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Input } from '../../components/forms/Input';
import { Button } from '../../components/forms/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { servicesService } from '../../services/services/servicesService';

const { width } = Dimensions.get('window');
const cardWidth = (width - (spacing.lg * 2) - spacing.md) / 2;

// Color unificado para todos los servicios
const SERVICE_COLOR = '#8676F3';

// Tipos para servicios
export interface Servicio {
  IdServicio: number;
  Nombre: string;
  Descripcion: string;
  DuracionMinutos: number;
  Precio: number;
  PermiteDescuento: boolean;
  PorcentajeDescuento: number;
  FechaCreacion: string;
  Estado: boolean;
}

interface ServicesScreenProps {
  navigation?: any;
  onCreateService?: () => void;
}

// Interfaz para opciones del menú contextual
interface MenuOption {
  id: string;
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ 
  navigation,
  onCreateService 
}) => {
  // Estados del componente
  const [services, setServices] = useState<Servicio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  // Estados filtrados para el buscador
  const [filteredServices, setFilteredServices] = useState<Servicio[]>([]);

  // Estados para el menú contextual
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Servicio | null>(null);

  /**
   * Hook para recargar datos cuando la pantalla recibe el foco
   * Se ejecuta cada vez que el usuario regresa a esta pantalla
   */
  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [])
  );

  /**
   * Preparar datos para el grid - agregar elemento vacío si es impar
   */
  const prepareGridData = (data: Servicio[]) => {
    const gridData = [...data];
    // Si el número de elementos es impar, agregar un elemento vacío
    if (gridData.length % 2 !== 0) {
      gridData.push({
        IdServicio: -1, // ID especial para elemento vacío
        Nombre: '',
        Descripcion: '',
        DuracionMinutos: 0,
        Precio: 0,
        PermiteDescuento: false,
        PorcentajeDescuento: 0,
        FechaCreacion: '',
        Estado: false,
      });
    }
    return gridData;
  };

  // Filtrar servicios cuando cambia la búsqueda
  useEffect(() => {
    filterServices();
  }, [searchQuery, services]);

  /**
   * Cargar servicios desde la API
   */
  const loadServices = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError('');
      setShowError(false);

      console.log('📋 Cargando servicios...');
      const result = await servicesService.getServices();

      if (result.success && result.servicios) {
        setServices(result.servicios);
        console.log('📋 Servicios cargados:', result.servicios.length);
      } else {
        // Error del servidor o sin servicios
        if (result.error) {
          setError(result.error);
          setShowError(true);
        }
        setServices([]);
      }

    } catch (error) {
      console.error('📋 Error al cargar servicios:', error);
      setError('Error de conexión. Revisa tu internet e intenta nuevamente.');
      setShowError(true);
      setServices([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Filtrar servicios según el término de búsqueda
   */
  const filterServices = () => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = services.filter(service => 
      service.Nombre.toLowerCase().includes(query) ||
      service.Descripcion.toLowerCase().includes(query)
    );

    setFilteredServices(filtered);
  };

  /**
   * Manejar pull-to-refresh
   */
  const handleRefresh = () => {
    loadServices(true);
  };

  /**
   * Navegar a crear servicio
   */
  const handleCreateService = () => {
    if (navigation?.navigate) {
      navigation.navigate('CreateService');
    } else if (onCreateService) {
      onCreateService();
    } else {
      Alert.alert(
        'Crear Servicio',
        'La funcionalidad para crear servicios estará disponible próximamente.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Manejar presión larga en servicio
   */
  const handleLongPress = (service: Servicio) => {
    setSelectedService(service);
    setShowContextMenu(true);
  };

  /**
   * Cerrar menú contextual
   */
  const closeContextMenu = () => {
    setShowContextMenu(false);
    setSelectedService(null);
  };

  /**
   * Manejar edición de servicio
   */
  const handleEditService = () => {
    if (selectedService && navigation?.navigate) {
      console.log('Editando servicio:', selectedService.Nombre);
      navigation.navigate('EditService', { service: selectedService });
    } else if (selectedService) {
      Alert.alert(
        'Editar Servicio',
        `Funcionalidad para editar "${selectedService.Nombre}" en desarrollo.`,
        [{ text: 'OK' }]
      );
    }
    closeContextMenu();
  };

  /**
   * Obtener opciones del menú contextual
   */
  const getMenuOptions = (): MenuOption[] => [
    {
      id: 'edit',
      title: 'Editar Servicio',
      icon: 'edit',
      color: colors.primary.main,
      onPress: handleEditService,
    },
  ];

  /**
   * Formatear precio para mostrar
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(price);
  };

  /**
   * Formatear duración para mostrar
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  };

  /**
   * Obtener iniciales del nombre del servicio
   */
  const getServiceInitials = (serviceName: string): string => {
    if (!serviceName) return 'S';
    
    const words = serviceName.trim().split(' ');
    
    if (words.length === 1) {
      // Si es una sola palabra, tomar las primeras 2 letras
      return words[0].substring(0, 2).toUpperCase();
    } else {
      // Si son múltiples palabras, tomar la primera letra de cada una (máximo 2)
      return words
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
  };

  /**
   * Renderizar elemento de servicio en formato grid
   */
  const renderServiceCard = (service: Servicio) => {
    // Si es el elemento vacío (placeholder), renderizar un view invisible
    if (service.IdServicio === -1) {
      return <View style={[styles.serviceCard, styles.emptyCard]} />;
    }

    return (
      <TouchableOpacity 
        key={service.IdServicio} 
        style={styles.serviceCard}
        activeOpacity={0.8}
        onPress={() => {
          console.log('Servicio seleccionado:', service.Nombre);
        }}
        onLongPress={() => handleLongPress(service)}
      >
        {/* Indicador de disponibilidad */}
        <View style={[
          styles.availabilityDot, 
          service.Estado ? styles.available : styles.unavailable
        ]} />
        
        {/* Indicador de categoría inferior */}
        <View style={styles.categoryIndicator} />
        
        {/* Icono con iniciales del servicio */}
        <View style={styles.serviceIcon}>
          <Text style={styles.serviceInitials}>
            {getServiceInitials(service.Nombre)}
          </Text>
        </View>
        
        {/* Contenido principal */}
        <View style={styles.cardContent}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {service.Nombre}
          </Text>
          
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.Descripcion}
          </Text>
        </View>
        
        {/* Footer con precio y duración */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatPrice(service.Precio)}
            </Text>
            {service.PermiteDescuento && service.PorcentajeDescuento > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  -{service.PorcentajeDescuento}%
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>
              {formatDuration(service.DuracionMinutos)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Renderizar estado vacío
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyTitle}>
        Sin servicios registrados
      </Text>
      <Text style={styles.emptyDescription}>
        Crea tu primer servicio para que tus clientes puedan reservar citas contigo.
      </Text>
      
      <Button
        title="Crear Mi Primer Servicio"
        onPress={handleCreateService}
        icon="plus"
        variant="primary"
      />
    </View>
  );

  /**
   * Renderizar estado de búsqueda sin resultados
   */
  const renderNoSearchResults = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>
        Sin resultados
      </Text>
      <Text style={styles.emptyDescription}>
        No encontramos servicios que coincidan con "{searchQuery}".
      </Text>
      
      <Button
        title="Limpiar Búsqueda"
        onPress={() => setSearchQuery('')}
        variant="outline"
      />
    </View>
  );

  /**
   * Renderizar menú contextual
   */
  const renderContextMenu = () => {
    if (!selectedService) return null;

    const menuOptions = getMenuOptions();

    return (
      <Modal
        visible={showContextMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeContextMenu}
      >
        <TouchableWithoutFeedback onPress={closeContextMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.contextMenu}>
                {/* Header del menú */}
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle} numberOfLines={1}>
                    {selectedService.Nombre}
                  </Text>
                  <TouchableOpacity
                    onPress={closeContextMenu}
                    style={styles.closeButton}
                  >
                    <Icon name="times" size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Lista de opciones */}
                <View style={styles.menuOptions}>
                  {menuOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.menuOption,
                        index < menuOptions.length - 1 && styles.menuOptionWithBorder
                      ]}
                      onPress={option.onPress}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.optionIcon,
                          { backgroundColor: (option.color || colors.text.secondary) + '15' }
                        ]}>
                          <Icon 
                            name={option.icon} 
                            size={16} 
                            color={option.color || colors.text.secondary} 
                          />
                        </View>
                        <Text style={[
                          styles.optionText,
                          { color: option.color || colors.text.primary }
                        ]}>
                          {option.title}
                        </Text>
                      </View>
                      <Icon 
                        name="chevron-right" 
                        size={12} 
                        color={colors.text.tertiary} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <SafeContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mis Servicios</Text>
          <Text style={styles.subtitle}>Brindando un servicio ideal</Text>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Error message */}
        {showError && (
          <ErrorMessage 
            message={error}
            visible={showError}
          />
        )}

        {/* Contenido principal */}
        {isLoading ? (
          // Estado de carga
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando servicios...</Text>
          </View>
        ) : services.length === 0 ? (
          // Estado sin servicios
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.main}
                colors={[colors.primary.main]}
              />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        ) : filteredServices.length === 0 && searchQuery ? (
          // Estado sin resultados de búsqueda
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.main}
                colors={[colors.primary.main]}
              />
            }
          >
            {renderNoSearchResults()}
          </ScrollView>
        ) : (
          // Grid de servicios con FlatList
          <FlatList
            data={prepareGridData(filteredServices)}
            renderItem={({ item }) => renderServiceCard(item)}
            keyExtractor={(item) => item.IdServicio.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary.main}
                colors={[colors.primary.main]}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        {services.length > 0 && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleCreateService}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={20} color="white" />
          </TouchableOpacity>
        )}

        {/* Menú contextual */}
        {renderContextMenu()}
      </View>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
  },

  header: {
    alignItems: 'center',
    paddingTop: spacing['8xl'],
    paddingBottom: spacing.lg,
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
  },

  searchContainer: {
    marginBottom: spacing.lg,
  },

  content: {
    flex: 1,
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
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },

  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
    opacity: 0.6,
  },

  emptyTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  emptyDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },

  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },

  flatListContent: {
    paddingBottom: spacing['4xl'],
  },

  serviceCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: 0.85,
    flex: 1,
    marginHorizontal: spacing.xs / 2,
  },

  emptyCard: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  availabilityDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },

  available: {
    backgroundColor: colors.states.success,
  },

  unavailable: {
    backgroundColor: colors.states.error,
  },

  categoryIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: SERVICE_COLOR,
    opacity: 0.7,
  },

  serviceIcon: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: SERVICE_COLOR + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: SERVICE_COLOR + '40',
  },

  serviceInitials: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: SERVICE_COLOR,
    letterSpacing: 0.5,
  },

  cardContent: {
    flex: 1,
    marginTop: 0,
  },

  serviceName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
    lineHeight: 18,
  },

  serviceDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: spacing.sm,
    lineHeight: 15,
  },

  cardFooter: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },

  price: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },

  discountBadge: {
    backgroundColor: colors.states.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  discountText: {
    fontSize: 10,
    color: colors.states.warning,
    fontWeight: typography.fontWeight.medium,
  },

  durationContainer: {
    backgroundColor: colors.background.tertiary,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },

  duration: {
    fontSize: 10,
    color: colors.text.secondary,
  },

  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Estilos para el menú contextual
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  contextMenu: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  menuTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuOptions: {
    paddingVertical: spacing.sm,
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  menuOptionWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  optionText: {
    ...typography.styles.body,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
});