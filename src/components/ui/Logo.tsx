/**
 * Componente Logo de Booky
 */

import React from 'react';
import {
  View,
  Text,
  Image,
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
      {/* Logo principal - ahora es una imagen */}
      <View style={[styles.logoContainer, styles[`logoContainer_${size}`]]}>
        <Image
          source={require('../../../assets/images/LogoBooky.png')} // Cambia esta ruta por la ruta real de tu logo
          style={[styles.logoImage, styles[`logoImage_${size}`]]}
          resizeMode="contain"
        />
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

  // Imagen del logo - tamaños
  logoImage: {
    width: '100%',
    height: '100%',
  },

  logoImage_small: {
    width: 120,
    height: 40,
  },

  logoImage_medium: {
    width: 180,
    height: layout.dimensions.logoHeight,
  },

  logoImage_large: {
    width: 240,
    height: 80,
  },

  // Tagline - tamaños
  tagline: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.normal,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
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