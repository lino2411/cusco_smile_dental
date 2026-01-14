import { supabase } from '../supabaseClient';

// ===== 1. COMPARACIÓN MENSUAL =====
export const obtenerComparacionMensual = async (filtros = {}) => {
    try {
        const { data: todasCitas, error: errorCitas } = await supabase
            .from('citas')
            .select('*');

        if (errorCitas) {
            console.error('Error citas:', errorCitas);
            return null;
        }

        // ✅ Cambio: costo (no monto), fecha (no fecha_pago)
        const { data: todosPagos, error: errorPagos } = await supabase
            .from('pagos')
            .select('costo, fecha');

        if (errorPagos) {
            console.error('Error pagos:', errorPagos);
            return null;
        }

        const hoy = new Date();
        const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

        const citasActual = todasCitas?.filter(cita => {
            const fechaCita = new Date(cita.fecha);
            return fechaCita >= inicioMesActual && fechaCita <= finMesActual;
        }) || [];

        const citasAnterior = todasCitas?.filter(cita => {
            const fechaCita = new Date(cita.fecha);
            return fechaCita >= inicioMesAnterior && fechaCita <= finMesAnterior;
        }) || [];

        const pagosActual = todosPagos?.filter(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= inicioMesActual && fechaPago <= finMesActual;
        }) || [];

        const pagosAnterior = todosPagos?.filter(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= inicioMesAnterior && fechaPago <= finMesAnterior;
        }) || [];

        const mesActualNombre = inicioMesActual.toLocaleDateString('es-PE', { month: 'long' });
        const mesAnteriorNombre = inicioMesAnterior.toLocaleDateString('es-PE', { month: 'long' });

        return {
            mesActual: {
                nombre: mesActualNombre.charAt(0).toUpperCase() + mesActualNombre.slice(1),
                citas: citasActual.length,
                ingresos: pagosActual.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0),  // ✅ costo
                pacientes: new Set(citasActual.map(c => c.paciente_id)).size
            },
            mesAnterior: {
                nombre: mesAnteriorNombre.charAt(0).toUpperCase() + mesAnteriorNombre.slice(1),
                citas: citasAnterior.length,
                ingresos: pagosAnterior.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0),  // ✅ costo
                pacientes: new Set(citasAnterior.map(c => c.paciente_id)).size
            }
        };
    } catch (error) {
        console.error('Error en obtenerComparacionMensual:', error);
        return null;
    }
};


// ===== 2. TOP 10 PACIENTES =====
export const obtenerTopPacientesVisitas = async (filtros = {}) => {
    try {
        const { data: citas, error: errorCitas } = await supabase
            .from('citas')
            .select('paciente_id, estado, fecha');

        if (errorCitas) {
            console.error('Error obteniendo citas:', errorCitas);
            return [];
        }

        // ✅ Cambio: atendida (no completada)
        let citasFiltradas = citas?.filter(c => c.estado === 'atendida') || [];

        if (filtros.fechaInicio) {
            const fechaInicio = new Date(filtros.fechaInicio);
            citasFiltradas = citasFiltradas.filter(c => new Date(c.fecha) >= fechaInicio);
        }
        if (filtros.fechaFin) {
            const fechaFin = new Date(filtros.fechaFin);
            citasFiltradas = citasFiltradas.filter(c => new Date(c.fecha) <= fechaFin);
        }

        if (citasFiltradas.length === 0) {
            return [];
        }

        const visitasPorPaciente = {};
        citasFiltradas.forEach(cita => {
            const pacienteId = cita.paciente_id;
            if (!visitasPorPaciente[pacienteId]) {
                visitasPorPaciente[pacienteId] = 0;
            }
            visitasPorPaciente[pacienteId]++;
        });

        const pacientesIds = Object.keys(visitasPorPaciente);
        if (pacientesIds.length === 0) {
            return [];
        }

        // ✅ Cambio: nombres, apellidos (no nombre, apellido)
        const { data: pacientes, error: errorPacientes } = await supabase
            .from('pacientes')
            .select('id, nombres, apellidos')
            .in('id', pacientesIds);

        if (errorPacientes) {
            console.error('Error obteniendo pacientes:', errorPacientes);
            return [];
        }

        const ranking = pacientes.map(paciente => ({
            id: paciente.id,
            nombre: `${paciente.nombres} ${paciente.apellidos}`,
            visitas: visitasPorPaciente[paciente.id]
        }));

        return ranking.sort((a, b) => b.visitas - a.visitas).slice(0, 10);
    } catch (error) {
        console.error('Error en obtenerTopPacientesVisitas:', error);
        return [];
    }
};


// ===== 3. PROYECCIÓN DE INGRESOS =====
export const obtenerProyeccionIngresos = async () => {
    try {
        // ✅ Cambio: costo (no monto), fecha (no fecha_pago)
        const { data: todosPagos, error } = await supabase
            .from('pagos')
            .select('costo, fecha');

        if (error) {
            console.error('Error en supabase pagos:', error);
            return { historico: [], proyecciones: [], promedioMensual: 0 };
        }

        if (!todosPagos || todosPagos.length === 0) {
            return { historico: [], proyecciones: [], promedioMensual: 0 };
        }

        const hoy = new Date();
        const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);

        const pagosRecientes = todosPagos.filter(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= hace3Meses;
        });

        if (pagosRecientes.length === 0) {
            return { historico: [], proyecciones: [], promedioMensual: 0 };
        }

        const pagosOrdenados = pagosRecientes.sort((a, b) =>
            new Date(a.fecha) - new Date(b.fecha)
        );

        const ingresosPorMes = {};
        pagosOrdenados.forEach(pago => {
            const fecha = new Date(pago.fecha);
            const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const mesNombre = fecha.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });

            if (!ingresosPorMes[mesKey]) {
                ingresosPorMes[mesKey] = {
                    mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
                    ingresos: 0
                };
            }
            // ✅ Cambio: costo (no monto)
            ingresosPorMes[mesKey].ingresos += parseFloat(pago.costo || 0);
        });

        const historico = Object.values(ingresosPorMes);
        if (historico.length === 0) {
            return { historico: [], proyecciones: [], promedioMensual: 0 };
        }

        const promedioMensual = historico.reduce((sum, m) => sum + m.ingresos, 0) / historico.length;
        const proyecciones = [];

        for (let i = 1; i <= 2; i++) {
            const fechaProyeccion = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
            const mesNombre = fechaProyeccion.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
            proyecciones.push({
                mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
                ingresos: Math.round(promedioMensual),
                esProyeccion: true
            });
        }

        return {
            historico,
            proyecciones,
            promedioMensual: Math.round(promedioMensual)
        };
    } catch (error) {
        console.error('Error en obtenerProyeccionIngresos:', error);
        return { historico: [], proyecciones: [], promedioMensual: 0 };
    }
};


// ===== 4. CITAS POR DÍA DE LA SEMANA =====
export const obtenerCitasPorDiaSemana = async (filtros = {}) => {
    try {
        const { data: todasCitas, error } = await supabase
            .from('citas')
            .select('fecha, estado');

        if (error) {
            console.error('Error obteniendo citas por día:', error);
            return [];
        }

        let citasFiltradas = todasCitas || [];

        if (filtros.fechaInicio) {
            const fechaInicio = new Date(filtros.fechaInicio);
            citasFiltradas = citasFiltradas.filter(c => new Date(c.fecha) >= fechaInicio);
        }
        if (filtros.fechaFin) {
            const fechaFin = new Date(filtros.fechaFin);
            citasFiltradas = citasFiltradas.filter(c => new Date(c.fecha) <= fechaFin);
        }

        const diasSemana = [
            { dia: 'Lunes', citas: 0, completadas: 0 },
            { dia: 'Martes', citas: 0, completadas: 0 },
            { dia: 'Miércoles', citas: 0, completadas: 0 },
            { dia: 'Jueves', citas: 0, completadas: 0 },
            { dia: 'Viernes', citas: 0, completadas: 0 },
            { dia: 'Sábado', citas: 0, completadas: 0 },
            { dia: 'Domingo', citas: 0, completadas: 0 }
        ];

        citasFiltradas.forEach(cita => {
            const fecha = new Date(cita.fecha);
            const diaSemana = fecha.getDay();
            const indice = diaSemana === 0 ? 6 : diaSemana - 1;

            diasSemana[indice].citas++;
            // ✅ Cambio: atendida (no completada)
            if (cita.estado === 'atendida') {
                diasSemana[indice].completadas++;
            }
        });

        return diasSemana;
    } catch (error) {
        console.error('Error en obtenerCitasPorDiaSemana:', error);
        return [];
    }
};
