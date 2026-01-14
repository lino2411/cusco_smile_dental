import { useState, useEffect } from 'react';
import { X, Download, Printer, Receipt } from 'lucide-react';
import { obtenerPagoPorId } from '../../services/pagosService';
import { generarPDFRecibo } from '../../utils/pagos/reciboPDFGenerator';
import { supabase } from '../../services/supabaseClient'; // ✅ AGREGAR
import Swal from 'sweetalert2';


export default function ReciboModal({ pagoId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [pago, setPago] = useState(null);
    const [firmaBase64, setFirmaBase64] = useState(null); // ✅ NUEVO: Estado para firma


    useEffect(() => {
        if (pagoId) {
            cargarDatos();
        }
    }, [pagoId]);


    const cargarDatos = async () => {
        setLoading(true);
        try {
            const pagoData = await obtenerPagoPorId(pagoId);
            setPago(pagoData);

            // ✅ NUEVO: Cargar firma si existe
            if (pagoData.firma_id) {
                await cargarFirma(pagoData.firma_id);
            }
        } catch (error) {
            console.error('Error al cargar recibo:', error);
        } finally {
            setLoading(false);
        }
    };


    // ✅ NUEVA FUNCIÓN: Cargar firma desde Storage
    const cargarFirma = async (firmaId) => {
        try {
            // 1. Obtener datos de la firma
            const { data: firmaData, error: firmaError } = await supabase
                .from('firmas')
                .select('*')
                .eq('id', firmaId)
                .single();

            if (firmaError || !firmaData || !firmaData.firma_url) {
                console.warn('⚠️ No se encontró firma:', firmaError);
                return;
            }

            // 2. Descargar imagen de firma
            const response = await fetch(firmaData.firma_url);

            if (!response.ok) {
                console.warn('⚠️ No se pudo descargar la firma');
                return;
            }

            const blob = await response.blob();

            // 3. Convertir a Base64
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            setFirmaBase64(base64);
            console.log('✅ Firma cargada exitosamente');

        } catch (error) {
            console.error('❌ Error al cargar firma:', error);
        }
    };


    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(valor || 0);
    };


    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        const fechaSolo = fecha.split('T')[0];
        const [year, month, day] = fechaSolo.split('-');
        return `${day}/${month}/${year}`;
    };


    const handleImprimir = () => {
        window.print();
    };


    const handleDescargarPDF = () => {
        if (pago && pago.pacientes) {
            try {
                // ✅ MODIFICADO: Pasar firma al generador de PDF
                generarPDFRecibo(pago, pago.pacientes, firmaBase64);

                Swal.fire({
                    title: '¡Recibo Descargado!',
                    text: 'El recibo se ha generado correctamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#111827',
                    color: '#F9FAFB'
                });
            } catch (error) {
                console.error('❌ Error al generar PDF:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo generar el recibo: ' + error.message,
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB'
                });
            }
        } else {
            Swal.fire({
                title: 'Datos incompletos',
                text: 'No hay datos del pago o paciente para generar el PDF',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
        }
    };



    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <div className="w-16 h-16 border-4 border-smile_500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-4 font-medium">Cargando recibo...</p>
                </div>
            </div>
        );
    }


    if (!pago) return null;


    const debe = parseFloat(pago.costo) - parseFloat(pago.a_cuenta || 0);


    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-8 py-6 bg-gradient-to-r from-smile_600 to-smile_700 print:hidden">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Receipt className="w-7 h-7" />
                                    Recibo de Pago
                                </h2>
                                <p className="text-smile_100 text-sm mt-1">
                                    Comprobante de pago #{pago.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>


                    {/* Content */}
                    <div className="p-8 overflow-y-auto flex-1" id="recibo-print">
                        {/* Header para impresión */}
                        <div className="hidden print:block mb-6 text-center border-b-2 border-smile_600 pb-4">
                            <h1 className="text-3xl font-bold text-smile_700 mb-2">Cusco Smile</h1>
                            <p className="text-sm text-gray-600">ATENCIÓN ODONTOLÓGICA ESPECIALIZADA</p>
                            <p className="text-lg font-bold mt-3">RECIBO DE PAGO</p>
                        </div>


                        {/* Información del recibo */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                                <p className="text-gray-600">Número de Recibo</p>
                                <p className="font-bold text-lg">{pago.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-600">Fecha</p>
                                <p className="font-bold text-lg">{formatearFecha(pago.fecha)}</p>
                            </div>
                        </div>


                        {/* Datos del paciente */}
                        {pago.pacientes && (
                            <div className="bg-smile_50 rounded-lg p-6 mb-6">
                                <h3 className="font-bold text-smile_700 mb-3">Datos del Paciente</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Nombre completo</p>
                                        <p className="font-semibold">{pago.pacientes.nombres} {pago.pacientes.apellidos}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">DNI</p>
                                        <p className="font-semibold">{pago.pacientes.dni}</p>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Detalle del pago */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4">Detalle del Pago</h3>


                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Tratamiento:</span>
                                    <span className="font-semibold text-right">{pago.tratamiento_realizado}</span>
                                </div>


                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Método de pago:</span>
                                    <span className="font-semibold">{pago.metodo_pago || 'No especificado'}</span>
                                </div>


                                {pago.observaciones && (
                                    <div className="py-2 border-b">
                                        <p className="text-gray-600 mb-1">Observaciones:</p>
                                        <p className="text-sm text-gray-800">{pago.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Montos */}
                        <div className="bg-gradient-to-br from-smile_50 to-smile_100 rounded-lg p-6 mb-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Costo Total:</span>
                                    <span className="text-xl font-bold text-gray-900">{formatearMoneda(pago.costo)}</span>
                                </div>


                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Monto Pagado:</span>
                                    <span className="text-xl font-bold text-green-600">{formatearMoneda(pago.a_cuenta)}</span>
                                </div>


                                <div className="border-t-2 border-smile_300 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-medium">Saldo:</span>
                                        <span className={`text-2xl font-bold ${debe > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatearMoneda(debe)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* ✅ NUEVA SECCIÓN: Firma del Paciente */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4">Firma del Paciente</h3>

                            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                                {firmaBase64 ? (
                                    <div className="text-center">
                                        <img
                                            src={firmaBase64}
                                            alt="Firma del paciente"
                                            className="max-h-20 mx-auto mb-2"
                                        />
                                        <p className="text-xs text-gray-600 italic">
                                            Firmado por: {pago.pacientes?.nombres} {pago.pacientes?.apellidos}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Fecha: {formatearFecha(pago.fecha)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-400 italic">Sin firma registrada</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Footer */}
                        <div className="mt-6 text-center text-sm text-gray-500 italic">
                            <p>Gracias por su confianza - Cusco Smile</p>
                        </div>
                    </div>


                    {/* Botones de acción */}
                    <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3 print:hidden">
                        <button
                            onClick={handleImprimir}
                            className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                        <button
                            onClick={handleDescargarPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Descargar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <X />Cerrar
                        </button>
                    </div>
                </div>
            </div>


            {/* Estilos para impresión */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #recibo-print, #recibo-print * {
                        visibility: visible;
                    }
                    #recibo-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </>
    );
}
