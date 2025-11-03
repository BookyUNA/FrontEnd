/**
 * Servicio de Pagos - Booky
 * Manejo de pagos completo con Onvo y asignación de planes
 */

import { apiService } from '../api/apiService';
import { authService } from '../auth/authService';
import { API_CONFIG } from '../../config/api';

// =============================================
// INTERFACES Y TIPOS
// =============================================

// Request para OnvoCompleto
export interface PaymentRequest {
  Email: string;
  Name: string;
  Phone: string;
  CardNumber: string;
  ExpMonth: number;
  ExpYear: number;
  Cvc: string;
  CardholderName: string;
  Amount: number;
  Currency: string;
  Description: string;
  ExpiresAt: string;
}

// Error en respuestas de la API
export interface ApiError {
  ErrorCode: number;
  Message: string;
}

// Response de OnvoCompleto
export interface PaymentResponse {
  mensaje: string | null;
  customerId: string;
  paymentMethodId: string | null;
  last4: string | null;
  brand: string | null;
  idPagoOnvo: number;
  estadoPago: string | null;
  mensajeEstadoPago: string | null;
  amount: number;
  currency: string | null;
  fechaCreacion: string;
  error: ApiError[];
  resultado: boolean;
}

// Request para AsignarPlan
export interface AssignPlanRequest {
  NumeroPlan: number;
  IdPagoOnvo: number;
}

// Response de AsignarPlan
export interface AssignPlanResponse {
  idPlan: number;
  error: ApiError[];
  resultado: boolean;
}

// Estados de pago posibles
export type PaymentStatus = 'Completado' | 'Pendiente' | 'Fallido' | 'Error';

// Tipos de plan
export type PlanType = 'free' | 'basic' | 'premium';

// Mapeo de planes a números
export const PLAN_NUMBERS: Record<PlanType, number> = {
  free: 1,
  basic: 2,
  premium: 3,
};

// Interface para datos del formulario de pago
export interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string; // MM/YY format
  cvv: string;
  email: string;
  name: string;
  phone: string;
}

// Interface para datos del plan seleccionado
export interface SelectedPlan {
  type: PlanType;
  name: string;
  price: number; // En colones
  description: string;
}

// Resultado completo del proceso de pago
export interface PaymentResult {
  success: boolean;
  paymentStatus?: PaymentStatus;
  paymentId?: number;
  customerId?: string;
  planAssigned?: boolean;
  message: string;
  error?: string;
  isNetworkError?: boolean;
  paymentDetails?: {
    last4?: string;
    brand?: string;
    amount: number;
    currency: string;
    createdAt: string;
  };
}

// =============================================
// SERVICIO DE PAGOS
// =============================================

class PaymentService {

  /**
   * Procesar pago completo: pago + asignación de plan
   * Este método maneja toda la transacción de forma atómica
   */
  async processPaymentAndAssignPlan(
    paymentData: PaymentFormData,
    selectedPlan: SelectedPlan
  ): Promise<PaymentResult> {
    try {
      console.log('💳 PaymentService: Iniciando proceso de pago completo...');
      console.log('💳 Plan seleccionado:', selectedPlan);

      // Validar datos de entrada
      const validation = this.validatePaymentData(paymentData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Datos de pago inválidos',
        };
      }

      // Para plan gratuito, solo asignar plan sin pago
      if (selectedPlan.type === 'free') {
        return await this.assignFreePlan();
      }

      // Preparar datos para el pago
      const paymentRequest = this.preparePaymentRequest(paymentData, selectedPlan);

      console.log('💳 Datos de pago preparados:', {
        ...paymentRequest,
        CardNumber: '****-****-****-' + paymentRequest.CardNumber.slice(-4),
        Cvc: '***'
      });

      // Paso 1: Procesar pago con Onvo
      const paymentResult = await this.processOnvoPayment(paymentRequest);

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Paso 2: Si el pago fue exitoso, asignar plan
      if (paymentResult.paymentStatus === 'Completado' && paymentResult.paymentId) {
        console.log('💳 Pago completado, asignando plan...');
        
        const assignResult = await this.assignPlan(
          selectedPlan.type,
          paymentResult.paymentId
        );

        return {
          ...paymentResult,
          planAssigned: assignResult.success,
          message: assignResult.success 
            ? `¡Pago exitoso! Plan ${selectedPlan.name} activado correctamente.`
            : `Pago exitoso, pero hubo un problema al activar el plan. Contacta soporte.`
        };
      }

      // Si el pago está pendiente
      if (paymentResult.paymentStatus === 'Pendiente') {
        return {
          ...paymentResult,
          message: 'Pago en proceso. Te notificaremos cuando se confirme.'
        };
      }

      // Si el pago falló
      return {
        ...paymentResult,
        message: 'El pago no pudo ser procesado. Verifica tus datos e intenta nuevamente.'
      };

    } catch (error: any) {
      console.error('💳 Error en proceso de pago:', error);
      
      return {
        success: false,
        message: 'Error inesperado en el proceso de pago',
        error: error.message || 'Error desconocido',
        isNetworkError: error.message?.includes('conexión') || error.message?.includes('network'),
      };
    }
  }

  /**
   * Procesar pago con Onvo
   */
  private async processOnvoPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('💳 Procesando pago con Onvo...');

      // Obtener token de autenticación
      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          message: 'Usuario no autenticado. Inicia sesión nuevamente.',
        };
      }

      // Realizar petición a la API
      const response = await apiService.post<PaymentResponse>(
        '/OnvoCompleto',
        paymentRequest,
        token
      );

      console.log('💳 Respuesta de Onvo:', {
        success: response.success,
        status: response.status,
        resultado: response.data?.resultado,
        estadoPago: response.data?.estadoPago,
      });

      // Verificar errores de red
      if (!response.success && response.status === 0) {
        return {
          success: false,
          message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
          isNetworkError: true,
        };
      }

      // Verificar respuesta del servidor
      if (!response.data) {
        return {
          success: false,
          message: 'Respuesta inválida del servidor de pagos',
        };
      }

      const paymentResponse = response.data;

      // Si hay errores en la respuesta
      if (paymentResponse.error && paymentResponse.error.length > 0) {
        const errorMessage = this.extractPaymentErrorMessage(paymentResponse.error);
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }

      // Determinar estado del pago
      const paymentStatus = this.determinePaymentStatus(paymentResponse);
      
      // Preparar detalles del pago
    const paymentDetails = {
    last4: paymentResponse.last4 || undefined,    // string | undefined
    brand: paymentResponse.brand || undefined,    // string | undefined
    amount: paymentResponse.amount,
    currency: paymentResponse.currency || 'CRC',
    createdAt: paymentResponse.fechaCreacion,
    };

      return {
        success: paymentStatus === 'Completado',
        paymentStatus,
        paymentId: paymentResponse.idPagoOnvo,
        customerId: paymentResponse.customerId,
        message: paymentResponse.mensaje || 'Pago procesado',
        paymentDetails,
      };

    } catch (error: any) {
      console.error('💳 Error en pago Onvo:', error);
      
      return {
        success: false,
        message: 'Error al procesar el pago',
        error: error.message || 'Error desconocido',
        isNetworkError: error.message?.includes('conexión') || error.message?.includes('network'),
      };
    }
  }

  /**
   * Asignar plan al usuario
   */
  private async assignPlan(planType: PlanType, paymentId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('💳 Asignando plan:', { planType, paymentId });

      // Obtener token de autenticación
      const token = await authService.getToken();
      if (!token) {
        return {
          success: false,
          message: 'Token de autenticación no disponible',
        };
      }

      // Preparar request
      const assignRequest: AssignPlanRequest = {
        NumeroPlan: PLAN_NUMBERS[planType],
        IdPagoOnvo: paymentId,
      };

      console.log('💳 Request asignación plan:', assignRequest);

      // Realizar petición
      const response = await apiService.post<AssignPlanResponse>(
        '/Planes/AsignarPlan',
        assignRequest,
        token
      );

      console.log('💳 Respuesta asignación plan:', {
        success: response.success,
        status: response.status,
        resultado: response.data?.resultado,
      });

      // Verificar errores de red
      if (!response.success && response.status === 0) {
        return {
          success: false,
          message: 'Error de conexión al asignar plan',
        };
      }

      // Verificar respuesta del servidor
      if (!response.data) {
        return {
          success: false,
          message: 'Respuesta inválida del servidor al asignar plan',
        };
      }

      const assignResponse = response.data;

      // Si hay errores en la respuesta
      if (assignResponse.error && assignResponse.error.length > 0) {
        const errorMessage = this.extractPaymentErrorMessage(assignResponse.error);
        return {
          success: false,
          message: errorMessage,
        };
      }

      // Verificar resultado
      if (assignResponse.resultado) {
        console.log('💳 Plan asignado exitosamente');
        
        // Actualizar el plan en el storage local
        try {
          await authService.clearAuthData(); // Limpiar datos antiguos
          // El usuario deberá hacer login nuevamente para obtener el nuevo token con el plan actualizado
        } catch (storageError) {
          console.warn('💳 Error al actualizar storage local:', storageError);
          // No fallar por esto
        }
        
        return {
          success: true,
          message: 'Plan asignado correctamente',
        };
      }

      return {
        success: false,
        message: 'Error al asignar plan al usuario',
      };

    } catch (error: any) {
      console.error('💳 Error en asignación de plan:', error);
      
      return {
        success: false,
        message: 'Error inesperado al asignar plan',
      };
    }
  }

  /**
   * Asignar plan gratuito (sin pago)
   */
  private async assignFreePlan(): Promise<PaymentResult> {
    try {
      console.log('💳 Asignando plan gratuito...');

      const assignResult = await this.assignPlan('free', 0); // Sin ID de pago para plan gratuito

      return {
        success: assignResult.success,
        planAssigned: assignResult.success,
        message: assignResult.success 
          ? '¡Plan gratuito activado correctamente!'
          : 'Error al activar el plan gratuito. Intenta nuevamente.',
      };

    } catch (error: any) {
      console.error('💳 Error en plan gratuito:', error);
      
      return {
        success: false,
        message: 'Error al activar el plan gratuito',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Preparar datos para el request de pago
   */
  private preparePaymentRequest(paymentData: PaymentFormData, selectedPlan: SelectedPlan): PaymentRequest {
    // Parsear fecha de expiración (MM/YY -> MM, YYYY)
    const [expMonth, expYear] = paymentData.expiryDate.split('/');
    const fullYear = parseInt('20' + expYear); // Convertir YY a YYYY

    // Calcular fecha de expiración (30 días desde ahora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return {
      Email: paymentData.email,
      Name: paymentData.name,
      Phone: paymentData.phone,
      CardNumber: paymentData.cardNumber.replace(/\s/g, ''), // Remover espacios
      ExpMonth: parseInt(expMonth),
      ExpYear: fullYear,
      Cvc: paymentData.cvv,
      CardholderName: paymentData.cardHolder,
      Amount: selectedPlan.price,
      Currency: 'CRC',
      Description: `Suscripción ${selectedPlan.name} - Booky`,
      ExpiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Validar datos de pago
   */
  private validatePaymentData(paymentData: PaymentFormData): { isValid: boolean; error?: string } {
    // Validar número de tarjeta
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { isValid: false, error: 'Número de tarjeta inválido' };
    }

    // Validar titular
    if (!paymentData.cardHolder || paymentData.cardHolder.trim().length < 3) {
      return { isValid: false, error: 'Nombre del titular requerido' };
    }

    // Validar fecha de expiración
    if (!paymentData.expiryDate || paymentData.expiryDate.length !== 5) {
      return { isValid: false, error: 'Fecha de expiración inválida' };
    }

    // Validar CVV
    if (!paymentData.cvv || paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
      return { isValid: false, error: 'CVV inválido' };
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentData.email)) {
      return { isValid: false, error: 'Email inválido' };
    }

    // Validar teléfono
    if (!paymentData.phone || paymentData.phone.length < 8) {
      return { isValid: false, error: 'Teléfono inválido' };
    }

    return { isValid: true };
  }

  /**
   * Determinar estado del pago basado en la respuesta
   */
  private determinePaymentStatus(response: PaymentResponse): PaymentStatus {
    if (response.error && response.error.length > 0) {
      return 'Error';
    }

    if (response.estadoPago) {
      switch (response.estadoPago.toLowerCase()) {
        case 'completado':
          return 'Completado';
        case 'pendiente':
          return 'Pendiente';
        case 'fallido':
          return 'Fallido';
        default:
          return 'Error';
      }
    }

    return 'Error';
  }

  /**
   * Extraer mensaje de error de la respuesta de pago
   */
  private extractPaymentErrorMessage(errors: ApiError[]): string {
    if (!errors || errors.length === 0) {
      return 'Error desconocido en el pago';
    }

    const firstError = errors[0];
    
    switch (firstError.ErrorCode) {
      case 40002:
        return 'Error al procesar el pago. Verifica los datos de tu tarjeta.';
      case 40001:
        return 'Datos de tarjeta inválidos.';
      case 40003:
        return 'Fondos insuficientes en la tarjeta.';
      case 40004:
        return 'Tarjeta expirada.';
      case 40005:
        return 'Tarjeta bloqueada o restringida.';
      default:
        return firstError.Message || 'Error en el procesamiento del pago';
    }
  }

  /**
   * Obtener información de planes disponibles
   */
  getPlanInfo(planType: PlanType): SelectedPlan {
    const plans: Record<PlanType, SelectedPlan> = {
      free: {
        type: 'free',
        name: 'Plan Gratuito',
        price: 0,
        description: 'Ideal para profesionales que están comenzando',
      },
      basic: {
        type: 'basic',
        name: 'Plan Básico',
        price: 5015, // $9.99 × 502 CRC/USD
        description: 'Ideal para profesionales asentados',
      },
      premium: {
        type: 'premium',
        name: 'Plan Premium',
        price: 10035, // $19.99 × 502 CRC/USD
        description: 'Para profesionales con necesidades avanzadas',
      },
    };

    return plans[planType];
  }

  /**
   * Función de debug para mostrar estado del servicio
   */
  async debugPaymentService(): Promise<void> {
    console.log('🔍 === DEBUG PAYMENT SERVICE ===');
    
    const isAuthenticated = await authService.isAuthenticated();
    const token = await authService.getToken();
    const userRole = await authService.getUserRole();
    const planId = await authService.getUserPlanId();
    
    console.log('- Usuario autenticado:', isAuthenticated);
    console.log('- Tiene token:', !!token);
    console.log('- Rol del usuario:', userRole);
    console.log('- Plan actual:', planId);
    console.log('- Planes disponibles:', Object.keys(PLAN_NUMBERS));
    
    console.log('🔍 === FIN DEBUG PAYMENT SERVICE ===');
  }
}

// Instancia singleton del servicio
export const paymentService = new PaymentService();