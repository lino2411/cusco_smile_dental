/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (Perú UTC-5)
 */
export function obtenerFechaPeruHoy() {
  const fechaStr = new Date().toLocaleString('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [mes, dia, anio] = fechaStr.split('/');
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Obtiene la fecha y hora actual en formato ISO de Perú
 */
export function obtenerFechaHoraPeruISO() {
  const fechaLima = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
  return new Date(fechaLima).toISOString();
}

/**
 * Formatea fecha ISO a formato legible con hora (Perú)
 */
export function formatearFechaHora(fechaISO) {
  const fecha = new Date(fechaISO);

  return fecha.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Formatea solo hora (HH:MM)
 */
export function formatearHora(hora) {
  if (!hora) return '--:--';
  const [h, m] = hora.split(':');
  return `${h}:${m}`;
}

/**
 * Formatea solo fecha (sin hora) en formato legible
 * CORREGIDO: Maneja correctamente fechas tipo DATE
 */
export function formatearFecha(fechaISO) {
  // Si la fecha viene sin hora (formato YYYY-MM-DD), agregar hora del mediodía
  let fechaStr = fechaISO;

  if (typeof fechaISO === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    fechaStr = `${fechaISO}T12:00:00`;
  }

  const fecha = new Date(fechaStr);

  return fecha.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}