import { supabase } from '../supabaseClient';

/**
 * Servicios para reportes avanzados - ADAPTADO A TU BASE DE DATOS REAL
 */

// ============================================
// TOP 10 TRATAMIENTOS MÁS SOLICITADOS
// ============================================

/**
 * Obtiene los tratamientos más solicitados desde PAGOS
 * Usa la columna "tratamiento_realizado"
 */
export const obtenerTopTratamientos = async (fechaInicio, fechaFin, limite = 10) => {
    try {
        let query = supabase
            .from('pagos')
            .select('tratamiento_realizado, a_cuenta, fecha');

        if (fechaInicio) query = query.gte('fecha', fechaInicio);
        if (fechaFin) query = query.lte('fecha', fechaFin);

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por tratamiento_realizado
        const tratamientosMap = {};

        data.forEach(pago => {
            const tratamiento = pago.tratamiento_realizado || 'Sin especificar';

            if (!tratamientosMap[tratamiento]) {
                tratamientosMap[tratamiento] = {
                    nombre: tratamiento,
                    cantidad: 0,
                    ingresos: 0
                };
            }

            tratamientosMap[tratamiento].cantidad++;
            tratamientosMap[tratamiento].ingresos += parseFloat(pago.a_cuenta || 0);
        });

        // Convertir a array y ordenar
        const tratamientosArray = Object.values(tratamientosMap)
            .filter(t => t.nombre !== 'Sin especificar' && t.cantidad > 0)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, limite);

        return tratamientosArray;

    } catch (error) {
        console.error('Error obteniendo top tratamientos:', error);
        return [];
    }
};

// ============================================
// PRODUCTIVIDAD POR DENTISTA
// ============================================

/**
 * Obtiene productividad por dentista
 * NOTA: tabla pagos NO tiene dentista_id, solo se calcula por citas
 */
export const obtenerProductividadDentistas = async (fechaInicio, fechaFin) => {
    try {
        // Obtener citas (tiene dentista_id)
        let queryCitas = supabase
            .from('citas')
            .select('dentista_id, estado, fecha');

        if (fechaInicio) queryCitas = queryCitas.gte('fecha', fechaInicio);
        if (fechaFin) queryCitas = queryCitas.lte('fecha', fechaFin);

        const { data: citas, error: errorCitas } = await queryCitas;

        if (errorCitas) throw errorCitas;

        // Obtener IDs únicos de dentistas
        const dentistasIds = [...new Set(citas.map(c => c.dentista_id).filter(Boolean))];

        if (dentistasIds.length === 0) {
            return [];
        }

        // Obtener información de dentistas
        const { data: dentistas, error: errorDentistas } = await supabase
            .from('usuarios')
            .select('id, nombre_completo')
            .in('id', dentistasIds)
            .eq('rol', 'odontologo');

        if (errorDentistas) throw errorDentistas;

        // Crear mapa de dentistas
        const dentistasMap = {};
        dentistas.forEach(dentista => {
            dentistasMap[dentista.id] = {
                id: dentista.id,
                nombre: dentista.nombre_completo,
                totalCitas: 0,
                atendidas: 0,
                canceladas: 0,
                pendientes: 0,
                tasaAsistencia: 0,
                ingresos: 0 // Lo calcularemos después
            };
        });

        // Procesar citas
        citas.forEach(cita => {
            const dentistaId = cita.dentista_id;

            if (dentistasMap[dentistaId]) {
                dentistasMap[dentistaId].totalCitas++;

                if (cita.estado === 'atendida') {
                    dentistasMap[dentistaId].atendidas++;
                } else if (cita.estado === 'cancelada') {
                    dentistasMap[dentistaId].canceladas++;
                } else if (cita.estado === 'pendiente') {
                    dentistasMap[dentistaId].pendientes++;
                }
            }
        });

        // Calcular ingresos por dentista (desde pagos registrados por ese usuario)
        let queryPagos = supabase
            .from('pagos')
            .select('usuario_registro, a_cuenta, fecha');

        if (fechaInicio) queryPagos = queryPagos.gte('fecha', fechaInicio);
        if (fechaFin) queryPagos = queryPagos.lte('fecha', fechaFin);

        const { data: pagos, error: errorPagos } = await queryPagos;

        if (!errorPagos && pagos) {
            pagos.forEach(pago => {
                const dentistaId = pago.usuario_registro;
                if (dentistasMap[dentistaId]) {
                    dentistasMap[dentistaId].ingresos += parseFloat(pago.a_cuenta || 0);
                }
            });
        }

        // Calcular tasa de asistencia
        Object.values(dentistasMap).forEach(dentista => {
            if (dentista.totalCitas > 0) {
                dentista.tasaAsistencia = ((dentista.atendidas / dentista.totalCitas) * 100).toFixed(1);
            }
            dentista.ingresos = Math.round(dentista.ingresos);
        });

        return Object.values(dentistasMap).sort((a, b) => b.totalCitas - a.totalCitas);

    } catch (error) {
        console.error('Error obteniendo productividad de dentistas:', error);
        return [];
    }
};

// ============================================
// DISTRIBUCIÓN DE ESTADOS DE CITAS
// ============================================

export const obtenerDistribucionEstados = async (fechaInicio, fechaFin) => {
    try {
        let query = supabase
            .from('citas')
            .select('estado');

        if (fechaInicio) query = query.gte('fecha', fechaInicio);
        if (fechaFin) query = query.lte('fecha', fechaFin);

        const { data, error } = await query;

        if (error) throw error;

        const estadosMap = {
            'pendiente': { nombre: 'Pendiente', cantidad: 0, color: '#06b6d4' },
            'confirmada': { nombre: 'Confirmada', cantidad: 0, color: '#10b981' },
            'en_consulta': { nombre: 'En Consulta', cantidad: 0, color: '#a855f7' },
            'atendida': { nombre: 'Atendida', cantidad: 0, color: '#3b82f6' },
            'cancelada': { nombre: 'Cancelada', cantidad: 0, color: '#ef4444' },
            'reprogramada': { nombre: 'Reprogramada', cantidad: 0, color: '#f59e0b' }
        };

        data.forEach(cita => {
            const estado = cita.estado;
            if (estadosMap[estado]) {
                estadosMap[estado].cantidad++;
            }
        });

        const total = data.length;
        const distribucion = Object.values(estadosMap)
            .filter(estado => estado.cantidad > 0)
            .map(estado => ({
                ...estado,
                porcentaje: total > 0 ? ((estado.cantidad / total) * 100).toFixed(1) : 0
            }));

        return distribucion;

    } catch (error) {
        console.error('Error obteniendo distribución de estados:', error);
        return [];
    }
};

// ============================================
// RESUMEN FINANCIERO DETALLADO
// ============================================

export const obtenerResumenFinanciero = async (fechaInicio, fechaFin) => {
    try {
        let query = supabase
            .from('pagos')
            .select('a_cuenta, costo, metodo_pago, fecha');

        if (fechaInicio) query = query.gte('fecha', fechaInicio);
        if (fechaFin) query = query.lte('fecha', fechaFin);

        const { data, error } = await query;

        if (error) throw error;

        const totalIngresos = data.reduce((sum, p) => sum + parseFloat(p.a_cuenta || 0), 0);
        const totalCostos = data.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0);
        const totalDeudas = totalCostos - totalIngresos;

        // Agrupar por método de pago
        const porMetodo = {};
        data.forEach(pago => {
            const metodo = pago.metodo_pago || 'Sin especificar';
            if (!porMetodo[metodo]) {
                porMetodo[metodo] = {
                    metodo,
                    total: 0,
                    cantidad: 0
                };
            }
            porMetodo[metodo].total += parseFloat(pago.a_cuenta || 0);
            porMetodo[metodo].cantidad++;
        });

        const metodosPago = Object.values(porMetodo)
            .sort((a, b) => b.total - a.total)
            .map(m => ({
                ...m,
                total: Math.round(m.total),
                porcentaje: totalIngresos > 0 ? ((m.total / totalIngresos) * 100).toFixed(1) : 0
            }));

        return {
            totalIngresos: Math.round(totalIngresos),
            totalCostos: Math.round(totalCostos),
            totalDeudas: Math.round(totalDeudas),
            utilidad: Math.round(totalIngresos - (totalCostos * 0.3)),
            metodosPago,
            cantidadTransacciones: data.length,
            promedioTransaccion: data.length > 0 ? Math.round(totalIngresos / data.length) : 0
        };

    } catch (error) {
        console.error('Error obteniendo resumen financiero:', error);
        return {
            totalIngresos: 0,
            totalCostos: 0,
            totalDeudas: 0,
            utilidad: 0,
            metodosPago: [],
            cantidadTransacciones: 0,
            promedioTransaccion: 0
        };
    }
};
