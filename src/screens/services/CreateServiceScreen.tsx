/**
 * Pantalla de Crear Servicio - Booky
 * Pantalla placeholder para la creación de servicios
 * Esta pantalla será desarrollada completamente más adelante
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeContainer } from '../../components/ui/SafeContainer';
import { Button } from '../../components/forms/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

interface CreateServiceScreenProps {
  navigation?: any;
  route?: any;
}

export const CreateServiceScreen: React.FC<CreateServiceScreenProps> = ({ 
  navigation 
}) => {

  /**
   * Navegar de regreso a servicios
   */
  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('Services');
    }
  };

  /**
   * Mostrar que la funcionalidad estará disponible próximamente
   */
  const handleShowComingSoon = () => {
    Alert.alert(
      'Funcionalidad en Desarrollo',
      'La creación de servicios estará disponible en una próxima actualización. ' +
      'Por ahora, esta pantalla sirve como placeholder para la navegación.',
      [
        {
          text: 'Entendido',
          onPress: handleGoBack,
        },
      ]
    );
  };

  return (
    <SafeContainer>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon 
            name="plus-circle" 
            size={64} 
            color={colors.primary.main} 
            style={styles.headerIcon}
          />
          <Text style={styles.title}>Crear Nuevo Servicio</Text>
          <Text style={styles.subtitle}>
            Agrega un nuevo servicio que tus clientes puedan reservar
          </Text>
        </View>

        {/* Contenido Principal */}
        <View style={styles.content}>
          <View style={styles.placeholderCard}>
            <Icon 
              name="hammer" 
              size={48} 
              color={colors.states.warning} 
              style={styles.placeholderIcon}
            />
            
            <Text style={styles.placeholderTitle}>
              🚧 En Construcción
            </Text>
            
            <Text style={styles.placeholderDescription}>
              Esta funcionalidad está siendo desarrollada y estará disponible próximamente.
            </Text>
            
            <View style={styles.featuresList}>
              <Text style={styles.featuresTitle}>Funcionalidades que incluirá:</Text>
              
              <View style={styles.featureItem}>
                <Icon name="check" size={14} color={colors.states.success} />
                <Text style={styles.featureText}>Nombre y descripción del servicio</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check" size={14} color={colors.states.success} />
                <Text style={styles.featureText}>Duración y precio personalizables</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check" size={14} color={colors.states.success} />
                <Text style={styles.featureText}>Opciones de descuento</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check" size={14} color={colors.states.success} />
                <Text style={styles.featureText}>Configuración de disponibilidad</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="check" size={14} color={colors.states.success} />
                <Text style={styles.featureText}>Activación/desactivación de servicios</Text>
              </View>
            </View>

            <Button
              title="Más Información"
              onPress={handleShowComingSoon}
              variant="outline"
              icon="info-circle"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Volver a Servicios"
            onPress={handleGoBack}
            variant="primary"
            icon="arrow-left"
          />
          
          <Text style={styles.footerNote}>
            Mientras tanto, puedes gestionar tus servicios existentes desde la pantalla anterior.
          </Text>
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
    paddingVertical: spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  headerIcon: {
    marginBottom: spacing.lg,
    opacity: 0.8,
  },

  title: {
    ...typography.styles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  placeholderCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },

  placeholderIcon: {
    marginBottom: spacing.lg,
    opacity: 0.7,
  },

  placeholderTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  placeholderDescription: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  featuresList: {
    width: '100%',
    marginBottom: spacing.xl,
  },

  featuresTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  featureText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginLeft: spacing.md,
    flex: 1,
  },

  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },

  footerNote: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: spacing.lg,
  },
});