/**
 * Componente Input reutilizable - CORREGIDO
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { InputProps } from '../../types/auth';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout } from '../../styles/spacing';

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  disabled = false,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determinar el estilo del contenedor basado en el estado
  const getContainerStyle = (): ViewStyle => {
    if (error) {
      return styles.containerError;
    }
    if (isFocused) {
      return styles.containerFocused;
    }
    if (disabled) {
      return styles.containerDisabled;
    }
    return styles.container;
  };

  // Determinar el estilo del input basado en el estado
  const getInputStyle = (): TextStyle => {
    const inputStyles: TextStyle[] = [styles.input];
    
    if (disabled) {
      inputStyles.push(styles.inputDisabled);
    }
    
    return StyleSheet.flatten(inputStyles);
  };

  // Manejar visibilidad de contraseña
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      {/* Input Container */}
      <View style={getContainerStyle()}>
        <TextInput
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any} // Tipo forzado para compatibilidad
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Icono para mostrar/ocultar contraseña */}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mensaje de error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: layout.form.fieldSpacing,
  },

  labelContainer: {
    marginBottom: 6,
  },

  label: {
    ...typography.styles.label,
    color: colors.text.primary,
  },

  required: {
    color: colors.states.error,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: layout.input.borderRadius,
    paddingHorizontal: layout.input.paddingHorizontal,
    height: layout.dimensions.inputHeight,
  },

  containerFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.border.focus,
    borderRadius: layout.input.borderRadius,
    paddingHorizontal: layout.input.paddingHorizontal,
    height: layout.dimensions.inputHeight,
  },

  containerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.states.error,
    borderRadius: layout.input.borderRadius,
    paddingHorizontal: layout.input.paddingHorizontal,
    height: layout.dimensions.inputHeight,
  },

  containerDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.disabled,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: layout.input.borderRadius,
    paddingHorizontal: layout.input.paddingHorizontal,
    height: layout.dimensions.inputHeight,
    opacity: 0.6,
  },

  input: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    padding: 0, // Eliminar padding interno en Android
  },

  inputDisabled: {
    color: colors.text.disabled,
  },

  passwordToggle: {
    padding: 4,
    marginLeft: 8,
  },

  passwordToggleText: {
    fontSize: 18,
  },

  errorContainer: {
    marginTop: 4,
  },

  errorText: {
    ...typography.styles.caption,
    color: colors.states.error,
  },
});