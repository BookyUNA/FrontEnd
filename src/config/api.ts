/**
 * Configuración de la API - Booky
 */

// Base URL para todas las peticiones API
export const API_CONFIG = {
  //Localhost para emulador Android:
  BASE_URL: 'http://10.0.2.2:61288/api',

  //Servidor:
  //BASE_URL: 'https://backendbooky-apis-b8b9fzgxfadrdch7.canadacentral-01.azurewebsites.net/api',

  
  ENDPOINTS: {
    LOGIN: '/Login',
    LOGOUT: '/cerrarsesion',
    REGISTER: '/Register',
    FORGOT_PASSWORD: '/generarNuevoCodigoRecuperacion',
    RESET_PASSWORD: '/CambiarContrasena',
    PROFILE: '/MiPerfil',
    EDIT_PROFILE: '/editarInfoMiPerfil',
    VERIFY_EMAIL: '/VerificarEmail',  
    REGISTER_USER: '/RegistrarUsuario',
    RESEND_VERIFICATION_CODE: '/GenerarNuevoCodigoVerificacion',
    LISTAR_SERVICIOS_PROFESIONAL: '/Servicios/ListarServiciosProfesional',
  },
  TIMEOUT: 10000, // 10 segundos
} as const;

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

// Configuración de red
export const NETWORK_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
} as const;