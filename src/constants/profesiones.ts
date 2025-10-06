/**
 * Constantes de Profesiones - Booky
 * Lista de profesiones disponibles para profesionales independientes
 */

export const PROFESIONES = [
  "Psicólogo",
  "Terapeuta",
  "Nutricionista",
  "Entrenador personal",
  "Coach de vida",
  "Coach de negocios",
  "Abogado",
  "Contador",
  "Consultor empresarial",
  "Estilista",
  "Peluquero",
  "Esteticista",
  "Masajista",
  "Veterinario",
  "Dentista",
  "Fotógrafo",
  "Diseñador gráfico",
  "Arquitecto",
  "Profesor particular",
  "Instructor de yoga",
  "Tatuador",
  "Maquillador profesional",
  "Barbero",
  "Consultor de marketing",
  "Fisioterapeuta",
  "Asesor de imagen",
  "Profesor de música",
  "Acupunturista",
  "Consultor inmobiliario"
] as const;

export type Profesion = typeof PROFESIONES[number];