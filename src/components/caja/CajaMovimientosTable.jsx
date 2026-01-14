import { useMemo, useState } from 'react';
import { formatearFechaHora } from '../../utils/fechas';
import { formatearMoneda } from '../../utils/formatos';
import { AlertCircle, Eye, Edit, ChevronDown } from 'lucide-react';
import DetalleMovimientoCajaModal from './DetalleMovimientoCajaModal';
import EditarEgresoModal from './EditarEgresoModal';

// Botón de acciones solo con flechita ↓
function AccionesMenu({ movimiento, onVerDetalle, onEditarEgreso }) {
    const [open, setOpen] = useState(false);

    const handleBlur = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    };

    return (
        <div className="relative" tabIndex={0} onBlur={handleBlur}>
            <button
                className="px-2 py-1 rounded-md bg-smile_500 text-white shadow border flex items-center justify-center hover:bg-smile_700 focus:outline-none"
                onClick={() => setOpen(o => !o)}
                aria-label="Abrir menú de acciones"
            >
                <ChevronDown className="w-5 h-5" />
            </button>
            {open && (
                <div className="absolute right-0 z-20 mt-0 w-40 bg-white rounded-md shadow-lg border">
                    <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-smile_100"
                        onClick={() => { setOpen(false); onVerDetalle(movimiento); }}
                    >
                        <Eye className="w-4 h-4" /> Ver detalle
                    </button>
                    {movimiento.tipo_movimiento === 'egreso' && (
                        <button
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-smile_100"
                            onClick={() => { setOpen(false); onEditarEgreso(movimiento); }}
                        >
                            <Edit className="w-4 h-4" /> Editar
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CajaMovimientosTable({
    movimientos,
    loading,
    paginaActual,
    movimientosPorPagina,
    onActualizar // Para refrescar la tabla tras edición
}) {
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);

    const [egresoEditar, setEgresoEditar] = useState(null);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

    const movimientosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * movimientosPorPagina;
        return movimientos.slice(inicio, inicio + movimientosPorPagina);
    }, [movimientos, paginaActual, movimientosPorPagina]);

    const handleVerDetalle = (movimiento) => {
        setMovimientoSeleccionado(movimiento);
        setMostrarModal(true);
    };

    const handleCerrarModal = () => {
        setMostrarModal(false);
        setMovimientoSeleccionado(null);
    };

    const handleEditarEgreso = (egreso) => {
        setEgresoEditar(egreso);
        setMostrarModalEdicion(true);
    };

    const handleCerrarModalEdicion = () => {
        setMostrarModalEdicion(false);
        setEgresoEditar(null);
    };

    const handleEgresoEditado = () => {
        handleCerrarModalEdicion();
        if (onActualizar) onActualizar(); // Recargar datos tras editar
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col justify-center items-center gap-6">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-smile_600"></div>
                <span className="text-sm text-gray-600 font-medium">Cargando movimientos...</span>
            </div>
        );
    }

    if (!movimientos.length) {
        return (
            <div className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No hay movimientos registrados</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-smile_100 text-gray-900">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold">Fecha</th>
                            <th className="py-3 px-4 text-left font-bold">Descripción</th>
                            <th className="py-3 px-4 text-left font-bold">Tipo</th>
                            <th className="py-3 px-4 text-left font-bold">Origen</th>
                            <th className="py-3 px-4 text-left font-bold">Monto</th>
                            <th className="py-3 px-4 text-left font-bold">Paciente</th>
                            <th className="py-3 px-4 text-left font-bold">Usuario</th>
                            <th className="py-3 px-4 text-left font-bold">Saldo</th>
                            <th className="py-3 px-4 text-center font-bold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimientosPaginados.map(mov => (
                            <tr key={mov.id} className="hover:bg-smile_50 transition-colors border-b">
                                <td className="py-3 px-4">{formatearFechaHora(mov.fecha)}</td>
                                <td className="py-3 px-4 font-medium">{mov.descripcion}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${mov.tipo_movimiento === 'ingreso' ? 'bg-green-100 text-green-800' :
                                        mov.tipo_movimiento === 'egreso' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {mov.tipo_movimiento.toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-3 px-4 capitalize">{mov.origen.replace('_', ' ')}</td>
                                <td className={`py-3 px-4 font-bold ${mov.tipo_movimiento === 'egreso' ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatearMoneda(mov.monto)}
                                </td>
                                <td className="py-3 px-4">
                                    {mov.pacientes ? `${mov.pacientes.nombres} ${mov.pacientes.apellidos}` : '-'}
                                </td>
                                <td className="py-3 px-4">{mov.usuarios?.nombre_completo || 'Sistema'}</td>
                                <td className="py-3 px-4 font-medium">{formatearMoneda(mov.saldo_post_movimiento)}</td>
                                <td className="py-3 px-4 text-center">
                                    <AccionesMenu
                                        movimiento={mov}
                                        onVerDetalle={handleVerDetalle}
                                        onEditarEgreso={handleEditarEgreso}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de detalle */}
            {mostrarModal && movimientoSeleccionado && (
                <DetalleMovimientoCajaModal
                    movimiento={movimientoSeleccionado}
                    onClose={handleCerrarModal}
                />
            )}

            {/* Modal de edición SOLO para egresos */}
            {mostrarModalEdicion && egresoEditar && (
                <EditarEgresoModal
                    egreso={egresoEditar}
                    onClose={handleCerrarModalEdicion}
                    onEgresoEditado={handleEgresoEditado}
                />
            )}
        </>
    );
}
