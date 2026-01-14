import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CirclePlus, RefreshCw, XCircle, Clock3, CheckCircle2, RotateCcw, X, Download, List, Calendar, Mail, User, Stethoscope, Zap, CalendarClock } from "lucide-react";
import Swal from "sweetalert2";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from '@fullcalendar/core/locales/es';

// --- COMPONENTES ---
import CitaFormModal from "./CitaFormModal.jsx";
import CitaDetalleModal from "./CitaDetalleModal";
import NotificacionCitaModal from "./NotificacionCitaModal";
import CitasResumenCard from "./CitasResumenCard";
import RecordatoriosPendientes from './RecordatoriosPendientes';
import CitasTable from "./CitasTable";
import PagoModal from "../pagos/PagoModal";

// --- SERVICIOS ---
import {
    obtenerCitas,
    actualizarEstadoCita,
    reprogramarCita,
    obtenerEstadisticasCitas
} from "../../services/citas/citasService";
import { obtenerUsuariosPorRol } from "../../services/usuarios/usuariosService";
import { formatearHora } from "../../utils/fechas";
import { supabase } from '../../services/supabaseClient';
import { generarPDFCitas } from '../../utils/citas/citasPDFGenerator';
import { generarExcelCitas } from '../../utils/citas/citasExcelGenerator';

// Horarios de la clínica
const HORARIO_CLINICA = {
    inicio: '09:00',
    fin: '21:00',
    bloqueos: [
        // { inicio: '13:00', fin: '15:00', motivo: 'Almuerzo' }, // ✅ COMENTADO: Ya no bloquea almuerzo
    ]
};

export default function CitasCalendar() {
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fechaFiltro, setFechaFiltro] = useState({ inicio: '', fin: '' });
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroDentista, setFiltroDentista] = useState('');

    // Modales de Citas
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [mostrarNotificacion, setMostrarNotificacion] = useState(false);

    // Estados para la integración de pago
    const [mostrarPagoModal, setMostrarPagoModal] = useState(false);
    const [datosPagoPrellenado, setDatosPagoPrellenado] = useState(null);

    const [citaSeleccionada, setCitaSeleccionada] = useState(null);
    const [vista, setVista] = useState('calendario');
    const [dentistas, setDentistas] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [usuarioId, setUsuarioId] = useState(null);

    // Funciones auxiliares para filtros rápidos
    const obtenerFechaHoy = () => {
        return new Date().toISOString().split('T')[0];
    };

    const obtenerInicioSemana = () => {
        const hoy = new Date();
        const dia = hoy.getDay();
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
        const lunes = new Date(hoy.setDate(diff));
        return lunes.toISOString().split('T')[0];
    };

    const obtenerFinSemana = () => {
        const hoy = new Date();
        const dia = hoy.getDay();
        const diff = hoy.getDate() + (dia === 0 ? 0 : 7 - dia);
        const domingo = new Date(hoy.setDate(diff));
        return domingo.toISOString().split('T')[0];
    };

    const obtenerInicioMes = () => {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    };

    const obtenerFinMes = () => {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    };

    // Cargar usuario actual y dentistas
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // Cargar citas cuando cambian filtros
    useEffect(() => {
        cargarCitas();
    }, [fechaFiltro.inicio, fechaFiltro.fin, filtroEstado, filtroDentista]);

    const cargarDatosIniciales = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('id, rol')
                    .eq('auth_user_id', session.user.id)
                    .single();

                if (usuario) setUsuarioId(usuario.id);
            }

            const dataDentistas = await obtenerUsuariosPorRol('odontologo');
            setDentistas(dataDentistas || []);
        } catch (error) {
            console.error("Error inicial:", error);
        }
    };

    const cargarCitas = useCallback(async () => {
        setLoading(true);
        try {
            const [dataCitas, stats] = await Promise.all([
                obtenerCitas({
                    fecha_inicio: fechaFiltro.inicio,
                    fecha_fin: fechaFiltro.fin,
                    estado: filtroEstado,
                    dentista_id: filtroDentista
                }),
                obtenerEstadisticasCitas(fechaFiltro.inicio, fechaFiltro.fin)
            ]);

            setCitas(dataCitas || []);
            setEstadisticas(stats || {});
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudieron cargar las citas',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        } finally {
            setLoading(false);
        }
    }, [fechaFiltro, filtroEstado, filtroDentista]);

    // Eventos para FullCalendar
    const eventos = useMemo(() => citas.map(cita => {
        const fechaBase = cita.fecha ? String(cita.fecha).split('T')[0] : '';
        if (!fechaBase) return null;

        const horaStart = cita.hora_inicio.length === 5 ? `${cita.hora_inicio}:00` : cita.hora_inicio;
        const horaEnd = cita.hora_fin ? (cita.hora_fin.length === 5 ? `${cita.hora_fin}:00` : cita.hora_fin) : undefined;

        return {
            id: String(cita.id),
            title: `${cita.nombre_paciente || 'Paciente'} - ${cita.motivo}`,
            start: `${fechaBase}T${horaStart}`,
            end: horaEnd ? `${fechaBase}T${horaEnd}` : undefined,
            backgroundColor: getColorEstado(cita.estado),
            borderColor: "transparent",
            textColor: "#fff",
            extendedProps: cita,
            allDay: false,
            classNames: ['group']
        };
    }).filter(Boolean), [citas]);

    // Acciones de estado
    const confirmarCita = async (citaId) => {
        const result = await Swal.fire({
            title: '¿Confirmar cita?',
            text: `Se marcará como confirmada`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            background: '#111827',
            color: '#F9FAFB'
        });

        if (result.isConfirmed) {
            try {
                await actualizarEstadoCita(citaId, 'confirmada');
                await cargarCitas();
                Swal.fire({ title: '¡Confirmada!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#111827', color: '#F9FAFB' });
            } catch (error) {
                Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#111827', color: '#F9FAFB' });
            }
        }
    };

    const iniciarConsulta = async (citaId) => {
        const result = await Swal.fire({
            title: '¿Iniciar consulta?',
            text: "El paciente pasará a estado 'En Consulta'",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#a855f7',
            background: '#111827',
            color: '#F9FAFB'
        });

        if (result.isConfirmed) {
            try {
                await actualizarEstadoCita(citaId, 'en_consulta');
                await cargarCitas();
                Swal.fire({ title: '¡En Consulta!', text: 'El paciente ha ingresado.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#111827', color: '#F9FAFB' });
            } catch (error) {
                Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#111827', color: '#F9FAFB' });
            }
        }
    };

    const finalizarAtencion = async (citaId) => {
        const result = await Swal.fire({
            title: '¿Finalizar atención?',
            text: "Se marcará la cita como 'Atendida' y completada.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Sí, finalizar',
            background: '#111827',
            color: '#F9FAFB'
        });

        if (result.isConfirmed) {
            try {
                await actualizarEstadoCita(citaId, 'atendida');
                await cargarCitas();

                const citaFinalizada = citas.find(c => c.id === citaId);

                if (citaFinalizada) {
                    const cobrarResult = await Swal.fire({
                        title: '<h2 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px;">¡Atención Finalizada! 🎉</h2>',
                        html: `
                            <div style="text-align: center; color: #D1D5DB; font-size: 15px; margin-bottom: 20px;">
                                <p style="margin-bottom: 15px;">Se ha registrado correctamente la atención de la cita.</p>
                                
                                <div style="background: rgba(31, 41, 55, 0.5); border: 1px solid #374151; border-left: 4px solid #10B981; border-radius: 8px; padding: 15px; text-align: left;">
                                    <p style="color: white; font-weight: 600; font-size: 16px; margin: 0 0 5px 0;">${citaFinalizada.nombre_paciente}</p>
                                    <p style="color: #9CA3AF; margin: 0; font-size: 14px;">${citaFinalizada.motivo}</p>
                                </div>

                                <p style="margin-top: 20px; font-weight: 500; color: white;">¿Desea registrar el pago ahora?</p>
                            </div>
                        `,
                        icon: 'success',
                        iconColor: '#10B981',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, ir a pago',
                        cancelButtonText: 'Cerrar',
                        confirmButtonColor: '#10B981',
                        cancelButtonColor: '#4B5563',
                        background: '#111827',
                        color: '#F9FAFB',
                        width: '480px',
                        padding: '2em',
                        reverseButtons: true
                    });

                    if (cobrarResult.isConfirmed) {
                        setDatosPagoPrellenado({
                            paciente_id: citaFinalizada.paciente_id,
                            tratamiento_realizado: citaFinalizada.motivo,
                            fecha: new Date().toISOString().split('T')[0],
                            costo: '',
                            a_cuenta: '',
                            observaciones: `Pago derivado de cita atendida: ${citaFinalizada.motivo}`
                        });
                        setMostrarPagoModal(true);
                    } else {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            background: '#1F2937',
                            color: '#fff'
                        });

                        Toast.fire({
                            icon: 'success',
                            title: 'Cita marcada como atendida'
                        });
                    }
                }
            } catch (error) {
                Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#111827', color: '#F9FAFB' });
            }
        }
    };

    const handleCancelarCita = async (citaId) => {
        const { value: motivo } = await Swal.fire({
            title: 'Cancelar cita',
            input: 'textarea',
            inputLabel: 'Motivo de cancelación',
            inputPlaceholder: 'Escribe el motivo...',
            showCancelButton: true,
            background: '#111827',
            color: '#F9FAFB',
            inputValidator: (value) => { if (!value) return '¡Necesitas escribir un motivo!'; }
        });

        if (motivo) {
            try {
                await actualizarEstadoCita(citaId, 'cancelada', motivo);
                await cargarCitas();
                Swal.fire({ title: 'Cancelada', icon: 'success', timer: 1500, showConfirmButton: false, background: '#111827', color: '#F9FAFB' });
            } catch (error) {
                Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#111827', color: '#F9FAFB' });
            }
        }
    };

    const irAHistoriaClinica = (cita) => {
        const idPaciente = cita.paciente_id || cita.paciente?.id || cita.pacientes?.id;

        if (!idPaciente) {
            Swal.fire({ title: 'Error', text: 'No se encontró ID de paciente', icon: 'error', background: '#111827', color: '#F9FAFB' });
            return;
        }

        navigate(`/dashboard/pacientes?pacienteId=${idPaciente}&tab=historias`);
    };

    const manejarReprogramar = (cita) => {
        setCitaSeleccionada(cita);
        setMostrarDetalle(false);
        setMostrarModal(true);
    };

    const enviarRecordatorio = (cita) => {
        setCitaSeleccionada(cita);
        setMostrarNotificacion(true);
    };

    const manejarSeleccionarFecha = ({ start, end }) => {
        const fecha = start.toISOString().split("T")[0];
        const horaInicio = start.toTimeString().slice(0, 5);
        const horaFin = end ? end.toTimeString().slice(0, 5) : "";

        const bloqueoEncontrado = HORARIO_CLINICA.bloqueos.find(b =>
            (horaInicio < b.fin) && (horaFin > b.inicio)
        );

        if (bloqueoEncontrado) {
            Swal.fire({
                title: 'Horario no disponible',
                text: `Este horario interfiere con: ${bloqueoEncontrado.motivo} (${bloqueoEncontrado.inicio} - ${bloqueoEncontrado.fin})`,
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }

        setCitaSeleccionada({
            fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin
        });
        setMostrarModal(true);
    };

    const manejarClickEvento = ({ event }) => {
        setCitaSeleccionada(event.extendedProps);
        setMostrarDetalle(true);
    };

    const cerrarModal = () => {
        setCitaSeleccionada(null);
        setMostrarModal(false);
    };

    const limpiarFiltros = () => {
        setFechaFiltro({ inicio: '', fin: '' });
        setFiltroEstado('');
        setFiltroDentista('');
    };

    const exportarPDF = () => {
        if (!citas.length) {
            Swal.fire({ title: 'Sin datos', text: 'No hay citas para exportar', icon: 'info' });
            return;
        }
        generarPDFCitas(citas, "Agenda de Citas", {
            inicio: fechaFiltro.inicio || "Todas",
            fin: fechaFiltro.fin || "las fechas",
            dentista: dentistas.find(d => d.id === filtroDentista)?.nombre_completo || "Todos"
        });
    };

    const exportarExcel = async () => {
        if (!citas.length) {
            Swal.fire({ title: 'Sin datos', text: 'No hay citas para exportar', icon: 'info' });
            return;
        }
        await generarExcelCitas(citas, {
            inicio: fechaFiltro.inicio,
            fin: fechaFiltro.fin,
            dentista: dentistas.find(d => d.id === filtroDentista)?.nombre_completo
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                                <CalendarDays className="w-8 h-8" />
                                Gestión de Citas
                            </h1>
                            <p className="text-smile_100 text-sm">Agenda dental completa con validaciones</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setVista(vista === 'calendario' ? 'tabla' : 'calendario')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border-2 border-white rounded-lg transition-colors font-medium"
                            >
                                {vista === 'calendario' ? <List className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                {vista === 'calendario' ? 'Vista Tabla' : 'Vista Calendario'}
                            </button>
                            <button
                                onClick={() => {
                                    setCitaSeleccionada(null);
                                    setMostrarModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-smile_600 rounded-lg transition-colors font-medium shadow-lg"
                            >
                                <CirclePlus className="w-5 h-5" />
                                Agendar Cita
                            </button>
                        </div>
                    </div>
                </div>

                <CitasResumenCard estadisticas={estadisticas} />

                {/* ✅ Recordatorios pendientes */}
                <RecordatoriosPendientes />

                {/* Panel de filtros */}
                <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
                    {/* Filtros rápidos */}
                    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider w-full mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-smile_600" /> Filtros Rápidos
                        </p>
                        <button
                            onClick={() => setFechaFiltro({ inicio: obtenerFechaHoy(), fin: obtenerFechaHoy() })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors font-medium text-sm"
                        >
                            <CalendarClock className="w-4 h-4" /> Hoy
                        </button>
                        <button
                            onClick={() => setFechaFiltro({ inicio: obtenerInicioSemana(), fin: obtenerFinSemana() })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors font-medium text-sm"
                        >
                            <CalendarDays className="w-4 h-4" /> Esta Semana
                        </button>
                        <button
                            onClick={() => setFechaFiltro({ inicio: obtenerInicioMes(), fin: obtenerFinMes() })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors font-medium text-sm"
                        >
                            <Calendar className="w-4 h-4" /> Este Mes
                        </button>
                    </div>

                    <div className="flex flex-wrap items-end gap-4 justify-between">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Desde:</label>
                                <input
                                    type="date"
                                    value={fechaFiltro.inicio}
                                    onChange={e => setFechaFiltro(f => ({ ...f, inicio: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Hasta:</label>
                                <input
                                    type="date"
                                    value={fechaFiltro.fin}
                                    onChange={e => setFechaFiltro(f => ({ ...f, fin: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Estado:</label>
                                <select
                                    value={filtroEstado}
                                    onChange={e => setFiltroEstado(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none text-sm min-w-[140px]"
                                >
                                    <option value="">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmada">Confirmada</option>
                                    <option value="en_consulta">En Consulta</option>
                                    <option value="atendida">Atendida</option>
                                    <option value="cancelada">Cancelada</option>
                                    <option value="reprogramada">Reprogramada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Dentista:</label>
                                <select
                                    value={filtroDentista}
                                    onChange={e => setFiltroDentista(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none text-sm min-w-[180px]"
                                >
                                    <option value="">Todos los dentistas</option>
                                    {dentistas.map(dentista => (
                                        <option key={dentista.id} value={dentista.id}>
                                            {dentista.nombre_completo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={limpiarFiltros}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                            >
                                <XCircle className="w-5 h-5" /> Limpiar
                            </button>
                            <button
                                onClick={exportarPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                                <Download className="w-5 h-5" /> PDF
                            </button>
                            <button
                                onClick={exportarExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                            >
                                <Download className="w-5 h-5" /> Excel
                            </button>
                            <button
                                onClick={cargarCitas}
                                className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors font-medium"
                            >
                                <RefreshCw className="w-5 h-5" /> Recargar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vista Tabla */}
                {vista === 'tabla' && (
                    <CitasTable
                        citas={citas}
                        loading={loading}
                        onEditar={(cita) => {
                            setCitaSeleccionada(cita);
                            setMostrarModal(true);
                        }}
                        onVerDetalles={(cita) => {
                            setCitaSeleccionada(cita);
                            setMostrarDetalle(true);
                        }}
                        onConfirmar={confirmarCita}
                        onPasarAConsulta={iniciarConsulta}
                        onFinalizarAtencion={finalizarAtencion}
                        onCancelar={handleCancelarCita}
                        onReprogramar={manejarReprogramar}
                        onEnviarRecordatorio={enviarRecordatorio}
                    />
                )}

                {/* Vista Calendario */}
                {vista === 'calendario' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        {loading ? (
                            <div className="text-lg text-gray-500 flex flex-col justify-center items-center h-60 gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-smile_600"></div>
                                <p>Cargando citas...</p>
                            </div>
                        ) : (
                            <div style={{ minHeight: '600px' }}>
                                <FullCalendar
                                    key={`calendar-${citas.length}-${JSON.stringify(fechaFiltro)}`}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="timeGridWeek"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                    }}
                                    buttonText={{
                                        today: 'Hoy',
                                        month: 'Mes',
                                        week: 'Semana',
                                        day: 'Día'
                                    }}
                                    locale={esLocale}
                                    height="auto"
                                    editable={true}
                                    selectable={true}
                                    selectMirror={true}
                                    dayMaxEvents={true}
                                    events={eventos}
                                    eventClick={manejarClickEvento}
                                    select={manejarSeleccionarFecha}
                                    eventDisplay="block"
                                    eventContent={(eventInfo) => renderEventContent(
                                        eventInfo,
                                        confirmarCita,
                                        handleCancelarCita,
                                        enviarRecordatorio
                                    )}
                                    slotMinTime="09:00:00"
                                    slotMaxTime="21:00:00"
                                    allDaySlot={false}
                                    slotDuration="00:15:00"
                                    businessHours={[
                                        {
                                            daysOfWeek: [1, 2, 3, 4, 5, 6],
                                            startTime: '09:00',
                                            endTime: '13:00'
                                        },
                                        {
                                            daysOfWeek: [1, 2, 3, 4, 5, 6],
                                            startTime: '15:00',
                                            endTime: '21:00'
                                        }
                                    ]}
                                    eventDrop={async (info) => {
                                        const fechaAntigua = new Date(info.oldEvent.start).toLocaleDateString('es-PE');
                                        const horaAntigua = info.oldEvent.start.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                                        const fechaNueva = new Date(info.event.start).toLocaleDateString('es-PE');
                                        const horaNueva = info.event.start.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

                                        const confirmar = await Swal.fire({
                                            title: '¿Mover esta cita?',
                                            html: `
                                                <div style="text-align: left; padding: 10px;">
                                                    <p style="margin-bottom: 10px;"><strong>De:</strong></p>
                                                    <p style="margin-left: 10px; color: #EF4444;">📅 ${fechaAntigua} a las ${horaAntigua}</p>
                                                    <p style="margin-top: 15px; margin-bottom: 10px;"><strong>Hacia:</strong></p>
                                                    <p style="margin-left: 10px; color: #22C55E;">📅 ${fechaNueva} a las ${horaNueva}</p>
                                                </div>
                                            `,
                                            icon: 'question',
                                            showCancelButton: true,
                                            confirmButtonText: 'Sí, mover',
                                            cancelButtonText: 'Cancelar',
                                            confirmButtonColor: '#22c55e',
                                            cancelButtonColor: '#6b7280',
                                            background: '#111827',
                                            color: '#F9FAFB'
                                        });

                                        if (!confirmar.isConfirmed) {
                                            info.revert();
                                            return;
                                        }

                                        const nuevaFecha = info.event.startStr.split('T')[0];
                                        const nuevaHora = info.event.startStr.split('T')[1].slice(0, 5);
                                        try {
                                            await reprogramarCita(info.event.id, nuevaFecha, nuevaHora);
                                            await cargarCitas();
                                            Swal.fire({
                                                title: '¡Movida!',
                                                text: 'La cita ha sido reprogramada correctamente',
                                                icon: 'success',
                                                timer: 2000,
                                                showConfirmButton: false,
                                                background: '#111827',
                                                color: '#F9FAFB'
                                            });
                                        } catch (error) {
                                            Swal.fire({
                                                title: 'Error',
                                                text: error.message,
                                                icon: 'error',
                                                background: '#111827',
                                                color: '#F9FAFB'
                                            });
                                            info.revert();
                                        }
                                    }}
                                />
                                {citas.length === 0 && (
                                    <div className="text-center mt-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 text-sm">
                                            No tienes citas agendadas. Haz clic en cualquier espacio en blanco para crear una.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Leyenda de estados */}
                {citas.length > 0 && (
                    <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
                        <p className="text-xs font-bold text-gray-600 mb-3 text-center">Estados de Citas:</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {Object.entries({
                                'pendiente': '#22d3ee',
                                'confirmada': '#22c55e',
                                'en_consulta': '#a855f7',
                                'atendida': '#6366f1',
                                'cancelada': '#ef4444',
                                'reprogramada': '#eab308'
                            }).map(([estado, color]) => (
                                <div key={estado} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                                    <span className="text-sm text-gray-600 font-medium capitalize">{estado.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modales */}
                <CitaFormModal
                    open={mostrarModal}
                    cita={citaSeleccionada}
                    onClose={cerrarModal}
                    onGuardado={() => {
                        cargarCitas();
                        cerrarModal();
                    }}
                    dentistas={dentistas}
                    horarioClinica={HORARIO_CLINICA}
                    usuarioId={usuarioId}
                />

                <CitaDetalleModal
                    open={mostrarDetalle}
                    cita={citaSeleccionada}
                    onClose={() => setMostrarDetalle(false)}
                    onEditar={() => {
                        setMostrarDetalle(false);
                        setMostrarModal(true);
                    }}
                    onConfirmar={confirmarCita}
                    onCancelar={handleCancelarCita}
                    onReprogramar={manejarReprogramar}
                    onEnviarRecordatorio={enviarRecordatorio}
                    onVerHistoria={irAHistoriaClinica}
                />

                <NotificacionCitaModal
                    open={mostrarNotificacion}
                    cita={citaSeleccionada}
                    onClose={() => setMostrarNotificacion(false)}
                />

                {mostrarPagoModal && (
                    <PagoModal
                        pago={datosPagoPrellenado}
                        onClose={() => {
                            setMostrarPagoModal(false);
                            setDatosPagoPrellenado(null);
                        }}
                        onPagoGuardado={() => {
                            setMostrarPagoModal(false);
                        }}
                        usuario={{ id: usuarioId }}
                    />
                )}
            </div>
        </div>
    );
}

// =======================================================
// FUNCIONES AUXILIARES
// =======================================================

function getColorEstado(estado) {
    const colores = {
        'pendiente': '#22d3ee',
        'confirmada': '#22c55e',
        'en_consulta': '#a855f7',
        'atendida': '#6366f1',
        'cancelada': '#ef4444',
        'reprogramada': '#eab308'
    };
    return colores[estado] || '#6b7280';
}

function renderEventContent(eventInfo, confirmarCita, handleCancelarCita, enviarRecordatorio) {
    const cita = eventInfo.event.extendedProps;
    const estado = cita.estado || 'pendiente';
    const colorFondo = getColorEstado(estado);

    const horaInicio = formatearHora(cita.hora_inicio);
    const horaFin = formatearHora(cita.hora_fin);
    const rangoHora = horaFin ? `${horaInicio} - ${horaFin}` : horaInicio;

    const tooltipText = `Paciente: ${cita.nombre_paciente || 'S/N'}\nMotivo: ${cita.motivo || '-'}\nDentista: ${cita.dentista?.nombre_completo || cita.usuarios?.nombre_completo || '-'}\nEstado: ${estado.toUpperCase()}\nNotas: ${cita.notas || '-'}`;

    return (
        <div
            className="fc-event-main-frame p-2 rounded overflow-hidden relative group"
            style={{ backgroundColor: colorFondo }}
            title={tooltipText}
        >
            <div className="fc-event-time font-bold text-xs mb-1">
                {rangoHora}
            </div>
            <div className="fc-event-title text-xs font-semibold line-clamp-2">
                {cita.nombre_paciente || 'Paciente'}
            </div>
            <div className="text-xs opacity-90 line-clamp-1 mt-1">
                {cita.motivo || 'Sin motivo'}
            </div>

            {/* Botones de acción rápida al hacer hover */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                {estado === 'pendiente' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            confirmarCita(cita.id);
                        }}
                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold"
                        title="Confirmar"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        enviarRecordatorio(cita);
                    }}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold"
                    title="Enviar recordatorio"
                >
                    <Mail className="w-4 h-4" />
                </button>
                {estado !== 'cancelada' && estado !== 'atendida' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelarCita(cita.id);
                        }}
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold"
                        title="Cancelar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
