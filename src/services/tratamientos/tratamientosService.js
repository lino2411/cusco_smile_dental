import { supabase } from '../supabaseClient';

/**
 * Obtener todos los tratamientos activos
 */
export async function obtenerTratamientos() {
    const { data, error } = await supabase
        .from('lista_tratamientos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error al obtener tratamientos:', error);
        throw error;
    }

    return data || [];
}

/**
 * Obtener tratamientos por categoría
 */
export async function obtenerTratamientosPorCategoria(categoria) {
    const { data, error } = await supabase
        .from('lista_tratamientos')
        .select('*')
        .eq('activo', true)
        .eq('categoria', categoria)
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error al obtener tratamientos por categoría:', error);
        throw error;
    }

    return data || [];
}

/**
 * Crear un nuevo tratamiento
 */
export async function crearTratamiento(datosTratamiento) {
    const { data, error } = await supabase
        .from('lista_tratamientos')
        .insert([{
            nombre: datosTratamiento.nombre,
            categoria: datosTratamiento.categoria || null,
            costo_sugerido: parseFloat(datosTratamiento.costo_sugerido) || 0,
            activo: true,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al crear tratamiento:', error);
        throw error;
    }

    return data;
}

/**
 * Actualizar un tratamiento
 */
export async function actualizarTratamiento(id, datosActualizados) {
    const { data, error } = await supabase
        .from('lista_tratamientos')
        .update({
            nombre: datosActualizados.nombre,
            categoria: datosActualizados.categoria,
            costo_sugerido: parseFloat(datosActualizados.costo_sugerido) || 0,
            activo: datosActualizados.activo,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar tratamiento:', error);
        throw error;
    }

    return data;
}

/**
 * Desactivar un tratamiento (no lo elimina, solo lo oculta)
 */
export async function desactivarTratamiento(id) {
    const { error } = await supabase
        .from('lista_tratamientos')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error al desactivar tratamiento:', error);
        throw error;
    }

    return true;
}

/**
 * Eliminar un tratamiento permanentemente
 */
export async function eliminarTratamiento(id) {
    const { error } = await supabase
        .from('lista_tratamientos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar tratamiento:', error);
        throw error;
    }

    return true;
}

/**
 * Obtener todas las categorías únicas
 */
export async function obtenerCategorias() {
    const { data, error } = await supabase
        .from('lista_tratamientos')
        .select('categoria')
        .not('categoria', 'is', null);

    if (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
    }

    // Obtener valores únicos
    const categoriasUnicas = [...new Set(data.map(item => item.categoria))];
    return categoriasUnicas.sort();
}
