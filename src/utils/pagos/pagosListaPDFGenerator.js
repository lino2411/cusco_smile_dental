import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Color y estilos Cusco Smile
const COLOR_SMILE = [93, 190, 171];

// ✅ NUEVA FUNCIÓN: Formatear fecha sin problemas de timezone
const formatearFechaSinTimezone = (fecha) => {
    if (!fecha) return '-';
    const fechaSolo = fecha.split('T')[0]; // "2025-12-15"
    const [year, month, day] = fechaSolo.split('-');
    return `${day}/${month}/${year}`; // "15/12/2025"
};

export const generarPDFListaPagos = (pagos) => {
    if (!pagos || pagos.length === 0) {
        alert('No hay pagos para exportar');
        return;
    }

    // Landscape para tablas largas
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // ===== HEADER CUSCO SMILE
    doc.setFillColor(...COLOR_SMILE);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Cusco Smile', margin, 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Atención Odontológica Especializada', margin, 22);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DEL PAGOS', margin, 32);

    // Fecha de exportación (derecha)
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const fechaExport = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Exportado: ${fechaExport}`, pageWidth - margin - 2, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Tabla inicia después del header
    const startY = 30;

    // ===== ENCABEZADOS (✅ AGREGADA COLUMNA "Firma")
    const headers = [
        [
            'N°', 'Fecha', 'Paciente', 'DNI',
            'Tratamiento', 'Costo', 'Pagado',
            'Debe', 'Estado', 'Firma', 'Observaciones' // ✅ Agregada "Firma"
        ]
    ];

    // ===== FILAS (✅ AGREGADO CAMPO DE FIRMA)
    const rows = pagos.map((pago, i) => {
        const debe = (parseFloat(pago.costo) || 0) - (parseFloat(pago.a_cuenta) || 0);
        const tieneFirma = pago.firma_id ? 'Sí ✓' : 'No ✗'; // ✅ NUEVO

        return [
            i + 1,
            formatearFechaSinTimezone(pago.fecha),
            `${pago.pacientes?.nombres || '-'} ${pago.pacientes?.apellidos || '-'}`,
            pago.pacientes?.dni || '-',
            pago.tratamiento_realizado || '-',
            pago.costo ? `S/ ${parseFloat(pago.costo).toFixed(2)}` : '-',
            pago.a_cuenta ? `S/ ${parseFloat(pago.a_cuenta).toFixed(2)}` : '-',
            `S/ ${debe.toFixed(2)}`,
            pago.estado === 'pagado'
                ? 'Pagado'
                : pago.estado === 'parcial'
                    ? 'Parcial'
                    : 'Pendiente',
            tieneFirma, // ✅ NUEVO
            pago.observaciones || '-'
        ];
    });

    // ===== autoTable
    autoTable(doc, {
        startY,
        head: headers,
        body: rows,
        theme: 'grid',
        headStyles: {
            fillColor: COLOR_SMILE,
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
        },
        bodyStyles: {
            textColor: [40, 40, 40],
            fontSize: 10,
            valign: 'middle',
        },
        alternateRowStyles: {
            fillColor: [243, 250, 248]
        },
        // ✅ AJUSTADO: Columnas con nueva columna de Firma
        columnStyles: {
            0: { cellWidth: 'auto' },   // N°
            1: { cellWidth: 'auto' },   // Fecha
            2: { cellWidth: 'auto' },   // Paciente
            3: { cellWidth: 'auto' },   // DNI
            4: { cellWidth: 'auto' },   // Tratamiento
            5: { cellWidth: 'auto' },   // Costo
            6: { cellWidth: 'auto' },   // Pagado
            7: { cellWidth: 'auto' },   // Debe
            8: { cellWidth: 'auto' },   // Estado
            9: { cellWidth: 'auto', halign: 'center' },   // Firma
            10: { cellWidth: 'auto' }   // Observaciones
        },

        styles: { font: "helvetica" },
        // ✅ NUEVO: Callback para colorear la columna Firma
        didParseCell: function (data) {
            if (data.column.index === 9 && data.section === 'body') {
                // Colorear texto de firma
                if (data.cell.text[0] === 'Sí ✓') {
                    data.cell.styles.textColor = [34, 197, 94]; // Verde
                    data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.text[0] === 'No ✗') {
                    data.cell.styles.textColor = [239, 68, 68]; // Rojo
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Página ${i} de ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 9,
            { align: 'center' }
        );
        doc.text('Cusco Smile - Gestión de Pagos', margin, doc.internal.pageSize.height - 9);
    }

    // Descarga automática
    const fechaActual = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Lista_Pagos_Cusco_Smile_${fechaActual}.pdf`;
    doc.save(nombreArchivo);
};
