import { supabase } from '../supabaseClient';
import { obtenerFechaPeruHoy } from '../../utils/fechas';

// ========================================================
// CREAR CITA CON VALIDACIÓN DE DISPONIBILIDAD
// ========================================================
export async function crearCita(cita, usuarioId) {
    // Validar disponibilidad
    const disponible = await verificarDisponibilidad(
        cita.fecha,
        cita.hora_inicio,
        cita.hora_fin
    );

    if (!disponible) {
        throw new Error('⚠️ Este horario ya está ocupado por otra cita');
    }

    const { data, error } = await supabase
        .from('citas')
        .insert([{
            ...cita,
            estado: 'pendiente',
            creado_por: usuarioId,
            fecha_creacion: new Date().toISOString()
        }])
        .select(`
            *,
            pacientes(*),
            usuarios!dentista_id(*)
        `)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ========================================================
// EDITAR CITA CON VALIDACIÓN
// ========================================================
export async function editarCita(id, cita, usuarioId) {
    // Si cambia fecha/hora, validar disponibilidad
    if (cita.fecha || cita.hora_inicio || cita.hora_fin) {
        const citaActual = await obtenerCitaById(id);
        const fecha = cita.fecha || citaActual.fecha;
        const horaInicio = cita.hora_inicio || citaActual.hora_inicio;
        const horaFin = cita.hora_fin || citaActual.hora_fin || null;

        const disponible = await verificarDisponibilidad(
            fecha,
            horaInicio,
            horaFin,
            id
        );

        if (!disponible) {
            throw new Error('⚠️ Este horario ya está ocupado por otra cita');
        }
    }

    const { data, error } = await supabase
        .from('citas')
        .update({
            ...cita,
            fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
            *,
            pacientes(*),
            usuarios!dentista_id(*)
        `)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ========================================================
// OBTENER TODAS LAS CITAS CON FILTROS AVANZADOS
// ========================================================
export async function obtenerCitas({
    fecha_inicio,
    fecha_fin,
    estado,
    dentista_id,
    paciente_id
} = {}) {
    let query = supabase
        .from('citas')
        .select(`
            *,
            pacientes(*),
            usuarios!dentista_id(*)
        `)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: true });

    if (fecha_inicio) {
        query = query.gte('fecha', `${fecha_inicio}T00:00:00-05:00`);
    }
    if (fecha_fin) {
        query = query.lte('fecha', `${fecha_fin}T23:59:59-05:00`);
    }
    if (estado) {
        query = query.eq('estado', estado);
    }
    if (dentista_id) {
        query = query.eq('dentista_id', dentista_id);
    }
    if (paciente_id) {
        query = query.eq('paciente_id', paciente_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
}

// ========================================================
// OBTENER CITA POR ID
// ========================================================
export async function obtenerCitaById(id) {
    const { data, error } = await supabase
        .from('citas')
        .select(`
            *,
            pacientes(*),
            usuarios!dentista_id(*)
        `)
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ========================================================
// ACTUALIZAR ESTADO DE CITA
// ========================================================
export async function actualizarEstadoCita(id, estado, motivo = null) {
    const updateData = {
        estado,
        fecha_actualizacion: new Date().toISOString()
    };

    if (estado === 'cancelada') {
        updateData.motivo_cancelacion = motivo;
    }

    const { data, error } = await supabase
        .from('citas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ========================================================
// CANCELAR CITA CON MOTIVO
// ========================================================
export async function cancelarCita(id, motivo) {
    return await actualizarEstadoCita(id, 'cancelada', motivo);
}

// ========================================================
// REPROGRAMAR CITA
// ========================================================
export async function reprogramarCita(id, nuevaFecha, nuevaHoraInicio, nuevaHoraFin = null) {
    const disponible = await verificarDisponibilidad(
        nuevaFecha,
        nuevaHoraInicio,
        nuevaHoraFin,
        id
    );

    if (!disponible) {
        throw new Error('⚠️ El nuevo horario no está disponible');
    }

    const { data, error } = await supabase
        .from('citas')
        .update({
            fecha: nuevaFecha,
            hora_inicio: nuevaHoraInicio,
            hora_fin: nuevaHoraFin,
            estado: 'reprogramada',
            fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ========================================================
// VERIFICAR DISPONIBILIDAD DE HORARIO (CRÍTICO)
// ========================================================
export async function verificarDisponibilidad(fecha, horaInicio, horaFin, citaIdExcluir = null) {
    let query = supabase
        .from('citas')
        .select('id, hora_inicio, hora_fin')
        .eq('fecha', fecha)
        .neq('estado', 'cancelada');

    if (citaIdExcluir) {
        query = query.neq('id', citaIdExcluir);
    }

    const { data: citasExistentes, error } = await query;
    if (error) throw new Error(error.message);

    // Verificar superposición de horarios
    const inicioNuevo = new Date(`${fecha}T${horaInicio}`);
    const finNuevo = horaFin ? new Date(`${fecha}T${horaFin}`) : new Date(`${fecha}T23:59:59`);

    return !citasExistentes.some(cita => {
        const inicioExistente = new Date(`${fecha}T${cita.hora_inicio}`);
        const finExistente = cita.hora_fin ? new Date(`${fecha}T${cita.hora_fin}`) : new Date(`${fecha}T23:59:59`);

        return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });
}

// ========================================================
// OBTENER ESTADÍSTICAS DE CITAS
// ========================================================
export async function obtenerEstadisticasCitas(fechaInicio, fechaFin) {
    const citas = await obtenerCitas({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });

    return {
        total: citas.length,
        confirmadas: citas.filter(c => c.estado === 'confirmada').length,
        pendientes: citas.filter(c => c.estado === 'pendiente').length,
        canceladas: citas.filter(c => c.estado === 'cancelada').length,
        reprogramadas: citas.filter(c => c.estado === 'reprogramada').length,
        enConsulta: citas.filter(c => c.estado === 'en_consulta').length,
        atendidas: citas.filter(c => c.estado === 'atendida').length,
        hoy: citas.filter(c => c.fecha === obtenerFechaPeruHoy()).length
    };
}

// ========================================================
// OBTENER CITAS DEL DÍA ACTUAL
// ========================================================
export async function obtenerCitasHoy() {
    const fechaHoy = obtenerFechaPeruHoy();
    return await obtenerCitas({
        fecha_inicio: fechaHoy,
        fecha_fin: fechaHoy
    });
}