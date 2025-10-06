/**
 * Componente de Búsqueda de Servicios - Booky
 * Permite a los clientes buscar servicios con campos dinámicos según filtros seleccionados
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { Input } from '../forms/Input';
import { Button } from '../forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { PROFESIONES } from '../../constants/profesiones';
import { 
  clientServicesService, 
  ServicioCliente, 
  SearchServicesResult 
} from '../../services/services/clientServicesService';

interface ServiceSearchProps {
  onServiceSelect?: (service: ServicioCliente) => void;
}

interface FilterOption {
  id: string;
  label: string;
  field: string;
  placeholder: string;
  selected: boolean;
  type?: 'text' | 'select';
}

interface SearchValues {
  [key: string]: string;
}

export const ServiceSearch: React.FC<ServiceSearchProps> = ({ 
  onServiceSelect 
}) => {
  // Estados para los filtros
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([
    { 
      id: 'nombre', 
      label: 'Nombre del servicio', 
      field: 'nombreServicio', 
      placeholder: 'Ej: Terapia, Masaje, Consulta...',
      selected: true,
      type: 'text'
    },
    { 
      id: 'profesional', 
      label: 'Nombre profesional', 
      field: 'nombreProfesional', 
      placeholder: 'Ej: Alberto, María, Carlos...',
      selected: false,
      type: 'text'
    },
    { 
      id: 'profesion', 
      label: 'Profesión', 
      field: 'profesion', 
      placeholder: 'Selecciona una profesión',
      selected: false,
      type: 'select'
    },
  ]);

  // Estados para los valores de búsqueda
  const [searchValues, setSearchValues] = useState<SearchValues>({
    nombre: '',
    profesional: '',
    profesion: '',
  });

  // Estados para el dropdown de filtros
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Estados para el modal de profesiones
  const [isProfessionModalOpen, setIsProfessionModalOpen] = useState<boolean>(false);

  // Estados para el panel de búsqueda colapsable
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const searchHeight = useRef(new Animated.Value(0)).current;

  // Estados para los resultados
  const [servicios, setServicios] = useState<ServicioCliente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Cargar todos los servicios al iniciar
  useEffect(() => {
    loadAllServices();
  }, []);

  // Efecto para recalcular altura cuando cambian los filtros seleccionados
  useEffect(() => {
    if (isSearchExpanded) {
      const selectedFilters = getSelectedFilters();
      const baseHeight = 200;
      const fieldHeight = 80;
      const dynamicHeight = baseHeight + (selectedFilters.length * fieldHeight);
      const maxHeight = 310;
      const newHeight = Math.min(dynamicHeight, maxHeight);
      
      Animated.timing(searchHeight, {
        toValue: newHeight,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [filterOptions, isSearchExpanded]);

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
      Alert.alert('Error', 'Error inesperado al cargar servicios');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Alternar panel de búsqueda
   */
  const toggleSearchPanel = () => {
    const selectedFilters = getSelectedFilters();
    const baseHeight = 200;
    const fieldHeight = 80;
    const dynamicHeight = baseHeight + (selectedFilters.length * fieldHeight);
    const maxHeight = 400;
    
    const targetHeight = isSearchExpanded ? 0 : Math.min(dynamicHeight, maxHeight);
    
    setIsSearchExpanded(!isSearchExpanded);
    
    Animated.timing(searchHeight, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  /**
   * Manejar cambio de selección en los filtros
   */
  const handleFilterToggle = (filterId: string) => {
    setFilterOptions(prev => prev.map(filter => 
      filter.id === filterId 
        ? { ...filter, selected: !filter.selected }
        : filter
    ));
  };

  /**
   * Manejar cambio en los valores de búsqueda
   */
  const handleSearchValueChange = (filterId: string, value: string) => {
    setSearchValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  /**
   * Obtener los filtros seleccionados
   */
  const getSelectedFilters = () => {
    return filterOptions.filter(filter => filter.selected);
  };

  /**
   * Construir los filtros para la búsqueda
   */
  const buildSearchFilters = () => {
    const selectedFilters = getSelectedFilters();
    const filters: any = {};
    
    selectedFilters.forEach(filter => {
      const value = searchValues[filter.id]?.trim();
      if (value) {
        filters[filter.field] = value;
      }
    });
    
    return filters;
  };

  /**
   * Verificar si hay valores de búsqueda
   */
  const hasSearchValues = () => {
    const selectedFilters = getSelectedFilters();
    return selectedFilters.some(filter => searchValues[filter.id]?.trim());
  };

  /**
   * Realizar búsqueda
   */
  const handleSearch = async () => {
    const selectedFilters = getSelectedFilters();
    
    if (selectedFilters.length === 0) {
      loadAllServices();
      return;
    }

    if (!hasSearchValues()) {
      Alert.alert(
        'Búsqueda Vacía',
        'Ingresa al menos un valor para buscar',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);
      
      const filters = buildSearchFilters();
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
      Alert.alert('Error', 'Error inesperado en la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpiar búsqueda y mostrar todos los servicios
   */
  const handleClearSearch = () => {
    setSearchValues({
      nombre: '',
      profesional: '',
      profesion: '',
    });
    loadAllServices();
  };

  /**
   * Alternar dropdown
   */
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  /**
   * Cerrar dropdown
   */
  const closeDropdown = () => {
    setIsDropdownOpen(false);
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
      Alert.alert(
        service.nombreServicio,
        `Profesional: ${service.nombreProfesional}\n` +
        `Profesión: ${service.profesion}\n` +
        `Duración: ${service.duracionMinutos} min\n` +
        `Precio: ₡${service.precio.toFixed(2)}` +
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
          ₡{item.precio.toFixed(2)}
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
   * Renderizar opción de filtro en el dropdown
   */
  const renderFilterOption = (filter: FilterOption) => (
    <TouchableOpacity
      key={filter.id}
      style={styles.filterOption}
      onPress={() => handleFilterToggle(filter.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, filter.selected && styles.checkboxSelected]}>
        {filter.selected && (
          <Icon name="check" size={12} color={colors.background.primary} />
        )}
      </View>
      <Text style={styles.filterOptionText}>{filter.label}</Text>
    </TouchableOpacity>
  );

  /**
   * Obtener texto de filtros activos de forma compacta
   */
  const getFiltersText = () => {
    const selected = getSelectedFilters();
    if (selected.length === 0) return 'Seleccionar';
    if (selected.length === 1) {
      const filter = selected[0];
      if (filter.id === 'nombre') return 'Servicio';
      if (filter.id === 'profesional') return 'Profesional';
      if (filter.id === 'profesion') return 'Profesión';
    }
    return `${selected.length} campos`;
  };

  /**
   * Renderizar campos de búsqueda dinámicos
   */
  const renderSearchFields = () => {
    const selectedFilters = getSelectedFilters();
    
    if (selectedFilters.length === 0) {
      return (
        <View style={styles.noFiltersContainer}>
          <Text style={styles.noFiltersText}>
            Selecciona al menos un campo para buscar
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.searchFieldsContainer}>
        {selectedFilters.map(filter => (
          <View key={filter.id} style={styles.searchField}>
            <Text style={styles.fieldLabel}>{filter.label}</Text>
            {filter.type === 'select' ? (
              <TouchableOpacity
                style={styles.professionSelector}
                onPress={() => setIsProfessionModalOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.professionSelectorText,
                  !searchValues[filter.id] && styles.professionSelectorPlaceholder
                ]}>
                  {searchValues[filter.id] || filter.placeholder}
                </Text>
                <Icon name="chevron-down" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            ) : (
              <Input
                placeholder={filter.placeholder}
                value={searchValues[filter.id]}
                onChangeText={(value) => handleSearchValueChange(filter.id, value)}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Botón para expandir/contraer búsqueda */}
      <View style={styles.searchToggleContainer}>
        <TouchableOpacity
          style={styles.searchToggleButton}
          onPress={toggleSearchPanel}
          activeOpacity={0.7}
        >
          <Icon 
            name="search" 
            size={16} 
            color={colors.primary.main} 
          />
          <Text style={styles.searchToggleText}>
            {isSearchExpanded ? 'Ocultar búsqueda' : 'Buscar servicios'}
          </Text>
          <Icon 
            name={isSearchExpanded ? "chevron-up" : "chevron-down"} 
            size={14} 
            color={colors.primary.main} 
          />
        </TouchableOpacity>
      </View>

      {/* Panel de búsqueda colapsable */}
      <Animated.View style={[styles.searchPanel, { height: searchHeight }]}>
        <ScrollView 
          style={styles.searchScrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.searchContent}>
            <Text style={styles.sectionTitle}>Buscar Servicios</Text>
            
            {/* Selector de filtros */}
            <View style={styles.filterSelectorContainer}>
              <Text style={styles.filterSelectorLabel}>Buscar por:</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={toggleDropdown}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {getFiltersText()}
                </Text>
                <Icon 
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={12} 
                  color={colors.text.secondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Campos de búsqueda dinámicos */}
            {renderSearchFields()}
            
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
              
              {hasSearchValues() && (
                <View style={styles.clearButton}>
                  <Button
                    title="Limpiar"
                    onPress={handleClearSearch}
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
        </ScrollView>
      </Animated.View>

      {/* Modal de filtros */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeDropdown}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Seleccionar campos de búsqueda</Text>
              <TouchableOpacity
                onPress={closeDropdown}
                style={styles.closeButton}
              >
                <Icon name="times" size={14} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filtersList}>
              {filterOptions.map(renderFilterOption)}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de profesiones */}
      <Modal
        visible={isProfessionModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsProfessionModalOpen(false)}
      >
        <View style={styles.professionModalOverlay}>
          <View style={styles.professionModalContent}>
            <View style={styles.professionModalHeader}>
              <Text style={styles.professionModalTitle}>Selecciona una profesión</Text>
              <TouchableOpacity onPress={() => setIsProfessionModalOpen(false)}>
                <Icon name="times" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.professionModalList}>
              <TouchableOpacity
                style={[
                  styles.professionModalItem,
                  !searchValues.profesion && styles.professionModalItemSelected
                ]}
                onPress={() => {
                  handleSearchValueChange('profesion', '');
                  setIsProfessionModalOpen(false);
                }}
              >
                <Text style={[
                  styles.professionModalItemText,
                  !searchValues.profesion && styles.professionModalItemTextSelected
                ]}>
                  Todas las profesiones
                </Text>
                {!searchValues.profesion && (
                  <Icon name="check" size={16} color={colors.primary.main} />
                )}
              </TouchableOpacity>
              {PROFESIONES.map((prof) => (
                <TouchableOpacity
                  key={prof}
                  style={[
                    styles.professionModalItem,
                    searchValues.profesion === prof && styles.professionModalItemSelected
                  ]}
                  onPress={() => {
                    handleSearchValueChange('profesion', prof);
                    setIsProfessionModalOpen(false);
                  }}
                >
                  <Text style={[
                    styles.professionModalItemText,
                    searchValues.profesion === prof && styles.professionModalItemTextSelected
                  ]}>
                    {prof}
                  </Text>
                  {searchValues.profesion === prof && (
                    <Icon name="check" size={16} color={colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sección de Resultados */}
      <View style={styles.resultsSection}>
        {/* Header de resultados */}
        {hasSearched && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} encontrado{servicios.length !== 1 ? 's' : ''}
            </Text>
            
            {hasSearchValues() && (
              <Text style={styles.searchActive}>
                Búsqueda activa
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
                    {hasSearchValues() 
                      ? 'No se encontraron servicios con estos criterios'
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

  searchToggleContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  searchToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  searchToggleText: {
    ...typography.styles.body,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
  },

  searchPanel: {
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },

  searchScrollView: {
    flex: 1,
  },

  searchContent: {
    padding: spacing.lg,
  },

  sectionTitle: {
    ...typography.styles.h1,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  filterSelectorContainer: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  filterSelectorLabel: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    flex: 1,
    minHeight: 36,
  },

  dropdownButtonText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownModal: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.lg,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: colors.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  dropdownTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },

  closeButton: {
    padding: spacing.xs,
  },

  filtersList: {
    gap: spacing.sm,
  },

  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },

  filterOptionText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  searchFieldsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  searchField: {
    gap: spacing.xs,
  },

  fieldLabel: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },

  professionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },

  professionSelectorText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  professionSelectorPlaceholder: {
    color: colors.text.secondary,
  },

  professionModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },

  professionModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: '80%',
  },

  professionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  professionModalTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
  },

  professionModalList: {
    maxHeight: 400,
  },

  professionModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  professionModalItemSelected: {
    backgroundColor: colors.primary.light + '20',
  },

  professionModalItemText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  professionModalItemTextSelected: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },

  noFiltersContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },

  noFiltersText: {
    ...typography.styles.body,
    color: colors.text.disabled,
    textAlign: 'center',
  },

  actionButtons: {
    flexDirection: 'row',
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

  searchActive: {
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