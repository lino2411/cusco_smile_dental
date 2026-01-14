import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ Importación corregida para evitar el error
import Swal from 'sweetalert2';

export const generarPDFCitas = (citas, titulo = 'Agenda de Citas', filtros = {}) => {
    if (!citas || citas.length === 0) {
        Swal.fire({
            title: 'Sin datos',
            text: 'No hay citas para exportar en este rango.',
            icon: 'info',
            background: '#111827',
            color: '#F9FAFB'
        });
        return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 20;

    // ===== HEADER CON COLORES CUSCO SMILE =====
    doc.setFillColor(93, 190, 171); // Color principal (Verde Agua)
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Título principal
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Cusco Smile', margin, 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Atención Odontológica Especializada', margin, 24);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, margin, 32);

    // Fecha de impresión
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fechaImpresion = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generado: ${fechaImpresion}`, pageWidth - margin - 50, 32);

    currentY = 50;

    // ===== INFORMACIÓN DEL RANGO (SI APLICA) =====
    if (filtros.inicio || filtros.fin) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');

        doc.setFontSize(10);
        doc.setTextColor(93, 190, 171);
        doc.setFont('helvetica', 'bold');

        const inicio = filtros.inicio ? filtros.inicio.split('-').reverse().join('/') : 'Inicio';
        const fin = filtros.fin ? filtros.fin.split('-').reverse().join('/') : 'Fin';

        doc.text(`Período del reporte: ${inicio} al ${fin}`, margin + 3, currentY + 7);

        currentY += 15;
    }

    // ===== RESUMEN DE CITAS =====
    const resumen = calcularResumen(citas);
    doc.setFillColor(240, 248, 255); // Azul muy claro
    doc.rect(margin, currentY, pageWidth - 2 * margin, 20, 'F');

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Primera línea de resumen
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${resumen.total}`, margin + 5, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105); // Verde
    doc.text(`Confirmadas: ${resumen.confirmadas}`, margin + 35, currentY + 8);

    doc.setTextColor(8, 145, 178); // Cyan
    doc.text(`Pendientes: ${resumen.pendientes}`, margin + 80, currentY + 8);

    doc.setTextColor(37, 99, 235); // Azul
    doc.text(`Atendidas: ${resumen.atendidas}`, margin + 125, currentY + 8);

    // Segunda línea
    doc.setTextColor(220, 38, 38); // Rojo
    doc.text(`Canceladas: ${resumen.canceladas}`, margin + 5, currentY + 16);

    doc.setTextColor(217, 119, 6); // Amarillo oscuro
    doc.text(`Reprogramadas: ${resumen.reprogramadas}`, margin + 50, currentY + 16);

    currentY += 28;

    // ===== TABLA DE CITAS =====
    const tableData = citas.map((cita, index) => {
        // 1. Formateo seguro de fecha
        const fecha = cita.fecha ? String(cita.fecha).split('T')[0].split('-').reverse().join('-') : '-';

        // 2. Formateo seguro de hora (HH:MM)
        const horaInicio = cita.hora_inicio ? cita.hora_inicio.slice(0, 5) : '--:--';
        const horaFin = cita.hora_fin ? cita.hora_fin.slice(0, 5) : '--:--';

        // 3. Obtención segura del dentista (igual que en Excel)
        const dentista = cita.dentista?.nombre_completo || cita.usuarios?.nombre_completo || 'No asignado';

        return [
            index + 1,
            cita.nombre_paciente || 'Sin nombre',
            cita.motivo || '-',
            fecha,
            `${horaInicio} - ${horaFin}`,
            dentista,
            formatEstado(cita.estado)
        ];
    });

    // ✅ USO CORRECTO DE AUTOTABLE (Función importada, no método de doc)
    autoTable(doc, {
        head: [['N°', 'Paciente', 'Motivo', 'Fecha', 'Horario', 'Dentista', 'Estado']],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        margin: { top: 20, right: margin, bottom: 20, left: margin },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            valign: 'middle',
            overflow: 'linebreak',
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [93, 190, 171], // Verde corporativo
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 }, // N°
            3: { halign: 'center', cellWidth: 22 }, // Fecha
            4: { halign: 'center', cellWidth: 24 }, // Hora
            6: { halign: 'center', cellWidth: 22, fontStyle: 'bold' }  // Estado
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251] // Gris muy suave alternado
        },
        didParseCell: (data) => {
            // Colores condicionales para la columna Estado (índice 6)
            if (data.section === 'body' && data.column.index === 6) {
                const estado = data.cell.raw;
                if (estado === 'Confirmada') data.cell.styles.textColor = [5, 150, 105]; // Verde
                else if (estado === 'Cancelada') data.cell.styles.textColor = [220, 38, 38]; // Rojo
                else if (estado === 'Atendida') data.cell.styles.textColor = [37, 99, 235]; // Azul
                else if (estado === 'Pendiente') data.cell.styles.textColor = [8, 145, 178]; // Cyan
            }
        },
        didDrawPage: (data) => {
            // Footer con número de página
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Página ${data.pageNumber} de ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
            doc.text('Generado por Sistema Cusco Smile', margin, doc.internal.pageSize.height - 10);
        }
    });

    // ===== DESCARGAR PDF =====
    const fechaArchivo = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Citas_Agenda_${fechaArchivo}.pdf`;
    doc.save(nombreArchivo);

    // ✅ ALERTA DE ÉXITO
    Swal.fire({
        title: '¡PDF Generado!',
        text: 'El reporte de citas se ha descargado correctamente.',
        icon: 'success',
        background: '#111827',
        color: '#F9FAFB',
        timer: 2000,
        showConfirmButton: false
    });
};

// ===== FUNCIONES AUXILIARES =====

function calcularResumen(citas) {
    return {
        total: citas.length,
        confirmadas: citas.filter(c => c.estado === 'confirmada').length,
        pendientes: citas.filter(c => c.estado === 'pendiente').length,
        atendidas: citas.filter(c => c.estado === 'atendida').length, // Agregado atendidas
        reprogramadas: citas.filter(c => c.estado === 'reprogramada').length,
        canceladas: citas.filter(c => c.estado === 'cancelada').length
    };
}

function formatEstado(estado) {
    if (!estado) return '—';
    const estadoMap = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'en_consulta': 'En Consulta',
        'atendida': 'Atendida',
        'cancelada': 'Cancelada',
        'reprogramada': 'Reprogramada'
    };
    // Normalizamos a minúsculas para evitar errores de mayúsculas/minúsculas en BD
    return estadoMap[estado.toLowerCase()] || estado.charAt(0).toUpperCase() + estado.slice(1);
}