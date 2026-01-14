import { supabase } from '../supabaseClient';

/**
 * Servicio para obtener datos de gráficos
 */

/**
 * Obtiene datos de citas de los últimos N meses
 */
export const obtenerDatosCitasPorMes = async (meses = 6, dentistaId = null) => {
    try {
        // Calcular fecha de inicio (N meses atrás)
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - meses);

        let query = supabase
            .from('citas')
            .select('fecha, estado')
            .gte('fecha', fechaInicio.toISOString().split('T')[0])
            .lte('fecha', fechaFin.toISOString().split('T')[0])
            .order('fecha', { ascending: true });

        if (dentistaId) {
            query = query.eq('dentista_id', dentistaId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por mes
        const citasPorMes = {};

        data.forEach(cita => {
            const fecha = new Date(cita.fecha);
            const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

            if (!citasPorMes[mesAnio]) {
                citasPorMes[mesAnio] = {
                    total: 0,
                    atendidas: 0,
                    canceladas: 0,
                    pendientes: 0,
                    confirmadas: 0
                };
            }

            citasPorMes[mesAnio].total++;

            if (cita.estado === 'atendida') {
                citasPorMes[mesAnio].atendidas++;
            } else if (cita.estado === 'cancelada') {
                citasPorMes[mesAnio].canceladas++;
            } else if (cita.estado === 'pendiente') {
                citasPorMes[mesAnio].pendientes++;
            } else if (cita.estado === 'confirmada') {
                citasPorMes[mesAnio].confirmadas++;
            }
        });

        // Convertir a array para el gráfico
        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return Object.keys(citasPorMes)
            .sort()
            .slice(-meses) // Últimos N meses
            .map(mesAnio => {
                const [anio, mes] = mesAnio.split('-');
                const mesNum = parseInt(mes) - 1;

                return {
                    mes: mesesNombres[mesNum],
                    mesCompleto: `${mesesNombres[mesNum]} ${anio}`,
                    citas: citasPorMes[mesAnio].total,
                    atendidas: citasPorMes[mesAnio].atendidas,
                    canceladas: citasPorMes[mesAnio].canceladas,
                    pendientes: citasPorMes[mesAnio].pendientes,
                    confirmadas: citasPorMes[mesAnio].confirmadas
                };
            });

    } catch (error) {
        console.error('Error obteniendo datos de citas por mes:', error);
        return [];
    }
};

/**
 * Obtiene datos de ingresos de los últimos N meses
 */
export const obtenerDatosIngresosPorMes = async (meses = 6, dentistaId = null) => {
    try {
        // Calcular fecha de inicio
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - meses);

        let query = supabase
            .from('pagos')
            .select('fecha, a_cuenta, costo, metodo_pago')
            .gte('fecha', fechaInicio.toISOString().split('T')[0])
            .lte('fecha', fechaFin.toISOString().split('T')[0])
            .order('fecha', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        // Agrupar por mes
        const ingresosPorMes = {};

        data.forEach(pago => {
            const fecha = new Date(pago.fecha);
            const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

            if (!ingresosPorMes[mesAnio]) {
                ingresosPorMes[mesAnio] = {
                    ingresos: 0,
                    costos: 0,
                    cantidadPagos: 0
                };
            }

            ingresosPorMes[mesAnio].ingresos += parseFloat(pago.a_cuenta || 0);
            ingresosPorMes[mesAnio].costos += parseFloat(pago.costo || 0);
            ingresosPorMes[mesAnio].cantidadPagos++;
        });

        // Convertir a array
        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return Object.keys(ingresosPorMes)
            .sort()
            .slice(-meses)
            .map(mesAnio => {
                const [anio, mes] = mesAnio.split('-');
                const mesNum = parseInt(mes) - 1;

                return {
                    mes: mesesNombres[mesNum],
                    mesCompleto: `${mesesNombres[mesNum]} ${anio}`,
                    ingresos: Math.round(ingresosPorMes[mesAnio].ingresos),
                    costos: Math.round(ingresosPorMes[mesAnio].costos),
                    deudas: Math.round(ingresosPorMes[mesAnio].costos - ingresosPorMes[mesAnio].ingresos),
                    cantidadPagos: ingresosPorMes[mesAnio].cantidadPagos
                };
            });

    } catch (error) {
        console.error('Error obteniendo datos de ingresos por mes:', error);
        return [];
    }
};
