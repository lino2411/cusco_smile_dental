import { useState, useEffect } from "react";
import { SquarePen, Trash2, User, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

export default function UsuariosTabla({ usuarios, loading = false, onEditar, onEliminar }) {
    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        return new Date(fecha).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getRolBadge = (rol) => {
        const roles = {
            admin: { bg: "bg-purple-100", text: "text-purple-800", label: "Administrador" },
            odontologo: { bg: "bg-blue-100", text: "text-blue-800", label: "Odontólogo" },
            recepcionista: { bg: "bg-green-100", text: "text-green-800", label: "Recepcionista" },
        };
        const config = roles[rol] || { bg: "bg-gray-100", text: "text-gray-700", label: rol || "Sin rol" };
        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center ">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-smile_600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    if (!usuarios || usuarios.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No hay usuarios registrados</h3>
                <p className="text-gray-600">Comienza agregando el primer usuario al sistema</p>
            </div>
        );
    }

    // --- LÓGICA DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const usuariosPorPagina = 5; // Puedes ajustar este valor

    useEffect(() => {
        setPaginaActual(1);
    }, [usuarios]);

    const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);
    const indiceInicio = (paginaActual - 1) * usuariosPorPagina;
    const indiceFin = indiceInicio + usuariosPorPagina;
    const usuariosPaginados = usuarios.slice(indiceInicio, indiceFin);

    return (
        <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-smile_200 border-b border-smile_300">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">Foto</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">Usuario</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">DNI</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">Correo</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">Celular</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">Rol</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase text-gray-700">Registrado</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {usuariosPaginados.map((u) => (
                                <tr key={u.id} className="hover:bg-smile_50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-smile_300 shadow-sm flex-shrink-0">
                                            {u.avatar_url ? (
                                                <img
                                                    src={u.avatar_url}
                                                    alt={u.nombre_completo}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                        e.target.nextElementSibling.style.display = "flex";
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-smile_100 to-smile_200 ${u.avatar_url ? "hidden" : "flex"}`}>
                                                <User className="w-6 h-6 text-smile_600" />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="font-semibold text-gray-900">
                                            {u.nombre_completo || "Sin nombre"}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                        {u.dni || "-"}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        <div className="max-w-[200px] truncate" title={u.correo}>
                                            {u.correo || <span className="text-gray-400 italic">Sin correo</span>}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        {u.celular || <span className="text-gray-400">-</span>}
                                    </td>

                                    <td className="px-4 py-4">{getRolBadge(u.rol)}</td>

                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {formatearFecha(u.creado_en)}
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex justify-center gap-2">
                                            {/* Botón Editar - solo si tiene permiso */}
                                            {onEditar && (
                                                <button
                                                    onClick={() => onEditar(u)}
                                                    className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition group relative"
                                                >
                                                    <SquarePen className="w-4 h-4" />
                                                    <span className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 -top-9 left-1/2 -translate-x-1/2 shadow-lg z-10">
                                                        Editar
                                                    </span>
                                                </button>
                                            )}

                                            {/* Botón Eliminar - solo si tiene permiso */}
                                            {onEliminar && (
                                                <button
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: "¿Eliminar usuario?",
                                                            html: `Se eliminará a <strong>${u.nombre_completo}</strong>`,
                                                            icon: "warning",
                                                            showCancelButton: true,
                                                            confirmButtonText: "Sí, eliminar",
                                                            cancelButtonText: "Cancelar",
                                                            confirmButtonColor: "#EF4444",
                                                            background: "#111827",
                                                            color: "#F9FAFB",
                                                        }).then((r) => r.isConfirmed && onEliminar(u));
                                                    }}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition group relative"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 -top-9 left-1/2 -translate-x-1/2 shadow-lg z-10">
                                                        Eliminar
                                                    </span>
                                                </button>
                                            )}

                                            {/* Mensaje cuando no hay permisos */}
                                            {!onEditar && !onEliminar && (
                                                <span className="text-xs text-gray-400 italic">Solo lectura</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- FOOTER DE PAGINACIÓN --- */}
            <div className="flex flex-wrap justify-between items-center px-2">
                <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                    Mostrando <span className="font-bold text-gray-900">{usuariosPaginados.length}</span> de <span className="font-bold text-gray-900">{usuarios.length}</span> usuarios
                </div>

                {totalPaginas > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                            className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-smile_50 hover:text-smile_700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-sm font-medium text-gray-700 px-2">
                            Página <span className="text-smile_700 font-bold">{paginaActual}</span> de {totalPaginas}
                        </span>

                        <button
                            onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                            className="p-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-smile_50 hover:text-smile_700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
