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
  
  // Estados para perfil profesional
  const [isEditingProfessional, setIsEditingProfessional] = useState<boolean>(false);
  const [isSavingProfessional, setIsSavingProfessional] = useState<boolean>(false);
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
      newErrors.profesion = 'La profesión es obligatoria';
    } else if (professionalData.profesion.trim().length < 3) {
      newErrors.profesion = 'La profesión debe tener al menos 3 caracteres';
    } else if (professionalData.profesion.trim().length > 100) {
      newErrors.profesion = 'La profesión no puede exceder 100 caracteres';
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
              {userProfile.calificacionPromedio !== null && 
                renderRatingField('Calificación', userProfile.calificacionPromedio ?? null, userProfile.totalCalificaciones ?? null)
              }
            </>
          )}
        </View>
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

        {renderEditableField(
          'Profesión *',
          professionalData.profesion,
          (text) => setProfessionalData(prev => ({ ...prev, profesion: text })),
          professionalErrors.profesion,
          'Ej: Psicólogo, Dentista, Abogado',
          'default',
          100
        )}

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
    paddingVertical: spacing['4xl'],
  },

  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
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
    color: colors.text.primary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },

  errorMessage: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  header: {
    paddingTop: spacing['8xl'],
    paddingBottom: spacing.xl,
    alignItems: 'center',
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

  userInfoSection: {
    marginBottom: spacing['2xl'],
  },

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
  },

  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },

  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.border.light,
  },

  basicInfo: {
    flex: 1,
  },

  userName: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  userRole: {
    ...typography.styles.caption,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: 'bold',
  },

  readOnlySection: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  readOnlyFieldContainer: {
    marginBottom: spacing.md,
  },

  readOnlyFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  readOnlyFieldLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  readOnlyFieldValue: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  ratingContainer: {
    flexDirection: 'column',
    gap: spacing.xs,
  },

  ratingStars: {
    flexDirection: 'row',
    gap: spacing.xs / 2,
  },

  ratingText: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  editableSection: {
    marginBottom: spacing['2xl'],
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },

  fieldContainer: {
    marginBottom: spacing.lg,
  },

  fieldLabel: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },

  textInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    minHeight: 48,
  },

  textInputMultiline: {
    minHeight: 100,
    paddingTop: spacing.md,
  },

  disabledInput: {
    backgroundColor: colors.background.secondary,
    color: colors.text.secondary,
  },

  inputError: {
    borderColor: colors.states.error,
  },

  errorText: {
    ...typography.styles.caption,
    color: colors.states.error,
    marginTop: spacing.xs,
  },

  characterCount: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  actionButtonsContainer: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  editButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  professionalButtonsRow: {
    marginTop: spacing.lg,
  },

  editButton: {
    flex: 1,
  },

  professionalButtonContainer: {
    marginTop: spacing.lg,
  },

  planButtonContainer: {
    marginTop: spacing.lg,
  },

  logoutContainer: {
    marginTop: spacing.lg,
  },
});