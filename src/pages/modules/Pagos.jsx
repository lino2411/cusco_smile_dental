import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import { obtenerTodosPagos, obtenerEstadisticasPagos, eliminarPago } from '../../services/pagosService';
import PagoModal from '../../components/pagos/PagoModal';
import DetallesPagoModal from '../../components/pagos/DetallesPagoModal';
import { generarExcelListaPagos } from '../../utils/pagos/pagosListaExcelGenerator';
import { generarPDFListaPagos } from '../../utils/pagos/pagosListaPDFGenerator';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { Search, Plus, Filter, DollarSign, Clock, CheckCircle, AlertCircle, FileText, Eye, Edit, Trash2, ChevronLeft, ChevronRight, CirclePlus, FileSpreadsheet, CircleDollarSign, ChevronDown } from 'lucide-react';


// =====================================================
// COMPONENTE: MENÚ DE ACCIONES CON PORTAL
// =====================================================
function AccionesMenuPagos({ pago, onVerDetalles, onEditar, onEliminar }) {
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

            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldOpenUp = spaceBelow < 250;

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

        const handleScroll = (event) => {
            if (open && dropdownRef.current) {
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
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}
                    className={`w-48 bg-white rounded-lg shadow-xl ring-1 ring-black/5 border border-gray-100 animate-in fade-in zoom-in-95 duration-100 ${openUpwards ? 'origin-bottom-right' : 'origin-top-right'}`}
                >
                    <div className="py-1">
                        {/* Ver detalles */}
                        <button
                            onClick={() => { setOpen(false); onVerDetalles(pago); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-smile_50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-smile_500"
                        >
                            <span className="w-5 h-5 flex items-center justify-center">
                                <Eye className="w-4 h-4 text-gray-500 group-hover:text-smile_600" />
                            </span>
                            <span className="font-medium">Ver detalles</span>
                        </button>

                        {/* Divisor */}
                        <div className="my-1 border-t border-gray-200"></div>

                        {/* Editar */}
                        <button
                            onClick={() => { setOpen(false); onEditar(pago); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-blue-500"
                        >
                            <span className="w-5 h-5 flex items-center justify-center">
                                <Edit className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                            </span>
                            <span className="font-medium">Editar</span>
                        </button>

                        {/* Eliminar */}
                        <button
                            onClick={() => { setOpen(false); onEliminar(pago.id); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 transition-colors flex items-center gap-3 group border-l-2 border-transparent hover:border-red-500"
                        >
                            <span className="w-5 h-5 flex items-center justify-center">
                                <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                            </span>
                            <span className="font-medium">Eliminar</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}


// =====================================================
// COMPONENTE PRINCIPAL: PAGOS
// =====================================================
export default function Pagos() {
    const [pagos, setPagos] = useState([]);
    const [pagosFiltrados, setPagosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [estadisticas, setEstadisticas] = useState(null);

    const { colores } = useConfiguracion();

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const pagosPorPagina = 5;

    // Modales separados
    const [mostrarModal, setMostrarModal] = useState(false);
    const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [pagoIdSeleccionado, setPagoIdSeleccionado] = useState(null);
    const [usuario, setUsuario] = useState(null);

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        const fechaSolo = fecha.split('T')[0];
        const [year, month, day] = fechaSolo.split('-');
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        filtrarPagos();
    }, [busqueda, filtroEstado, pagos]);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, filtroEstado]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUsuario(user);

            const [pagosData, statsData] = await Promise.all([
                obtenerTodosPagos(),
                obtenerEstadisticasPagos(),
            ]);
            setPagos(pagosData);
            setEstadisticas(statsData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los pagos',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    const filtrarPagos = () => {
        let resultados = pagos;
        if (busqueda) {
            resultados = resultados.filter((pago) =>
                pago.pacientes?.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
                pago.pacientes?.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
                pago.pacientes?.dni?.includes(busqueda) ||
                pago.tratamiento_realizado?.toLowerCase().includes(busqueda.toLowerCase())
            );
        }
        if (filtroEstado !== 'todos') {
            resultados = resultados.filter((pago) => pago.estado === filtroEstado);
        }
        setPagosFiltrados(resultados);
    };

    const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);
    const inicio = (paginaActual - 1) * pagosPorPagina;
    const pagosPaginados = pagosFiltrados.slice(inicio, inicio + pagosPorPagina);

    const handleNuevoPago = () => {
        setPagoSeleccionado(null);
        setMostrarModal(true);
    };

    const handleVerDetalle = (pago) => {
        setPagoIdSeleccionado(pago.id);
        setMostrarDetalles(true);
    };

    const handleEditarPago = (pago) => {
        setPagoSeleccionado(pago);
        setMostrarModal(true);
    };

    const handleEliminarPago = async (pagoId) => {
        const result = await Swal.fire({
            title: '¿Eliminar pago?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            background: '#111827',
            color: '#F9FAFB',
        });
        if (result.isConfirmed) {
            try {
                await eliminarPago(pagoId);
                await cargarDatos();
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El pago ha sido eliminado',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el pago',
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        }
    };

    const handleModalClose = () => {
        setMostrarModal(false);
        setPagoSeleccionado(null);
        cargarDatos();
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            pendiente: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: AlertCircle,
                label: 'Pendiente',
            },
            parcial: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: Clock,
                label: 'Parcial',
            },
            pagado: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: CheckCircle,
                label: 'Pagado',
            },
        };
        const badge = badges[estado] || badges.pendiente;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
            </span>
        );
    };

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(valor || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
                <div className="text-center">
                    <div className="w-20 h-20 border-2 border-smile_600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando pagos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <CircleDollarSign className="w-10 h-10" /> Gestión de Pagos
                            </h1>
                            <p className="text-smile_100">
                                Control de pagos, cuentas y estados financieros
                            </p>
                        </div>

                        <div className='flex items-center justify-center gap-4'>
                            <button
                                onClick={async () => {
                                    await generarExcelListaPagos(pagosFiltrados);
                                    Swal.fire({
                                        title: 'Excel generado',
                                        text: 'La lista de pagos se descargó correctamente',
                                        icon: 'success',
                                        background: '#111827',
                                        color: '#F9FAFB',
                                        timer: 2000,
                                        showConfirmButton: false,
                                    });
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-800 transition-colors rounded-lg shadow-lg border-x border-white border-solid"
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                                Exportar Excel
                            </button>

                            <button
                                onClick={() => {
                                    generarPDFListaPagos(pagosFiltrados);
                                    Swal.fire({
                                        title: 'PDF generado',
                                        text: 'La lista de pagos se descargó correctamente',
                                        icon: 'success',
                                        background: '#111827',
                                        color: '#F9FAFB',
                                        timer: 2000,
                                        showConfirmButton: false,
                                    });
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-800 transition-colors rounded-lg shadow-lg border-x border-white border-solid"
                            >
                                <FileText className="w-5 h-5" />
                                Exportar PDF
                            </button>

                            <button
                                onClick={handleNuevoPago}
                                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-smile_700 rounded-lg transition-colors font-medium shadow-lg"
                            >
                                <CirclePlus className="w-5 h-5" />
                                Nuevo Pago
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                {estadisticas && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-600 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Total Ingresos</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {formatearMoneda(estadisticas.totalIngresos)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center transition-colors">
                                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-red-600 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Total Pendiente</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {formatearMoneda(estadisticas.totalPendiente)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center transition-colors">
                                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-yellow-600 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Pagos Parciales</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {estadisticas.pagosPorEstado.parcial}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center transition-colors">
                                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-smile_600 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Total Pagos</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {estadisticas.totalPagos}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-smile_100 dark:bg-smile_800 rounded-lg flex items-center justify-center transition-colors">
                                    <FileText className="w-6 h-6 text-smile_600 dark:text-smile_300" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros y búsqueda */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por paciente, DNI o tratamiento..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-smile_300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-smile_300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="pendiente">Pendientes</option>
                                <option value="parcial">Parciales</option>
                                <option value="pagado">Pagados</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabla de pagos */}
                {pagosFiltrados.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center transition-colors">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No se encontraron pagos</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {busqueda || filtroEstado !== 'todos'
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Aún no hay pagos registrados'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-smile_200 dark:bg-smile_800 border-b border-smile_300 dark:border-smile_700 font-bold uppercase transition-colors">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Fecha</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Paciente</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Tratamiento</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Costo</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Pagado</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Debe</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Estado</th>
                                        <th className="px-4 py-4 text-left text-xs text-gray-800 dark:text-gray-200">Firma</th>
                                        <th className="px-4 py-4 text-center text-xs text-gray-800 dark:text-gray-200">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {pagosPaginados.map((pago) => {
                                        const debe = parseFloat(pago.costo) - parseFloat(pago.a_cuenta || 0);
                                        return (
                                            <tr key={pago.id} className="hover:bg-smile_50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {formatearFecha(pago.fecha)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {pago.pacientes?.nombres} {pago.pacientes?.apellidos}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        DNI: {pago.pacientes?.dni}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                                    {pago.tratamiento_realizado}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatearMoneda(pago.costo)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                                    {formatearMoneda(pago.a_cuenta)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                                                    {formatearMoneda(debe)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    {getEstadoBadge(pago.estado)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                    {pago.firma_id ? (
                                                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto" />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Sin firma</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                                    {/* ✅ BOTÓN ÚNICO CON MENÚ */}
                                                    <AccionesMenuPagos
                                                        pago={pago}
                                                        onVerDetalles={handleVerDetalle}
                                                        onEditar={handleEditarPago}
                                                        onEliminar={handleEliminarPago}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Estadísticas de pagos filtrados */}
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div>
                        Mostrando <span className="font-medium text-gray-800 dark:text-gray-200">{pagosPaginados.length}</span> de <span className="font-medium text-gray-800 dark:text-gray-200">{pagosFiltrados.length}</span> pagos filtrados
                    </div>
                    <div>
                        Total general: <span className="font-medium text-gray-800 dark:text-gray-200">{pagos.length}</span> pagos registrados
                    </div>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                        <button
                            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                            className="px-2 py-1 bg-smile_600 text-white rounded hover:bg-smile_700 disabled:opacity-50"
                        >
                            <ChevronLeft />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <button
                            onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                            className="px-2 py-1 bg-smile_600 rounded text-white hover:bg-smile_700 disabled:opacity-50"
                        >
                            <ChevronRight />
                        </button>
                    </div>
                )}

                {/* Modales */}
                {mostrarModal && (
                    <PagoModal
                        pago={pagoSeleccionado}
                        onClose={handleModalClose}
                        usuario={usuario}
                    />
                )}

                {mostrarDetalles && (
                    <DetallesPagoModal
                        pagoId={pagoIdSeleccionado}
                        onClose={() => {
                            setMostrarDetalles(false);
                            setPagoIdSeleccionado(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
