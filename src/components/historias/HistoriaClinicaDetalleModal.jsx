import { X, Calendar, User, FileText, Activity, AlertCircle, Stethoscope, ClipboardList, Pill, Download } from 'lucide-react';
import { generarPDFHistoriaClinica } from '../../utils/historiaClinica/historiaClinicaPDFGenerator';

export default function HistoriaClinicaDetalleModal({ historia, onClose }) {
    if (!historia) return null;

    const SeccionDetalle = ({ titulo, icono: Icono, children }) => (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2 border-b pb-2">
                {Icono && <Icono className="w-4 h-4 text-smile_600" />}
                {titulo}
            </h3>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );

    const Campo = ({ label, valor }) => (
        <div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-sm text-gray-900">{valor || "No especificado"}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-smile_600 to-smile_700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-6 h-6" />
                            Historia Clínica
                        </h2>
                        <div className="flex items-center gap-3 mt-2 text-smile_100 text-sm">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(historia.fecha).toLocaleDateString('es-PE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                            {historia.odontologo && (
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {historia.odontologo.nombre_completo}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido con scroll */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                    {/* Motivo de Consulta */}
                    <SeccionDetalle titulo="Motivo de Consulta" icono={ClipboardList}>
                        <Campo valor={historia.motivo_consulta} />
                    </SeccionDetalle>

                    {/* Enfermedad Actual */}
                    <SeccionDetalle titulo="Enfermedad Actual" icono={Activity}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Campo label="Tiempo de Enfermedad" valor={historia.tiempo_enfermedad} />
                            <Campo label="Signos y Síntomas" valor={historia.signos_sintomas} />
                        </div>
                        <Campo label="Relato de la Enfermedad" valor={historia.relato_enfermedad} />
                    </SeccionDetalle>

                    {/* Antecedentes */}
                    <SeccionDetalle titulo="Antecedentes" icono={AlertCircle}>
                        <Campo label="Antecedentes Patológicos Personales" valor={historia.antecedentes_personales} />
                        <Campo label="Antecedentes Patológicos Familiares" valor={historia.antecedentes_familiares} />
                    </SeccionDetalle>

                    {/* Examen Clínico - Signos Vitales */}
                    <SeccionDetalle titulo="Examen Clínico - Signos Vitales" icono={Stethoscope}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                            <Campo label="P.A." valor={historia.presion_arterial} />
                            <Campo label="Pulso" valor={historia.pulso} />
                            <Campo label="Temperatura" valor={historia.temperatura} />
                            <Campo label="SpO2" valor={historia.spo2} />
                        </div>
                        <Campo label="Examen Clínico General" valor={historia.examen_fisico} />
                    </SeccionDetalle>

                    {/* Diagnóstico */}
                    <SeccionDetalle titulo="Diagnóstico (CIE-10)" icono={FileText}>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            <Campo label="Diagnóstico Presuntivo" valor={historia.diagnostico_presuntivo} />
                            <Campo label="Diagnóstico Definitivo" valor={historia.diagnostico_definitivo} />
                            <Campo label="Código CIE-10" valor={historia.cie10_codigo} />
                        </div>
                    </SeccionDetalle>

                    {/* Plan de Tratamiento */}
                    <SeccionDetalle titulo="Plan de Tratamiento" icono={ClipboardList}>
                        <Campo valor={historia.plan_tratamiento} />
                    </SeccionDetalle>

                    {/* Pronóstico */}
                    <SeccionDetalle titulo="Pronóstico">
                        <Campo valor={historia.pronostico} />
                    </SeccionDetalle>

                    {/* Tratamiento Farmacológico */}
                    <SeccionDetalle titulo="Tratamiento Farmacológico / Recomendaciones" icono={Pill}>
                        <Campo label="Medicamentos" valor={historia.tratamiento_farmacologico} />
                        <Campo label="Recomendaciones" valor={historia.recomendaciones} />
                    </SeccionDetalle>

                    {/* Control y Evolución */}
                    <SeccionDetalle titulo="Control y Evolución">
                        <Campo valor={historia.control_evolucion} />
                    </SeccionDetalle>
                </div>

                {/* Footer */}
                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-end gap-3">
                    <button
                        onClick={() => generarPDFHistoriaClinica(historia)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <X /> Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
