import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colores Cusco Smile
const COLOR_SMILE = [93, 190, 171];
const COLOR_DARK = [17, 24, 39];

/**
 * Función auxiliar para formatear fecha sin problema de timezone
 */
function formatearFechaSinTimezone(fechaString) {
    if (!fechaString) return '-';
    const [year, month, day] = fechaString.split('T')[0].split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return fecha.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Genera PDF de un control individual de ortodoncia
 */
export function generarPDFControlOrtodoncia(control, paciente, firmaBase64 = null) {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPos = 20;

        // ========================================
        // HEADER - Logo y título
        // ========================================
        doc.setFillColor(...COLOR_SMILE);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('CUSCO SMILE DENTAL', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Atención Odontológica Especializada', pageWidth / 2, 22, { align: 'center' });
        doc.text('Control de Ortodoncia', pageWidth / 2, 28, { align: 'center' });

        yPos = 45;

        // ========================================
        // DATOS DEL PACIENTE
        // ========================================
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos, pageWidth - 30, 30, 'F');

        doc.setTextColor(...COLOR_DARK);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL PACIENTE', 20, yPos + 8);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Paciente: ${paciente.nombres} ${paciente.apellidos}`, 20, yPos + 16);
        doc.text(`DNI: ${paciente.dni}`, 20, yPos + 23);
        doc.text(`Fecha: ${formatearFechaSinTimezone(control.fecha)}`, pageWidth - 70, yPos + 16);

        yPos += 40;

        // ========================================
        // DETALLES DEL CONTROL
        // ========================================
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL CONTROL', 20, yPos);
        yPos += 8;

        // Tabla de detalles
        autoTable(doc, {
            startY: yPos,
            head: [['Campo', 'Detalle']],
            body: [
                ['Fecha', formatearFechaSinTimezone(control.fecha)],
                ['Tratamiento Realizado', control.tratamiento_realizado || '-'],
                ['Cuota', control.cuota ? `S/ ${Number(control.cuota).toFixed(2)}` : '-'],
            ],
            theme: 'grid',
            headStyles: {
                fillColor: COLOR_SMILE,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 9,
            },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 'auto' },
            },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ========================================
        // FIRMA DEL PACIENTE
        // ========================================
        if (firmaBase64) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('FIRMA DEL PACIENTE', 20, yPos);
            yPos += 8;

            // Contenedor de firma
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(20, yPos, 80, 30);

            // Agregar imagen de firma
            try {
                doc.addImage(firmaBase64, 'PNG', 22, yPos + 2, 76, 26);
            } catch (error) {
                console.error('Error agregando firma al PDF:', error);
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text('Error al cargar firma', 60, yPos + 15, { align: 'center' });
            }

            yPos += 35;

            // Nombre del paciente debajo de la firma
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.line(20, yPos, 100, yPos);
            doc.setFontSize(9);
            doc.setTextColor(...COLOR_DARK);
            doc.text(`${paciente.nombres} ${paciente.apellidos}`, 60, yPos + 5, { align: 'center' });
            doc.text(`DNI: ${paciente.dni}`, 60, yPos + 10, { align: 'center' });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('Sin firma registrada', 20, yPos);
            yPos += 10;
        }

        // ========================================
        // FOOTER
        // ========================================
        const footerY = doc.internal.pageSize.height - 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Cusco Smile Dental - Sistema de Gestión Odontológica', pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, footerY + 5, { align: 'center' });

        // ========================================
        // DESCARGAR
        // ========================================
        const nombreArchivo = `Control_Ortodoncia_${paciente.apellidos}_${formatearFechaSinTimezone(control.fecha).replace(/\s/g, '_')}.pdf`;
        doc.save(nombreArchivo);

    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        throw error;
    }
}
