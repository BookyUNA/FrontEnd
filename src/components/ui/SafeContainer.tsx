/**
 * Componente SafeContainer para áreas seguras
 */

import React from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { colors } from '../../styles/colors';
import { layout } from '../../styles/spacing';

interface SafeContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  paddingHorizontal?: boolean;
  paddingVertical?: boolean;
  style?: ViewStyle;
}

export const SafeContainer: React.FC<SafeContainerProps> = ({
  children,
  backgroundColor = colors.background.primary,
  statusBarStyle = 'dark-content',
  paddingHorizontal = true,
  paddingVertical = false,
  style,
}) => {
  const containerStyle = [
    styles.container,
    { backgroundColor },
    paddingHorizontal && styles.paddingHorizontal,
    paddingVertical && styles.paddingVertical,
    style,
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <View style={containerStyle}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  paddingHorizontal: {
    paddingHorizontal: layout.container.paddingHorizontal,
  },

  paddingVertical: {
    paddingVertical: layout.container.paddingVertical,
  },
});