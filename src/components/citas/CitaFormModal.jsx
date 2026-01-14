import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import { crearCita, editarCita, cancelarCita, reprogramarCita } from '../../services/citas/citasService';
import { enviarNotificacionCita } from '../../services/citas/notificacionesService';
import { obtenerPacientes } from "../../services/pacientesService";
import { supabase } from '../../services/supabaseClient';
import { TRATAMIENTOS } from '../../data/tratamientos';
import SelectorTratamiento from '../pagos/SelectorTratamiento';
import {
    X, CalendarDays, Loader2, User, ClipboardEdit, CheckCircle2,
    RotateCcw, Bell, Clock, Stethoscope, FileText, Search, ChevronDown, Activity
} from 'lucide-react';


export default function CitaFormModal({ open, onClose, onGuardado, cita, dentistas, horarioClinica, usuarioId }) {
    const [form, setForm] = useState({
        nombre_paciente: '',
        paciente_id: null,
        dentista_id: '',
        motivo: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        notas: '',
        estado: 'pendiente'
    });

    const [pacientes, setPacientes] = useState([]);
    const [tratamientos, setTratamientos] = useState([]);
    const [loading, setLoading] = useState(false);

    // ESTADOS PARA EL SELECTOR CON BUSCADOR
    const [busquedaPaciente, setBusquedaPaciente] = useState('');
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // ✅ NUEVO: Estado para navegación con teclado
    const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);

    // Cargar pacientes
    const cargarPacientes = useCallback(async () => {
        try {
            const data = await obtenerPacientes();
            const pacientesFormateados = data.map(p => ({
                ...p,
                nombre_completo_display: `${p.nombres} ${p.apellidos}`.trim()
            }));
            setPacientes(pacientesFormateados);
        } catch (error) {
            console.error("Error cargando pacientes:", error);
        }
    }, []);

    // Cargar tratamientos
    const cargarTratamientos = useCallback(async () => {
        try {
            let listaCombinada = [...TRATAMIENTOS];

            const { data, error } = await supabase
                .from('pagos')
                .select('tratamiento_realizado');

            if (!error && data) {
                const historial = data
                    .map(item => item.tratamiento_realizado)
                    .filter(t => t && t.trim().length > 0)
                    .map(t => t.trim());

                listaCombinada = [...listaCombinada, ...historial];
            }

            const listaUnica = [...new Set(listaCombinada)].sort();
            setTratamientos(listaUnica);

        } catch (error) {
            console.error("Error cargando tratamientos:", error);
            setTratamientos(TRATAMIENTOS.sort());
        }
    }, []);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMostrarDropdown(false);
                setBusquedaPaciente('');
                setIndiceSeleccionado(-1); // ✅ NUEVO: Resetear índice
            }
        }
        if (mostrarDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [mostrarDropdown]);

    // LÓGICA PRE-LLENADO
    useEffect(() => {
        if (open) {
            cargarPacientes();
            cargarTratamientos();

            if (cita?.id) {
                setForm({
                    nombre_paciente: cita.nombre_paciente || '',
                    paciente_id: cita.paciente_id || null,
                    dentista_id: cita.dentista_id || '',
                    motivo: cita.motivo || '',
                    fecha: cita.fecha ? String(cita.fecha).split('T')[0] : '',
                    hora_inicio: cita.hora_inicio || '',
                    hora_fin: cita.hora_fin || '',
                    notas: cita.notas || '',
                    estado: cita.estado || 'pendiente'
                });
            } else {
                setForm({
                    nombre_paciente: '',
                    paciente_id: null,
                    dentista_id: '',
                    motivo: '',
                    fecha: cita?.fecha || '',
                    hora_inicio: cita?.hora_inicio || '',
                    hora_fin: cita?.hora_fin || '',
                    notas: '',
                    estado: 'pendiente'
                });
            }
            setMostrarDropdown(false);
            setBusquedaPaciente('');
            setIndiceSeleccionado(-1); // ✅ NUEVO: Resetear índice
        }
    }, [open, cita, cargarPacientes, cargarTratamientos]);

    const handleChange = useCallback((campo, valor) => {
        setForm(prev => ({ ...prev, [campo]: valor }));
    }, []);

    // ✅ NUEVO 1: Filtrado de pacientes con useMemo (optimización)
    const pacientesFiltrados = useMemo(() => {
        return pacientes.filter(p => {
            const termino = busquedaPaciente.toLowerCase();
            const nombre = p.nombre_completo_display.toLowerCase();
            const dni = (p.dni || '').toLowerCase();
            return nombre.includes(termino) || dni.includes(termino);
        });
    }, [pacientes, busquedaPaciente]);

    // ✅ NUEVO 2: Validación de fecha pasada
    const validarFecha = (fecha) => {
        const hoy = new Date().toISOString().split('T')[0];
        if (fecha < hoy) {
            Swal.fire({
                title: 'Fecha inválida',
                text: 'No puedes agendar citas en fechas pasadas',
                icon: 'warning',
                background: "#111827",
                color: "#F9FAFB",
                confirmButtonColor: '#EF4444'
            });
            return false;
        }
        return true;
    };

    const seleccionarPaciente = (paciente) => {
        setForm(prev => ({
            ...prev,
            paciente_id: paciente.id,
            nombre_paciente: paciente.nombre_completo_display
        }));
        setMostrarDropdown(false);
        setBusquedaPaciente('');
        setIndiceSeleccionado(-1); // ✅ NUEVO: Resetear índice
    };

    // ✅ NUEVO 3: Navegación con teclado en dropdown
    const handleKeyDown = (e) => {
        if (!mostrarDropdown || pacientesFiltrados.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIndiceSeleccionado(prev =>
                    prev < pacientesFiltrados.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setIndiceSeleccionado(prev => prev > 0 ? prev - 1 : 0);
                break;

            case 'Enter':
                e.preventDefault();
                if (indiceSeleccionado >= 0) {
                    seleccionarPaciente(pacientesFiltrados[indiceSeleccionado]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setMostrarDropdown(false);
                setBusquedaPaciente('');
                setIndiceSeleccionado(-1);
                break;
        }
    };

    // ✅ NUEVO 4: Auto-scroll para el elemento seleccionado
    useEffect(() => {
        if (indiceSeleccionado >= 0 && mostrarDropdown) {
            const elementoSeleccionado = document.getElementById(`paciente-${indiceSeleccionado}`);
            elementoSeleccionado?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [indiceSeleccionado, mostrarDropdown]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Validación básica
        if (!form.paciente_id || !form.dentista_id || !form.fecha || !form.hora_inicio || !form.motivo.trim()) {
            Swal.fire({
                title: "Campos incompletos",
                text: "Por favor complete paciente, dentista, fecha, hora inicio y tratamiento.",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB"
            });
            return;
        }

        // ✅ NUEVO: Validar fecha pasada
        if (!validarFecha(form.fecha)) {
            return;
        }

        if (form.hora_fin && form.hora_fin <= form.hora_inicio) {
            Swal.fire({ title: "Error horario", text: "La hora fin debe ser mayor a la inicio", icon: "warning", background: "#111827", color: "#F9FAFB" });
            return;
        }

        if (horarioClinica?.bloqueos) {
            const bloqueoEncontrado = horarioClinica.bloqueos.find(b => {
                const finCita = form.hora_fin || form.hora_inicio;
                return (form.hora_inicio < b.fin) && (finCita > b.inicio);
            });

            if (bloqueoEncontrado) {
                Swal.fire({
                    title: 'Horario no disponible',
                    text: `Interfiere con horario bloqueado: ${bloqueoEncontrado.motivo}`,
                    icon: 'warning',
                    background: "#111827",
                    color: "#F9FAFB"
                });
                return;
            }
        }

        const datosParaEnviar = {
            ...form,
            hora_fin: form.hora_fin || null,
            paciente_id: form.paciente_id,
            dentista_id: form.dentista_id
        };

        setLoading(true);
        try {
            if (cita?.id) {
                await editarCita(cita.id, datosParaEnviar, usuarioId);
                Swal.fire({ title: "¡Editada!", text: "Actualizada correctamente", icon: "success", timer: 1500, showConfirmButton: false, background: "#111827", color: "#F9FAFB" });
            } else {
                await crearCita(datosParaEnviar, usuarioId);

                const pacienteInfo = pacientes.find(p => p.id === form.paciente_id);
                const dentistaInfo = dentistas.find(d => String(d.id) === String(form.dentista_id));

                const nombrePacienteCompleto = pacienteInfo?.nombre_completo_display || form.nombre_paciente;
                const nombreDentista = dentistaInfo?.nombre_completo || 'Dentista Asignado';

                const [anio, mes, dia] = form.fecha.split('-');
                const fechaBonita = `${dia}/${mes}/${anio}`;

                const result = await Swal.fire({
                    title: '<h3 style="color:#F9FAFB; font-weight:bold;">¡Cita Agendada! 🎉</h3>',
                    html: `
                        <div style="text-align: left; font-size: 0.95rem; color: #E5E7EB; line-height: 1.6;">
                            <p style="margin-bottom: 12px;">Se ha registrado correctamente la cita para:</p>
                            <div style="background-color: #1F2937; padding: 12px; border-radius: 8px; border-left: 4px solid #22c55e; margin-bottom: 16px;">
                                <strong style="display:block; color:#F9FAFB; font-size:1.1em;">${nombrePacienteCompleto}</strong>
                                <span style="color:#9CA3AF; font-size:0.9em;">Dr(a). ${nombreDentista}</span>
                            </div>
                            <p>¿Desea enviar el comprobante de cita por <b>WhatsApp</b> ahora mismo?</p>
                        </div>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, enviar WhatsApp',
                    cancelButtonText: 'Cerrar',
                    confirmButtonColor: '#22c55e',
                    cancelButtonColor: '#4B5563',
                    background: '#111827',
                    color: '#F9FAFB',
                    reverseButtons: true,
                    customClass: {
                        popup: 'rounded-xl shadow-2xl border border-gray-700',
                        confirmButton: 'font-bold rounded-lg px-5 py-2.5',
                        cancelButton: 'font-medium rounded-lg px-5 py-2.5'
                    }
                });

                if (result.isConfirmed) {
                    const celular = pacienteInfo?.celular?.replace(/\D/g, '');
                    if (celular) {
                        const mensaje = `Hola *${nombrePacienteCompleto}*, le saludamos de *Cusco Smile*. 🦷\n\nSu cita ha sido agendada con éxito. ✅\n\n📅 *Fecha:* ${fechaBonita}\n⏰ *Hora:* ${form.hora_inicio}\n👨‍⚕️ *Dr(a):* ${nombreDentista}\n📝 *Tratamiento:* ${form.motivo}\n\n¡Le esperamos puntualmente! ✨`;
                        const urlWhatsApp = `https://wa.me/51${celular}?text=${encodeURIComponent(mensaje)}`;
                        window.open(urlWhatsApp, '_blank');
                    } else {
                        Swal.fire({ title: 'Sin número', text: 'El paciente no tiene un celular registrado.', icon: 'info', timer: 2500, showConfirmButton: false, background: '#111827', color: '#F9FAFB' });
                    }
                }
            }

            setTimeout(() => {
                if (onGuardado) onGuardado();
                onClose();
            }, 300);

        } catch (error) {
            console.error("Error al guardar cita:", error);
            Swal.fire({ title: "Error", text: error.message, icon: "error", background: "#111827", color: "#F9FAFB" });
        } finally {
            setLoading(false);
        }
    }, [form, cita, onGuardado, onClose, usuarioId, horarioClinica, pacientes, dentistas]);

    const handleCancelar = async () => {
        const confirmacion = await Swal.fire({ title: "¿Cancelar cita?", icon: "warning", showCancelButton: true, confirmButtonText: "Sí, cancelar", confirmButtonColor: "#EF4444", background: "#111827", color: "#F9FAFB" });
        if (!confirmacion.isConfirmed) return;
        setLoading(true);
        try {
            await cancelarCita(cita.id, `Usuario canceló: ${new Date().toLocaleString()}`);
            Swal.fire({ title: "¡Cancelada!", icon: "success", timer: 1500, showConfirmButton: false, background: "#111827", color: "#F9FAFB" });
            if (onGuardado) onGuardado(); onClose();
        } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
    };

    const handleReprogramar = async () => {
        const confirmacion = await Swal.fire({ title: "¿Reprogramar?", icon: "question", showCancelButton: true, confirmButtonText: "Sí", confirmButtonColor: "#EAB308", background: "#111827", color: "#F9FAFB" });
        if (!confirmacion.isConfirmed) return;
        setLoading(true);
        try {
            await reprogramarCita(cita.id, form.fecha, form.hora_inicio, form.hora_fin, `Reprog: ${new Date().toLocaleString()}`);
            Swal.fire({ title: "¡Reprogramada!", icon: "success", timer: 1500, showConfirmButton: false, background: "#111827", color: "#F9FAFB" });
            if (onGuardado) onGuardado(); onClose();
        } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
    };

    const handleEnviarNotificacion = async () => {
        if (!cita?.id) return; setLoading(true);
        try { await enviarNotificacionCita(cita); Swal.fire('Enviada', '', 'success'); }
        catch (e) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 rounded-xl">
                    <div className="bg-white p-4 rounded-lg shadow-xl"><Loader2 className="w-8 h-8 animate-spin text-smile_600" /></div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
                {/* HEADER */}
                <div className="px-6 py-4 bg-gradient-to-r from-smile_600 to-smile_700 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarDays className="w-6 h-6" /> {cita?.id ? 'Editar Cita' : 'Agregar Cita'}
                    </h2>
                    <button onClick={onClose} disabled={loading} className="p-1 hover:bg-smile_800 rounded-lg text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* FORM */}
                <form id="modal-cita-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

                    {/* Selector de Pacientes */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-smile_600" /> Paciente *
                        </label>

                        <div
                            onClick={() => !loading && setMostrarDropdown(!mostrarDropdown)}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-smile_500 outline-none cursor-pointer bg-white hover:border-gray-400 transition-colors flex items-center justify-between ${form.paciente_id ? 'border-smile_500 bg-smile_50' : 'border-gray-300'}`}
                        >
                            {form.paciente_id ? (
                                <span className="text-gray-900 font-medium truncate">
                                    {pacientes.find(p => p.id === form.paciente_id)?.nombre_completo_display || form.nombre_paciente}
                                    <span className="text-gray-500 text-sm ml-2 font-normal hidden sm:inline">
                                        - DNI: {pacientes.find(p => p.id === form.paciente_id)?.dni || 'S/N'}
                                    </span>
                                </span>
                            ) : (
                                <span className="text-gray-500">Seleccionar paciente</span>
                            )}
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${mostrarDropdown ? 'rotate-180' : ''}`} />
                        </div>

                        {form.paciente_id && !mostrarDropdown && (
                            <div className="text-xs text-green-600 mt-1.5 flex items-center gap-1 ml-1 font-medium animate-fade-in-up">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paciente seleccionado correctamente
                            </div>
                        )}

                        {mostrarDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-3 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        {/* ✅ MODIFICADO: Agregar onKeyDown */}
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Buscar por nombre o DNI... (usa ↑ ↓ Enter)"
                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-smile_500 focus:ring-1 focus:ring-smile_500"
                                            value={busquedaPaciente}
                                            onChange={(e) => {
                                                setBusquedaPaciente(e.target.value);
                                                setIndiceSeleccionado(-1); // ✅ NUEVO: Resetear al escribir
                                            }}
                                            onKeyDown={handleKeyDown}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    {/* ✅ NUEVO: Indicador de navegación */}
                                    {pacientesFiltrados.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            💡 Usa las flechas ↑ ↓ para navegar y Enter para seleccionar
                                        </p>
                                    )}
                                </div>
                                <div className="overflow-y-auto max-h-60">
                                    {pacientesFiltrados.length > 0 ? (
                                        pacientesFiltrados.map((paciente, index) => (
                                            <div
                                                key={paciente.id}
                                                id={`paciente-${index}`} // ✅ NUEVO: ID para scroll
                                                onClick={() => seleccionarPaciente(paciente)}
                                                className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${form.paciente_id === paciente.id ? 'bg-smile_50' :
                                                    indiceSeleccionado === index ? 'bg-blue-50' : 'hover:bg-smile_50'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {paciente.nombre_completo_display}
                                                    {/* ✅ NUEVO: Indicador de selección con teclado */}
                                                    {indiceSeleccionado === index && (
                                                        <span className="ml-2 text-blue-600 text-xs">← Presiona Enter</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                    <span>DNI: {paciente.dni || 'S/N'}</span>
                                                    {paciente.celular && <span>Cel: {paciente.celular}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                            No se encontraron pacientes
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dentista */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-smile_600" /> Dentista *
                        </label>
                        <select
                            required
                            value={form.dentista_id}
                            onChange={(e) => handleChange('dentista_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 bg-white outline-none"
                            disabled={loading}
                        >
                            <option value="">Seleccionar dentista</option>
                            {dentistas?.map(d => (
                                <option key={d.id} value={d.id}>{d.nombre_completo}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-smile_600" /> Fecha *
                            </label>
                            {/* ✅ MODIFICADO: Agregar min para prevenir fechas pasadas visualmente */}
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={form.fecha}
                                onChange={(e) => handleChange('fecha', e.target.value)}
                                className="bg-gray-50 px-3 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-smile_500 border border-gray-200"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-smile_600" /> Inicio *
                            </label>
                            <input
                                type="time"
                                required
                                value={form.hora_inicio}
                                onChange={(e) => handleChange('hora_inicio', e.target.value)}
                                className="bg-gray-50 px-3 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-smile_500 border border-gray-200"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-smile_600" /> Fin
                            </label>
                            <input
                                type="time"
                                value={form.hora_fin}
                                onChange={(e) => handleChange('hora_fin', e.target.value)}
                                className="bg-gray-50 px-3 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-smile_500 border border-gray-200"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Tratamiento */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-smile_600" /> Motivo - Tratamiento *
                        </label>
                        <SelectorTratamiento
                            value={form.motivo}
                            onChange={(valor) => handleChange('motivo', valor)}
                            tratamientos={tratamientos}
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-smile_600" /> Notas
                        </label>
                        <textarea
                            rows="2"
                            value={form.notas}
                            onChange={(e) => handleChange('notas', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 resize-none outline-none"
                            placeholder="Detalles adicionales o secuencia del tratamiento..."
                            disabled={loading}
                        />
                    </div>

                    {/* Acciones adicionales */}
                    {cita?.id && (
                        <div className="border-t pt-4 mt-4">
                            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Acciones Adicionales</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={handleCancelar} disabled={loading} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-colors">
                                    <X className="w-4 h-4" /> Cancelar
                                </button>
                                <button type="button" onClick={handleReprogramar} disabled={loading} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200 px-3 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-colors">
                                    <RotateCcw className="w-4 h-4" /> Reprogramar
                                </button>
                                <button type="button" onClick={handleEnviarNotificacion} disabled={loading} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-colors">
                                    <Bell className="w-4 h-4" /> Notificar
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {/* FOOTER */}
                <div className="flex items-center justify-end border-t p-4 bg-gray-50 flex-shrink-0 gap-3">
                    <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="modal-cita-form" disabled={loading} className="flex justify-center items-center px-6 py-2 gap-2 bg-gradient-to-r from-smile_600 to-smile_700 hover:from-smile_700 hover:to-smile_800 text-white rounded-lg font-medium shadow-md transition-all">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {loading ? "Guardando..." : (cita?.id ? "Guardar Cambios" : "Agendar Cita")}
                    </button>
                </div>
            </div>
        </div>
    );
}
