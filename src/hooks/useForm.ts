/**
 * Hook personalizado para manejo de formularios
 * CREAR ESTE ARCHIVO EN: src/hooks/useForm.ts
 */

import { useState, useCallback } from 'react';
import { UseFormProps, UseFormReturn, FormValidation } from '../types/auth';

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> {
  // Estados del formulario
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormValidation>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar cambios en los campos
  const handleChange = useCallback((field: keyof T) => {
    return (value: string) => {
      // Actualizar el valor
      setValues(prev => ({
        ...prev,
        [field]: value,
      }));

      // Limpiar error del campo si existe
      if (errors[field as string] && !errors[field as string].isValid) {
        setErrors(prev => ({
          ...prev,
          [field as string]: { isValid: true },
        }));
      }
    };
  }, [errors]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Validar todo el formulario si hay esquema de validación
      if (validationSchema) {
        const validation = validationSchema(values);
        setErrors(validation);

        // Verificar si hay errores
        const hasErrors = Object.values(validation).some(field => !field.isValid);
        
        if (hasErrors) {
          setIsSubmitting(false);
          return;
        }
      }

      // Si no hay errores, ejecutar onSubmit
      await onSubmit(values);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema, onSubmit, isSubmitting]);

  // Resetear el formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Establecer error en un campo específico
  const setFieldError = useCallback((field: keyof T, errorMessage: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: {
        isValid: false,
        errorMessage,
      },
    }));
  }, []);

  // Limpiar error de un campo específico
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: { isValid: true },
    }));
  }, []);

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