/**
 * Pantalla de Perfil - Booky
 * Sistema de reservas para profesionales independientes
 * Actualizada con información de usuario completa y edición
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

// Importaciones locales
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { authService } from '../../services/auth/authService';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';
import { userService, ApiProfileResponse } from '../../services/services/UserService';

// =============================================
// INTERFACES Y MODELOS
// =============================================

interface UserProfile {
  nombre: string;
  email: string;
  cedula: string;
  telefono: string | null;
}

interface EditableUserData {
  nombre: string;
  telefono: string;
}

interface ValidationErrors {
  nombre?: string;
  telefono?: string;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

interface ProfileScreenProps {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const mapApiProfileToUserProfile = (api: ApiProfileResponse): UserProfile => ({
  nombre: api.Nombre,
  email: api.Correo,
  cedula: api.Cedula,
  telefono: api.Telefono || null,
});

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onLogout, 
  isLoggingOut = false 
}) => {
  
  // Estados principales
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Estados de edición (solo para campos editables reales)
  const [editData, setEditData] = useState<EditableUserData>({
    nombre: '',
    telefono: '',
  });
  
  // Estados de validación
  const [errors, setErrors] = useState<ValidationErrors>({});

  // =============================================
  // EFECTOS Y CARGA DE DATOS
  // =============================================

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      console.log('📱 ProfileScreen: Cargando perfil del usuario...');
      
      const apiProfile = await userService.getProfile();
      console.log('📱 ProfileScreen: Perfil obtenido:', apiProfile);
      
      const profile = mapApiProfileToUserProfile(apiProfile);
      setUserProfile(profile);

      // Inicializar datos editables
      setEditData({
        nombre: profile.nombre,
        telefono: profile.telefono || '',
      });

      console.log('📱 ProfileScreen: Perfil procesado y establecido correctamente');
      
    } catch (error: any) {
      console.error('📱 ProfileScreen: Error cargando perfil:', error);
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

    // Validar nombre
    if (!editData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (editData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (editData.nombre.trim().length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    // Validar teléfono
    if (editData.telefono.trim()) {
      // Regex más permisivo para teléfonos costarricenses
      const phoneRegex = /^[0-9\s\-\(\)\+]{8,15}$/;
      if (!phoneRegex.test(editData.telefono.trim())) {
        newErrors.telefono = 'Formato de teléfono inválido. Use solo números, espacios, guiones y paréntesis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================
  // HANDLERS
  // =============================================

  const handleStartEdit = () => {
    console.log('📱 ProfileScreen: Iniciando edición del perfil');
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    console.log('📱 ProfileScreen: Cancelando edición del perfil');
    // Restaurar datos originales
    if (userProfile) {
      setEditData({
        nombre: userProfile.nombre,
        telefono: userProfile.telefono || '',
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

      // NOTA: Aquí llamamos el futuro endpoint de actualización
      // Por ejemplo: await userService.updateProfile(editData);
      
      // Por ahora, solo simulamos el guardado y actualizamos el estado local
      console.log('📱 ProfileScreen: Guardando cambios localmente (endpoint de actualización no implementado)');
      
      setUserProfile(prev => prev ? {
        ...prev,
        nombre: editData.nombre.trim(),
        telefono: editData.telefono.trim() || null
      } : prev);

      setIsEditing(false);
      setErrors({});

      Alert.alert(
        'Éxito',
        'Los cambios se guardaron correctamente.',
        [{ text: 'Entendido' }]
      );

      console.log('📱 ProfileScreen: Cambios guardados exitosamente');
      
    } catch (error: any) {
      console.error('📱 ProfileScreen: Error guardando perfil:', error);
      Alert.alert(
        'Error',
        error.message || 'Hubo un problema al guardar los cambios. Verifica tu conexión e intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsSaving(false);
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
              console.error('🚪 ProfileScreen: Error inesperado en logout:', error);
              
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
    maxLength?: number
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          error ? styles.inputError : null,
          !isEditing ? styles.disabledInput : null
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={isEditing}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {maxLength && isEditing && (
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Editando información personal' : 'Gestiona tu información personal'}
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
            <Text style={styles.userName}>{userProfile.nombre}</Text>
            <View style={styles.roleContainer}>
              <Icon name="tag" size={12} color={colors.primary.main} />
              <Text style={styles.userRole}>Cliente</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.readOnlySection}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
          {renderReadOnlyField('Cédula', userProfile.cedula, 'id-card')}
          {renderReadOnlyField('Email', userProfile.email, 'envelope')}
          <Text style={styles.readOnlyNote}>
            * Esta información no puede ser modificada. Si necesitas cambiarla, contacta al soporte.
          </Text>
        </View>
      </View>
    );
  };

  const renderEditableInfo = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.editableSection}>
        <View style={styles.sectionHeader}>
          <Icon name="edit" size={16} color={colors.primary.main} />
          <Text style={styles.sectionTitle}>Información Personal</Text>
        </View>

        {renderEditableField(
          'Nombre completo *',
          editData.nombre,
          (text) => setEditData(prev => ({ ...prev, nombre: text })),
          errors.nombre,
          'Ingresa tu nombre completo',
          'default',
          100
        )}

        {renderEditableField(
          'Teléfono',
          editData.telefono,
          (text) => setEditData(prev => ({ ...prev, telefono: text })),
          errors.telefono,
          'Ej: 61423881 o +506 6142-3881',
          'phone-pad',
          20
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
          disabled={isLoggingOut}
        />
      )}

      <View style={styles.logoutContainer}>
        <Button
          title={isLoggingOut ? "Cerrando Sesión..." : "Cerrar Sesión"}
          onPress={handleLogout}
          variant="outline"
          fullWidth
          loading={isLoggingOut}
          disabled={isLoggingOut || isSaving}
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

  // Header
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

  // User Info Section
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

  // Read-only section
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

  readOnlyNote: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Editable section
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

  // Action buttons
  actionButtonsContainer: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  editButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  editButton: {
    flex: 1,
  },

  logoutContainer: {
    marginTop: spacing.lg,
  },
});