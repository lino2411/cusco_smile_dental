import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    obtenerControlesOrtodonciaPorPaciente,
    eliminarControlOrtodoncia,
} from "../../services/controlesOrtodonciaService";
import ControlOrtodonciaFormModal from "./ControlOrtodonciaFormModal";
import { SquarePen, Trash2, Plus, CheckCircle2, XCircle, FileText } from "lucide-react";
import { generarPDFControlesPorPaciente } from "../../utils/ortodoncia/controlesOrtodonciaPorPacientePDFGenerator";
import { formatearFecha } from '../../utils/fechas';
import EstadoCuentaOrtodonciaModal from "./EstadoCuentaOrtodonciaModal";


export default function ControlesOrtodonciaPorPaciente({ pacienteId, pacienteNombre, usuarioId, pacienteDni = 'N/A' }) {
    const [controles, setControles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [mostrarEstadoCuenta, setMostrarEstadoCuenta] = useState(false);


    // Fetch con loading circular
    useEffect(() => {
        setLoading(true);
        obtenerControlesOrtodonciaPorPaciente(pacienteId)
            .then(data => setControles(data || []))
            .catch(() => {
                Swal.fire({
                    title: "Error",
                    text: "No se pudo cargar controles de ortodoncia",
                    icon: "error",
                    background: "#111827",
                    color: "#F9FAFB",
                    timer: 1800,
                    showConfirmButton: false
                });
            })
            .finally(() => setLoading(false));
    }, [pacienteId]);


    const handleNuevo = () => {
        setEditando(null);
        setMostrarForm(true);
    };


    const handleEditar = (control) => {
        setEditando(control);
        setMostrarForm(true);
    };


    const handleEliminar = async (controlId) => {
        const confirmar = await Swal.fire({
            title: "¿Eliminar control?",
            text: "No podrás deshacer esta acción.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            background: "#1f2937",
            color: "#f9fafb",
        });
        if (!confirmar.isConfirmed) return;
        try {
            await eliminarControlOrtodoncia(controlId);
            Swal.fire({
                title: "Eliminado",
                text: "El control fue eliminado.",
                icon: "success",
                timer: 1500,
                background: "#111827",
                color: "#F9FAFB",
                showConfirmButton: false
            });
            // Optimización: Eliminar del estado local en lugar de recargar
            setControles(controlesActuales => controlesActuales.filter(c => c.id !== controlId));
        } catch {
            Swal.fire({
                title: "Error",
                text: "No se pudo eliminar el control.",
                icon: "error",
                background: "#111827",
                color: "#F9FAFB",
                timer: 1800,
                showConfirmButton: false
            });
        }
    };


    const handleGuardado = async (controlGuardado) => {
        setMostrarForm(false);
        if (editando) {
            // Si estábamos editando, actualizamos el control en la lista
            setControles(controles.map(c => c.id === controlGuardado.id ? controlGuardado : c));
        } else {
            // Si era uno nuevo, lo recargamos para obtener el objeto completo de la BD
            setLoading(true);
            const data = await obtenerControlesOrtodonciaPorPaciente(pacienteId);
            setControles(data || []);
            setLoading(false);
        }
        setEditando(null);
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        Controles de Ortodoncia de:
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{pacienteNombre}</p>
                </div>


                <div className="flex items-center gap-2">
                    {/* ✅ Botón Estado de Cuenta */}
                    <button
                        onClick={() => setMostrarEstadoCuenta(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <FileText className="w-5 h-5" />
                        Estado de Cuenta Ortodoncia
                    </button>

                    {/* Botón para descargar PDF de controles de ortodoncia */}
                    <button
                        onClick={() => generarPDFControlesPorPaciente(controles, pacienteNombre)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        Descargar PDF
                    </button>

                    {/* Botón para crear nuevo control */}
                    <button
                        onClick={handleNuevo}
                        className="flex items-center gap-2 px-4 py-2 bg-smile_500 hover:bg-smile_800 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Control
                    </button>
                </div>
            </div>
            {loading ? (
                <div className="flex flex-col items-center space-y-4 py-10">
                    {/* Loading circular estilo pagos */}
                    <div className="w-16 h-16 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600 font-medium">Cargando controles...</span>
                </div>
            ) : controles.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                    No hay controles de ortodoncia registrados.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-smile_100 text-gray-800 text-left">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Tratamiento</th>
                                <th className="px-6 py-3">Cuota</th>
                                <th className="px-6 py-3 text-center">Firma Paciente</th>
                                <th className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {controles.map((c, idx) => (
                                <tr
                                    key={c.id}
                                    className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-smile_50 hover:to-smile_50 cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                                >
                                    <td className="px-6 py-3">{formatearFecha(c.fecha)}</td>
                                    <td className="px-6 py-3">{c.tratamiento_realizado || "-"}</td>
                                    <td className="px-6 py-3">
                                        {c.cuota ? `S/ ${Number(c.cuota).toFixed(2)}` : "-"}
                                    </td>
                                    {/* ✅ COLUMNA DE FIRMA CON ICONOS */}
                                    <td className="px-6 py-3 text-center">
                                        {c.firma_id ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2 justify-center">
                                            <button
                                                onClick={() => handleEditar(c)}
                                                className="px-3 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
                                                title="Editar"
                                            >
                                                <SquarePen className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEliminar(c.id)}
                                                className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-800 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {mostrarForm && (
                <ControlOrtodonciaFormModal
                    onClose={() => setMostrarForm(false)}
                    onGuardado={handleGuardado}
                    pacienteId={pacienteId}
                    controlEditando={editando}
                    usuarioId={usuarioId}
                />
            )}

            {/* ✅ Modal Estado de Cuenta */}
            {mostrarEstadoCuenta && (
                <EstadoCuentaOrtodonciaModal
                    paciente={{
                        id: pacienteId,
                        nombres: pacienteNombre.split(' ')[0] || '',
                        apellidos: pacienteNombre.split(' ').slice(1).join(' ') || '',
                        dni: pacienteDni // ✅ AHORA DINÁMICO
                    }}
                    onClose={() => setMostrarEstadoCuenta(false)}
                />
            )}
        </div>
    );
}
