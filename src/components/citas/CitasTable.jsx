import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Eye, Edit, Check, X, Mail, RotateCcw, Calendar,
    User, Clock, ChevronDown, Play, UserCheck, CheckCircle2,
    ChevronLeft, ChevronRight, Bell, BookOpen, Search
} from 'lucide-react';
import { useNavigate } from "react-router-dom";


// -------------------------------------------------------------
// MENÚ DE ACCIONES (PORTAL) - SIN CAMBIOS
// -------------------------------------------------------------
function AccionesMenu({
    cita,
    index,
    totalCitas,
    onVerDetalles,
    onEditar,
    onConfirmar,
    onPasarAConsulta,
    onFinalizarAtencion,
    onCancelar,
    onReprogramar,
    onEnviarRecordatorio,
    onVerHistoria
}) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [openUpwards, setOpenUpwards] = useState(false);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const toggleMenu = () => {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Calcular si debe abrir hacia arriba
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldOpenUp = spaceBelow < 400; // 400px es la altura aproximada del menú

            setOpenUpwards(shouldOpenUp);

            setCoords({
                top: shouldOpenUp ? (rect.top + scrollY - 5) : (rect.bottom + scrollY + 5),
                left: rect.right + scrollX - 176
            });
        }
        setOpen(!open);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                open &&
                buttonRef.current && !buttonRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        // SOLUCIÓN: Solo cerrar si el scroll NO es dentro del dropdown
        const handleScroll = (event) => {
            if (open && dropdownRef.current) {
                // No cerrar si el scroll es dentro del dropdown
                if (!dropdownRef.current.contains(event.target)) {
                    setOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', () => setOpen(false));

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', () => setOpen(false));
        };
    }, [open]);

    const esCitaFinalizada = cita.estado === 'cancelada' || cita.estado === 'atendida';

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={`px-2 py-1.5 rounded-md bg-smile_500 text-white shadow-sm border border-transparent flex items-center justify-center hover:bg-smile_600 focus:outline-none transition-all duration-200 ${open ? 'bg-smile_700' : ''}`}
                onClick={toggleMenu}
                title="Acciones"
            >
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        position: 'absolute',
                        zIndex: 9999,
                        transform: openUpwards ? 'translateY(-100%)' : 'none',
                        maxHeight: '400px', // NUEVO: Altura máxima
                        overflowY: 'auto'   // NUEVO: Scroll interno
                    }}
                    className={`w-48 bg-white rounded-lg shadow-xl ring-1 ring-black/5 border border-gray-100 animate-in fade-in zoom-in-95 duration-100 ${openUpwards ? 'origin-bottom-right' : 'origin-top-right'}`}
                >
                    {/* NUEVO: Contenedor con padding para el scroll */}
                    <div className="py-1">

                        {/* SECCIÓN: VER INFORMACIÓN */}
                        <div className="space-y-0.5">
                            <button
                                onClick={() => { setOpen(false); onVerDetalles(cita); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-smile_50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-smile_500"
                            >
                                <span className="w-5 h-5 flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-gray-500 group-hover:text-smile_600" />
                                </span>
                                <span className="font-medium">Ver detalles</span>
                            </button>

                            <button
                                onClick={() => { setOpen(false); onVerHistoria(cita); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-indigo-500"
                            >
                                <span className="w-5 h-5 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700" />
                                </span>
                                <span className="font-medium text-indigo-700 group-hover:text-indigo-800">Ver Historia</span>
                            </button>
                        </div>

                        {/* Divisor visual */}
                        <div className="my-1 border-t border-gray-200"></div>

                        {/* SECCIÓN: CAMBIAR ESTADO */}
                        <div className="space-y-0.5">
                            {cita.estado === 'pendiente' && (
                                <button
                                    onClick={() => { setOpen(false); onConfirmar(cita.id); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-green-500"
                                >
                                    <span className="w-5 h-5 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                                    </span>
                                    <span className="font-medium">Confirmar</span>
                                </button>
                            )}

                            {cita.estado === 'confirmada' && (
                                <button
                                    onClick={() => { setOpen(false); onPasarAConsulta(cita.id); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-purple-500"
                                >
                                    <span className="w-5 h-5 flex items-center justify-center">
                                        <Play className="w-4 h-4 text-gray-500 group-hover:text-purple-600" />
                                    </span>
                                    <span className="font-medium">Iniciar Atención</span>
                                </button>
                            )}

                            {cita.estado === 'en_consulta' && (
                                <button
                                    onClick={() => { setOpen(false); onFinalizarAtencion(cita.id); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-blue-500"
                                >
                                    <span className="w-5 h-5 flex items-center justify-center">
                                        <UserCheck className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                    </span>
                                    <span className="font-medium">Finalizar Atención</span>
                                </button>
                            )}
                        </div>

                        {/* Divisor visual */}
                        {!esCitaFinalizada && <div className="my-1 border-t border-gray-200"></div>}

                        {/* SECCIÓN: EDITAR/REPROGRAMAR/CANCELAR */}
                        {!esCitaFinalizada && (
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => { setOpen(false); onEditar(cita); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-blue-500"
                                >
                                    <span className="w-5 h-5 flex items-center justify-center">
                                        <Edit className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                    </span>
                                    <span className="font-medium">Editar</span>
                                </button>

                                <button
                                    onClick={() => { setOpen(false); onReprogramar(cita); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-yellow-500"
                                >
                                    <span className="w-5 h-5 flex items-center justify-center">
                                        <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-yellow-600" />
                                    </span>
                                    <span className="font-medium">Reprogramar</span>
                                </button>

                                <button
                                    onClick={() => { setOpen(false); onCancelar(cita.id); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-red-500"
                                >
                                    <span className="w-5 h-5 flex items-center justify-center">
                                        <X className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                                    </span>
                                    <span className="font-medium">Cancelar</span>
                                </button>
                            </div>
                        )}

                        {/* Divisor visual */}
                        <div className="my-1 border-t border-gray-200"></div>

                        {/* SECCIÓN: COMUNICACIÓN */}
                        <div className="space-y-0.5">
                            <button
                                onClick={() => { setOpen(false); onEnviarRecordatorio(cita); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-indigo-500"
                            >
                                <span className="w-5 h-5 flex items-center justify-center">
                                    <Bell className="w-4 h-4 text-gray-500 group-hover:text-indigo-600" />
                                </span>
                                <span className="font-medium">Recordatorio</span>
                            </button>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL - SOLO CON BÚSQUEDA
// -------------------------------------------------------------
export default function CitasTable({
    citas,
    loading,
    onVerDetalles,
    onEditar,
    onConfirmar,
    onPasarAConsulta,
    onFinalizarAtencion,
    onCancelar,
    onReprogramar,
    onEnviarRecordatorio
}) {

    const navigate = useNavigate();

    const handleVerHistoria = (cita) => {
        const idPaciente = cita.id_paciente || cita.paciente_id || cita.pacientes?.id;
        navigate(`/dashboard/pacientes?pacienteId=${idPaciente}&tab=historias`);
    };

    // ÚNICA MEJORA: Estado para búsqueda
    const [busqueda, setBusqueda] = useState('');

    // --- PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const citasPorPagina = 6;

    useEffect(() => {
        setPaginaActual(1);
    }, [citas, busqueda]);

    // Filtrar citas (sin ordenamiento, mantiene orden original)
    const citasFiltradas = citas.filter(c => {
        const termino = busqueda.toLowerCase();
        const nombrePaciente = (c.nombre_paciente || '').toLowerCase();
        const dni = (c.pacientes?.dni || c.dni_paciente || '').toLowerCase();
        const motivo = (c.motivo || '').toLowerCase();
        const dentista = (c.usuarios?.nombre_completo || '').toLowerCase();

        return nombrePaciente.includes(termino) ||
            dni.includes(termino) ||
            motivo.includes(termino) ||
            dentista.includes(termino);
    });

    const totalPaginas = Math.ceil(citasFiltradas.length / citasPorPagina);
    const indiceInicio = (paginaActual - 1) * citasPorPagina;
    const indiceFin = indiceInicio + citasPorPagina;
    const citasPaginadas = citasFiltradas.slice(indiceInicio, indiceFin);

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-smile_600"></div>
            </div>
        );
    }

    if (!citas.length) {
        return (
            <div className="py-12 text-center bg-white rounded-xl shadow-lg">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No hay citas registradas</p>
            </div>
        );
    }

    return (
        <>
            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por paciente, DNI, motivo o dentista..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-smile_500 outline-none text-sm"
                    />
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {busqueda && (
                    <p className="text-xs text-gray-500 mt-2">
                        {citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? 's' : ''} encontrado{citasFiltradas.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-smile_100 text-gray-900">
                            <tr>
                                <th className="py-3 px-4 text-left font-bold">Paciente</th>
                                <th className="py-3 px-4 text-left font-bold">Fecha/Hora</th>
                                <th className="py-3 px-4 text-left font-bold">Motivo</th>
                                <th className="py-3 px-4 text-left font-bold">Dentista</th>
                                <th className="py-3 px-4 text-left font-bold">Estado</th>
                                <th className="py-3 px-4 text-center font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {citasPaginadas.map((cita, index) => (
                                <tr key={cita.id} className="hover:bg-smile_50 transition-colors border-b last:border-b-0">
                                    <td className="py-3 px-4 font-medium">
                                        <div className="flex items-center gap-3">
                                            {/* <div className="p-2 bg-gray-100 rounded-full">
                                                <User className="w-5 h-5 text-gray-600" />
                                            </div> */}
                                            <div>
                                                <div className="font-bold text-gray-900">{cita.nombre_paciente}</div>
                                                <div className="text-xs text-gray-500 font-normal">
                                                    DNI: {cita.pacientes?.dni || cita.dni_paciente || 'S/N'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900">
                                            {cita.fecha ? String(cita.fecha).split('T')[0].split('-').reverse().join('-') : ''}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatHora12(cita.hora_inicio)} - {cita.hora_fin ? formatHora12(cita.hora_fin) : '--:--'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="truncate max-w-xs text-gray-700" title={cita.motivo}>
                                            {cita.motivo}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="truncate max-w-xs text-gray-700" title={cita.usuarios?.nombre_completo}>
                                            {cita.usuarios?.nombre_completo || '-'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeClase(cita.estado)}`}>
                                            {cita.estado === 'atendida' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {formatEstado(cita.estado)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center flex items-center justify-center">
                                        <AccionesMenu
                                            cita={cita}
                                            index={index}
                                            totalCitas={citasPaginadas.length}
                                            onVerDetalles={onVerDetalles}
                                            onEditar={onEditar}
                                            onConfirmar={onConfirmar}
                                            onPasarAConsulta={onPasarAConsulta}
                                            onFinalizarAtencion={onFinalizarAtencion}
                                            onCancelar={onCancelar}
                                            onReprogramar={onReprogramar}
                                            onEnviarRecordatorio={onEnviarRecordatorio}
                                            onVerHistoria={handleVerHistoria}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between mt-2 text-sm text-gray-600 mb-3 px-2">
                <div>
                    Mostrando <span className="font-medium text-gray-800">{citasPaginadas.length}</span> de <span className="font-medium text-gray-800">{citasFiltradas.length}</span> citas
                    {busqueda && <span className="text-smile_600 font-medium"> (filtradas de {citas.length} totales)</span>}
                </div>
            </div>

            {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-2 mt-2 mb-4">
                    <button
                        onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                        disabled={paginaActual === 1}
                        className="px-2 py-1 bg-smile_600 text-white rounded hover:bg-smile_700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm font-medium text-gray-700">
                        Página {paginaActual} de {totalPaginas}
                    </span>

                    <button
                        onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaActual === totalPaginas}
                        className="px-2 py-1 bg-smile_600 text-white rounded hover:bg-smile_700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </>
    );
}


// -------------------------------------------------------------
// FUNCIONES AUXILIARES (SIN CAMBIOS)
// -------------------------------------------------------------
function getBadgeClase(estado) {
    const clases = {
        'pendiente': 'bg-cyan-100 text-cyan-800 border-cyan-200',
        'confirmada': 'bg-green-100 text-green-800 border-green-200',
        'en_consulta': 'bg-purple-100 text-purple-800 border-purple-200',
        'atendida': 'bg-blue-100 text-blue-800 border-blue-200',
        'cancelada': 'bg-red-100 text-red-800 border-red-200',
        'reprogramada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return clases[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function formatEstado(estado) {
    if (!estado) return '';
    return estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ');
}

function formatHora12(hora) {
    if (!hora) return '';
    const [h, m] = hora.split(':');
    const horaNum = parseInt(h, 10);
    const ampm = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum % 12 || 12;
    return `${hora12.toString().padStart(2, '0')}:${m} ${ampm}`;
}
