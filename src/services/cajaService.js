import { supabase } from './supabaseClient';
import { obtenerFechaPeruHoy } from '../utils/fechas';

// ========================================================
// OBTENER INGRESOS AUTOMÁTICOS DESDE PAGOS + ORTODONCIA
// ========================================================
export async function obtenerIngresosAutomaticos({ fecha_inicio, fecha_fin }) {
  const columnasPagos = `
      id, fecha, created_at, paciente_id, usuario_registro,
      pacientes(nombres, apellidos, dni),
      usuarios:usuario_registro(nombre_completo),
      monto:a_cuenta, descripcion:tratamiento_realizado, metodo_pago, observaciones
  `;

  const columnasOrtodoncia = `
      id, fecha, created_at, paciente_id, usuario_registro,
      pacientes(nombres, apellidos, dni),
      usuarios:usuario_registro(nombre_completo),
      monto:cuota, tratamiento_realizado
  `;

  let queryPagos = supabase.from('pagos').select(columnasPagos);
  let queryOrtodoncia = supabase.from('controles_ortodoncia').select(columnasOrtodoncia);

  if (fecha_inicio && fecha_fin) {
    const inicioISO = `${fecha_inicio}T00:00:00-05:00`;
    const finISO = `${fecha_fin}T23:59:59-05:00`;

    queryPagos = queryPagos.gte('fecha', inicioISO).lte('fecha', finISO);
    queryOrtodoncia = queryOrtodoncia.gte('fecha', inicioISO).lte('fecha', finISO);
  }

  const [{ data: pagos, error: errorPagos }, { data: ortodoncia, error: errorOrtodoncia }] = await Promise.all([
    queryPagos,
    queryOrtodoncia
  ]);

  if (errorPagos) throw new Error(`Error en pagos: ${errorPagos.message}`);
  if (errorOrtodoncia) throw new Error(`Error en ortodoncia: ${errorOrtodoncia.message}`);

  const ingresosPagos = (pagos || []).map(p => ({
    ...p,
    tipo_movimiento: 'ingreso',
    monto: parseFloat(p.monto || 0),
    origen: 'pagos',
    id: `pago_${p.id}`, // Esto ya es String
    usuarios: p.usuarios || { nombre_completo: 'Sistema' },
    detalle_tratamiento: p.descripcion,
    fecha: p.created_at || p.fecha,
  }));

  const ingresosOrtodoncia = (ortodoncia || []).map(o => ({
    ...o,
    tipo_movimiento: 'ingreso',
    monto: parseFloat(o.monto || 0),
    origen: 'ortodoncia',
    id: `orto_${o.id}`, // Esto ya es String
    usuarios: o.usuarios || { nombre_completo: 'Sistema' },
    descripcion: o.tratamiento_realizado,
    detalle_tratamiento: o.tratamiento_realizado,
    metodo_pago: null,
    observaciones: o.tratamiento_realizado,
    fecha: o.created_at || o.fecha,
  }));

  return [...ingresosPagos, ...ingresosOrtodoncia];
}

// ========================================================
// FUNCIÓN REFACTORIZADA PARA OBTENER MOVIMIENTOS MANUALES
// (SOLUCIÓN AL ERROR DE RELACIÓN PACIENTES/USUARIOS)
// ========================================================
async function obtenerMovimientosManuales(tipoMovimiento, { fecha_inicio, fecha_fin }) {
  // 1. Consultamos SOLO la tabla caja_movimientos sin Joins para evitar el error 400
  let query = supabase
    .from('caja_movimientos')
    .select('*')
    .eq('tipo_movimiento', tipoMovimiento);

  if (fecha_inicio && fecha_fin) {
    query = query
      .gte('fecha', `${fecha_inicio}T00:00:00-05:00`)
      .lte('fecha', `${fecha_fin}T23:59:59-05:00`);
  }

  const { data: movimientos, error } = await query;

  if (error) throw new Error(error.message);
  if (!movimientos || movimientos.length === 0) return [];

  // 2. Obtenemos los IDs únicos para buscar la info manualmente
  const pacienteIds = [...new Set(movimientos.map(m => m.paciente_id).filter(Boolean))];
  const usuarioIds = [...new Set(movimientos.map(m => m.usuario_registro).filter(Boolean))];

  // 3. Buscamos la info relacionada en paralelo (Manual Join)
  const promises = [];
  let mapPacientes = {};
  let mapUsuarios = {};

  if (pacienteIds.length > 0) {
    promises.push(
      supabase.from('pacientes')
        .select('id, nombres, apellidos, dni')
        .in('id', pacienteIds)
        .then(({ data }) => {
          data?.forEach(p => mapPacientes[p.id] = p);
        })
    );
  }

  if (usuarioIds.length > 0) {
    promises.push(
      supabase.from('usuarios')
        .select('id, nombre_completo')
        .in('id', usuarioIds)
        .then(({ data }) => {
          data?.forEach(u => mapUsuarios[u.id] = u);
        })
    );
  }

  await Promise.all(promises);

  // 4. Unimos los datos manualmente
  return movimientos.map(mov => ({
    ...mov,
    // CORRECCIÓN AQUÍ: Forzamos que el ID sea string para que .slice() funcione en el frontend
    id: String(mov.id),
    monto: parseFloat(mov.monto || 0),
    usuarios: (mov.usuario_registro && mapUsuarios[mov.usuario_registro])
      ? mapUsuarios[mov.usuario_registro]
      : { nombre_completo: 'Sistema' },
    pacientes: (mov.paciente_id && mapPacientes[mov.paciente_id])
      ? mapPacientes[mov.paciente_id]
      : null
  }));
}

// ========================================================
// OBTENER EGRESOS Y AJUSTES
// ========================================================
export const obtenerEgresos = (filtros) => obtenerMovimientosManuales('egreso', filtros);
export const obtenerAjustes = (filtros) => obtenerMovimientosManuales('ajuste', filtros);

// ========================================================
// OBTENER MOVIMIENTOS COMPLETOS
// ========================================================
export async function obtenerMovimientosCaja({ fecha_inicio, fecha_fin, tipo_filtro, origen_filtro }) {
  const ingresos = await obtenerIngresosAutomaticos({ fecha_inicio, fecha_fin });
  const egresos = await obtenerEgresos({ fecha_inicio, fecha_fin });
  const ajustes = await obtenerAjustes({ fecha_inicio, fecha_fin });

  let todosLosMovimientos = [...ingresos, ...egresos, ...ajustes];

  if (tipo_filtro) {
    todosLosMovimientos = todosLosMovimientos.filter(m => m.tipo_movimiento === tipo_filtro);
  }

  if (origen_filtro) {
    todosLosMovimientos = todosLosMovimientos.filter(m => m.origen === origen_filtro);
  }

  return calcularSaldosPostMovimiento(todosLosMovimientos);
}

// ========================================================
// HELPER PARA CALCULAR SALDOS
// ========================================================
function calcularSaldosPostMovimiento(movimientos) {
  let saldoAcumulado = 0;
  return movimientos
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .map(mov => {
      if (mov.tipo_movimiento === 'ingreso' || mov.tipo_movimiento === 'ajuste') {
        saldoAcumulado += mov.monto;
      } else if (mov.tipo_movimiento === 'egreso' || mov.tipo_movimiento === 'cierre') {
        if (mov.tipo_movimiento === 'egreso') saldoAcumulado -= mov.monto;
      }
      return { ...mov, saldo_post_movimiento: saldoAcumulado };
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// ========================================================
// OBTENER RESUMEN TOTAL
// ========================================================
export async function obtenerResumenCaja(fecha = obtenerFechaPeruHoy()) {
  const ingresos = await obtenerIngresosAutomaticos({ fecha_inicio: fecha, fecha_fin: fecha });
  const egresos = await obtenerEgresos({ fecha_inicio: fecha, fecha_fin: fecha });
  const ajustes = await obtenerAjustes({ fecha_inicio: fecha, fecha_fin: fecha });

  const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0);
  const totalEgresos = egresos.reduce((sum, m) => sum + m.monto, 0);
  const totalAjustes = ajustes.reduce((sum, m) => sum + m.monto, 0);

  const { data: cierre } = await supabase
    .from('caja_movimientos')
    .select('id')
    .eq('tipo_movimiento', 'cierre')
    .gte('fecha', `${fecha}T00:00:00-05:00`)
    .lte('fecha', `${fecha}T23:59:59-05:00`);

  const cierreRealizado = cierre && cierre.length > 0;

  const movimientosConSaldo = calcularSaldosPostMovimiento([...ingresos, ...egresos, ...ajustes]);

  return {
    ingresos: totalIngresos,
    egresos: totalEgresos,
    ajustes: totalAjustes,
    saldo: totalIngresos - totalEgresos + totalAjustes,
    totalMovimientos: ingresos.length + egresos.length + ajustes.length,
    cierreRealizado,
    movimientos: movimientosConSaldo
  };
}

// ========================================================
// REGISTRO Y ELIMINACIÓN (SIN CAMBIOS)
// ========================================================

export async function registrarMovimientoCaja({
  paciente_id = null,
  descripcion,
  detalle_tratamiento = null,
  tipo_movimiento,
  monto,
  usuario_registro,
  origen,
  nota = ''
}) {
  if (!tipo_movimiento || !monto || !descripcion || !origen) {
    throw new Error("Faltan campos obligatorios para registrar el movimiento.");
  }

  const { data, error } = await supabase
    .from('caja_movimientos')
    .insert([{
      paciente_id,
      descripcion,
      detalle_tratamiento,
      tipo_movimiento,
      monto: parseFloat(monto),
      usuario_registro,
      origen,
      nota,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function registrarEgresoCaja({
  descripcion,
  monto,
  usuario_registro,
  nota = ''
}) {
  return registrarMovimientoCaja({
    descripcion,
    monto,
    usuario_registro,
    nota,
    tipo_movimiento: 'egreso',
    origen: 'caja_central'
  });
}

export async function eliminarMovimientoPorPago(pagoId) {
  try {
    const { error } = await supabase
      .from('caja_movimientos')
      .delete()
      .eq('referencia_id', pagoId)
      .eq('origen', 'pagos');

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar movimiento de pago:', error);
    throw error;
  }
}

export async function eliminarMovimientoPorOrtodoncia(controlId) {
  try {
    const { error } = await supabase
      .from('caja_movimientos')
      .delete()
      .eq('referencia_id', controlId)
      .eq('origen', 'ortodoncia');

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar movimiento de ortodoncia:', error);
    throw error;
  }
}

export async function cerrarCajaHoy({ usuario_registro, nota = '' }) {
  const fechaHoy = obtenerFechaPeruHoy();
  const resumen = await obtenerResumenCaja(fechaHoy);

  const { data: cierreExistente } = await supabase
    .from('caja_movimientos')
    .select('id')
    .eq('tipo_movimiento', 'cierre')
    .gte('fecha', `${fechaHoy}T00:00:00-05:00`)
    .lte('fecha', `${fechaHoy}T23:59:59-05:00`);

  if (cierreExistente && cierreExistente.length > 0) {
    throw new Error("La caja ya fue cerrada hoy");
  }

  const { data, error } = await supabase
    .from('caja_movimientos')
    .insert([{
      descripcion: "Cierre de Caja del Día",
      tipo_movimiento: "cierre",
      monto: resumen.saldo,
      usuario_registro,
      origen: "cierre_diario",
      nota: nota || `Ingresos: ${resumen.ingresos}, Egresos: ${resumen.egresos}, Ajustes: ${resumen.ajustes}`,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function exportarMovimientosCSV(movimientos) {
  if (!movimientos?.length) {
    throw new Error("No hay movimientos para exportar");
  }

  const headers = ['Fecha', 'Descripción', 'Tipo', 'Origen', 'Monto', 'Paciente', 'Usuario', 'Notas'];
  const rows = movimientos.map(m => [
    new Date(m.fecha).toLocaleString('es-PE'),
    m.descripcion,
    m.tipo_movimiento,
    m.origen,
    `S/ ${parseFloat(m.monto).toFixed(2)}`,
    m.pacientes ? `${m.pacientes.nombres} ${m.pacientes.apellidos}` : '-',
    m.usuarios?.nombre_completo || '-',
    m.nota || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
}