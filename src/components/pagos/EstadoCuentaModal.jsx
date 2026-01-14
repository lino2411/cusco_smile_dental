import { useState, useEffect } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { obtenerPagosPorPaciente } from '../../services/pagosService';
import { generarPDFEstadoCuenta } from '../../utils/pagos/reciboPDFGenerator';
import { supabase } from '../../services/supabaseClient'; // ✅ AGREGAR


export default function EstadoCuentaModal({ pacienteId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [paciente, setPaciente] = useState(null);
    const [pagos, setPagos] = useState([]);
    const [firmas, setFirmas] = useState({}); // ✅ NUEVO: Estado para almacenar firmas


    useEffect(() => {
        if (pacienteId) {
            cargarDatos();
        }
    }, [pacienteId]);


    const cargarDatos = async () => {
        setLoading(true);
        try {
            // 1️⃣ Obtener pagos con firmas
            const pagosData = await obtenerPagosPorPaciente(pacienteId);

            if (pagosData.length > 0 && pagosData[0].pacientes) {
                setPaciente(pagosData[0].pacientes);
            }

            setPagos(pagosData);

            // 2️⃣ ✅ NUEVO: Cargar firmas de cada pago
            await cargarFirmas(pagosData);

        } catch (error) {
            console.error('Error al cargar estado de cuenta:', error);
        } finally {
            setLoading(false);
        }
    };


    // ✅ NUEVA FUNCIÓN: Cargar firmas desde Storage
    const cargarFirmas = async (pagosData) => {
        const firmasMap = {};

        for (const pago of pagosData) {
            if (pago.firma_id) {
                try {
                    // Consultar datos de la firma
                    const { data: firmaData, error: firmaError } = await supabase
                        .from('firmas')
                        .select('*')
                        .eq('id', pago.firma_id)
                        .single();

                    if (!firmaError && firmaData && firmaData.firma_url) {
                        // Descargar imagen de firma
                        const response = await fetch(firmaData.firma_url);

                        if (response.ok) {
                            const blob = await response.blob();

                            // Convertir a Base64
                            const firmaBase64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });

                            firmasMap[pago.id] = firmaBase64;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ No se pudo cargar firma del pago ${pago.id}:`, error);
                }
            }
        }

        setFirmas(firmasMap);
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


    const calcularTotales = () => {
        const totalCosto = pagos.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0);
        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.a_cuenta || 0), 0);
        const totalDebe = totalCosto - totalPagado;

        return { totalCosto, totalPagado, totalDebe };
    };


    const handleImprimir = () => {
        window.print();
    };


    const handleDescargarPDF = async () => {
        if (paciente && pagos.length > 0) {
            try {
                // ✅ Pasar las firmas al generador de PDF
                await generarPDFEstadoCuenta(paciente, pagos, firmas);

                Swal.fire({
                    title: '¡PDF Generado!',
                    text: 'El estado de cuenta se ha descargado correctamente',
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
                    text: 'No se pudo generar el PDF: ' + error.message,
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB'
                });
            }
        } else {
            Swal.fire({
                title: 'Datos incompletos',
                text: 'No hay datos suficientes para generar el PDF',
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
                    <p className="text-gray-600 mt-4 font-medium">Cargando estado de cuenta...</p>
                </div>
            </div>
        );
    }


    const { totalCosto, totalPagado, totalDebe } = calcularTotales();


    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-8 py-6 bg-gradient-to-r from-smile_600 to-smile_700 border-b border-gray-100 print:hidden">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <FileText className="w-7 h-7" />
                                    Estado de Cuenta
                                </h2>
                                <p className="text-smile_100 text-sm mt-1">
                                    Historial completo de pagos del paciente
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
                    <div className="flex-1 overflow-y-auto px-8 py-6" id="estado-cuenta-print">
                        {/* Logo y título (para impresión) */}
                        <div className="hidden print:block mb-6 text-center border-b-2 border-gray-800 pb-4">
                            <h1 className="text-2xl font-bold mb-2">Cusco Smile</h1>
                            <p className="text-sm">ATENCIÓN ODONTOLÓGICA ESPECIALIZADA</p>
                        </div>


                        {/* Información del paciente */}
                        {paciente && (
                            <div className="mb-6 print:mb-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-bold">Paciente:</span> {paciente.nombres} {paciente.apellidos}
                                    </div>
                                    <div>
                                        <span className="font-bold">DNI:</span> {paciente.dni}
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Tabla de pagos */}
                        <div className="border-2 border-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 border-b-2 border-gray-800">
                                        <th className="border-r border-gray-800 px-4 py-3 text-center text-sm font-bold uppercase">Fecha</th>
                                        <th className="border-r border-gray-800 px-4 py-3 text-center text-sm font-bold uppercase">Tratamiento Realizado</th>
                                        <th className="border-r border-gray-800 px-4 py-3 text-center text-sm font-bold uppercase">Costo</th>
                                        <th className="border-r border-gray-800 px-4 py-3 text-center text-sm font-bold uppercase">A Cuenta</th>
                                        <th className="border-r border-gray-800 px-4 py-3 text-center text-sm font-bold uppercase">Debe</th>
                                        <th className="border-r border-gray-800 px-4 py-3 text-center text-sm font-bold uppercase">Saldo</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold uppercase">Firma Paciente</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagos.map((pago) => {
                                        const debe = parseFloat(pago.costo) - parseFloat(pago.a_cuenta || 0);

                                        return (
                                            <tr key={pago.id} className="border-b border-gray-800">
                                                <td className="border-r border-gray-800 px-4 py-3 text-center text-sm">
                                                    {formatearFecha(pago.fecha)}
                                                </td>
                                                <td className="border-r border-gray-800 px-4 py-3 text-sm">
                                                    {pago.tratamiento_realizado}
                                                </td>
                                                <td className="border-r border-gray-800 px-4 py-3 text-center text-sm font-medium">
                                                    {formatearMoneda(pago.costo)}
                                                </td>
                                                <td className="border-r border-gray-800 px-4 py-3 text-center text-sm font-medium text-green-700">
                                                    {formatearMoneda(pago.a_cuenta)}
                                                </td>
                                                <td className="border-r border-gray-800 px-4 py-3 text-center text-sm font-medium text-red-700">
                                                    {formatearMoneda(debe)}
                                                </td>
                                                <td className="border-r border-gray-800 px-4 py-3 text-center text-sm">
                                                    {formatearMoneda(pago.saldo || 0)}
                                                </td>
                                                {/* ✅ MODIFICADO: Mostrar firma si existe */}
                                                <td className="px-4 py-3 text-center">
                                                    {firmas[pago.id] ? (
                                                        <img
                                                            src={firmas[pago.id]}
                                                            alt="Firma del paciente"
                                                            className="h-12 max-w-[120px] mx-auto object-contain"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Sin firma</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}


                                    {/* Filas vacías */}
                                    {Array.from({ length: Math.max(0, 10 - pagos.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="border-b border-gray-800">
                                            <td className="border-r border-gray-800 px-4 py-3 h-12">&nbsp;</td>
                                            <td className="border-r border-gray-800 px-4 py-3">&nbsp;</td>
                                            <td className="border-r border-gray-800 px-4 py-3">&nbsp;</td>
                                            <td className="border-r border-gray-800 px-4 py-3">&nbsp;</td>
                                            <td className="border-r border-gray-800 px-4 py-3">&nbsp;</td>
                                            <td className="border-r border-gray-800 px-4 py-3">&nbsp;</td>
                                            <td className="px-4 py-3">&nbsp;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>


                        {/* Totales */}
                        <div className="mt-6 bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Tratamientos</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatearMoneda(totalCosto)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Pagado</p>
                                    <p className="text-2xl font-bold text-green-600">{formatearMoneda(totalPagado)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Debe</p>
                                    <p className="text-2xl font-bold text-red-600">{formatearMoneda(totalDebe)}</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-between items-center print:hidden">
                        <div className="text-sm text-gray-600">
                            <p>Total de registros: {pagos.length}</p>
                        </div>
                        <div className="flex gap-3">
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
                                className="flex gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                            >
                                <X />Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Estilos para impresión */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #estado-cuenta-print, #estado-cuenta-print * {
                        visibility: visible;
                    }
                    #estado-cuenta-print {
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
