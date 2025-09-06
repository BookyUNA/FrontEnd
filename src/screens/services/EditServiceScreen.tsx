/**
 * Pantalla de Editar Servicio - Booky
 * Formulario para la edición de servicios profesionales existentes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Input } from '../../components/forms/Input';
import { Button } from '../../components/forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { apiService } from '../../services/api/apiService';
import { authService } from '../../services/auth/authService';
import { API_CONFIG } from '../../config/api';

interface EditServiceScreenProps {
  navigation?: any;
  route?: any;
}

interface Servicio {
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

interface ApiError {
  ErrorCode: number;
  Message: string;
}

interface ApiResponse {
  error: ApiError[];
  resultado: boolean;
}

// Request para actualizar servicio
interface ReqActualizarServicio {
  idServicio: number;
  nombre: string;
  descripcion: string;
  duracionMinutos: number;
  precio: number;
  permiteDescuento: boolean;
  porcentajeDescuento: number;
  estado: boolean;
}

export const EditServiceScreen: React.FC<EditServiceScreenProps> = ({ 
  navigation,
  route 
}) => {
  // Obtener servicio de los parámetros de navegación
  const service: Servicio = route?.params?.service;

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [activarDescuento, setActivarDescuento] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState('');
  
  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  /**
   * Cargar datos del servicio al inicializar el componente
   */
  useEffect(() => {
    if (service) {
      setNombre(service.Nombre);
      setDescripcion(service.Descripcion);
      setDuracion(service.DuracionMinutos.toString());
      setPrecio(service.Precio.toLocaleString('es-CR'));
      setActivarDescuento(service.PermiteDescuento);
      setPorcentajeDescuento(service.PorcentajeDescuento > 0 ? service.PorcentajeDescuento.toString() : '');
    }
  }, [service]);

  /**
   * Formatear precio con máscara de moneda
   */
  const formatPrice = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue === '') return '';
    
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('es-CR');
  };

  /**
   * Manejar cambio en el precio
   */
  const handlePriceChange = (value: string) => {
    const formatted = formatPrice(value);
    setPrecio(formatted);
    
    if (errors.precio) {
      setErrors(prev => ({ ...prev, precio: '' }));
    }
  };

  /**
   * Obtener valor numérico del precio
   */
  const getPriceValue = () => {
    return parseInt(precio.replace(/[^0-9]/g, '') || '0', 10);
  };

  /**
   * Validar formulario
   */
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validar nombre
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del servicio es obligatorio';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar descripción
    if (!descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    } else if (descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    // Validar duración
    const duracionNum = parseInt(duracion);
    if (!duracion || isNaN(duracionNum)) {
      newErrors.duracion = 'La duración es obligatoria';
    } else if (duracionNum <= 0) {
      newErrors.duracion = 'La duración debe ser mayor a 0';
    } else if (duracionNum > 720) {
      newErrors.duracion = 'La duración no puede ser mayor a 720 minutos (12 horas)';
    }

    // Validar precio
    const precioNum = getPriceValue();
    if (precioNum <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }

    // Validar descuento si está activado
    if (activarDescuento) {
      const descuentoNum = parseFloat(porcentajeDescuento);
      if (!porcentajeDescuento || isNaN(descuentoNum)) {
        newErrors.porcentajeDescuento = 'El porcentaje de descuento es obligatorio';
      } else if (descuentoNum <= 0) {
        newErrors.porcentajeDescuento = 'El descuento debe ser mayor a 0%';
      } else if (descuentoNum >= 100) {
        newErrors.porcentajeDescuento = 'El descuento debe ser menor a 100%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Actualizar servicio mediante API
   */
  const handleUpdateService = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setIsLoading(true);

    try {
      // Verificar autenticación
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        Alert.alert('Error', 'Debes iniciar sesión para editar un servicio');
        return;
      }

      // Obtener token
      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Error', 'Token de acceso no disponible');
        return;
      }

      // Preparar datos para enviar al API
      const requestData: ReqActualizarServicio = {
        idServicio: service.IdServicio,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        duracionMinutos: parseInt(duracion),
        precio: getPriceValue(),
        permiteDescuento: activarDescuento,
        porcentajeDescuento: activarDescuento ? parseFloat(porcentajeDescuento) : 0,
        estado: true
      };

      console.log('📋 Actualizando servicio:', requestData);

      // Realizar petición al endpoint usando apiService
      const response = await apiService.post<ApiResponse>(
        API_CONFIG.ENDPOINTS.ACTUALIZAR_SERVICIO || '/Servicios/ActualizarServicio',
        requestData,
        token
      );

      console.log('📋 Respuesta:', response);

      if (!response.success) {
        throw new Error(response.error || 'Error de conexión');
      }

      const data = response.data;

      // Verificar el resultado de la operación
      if (data?.resultado) {
        Alert.alert(
          'Éxito',
          'El servicio ha sido actualizado exitosamente',
          [
            {
              text: 'Continuar',
              onPress: handleGoBack,
            },
          ]
        );
      } else {
        // Manejar errores del servidor
        const errorMessage = data?.error && data.error.length > 0 
          ? data.error.map(err => err.Message).join('\n')
          : 'Error al actualizar el servicio';
        
        Alert.alert('Error', errorMessage);
      }

    } catch (error: any) {
      console.error('📋 Error actualizando servicio:', error);
      
      Alert.alert(
        'Error',
        error.message || 'Error al actualizar el servicio. Verifica tu conexión e intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navegar de regreso
   */
  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  /**
   * Manejar cambio en el switch de descuento
   */
  const handleDiscountToggle = (value: boolean) => {
    setActivarDescuento(value);
    if (!value) {
      setPorcentajeDescuento('');
      if (errors.porcentajeDescuento) {
        setErrors(prev => ({ ...prev, porcentajeDescuento: '' }));
      }
    }
  };

  // Verificar que se haya pasado un servicio
  if (!service) {
    return (
      <SafeContainer>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color={colors.states.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            No se pudo cargar la información del servicio
          </Text>
          <Button
            title="Volver"
            onPress={handleGoBack}
            variant="primary"
          />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            disabled={isLoading}
          >
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.subtitle}>
              Modifica la información de tu servicio
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre del servicio */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Nombre del servicio <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                if (errors.nombre) {
                  setErrors(prev => ({ ...prev, nombre: '' }));
                }
              }}
              placeholder="Ej: Corte de cabello"
              autoCapitalize="words"
              disabled={isLoading}
            />
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
          </View>

          {/* Descripción */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Descripción <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={descripcion}
              onChangeText={(text) => {
                setDescripcion(text);
                if (errors.descripcion) {
                  setErrors(prev => ({ ...prev, descripcion: '' }));
                }
              }}
              placeholder="Describe tu servicio en detalle..."
              autoCapitalize="sentences"
              disabled={isLoading}
            />
            {errors.descripcion && <Text style={styles.errorText}>{errors.descripcion}</Text>}
          </View>

          {/* Duración */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Duración (minutos) <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={duracion}
              onChangeText={(text) => {
                setDuracion(text.replace(/[^0-9]/g, ''));
                if (errors.duracion) {
                  setErrors(prev => ({ ...prev, duracion: '' }));
                }
              }}
              placeholder="60"
              keyboardType="numeric"
              disabled={isLoading}
            />
            {errors.duracion && <Text style={styles.errorText}>{errors.duracion}</Text>}
          </View>

          {/* Precio */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Precio <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>₡</Text>
              <View style={styles.inputWrapper}>
                <Input
                  value={precio}
                  onChangeText={handlePriceChange}
                  placeholder="0"
                  keyboardType="numeric"
                  disabled={isLoading}
                />
              </View>
            </View>
            {errors.precio && <Text style={styles.errorText}>{errors.precio}</Text>}
          </View>

          {/* Activar descuento */}
          <View style={styles.field}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Icon 
                  name="percentage" 
                  size={16} 
                  color={colors.text.primary} 
                  style={styles.switchIcon}
                />
                <Text style={styles.label}>Activar descuento</Text>
              </View>
              <Switch
                value={activarDescuento}
                onValueChange={handleDiscountToggle}
                trackColor={{ 
                  false: colors.background.tertiary, 
                  true: colors.primary.light 
                }}
                thumbColor={activarDescuento ? colors.primary.main : colors.text.tertiary}
                disabled={isLoading}
              />
            </View>
          </View>

          {/* Porcentaje de descuento */}
          {activarDescuento && (
            <View style={styles.field}>
              <Text style={styles.label}>
                Porcentaje de descuento <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.percentageContainer}>
                <View style={styles.inputWrapper}>
                  <Input
                    value={porcentajeDescuento}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/[^0-9.]/g, '');
                      const parts = cleanText.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      setPorcentajeDescuento(cleanText);
                      if (errors.porcentajeDescuento) {
                        setErrors(prev => ({ ...prev, porcentajeDescuento: '' }));
                      }
                    }}
                    placeholder="15"
                    keyboardType="numeric"
                    disabled={isLoading}
                  />
                </View>
                <Text style={styles.percentageSymbol}>%</Text>
              </View>
              {errors.porcentajeDescuento && (
                <Text style={styles.errorText}>{errors.porcentajeDescuento}</Text>
              )}
            </View>
          )}
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <Button
            title="Actualizar Servicio"
            onPress={handleUpdateService}
            variant="primary"
            icon="check"
            loading={isLoading}
            disabled={isLoading}
          />
          
          <View style={styles.cancelButtonContainer}>
            <Button
              title="Cancelar"
              onPress={handleGoBack}
              variant="outline"
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  header: {
    marginBottom: spacing.xl,
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  headerContent: {
    alignItems: 'center',
  },

  headerIcon: {
    marginBottom: spacing.md,
    opacity: 0.8,
  },

  title: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  form: {
    flex: 1,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  required: {
    color: colors.states.error,
  },

  errorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    marginTop: spacing.xs,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },

  currencySymbol: {
    ...typography.styles.body,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    fontWeight: '600',
  },

  inputWrapper: {
    flex: 1,
  },

  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },

  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  switchIcon: {
    marginRight: spacing.sm,
  },

  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },

  percentageSymbol: {
    ...typography.styles.body,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    fontWeight: '600',
  },

  buttonContainer: {
    marginTop: spacing.xl,
  },

  cancelButtonContainer: {
    marginTop: spacing.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  errorTitle: {
    ...typography.styles.h2,
    color: colors.states.error,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  errorMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});