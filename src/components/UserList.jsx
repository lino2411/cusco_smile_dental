import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Swal from "sweetalert2";

export default function UserList() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const cargarUsuarios = async () => {
            const { data, error } = await supabase
                .from("usuarios")
                .select("dni, nombre_completo, correo, rol");

            if (error) {
                Swal.fire("Error", "No se pudo cargar la lista de usuarios ❌", "error");
            } else {
                const ordenados = data.sort((a, b) =>
                    a.nombre_completo.localeCompare(b.nombre_completo)
                );
                setUsuarios(ordenados);
            }

            setLoading(false);
        };

        cargarUsuarios();
    }, []);

    const usuariosFiltrados = usuarios.filter((u) =>
        `${u.nombre_completo} ${u.dni} ${u.correo}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const usuariosPaginados = usuariosFiltrados.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    if (loading) return <p className="text-center py-6">Cargando usuarios...</p>;

    if (!loading && usuariosFiltrados.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500">
                No se encontraron usuarios.
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-xl shadow border">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">👥 Usuarios</h2>

            {/* Buscador */}
            <input
                type="text"
                placeholder="Buscar por nombre, DNI o correo..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                className="mb-4 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* Tabla */}
            <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-left">
                    <tr>
                        <th className="p-2 border">DNI</th>
                        <th className="p-2 border">Nombre</th>
                        <th className="p-2 border">Correo</th>
                        <th className="p-2 border">Rol</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosPaginados.map((u) => (
                        <tr key={u.dni} className="hover:bg-gray-50">
                            <td className="p-2 border">{u.dni}</td>
                            <td className="p-2 border">{u.nombre_completo}</td>
                            <td className="p-2 border">{u.correo}</td>
                            <td className="p-2 border">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${u.rol === "admin"
                                        ? "bg-blue-100 text-blue-800"
                                        : u.rol === "recepcion"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {u.rol}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded-lg ${currentPage === i + 1
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
