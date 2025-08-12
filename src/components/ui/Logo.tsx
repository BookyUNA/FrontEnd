/**
 * Componente Logo de Booky
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { layout } from '../../styles/spacing';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  showTagline = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Logo principal */}
      <View style={[styles.logoContainer, styles[`logoContainer_${size}`]]}>
        <Text style={[styles.logoText, styles[`logoText_${size}`]]}>
          Booky
        </Text>
      </View>

      {/* Tagline opcional */}
      {showTagline && (
        <Text style={[styles.tagline, styles[`tagline_${size}`]]}>
          Tu agenda profesional
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Contenedor del logo - tamaños
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  logoContainer_small: {
    height: 40,
  },

  logoContainer_medium: {
    height: layout.dimensions.logoHeight,
  },

  logoContainer_large: {
    height: 80,
  },

  // Texto del logo - tamaños
  logoText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    letterSpacing: typography.letterSpacing.tight,
  },

  logoText_small: {
    fontSize: typography.fontSize.xl,
  },

  logoText_medium: {
    fontSize: typography.fontSize['3xl'],
  },

  logoText_large: {
    fontSize: typography.fontSize['4xl'],
  },

  // Tagline - tamaños
  tagline: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.normal,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  tagline_small: {
    fontSize: typography.fontSize.sm,
  },

  tagline_medium: {
    fontSize: typography.fontSize.base,
  },

  tagline_large: {
    fontSize: typography.fontSize.lg,
  },
});