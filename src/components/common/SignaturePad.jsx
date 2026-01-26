import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Save, RotateCcw, Trash2, Check, Pen } from 'lucide-react';
import Swal from 'sweetalert2';
import { guardarFirma, obtenerFirmaPorDocumento, eliminarFirma } from '../../services/firmas/firmasService';

/**
 * Componente de Firma Digital Reutilizable
 * 
 * @param {string} tipoDocumento - Tipo: 'pago', 'ortodoncia', 'consentimiento', etc.
 * @param {string} documentoId - ID del documento relacionado
 * @param {string} pacienteNombre - Nombre completo del paciente
 * @param {string} pacienteDni - DNI del paciente (opcional)
 * @param {function} onFirmaGuardada - Callback cuando se guarda la firma
 * @param {boolean} soloLectura - Si es true, solo muestra la firma guardada
 */
export default function SignaturePad({
    tipoDocumento,
    documentoId,
    pacienteNombre,
    pacienteDni = null,
    onFirmaGuardada = null,
    soloLectura = false
}) {
    const sigCanvas = useRef(null);
    const [firmando, setFirmando] = useState(false);
    const [firmaGuardada, setFirmaGuardada] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);

    // Cargar firma existente al montar
    useEffect(() => {
        if (documentoId) {
            cargarFirmaExistente();
        } else {
            setCargando(false);
        }
    }, [documentoId, tipoDocumento]);

    const cargarFirmaExistente = async () => {
        try {
            setCargando(true);
            const firma = await obtenerFirmaPorDocumento(tipoDocumento, documentoId);
            if (firma) {
                setFirmaGuardada(firma);
            }
        } catch (error) {
            console.error('Error cargando firma:', error);
        } finally {
            setCargando(false);
        }
    };

    const limpiar = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    const guardar = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            Swal.fire({
                title: 'Firma vacía',
                text: 'Por favor, firme antes de guardar',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }

        if (!pacienteNombre) {
            Swal.fire({
                title: 'Error',
                text: 'Nombre del paciente requerido',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }

        try {
            setGuardando(true);

            // Obtener firma como base64
            const firmaBase64 = sigCanvas.current.toDataURL('image/png');

            // Guardar en Supabase
            const firmaData = await guardarFirma(
                firmaBase64,
                tipoDocumento,
                documentoId,
                pacienteNombre,
                pacienteDni
            );

            setFirmaGuardada(firmaData);
            setFirmando(false);

            Swal.fire({
                title: '¡Firma guardada!',
                text: 'La firma se ha registrado correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#111827',
                color: '#F9FAFB'
            });

            // Callback
            if (onFirmaGuardada) {
                onFirmaGuardada(firmaData);
            }

        } catch (error) {
            console.error('Error guardando firma:', error);
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async () => {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar firma?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            background: '#111827',
            color: '#F9FAFB'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            setGuardando(true);
            await eliminarFirma(firmaGuardada.id, firmaGuardada.firma_url);
            setFirmaGuardada(null);
            setFirmando(true);

            // ✅ NOTIFICAR al padre que se eliminó la firma
            if (onFirmaGuardada) {
                onFirmaGuardada(null);
            }

            Swal.fire({
                title: 'Eliminada',
                text: 'La firma ha sido eliminada',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#111827',
                color: '#F9FAFB'
            });

        } catch (error) {
            console.error('Error eliminando firma:', error);
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-smile_600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cargando firma...</p>
            </div>
        );
    }

    // Vista de solo lectura (firma ya guardada)
    if (soloLectura && firmaGuardada) {
        return (
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">Firmado por: {firmaGuardada.firmado_por_nombre}</span>
                </div>
                <img
                    src={firmaGuardada.firma_url}
                    alt="Firma"
                    className="max-h-32 border border-gray-200 rounded bg-white p-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Fecha: {new Date(firmaGuardada.fecha_firma).toLocaleString('es-PE')}
                </p>
            </div>
        );
    }

    // Vista con firma ya guardada (editable)
    if (firmaGuardada && !firmando) {
        return (
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">Firmado por: {firmaGuardada.firmado_por_nombre}</span>
                    </div>
                    {!soloLectura && (
                        <button
                            onClick={eliminar}
                            disabled={guardando}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </button>
                    )}
                </div>
                <img
                    src={firmaGuardada.firma_url}
                    alt="Firma"
                    className="max-h-32 border border-gray-200 rounded bg-white p-2 w-full object-contain"
                />
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                    <span>Fecha: {new Date(firmaGuardada.fecha_firma).toLocaleString('es-PE')}</span>
                    {firmaGuardada.firmado_por_dni && (
                        <span>DNI: {firmaGuardada.firmado_por_dni}</span>
                    )}
                </div>
            </div>
        );
    }

    // Vista para firmar
    return (
        <div className="border-2 border-dashed border-smile_300 rounded-lg p-4 bg-smile_50/30">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Pen className="w-5 h-5 text-smile_600" />
                    <span className="font-semibold text-gray-700">Firma del Paciente</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={limpiar}
                        disabled={guardando}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Limpiar
                    </button>
                    <button
                        onClick={guardar}
                        disabled={guardando}
                        className="flex items-center gap-1 px-3 py-1.5 bg-smile_600 hover:bg-smile_700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {guardando ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        className: 'w-full h-40 cursor-crosshair',
                        style: { touchAction: 'none' }
                    }}
                    backgroundColor="white"
                    penColor="black"
                />
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Firme con el mouse o con el dedo en dispositivos táctiles
            </p>
        </div>
    );
}
