import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Clock, User, Stethoscope, FileText, CheckCircle2, AlertCircle, Phone, Mail, RotateCcw, Pencil, Trash2, Ban, Check, BookOpen } from 'lucide-react';


export default function CitaDetalleModal({
    open,
    cita,
    onClose,
    onEditar,
    onConfirmar,
    onCancelar,
    onReprogramar,
    onEnviarRecordatorio,
    onVerHistoria
}) {
    const [isAnimating, setIsAnimating] = useState(false);
    const modalRef = useRef(null);

    // Función para cerrar con animación (useCallback para evitar re-creaciones)
    const handleClose = useCallback(() => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 200);
    }, [onClose]);

    // Iniciar animación al abrir
    useEffect(() => {
        if (open) {
            setIsAnimating(true);
        }
    }, [open]);

    // Focus automático (accesibilidad)
    useEffect(() => {
        if (open && modalRef.current) {
            const firstButton = modalRef.current.querySelector('button');
            firstButton?.focus();
        }
    }, [open]);

    // Cerrar con tecla Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && open) {
                handleClose();
            }
        };
        if (open) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open, handleClose]);

    if (!open || !cita) return null;


    // ==========================================
    // LÓGICA DE ESTADOS
    // ==========================================
    const esAtendida = cita.estado === 'atendida';
    const esCancelada = cita.estado === 'cancelada';
    const esFinalizada = esAtendida || esCancelada;


    // ==========================================
    // FUNCIONES DE FORMATO
    // ==========================================
    const formatearFechaLarga = (fechaStr) => {
        if (!fechaStr) return '-';
        const [year, month, day] = fechaStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-PE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };


    const formatearHora12 = (horaStr) => {
        if (!horaStr) return '-';
        try {
            const [h, m] = horaStr.split(':');
            const horaNum = parseInt(h, 10);
            const sufijo = horaNum >= 12 ? 'pm' : 'am';
            const hora12 = ((horaNum + 11) % 12 + 1);
            return `${hora12}:${m} ${sufijo}`;
        } catch { return horaStr; }
    };


    // Colores badge
    const getEstadoBadge = (estado) => {
        const estilos = {
            pendiente: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            confirmada: 'bg-green-100 text-green-800 border-green-200',
            en_consulta: 'bg-purple-100 text-purple-800 border-purple-200',
            atendida: 'bg-blue-100 text-blue-800 border-blue-200',
            cancelada: 'bg-red-100 text-red-800 border-red-200',
            reprogramada: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
        return estilos[estado] || 'bg-gray-100 text-gray-800';
    };


    // Header dinámico según estado
    const getHeaderColor = () => {
        if (esAtendida) return 'bg-blue-600';
        if (esCancelada) return 'bg-red-600';
        return 'bg-gradient-to-r from-smile_600 to-smile_700';
    };


    // Datos seguros
    const nombreDentista = cita.dentista?.nombre_completo || cita.usuarios?.nombre_completo || 'No asignado';
    const pacienteDNI = cita.pacientes?.dni || cita.paciente?.dni || '-';
    const pacienteCelular = cita.pacientes?.celular || cita.paciente?.celular || '-';


    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
            <div
                ref={modalRef}
                role="dialog"
                aria-labelledby="modal-title"
                aria-modal="true"
                className={`bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-transform duration-200 ${isAnimating ? 'scale-100' : 'scale-95'}`}
            >

                {/* HEADER DINÁMICO */}
                <div className={`relative p-6 text-white transition-colors duration-300 ${getHeaderColor()}`}>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1 hover:bg-smile_800 rounded-full transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>


                    <div className="flex items-center gap-3 mb-2">
                        {esAtendida ? <Check className="w-6 h-6" /> :
                            esCancelada ? <Ban className="w-6 h-6" /> :
                                <Calendar className="w-6 h-6 opacity-80" />}


                        <h2 id="modal-title" className="text-xl font-bold">
                            {esAtendida ? 'Atención Finalizada' :
                                esCancelada ? 'Cita Cancelada' :
                                    'Detalle de Cita'}
                        </h2>
                    </div>


                    <p className="text-white/90 flex items-center gap-2 text-sm font-medium ml-9">
                        <Clock className="w-4 h-4" />
                        {formatearFechaLarga(cita.fecha)} • {formatearHora12(cita.hora_inicio)} - {formatearHora12(cita.hora_fin)}
                    </p>
                </div>


                {/* BODY CON SCROLL */}
                <div className="p-6 space-y-6 overflow-y-auto">


                    {/* Estado */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <span className="text-sm text-gray-500 font-medium">Estado actual</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getEstadoBadge(cita.estado)}`}>
                            {cita.estado?.replace('_', ' ')}
                        </span>
                    </div>


                    {/* DATOS PRINCIPALES */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Paciente */}
                        <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Paciente</p>
                                <p className="text-gray-900 font-semibold text-lg">{cita.nombre_paciente}</p>
                                <div className="flex gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {pacienteDNI}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {pacienteCelular}</span>
                                </div>


                                <button
                                    onClick={() => { handleClose(); onVerHistoria(cita); }}
                                    className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors w-fit"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Ver Historia Clínica
                                </button>
                            </div>
                        </div>


                        {/* Dentista */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Dentista</p>
                                <p className="text-gray-900 font-medium">{nombreDentista}</p>
                            </div>
                        </div>


                        {/* Motivo */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Motivo</p>
                                <p className="text-gray-900">{cita.motivo}</p>
                            </div>
                        </div>


                        {/* Notas */}
                        {cita.notas && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-2">
                                <p className="text-xs text-yellow-700 font-bold mb-1">Notas adicionales:</p>
                                <p className="text-sm text-yellow-800 italic">"{cita.notas}"</p>
                            </div>
                        )}


                        {/* Motivo Cancelación */}
                        {cita.motivo_cancelacion && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
                                <p className="text-xs text-red-600 font-bold mb-1">Motivo de cancelación:</p>
                                <p className="text-sm text-red-800">"{cita.motivo_cancelacion}"</p>
                            </div>
                        )}
                    </div>


                    {/* --- ZONA DE MENSAJES FINALES --- */}
                    {esFinalizada ? (
                        <div className={`text-center p-5 rounded-xl border-2 border-dashed ${esAtendida ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
                            }`}>
                            {esAtendida ? (
                                <>
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <p className="text-blue-900 font-bold text-lg">¡Paciente Atendido!</p>
                                    <p className="text-blue-700 text-sm mt-1">
                                        Gracias por confiar en nosotros.<br />Fue un placer atenderle.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Ban className="w-6 h-6" />
                                    </div>
                                    <p className="text-red-900 font-bold text-lg">Cita Cancelada</p>
                                    <p className="text-red-700 text-sm mt-1">
                                        Esta cita ha finalizado sin atención.<br />Para una nueva consulta, agende otra cita.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        /* --- BOTONES DE ACCIÓN (SOLO SI NO ESTÁ FINALIZADA) --- */
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                            {/* Editar */}
                            <button
                                onClick={() => { onEditar(cita); handleClose(); }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                            >
                                <Pencil className="w-4 h-4" /> Editar
                            </button>


                            {/* Reprogramar */}
                            <button
                                onClick={() => { onReprogramar(cita); handleClose(); }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium text-sm"
                            >
                                <RotateCcw className="w-4 h-4" /> Reprogramar
                            </button>


                            {/* Confirmar (Solo pendiente) */}
                            {cita.estado === 'pendiente' && (
                                <button
                                    onClick={() => { onConfirmar(cita.id); handleClose(); }}
                                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-md"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Confirmar Asistencia
                                </button>
                            )}


                            {/* Cancelar */}
                            <button
                                onClick={() => { onCancelar(cita.id); handleClose(); }}
                                className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                            >
                                <Trash2 className="w-4 h-4" /> Cancelar Cita
                            </button>
                        </div>
                    )}
                </div>


                {/* FOOTER */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                    <button
                        onClick={() => onEnviarRecordatorio(cita)}
                        className="text-smile_600 hover:text-smile_700 text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-smile_50 transition-colors"
                        title="Enviar comprobante o recordatorio"
                    >
                        <Mail className="w-4 h-4" /> Notificar
                    </button>


                    <button
                        onClick={handleClose}
                        className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-shadow shadow-md active:scale-[0.98]"
                    >
                        Cerrar
                    </button>
                </div>


            </div>
        </div>
    );
}
