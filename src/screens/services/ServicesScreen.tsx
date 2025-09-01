/**
 * Pantalla de Servicios - Booky
 * Pantalla principal para gestión de servicios del profesional
 * Incluye buscador, listado y opción para crear servicios
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
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

  // Cargar servicios al montar el componente
  useEffect(() => {
    loadServices();
  }, []);

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
   * Obtener emoji por categoría basado en el nombre
   */
  const getServiceEmoji = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    if (name.includes('maquillaje') || name.includes('belleza') || name.includes('nail')) return '💄';
    if (name.includes('entrena') || name.includes('fitness') || name.includes('gym')) return '🏋';
    if (name.includes('limpieza') || name.includes('hogar') || name.includes('casa')) return '🏠';
    if (name.includes('reparar') || name.includes('pc') || name.includes('tech')) return '💻';
    if (name.includes('clase') || name.includes('inglés') || name.includes('educación')) return '📚';
    if (name.includes('masaje') || name.includes('salud') || name.includes('terapia')) return '💆';
    if (name.includes('chef') || name.includes('cocina') || name.includes('comida')) return '🍳';
    if (name.includes('conductor') || name.includes('transporte') || name.includes('uber')) return '🚗';
    return '⭐'; // Default
  };

  /**
   * Obtener color de fondo del icono
   */
  const getServiceColor = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    if (name.includes('maquillaje') || name.includes('belleza') || name.includes('nail')) return '#ff9a9e';
    if (name.includes('entrena') || name.includes('fitness') || name.includes('gym')) return '#a8edea';
    if (name.includes('limpieza') || name.includes('hogar') || name.includes('casa')) return '#ffecd2';
    if (name.includes('reparar') || name.includes('pc') || name.includes('tech')) return '#a8caba';
    if (name.includes('clase') || name.includes('inglés') || name.includes('educación')) return '#fbc2eb';
    if (name.includes('masaje') || name.includes('salud') || name.includes('terapia')) return '#fdcbf1';
    if (name.includes('chef') || name.includes('cocina') || name.includes('comida')) return '#ff9a56';
    if (name.includes('conductor') || name.includes('transporte') || name.includes('uber')) return '#4ecdc4';
    return colors.primary.light; // Default
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
      >
        {/* Indicador de disponibilidad */}
        <View style={[
          styles.availabilityDot, 
          service.Estado ? styles.available : styles.unavailable
        ]} />
        
        {/* Indicador de categoría inferior */}
        <View style={[
          styles.categoryIndicator,
          { backgroundColor: getServiceColor(service.Nombre) }
        ]} />
        
        {/* Icono del servicio */}
        <View style={[
          styles.serviceIcon,
          { backgroundColor: getServiceColor(service.Nombre) + '40' }
        ]}>
          <Text style={styles.serviceEmoji}>
            {getServiceEmoji(service.Nombre)}
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
    opacity: 0.7,
  },

  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },

  serviceEmoji: {
    fontSize: 20,
  },

  cardContent: {
    flex: 1,
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

  ratingContainer: {
    marginBottom: spacing.md,
  },

  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  stars: {
    color: '#ffc107',
    fontSize: 11,
  },

  ratingNumber: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
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
});