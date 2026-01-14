import { useState, useEffect } from 'react';
import { registrarHistoriaClinica, actualizarHistoriaClinica } from '../../services/historiasClinicasService';
import Swal from 'sweetalert2';
import { FileText, Activity, AlertCircle, Stethoscope, ClipboardList, Pill, CheckCircle2 } from 'lucide-react';
import { useForm } from "react-hook-form";

export default function HistoriaClinicaFormModal({
    onClose,
    onHistoriaCreada,
    onHistoriaActualizada,
    historiaEditando,
    modoEdicion,
    pacienteId,
    pacienteNombre
}) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        mode: "onChange",
    });

    // Cargar datos si se está editando
    useEffect(() => {
        if (historiaEditando) {
            Object.entries(historiaEditando).forEach(([key, value]) => {
                setValue(key, value ?? "");
            });
        }
    }, [historiaEditando, setValue]);

    const onSubmit = async (formData) => {
        setLoading(true);
        try {
            const datosLimpios = {
                ...Object.fromEntries(
                    Object.entries(formData).map(([key, value]) => [key, value === "" ? null : value])
                ),
                paciente_id: pacienteId,
            };

            if (modoEdicion && historiaEditando) {
                const actualizada = await actualizarHistoriaClinica(datosLimpios, historiaEditando.id);
                Swal.fire({
                    title: "Historia clínica actualizada",
                    text: "Los datos se guardaron correctamente",
                    icon: "success",
                    background: '#111827',
                    color: '#F9FAFB',
                    timer: 2000,
                    showConfirmButton: false,
                });
                onHistoriaActualizada(actualizada);
            } else {
                const nueva = await registrarHistoriaClinica(datosLimpios);
                Swal.fire({
                    title: "Historia clínica registrada",
                    text: "Se creó exitosamente",
                    icon: "success",
                    background: '#111827',
                    color: '#F9FAFB',
                    timer: 2000,
                    showConfirmButton: false,
                });
                onHistoriaCreada(nueva);
                reset();
            }
            onClose();
        } catch (err) {
            console.error("Error al guardar historia clínica:", err);
            Swal.fire({
                title: "Error",
                text: err.message || "No se pudo guardar la historia clínica",
                icon: "error",
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-smile_100 bg-gradient-to-r from-smile_600 to-smile_700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        {modoEdicion ? "Editar Historia Clínica" : "Nueva Historia Clínica"}
                    </h2>
                    <p className="text-smile_100 text-sm mt-1">
                        Paciente: {pacienteNombre}
                    </p>
                </div>

                {/* Contenido con scroll */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                    {/* Sección 1: Motivo de Consulta */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-smile_600" />
                            Motivo de Consulta
                        </h3>
                        <div className="space-y-2">
                            <textarea
                                {...register("motivo_consulta")}
                                placeholder="Describe el motivo de la consulta..."
                                rows="3"
                                className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Sección 2: Enfermedad Actual */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <Activity className="w-4 h-4 text-smile_600" />
                            Enfermedad Actual
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Tiempo de Enfermedad</label>
                                <input
                                    {...register("tiempo_enfermedad")}
                                    placeholder="Ej: 2 semanas"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Signos y Síntomas</label>
                                <input
                                    {...register("signos_sintomas")}
                                    placeholder="Dolor, inflamación, etc."
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Relato de la Enfermedad</label>
                            <textarea
                                {...register("relato_enfermedad")}
                                placeholder="Describe cómo inició y evolucionó el problema..."
                                rows="3"
                                className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Sección 3: Antecedentes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-smile_600" />
                            Antecedentes
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Antecedentes Patológicos Personales</label>
                                <textarea
                                    {...register("antecedentes_personales")}
                                    placeholder="Enfermedades previas, cirugías, alergias..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Antecedentes Patológicos Familiares</label>
                                <textarea
                                    {...register("antecedentes_familiares")}
                                    placeholder="Enfermedades en la familia..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Examen Clínico - Signos Vitales */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-smile_600" />
                            Examen Clínico - Signos Vitales
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">P.A.</label>
                                <input
                                    {...register("presion_arterial")}
                                    placeholder="120/80"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pulso</label>
                                <input
                                    {...register("pulso")}
                                    placeholder="72 lpm"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Temp.</label>
                                <input
                                    {...register("temperatura")}
                                    placeholder="36.5°C"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">SpO2</label>
                                <input
                                    {...register("spo2")}
                                    placeholder="98%"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Examen Clínico General</label>
                            <textarea
                                {...register("examen_fisico")}
                                placeholder="Hallazgos del examen físico..."
                                rows="3"
                                className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Sección 5: Diagnóstico */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <FileText className="w-4 h-4 text-smile_600" />
                            Diagnóstico (CIE-10)
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Diagnóstico Presuntivo</label>
                                <input
                                    {...register("diagnostico_presuntivo")}
                                    placeholder="Diagnóstico preliminar..."
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Diagnóstico Definitivo</label>
                                <input
                                    {...register("diagnostico_definitivo")}
                                    placeholder="Diagnóstico final..."
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Código CIE-10</label>
                                <input
                                    {...register("cie10_codigo")}
                                    placeholder="Ej: K02.9"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 6: Plan de Tratamiento */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-smile_600" />
                            Plan de Tratamiento
                        </h3>
                        <div className="space-y-2">
                            <textarea
                                {...register("plan_tratamiento")}
                                placeholder="Describe el plan de tratamiento..."
                                rows="3"
                                className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Sección 7: Pronóstico */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Pronóstico</h3>
                        <div className="space-y-2">
                            <textarea
                                {...register("pronostico")}
                                placeholder="Pronóstico del caso..."
                                rows="2"
                                className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Sección 8: Tratamiento Farmacológico */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <Pill className="w-4 h-4 text-smile_600" />
                            Tratamiento Farmacológico / Recomendaciones
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Medicamentos</label>
                                <textarea
                                    {...register("tratamiento_farmacologico")}
                                    placeholder="Prescripción de medicamentos..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Recomendaciones</label>
                                <textarea
                                    {...register("recomendaciones")}
                                    placeholder="Indicaciones para el paciente..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 9: Control y Evolución */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Control y Evolución</h3>
                        <div className="space-y-2">
                            <textarea
                                {...register("control_evolucion")}
                                placeholder="Plan de seguimiento y controles..."
                                rows="2"
                                className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${modoEdicion
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-smile_600 hover:bg-smile_700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                {modoEdicion ? 'Actualizar' : 'Guardar'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
