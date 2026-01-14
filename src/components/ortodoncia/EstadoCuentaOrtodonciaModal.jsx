import { useState, useEffect } from "react";
import { X, Printer, Download } from "lucide-react";
import { obtenerControlesOrtodonciaPorPaciente } from "../../services/controlesOrtodonciaService";
import { formatearFecha } from "../../utils/fechas";
import { supabase } from "../../services/supabaseClient";
import Swal from "sweetalert2";
import { generarPDFEstadoCuentaOrtodoncia } from "../../utils/ortodoncia/estadoCuentaOrtodonciaPDFGenerator";

export default function EstadoCuentaOrtodonciaModal({ paciente, onClose }) {
    const [controles, setControles] = useState([]);
    const [firmasURL, setFirmasURL] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [paciente.id]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            // Cargar controles
            const data = await obtenerControlesOrtodonciaPorPaciente(paciente.id);
            setControles(data || []);

            // Cargar URLs de firmas
            const firmasMap = {};
            for (const control of data || []) {
                if (control.firma_id) {
                    try {
                        const { data: firma } = await supabase
                            .from('firmas')
                            .select('firma_url')
                            .eq('id', control.firma_id)
                            .single();

                        if (firma?.firma_url) {
                            firmasMap[control.id] = firma.firma_url;
                        }
                    } catch (error) {
                        console.error(`Error cargando firma para control ${control.id}:`, error);
                    }
                }
            }
            setFirmasURL(firmasMap);
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire({
                title: "Error",
                text: "No se pudieron cargar los controles",
                icon: "error",
                background: "#111827",
                color: "#F9FAFB",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImprimir = () => {
        window.print();
    };

    const handleDescargarPDF = async () => {
        try {
            // Convertir firmas a base64 para el PDF
            const firmasBase64 = {};
            for (const [controlId, url] of Object.entries(firmasURL)) {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    firmasBase64[controlId] = base64;
                } catch (error) {
                    console.error('Error convirtiendo firma:', error);
                }
            }

            await generarPDFEstadoCuentaOrtodoncia(controles, paciente, firmasBase64);

            Swal.fire({
                title: '¡PDF Generado!',
                text: 'El estado de cuenta se descargó correctamente',
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

    const totalControles = controles.length;
    const totalCuotas = controles.reduce((sum, c) => sum + (Number(c.cuota) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 print:bg-transparent print:p-0">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 print:rounded-none print:shadow-none print:border-none print:max-h-none">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-smile_600 to-smile_700 px-6 py-4 flex justify-between items-center print:hidden">
                    <div className="text-white">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            📋 Estado de Cuenta - Ortodoncia
                        </h2>
                        <p className="text-sm opacity-90">Historial completo de controles del paciente</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* CONTENIDO */}
                <div className="flex-1 overflow-y-auto p-6 print:p-8">

                    {/* DATOS PACIENTE */}
                    <div className="mb-6 print:mb-4 bg-gray-100 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-start gap-20 items-start print:border-b-2 print:border-gray-300 print:pb-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 print:text-sm">Paciente</p>
                                <p className="text-base font-bold text-gray-900 print:text-lg">{paciente.nombres} {paciente.apellidos}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold text-gray-600 print:text-sm">DNI</p>
                                <p className="text-base font-bold text-gray-900 print:text-lg">{paciente.dni}</p>
                            </div>
                        </div>
                    </div>

                    {/* RESUMEN - Solo en pantalla */}
                    <div className="grid grid-cols-2 gap-4 mb-6 print:hidden">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-blue-700">Total Controles</p>
                            <p className="text-2xl font-bold text-blue-900">{totalControles}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-green-700">Total Cuotas</p>
                            <p className="text-2xl font-bold text-green-900">S/ {totalCuotas.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* TABLA CON FIRMAS */}
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Cargando datos...</p>
                        </div>
                    ) : controles.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No hay controles registrados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border-2 border-gray-400 rounded-lg print:border-2 print:border-black">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-smile_600 print:bg-gray-200">
                                        <th className="border-2 border-gray-400 px-4 py-3 text-left text-xs font-bold text-white uppercase print:text-black print:border-2 print:border-black print:text-sm">
                                            Fecha
                                        </th>
                                        <th className="border-2 border-gray-400 px-4 py-3 text-left text-xs font-bold text-white uppercase print:text-black print:border-2 print:border-black print:text-sm">
                                            Tratamiento Realizado
                                        </th>
                                        <th className="border-2 border-gray-400 px-4 py-3 text-center text-xs font-bold text-white uppercase print:text-black print:border-2 print:border-black print:text-sm">
                                            Cuota
                                        </th>
                                        <th className="border-2 border-gray-400 px-4 py-3 text-center text-xs font-bold text-white uppercase print:text-black print:border-2 print:border-black print:text-sm">
                                            Firma Paciente
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {controles.map((control, idx) => (
                                        <tr key={control.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="border-2 border-gray-300 px-4 py-3 text-sm text-gray-900 print:border-2 print:border-black print:text-base">
                                                {formatearFecha(control.fecha)}
                                            </td>
                                            <td className="border-2 border-gray-300 px-4 py-3 text-sm text-gray-900 print:border-2 print:border-black print:text-base">
                                                {control.tratamiento_realizado || '-'}
                                            </td>
                                            <td className="border-2 border-gray-300 px-4 py-3 text-sm text-gray-900 text-center print:border-2 print:border-black print:text-base">
                                                S/ {Number(control.cuota || 0).toFixed(2)}
                                            </td>
                                            <td className="border-2 border-gray-300 px-4 py-3 text-center print:border-2 print:border-black">
                                                {firmasURL[control.id] ? (
                                                    <img
                                                        src={firmasURL[control.id]}
                                                        alt="Firma"
                                                        className="max-h-12 mx-auto print:max-h-16"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400 print:text-sm">Sin firma</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TOTALES */}
                    <div className="mt-6 print:mt-4 print:border-t-2 print:border-gray-300 print:pt-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-900 print:text-base">Total de Controles: {totalControles}</span>
                            <span className="text-sm font-bold text-smile_600 print:text-black print:text-base">Total Cuotas: S/ {totalCuotas.toFixed(2)}</span>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 print:hidden">
                    <button
                        onClick={handleImprimir}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                    <button
                        onClick={handleDescargarPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <X className="w-4 h-4" />
                        Cerrar
                    </button>
                </div>

            </div>

            {/* ESTILOS IMPRESIÓN */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .fixed, .fixed * { visibility: visible; }
                    .fixed { position: static; }
                    
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    
                    @page { margin: 2cm; }
                }
            `}</style>
        </div>
    );
}
