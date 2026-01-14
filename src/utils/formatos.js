/**
 * Formatea número a moneda Peruana (S/ xx.xx)
 */
export function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(valor || 0);
}

/**
 * Formatea número con decimales
 */
export function formatearNumero(valor, decimales = 2) {
  return Number(valor || 0).toFixed(decimales);
}