import { useState, useEffect } from "react";
import { X, Calendar, FileText, User, Download } from "lucide-react";
import { formatearFecha } from '../../utils/fechas';
import { supabase } from "../../services/supabaseClient";
import { generarPDFControlOrtodoncia } from "../../utils/ortodoncia/controlOrtodonciaReciboPDFGenerator";
import Swal from "sweetalert2";

export default function ControlOrtodonciaDetalleModal({ control, onClose }) {
    const [firmaUrl, setFirmaUrl] = useState(null);
    const [firmaBase64, setFirmaBase64] = useState(null);
    const [cargandoFirma, setCargandoFirma] = useState(false);

    if (!control) return null;
    const paciente = control.paciente || {};

    // ✅ Cargar firma si existe
    useEffect(() => {
        const cargarFirma = async () => {
            if (!control.firma_id) return;

            setCargandoFirma(true);
            try {
                // 1. Obtener datos de la firma
                const { data: firma, error: errorFirma } = await supabase
                    .from('firmas')
                    .select('firma_url')
                    .eq('id', control.firma_id)
                    .single();

                if (errorFirma) throw errorFirma;

                if (firma?.firma_url) {
                    // 2. La URL ya es pública, usarla directamente
                    setFirmaUrl(firma.firma_url);

                    // 3. Convertir a Base64 para el PDF
                    try {
                        const response = await fetch(firma.firma_url);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setFirmaBase64(reader.result);
                        };
                        reader.readAsDataURL(blob);
                    } catch (error) {
                        console.error("Error convirtiendo firma a base64:", error);
                    }
                }
            } catch (error) {
                console.error("❌ Error cargando firma:", error);
            } finally {
                setCargandoFirma(false);
            }
        };

        cargarFirma();
    }, [control.firma_id]);

    // ✅ Función para descargar PDF
    const handleDescargarPDF = async () => {
        try {
            await generarPDFControlOrtodoncia(control, paciente, firmaBase64);

            Swal.fire({
                title: '¡PDF Generado!',
                text: 'El comprobante se descargó correctamente',
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error generando PDF:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo generar el PDF',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-smile_600 to-smile_700 py-5 px-7 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <FileText className="w-7 h-7 text-white" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Detalle de Control Ortodoncia</h2>
                            <div className="mt-1 flex items-center gap-3 text-xs text-smile_100 font-medium">
                                <User className="w-4 h-4" />
                                {paciente.nombres} {paciente.apellidos}
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded-md ml-2 text-[11px]">DNI: {paciente.dni}</span>
                            </div>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-white/20 transition" onClick={onClose}>
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Main */}
                <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                            <div className="flex items-center gap-2 text-base font-semibold text-smile_700">
                                <Calendar className="w-5 h-5" />
                                {formatearFecha(control.fecha)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Cuota</label>
                            <div className="mt-1 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 font-bold text-base">
                                {control.cuota !== null && control.cuota !== undefined ? `S/ ${Number(control.cuota).toFixed(2)}` : "-"}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Tratamiento realizado</label>
                        <div className="text-gray-900 font-semibold border border-gray-200 bg-gray-50 rounded-lg px-4 py-2">
                            {control.tratamiento_realizado}
                        </div>
                    </div>

                    {/* ✅ SECCIÓN DE FIRMA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Firma del Paciente
                        </label>
                        <div className="border-2 border-smile_200 rounded-lg p-4 bg-smile_50">
                            {cargandoFirma ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-gray-200 border-t-smile_600 rounded-full animate-spin mb-2"></div>
                                    <span className="text-sm text-gray-600">Cargando firma...</span>
                                </div>
                            ) : firmaUrl ? (
                                <div className="space-y-2">
                                    <div className="bg-white border-2 border-smile_300 rounded-lg p-3 flex items-center justify-center">
                                        <img
                                            src={firmaUrl}
                                            alt="Firma del paciente"
                                            className="max-h-32 object-contain"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            Firmado digitalmente
                                        </span>
                                        <span>{formatearFecha(control.fecha)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="text-gray-400 text-4xl mb-2">✍️</div>
                                    <p className="text-gray-500 text-sm">Sin firma registrada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 bg-smile_50 px-8 py-4 rounded-b-2xl sticky bottom-0">
                    {/* ✅ BOTÓN DESCARGAR PDF */}
                    <button
                        onClick={handleDescargarPDF}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-sm transition"
                    >
                        <Download className="w-5 h-5" /> Descargar PDF
                    </button>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white hover:bg-red-700 rounded-lg font-medium shadow-sm transition"
                    >
                        <X className="w-5 h-5" /> Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
