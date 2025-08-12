/**
 * Hook useForm personalizado - ACTUALIZADO
 * Manejo de formularios con validación y estado
 */

import { useState } from 'react';
import { UseFormProps, UseFormReturn, FormValidation } from '../types/auth';

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormValidation>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Función para manejar cambios en los campos
  const handleChange = (field: keyof T) => (value: string) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo si existe
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  // Función para establecer error en un campo específico
  const setFieldError = (field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: {
        isValid: false,
        errorMessage: error,
      },
    }));
  };

  // Función para limpiar error de un campo específico
  const clearFieldError = (field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  };

  // Función para limpiar todos los errores
  const clearAllErrors = () => {
    setErrors({});
  };

  // Función para validar el formulario
  const validateForm = (): boolean => {
    if (!validationSchema) return true;

    const validationResult = validationSchema(values);
    setErrors(validationResult);

    // Verificar si hay errores
    const hasErrors = Object.values(validationResult).some(
      validation => !validation.isValid
    );

    return !hasErrors;
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async () => {
    // Limpiar errores previos
    clearAllErrors();

    // Validar formulario
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    // Establecer estado de envío
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setFieldError,
    clearFieldError,
  };
}