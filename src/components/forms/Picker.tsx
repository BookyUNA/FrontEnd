/**
 * Componente Picker - Booky
 * Selector dropdown personalizado para formularios
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';

import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing } from '../../styles/spacing';

export interface PickerOption {
  label: string;
  value: string;
}

export interface PickerProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Selecciona una opción',
  error,
  disabled = false,
  required = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Encontrar la opción seleccionada para mostrar su label
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleOptionSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsModalVisible(false);
  };

  const openModal = () => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const renderOption = ({ item }: { item: PickerOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.selectedOption
      ]}
      onPress={() => handleOptionSelect(item.value)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.optionText,
        item.value === value && styles.selectedOptionText
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Campo selector */}
      <TouchableOpacity
        style={[
          styles.field,
          error && styles.fieldError,
          disabled && styles.fieldDisabled,
          !selectedOption && styles.fieldPlaceholder,
        ]}
        onPress={openModal}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[
          styles.fieldText,
          !selectedOption && styles.placeholderText,
          disabled && styles.disabledText,
        ]}>
          {displayValue}
        </Text>
        
        {/* Icono de flecha */}
        <Text style={[
          styles.arrow,
          disabled && styles.disabledText,
        ]}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Mensaje de error */}
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      {/* Modal con opciones */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeModal}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || 'Selecciona una opción'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },

  required: {
    color: colors.states.error,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },

  fieldError: {
    borderColor: colors.states.error,
  },

  fieldDisabled: {
    backgroundColor: colors.background.disabled,
    borderColor: colors.border.light,
  },

  fieldPlaceholder: {
    // Estilos específicos cuando no hay valor seleccionado
  },

  fieldText: {
    ...typography.styles.body,
    color: colors.text.primary,
    flex: 1,
  },

  placeholderText: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },

  disabledText: {
    color: colors.text.disabled,
  },

  arrow: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    transform: [{ scaleY: 0.8 }], // Hacer la flecha un poco más pequeña
  },

  errorText: {
    ...typography.styles.bodySmall,
    color: colors.states.error,
    marginTop: spacing.xs,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  modalTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    flex: 1,
  },

  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm, // Compensar el padding para alinear con el borde
  },

  closeButtonText: {
    ...typography.styles.h3,
    color: colors.text.secondary,
  },

  optionsList: {
    maxHeight: 300,
  },

  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  selectedOption: {
    backgroundColor: colors.primary.light,
  },

  optionText: {
    ...typography.styles.body,
    color: colors.text.primary,
  },

  selectedOptionText: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },
});