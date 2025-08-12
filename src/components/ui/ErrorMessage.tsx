/**
 * Componente ErrorMessage - Booky
 * Componente para mostrar mensajes de error con diseño consistente
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface ErrorMessageProps {
  message: string;
  visible: boolean;
  style?: ViewStyle;
  showIcon?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible,
  style,
  showIcon = true,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
        style,
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <Text style={styles.icon}>⚠️</Text>
        )}
        <Text style={styles.message}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.states.error,
    borderRadius: spacing.sm,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626', // Rojo más oscuro para contraste
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },

  message: {
    ...typography.styles.body,
    color: colors.text.inverse,
    flex: 1,
    fontWeight: typography.fontWeight.medium,
  },
});