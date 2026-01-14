import { Eye, FileText, Edit, Trash2, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

export default function HistoriasClinicasTable({
    historias,
    loading,
    onEditar,
    onEliminar,
    onVer
}) {
    const handleEliminar = (id) => {
        Swal.fire({
            title: "¿Eliminar historia clínica?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
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

    if (historias.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay historias clínicas
                </h3>
                <p className="text-gray-500">
                    Comienza registrando la primera historia clínica del paciente
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {historias.map((historia) => (
                <div
                    key={historia.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-4 h-4 text-smile_600" />
                                <span className="text-sm font-semibold text-gray-900">
                                    {new Date(historia.fecha).toLocaleDateString('es-PE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                                {historia.odontologo && (
                                    <span className="text-xs text-gray-500">
                                        por {historia.odontologo.nombre_completo}
                                    </span>
                                )}
                            </div>

                            <h4 className="text-sm font-medium text-gray-800 mb-2">
                                Motivo: {historia.motivo_consulta || 'Sin especificar'}
                            </h4>

                            {historia.diagnostico_definitivo && (
                                <p className="text-xs text-gray-600 mb-2">
                                    <strong>Diagnóstico:</strong> {historia.diagnostico_definitivo}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onVer(historia)}
                                className="px-3 py-1 text-white bg-smile_500 rounded hover:bg-smile_700 transition-colors group relative"
                            >
                                <Eye className="w-4 h-4" />
                                <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                    Ver historial clínico
                                </span>
                            </button>
                            <button
                                onClick={() => onEditar(historia)}
                                className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-700 transition-colors group relative"
                            >
                                <Edit className="w-4 h-4" />
                                <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                    Editar historial clínico
                                </span>
                            </button>
                            <button
                                onClick={() => handleEliminar(historia.id)}
                                className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-700 transition-colors group relative"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                    Eliminar historial
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
