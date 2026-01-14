import { X, Download, Receipt, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatearFechaHora } from '../../utils/fechas';
import { formatearMoneda } from '../../utils/formatos';
import { generarPDFMovimientoCaja } from '../../utils/caja/cajaCentralPDFGenerator';
import Swal from 'sweetalert2';

export default function DetalleMovimientoCajaModal({ movimiento, onClose }) {
    if (!movimiento) return null;

    const handleDescargarPDF = () => {
        try {
            generarPDFMovimientoCaja(movimiento);

            Swal.fire({
                title: '¡Descargado!',
                text: 'El comprobante se ha generado correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#111827',
                color: '#F9FAFB'
            });
        } catch (error) {
            console.error('❌ Error al generar PDF:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo generar el comprobante',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        }
    };

    // Configuración según tipo
    const tipoConfig = {
        ingreso: {
            icon: TrendingUp,
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500',
            textColor: 'text-green-700',
            titulo: 'Comprobante de Ingreso',
            gradientFrom: 'from-green-600',
            gradientTo: 'to-green-700',
            hoverBg: 'hover:bg-green-800',
            buttonBg: 'bg-green-600',
            buttonHover: 'hover:bg-green-700'
        },
        egreso: {
            icon: TrendingDown,
            color: 'red',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-500',
            textColor: 'text-red-700',
            titulo: 'Comprobante de Egreso',
            gradientFrom: 'from-red-600',
            gradientTo: 'to-red-700',
            hoverBg: 'hover:bg-red-800',
            buttonBg: 'bg-red-600',
            buttonHover: 'hover:bg-red-700'
        },
        ajuste: {
            icon: DollarSign,
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-500',
            textColor: 'text-blue-700',
            titulo: 'Comprobante de Ajuste',
            gradientFrom: 'from-blue-600',
            gradientTo: 'to-blue-700',
            hoverBg: 'hover:bg-blue-800',
            buttonBg: 'bg-blue-600',
            buttonHover: 'hover:bg-blue-700'
        },
        cierre: {
            icon: Receipt,
            color: 'gray',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-500',
            textColor: 'text-gray-700',
            titulo: 'Comprobante de Cierre',
            gradientFrom: 'from-gray-600',
            gradientTo: 'to-gray-700',
            hoverBg: 'hover:bg-gray-800',
            buttonBg: 'bg-gray-600',
            buttonHover: 'hover:bg-gray-700'
        }
    };

    const config = tipoConfig[movimiento.tipo_movimiento] || tipoConfig.ingreso;
    const Icono = config.icon;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className={`px-8 py-6 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Icono className="w-7 h-7" />
                                    {config.titulo}
                                </h2>
                                <p className="text-white text-sm mt-1 opacity-90">
                                    N° {movimiento.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 ${config.hoverBg} rounded-lg transition-colors text-white`}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto flex-1">
                        {/* Información del movimiento */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                                <p className="text-gray-600">Fecha y Hora</p>
                                <p className="font-bold text-lg">{formatearFechaHora(movimiento.fecha)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-600">Tipo</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.textColor}`}>
                                    {movimiento.tipo_movimiento.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Origen */}
                        <div className={`${config.bgColor} rounded-lg p-4 mb-6 border-l-4 ${config.borderColor}`}>
                            <p className="text-gray-600 text-sm mb-1">Origen del movimiento</p>
                            <p className="font-semibold capitalize">{movimiento.origen.replace('_', ' ')}</p>
                        </div>

                        {/* Descripción */}
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-800 mb-2">Descripción</h3>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                {movimiento.descripcion}
                            </p>
                        </div>

                        {/* Datos del paciente (si aplica) */}
                        {movimiento.pacientes && (
                            <div className="bg-smile_50 rounded-lg p-6 mb-6">
                                <h3 className="font-bold text-smile_700 mb-3">Datos del Paciente</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Nombre completo</p>
                                        <p className="font-semibold">
                                            {movimiento.pacientes.nombres} {movimiento.pacientes.apellidos}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">DNI</p>
                                        <p className="font-semibold">{movimiento.pacientes.dni}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Usuario que registró */}
                        <div className="mb-6">
                            <p className="text-gray-600 text-sm">Registrado por</p>
                            <p className="font-semibold">{movimiento.usuarios?.nombre_completo || 'Sistema'}</p>
                        </div>

                        {/* Notas adicionales */}
                        {movimiento.nota && (
                            <div className="mb-6">
                                <h3 className="font-bold text-gray-800 mb-2">Notas Adicionales</h3>
                                <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                                    {movimiento.nota}
                                </p>
                            </div>
                        )}

                        {/* Montos */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">Monto del movimiento:</span>
                                    <span className={`text-2xl font-bold ${movimiento.tipo_movimiento === 'egreso' ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatearMoneda(movimiento.monto)}
                                    </span>
                                </div>

                                <div className="border-t-2 border-gray-300 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-medium">Saldo después del movimiento:</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatearMoneda(movimiento.saldo_post_movimiento)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer con botones */}
                    <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
                        <button
                            onClick={handleDescargarPDF}
                            className={`flex items-center gap-2 px-4 py-2 ${config.buttonBg} ${config.buttonHover} text-white rounded-lg transition-colors font-medium shadow-md`}
                        >
                            <Download className="w-4 h-4" />
                            Descargar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <X className="w-4 h-4" />
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
