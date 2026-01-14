import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Send, MessageCircle, CheckCircle2, Save, Trash2, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';


export default function NotificacionCitaModal({ open, cita, onClose }) {
    const [mensaje, setMensaje] = useState('');
    const [copiado, setCopiado] = useState(false);


    // ✅ NUEVO 1: Estado para templates
    const [templates, setTemplates] = useState([]);
    const [nombreTemplate, setNombreTemplate] = useState('');
    const [mostrarGuardarTemplate, setMostrarGuardarTemplate] = useState(false);
    const [mostrarTemplates, setMostrarTemplates] = useState(false);


    // ✅ NUEVO 2: Estado para vista previa
    const [mostrarVistaPreviaWA, setMostrarVistaPreviaWA] = useState(false);


    // Cargar templates al abrir
    useEffect(() => {
        if (open) {
            cargarTemplates();
        }
    }, [open]);


    // ✅ NUEVO: Función para cargar templates del localStorage
    const cargarTemplates = () => {
        try {
            const templatesGuardados = localStorage.getItem('notificacion_templates');
            if (templatesGuardados) {
                setTemplates(JSON.parse(templatesGuardados));
            }
        } catch (error) {
            console.error('Error cargando templates:', error);
        }
    };


    // ✅ NUEVO: Función para guardar template
    const guardarTemplate = () => {
        if (!nombreTemplate.trim()) {
            Swal.fire({
                title: 'Nombre requerido',
                text: 'Por favor ingresa un nombre para el template',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }


        if (!mensaje.trim()) {
            Swal.fire({
                title: 'Mensaje vacío',
                text: 'No puedes guardar un template sin mensaje',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }


        const nuevoTemplate = {
            id: Date.now(),
            nombre: nombreTemplate.trim(),
            texto: mensaje,
            fecha_creacion: new Date().toISOString()
        };


        const nuevosTemplates = [...templates, nuevoTemplate];
        localStorage.setItem('notificacion_templates', JSON.stringify(nuevosTemplates));
        setTemplates(nuevosTemplates);
        setNombreTemplate('');
        setMostrarGuardarTemplate(false);


        Swal.fire({
            title: '¡Guardado!',
            text: 'Template guardado exitosamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#111827',
            color: '#F9FAFB'
        });
    };


    // ✅ NUEVO: Función para cargar template
    const cargarTemplate = (template) => {
        setMensaje(template.texto);
        setMostrarTemplates(false);


        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            background: '#1F2937',
            color: '#fff'
        });


        Toast.fire({
            icon: 'success',
            title: `Template "${template.nombre}" cargado`
        });
    };


    // ✅ NUEVO: Función para eliminar template
    const eliminarTemplate = (templateId) => {
        Swal.fire({
            title: '¿Eliminar template?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#111827',
            color: '#F9FAFB'
        }).then((result) => {
            if (result.isConfirmed) {
                const nuevosTemplates = templates.filter(t => t.id !== templateId);
                localStorage.setItem('notificacion_templates', JSON.stringify(nuevosTemplates));
                setTemplates(nuevosTemplates);


                Swal.fire({
                    title: 'Eliminado',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#111827',
                    color: '#F9FAFB'
                });
            }
        });
    };


    // Generar mensaje automático al abrir
    useEffect(() => {
        if (open && cita) {
            const mensajeGenerado = generarMensaje(cita);
            setMensaje(mensajeGenerado);
            setCopiado(false);
            setMostrarGuardarTemplate(false);
            setMostrarTemplates(false);
            setMostrarVistaPreviaWA(false);
        }
    }, [open, cita]);


    const generarMensaje = useCallback((citaData) => {
        if (!citaData) return '';

        const nombrePaciente = citaData.nombre_paciente || 'Paciente';

        // ✅ CORREGIDO 1: Extraer solo la fecha (sin timestamp)
        const fechaSolo = (citaData.fecha || '').split('T')[0]; // Extrae "2025-12-01"
        const [year, month, day] = fechaSolo.split('-');
        const fechaBonita = `${day}/${month}/${year}`;

        // ✅ CORREGIDO 2: Hora sin segundos (09:00 en lugar de 09:00:00)
        const horaInicio = (citaData.hora_inicio || '').substring(0, 5);

        const dentista = citaData.usuarios?.nombre_completo || citaData.dentista?.nombre_completo || 'Doctor';
        const motivo = citaData.motivo || 'Consulta dental';
        const estado = citaData.estado;


        if (estado === 'cancelada') {
            return `Hola *${nombrePaciente}*,\n\nLe informamos que su cita agendada para el *${fechaBonita}* a las *${horaInicio}* ha sido *cancelada*.\n\nMotivo: ${citaData.motivo_cancelacion || 'No especificado'}\n\nPara reagendar, contáctenos.\n\n*Cusco Smile* 🦷`;
        }


        if (estado === 'atendida') {
            return `Hola *${nombrePaciente}*,\n\n¡Gracias por confiar en nosotros! 🎉\n\nEsperamos que su experiencia con el Dr(a). *${dentista}* haya sido excelente.\n\nTratamiento realizado: *${motivo}*\n\nSi tiene alguna duda o molestia, no dude en contactarnos.\n\n*Cusco Smile* - Su sonrisa es nuestra prioridad 🦷✨`;
        }


        return `Hola *${nombrePaciente}*, le saludamos de *Cusco Smile*. 🦷\n\nLe recordamos su cita:\n\n📅 *Fecha:* ${fechaBonita}\n⏰ *Hora:* ${horaInicio}\n👨‍⚕️ *Dr(a):* ${dentista}\n📝 *Tratamiento:* ${motivo}\n\n¡Le esperamos puntualmente! ✨`;
    }, []);


    const copiarAlPortapapeles = async () => {
        try {
            await navigator.clipboard.writeText(mensaje);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);


            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: '#1F2937',
                color: '#fff'
            });


            Toast.fire({
                icon: 'success',
                title: 'Mensaje copiado al portapapeles'
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo copiar el mensaje',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
        }
    };


    // ✅ NUEVO 3: Registrar notificación en base de datos
    const registrarNotificacion = async (celular, via) => {
        try {
            await supabase.from('historial_notificaciones').insert({
                cita_id: cita.id,
                paciente_id: cita.paciente_id,
                mensaje: mensaje,
                enviado_a: celular,
                via: via,
                fecha_envio: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error registrando notificación:', error);
            // No bloqueamos el flujo si falla el registro
        }
    };


    const enviarPorWhatsApp = async () => {
        if (!cita?.pacientes?.celular && !cita?.paciente?.celular) {
            Swal.fire({
                title: 'Sin número',
                text: 'El paciente no tiene un celular registrado',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }


        if (!mensaje.trim()) {
            Swal.fire({
                title: 'Mensaje vacío',
                text: 'Por favor escribe un mensaje antes de enviar',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }


        const celularBruto = cita.pacientes?.celular || cita.paciente?.celular || '';
        const celularLimpio = celularBruto.replace(/\D/g, '');


        if (!celularLimpio || celularLimpio.length < 9) {
            Swal.fire({
                title: 'Número inválido',
                text: 'El número de celular no es válido',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB'
            });
            return;
        }


        // ✅ MODIFICADO: Registrar antes de enviar
        await registrarNotificacion(celularLimpio, 'whatsapp');


        const urlWhatsApp = `https://wa.me/51${celularLimpio}?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');


        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#25D366',
            color: '#fff'
        });


        Toast.fire({
            icon: 'success',
            title: 'Abriendo WhatsApp...',
            text: 'Enviando mensaje al paciente'
        });


        setTimeout(() => {
            onClose();
        }, 1000);
    };


    if (!open || !cita) return null;


    const pacienteCelular = cita.pacientes?.celular || cita.paciente?.celular || 'Sin celular';


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">


                {/* HEADER */}
                <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-6 h-6" />
                        Enviar Notificación
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-green-800 rounded-lg text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>


                {/* BODY */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">


                    {/* Info Paciente */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-bold text-gray-700 mb-2">Datos del Paciente</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">Nombre:</span>
                                <span className="ml-2 font-medium text-gray-900">{cita.nombre_paciente}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Celular:</span>
                                <span className="ml-2 font-medium text-gray-900">{pacienteCelular}</span>
                            </div>
                        </div>
                    </div>


                    {/* ✅ NUEVO: Botones de Templates */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setMostrarTemplates(!mostrarTemplates)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Eye className="w-4 h-4" />
                            {mostrarTemplates ? 'Ocultar Templates' : 'Ver Templates'}
                            {templates.length > 0 && (
                                <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {templates.length}
                                </span>
                            )}
                        </button>


                        <button
                            onClick={() => setMostrarGuardarTemplate(!mostrarGuardarTemplate)}
                            className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Guardar como Template
                        </button>


                        {/* ✅ NUEVO 2: Botón de vista previa WhatsApp */}
                        <button
                            onClick={() => setMostrarVistaPreviaWA(!mostrarVistaPreviaWA)}
                            className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors text-sm font-medium"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {mostrarVistaPreviaWA ? 'Ocultar' : 'Ver'} Vista Previa WA
                        </button>
                    </div>


                    {/* ✅ NUEVO: Panel para guardar template */}
                    {mostrarGuardarTemplate && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Nombre del Template
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ej: Recordatorio Standard"
                                    value={nombreTemplate}
                                    onChange={(e) => setNombreTemplate(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && guardarTemplate()}
                                />
                                <button
                                    onClick={guardarTemplate}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    )}


                    {/* ✅ NUEVO: Lista de templates guardados */}
                    {mostrarTemplates && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-sm font-bold text-gray-700 mb-3">Templates Guardados</p>
                            {templates.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No tienes templates guardados aún
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {templates.map(template => (
                                        <div
                                            key={template.id}
                                            className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <button
                                                        onClick={() => cargarTemplate(template)}
                                                        className="text-left w-full"
                                                    >
                                                        <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                                            {template.nombre}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                                            {template.texto.substring(0, 80)}...
                                                        </p>
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => eliminarTemplate(template.id)}
                                                    className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                                                    title="Eliminar template"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                    {/* Editor de Mensaje */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Mensaje a Enviar
                        </label>
                        <textarea
                            rows="8"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none outline-none text-sm"
                            placeholder="Escribe tu mensaje aquí..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {mensaje.length} caracteres
                        </p>
                    </div>


                    {/* ✅ NUEVO 2: Vista previa estilo WhatsApp */}
                    {mostrarVistaPreviaWA && mensaje && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-sm font-bold text-gray-700 mb-2">Vista Previa WhatsApp</p>
                            <div className="bg-[#e5ddd5] p-4 rounded-lg">
                                <div className="bg-white p-3 rounded-lg shadow-md max-w-md">
                                    <div className="space-y-2">
                                        {mensaje.split('\n').map((linea, index) => (
                                            <p
                                                key={index}
                                                className="text-sm text-gray-800"
                                                style={{
                                                    fontWeight: linea.includes('*') ? 'bold' : 'normal'
                                                }}
                                            >
                                                {linea.replace(/\*/g, '')}
                                            </p>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 text-right mt-2">
                                        {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}


                </div>


                {/* FOOTER */}
                <div className="flex items-center justify-end border-t p-4 bg-gray-50 flex-shrink-0 gap-3">
                    <button
                        type="button"
                        onClick={copiarAlPortapapeles}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    >
                        {copiado ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                        {copiado ? 'Copiado' : 'Copiar'}
                    </button>


                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>


                    <button
                        type="button"
                        onClick={enviarPorWhatsApp}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md transition-all"
                    >
                        <Send className="w-5 h-5" />
                        Enviar WhatsApp
                    </button>
                </div>


            </div>
        </div>
    );
}
