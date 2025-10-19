/**
 * Configuración de la API - Booky
 */

// Base URL para todas las peticiones API
export const API_CONFIG = {
  //Localhost para emulador Android:
  //BASE_URL: 'http://10.0.2.2:61288/api',

  //Servidor:
  BASE_URL: 'https://backendbooky-apis-b8b9fzgxfadrdch7.canadacentral-01.azurewebsites.net/api',
  ENDPOINTS: {
    LOGIN: '/Login',
    LOGOUT: '/cerrarsesion',
    REGISTER: '/Register',
    FORGOT_PASSWORD: '/generarNuevoCodigoRecuperacion',
    RESET_PASSWORD: '/CambiarContrasena',
    PROFILE: '/MiPerfil',
    EDIT_PROFILE: '/EditarMiPerfil',
    VERIFY_EMAIL: '/VerificarEmail',  
    REGISTER_USER: '/RegistrarUsuario',
    RESEND_VERIFICATION_CODE: '/GenerarNuevoCodigoVerificacion',
    LISTAR_SERVICIOS_PROFESIONAL: '/Servicios/ListarServiciosProfesional',
    CREAR_SERVICIO: '/Servicios/CrearServicio',
    ACTUALIZAR_SERVICIO: '/Servicios/ActualizarServicio',
    CAMBIAR_ESTADO_SERVICIO: '/CambiarEstadoServicio',
    LISTAR_SERVICIOS_FILTROS: '/ListarServiciosFiltros',
    SOLICITAR_CITA: '/SolicitarCita',
    LISTAR_CITAS_CLIENTE: '/ListarCitasCliente',
    REPROGRAMAR_CITA: '/ReprogramarCita',
    LISTAR_CITAS_PROFESIONAL: '/ListarCitasProfesional',
    APROBAR_DENEGAR_CITA: '/AprobarDenegarCita',
    CANCELAR_CITA: '/CancelarCita',
    EDIT_PROFESSIONAL_PROFILE: '/EditarMiPerfilProfesional',
    CALIFICAR_PROFESIONAL: '/CalificarProfesional',
    CREAR_EVENTO: '/CrearEvento',
    AGREGAR_HORARIOS: '/AgregarHorarios', 
    OBTENER_CALIFICACION_PROMEDIO: '/ObtenerCalficacionPromedio',
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