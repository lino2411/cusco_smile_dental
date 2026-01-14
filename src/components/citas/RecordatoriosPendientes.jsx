import { useState, useEffect } from 'react';
import { Bell, Send, Check, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';

export default function RecordatoriosPendientes() {
    const [recordatoriosPendientes, setRecordatoriosPendientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        cargarRecordatoriosPendientes();

        const interval = setInterval(cargarRecordatoriosPendientes, 300000);
        return () => clearInterval(interval);
    }, []);

    const cargarRecordatoriosPendientes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('citas')
                .select(`
                    id,
                    fecha,
                    hora_inicio,
                    nombre_paciente,
                    motivo,
                    paciente_id,
                    pacientes!inner (
                        celular
                    )
                `)
                .eq('recordatorio_pendiente', true)
                .in('estado', ['pendiente', 'confirmada'])
                .order('fecha', { ascending: true })
                .order('hora_inicio', { ascending: true });

            if (error) throw error;

            setRecordatoriosPendientes(data || []);
        } catch (error) {
            console.error('Error cargando recordatorios:', error);
        } finally {
            setLoading(false);
        }
    };

    const enviarTodosLosRecordatorios = async () => {
        if (recordatoriosPendientes.length === 0) return;

        const result = await Swal.fire({
            title: '¿Enviar todos los recordatorios?',
            html: `
                <p>Se abrirán <strong>${recordatoriosPendientes.length}</strong> ventanas de WhatsApp.</p>
                <p class="text-sm text-gray-500 mt-2">Solo presiona Enter en cada una.</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar todos',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#6b7280',
            background: '#111827',
            color: '#F9FAFB'
        });

        if (!result.isConfirmed) return;

        setEnviando(true);

        for (const cita of recordatoriosPendientes) {
            const celular = cita.pacientes?.celular?.replace(/\D/g, '');

            if (!celular || celular.length < 9) {
                console.warn(`Paciente ${cita.nombre_paciente} sin celular válido`);
                continue;
            }

            // Formatear fecha y hora
            const fechaSolo = cita.fecha.split('T')[0];
            const [year, month, day] = fechaSolo.split('-');
            const fechaBonita = `${day}/${month}/${year}`;
            const horaInicio = cita.hora_inicio.substring(0, 5);

            const mensaje = `Hola *${cita.nombre_paciente}*, le saludamos de *Cusco Smile*. 🦷\n\nLe recordamos su cita para mañana:\n\n📅 *Fecha:* ${fechaBonita}\n⏰ *Hora:* ${horaInicio}\n📝 *Tratamiento:* ${cita.motivo}\n\n¡Le esperamos puntualmente! ✨`;

            const urlWhatsApp = `https://wa.me/51${celular}?text=${encodeURIComponent(mensaje)}`;

            window.open(urlWhatsApp, '_blank');

            // Registrar en historial
            await supabase.from('historial_notificaciones').insert({
                cita_id: cita.id,
                paciente_id: cita.paciente_id,
                mensaje: mensaje,
                enviado_a: celular,
                via: 'whatsapp'
            });

            // Marcar como enviado
            await supabase
                .from('citas')
                .update({
                    recordatorio_pendiente: false,
                    recordatorio_enviado_fecha: new Date().toISOString()
                })
                .eq('id', cita.id);

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        setEnviando(false);

        Swal.fire({
            title: '¡Recordatorios enviados!',
            text: `Se abrieron ${recordatoriosPendientes.length} ventanas de WhatsApp`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            background: '#111827',
            color: '#F9FAFB'
        });

        cargarRecordatoriosPendientes();
    };

    const marcarComoEnviado = async (citaId) => {
        try {
            await supabase
                .from('citas')
                .update({
                    recordatorio_pendiente: false,
                    recordatorio_enviado_fecha: new Date().toISOString()
                })
                .eq('id', citaId);

            cargarRecordatoriosPendientes();

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
                title: 'Marcado como enviado'
            });
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-smile_600" />
                <span className="ml-2 text-gray-600">Cargando recordatorios...</span>
            </div>
        );
    }

    if (recordatoriosPendientes.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl shadow-lg overflow-hidden border-2 border-orange-200 mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Bell className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">🔔 Recordatorios Pendientes</h3>
                        <p className="text-white/90 text-sm">{recordatoriosPendientes.length} mensaje{recordatoriosPendientes.length !== 1 ? 's' : ''} por enviar</p>
                    </div>
                </div>
                <button
                    onClick={enviarTodosLosRecordatorios}
                    disabled={enviando}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {enviando ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Enviar Todos
                        </>
                    )}
                </button>
            </div>

            {/* Lista */}
            <div className="divide-y divide-orange-100 max-h-80 overflow-y-auto">
                {recordatoriosPendientes.map((cita) => {
                    const fechaSolo = cita.fecha.split('T')[0];
                    const [year, month, day] = fechaSolo.split('-');
                    const fechaBonita = `${day}/${month}/${year}`;
                    const horaInicio = cita.hora_inicio.substring(0, 5);

                    return (
                        <div key={cita.id} className="p-4 hover:bg-orange-50/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{cita.nombre_paciente}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                        <span>📅 {fechaBonita}</span>
                                        <span>⏰ {horaInicio}</span>
                                        <span className="text-gray-500">📱 {cita.pacientes?.celular || 'Sin celular'}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{cita.motivo}</p>
                                </div>
                                <button
                                    onClick={() => marcarComoEnviado(cita.id)}
                                    className="ml-4 p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                                    title="Marcar como enviado"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
