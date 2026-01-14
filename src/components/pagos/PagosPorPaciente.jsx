import { useState, useEffect } from 'react';
import { Plus, DollarSign, Clock, CheckCircle, AlertCircle, Eye, Edit, Trash2, Receipt, FileText, CheckCircle2, XCircle } from 'lucide-react'; // ✅ Agregar CheckCircle2, XCircle
import Swal from 'sweetalert2';
import { obtenerPagosPorPaciente, eliminarPago } from '../../services/pagosService';
import PagoModal from './PagoModal';
import ReciboModal from './ReciboModal';
import EstadoCuentaModal from './EstadoCuentaModal';


export default function PagosPorPaciente({ pacienteId, pacienteNombre }) {
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const [mostrarRecibo, setMostrarRecibo] = useState(false);
    const [mostrarEstadoCuenta, setMostrarEstadoCuenta] = useState(false);
    const [pagoSeleccionado, setPagoSeleccionado] = useState(null);


    useEffect(() => {
        if (pacienteId) {
            cargarPagos();
        }
    }, [pacienteId]);


    const cargarPagos = async () => {
        setLoading(true);
        try {
            const pagosData = await obtenerPagosPorPaciente(pacienteId);
            setPagos(pagosData);
        } catch (error) {
            console.error('Error al cargar pagos:', error);
        } finally {
            setLoading(false);
        }
    };


    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(valor || 0);
    };


    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        const fechaSolo = fecha.split('T')[0];
        const [year, month, day] = fechaSolo.split('-');
        return `${day}/${month}/${year}`;
    };


    const getEstadoBadge = (estado) => {
        const badges = {
            pendiente: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle, label: 'Pendiente' },
            parcial: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Parcial' },
            pagado: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Pagado' },
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


    const calcularResumen = () => {
        const totalCosto = pagos.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0);
        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.a_cuenta || 0), 0);
        const totalDebe = totalCosto - totalPagado;


        return { totalCosto, totalPagado, totalDebe };
    };


    const handleNuevoPago = () => {
        setPagoSeleccionado(null);
        setMostrarModalPago(true);
    };


    const handleEditarPago = (pago) => {
        setPagoSeleccionado(pago);
        setMostrarModalPago(true);
    };


    const handleVerRecibo = (pago) => {
        setPagoSeleccionado(pago);
        setMostrarRecibo(true);
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
                await cargarPagos();
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
        setMostrarModalPago(false);
        setPagoSeleccionado(null);
        cargarPagos();
    };


    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-16 h-16 border-4 border-smile_500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando pagos...</p>
            </div>
        );
    }


    const { totalCosto, totalPagado, totalDebe } = calcularResumen();


    return (
        <div className="space-y-6">
            {/* Header con botones */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Historial de Pagos</h3>
                    <p className="text-gray-600 text-sm mt-1">
                        Gestión de pagos de {pacienteNombre}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setMostrarEstadoCuenta(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <FileText className="w-4 h-4" />
                        Estado de Cuenta
                    </button>
                    <button
                        onClick={handleNuevoPago}
                        className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors font-medium shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Pago
                    </button>
                </div>
            </div>


            {/* Resumen financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Tratamientos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {formatearMoneda(totalCosto)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>


                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Pagado</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatearMoneda(totalPagado)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>


                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Debe</p>
                            <p className="text-2xl font-bold text-red-600 mt-2">
                                {formatearMoneda(totalDebe)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>


            {/* Lista de pagos */}
            {pagos.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No hay pagos registrados</h3>
                    <p className="text-gray-600 mb-6">
                        Este paciente aún no tiene pagos registrados
                    </p>
                    <button
                        onClick={handleNuevoPago}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Registrar Primer Pago
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-smile_200 border-b border-smile_300">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase">Tratamiento</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase">Costo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase">Pagado</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase">Debe</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase">Estado</th>
                                    {/* ✅ NUEVA COLUMNA: Firma Paciente */}
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase">Firma Paciente</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pagos.map((pago) => {
                                    const debe = parseFloat(pago.costo) - parseFloat(pago.a_cuenta || 0);
                                    return (
                                        <tr key={pago.id} className="hover:bg-smile_50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatearFecha(pago.fecha)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {pago.tratamiento_realizado}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatearMoneda(pago.costo)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                {formatearMoneda(pago.a_cuenta)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                                {formatearMoneda(debe)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getEstadoBadge(pago.estado)}
                                            </td>
                                            {/* ✅ NUEVA CELDA: Muestra si tiene firma */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {pago.firma_id ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleVerRecibo(pago)}
                                                        className="p-2 text-white bg-smile_500 rounded-lg hover:bg-smile_600 transition-colors group relative"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                            Ver recibo
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditarPago(pago)}
                                                        className="p-2 text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors group relative"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                            Editar recibo
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminarPago(pago.id)}
                                                        className="p-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors group relative"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                            Eliminar recibo
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* Modales */}
            {mostrarModalPago && (
                <PagoModal
                    pago={pagoSeleccionado}
                    onClose={handleModalClose}
                />
            )}


            {mostrarRecibo && pagoSeleccionado && (
                <ReciboModal
                    pagoId={pagoSeleccionado.id}
                    onClose={() => {
                        setMostrarRecibo(false);
                        setPagoSeleccionado(null);
                    }}
                />
            )}


            {mostrarEstadoCuenta && (
                <EstadoCuentaModal
                    pacienteId={pacienteId}
                    onClose={() => setMostrarEstadoCuenta(false)}
                />
            )}
        </div>
    );
}
