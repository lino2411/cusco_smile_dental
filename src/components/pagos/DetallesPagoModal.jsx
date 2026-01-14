import { useState, useEffect } from 'react';
import { X, Receipt, User, Calendar, CreditCard, DollarSign, FileText, Download, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { obtenerPagoPorId } from '../../services/pagosService';
import { generarPDFRecibo } from '../../utils/pagos/reciboPDFGenerator';
import { formatearFecha } from '../../utils/fechas';
import SignaturePad from '../common/SignaturePad';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient'; // ✅ AGREGAR ESTA LÍNEA


export default function DetallesPagoModal({ pagoId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [pago, setPago] = useState(null);


    useEffect(() => {
        if (pagoId) {
            cargarDetallePago();
        }
    }, [pagoId]);


    const cargarDetallePago = async () => {
        setLoading(true);
        try {
            const pagoCompleto = await obtenerPagoPorId(pagoId);
            setPago(pagoCompleto);
        } catch (error) {
            console.error('Error al cargar detalle del pago:', error);
        } finally {
            setLoading(false);
        }
    };


    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(valor || 0);
    };


    const getEstadoBadge = () => {
        if (!pago) return null;

        const badges = {
            pendiente: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: AlertCircle,
                label: 'Pendiente',
            },
            parcial: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: Clock,
                label: 'Pago Parcial',
            },
            pagado: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: CheckCircle,
                label: 'Pagado',
            },
        };

        const badge = badges[pago.estado] || badges.pendiente;
        const Icon = badge.icon;

        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${badge.bg}`}>
                <Icon className={`w-5 h-5 ${badge.text}`} />
                <span className={`font-semibold ${badge.text}`}>{badge.label}</span>
            </div>
        );
    };

    // ✅ FUNCIÓN CORREGIDA: Descargar PDF con firma
    const handleDescargarPDF = async () => {
        try {
            // 1️⃣ Consultar el pago CON la firma
            const { data: pagoCompleto, error } = await supabase
                .from('pagos')
                .select(`
                *,
                pacientes (*),
                firmas (*)
            `)
                .eq('id', pago.id)
                .single();

            if (error) {
                console.error('❌ Error al consultar pago:', error);
                throw error;
            }

            // 2️⃣ Obtener la imagen de firma si existe
            let firmaBase64 = null;

            if (pagoCompleto.firmas && pagoCompleto.firmas.firma_url) {
                // ✅ Como es una URL pública, podemos descargarla directamente con fetch
                try {
                    const response = await fetch(pagoCompleto.firmas.firma_url);

                    if (!response.ok) {
                        throw new Error('Error al descargar firma');
                    }

                    const blob = await response.blob();

                    // Convertir Blob a Base64
                    firmaBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });

                } catch (downloadError) {
                    console.warn('No se pudo descargar firma:', downloadError);
                }
            }

            // 3 Generar PDF con todos los datos
            generarPDFRecibo(pagoCompleto, pagoCompleto.pacientes, firmaBase64);

            Swal.fire({
                title: '¡PDF Generado!',
                text: firmaBase64 ? 'Comprobante con firma descargado' : 'Comprobante descargado (sin firma)',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#111827',
                color: '#F9FAFB'
            });

        } catch (error) {
            console.error('❌ Error completo al generar PDF:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo generar el PDF: ' + error.message,
                icon: 'error',
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
                    <p className="text-gray-600 mt-4 font-medium">Cargando detalles...</p>
                </div>
            </div>
        );
    }


    if (!pago) {
        return null;
    }


    const debe = parseFloat(pago.costo) - parseFloat(pago.a_cuenta || 0);
    const porcentajePagado = pago.costo > 0 ? ((parseFloat(pago.a_cuenta) || 0) / parseFloat(pago.costo)) * 100 : 0;


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-smile_500 to-smile_600 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                            <Receipt className="w-8 h-8 text-smile_600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Comprobante de Pago
                            </h2>
                            <p className="text-smile_100 text-sm">
                                Registro N° {pago.id.slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {/* Estado del pago */}
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                        <div className="flex gap-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Estado del Pago</p>
                                {getEstadoBadge()}
                            </div>
                            {/* ✅ Badge de Firmado */}
                            {pago.firma_id && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Documento</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100">
                                        <CheckCircle className="w-5 h-5 text-blue-700" />
                                        <span className="font-semibold text-blue-700">Firmado</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Fecha de Registro</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatearFecha(pago.fecha)}
                            </p>
                        </div>
                    </div>

                    {/* Información del Paciente */}
                    <div className="bg-smile_50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-smile_500 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Datos del Paciente</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Nombre Completo</p>
                                <p className="font-semibold text-gray-900">
                                    {pago.pacientes?.nombres} {pago.pacientes?.apellidos}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">DNI</p>
                                <p className="font-semibold text-gray-900">
                                    {pago.pacientes?.dni || 'No registrado'}
                                </p>
                            </div>
                            {pago.pacientes?.celular && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                                    <p className="font-semibold text-gray-900">
                                        {pago.pacientes.celular}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ Mostrar Firma */}
                    {pago.firma_id && (
                        <div className="bg-blue-50 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Firma del Paciente</h3>
                            </div>
                            <SignaturePad
                                tipoDocumento="pago"
                                documentoId={pago.id}
                                pacienteNombre={`${pago.pacientes?.nombres} ${pago.pacientes?.apellidos}`}
                                pacienteDni={pago.pacientes?.dni}
                                soloLectura={true}
                            />
                        </div>
                    )}

                    {/* Información del Tratamiento */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-smile_500 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Detalle del Tratamiento</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tratamiento Realizado</p>
                                <p className="font-semibold text-gray-900 text-lg">
                                    {pago.tratamiento_realizado}
                                </p>
                            </div>
                            {pago.metodo_pago && (
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Método de pago:</span>
                                    <span className="font-medium text-gray-900">{pago.metodo_pago}</span>
                                </div>
                            )}
                            {pago.observaciones && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-600 mb-1">Observaciones:</p>
                                    <p className="text-gray-800">{pago.observaciones}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resumen Financiero */}
                    <div className="bg-gradient-to-br from-smile_500 to-smile_600 rounded-xl p-6 text-white mb-6">
                        <h3 className="text-lg font-bold mb-4">Resumen Financiero</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-smile_100">Costo Total del Tratamiento</span>
                                <span className="text-2xl font-bold">{formatearMoneda(pago.costo)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-smile_100">Total Pagado</span>
                                <span className="text-2xl font-bold">{formatearMoneda(pago.a_cuenta)}</span>
                            </div>
                            <div className="border-t border-smile_400 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-smile_100 font-medium">Saldo Pendiente</span>
                                    <span className="text-3xl font-bold">{formatearMoneda(debe)}</span>
                                </div>
                            </div>

                            {/* Barra de progreso */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-smile_100 mb-2">
                                    <span>Porcentaje Pagado</span>
                                    <span className="font-bold">{porcentajePagado.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-smile_400 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-white h-4 transition-all duration-500 flex items-center justify-center"
                                        style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                                    >
                                        {porcentajePagado >= 10 && (
                                            <span className="text-xs font-bold text-smile_700">
                                                {porcentajePagado.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historial de Pagos */}
                    {pago.historial_pagos && pago.historial_pagos.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-smile_600" />
                                Historial de Pagos
                            </h3>
                            <div className="space-y-3">
                                {pago.historial_pagos.map((historial, index) => (
                                    <div
                                        key={historial.id}
                                        className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900">
                                                        Pago #{pago.historial_pagos.length - index}
                                                    </span>
                                                    <span className="text-sm px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                        {historial.metodo_pago}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatearFecha(historial.fecha)}
                                                </div>
                                                {historial.observaciones && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {historial.observaciones}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-600">
                                                    {formatearMoneda(historial.monto)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nota informativa */}
                    <div className="mt-6 p-4 bg-smile_50 border border-smile_200 rounded-lg">
                        <p className="text-sm text-smile_800">
                            <strong>Nota:</strong> Este comprobante es un documento informativo interno.
                            Cusco Smile - Atención Odontológica Especializada.
                        </p>
                    </div>
                </div>

                {/* Footer con acciones */}
                <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <p>Generado el {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>

                        {/* ✅ BOTÓN CORREGIDO: Descargar PDF con firma */}
                        <button
                            onClick={handleDescargarPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Descargar PDF
                        </button>

                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-2 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-medium shadow-md"
                        >
                            <X />Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
