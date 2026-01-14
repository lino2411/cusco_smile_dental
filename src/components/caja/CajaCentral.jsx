import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from '../../services/supabaseClient';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Download, Filter, RefreshCw, AlertCircle, CirclePlus, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import { obtenerMovimientosCaja, obtenerResumenCaja, cerrarCajaHoy } from "../../services/cajaService";
import { formatearMoneda } from "../../utils/formatos";
import CajaResumenCard from "./CajaResumenCard";
import CajaMovimientosTable from "./CajaMovimientosTable";
import CajaModal from "./CajaModal";
import { obtenerFechaPeruHoy } from '../../utils/fechas';
import { generarExcelCajaCentral } from '../../utils/caja/cajaCentralExcelGenerator';

export default function CajaCentralDashboard() {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroFecha, setFiltroFecha] = useState({
        inicio: obtenerFechaPeruHoy(),
        fin: obtenerFechaPeruHoy()
    });
    // const [filtroFecha, setFiltroFecha] = useState({
    //     inicio: '',
    //     fin: ''
    // });
    const [tipoFiltro, setTipoFiltro] = useState('');
    const [origenFiltro, setOrigenFiltro] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [cajaCerradaHoy, setCajaCerradaHoy] = useState(false);
    const [usuarioId, setUsuarioId] = useState(null);

    const movimientosPorPagina = 6;

    // Obtener usuario actual
    useEffect(() => {
        const obtenerUsuarioActual = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    const { data } = await supabase
                        .from('usuarios')
                        .select('id')
                        .eq('auth_user_id', session.user.id)
                        .single();

                    if (data) setUsuarioId(data.id);
                }
            } catch (error) {
                console.error("Error obteniendo usuario:", error);
            }
        };

        obtenerUsuarioActual();
    }, []);

    // Cargar datos
    useEffect(() => {
        cargarTodo();
    }, [filtroFecha, tipoFiltro, origenFiltro]);

    const cargarTodo = useCallback(async () => {
        setLoading(true);
        try {
            const [data, resumen] = await Promise.all([
                obtenerMovimientosCaja({
                    fecha_inicio: filtroFecha.inicio,
                    fecha_fin: filtroFecha.fin,
                    tipo_filtro: tipoFiltro,
                    origen_filtro: origenFiltro
                }),
                obtenerResumenCaja(obtenerFechaPeruHoy())
            ]);

            setMovimientos(data);
            setCajaCerradaHoy(resumen.cierreRealizado);
            setPaginaActual(1);
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudieron cargar los datos',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        } finally {
            setLoading(false);
        }
    }, [filtroFecha, tipoFiltro, origenFiltro]);

    // Totales
    const totales = useMemo(() => {
        const ingresos = movimientos
            .filter(m => m.tipo_movimiento === 'ingreso')
            .reduce((sum, m) => sum + m.monto, 0);

        const egresos = movimientos
            .filter(m => m.tipo_movimiento === 'egreso')
            .reduce((sum, m) => sum + m.monto, 0);

        return { ingresos, egresos, saldo: ingresos - egresos };
    }, [movimientos]);

    // Handlers
    const handleCierreCaja = useCallback(async () => {
        if (cajaCerradaHoy) {
            Swal.fire({
                title: "Caja ya cerrada",
                text: "No se puede cerrar la caja dos veces el mismo día",
                icon: "info",
                background: "#111827",
                color: "#F9FAFB"
            });
            return;
        }

        if (totales.saldo === 0) {
            Swal.fire({
                title: "Saldo cero",
                text: "No hay saldo para cerrar",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB"
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: "¿Cerrar la caja de hoy?",
            text: `Se registrará un cierre con saldo de ${formatearMoneda(totales.saldo)}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cerrar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#EF4444",
            background: "#111827",
            color: "#F9FAFB",
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    await cerrarCajaHoy({
                        usuario_registro: usuarioId,
                        nota: `Cierre del día. Ingresos: ${formatearMoneda(totales.ingresos)}, Egresos: ${formatearMoneda(totales.egresos)}`
                    });
                    return true;
                } catch (error) {
                    Swal.showValidationMessage(error.message);
                    return false;
                }
            }
        });

        if (isConfirmed) {
            Swal.fire({
                title: "¡Caja cerrada!",
                text: "El cierre ha sido registrado correctamente",
                icon: "success",
                timer: 2000,
                background: "#111827",
                color: "#F9FAFB",
                showConfirmButton: false
            });
            cargarTodo();
        }
    }, [totales, cajaCerradaHoy, usuarioId]);

    const handleExportar = useCallback(() => {
        if (!movimientos.length) {
            Swal.fire({
                title: "Sin datos",
                text: "No hay movimientos para exportar",
                icon: "info",
                background: "#111827",
                color: "#F9FAFB"
            });
            return;
        }

        try {
            generarExcelCajaCentral(movimientos, {
                inicio: filtroFecha.inicio,
                fin: filtroFecha.fin
            });

            // ✅ Swal de éxito
            Swal.fire({
                title: '¡Exportado!',
                text: 'El archivo Excel se descargó correctamente',
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo generar el archivo Excel',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        }
    }, [movimientos, filtroFecha]);

    // UI
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                                <Wallet className="w-8 h-8" />
                                Caja Central
                            </h1>
                            <p className="text-smile_100 text-sm">Control total de ingresos & egresos de la clínica</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${cajaCerradaHoy ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {cajaCerradaHoy ? 'Caja Cerrada Hoy' : 'Caja Abierta'}
                            </span>
                            {!cajaCerradaHoy && (
                                <button
                                    onClick={handleCierreCaja}
                                    disabled={totales.saldo === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium shadow-lg"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    Cerrar Caja
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Totales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <CajaResumenCard tipo="ingresos" monto={totales.ingresos} />
                    <CajaResumenCard tipo="egresos" monto={totales.egresos} />
                    <CajaResumenCard tipo="saldo" monto={Math.abs(totales.saldo)} />
                </div>

                {/* Filtros y Acciones */}
                <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
                    <div className="flex flex-wrap items-end gap-4 justify-between">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Desde:</label>
                                <input
                                    type="date"
                                    value={filtroFecha.inicio}
                                    onChange={e => setFiltroFecha(f => ({ ...f, inicio: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Hasta:</label>
                                <input
                                    type="date"
                                    value={filtroFecha.fin}
                                    onChange={e => setFiltroFecha(f => ({ ...f, fin: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Tipo:</label>
                                <select
                                    value={tipoFiltro}
                                    onChange={e => setTipoFiltro(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none text-sm min-w-[120px]"
                                >
                                    <option value="">Todos</option>
                                    <option value="ingreso">Ingresos</option>
                                    <option value="egreso">Egresos</option>
                                    <option value="cierre">Cierres</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Origen:</label>
                                <select
                                    value={origenFiltro}
                                    onChange={e => setOrigenFiltro(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none text-sm min-w-[150px]"
                                >
                                    <option value="">Todos</option>
                                    <option value="pagos">Módulo Pagos</option>
                                    <option value="ortodoncia">Módulo Ortodoncia</option>
                                    <option value="cierre_diario">Cierre de Caja</option>
                                    <option value="ajuste_manual">Ajustes Manuales</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={cargarTodo}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                                title="Recargar datos"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Recargar
                            </button>
                            <button
                                onClick={handleExportar}
                                disabled={movimientos.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                                title="Exportar a CSV"
                            >
                                <Download className="w-5 h-5" />
                                Exportar
                            </button>
                            <button
                                onClick={() => setMostrarModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors font-medium shadow-md"
                                title="Registrar egreso o ajuste"
                            >
                                <CirclePlus className="w-5 h-5" />
                                Nuevo Egreso
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla de Movimientos */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <CajaMovimientosTable
                        movimientos={movimientos}
                        loading={loading}
                        paginaActual={paginaActual}
                        movimientosPorPagina={movimientosPorPagina}
                        onActualizar={cargarTodo}
                    />
                </div>

                {/* Paginación (fuera de la tabla) */}
                {Math.ceil(movimientos.length / movimientosPorPagina) > 1 && (
                    <div className="flex justify-center items-center gap-3 p-4 mt-2">
                        <button
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                            className="px-2 py-1 bg-smile_600 text-white rounded hover:bg-smile_700 disabled:opacity-50"
                        >
                            <ChevronLeft />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            Página {paginaActual} de {Math.ceil(movimientos.length / movimientosPorPagina)}
                        </span>
                        <button
                            onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(movimientos.length / movimientosPorPagina)))}
                            disabled={paginaActual === Math.ceil(movimientos.length / movimientosPorPagina)}
                            className="px-2 py-1 bg-smile_600 rounded text-white hover:bg-smile_700 disabled:opacity-50"
                        >
                            <ChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal para egresos */}
            <CajaModal
                visible={mostrarModal}
                onClose={() => setMostrarModal(false)}
                onGuardado={cargarTodo}
                usuarioId={usuarioId}
            />
        </div>
    );
}
