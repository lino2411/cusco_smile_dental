import { useState } from 'react';
import { Eye, Trash2, Calendar, FileUp, PlusCircle, Clock } from 'lucide-react';
import { generarPDFOdontograma } from '../../utils/odontograma/odontogramaPDFGenerator';
import Swal from 'sweetalert2';

export default function OdontogramasLista({ odontogramas, loading, onVer, onEliminar, onNuevoOdontograma }) {
    const [tipoNuevo, setTipoNuevo] = useState('inicial');

    const handleNuevo = (tipo) => {
        setTipoNuevo(tipo);
        if (onNuevoOdontograma) {
            onNuevoOdontograma(tipo);
        }
    };

    const handleEliminar = (id) => {
        Swal.fire({
            title: '¿Eliminar odontograma?',
            text: 'Esta acción no se puede deshacer. Se eliminarán también todos los presupuestos asociados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            background: '#111827',
            color: '#F9FAFB',
        }).then((result) => {
            if (result.isConfirmed) {
                onEliminar(id);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-smile_600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Botones para nuevo odontograma */}
            <div className="flex justify-end gap-3 mb-6">
                <button
                    onClick={() => handleNuevo('inicial')}
                    className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition"
                >
                    <PlusCircle className="w-5 h-5" />
                    Nuevo Odontograma Inicial
                </button>
                <button
                    onClick={() => handleNuevo('evolutivo')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                    <Clock className="w-5 h-5" />
                    Nuevo Odontograma Evolutivo
                </button>
            </div>

            {/* // Botones para nuevo odontograma */}
            {odontogramas.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🦷</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No hay odontogramas registrados
                    </h3>
                    <p className="text-gray-500">
                        Crea el primer odontograma para este paciente
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {odontogramas.map((odontograma) => (
                        <div
                            key={odontograma.id}
                            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="px-3 py-1 bg-smile_100 text-smile_700 text-xs font-semibold rounded-full">
                                            {odontograma.tipo === 'inicial' ? 'Inicial' : 'Evolutivo'}
                                        </span>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                            {odontograma.tipo_denticion === 'adulto' ? 'Adulto' : 'Niño'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4 text-smile_600" />
                                            {new Date(odontograma.fecha).toLocaleDateString('es-PE', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span className="font-semibold">
                                                {odontograma.piezas_dentales?.length || 0}
                                            </span>
                                            piezas registradas
                                        </div>
                                    </div>

                                    {odontograma.observaciones && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                <strong>Observaciones:</strong> {odontograma.observaciones}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => onVer(odontograma)}
                                        className="px-3 py-2 bg-smile_500 text-white rounded-lg hover:bg-smile_700 transition-colors group relative"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Ver odontograma
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => generarPDFOdontograma(odontograma, odontograma.paciente)}
                                        className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 transition-colors group relative"
                                    >
                                        <FileUp className='w-4 h-4' />
                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Exportar a Pdf
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(odontograma.id)}
                                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors group relative"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Eliminar odontograma
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
