import { supabase } from "./supabaseClient";
import { obtenerFechaHoraPeruISO } from "../utils/fechas";

/**
 * Obtener controles de ortodoncia por paciente
 * ✅ INCLUYE firma_id para mostrar en tablas
 */
export async function obtenerControlesOrtodonciaPorPaciente(pacienteId) {
    const { data, error } = await supabase
        .from("controles_ortodoncia")
        .select(`
            id,
            paciente_id,
            fecha,
            tratamiento_realizado,
            cuota,
            firma,
            firma_id,
            created_at,
            updated_at,
            usuario_registro
        `)
        .eq("paciente_id", pacienteId)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error obteniendo controles de ortodoncia:", error);
        throw error;
    }
    return data;
}

/**
 * Obtener todos los controles de ortodoncia (para vista global)
 * ✅ INCLUYE datos del paciente y firma_id
 */
export async function obtenerTodosControlesOrtodoncia() {
    const { data, error } = await supabase
        .from("controles_ortodoncia")
        .select(`
            *,
            paciente:paciente_id (
                id,
                nombres,
                apellidos,
                dni
            )
        `)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error obteniendo todos los controles:", error);
        throw error;
    }
    return data;
}

/**
 * Crear nuevo control de ortodoncia
 * ✅ INCLUYE firma_id
 */
export async function crearControlOrtodoncia(control) {
    const { data, error } = await supabase
        .from("controles_ortodoncia")
        .insert([{
            paciente_id: control.paciente_id,
            fecha: control.fecha,
            tratamiento_realizado: control.tratamiento_realizado,
            cuota: control.cuota,
            firma: control.firma || false,
            firma_id: control.firma_id || null, // ✅ AGREGADO
            usuario_registro: control.usuario_registro || null,
            created_at: obtenerFechaHoraPeruISO()
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creando control de ortodoncia:", error);
        throw error;
    }
    return data;
}

/**
 * Actualizar control de ortodoncia
 * ✅ INCLUYE firma_id
 */
export async function actualizarControlOrtodoncia(id, datosActualizados) {
    const { data, error } = await supabase
        .from("controles_ortodoncia")
        .update({
            fecha: datosActualizados.fecha,
            tratamiento_realizado: datosActualizados.tratamiento_realizado,
            cuota: datosActualizados.cuota,
            firma: datosActualizados.firma,
            firma_id: datosActualizados.firma_id, // ✅ AGREGADO
            usuario_registro: datosActualizados.usuario_registro,
            updated_at: obtenerFechaHoraPeruISO()
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error actualizando control de ortodoncia:", error);
        throw error;
    }
    return data;
}

/**
 * Eliminar control de ortodoncia
 * ✅ También elimina la firma asociada si existe
 */
export async function eliminarControlOrtodoncia(id) {
    try {
        // 1. Obtener el control para saber si tiene firma
        const { data: control, error: errorControl } = await supabase
            .from("controles_ortodoncia")
            .select("firma_id")
            .eq("id", id)
            .single();

        if (errorControl) {
            console.error("Error obteniendo control:", errorControl);
        }

        // 2. Eliminar el movimiento en caja_movimientos (si existe)
        const { error: errorCaja } = await supabase
            .from("caja_movimientos")
            .delete()
            .eq("referencia_id", id)
            .eq("origen", "ortodoncia");

        if (errorCaja) {
            console.error("Error al eliminar movimiento de caja:", errorCaja);
        }

        // 3. Eliminar la firma de Storage si existe
        if (control?.firma_id) {
            const { data: firma } = await supabase
                .from("firmas")
                .select("storage_path")
                .eq("id", control.firma_id)
                .single();

            if (firma?.storage_path) {
                await supabase.storage
                    .from("firmas")
                    .remove([firma.storage_path]);
            }

            // Eliminar registro de firma
            await supabase
                .from("firmas")
                .delete()
                .eq("id", control.firma_id);
        }

        // 4. Eliminar el control de ortodoncia
        const { error } = await supabase
            .from("controles_ortodoncia")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error eliminando control de ortodoncia:", error);
        throw error;
    }
}
