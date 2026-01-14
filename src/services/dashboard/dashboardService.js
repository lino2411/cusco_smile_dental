import { supabase } from '../supabaseClient';
import { obtenerFechaPeruHoy } from '../../utils/fechas';

export const obtenerEstadisticasDashboard = async () => {
    try {
        const hoy = obtenerFechaPeruHoy();

        const ahora = new Date();
        const año = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const inicioMes = `${año}-${mes}-01`;
        const ultimoDiaMes = new Date(año, ahora.getMonth() + 1, 0).getDate();
        const finMes = `${año}-${mes}-${String(ultimoDiaMes).padStart(2, '0')}`;

        // Citas de hoy
        const { count: citasHoy } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .eq('fecha', hoy)
            .in('estado', ['pendiente', 'confirmada', 'en_consulta']);

        // Citas del mes
        const { count: citasMes } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .gte('fecha', inicioMes)
            .lte('fecha', finMes);

        // Total de pacientes
        const { count: totalPacientes } = await supabase
            .from('pacientes')
            .select('*', { count: 'exact', head: true });

        // Ingresos del mes
        const { data: pagos } = await supabase
            .from('pagos')
            .select('a_cuenta')
            .gte('fecha', inicioMes)
            .lte('fecha', finMes);

        const ingresosMes = pagos?.reduce((sum, p) => sum + (parseFloat(p.a_cuenta) || 0), 0) || 0;

        // Citas por estado
        const { data: citasPorEstado } = await supabase
            .from('citas')
            .select('estado')
            .gte('fecha', inicioMes)
            .lte('fecha', finMes);

        const estadoCounts = citasPorEstado?.reduce((acc, cita) => {
            acc[cita.estado] = (acc[cita.estado] || 0) + 1;
            return acc;
        }, {});

        // ✅ Próximas citas de hoy - SIN relación con usuarios
        const { data: proximasCitas, error: errorCitas } = await supabase
            .from('citas')
            .select('id, fecha, hora_inicio, hora_fin, nombre_paciente, motivo, estado')
            .eq('fecha', hoy)
            .in('estado', ['pendiente', 'confirmada', 'en_consulta'])
            .order('hora_inicio', { ascending: true })
            .limit(5);

        if (errorCitas) {
            console.error('❌ Error completo:', errorCitas);
        }

        // Últimos pagos
        const { data: ultimosPagos } = await supabase
            .from('pagos')
            .select(`
                id,
                fecha,
                a_cuenta,
                tratamiento_realizado,
                pacientes (nombres, apellidos)
            `)
            .order('fecha', { ascending: false })
            .limit(5);

        // Pacientes recientes
        const { data: pacientesRecientes } = await supabase
            .from('pacientes')
            .select('id, nombres, apellidos, creado_en')
            .order('creado_en', { ascending: false })
            .limit(5);

        return {
            citasHoy: citasHoy || 0,
            citasMes: citasMes || 0,
            totalPacientes: totalPacientes || 0,
            ingresosMes: ingresosMes,
            citasPorEstado: estadoCounts || {},
            proximasCitas: proximasCitas || [],
            ultimosPagos: ultimosPagos || [],
            pacientesRecientes: pacientesRecientes || []
        };
    } catch (error) {
        console.error('❌ Error general:', error);
        return {
            citasHoy: 0,
            citasMes: 0,
            totalPacientes: 0,
            ingresosMes: 0,
            citasPorEstado: {},
            proximasCitas: [],
            ultimosPagos: [],
            pacientesRecientes: []
        };
    }
};
