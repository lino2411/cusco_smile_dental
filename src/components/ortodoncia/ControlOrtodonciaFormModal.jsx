import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { X, Calendar, Pencil, Save } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import { crearControlOrtodoncia, actualizarControlOrtodoncia } from "../../services/controlesOrtodonciaService";
import { registrarMovimientoCaja } from "../../services/cajaService";
import { obtenerFechaPeruHoy } from "../../utils/fechas";
import { guardarFirma } from "../../services/firmas/firmasService";
import SignatureCanvas from "react-signature-canvas";

export default function ControlOrtodonciaFormModal({ onClose, onGuardado, pacienteId, controlEditando, usuarioId }) {
    const [fecha, setFecha] = useState(obtenerFechaPeruHoy());
    const [tratamientoRealizado, setTratamientoRealizado] = useState("");
    const [cuota, setCuota] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Estados para firma digital
    const [mostrarFirma, setMostrarFirma] = useState(false);
    const [firmaDibujada, setFirmaDibujada] = useState(null);
    const sigCanvasRef = useRef(null);

    useEffect(() => {
        if (controlEditando) {
            setFecha(controlEditando.fecha ? controlEditando.fecha.substring(0, 10) : obtenerFechaPeruHoy());
            setTratamientoRealizado(controlEditando.tratamiento_realizado || "");
            setCuota(controlEditando.cuota ?? "");

            // Si tiene firma_id, mostrar que ya tiene firma
            if (controlEditando.firma_id) {
                setMostrarFirma(true);
            }
        }
    }, [controlEditando]);

    const validar = () => {
        if (!fecha) {
            Swal.fire({
                title: "Validación",
                text: "La fecha es obligatoria",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB",
                timer: 1500,
                showConfirmButton: false,
            });
            return false;
        }
        if (!tratamientoRealizado.trim()) {
            Swal.fire({
                title: "Validación",
                text: "El tratamiento realizado es obligatorio",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB",
                timer: 1500,
                showConfirmButton: false,
            });
            return false;
        }
        if (cuota !== "" && isNaN(Number(cuota))) {
            Swal.fire({
                title: "Validación",
                text: "La cuota debe ser un número válido",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB",
                timer: 1500,
                showConfirmButton: false,
            });
            return false;
        }
        return true;
    };

    // ✅ Función para limpiar firma
    const limpiarFirma = () => {
        if (sigCanvasRef.current) {
            sigCanvasRef.current.clear();
            setFirmaDibujada(null);
        }
    };

    // ✅ Función para guardar firma en estado
    const handleGuardarFirmaEnEstado = () => {
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            const dataURL = sigCanvasRef.current.toDataURL();
            setFirmaDibujada(dataURL);
            Swal.fire({
                title: "¡Firma guardada!",
                text: "La firma se guardará al registrar el control",
                icon: "success",
                background: "#111827",
                color: "#F9FAFB",
                timer: 1500,
                showConfirmButton: false,
            });
        } else {
            Swal.fire({
                title: "Firma vacía",
                text: "Por favor dibuje la firma primero",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB",
                timer: 1500,
                showConfirmButton: false,
            });
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!validar()) return;
        setLoading(true);

        // ✅ OBTENER USUARIO AL INICIO
        let usuarioData = null;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { data } = await supabase
                    .from('usuarios')
                    .select('id')
                    .eq('auth_user_id', session.user.id)
                    .single();
                usuarioData = data;
            }
        } catch (error) {
            console.error("Error obteniendo usuario:", error);
        }

        try {
            let firmaId = controlEditando?.firma_id || null;

            // ✅ Si hay firma dibujada, guardarla
            if (firmaDibujada) {

                // Obtener nombre del paciente
                const { data: paciente } = await supabase
                    .from('pacientes')
                    .select('nombres, apellidos, dni')
                    .eq('id', pacienteId)
                    .single();

                const nombreCompleto = `${paciente?.nombres || ''} ${paciente?.apellidos || ''}`.trim();

                // ✅ CORRECCIÓN: Si es edición, pasar el ID real; si es nuevo, pasar null
                const documentoIdTemporal = controlEditando?.id || null;

                const firmaGuardada = await guardarFirma(
                    firmaDibujada,
                    'ortodoncia',
                    documentoIdTemporal,
                    nombreCompleto,
                    paciente?.dni || null
                );
                firmaId = firmaGuardada.id;
            }

            const control = {
                paciente_id: pacienteId,
                fecha,
                tratamiento_realizado: tratamientoRealizado,
                cuota: cuota !== "" ? Number(cuota) : null,
                firma: !!firmaId, // Boolean para compatibilidad
                firma_id: firmaId, // ✅ ID de la firma
                usuario_registro: usuarioData?.id,
            };

            let savedControl;
            if (controlEditando) {
                // ✅ ACTUALIZAR CONTROL EXISTENTE
                savedControl = await actualizarControlOrtodoncia(controlEditando.id, control);
                Swal.fire({
                    title: "Actualizado!",
                    text: "El control fue actualizado correctamente.",
                    icon: "success",
                    timer: 1500,
                    background: "#111827",
                    color: "#F9FAFB",
                    showConfirmButton: false,
                });
            } else {
                // ✅ CREAR NUEVO CONTROL
                savedControl = await crearControlOrtodoncia(control);

                // ✅ Actualizar el campo documento_id en la tabla firmas
                if (firmaId) {
                    await supabase
                        .from('firmas')
                        .update({ documento_id: savedControl.id })
                        .eq('id', firmaId);
                }

                Swal.fire({
                    title: firmaDibujada ? "¡Registrado!" : "Registrado!",
                    text: firmaDibujada
                        ? "Control y firma registrados correctamente"
                        : "El control ha sido creado correctamente.",
                    icon: "success",
                    timer: 1500,
                    background: "#111827",
                    color: "#F9FAFB",
                    showConfirmButton: false,
                });
            }

            onGuardado(savedControl);
        } catch (err) {
            console.error("Error guardando control:", err);
            Swal.fire({
                title: "Error",
                text: err.message || "No se pudo guardar el control.",
                icon: "error",
                background: "#111827",
                color: "#F9FAFB",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-smile_600 to-smile_700 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Pencil className="w-7 h-7" />
                            {controlEditando ? "Editar Control Ortodoncia" : "Nuevo Control Ortodoncia"}
                        </h2>
                        <p className="text-smile_100 text-sm mt-1">
                            {controlEditando ? "Modifica la información del control" : "Registra un nuevo control para Ortodoncia"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form className="flex-1 flex flex-col overflow-y-auto" onSubmit={handleGuardar}>
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-smile_600" />
                            Información del Control
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cuota (S/)
                                </label>
                                <input
                                    type="number"
                                    value={cuota}
                                    onChange={e => setCuota(e.target.value)}
                                    step="0.01"
                                    min={0}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tratamiento realizado <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={tratamientoRealizado}
                                    onChange={e => setTratamientoRealizado(e.target.value)}
                                    placeholder="Ej: cambio de alambre, revisión mensual, etc."
                                    maxLength={120}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            {/* ✅ SECCIÓN DE FIRMA DIGITAL */}
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Firma del Paciente
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarFirma(!mostrarFirma)}
                                        className="text-sm text-smile_600 hover:text-smile_800 font-medium"
                                    >
                                        {mostrarFirma ? "Ocultar" : "Agregar firma"}
                                    </button>
                                </div>

                                {mostrarFirma && (
                                    <div className="border-2 border-smile_300 rounded-lg p-4 bg-white">
                                        {controlEditando?.firma_id ? (
                                            <div className="text-center py-4">
                                                <div className="text-smile_700 font-semibold text-lg mb-2">
                                                    ✅ Firma registrada
                                                </div>
                                                <p className="text-gray-600 text-sm">
                                                    Este control ya tiene una firma digital guardada
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-3">
                                                    <SignatureCanvas
                                                        ref={sigCanvasRef}
                                                        canvasProps={{
                                                            className: "w-full h-40 cursor-crosshair",
                                                        }}
                                                        backgroundColor="rgb(249, 250, 251)"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={limpiarFirma}
                                                        className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        🗑️ Limpiar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleGuardarFirmaEnEstado}
                                                        className="flex-1 px-3 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        💾 Guardar Firma
                                                    </button>
                                                </div>
                                                {firmaDibujada && (
                                                    <div className="mt-2 text-center">
                                                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                            ✓ Firma guardada
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-8 py-4 mt-auto border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-smile_600 to-smile_700 hover:from-smile_700 hover:to-smile_800 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? "Guardando..." : controlEditando ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
