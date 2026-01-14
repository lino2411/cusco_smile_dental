import Swal from 'sweetalert2';

// Función para enviar notificación de cita (puedes integrar WhatsApp API, Twilio, EmailJS, etc.)
export async function enviarNotificacionCita(cita) {
    try {
        // Aquí integrarías tu API de WhatsApp/Email/SMS
        // Por ahora, simulamos el envío

        const mensaje = `
      🦷 Recordatorio de Cita - Cusco Smile
      
      Paciente: ${cita.nombre_paciente}
      Fecha: ${cita.fecha}
      Hora: ${cita.hora_inicio}
      Motivo: ${cita.motivo}
      
      ¡Te esperamos!
    `;

        // Simulación de envío (reemplazar con llamada real a API)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Ejemplo con WhatsApp (usando API de WhatsApp Business)
        // const response = await fetch('TU_API_WHATSAPP', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     to: cita.telefono_paciente,
        //     message: mensaje
        //   })
        // });

        Swal.fire({
            title: '¡Notificación enviada!',
            text: 'Se envió la confirmación al paciente correctamente',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 2000,
            showConfirmButton: false
        });

        return true;
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo enviar la notificación',
            icon: 'error',
            background: '#111827',
            color: '#F9FAFB'
        });
        return false;
    }
}

// Función para enviar recordatorio automático (programable)
export async function enviarRecordatorioCita(cita) {
    const mensaje = `🔔 Recordatorio: Tienes una cita mañana a las ${cita.hora_inicio}`;
    // Lógica similar a enviarNotificacionCita
}
