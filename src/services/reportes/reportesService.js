import { supabase } from '../supabaseClient';
import { obtenerFechaPeruHoy } from '../../utils/fechas';

/**
 * Servicio principal de reportes
 * Coordina la obtención de datos de todos los módulos
 */

/**
 * Obtiene el resumen ejecutivo completo
 * @param {Object} filtros - Filtros de fecha y dentista
 * @returns {Object} Resumen con todas las métricas
 */
export const obtenerResumenEjecutivo = async (filtros = {}) => {
    try {
        const {
            fechaInicio = obtenerPrimerDiaMes(),
            fechaFin = obtenerFechaPeruHoy(),
            dentistaId = null
        } = filtros;

        // Ejecutar todas las consultas en paralelo para mejor performance
        const [citasData, pagosData, pacientesData] = await Promise.all([
            obtenerResumenCitas(fechaInicio, fechaFin, dentistaId),
            obtenerResumenPagos(fechaInicio, fechaFin, dentistaId),
            obtenerResumenPacientes(fechaInicio, fechaFin)
        ]);

        return {
            citas: citasData,
            pagos: pagosData,
            pacientes: pacientesData,
            periodo: {
                inicio: fechaInicio,
                fin: fechaFin
            }
        };
    } catch (error) {
        console.error('Error obteniendo resumen ejecutivo:', error);
        throw new Error('No se pudo cargar el resumen ejecutivo');
    }
};

/**
 * Obtiene resumen de citas
 */
const obtenerResumenCitas = async (fechaInicio, fechaFin, dentistaId) => {
    try {
        let query = supabase
            .from('citas')
            .select('estado, fecha')
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin);

        if (dentistaId) {
            query = query.eq('dentista_id', dentistaId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcular métricas
        const total = data.length;
        const porEstado = data.reduce((acc, cita) => {
            acc[cita.estado] = (acc[cita.estado] || 0) + 1;
            return acc;
        }, {});

        // Calcular tasa de asistencia
        const atendidas = porEstado.atendida || 0;
        const canceladas = porEstado.cancelada || 0;
        const tasaAsistencia = total > 0 ? ((atendidas / total) * 100).toFixed(1) : 0;

        return {
            total,
            porEstado,
            atendidas,
            canceladas,
            tasaAsistencia
        };
    } catch (error) {
        console.error('Error en resumen de citas:', error);
        return {
            total: 0,
            porEstado: {},
            atendidas: 0,
            canceladas: 0,
            tasaAsistencia: 0
        };
    }
};

/**
 * Obtiene resumen de pagos/ingresos
 */
const obtenerResumenPagos = async (fechaInicio, fechaFin, dentistaId) => {
    try {
        let query = supabase
            .from('pagos')
            .select('a_cuenta, costo, fecha, metodo_pago');

        // Aplicar filtros de fecha
        if (fechaInicio) query = query.gte('fecha', fechaInicio);
        if (fechaFin) query = query.lte('fecha', fechaFin);

        const { data, error } = await query;

        if (error) throw error;

        // Calcular métricas financieras
        const totalIngresos = data.reduce((sum, p) => sum + parseFloat(p.a_cuenta || 0), 0);
        const totalCostos = data.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0);
        const totalDeudas = totalCostos - totalIngresos;

        // Ingresos por método de pago
        const porMetodoPago = data.reduce((acc, pago) => {
            const metodo = pago.metodo_pago || 'Sin especificar';
            acc[metodo] = (acc[metodo] || 0) + parseFloat(pago.a_cuenta || 0);
            return acc;
        }, {});

        return {
            totalIngresos,
            totalCostos,
            totalDeudas,
            cantidadPagos: data.length,
            porMetodoPago,
            promedioIngreso: data.length > 0 ? (totalIngresos / data.length).toFixed(2) : 0
        };
    } catch (error) {
        console.error('Error en resumen de pagos:', error);
        return {
            totalIngresos: 0,
            totalCostos: 0,
            totalDeudas: 0,
            cantidadPagos: 0,
            porMetodoPago: {},
            promedioIngreso: 0
        };
    }
};

/**
 * Obtiene resumen de pacientes
 */
const obtenerResumenPacientes = async (fechaInicio, fechaFin) => {
    try {
        // Total de pacientes
        const { count: totalPacientes } = await supabase
            .from('pacientes')
            .select('*', { count: 'exact', head: true });

        // Pacientes nuevos en el período
        const { count: pacientesNuevos } = await supabase
            .from('pacientes')
            .select('*', { count: 'exact', head: true })
            .gte('creado_en', fechaInicio)
            .lte('creado_en', fechaFin);

        // Pacientes con citas en el período (activos)
        const { data: citasPeriodo } = await supabase
            .from('citas')
            .select('paciente_id')
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin);

        const pacientesActivos = new Set(citasPeriodo?.map(c => c.paciente_id) || []).size;

        return {
            total: totalPacientes || 0,
            nuevos: pacientesNuevos || 0,
            activos: pacientesActivos,
            inactivos: (totalPacientes || 0) - pacientesActivos
        };
    } catch (error) {
        console.error('Error en resumen de pacientes:', error);
        return {
            total: 0,
            nuevos: 0,
            activos: 0,
            inactivos: 0
        };
    }
};

/**
 * Obtiene el primer día del mes actual
 */
const obtenerPrimerDiaMes = () => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
};
