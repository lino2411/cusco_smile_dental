import { Eye, SquarePen, Trash2, Search, FileDown, UserPlus, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from 'sweetalert2';
import { usePaciente } from '../../context/PacienteContext';
import OdontogramasManager from '../../components/odontograma/OdontogramasManager';



export default function PacientesTable({ pacientes, loading = false, onEditarPaciente, onEliminarPaciente, onVerPerfilPaciente }) {


    if (loading) {
        return (
            <div className="py-20 flex flex-col justify-center items-center gap-6">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-smile_600"></div>
                <span className="text-sm text-gray-600 font-medium">Cargando pacientes...</span>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
            <table className="min-w-full text-sm">
                <thead className="bg-smile_200 text-gray-800 text-left">
                    <tr>
                        <th className="px-6 py-3">DNI</th>
                        <th className="px-6 py-3">Nombre Completo</th>
                        <th className="px-6 py-3">Sexo</th>
                        <th className="px-6 py-3">Celular</th>
                        <th className="px-6 py-3">Fecha Registro</th>
                        <th className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {pacientes.map((p, index) => (
                        <tr
                            key={p.id}
                            className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-smile_50 hover:to-smile_50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                        >
                            <td className="px-6 py-3">{p.dni}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{`${p.nombres} ${p.apellidos}`}</td>
                            <td className="px-6 py-3">{p.sexo}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{p.celular || '-'}</td>
                            <td className="px-6 py-3">{new Date(p.creado_en).toLocaleDateString('es-ES')}</td>
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2 justify-center">
                                    {/* Ver perfil */}
                                    <button
                                        onClick={() => onVerPerfilPaciente(p)}
                                        className="px-3 py-1 text-white bg-smile_600 rounded hover:bg-smile_700 transition-colors group relative"
                                    >
                                        <Eye className="w-5 h-5" />
                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Ver perfil del paciente
                                        </span>
                                    </button>

                                    {/* Botón Editar */}
                                    <button
                                        onClick={() => onEditarPaciente(p)}
                                        className="px-3 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors group relative"
                                        title="Editar"
                                    >
                                        <SquarePen className="w-5 h-5" />
                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Editar paciente
                                        </span>
                                    </button>

                                    {/* Botón Eliminar */}
                                    <button
                                        onClick={() => {
                                            Swal.fire({
                                                title: "¿Eliminar paciente?",
                                                text: "Esta acción no se puede deshacer.",
                                                icon: "warning",
                                                background: '#111827',
                                                color: '#F9FAFB',
                                                showCancelButton: true,
                                                confirmButtonText: "Sí, eliminar",
                                                cancelButtonText: "Cancelar",
                                                reverseButtons: true,
                                            }).then((result) => {
                                                if (result.isConfirmed) {
                                                    onEliminarPaciente(p.id);
                                                } else if (result.isDismissed) {
                                                    // ✅ Muestra una alerta si el usuario cancela
                                                    Swal.fire({
                                                        title: "Cancelado",
                                                        text: "El paciente no ha sido eliminado.",
                                                        icon: "info",
                                                        background: '#111827',
                                                        color: '#F9FAFB'
                                                    });
                                                }
                                            });
                                        }}
                                        className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600 transition-colors group relative"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                            Eliminar paciente
                                        </span>
                                    </button>

                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}