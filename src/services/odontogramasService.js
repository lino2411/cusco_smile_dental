
import { supabase } from './supabaseClient';

// Función para obtener fecha local en ISO
const getLocalISOString = () => {
    const now = new Date();

    // Ajustar a la zona horaria de Perú (UTC-5)
    const offset = now.getTimezoneOffset() * 60000; // Convertir minutos a milisegundos
    const localTime = new Date(now.getTime() - offset);

    // Extraer componentes de la fecha
    const year = localTime.getFullYear();
    const month = String(localTime.getMonth() + 1).padStart(2, '0');
    const day = String(localTime.getDate()).padStart(2, '0');
    const hours = String(localTime.getHours()).padStart(2, '0');
    const minutes = String(localTime.getMinutes()).padStart(2, '0');
    const seconds = String(localTime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Obtener odontogramas de un paciente CON DATOS DEL PACIENTE Y PRESUPUESTOS
export async function obtenerOdontogramasPorPaciente(pacienteId) {
    // Traer odontogramas
    const { data: odontogramas, error: errorOdonto } = await supabase
        .from('odontogramas')
        .select(`
            *,
            paciente:pacientes(nombres, apellidos, dni),
            piezas_dentales(*)
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false });

    if (errorOdonto) {
        console.error('Error al obtener odontogramas:', errorOdonto);
        return [];
    }

    // ✅ AGREGAR: Traer presupuestos para cada odontograma
    const odontogramasConPresupuestos = await Promise.all(
        odontogramas.map(async (odonto) => {
            const { data: presupuestos } = await supabase
                .from('presupuestos')
                .select('*')
                .eq('odontograma_id', odonto.id);

            return {
                ...odonto,
                presupuestos: presupuestos || []
            };
        })
    );

    return odontogramasConPresupuestos;
}

// ✅ Obtener un odontograma por ID con presupuestos Y DATOS DEL PACIENTE
// ✅ Debe tener export
export async function obtenerOdontogramaPorId(id) {
    const { data: odontograma, error: errorOdonto } = await supabase
        .from('odontogramas')
        .select(`
            *,
            paciente:pacientes(nombres, apellidos, dni),
            piezas_dentales(*)
        `)
        .eq('id', id)
        .single();

    if (errorOdonto) {
        console.error('Error al obtener odontograma:', errorOdonto);
        return null;
    }

    // Obtener presupuestos asociados
    const { data: presupuestos } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('odontograma_id', id)
        .order('creado_en', { ascending: true });

    // ✅ Obtener endodoncias asociadas
    const { data: endodoncias } = await supabase
        .from('endodoncias')
        .select('*')
        .eq('odontograma_id', id)
        .order('fecha', { ascending: true });

    return {
        ...odontograma,
        presupuestos: presupuestos || [],
        endodoncias: endodoncias || [],
    };
}

// ✅ Crear un nuevo odontograma
export async function crearOdontograma(pacienteId, tipo, tipoDenticion, observaciones, especificaciones) {
    const { data, error } = await supabase
        .from('odontogramas')
        .insert([{
            paciente_id: pacienteId,
            tipo: tipo,
            tipo_denticion: tipoDenticion,
            // fecha: getLocalISOString(),
            observaciones: observaciones || null,
            especificaciones: especificaciones || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al crear odontograma:', error);
        throw error;
    }

    return data;
}

// ✅ Actualizar odontograma
export async function actualizarOdontograma(id, observaciones, especificaciones) {
    const { data, error } = await supabase
        .from('odontogramas')
        .update({
            observaciones: observaciones || null,
            especificaciones: especificaciones || null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar odontograma:', error);
        throw error;
    }

    return data;
}

// ✅ Guardar o actualizar pieza dental
// ✅ Guardar o actualizar pieza dental CON COORDENADAS
export async function guardarPiezaDental(
    odontogramaId,
    numeroPieza,
    estado,
    nota = '',
    superficie = 'corona',
    coordenadaX = null,
    coordenadaY = null,
    color = 'azul',
    esPlanTratamiento = false
) {
    try {
        // Primero eliminar si ya existe para evitar duplicados
        await supabase
            .from('piezas_dentales')
            .delete()
            .eq('odontograma_id', odontogramaId)
            .eq('numero_pieza', numeroPieza)
            .eq('superficie', superficie);

        // Insertar el nuevo registro
        const { data, error } = await supabase
            .from('piezas_dentales')
            .insert([
                {
                    odontograma_id: odontogramaId,
                    numero_pieza: numeroPieza,
                    superficie: superficie,
                    estado: estado,
                    nota: nota || null,
                    coordenada_x: coordenadaX,
                    coordenada_y: coordenadaY,
                    color: color,
                    es_plan_tratamiento: esPlanTratamiento
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error al guardar pieza dental:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error en guardarPiezaDental:', error);
        throw error;
    }
}

// ✅ Eliminar pieza dental (resetear)
export async function eliminarPiezaDental(odontogramaId, numeroPieza) {
    const { error } = await supabase
        .from('piezas_dentales')
        .delete()
        .eq('odontograma_id', odontogramaId)
        .eq('numero_pieza', numeroPieza);

    if (error) {
        console.error('Error al eliminar pieza dental:', error);
        return false;
    }
    return true;
}

// ✅ Guardar presupuesto
export async function guardarPresupuesto(odontogramaId, tratamiento, cantidad, costoUnitario) {
    const total = cantidad * costoUnitario;

    const { data, error } = await supabase
        .from('presupuestos')
        .insert([{
            odontograma_id: odontogramaId,
            tratamiento: tratamiento,
            cantidad: cantidad,
            costo_unitario: costoUnitario,
            total: total,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al guardar presupuesto:', error);
        throw error;
    }

    return data;
}

// ✅ Actualizar presupuesto
export async function actualizarPresupuesto(id, tratamiento, cantidad, costoUnitario) {
    const total = cantidad * costoUnitario;

    const { data, error } = await supabase
        .from('presupuestos')
        .update({
            tratamiento: tratamiento,
            cantidad: cantidad,
            costo_unitario: costoUnitario,
            total: total,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar presupuesto:', error);
        throw error;
    }

    return data;
}

// ✅ Eliminar presupuesto
export async function eliminarPresupuesto(id) {
    const { error } = await supabase
        .from('presupuestos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar presupuesto:', error);
        return false;
    }
    return true;
}

// ✅ Eliminar odontograma completo
export async function eliminarOdontograma(id) {
    const { error } = await supabase
        .from('odontogramas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar odontograma:', error);
        return false;
    }
    return true;
}

// Guardar nueva endodoncia
// Guardar nueva endodoncia
export async function guardarEndodoncia(odontogramaId, datos) {
    console.log('📤 Intentando guardar endodoncia:', { odontogramaId, datos });

    const { data, error } = await supabase
        .from('endodoncias')
        .insert([{
            odontograma_id: odontogramaId,
            od: datos.od || null,  // ✅ Cambiado de numero_pieza a od
            diagnostico: datos.diagnostico || null,
            longitud: datos.longitud || null,
            lima_memoria: datos.lima_memoria || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('❌ Error al guardar endodoncia:', error);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Detalles:', error.details);
        throw error;
    }

    console.log('✅ Endodoncia guardada:', data);
    return data;
}

// Actualizar endodoncia existente
export async function actualizarEndodonciaService(id, datosActualizados) {
    const { data, error } = await supabase
        .from('endodoncias')
        .update({
            od: datosActualizados.od || null,  // ✅ Cambiado de numero_pieza a od
            diagnostico: datosActualizados.diagnostico || null,
            longitud: datosActualizados.longitud || null,
            lima_memoria: datosActualizados.lima_memoria || null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar endodoncia:', error);
        throw error;
    }
    return data;
}

// Eliminar endodoncia
export async function eliminarEndodonciaService(id) {
    const { error } = await supabase
        .from('endodoncias')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar endodoncia:', error);
        throw error;
    }
    return true;
}

// Subir archivo radiografía
export async function subirArchivoRadiografia(odontogramaId, archivo) {
    const fileExt = archivo.name.split('.').pop();
    const fileName = `${odontogramaId}/${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Subir a Supabase Storage (asegúrate de tener un bucket 'radiografias')
    const { data, error } = await supabase.storage
        .from('radiografias')
        .upload(filePath, archivo);

    if (error) {
        console.error('Error al subir archivo:', error);
        throw error;
    }

    // Obtener URL pública del archivo subido
    const { publicURL, error: urlError } = supabase.storage
        .from('radiografias')
        .getPublicUrl(filePath);

    if (urlError) {
        console.error('Error al obtener URL pública:', urlError);
        throw urlError;
    }

    // Guardar registro en la tabla radiografias_odontograma
    const { data: registro, error: insertError } = await supabase
        .from('radiografias_odontograma')
        .insert([{
            odontograma_id: odontogramaId,
            url: publicURL,
            descripcion: archivo.name,
            tipo: 'periapical',
        }])
        .select()
        .single();

    if (insertError) {
        console.error('Error al guardar radiografía en BD:', insertError);
        throw insertError;
    }

    return registro;
}

// Obtener radiografías de un odontograma
export async function obtenerRadiografiasPorOdontograma(odontogramaId) {
    const { data, error } = await supabase
        .from('radiografias_odontograma')
        .select('*')
        .eq('odontograma_id', odontogramaId)
        .order('creado_en', { ascending: true });

    if (error) {
        console.error('Error al obtener radiografías:', error);
        throw error;
    }
    return data;
}

// Eliminar radiografía
export async function eliminarRadiografiaService(id) {
    const { error } = await supabase
        .from('radiografias_odontograma')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar radiografía:', error);
        throw error;
    }
    return true;
}
