/**
 * Componente Button reutilizable - Con soporte para iconos
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { ButtonProps } from '../../types/auth';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout } from '../../styles/spacing';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
}) => {
  // Determinar estilos del botón basado en la variante
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle[] = [
      styles.button,
      styles[`button_${size}` as keyof typeof styles] as ViewStyle,
    ];

    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }

    if (disabled || loading) {
      baseStyle.push(styles[`button_${variant}_disabled` as keyof typeof styles] as ViewStyle);
    } else {
      baseStyle.push(styles[`button_${variant}` as keyof typeof styles] as ViewStyle);
    }

    return StyleSheet.flatten(baseStyle);
  };

  // Determinar estilos del texto basado en la variante
  const getTextStyle = (): TextStyle => {
    const textStyles: TextStyle[] = [styles.text];

    if (disabled || loading) {
      textStyles.push(styles[`text_${variant}_disabled` as keyof typeof styles] as TextStyle);
    } else {
      textStyles.push(styles[`text_${variant}` as keyof typeof styles] as TextStyle);
    }

    return StyleSheet.flatten(textStyles);
  };

  // Determinar color del indicador de carga
  const getLoadingColor = (): string => {
    if (variant === 'primary') {
      return colors.primary.contrast;
    }
    if (variant === 'secondary') {
      return colors.secondary.contrast;
    }
    return colors.primary.main;
  };

  // Determinar color del icono
  const getIconColor = (): string => {
    if (disabled || loading) {
      return colors.text.disabled;
    }
    
    if (variant === 'primary') {
      return colors.primary.contrast;
    }
    if (variant === 'secondary') {
      return colors.secondary.contrast;
    }
    if (variant === 'outline' || variant === 'ghost') {
      return colors.primary.main;
    }
    return colors.primary.main;
  };

  // Determinar tamaño del icono según el tamaño del botón
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  // Renderizar contenido del botón
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getLoadingColor()} 
        />
      );
    }

    const iconElement = icon ? (
      <Icon 
        name={icon} 
        size={getIconSize()} 
        color={getIconColor()}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    ) : null;

    const textElement = (
      <Text style={getTextStyle()}>{title}</Text>
    );

    if (!icon) {
      return textElement;
    }

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Estilos base del botón
  button: {
    borderRadius: layout.button.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Contenedor para icono + texto
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Espaciado de iconos
  iconLeft: {
    marginRight: 8,
  },

  iconRight: {
    marginLeft: 8,
  },

  // Tamaños
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 36,
  },

  button_medium: {
    paddingVertical: layout.button.paddingVertical,
    paddingHorizontal: layout.button.paddingHorizontal,
    height: layout.dimensions.buttonHeight,
  },

  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    height: 56,
  },

  // Ancho completo
  buttonFullWidth: {
    width: '100%',
  },

  // Variante Primary
  button_primary: {
    backgroundColor: colors.primary.main,
    shadowColor: colors.shadow.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  button_primary_disabled: {
    backgroundColor: colors.background.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Variante Secondary
  button_secondary: {
    backgroundColor: colors.secondary.main,
    shadowColor: colors.shadow.neutral,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  button_secondary_disabled: {
    backgroundColor: colors.background.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Variante Outline
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },

  button_outline_disabled: {
    backgroundColor: 'transparent',
    borderColor: colors.border.light,
  },

  // Variante Ghost
  button_ghost: {
    backgroundColor: 'transparent',
  },

  button_ghost_disabled: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },

  // Estilos de texto base
  text: {
    ...typography.styles.button,
    textAlign: 'center',
  },

  // Texto Primary
  text_primary: {
    color: colors.primary.contrast,
  },

  text_primary_disabled: {
    color: colors.text.disabled,
  },

  // Texto Secondary
  text_secondary: {
    color: colors.secondary.contrast,
  },

  text_secondary_disabled: {
    color: colors.text.disabled,
  },

  // Texto Outline
  text_outline: {
    color: colors.primary.main,
  },

  text_outline_disabled: {
    color: colors.text.disabled,
  },

  // Texto Ghost
  text_ghost: {
    color: colors.primary.main,
  },

  text_ghost_disabled: {
    color: colors.text.disabled,
  },
});