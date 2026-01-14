import { supabase } from './supabaseClient';

// ✅ Función para obtener fecha local en ISO
const getLocalISOString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// ✅ Obtener todas las historias clínicas de un paciente
export async function obtenerHistoriasClinicasPorPaciente(pacienteId) {
    const { data, error } = await supabase
        .from('historias_clinicas')
        .select(`
            *,
            odontologo:odontologo_id (
                nombre_completo
            )
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error al obtener historias clínicas:', error.message);
        return [];
    }

    return data;
}

// ✅ Obtener una historia clínica por ID
export async function obtenerHistoriaClinicaPorId(id) {
    const { data, error } = await supabase
        .from('historias_clinicas')
        .select(`
            *,
            odontologo:odontologo_id (
                nombre_completo
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error al obtener historia clínica:', error.message);
        return null;
    }

    return data;
}

// ✅ Registrar una nueva historia clínica
export async function registrarHistoriaClinica(form) {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    // Obtener el ID del usuario en la tabla usuarios
    const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (usuarioError || !usuario) {
        throw new Error("No se pudo identificar al usuario");
    }

    const historiaData = Object.fromEntries(
        Object.entries({
            paciente_id: form.paciente_id,
            motivo_consulta: form.motivo_consulta,
            tiempo_enfermedad: form.tiempo_enfermedad,
            signos_sintomas: form.signos_sintomas,
            relato_enfermedad: form.relato_enfermedad,
            antecedentes_personales: form.antecedentes_personales,
            antecedentes_familiares: form.antecedentes_familiares,
            presion_arterial: form.presion_arterial,
            pulso: form.pulso,
            temperatura: form.temperatura,
            spo2: form.spo2,
            examen_fisico: form.examen_fisico,
            diagnostico_presuntivo: form.diagnostico_presuntivo,
            diagnostico_definitivo: form.diagnostico_definitivo,
            cie10_codigo: form.cie10_codigo,
            plan_tratamiento: form.plan_tratamiento,
            pronostico: form.pronostico,
            tratamiento_farmacologico: form.tratamiento_farmacologico,
            recomendaciones: form.recomendaciones,
            control_evolucion: form.control_evolucion,
            odontologo_id: usuario.id,
            usuario_registro_id: usuario.id,
            fecha: getLocalISOString(),
            fecha_actualizacion: getLocalISOString(),
        }).map(([key, value]) => [key, value === "" ? null : value])
    );

    const { data, error } = await supabase
        .from('historias_clinicas')
        .insert([historiaData])
        .select()
        .single();

    if (error) {
        console.error("Error al registrar historia clínica:", error);
        throw error;
    }

    return data;
}

// ✅ Actualizar una historia clínica existente
export async function actualizarHistoriaClinica(form, id) {
    const historiaActualizada = Object.fromEntries(
        Object.entries({
            motivo_consulta: form.motivo_consulta,
            tiempo_enfermedad: form.tiempo_enfermedad,
            signos_sintomas: form.signos_sintomas,
            relato_enfermedad: form.relato_enfermedad,
            antecedentes_personales: form.antecedentes_personales,
            antecedentes_familiares: form.antecedentes_familiares,
            presion_arterial: form.presion_arterial,
            pulso: form.pulso,
            temperatura: form.temperatura,
            spo2: form.spo2,
            examen_fisico: form.examen_fisico,
            diagnostico_presuntivo: form.diagnostico_presuntivo,
            diagnostico_definitivo: form.diagnostico_definitivo,
            cie10_codigo: form.cie10_codigo,
            plan_tratamiento: form.plan_tratamiento,
            pronostico: form.pronostico,
            tratamiento_farmacologico: form.tratamiento_farmacologico,
            recomendaciones: form.recomendaciones,
            control_evolucion: form.control_evolucion,
            fecha_actualizacion: getLocalISOString(),
        }).map(([key, value]) => [key, value === "" ? null : value])
    );

    const { data, error } = await supabase
        .from('historias_clinicas')
        .update(historiaActualizada)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error al actualizar historia clínica:", error.message);
        throw error;
    }

    return data;
}

// ✅ Eliminar una historia clínica
export async function eliminarHistoriaClinica(id) {
    const { error } = await supabase
        .from('historias_clinicas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error al eliminar historia clínica:", error.message);
        return false;
    }

    return true;
}
