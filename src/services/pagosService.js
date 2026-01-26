import { supabase } from './supabaseClient';
import { obtenerFechaPeruHoy } from '../utils/fechas';

/**
 * Obtener todos los pagos con información del paciente (optimizado y corregido)
 */
export async function obtenerTodosPagos() {
    const { data: pagos, error } = await supabase
        .from('pagos')
        .select('id, paciente_id, fecha, tratamiento_realizado, costo, a_cuenta, saldo, metodo_pago, estado, observaciones, firma_id, usuario_registro, created_at')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error al obtener pagos:', error);
        throw error;
    }

    if (!pagos || pagos.length === 0) {
        return [];
    }

    // Obtener IDs únicos de pacientes
    const pacienteIdsUnicos = [...new Set(pagos.map(p => p.paciente_id).filter(Boolean))];

    if (pacienteIdsUnicos.length === 0) {
        return pagos.map(pago => ({ ...pago, pacientes: null }));
    }

    const { data: pacientesData, error: errorPacientes } = await supabase
        .from('pacientes')
        .select('id, dni, nombres, apellidos, celular')
        .in('id', pacienteIdsUnicos);

    if (errorPacientes) {
        console.error('Error al obtener pacientes:', errorPacientes);
        return pagos.map(pago => ({ ...pago, pacientes: null }));
    }

    // Crear mapa de pacientes
    const pacientesMap = new Map();
    (pacientesData || []).forEach(paciente => {
        pacientesMap.set(paciente.id, paciente);
    });

    // Mapear pacientes a pagos
    return pagos.map(pago => ({
        ...pago,
        pacientes: pacientesMap.get(pago.paciente_id) || null
    }));
}

/**
 * Obtener pagos de un paciente específico
 */
export async function obtenerPagosPorPaciente(pacienteId) {
    const { data, error } = await supabase
        .from('pagos')
        .select(`
            id,
            paciente_id,
            fecha,
            tratamiento_realizado,
            costo,
            a_cuenta,
            saldo,
            metodo_pago,
            estado,
            observaciones,
            firma_id,
            usuario_registro,
            created_at,
            pacientes (
                id,
                nombres,
                apellidos,
                dni,
                celular
            )
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Obtener un pago por ID
 */
export async function obtenerPagoPorId(pagoId) {
    const { data: pago, error: errorPago } = await supabase
        .from('pagos')
        .select()
        .eq('id', pagoId)
        .single();

    if (errorPago) {
        console.error('Error al obtener pago:', errorPago);
        throw errorPago;
    }

    const { data: paciente } = await supabase
        .from('pacientes')
        .select('id, dni, nombres, apellidos, celular')
        .eq('id', pago.paciente_id)
        .single();

    // Cargar historial
    const { data: historial } = await supabase
        .from('historial_pagos')
        .select()
        .eq('pago_id', pagoId)
        .order('fecha', { ascending: false });

    return {
        ...pago,
        pacientes: paciente,
        historial_pagos: historial || []
    };
}

/**
 * Crear un nuevo pago
 */
export async function crearPago(datosPago) {
    // ✅ VALIDAR y CALCULAR correctamente
    const costo = parseFloat(datosPago.costo) || 0;
    const aCuenta = parseFloat(datosPago.a_cuenta) || 0;
    const saldo = costo - aCuenta; // ✅ Calcular saldo

    const { data, error } = await supabase
        .from('pagos')
        .insert([{
            paciente_id: datosPago.paciente_id,
            fecha: datosPago.fecha,
            tratamiento_realizado: datosPago.tratamiento_realizado,
            costo: costo,
            a_cuenta: aCuenta,
            saldo: saldo, // ✅ Usar saldo calculado
            metodo_pago: datosPago.metodo_pago,
            estado: calcularEstado(costo, aCuenta),
            observaciones: datosPago.observaciones || null,
            firma_id: datosPago.firma_id || null,
            usuario_registro: datosPago.usuario_registro || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al crear pago:', error);
        throw error;
    }

    // Registrar historial si hay abono inicial
    if (aCuenta > 0) {
        await registrarHistorialPago({
            pago_id: data.id,
            monto: aCuenta,
            metodo_pago: datosPago.metodo_pago,
            observaciones: 'Pago inicial',
        });
    }

    return data;
}

/**
 * Actualizar un pago
 */
export async function actualizarPago(pagoId, datosActualizados) {
    // ✅ VALIDAR y CALCULAR correctamente
    const costo = parseFloat(datosActualizados.costo) || 0;
    const aCuenta = parseFloat(datosActualizados.a_cuenta) || 0;
    const saldo = costo - aCuenta; // ✅ Recalcular saldo

    const { data, error } = await supabase
        .from('pagos')
        .update({
            tratamiento_realizado: datosActualizados.tratamiento_realizado,
            costo: costo,
            a_cuenta: aCuenta,
            saldo: saldo, // ✅ Actualizar saldo
            metodo_pago: datosActualizados.metodo_pago,
            estado: calcularEstado(costo, aCuenta),
            observaciones: datosActualizados.observaciones,
            firma_id: datosActualizados.firma_id,
        })
        .eq('id', pagoId)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar pago:', error);
        throw error;
    }

    return data;
}

/**
 * Eliminar un pago
 */
export async function eliminarPago(pagoId) {
    // ✅ 0. PRIMERO: Obtener información del pago (para saber si tiene firma)
    const { data: pagoInfo } = await supabase
        .from('pagos')
        .select('firma_id')
        .eq('id', pagoId)
        .single();

    // ✅ 1. Eliminar firma asociada (si existe)
    if (pagoInfo?.firma_id) {
        try {
            // Obtener URL de la firma para eliminar el archivo
            const { data: firmaData } = await supabase
                .from('firmas')
                .select('firma_url')
                .eq('id', pagoInfo.firma_id)
                .single();

            if (firmaData?.firma_url) {
                // Extraer el path del storage desde la URL
                const urlParts = firmaData.firma_url.split('/firmas/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1].split('?')[0]; // Remover query params

                    // Eliminar archivo del storage
                    await supabase.storage
                        .from('firmas')
                        .remove([filePath]);
                }
            }

            // Eliminar registro de la tabla firmas
            const { error: errorFirma } = await supabase
                .from('firmas')
                .delete()
                .eq('id', pagoInfo.firma_id);

            if (errorFirma) {
                console.error('Error al eliminar firma:', errorFirma);
                // No lanzamos error, continuamos con la eliminación del pago
            }
        } catch (errorFirma) {
            console.error('Error procesando eliminación de firma:', errorFirma);
            // Continuar con la eliminación del pago aunque falle la firma
        }
    }

    // 2. Eliminar historial de pagos
    const { error: errorHistorial } = await supabase
        .from('historial_pagos')
        .delete()
        .eq('pago_id', pagoId);

    if (errorHistorial) {
        console.error('Error al eliminar historial de pago:', errorHistorial);
        throw errorHistorial;
    }

    // 3. Eliminar movimiento en caja_movimientos (si existe)
    const { error: errorCaja } = await supabase
        .from('caja_movimientos')
        .delete()
        .eq('referencia_id', pagoId)
        .eq('origen', 'pagos');

    if (errorCaja) {
        console.error('Error al eliminar movimiento de caja:', errorCaja);
    }

    // 4. Finalmente eliminar el pago
    const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', pagoId);

    if (error) {
        console.error('Error al eliminar pago:', error);
        throw error;
    }

    return true;
}

// ============================================
// HISTORIAL DE PAGOS
// ============================================

/**
 * Registrar un pago parcial
 */
export async function registrarHistorialPago(datosHistorial) {
    const fechaFinal = datosHistorial.fecha || obtenerFechaPeruHoy();
    const fechaConHora = `${fechaFinal}T12:00:00-05:00`;

    const { data, error } = await supabase
        .from('historial_pagos')
        .insert([{
            pago_id: datosHistorial.pago_id,
            fecha: fechaConHora,
            monto: parseFloat(datosHistorial.monto) || 0, // ✅ Validar número
            metodo_pago: datosHistorial.metodo_pago,
            observaciones: datosHistorial.observaciones || null,
            recibo_numero: datosHistorial.recibo_numero || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al registrar historial de pago:', error);
        throw error;
    }

    // Actualizar el monto total pagado
    await actualizarMontoPagado(datosHistorial.pago_id);

    return data;
}

/**
 * Actualizar el monto total pagado de un pago
 */
async function actualizarMontoPagado(pagoId) {
    // Obtener la suma total de pagos parciales
    const { data: historial, error: errorHistorial } = await supabase
        .from('historial_pagos')
        .select('monto')
        .eq('pago_id', pagoId);

    if (errorHistorial) {
        console.error('Error al obtener historial:', errorHistorial);
        throw errorHistorial;
    }

    const totalPagado = historial.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);

    // Obtener el costo total del pago
    const { data: pago, error: errorPago } = await supabase
        .from('pagos')
        .select('costo')
        .eq('id', pagoId)
        .single();

    if (errorPago) {
        console.error('Error al obtener pago:', errorPago);
        throw errorPago;
    }

    const costoTotal = parseFloat(pago.costo || 0);
    const nuevoSaldo = costoTotal - totalPagado; // ✅ CALCULAR saldo
    const nuevoEstado = calcularEstado(costoTotal, totalPagado);

    // ✅ ACTUALIZAR a_cuenta, saldo Y estado
    const { error: errorUpdate } = await supabase
        .from('pagos')
        .update({
            a_cuenta: totalPagado,
            saldo: nuevoSaldo, // ✅ AGREGAR actualización de saldo
            estado: nuevoEstado,
        })
        .eq('id', pagoId);

    if (errorUpdate) {
        console.error('Error al actualizar pago:', errorUpdate);
        throw errorUpdate;
    }
}

/**
 * Obtener historial de pagos de un pago específico
 */
export async function obtenerHistorialPagos(pagoId) {
    const { data, error } = await supabase
        .from('historial_pagos')
        .select('*')
        .eq('pago_id', pagoId)
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error al obtener historial de pagos:', error);
        throw error;
    }

    return data || [];
}

/**
 * Eliminar un registro de historial de pagos
 */
export async function eliminarHistorialPago(historialId, pagoId) {
    const { error } = await supabase
        .from('historial_pagos')
        .delete()
        .eq('id', historialId);

    if (error) {
        console.error('Error al eliminar historial de pago:', error);
        throw error;
    }

    // Actualizar el monto total pagado
    await actualizarMontoPagado(pagoId);

    return true;
}

// ============================================
// MÉTODOS DE PAGO
// ============================================

/**
 * Obtener todos los métodos de pago activos
 */
export async function obtenerMetodosPago() {
    const { data, error } = await supabase
        .from('metodos_pago')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

    if (error) {
        console.error('Error al obtener métodos de pago:', error);
        throw error;
    }

    return data || [];
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Calcular el estado del pago
 */
function calcularEstado(costo, aCuenta) {
    const costoNum = parseFloat(costo) || 0;
    const aCuentaNum = parseFloat(aCuenta) || 0;

    if (aCuentaNum === 0) {
        return 'pendiente';
    } else if (aCuentaNum >= costoNum) {
        return 'pagado';
    } else {
        return 'parcial';
    }
}

/**
 * Obtener estadísticas de pagos
 */
export async function obtenerEstadisticasPagos() {
    const { data, error } = await supabase
        .from('pagos')
        .select('costo, a_cuenta, estado');

    if (error) {
        console.error('Error al obtener estadísticas:', error);
        throw error;
    }

    const totalIngresos = data.reduce((sum, pago) => sum + parseFloat(pago.a_cuenta || 0), 0);
    const totalPendiente = data.reduce((sum, pago) => {
        const costo = parseFloat(pago.costo || 0);
        const aCuenta = parseFloat(pago.a_cuenta || 0);
        const debe = costo - aCuenta;
        return sum + (debe > 0 ? debe : 0); // ✅ Solo sumar si hay deuda
    }, 0);

    const pagosPorEstado = {
        pendiente: data.filter(p => p.estado === 'pendiente').length,
        parcial: data.filter(p => p.estado === 'parcial').length,
        pagado: data.filter(p => p.estado === 'pagado').length,
    };

    return {
        totalIngresos,
        totalPendiente,
        pagosPorEstado,
        totalPagos: data.length,
    };
}

/**
 * Verificar si un paciente tiene pago inicial de ortodoncia
 */
export async function pacienteTienePagoInicialOrtodoncia(pacienteId) {
    if (!pacienteId) {
        return false;
    }

    const tratamientosOrto = [
        'ortodoncia (cuota inicial)',
        'ortodoncia interceptiva (cuota inicial)',
        'ortodoncia',
    ];

    const { data, error } = await supabase
        .from('pagos')
        .select('tratamiento_realizado')
        .eq('paciente_id', pacienteId);

    if (error) {
        console.error("Error al verificar pago inicial de ortodoncia:", error);
        return false;
    }

    // ✅ Búsqueda case-insensitive más robusta
    return (data || []).some(pago => {
        if (!pago.tratamiento_realizado) return false;

        const tratamientoLower = pago.tratamiento_realizado.toLowerCase().trim();
        return tratamientosOrto.some(orto => tratamientoLower.includes(orto.toLowerCase()));
    });
}
