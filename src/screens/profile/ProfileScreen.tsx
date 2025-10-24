/**
 * Pantalla de Perfil - Booky
 * Sistema de reservas para profesionales independientes
 * Con sección de perfil profesional para profesionales
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { authService } from '../../services/auth/authService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { userService, ApiProfileResponse, EditProfileRequest } from '../../services/user/userService';
import { jwtDecoder } from '../../utils/jwtDecoder';
import { PROFESIONES } from '../../constants/profesiones';

// =============================================
// INTERFACES Y MODELOS
// =============================================

interface UserProfile {
  Nombre: string;
  email: string;
  cedula: string;
  telefono: string | null;
  role?: string;
  profesion?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  calificacionPromedio?: number | null;
  totalCalificaciones?: number | null;
}

interface EditableUserData {
  Nombre: string;
  Telefono: string;
}

interface EditableProfessionalData {
  profesion: string;
  descripcion: string;
  direccion: string;
}

interface ValidationErrors {
  Nombre?: string;
  Telefono?: string;
}

interface ProfessionalValidationErrors {
  profesion?: string;
  descripcion?: string;
  direccion?: string;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

interface ProfileScreenProps {
    onLogout?: () => void;
    isLoggingOut?: boolean;
    navigation?: any; 
  }

const mapApiProfileToUserProfile = (api: ApiProfileResponse): UserProfile => ({
  Nombre: api.Nombre,
  email: api.Correo,
  cedula: api.Cedula,
  telefono: api.Telefono || null,
  profesion: api.Profesion || null,
  descripcion: api.Descripcon || null,
  direccion: api.Direccion || null,
  calificacionPromedio: api.CalificacionPromedio || null,
  totalCalificaciones: api.TotalCalificaciones || null,
});

const renderRatingStars = (rating: number, size: number = 16) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon key={`full-${i}`} name="star" size={size} color={colors.states.warning} solid />
      ))}
      {hasHalfStar && (
        <Icon name="star-half-alt" size={size} color={colors.states.warning} solid />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon key={`empty-${i}`} name="star" size={size} color={colors.border.light} />
      ))}
    </View>
  );
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onLogout, 
  isLoggingOut = false,
  navigation
}) => {
  
  // Estados principales
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string>('Cliente');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [ratingData, setRatingData] = useState<{
  calificacionPromedio: number;
  totalCalificaciones: number;
  isLoading: boolean;
}>({
  calificacionPromedio: 0,
  totalCalificaciones: 0,
  isLoading: false,
});
  
  // Estados para perfil profesional
  const [isEditingProfessional, setIsEditingProfessional] = useState<boolean>(false);
  const [isSavingProfessional, setIsSavingProfessional] = useState<boolean>(false);
  const [showProfessionModal, setShowProfessionModal] = useState<boolean>(false);
  const [professionalData, setProfessionalData] = useState<EditableProfessionalData>({
    profesion: '',
    descripcion: '',
    direccion: '',
  });
  
  // Estados de edición (solo para campos editables de usuario)
  const [editData, setEditData] = useState<EditableUserData>({
    Nombre: '',
    Telefono: '',
  });
  
  // Estados de validación
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [professionalErrors, setProfessionalErrors] = useState<ProfessionalValidationErrors>({});
  // =============================================
  // EFECTOS Y CARGA DE DATOS
  // =============================================

  useEffect(() => {
    loadUserProfile();
    loadUserRoleFromToken();
  }, []);

  const loadUserRoleFromToken = async () => {
    try {
      console.log('📱 ProfileScreen: Extrayendo rol del token...');
      const token = await authService.getToken();
      
      if (token) {
        const role = jwtDecoder.getUserRole(token);
        if (role) {
          console.log('📱 ProfileScreen: Rol extraído del token:', role);
          setUserRole(role);
        } else {
          console.warn('📱 ProfileScreen: No se pudo extraer el rol del token');
        }
      } else {
        console.warn('📱 ProfileScreen: No hay token disponible');
      }
    } catch (error) {
      // Error silencioso
    }
  };

const loadUserProfile = async () => {
  try {
    setIsLoading(true);
    console.log('📱 ProfileScreen: Cargando perfil del usuario...');
    
    const apiProfile = await userService.getProfile();
    console.log('📱 ProfileScreen: Perfil obtenido:', apiProfile);
    
    const profile = mapApiProfileToUserProfile(apiProfile);
    setUserProfile(profile);

    // Inicializar datos editables de usuario
    setEditData({
      Nombre: profile.Nombre,
      Telefono: profile.telefono || '',
    });

    // Inicializar datos editables de profesional
    setProfessionalData({
      profesion: profile.profesion || '',
      descripcion: profile.descripcion || '',
      direccion: profile.direccion || '',
    });

    console.log('📱 ProfileScreen: Perfil procesado y establecido correctamente');
    
    if (apiProfile.IdPerfil && profile.role === 'Profesional') {
      await loadProfessionalRating(apiProfile.IdPerfil);
    }
    
  } catch (error: any) {
    Alert.alert(
      'Error',
      error.message || 'No se pudo cargar la información del perfil. Intenta de nuevo.',
      [{ text: 'Entendido' }]
    );
  } finally {
    setIsLoading(false);
  }
};

  // =============================================
  // VALIDACIONES
  // =============================================

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validar Nombre
    if (!editData.Nombre.trim()) {
      newErrors.Nombre = 'El Nombre es obligatorio';
    } else if (editData.Nombre.trim().length < 2) {
      newErrors.Nombre = 'El Nombre debe tener al menos 2 caracteres';
    } else if (editData.Nombre.trim().length > 100) {
      newErrors.Nombre = 'El Nombre no puede exceder 100 caracteres';
    }

    // Validar teléfono
    if (editData.Telefono.trim()) {
      if (!userService.validateCostaRicanPhone(editData.Telefono.trim())) {
        newErrors.Telefono = 'El teléfono debe tener exactamente 8 dígitos y empezar con 2, 6, 7 u 8';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProfessionalForm = (): boolean => {
    const newErrors: ProfessionalValidationErrors = {};

    // Validar profesión
    if (!professionalData.profesion.trim()) {
      newErrors.profesion = 'Debes seleccionar una profesión';
    }

    // Validar descripción
    if (!professionalData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    } else if (professionalData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    } else if (professionalData.descripcion.trim().length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar dirección
    if (!professionalData.direccion.trim()) {
      newErrors.direccion = 'La dirección es obligatoria';
    } else if (professionalData.direccion.trim().length < 5) {
      newErrors.direccion = 'La dirección debe tener al menos 5 caracteres';
    } else if (professionalData.direccion.trim().length > 200) {
      newErrors.direccion = 'La dirección no puede exceder 200 caracteres';
    }

    setProfessionalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================
  // HANDLERS - PERFIL DE USUARIO
  // =============================================

  const handleStartEdit = () => {
    console.log('📱 ProfileScreen: Iniciando edición del perfil');
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    console.log('📱 ProfileScreen: Cancelando edición del perfil');
    if (userProfile) {
      setEditData({
        Nombre: userProfile.Nombre,
        Telefono: userProfile.telefono || '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handleSaveChanges = async () => {
    console.log('📱 ProfileScreen: Intentando guardar cambios del perfil');
    
    if (!validateForm()) {
      Alert.alert(
        'Datos Inválidos',
        'Por favor corrige los errores antes de guardar.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      setIsSaving(true);
      console.log('📱 ProfileScreen: Datos a guardar:', editData);

      const updateData: EditProfileRequest = {
        Nombre: editData.Nombre.trim(),
        Telefono: editData.Telefono.trim(),
      };

      const result = await userService.updateProfile(updateData);
      
      if (result.success) {
        console.log('📱 ProfileScreen: Perfil actualizado exitosamente');
        
        setUserProfile(prev => prev ? {
          ...prev,
          Nombre: editData.Nombre.trim(),
          telefono: editData.Telefono.trim() || null
        } : prev);

        setIsEditing(false);
        setErrors({});

        Alert.alert(
          'Éxito',
          'Los cambios se guardaron correctamente.',
          [{ text: 'Entendido' }]
        );
        
        await loadUserProfile();
        
      } else {
        if (result.isNetworkError) {
          Alert.alert(
            'Error de Conexión',
            result.error || 'Hubo un problema de conexión. Verifica tu conexión a internet e intenta de nuevo.',
            [{ text: 'Entendido' }]
          );
        } else {
          Alert.alert(
            'Error',
            result.error || 'Hubo un problema al guardar los cambios. Intenta de nuevo.',
            [{ text: 'Entendido' }]
          );
        }
      }
      
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================
  // HANDLERS - PERFIL PROFESIONAL
  // =============================================

  const handleStartEditProfessional = () => {
    console.log('📱 ProfileScreen: Iniciando edición del perfil profesional');
    setIsEditingProfessional(true);
    setProfessionalErrors({});
  };

  const handleCancelEditProfessional = () => {
    console.log('📱 ProfileScreen: Cancelando edición del perfil profesional');
    if (userProfile) {
      setProfessionalData({
        profesion: userProfile.profesion || '',
        descripcion: userProfile.descripcion || '',
        direccion: userProfile.direccion || '',
      });
    }
    setIsEditingProfessional(false);
    setProfessionalErrors({});
  };

  const handleSaveProfessionalChanges = async () => {
    console.log('📱 ProfileScreen: Intentando guardar cambios del perfil profesional');
    
    if (!validateProfessionalForm()) {
      Alert.alert(
        'Datos Inválidos',
        'Por favor corrige los errores antes de guardar.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      setIsSavingProfessional(true);
      console.log('📱 ProfileScreen: Datos profesionales a guardar:', professionalData);

      const updateData = {
        profesion: professionalData.profesion.trim(),
        descripcion: professionalData.descripcion.trim(),
        direccion: professionalData.direccion.trim(),
      };

      const result = await userService.updateProfessionalProfile(updateData);
      
      if (result.success) {
        console.log('📱 ProfileScreen: Perfil profesional actualizado exitosamente');
        
        setUserProfile(prev => prev ? {
          ...prev,
          profesion: professionalData.profesion.trim(),
          descripcion: professionalData.descripcion.trim(),
          direccion: professionalData.direccion.trim()
        } : prev);

        setIsEditingProfessional(false);
        setProfessionalErrors({});

        Alert.alert(
          'Éxito',
          'Los cambios del perfil profesional se guardaron correctamente.',
          [{ text: 'Entendido' }]
        );
        
        await loadUserProfile();
        
      } else {
        if (result.isNetworkError) {
          Alert.alert(
            'Error de Conexión',
            result.error || 'Hubo un problema de conexión. Verifica tu conexión a internet e intenta de nuevo.',
            [{ text: 'Entendido' }]
          );
        } else {
          Alert.alert(
            'Error',
            result.error || 'Hubo un problema al guardar los cambios. Intenta de nuevo.',
            [{ text: 'Entendido' }]
          );
        }
      }
      
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsSavingProfessional(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 ProfileScreen: Usuario confirmó logout, iniciando proceso...');
              
              const logoutResult = await authService.logout();
              console.log('🚪 ProfileScreen: Resultado del logout:', logoutResult);
              
              if (logoutResult.success) {
                if (logoutResult.isNetworkError) {
                  Alert.alert(
                    'Sesión Cerrada',
                    'Se cerró la sesión localmente. Hubo un problema de conexión con el servidor.',
                    [{
                      text: 'Entendido',
                      onPress: () => {
                        if (onLogout) {
                          onLogout();
                        }
                      }
                    }]
                  );
                } else {
                  console.log('🚪 ProfileScreen: Logout exitoso, redirigiendo al login...');
                  if (onLogout) {
                    onLogout();
                  }
                }
              } else {
                console.warn('🚪 ProfileScreen: Logout con advertencias:', logoutResult.error);
                if (onLogout) {
                  onLogout();
                }
              }
              
            } catch (error: unknown) {
              Alert.alert(
                'Error',
                'Hubo un problema al cerrar sesión. Se cerrará la sesión localmente.',
                [{
                  text: 'Entendido',
                  onPress: () => {
                    if (onLogout) {
                      onLogout();
                    }
                  }
                }]
              );
            }
          },
        },
      ]
    );
  };

const loadProfessionalRating = async (idPerfil: number) => {
  if (!idPerfil || idPerfil <= 0) {
    console.log('⭐ ProfileScreen: IdPerfil inválido');
    return;
  }

  setRatingData(prev => ({ ...prev, isLoading: true }));

  try {
    console.log('⭐ ProfileScreen: Cargando calificación del perfil:', idPerfil);
    
    const result = await userService.getProfessionalRating(idPerfil);

    if (result.success && result.calificacionPromedio !== undefined) {
      console.log('⭐ ProfileScreen: Calificación obtenida:', result.calificacionPromedio);
      setRatingData({
        calificacionPromedio: result.calificacionPromedio,
        totalCalificaciones: 0, // La API no devuelve este valor, pero lo dejamos por si se agrega después
        isLoading: false,
      });
    } else {
      console.log('⭐ ProfileScreen: No se pudo obtener calificación');
      setRatingData({
        calificacionPromedio: 0,
        totalCalificaciones: 0,
        isLoading: false,
      });
    }
  } catch (error) {
    console.error('⭐ ProfileScreen: Error al cargar calificación:', error);
    setRatingData({
      calificacionPromedio: 0,
      totalCalificaciones: 0,
      isLoading: false,
    });
  }
};

  // =============================================
  // COMPONENTES DE RENDERIZADO
  // =============================================

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Icon name="spinner" size={30} color={colors.primary.main} />
      <Text style={styles.loadingText}>Cargando perfil...</Text>
    </View>
  );

  const renderEditableField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    placeholder?: string,
    keyboardType?: 'default' | 'email-address' | 'phone-pad',
    maxLength?: number,
    multiline?: boolean
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline ? styles.textInputMultiline : null,
          error ? styles.inputError : null,
          !isEditing && !isEditingProfessional ? styles.disabledInput : null
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={isEditing || isEditingProfessional}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {maxLength && (isEditing || isEditingProfessional) && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );

  const renderReadOnlyField = (label: string, value: string, icon?: string) => (
    <View style={styles.readOnlyFieldContainer}>
      <View style={styles.readOnlyFieldHeader}>
        {icon && <Icon name={icon} size={16} color={colors.text.secondary} />}
        <Text style={styles.readOnlyFieldLabel}>{label}</Text>
      </View>
      <Text style={styles.readOnlyFieldValue}>{value}</Text>
    </View>
  );

  const renderRatingField = (label: string, rating: number | null, totalRatings: number | null) => (
    <View style={styles.readOnlyFieldContainer}>
      <View style={styles.readOnlyFieldHeader}>
        <Icon name="star" size={16} color={colors.text.secondary} />
        <Text style={styles.readOnlyFieldLabel}>{label}</Text>
      </View>
      <View style={styles.ratingContainer}>
        {rating !== null && rating !== undefined ? (
          <>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon 
                  key={star}
                  name="star" 
                  size={16} 
                  color={star <= Math.round(rating) ? colors.states.warning : colors.border.light}
                  solid={star <= Math.round(rating)}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} ({totalRatings || 0} calificaciones)
            </Text>
          </>
        ) : (
          <Text style={styles.ratingText}>Sin calificaciones aún</Text>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Editando información personal' : 
         isEditingProfessional ? 'Editando perfil profesional' : 
         'Gestiona tu información personal'}
      </Text>
    </View>
  );

  const renderUserInfo = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.userInfoSection}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={40} color={colors.text.secondary} />
            </View>
          </View>
          <View style={styles.basicInfo}>
            <Text style={styles.userName}>{userProfile.Nombre}</Text>
            <View style={styles.roleContainer}>
              <Icon name="tag" size={12} color={colors.primary.main} />
              <Text style={styles.userRole}>{userRole}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.readOnlySection}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
          {renderReadOnlyField('Cédula', userProfile.cedula, 'id-card')}
          {renderReadOnlyField('Email', userProfile.email, 'envelope')}
          
          {userRole === 'Profesional' && (
            <>
              {userProfile.profesion && renderReadOnlyField('Profesión', userProfile.profesion, 'briefcase')}
              {userProfile.descripcion && renderReadOnlyField('Descripción', userProfile.descripcion, 'info-circle')}
              {userProfile.direccion && renderReadOnlyField('Dirección', userProfile.direccion, 'map-marker-alt')}
              
              {/* AÑADIR ESTA SECCIÓN DE CALIFICACIÓN */}
              {!ratingData.isLoading && ratingData.calificacionPromedio > 0 && (
                <View style={styles.professionalRatingSection}>
                  <View style={styles.professionalRatingHeader}>
                    <View style={styles.professionalRatingIconContainer}>
                      <Icon name="award" size={18} color={colors.primary.main} solid />
                    </View>
                    <Text style={styles.professionalRatingTitle}>Tu Calificación</Text>
                  </View>
                  
                  <View style={styles.professionalRatingContent}>
                    <Text style={styles.professionalRatingScore}>
                      {ratingData.calificacionPromedio.toFixed(1)}
                    </Text>
                    <View style={styles.professionalRatingStars}>
                      {renderRatingStars(ratingData.calificacionPromedio, 18)}
                      <Text style={styles.professionalRatingMax}>de 5.0</Text>
                    </View>
                  </View>
                  
                  <View style={styles.professionalRatingDescription}>
                    <Icon name="info-circle" size={12} color={colors.text.secondary} />
                    <Text style={styles.professionalRatingDescriptionText}>
                      Calificación promedio basada en evaluaciones de clientes
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {userRole === 'Profesional' && !ratingData.isLoading && (
        <View style={styles.professionalRatingSection}>
          <View style={styles.professionalRatingHeader}>
            <View style={styles.professionalRatingIconContainer}>
              <Icon name="award" size={18} color={colors.primary.main} solid />
            </View>
            <Text style={styles.professionalRatingTitle}>Tu Calificación</Text>
          </View>
          
          {ratingData.calificacionPromedio > 0 ? (
            <>
              <View style={styles.professionalRatingContent}>
                <Text style={styles.professionalRatingScore}>
                  {ratingData.calificacionPromedio.toFixed(1)}
                </Text>
                <View style={styles.professionalRatingStars}>
                  {renderRatingStars(ratingData.calificacionPromedio, 18)}
                  <Text style={styles.professionalRatingMax}>de 5.0</Text>
                </View>
              </View>
              
              <View style={styles.professionalRatingDescription}>
                <Icon name="info-circle" size={12} color={colors.text.secondary} />
                <Text style={styles.professionalRatingDescriptionText}>
                  Calificación promedio basada en evaluaciones de clientes
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.professionalNoRatingContent}>
              <Icon name="star" size={32} color={colors.border.light} />
              <Text style={styles.professionalNoRatingText}>
                Aún no has recibido calificaciones
              </Text>
              <Text style={styles.professionalNoRatingSubtext}>
                Completa tus primeros servicios para recibir evaluaciones de tus clientes
              </Text>
            </View>
          )}
        </View>
      )}
      </View>
    );
  };

  const renderEditableInfo = () => {
    if (!userProfile || !isEditing) return null;

    return (
      <View style={styles.editableSection}>
        <View style={styles.sectionHeader}>
          <Icon name="edit" size={16} color={colors.primary.main} />
          <Text style={styles.sectionTitle}>Información Personal</Text>
        </View>

        {renderEditableField(
          'Nombre completo *',
          editData.Nombre,
          (text) => setEditData(prev => ({ ...prev, Nombre: text })),
          errors.Nombre,
          'Ingresa tu Nombre completo',
          'default',
          100
        )}

        {renderEditableField(
          'Teléfono',
          editData.Telefono,
          (text) => setEditData(prev => ({ ...prev, Telefono: text })),
          errors.Telefono,
          'Ej: 61234567 (8 dígitos, inicia con 2,6,7 u 8)',
          'phone-pad',
          8
        )}
      </View>
    );
  };

  const renderProfessionalInfo = () => {
    if (!userProfile || userRole !== 'Profesional' || !isEditingProfessional) return null;

    return (
      <View style={styles.editableSection}>
        <View style={styles.sectionHeader}>
          <Icon name="briefcase" size={16} color={colors.primary.main} />
          <Text style={styles.sectionTitle}>Perfil Profesional</Text>
        </View>

        {/* Campo de Profesión con Modal Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Profesión *</Text>
          <TouchableOpacity
            style={[
              styles.textInput,
              styles.professionSelector,
              professionalErrors.profesion ? styles.inputError : null,
              !isEditingProfessional ? styles.disabledInput : null
            ]}
            onPress={() => setShowProfessionModal(true)}
            disabled={!isEditingProfessional}
          >
            <Text style={[
              styles.professionSelectorText,
              !professionalData.profesion && styles.professionSelectorPlaceholder
            ]}>
              {professionalData.profesion || 'Selecciona una profesión'}
            </Text>
            <Icon name="chevron-down" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          {professionalErrors.profesion && (
            <Text style={styles.errorText}>{professionalErrors.profesion}</Text>
          )}
        </View>

        {renderEditableField(
          'Descripción *',
          professionalData.descripcion,
          (text) => setProfessionalData(prev => ({ ...prev, descripcion: text })),
          professionalErrors.descripcion,
          'Describe tus servicios y experiencia',
          'default',
          500,
          true
        )}

        {renderEditableField(
          'Dirección *',
          professionalData.direccion,
          (text) => setProfessionalData(prev => ({ ...prev, direccion: text })),
          professionalErrors.direccion,
          'Dirección de tu consultorio o lugar de trabajo',
          'default',
          200
        )}

        {/* Modal para seleccionar profesión */}
        <Modal
          visible={showProfessionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowProfessionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecciona tu profesión</Text>
                <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
                  <Icon name="times" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {PROFESIONES.map((prof) => (
                  <TouchableOpacity
                    key={prof}
                    style={[
                      styles.modalItem,
                      professionalData.profesion === prof && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      setProfessionalData(prev => ({ ...prev, profesion: prof }));
                      setShowProfessionModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      professionalData.profesion === prof && styles.modalItemTextSelected
                    ]}>
                      {prof}
                    </Text>
                    {professionalData.profesion === prof && (
                      <Icon name="check" size={16} color={colors.primary.main} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      {isEditing ? (
        <View style={styles.editButtonsRow}>
          <View style={styles.editButton}>
            <Button
              title="Cancelar"
              onPress={handleCancelEdit}
              variant="outline"
              disabled={isSaving}
            />
          </View>
          <View style={styles.editButton}>
            <Button
              title={isSaving ? "Guardando..." : "Guardar Cambios"}
              onPress={handleSaveChanges}
              variant="primary"
              loading={isSaving}
              disabled={isSaving}
              icon="save"
              iconPosition="left"
            />
          </View>
        </View>
      ) : (
        <Button
          title="Editar Perfil"
          onPress={handleStartEdit}
          variant="primary"
          fullWidth
          icon="edit"
          iconPosition="left"
          disabled={isLoggingOut || isEditingProfessional}
        />
      )}

      {userRole === 'Profesional' && (
        <>
          {isEditingProfessional ? (
            <View style={[styles.editButtonsRow, styles.professionalButtonsRow]}>
              <View style={styles.editButton}>
                <Button
                  title="Cancelar"
                  onPress={handleCancelEditProfessional}
                  variant="outline"
                  disabled={isSavingProfessional}
                />
              </View>
              <View style={styles.editButton}>
                <Button
                  title={isSavingProfessional ? "Guardando..." : "Guardar Cambios"}
                  onPress={handleSaveProfessionalChanges}
                  variant="primary"
                  loading={isSavingProfessional}
                  disabled={isSavingProfessional}
                  icon="save"
                  iconPosition="left"
                />
              </View>
            </View>
          ) : (
            <View style={styles.professionalButtonContainer}>
              <Button
                title="Editar Perfil Profesional"
                onPress={handleStartEditProfessional}
                variant="outline"
                fullWidth
                icon="briefcase"
                iconPosition="left"
                disabled={isLoggingOut || isEditing}
              />
            </View>
          )}

          <View style={styles.planButtonContainer}>
            <Button
              title="Gestionar Plan"
              onPress={() => navigation?.navigate('PlanSelection')}
              variant="outline"
              fullWidth
              icon="credit-card"
              iconPosition="left"
              disabled={isLoggingOut || isSaving || isSavingProfessional}
            />
          </View>
        </>
      )}

      <View style={styles.logoutContainer}>
        <Button
          title={isLoggingOut ? "Cerrando Sesión..." : "Cerrar Sesión"}
          onPress={handleLogout}
          variant="outline"
          fullWidth
          loading={isLoggingOut}
          disabled={isLoggingOut || isSaving || isSavingProfessional}
          icon="sign-out-alt"
          iconPosition="left"
        />
      </View>
    </View>
  );

  // =============================================
  // RENDER PRINCIPAL
  // =============================================

  if (isLoading) {
    return (
      <SafeContainer>
        {renderLoadingState()}
      </SafeContainer>
    );
  }

  if (!userProfile) {
    return (
      <SafeContainer>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={50} color={colors.states.error} />
          <Text style={styles.errorTitle}>Error al Cargar Perfil</Text>
          <Text style={styles.errorMessage}>
            No se pudo cargar la información del perfil. Verifica tu conexión a internet.
          </Text>
          <Button
            title="Reintentar"
            onPress={loadUserProfile}
            variant="primary"
            icon="redo"
            iconPosition="left"
          />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadUserProfile}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
        >
          {renderHeader()}
          {renderUserInfo()}
          {renderEditableInfo()}
          {renderProfessionalInfo()}
          {renderActionButtons()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
};

// =============================================
// ESTILOS
// =============================================

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'] + spacing.xl,
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md + 2,
    fontSize: 15,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + spacing.lg,
    paddingVertical: spacing['4xl'],
  },

  errorTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginVertical: spacing.lg + 4,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
  },

  errorMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl + spacing.lg,
    lineHeight: 24,
    fontSize: 15,
  },

  header: {
    paddingTop: spacing['8xl'],
    paddingBottom: spacing.xl + 4,
    alignItems: 'center',
    backgroundColor: colors.primary.light + '08',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: spacing.xl,
    borderBottomRightRadius: spacing.xl,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm + 2,
    fontSize: 32,
    letterSpacing: -0.5,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },

  userInfoSection: {
    marginBottom: spacing['2xl'],
  },

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl + 4,
    paddingHorizontal: spacing.lg + 4,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md + 2,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg + 4,
  },

  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primary.main + '40',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  basicInfo: {
    flex: 1,
  },

  userName: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },

  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: spacing.lg,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },

  userRole: {
    ...typography.styles.caption,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.bold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  readOnlySection: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md + 2,
    padding: spacing.lg + 4,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  readOnlyFieldContainer: {
    marginBottom: spacing.md + 2,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light + '40',
  },

  readOnlyFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
    gap: spacing.sm,
  },

  readOnlyFieldLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.8,
  },

  readOnlyFieldValue: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    fontSize: 15,
    lineHeight: 22,
  },

  ratingContainer: {
    flexDirection: 'column',
    gap: spacing.xs + 2,
  },

  ratingStars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  ratingText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    fontSize: 14,
  },

  editableSection: {
    marginBottom: spacing['2xl'] + spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md + 2,
    padding: spacing.lg + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg + 4,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main + '20',
  },

  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginLeft: spacing.sm + 2,
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.2,
  },

  fieldContainer: {
    marginBottom: spacing.lg + 2,
  },

  fieldLabel: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: spacing.sm + 2,
    fontWeight: typography.fontWeight.bold,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  textInput: {
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: spacing.md,
    padding: spacing.md + 2,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    minHeight: 52,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },

  textInputMultiline: {
    minHeight: 110,
    paddingTop: spacing.md + 2,
  },

  disabledInput: {
    backgroundColor: colors.background.secondary,
    color: colors.text.secondary,
    borderColor: colors.border.light + '60',
    shadowOpacity: 0,
  },

  inputError: {
    borderColor: colors.states.error,
    borderWidth: 2,
    shadowColor: colors.states.error,
    shadowOpacity: 0.2,
  },

  errorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    marginTop: spacing.xs + 2,
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
  },

  characterCount: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs + 2,
    fontSize: 11,
  },

  actionButtonsContainer: {
    paddingVertical: spacing.xl + 4,
    paddingBottom: spacing['4xl'] + spacing.xl,
    gap: spacing.md,
  },

  editButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md + 2,
    marginBottom: spacing.lg,
  },

  professionalButtonsRow: {
    marginTop: spacing.lg,
  },

  editButton: {
    flex: 1,
  },

  professionalButtonContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },

  planButtonContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },

  logoutContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },

  professionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: spacing.md,
    padding: spacing.md + 2,
    minHeight: 52,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },

  professionSelectorText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },

  professionSelectorPlaceholder: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.normal,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.xl + 4,
    borderTopRightRadius: spacing.xl + 4,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg + 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },

  modalTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
  },

  modalList: {
    maxHeight: 400,
  },

  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light + '50',
    backgroundColor: colors.background.primary,
  },

  modalItemSelected: {
    backgroundColor: colors.primary.light + '25',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },

  modalItemText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
    fontSize: 15,
  },

  modalItemTextSelected: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },

professionalRatingSection: {
  marginTop: spacing.lg + 4,
  paddingTop: spacing.lg + 4,
  paddingHorizontal: spacing.md + 4,
  paddingBottom: spacing.md + 4,
  borderTopWidth: 2,
  borderTopColor: colors.primary.main + '30',
  backgroundColor: colors.primary.light + '08',
  borderRadius: spacing.md,
  marginHorizontal: -spacing.lg,
  marginLeft: -spacing.lg - 4,
  marginRight: -spacing.lg - 4,
},

professionalRatingHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.md + 4,
  gap: spacing.sm + 2,
},

professionalRatingIconContainer: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: colors.primary.main + '20',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: colors.primary.main,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},

professionalRatingTitle: {
  ...typography.styles.h3,
  color: colors.text.primary,
  fontWeight: typography.fontWeight.bold,
  fontSize: 18,
  letterSpacing: -0.2,
},

professionalRatingContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.lg + 4,
  marginBottom: spacing.md + 2,
  backgroundColor: colors.background.secondary,
  padding: spacing.lg,
  borderRadius: spacing.md,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},

professionalRatingScore: {
  fontSize: 48,
  fontWeight: typography.fontWeight.bold,
  color: colors.primary.main,
  lineHeight: 52,
  letterSpacing: -1,
},

professionalRatingStars: {
  flex: 1,
  gap: spacing.xs + 2,
},

professionalRatingMax: {
  ...typography.styles.body,
  color: colors.text.secondary,
  fontSize: 14,
  marginTop: spacing.xs,
  fontWeight: typography.fontWeight.medium,
},

professionalRatingDescription: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: spacing.sm + 2,
  backgroundColor: colors.background.secondary,
  padding: spacing.md,
  borderRadius: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: colors.primary.main,
},

professionalRatingDescriptionText: {
  ...typography.styles.caption,
  color: colors.text.secondary,
  flex: 1,
  lineHeight: 18,
  fontSize: 12,
},

professionalNoRatingContent: {
  alignItems: 'center',
  paddingVertical: spacing.xl + spacing.lg,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.background.secondary,
  borderRadius: spacing.md,
  borderWidth: 1,
  borderColor: colors.border.light,
  borderStyle: 'dashed',
},

professionalNoRatingText: {
  ...typography.styles.body,
  color: colors.text.primary,
  fontWeight: typography.fontWeight.semibold,
  fontSize: 16,
  marginTop: spacing.md,
  textAlign: 'center',
},

professionalNoRatingSubtext: {
  ...typography.styles.caption,
  color: colors.text.secondary,
  fontSize: 13,
  marginTop: spacing.sm,
  textAlign: 'center',
  lineHeight: 20,
  paddingHorizontal: spacing.md,
},
});