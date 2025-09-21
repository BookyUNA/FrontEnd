/**
 * Componente de Búsqueda de Servicios - Booky
 * Permite a los clientes buscar servicios de profesionales
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { Input } from '../forms/Input';
import { Button } from '../forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { 
  clientServicesService, 
  ServicioCliente, 
  SearchServicesResult 
} from '../../services/services/clientServicesService';

interface ServiceSearchProps {
  onServiceSelect?: (service: ServicioCliente) => void;
}

export const ServiceSearch: React.FC<ServiceSearchProps> = ({ 
  onServiceSelect 
}) => {
  // Estados para los filtros de búsqueda
  const [nombreServicio, setNombreServicio] = useState<string>('');
  const [nombreProfesional, setNombreProfesional] = useState<string>('');
  const [profesion, setProfesion] = useState<string>('');

  // Estados para los resultados
  const [servicios, setServicios] = useState<ServicioCliente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Cargar todos los servicios al iniciar
  useEffect(() => {
    loadAllServices();
  }, []);

  /**
   * Cargar todos los servicios disponibles
   */
  const loadAllServices = async () => {
    try {
      setIsLoading(true);
      const result = await clientServicesService.getAllServices();
      
      if (result.success && result.servicios) {
        setServicios(result.servicios);
        setHasSearched(true);
      } else {
        if (result.isNetworkError) {
          Alert.alert(
            'Error de Conexión',
            result.error || 'Revisa tu conexión a internet',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            result.error || 'No se pudieron cargar los servicios',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      Alert.alert('Error', 'Error inesperado al cargar servicios');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Realizar búsqueda con filtros
   */
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      
      const filters = {
        nombreServicio: nombreServicio.trim() || undefined,
        nombreProfesional: nombreProfesional.trim() || undefined,
        profesion: profesion.trim() || undefined,
      };

      const result = await clientServicesService.searchServices(filters);
      
      if (result.success && result.servicios) {
        setServicios(result.servicios);
        setHasSearched(true);
        
        if (result.servicios.length === 0) {
          Alert.alert(
            'Sin Resultados',
            'No se encontraron servicios con los filtros aplicados.',
            [{ text: 'OK' }]
          );
        }
      } else {
        if (result.isNetworkError) {
          Alert.alert(
            'Error de Conexión',
            result.error || 'Revisa tu conexión a internet',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            result.error || 'No se pudo realizar la búsqueda',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert('Error', 'Error inesperado en la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpiar filtros y mostrar todos los servicios
   */
  const handleClearFilters = () => {
    setNombreServicio('');
    setNombreProfesional('');
    setProfesion('');
    loadAllServices();
  };

  /**
   * Manejar refresh de la lista
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllServices();
    setIsRefreshing(false);
  };

  /**
   * Manejar selección de servicio
   */
  const handleServicePress = (service: ServicioCliente) => {
    if (onServiceSelect) {
      onServiceSelect(service);
    } else {
      // Mostrar detalles del servicio por defecto
      Alert.alert(
        service.nombreServicio,
        `Profesional: ${service.nombreProfesional}\n` +
        `Profesión: ${service.profesion}\n` +
        `Duración: ${service.duracionMinutos} min\n` +
        `Precio: $${service.precio.toFixed(2)}` +
        (service.permiteDescuento ? `\nDescuento: ${service.porcentajeDescuento}%` : ''),
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Renderizar un servicio en la lista
   */
  const renderServiceItem = ({ item }: { item: ServicioCliente }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.nombreServicio}</Text>
        <Text style={styles.servicePrice}>
          ${item.precio.toFixed(2)}
        </Text>
      </View>
      
      <Text style={styles.professionalName}>
        {item.nombreProfesional} - {item.profesion}
      </Text>
      
      <Text style={styles.serviceDescription} numberOfLines={2}>
        {item.descripcion}
      </Text>
      
      <View style={styles.serviceFooter}>
        <View style={styles.durationContainer}>
          <Icon name="clock" size={12} color={colors.text.secondary} />
          <Text style={styles.duration}>
            {item.duracionMinutos} min
          </Text>
        </View>
        
        {item.permiteDescuento && (
          <View style={styles.discountContainer}>
            <Icon name="tag" size={12} color={colors.states.success} />
            <Text style={styles.discount}>
              {item.porcentajeDescuento}% OFF
            </Text>
          </View>
        )}
      </View>
      
      <Button
        title="Ver Detalles"
        onPress={() => handleServicePress(item)}
        variant="outline"
        size="small"
      />
    </View>
  );

  /**
   * Verificar si hay algún filtro activo
   */
  const hasActiveFilters = () => {
    return nombreServicio.trim() !== '' || 
           nombreProfesional.trim() !== '' || 
           profesion.trim() !== '';
  };

  return (
    <View style={styles.container}>
      {/* Sección de Filtros */}
      <View style={styles.filtersSection}>
        <Text style={styles.sectionTitle}>Buscar Servicios</Text>
        
        <Input
          placeholder="Nombre del servicio"
          value={nombreServicio}
          onChangeText={setNombreServicio}
        />
        
        <Input
          placeholder="Nombre del profesional"
          value={nombreProfesional}
          onChangeText={setNombreProfesional}
        />
        
        <Input
          placeholder="Profesión"
          value={profesion}
          onChangeText={setProfesion}
        />
        
        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <View style={styles.searchButton}>
            <Button
              title="Buscar"
              onPress={handleSearch}
              disabled={isLoading}
              icon="search"
              iconPosition="left"
              fullWidth
            />
          </View>
          
          {hasActiveFilters() && (
            <View style={styles.clearButton}>
              <Button
                title="Limpiar"
                onPress={handleClearFilters}
                variant="outline"
                disabled={isLoading}
                icon="times"
                iconPosition="left"
                fullWidth
              />
            </View>
          )}
        </View>
      </View>

      {/* Sección de Resultados */}
      <View style={styles.resultsSection}>
        {/* Header de resultados */}
        {hasSearched && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} encontrado{servicios.length !== 1 ? 's' : ''}
            </Text>
            
            {hasActiveFilters() && (
              <Text style={styles.filtersActive}>
                Filtros aplicados
              </Text>
            )}
          </View>
        )}

        {/* Lista de servicios */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Buscando servicios...</Text>
          </View>
        ) : (
          <FlatList
            data={servicios}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.idServicio.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary.main]}
              />
            }
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              hasSearched ? (
                <View style={styles.emptyContainer}>
                  <Icon name="search" size={50} color={colors.text.disabled} />
                  <Text style={styles.emptyText}>
                    {hasActiveFilters() 
                      ? 'No se encontraron servicios con estos filtros'
                      : 'No hay servicios disponibles'
                    }
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  filtersSection: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  sectionTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },

  searchButton: {
    flex: 2,
  },

  clearButton: {
    flex: 1,
  },

  resultsSection: {
    flex: 1,
  },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  resultsCount: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },

  filtersActive: {
    ...typography.styles.caption,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  listContainer: {
    padding: spacing.lg,
  },

  serviceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  serviceName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },

  servicePrice: {
    ...typography.styles.h3,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },

  professionalName: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },

  serviceDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  duration: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },

  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.states.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },

  discount: {
    ...typography.styles.caption,
    color: colors.states.success,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xs,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },

  emptyText: {
    ...typography.styles.body,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});