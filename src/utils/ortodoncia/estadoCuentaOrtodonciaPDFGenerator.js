import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLOR_SMILE = [93, 190, 171];
const COLOR_DARK = [17, 24, 39];

function formatearFechaSinTimezone(fechaString) {
    if (!fechaString) return '-';
    const [year, month, day] = fechaString.split('T')[0].split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export async function generarPDFEstadoCuentaOrtodoncia(controles, paciente, firmasBase64 = {}) {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        let yPos = 20;

        // ==========================================
        // HEADER CON DISEÑO PROFESIONAL
        // ==========================================

        // Fondo verde Smile para header
        doc.setFillColor(...COLOR_SMILE);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Título principal
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Cusco Smile', pageWidth / 2, 12, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('ATENCIÓN ODONTOLÓGICA ESPECIALIZADA', pageWidth / 2, 19, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text('ESTADO DE CUENTA - ORTODONCIA', pageWidth / 2, 28, { align: 'center' });

        yPos = 45;

        // ==========================================
        // DATOS DEL PACIENTE
        // ==========================================
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, yPos, pageWidth - 30, 15, 2, 2, 'F');

        doc.setFontSize(10);
        doc.setTextColor(...COLOR_DARK);
        doc.setFont('helvetica', 'bold');
        doc.text(`Paciente: ${paciente.nombres} ${paciente.apellidos}`, 20, yPos + 6);
        doc.text(`DNI: ${paciente.dni}`, pageWidth - 60, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${formatearFechaSinTimezone(new Date().toISOString())}`, pageWidth - 60, yPos + 11);

        yPos += 22;

        // ==========================================
        // TABLA CON FIRMAS
        // ==========================================
        const tableData = controles.map((control) => {
            const row = [
                formatearFechaSinTimezone(control.fecha),
                control.tratamiento_realizado || '-',
                `S/ ${Number(control.cuota || 0).toFixed(2)}`,
                '' // Espacio para firma (se dibuja después)
            ];
            return { data: row, control };
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Fecha', 'Tratamiento', 'Cuota', 'Firma']],
            body: tableData.map(item => item.data),
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineColor: [100, 100, 100],
                lineWidth: 0.5,
            },
            headStyles: {
                fillColor: COLOR_SMILE,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
            },
            bodyStyles: {
                textColor: COLOR_DARK,
            },
            columnStyles: {
                0: { cellWidth: 30, halign: 'center' },
                1: { cellWidth: 80 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 45, halign: 'center' },
            },
            didDrawCell: (data) => {
                // Dibujar firmas en la columna "Firma"
                if (data.section === 'body' && data.column.index === 3) {
                    const control = tableData[data.row.index].control;
                    const firmaBase64 = firmasBase64[control.id];

                    if (firmaBase64) {
                        const cellX = data.cell.x + 2;
                        const cellY = data.cell.y + 2;
                        const cellWidth = data.cell.width - 4;
                        const cellHeight = data.cell.height - 4;

                        try {
                            doc.addImage(firmaBase64, 'PNG', cellX, cellY, cellWidth, cellHeight);
                        } catch (error) {
                            console.error('Error añadiendo firma al PDF:', error);
                        }
                    } else {
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.text('Sin firma', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                            align: 'center',
                            baseline: 'middle'
                        });
                    }
                }
            }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // ==========================================
        // RESUMEN CON FONDO
        // ==========================================
        const totalControles = controles.length;
        const totalCuotas = controles.reduce((sum, c) => sum + (Number(c.cuota) || 0), 0);

        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, yPos, pageWidth - 30, 12, 2, 2, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_DARK);
        doc.text(`Total de Controles: ${totalControles}`, 20, yPos + 8);

        doc.setTextColor(93, 190, 171);
        doc.text(`Total Cuotas: S/ ${totalCuotas.toFixed(2)}`, pageWidth - 70, yPos + 8);

        // ==========================================
        // FOOTER
        // ==========================================
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, footerY, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.text('Cusco Smile Dental - Sistema de Gestión Odontológica', pageWidth / 2, footerY + 5, { align: 'center' });

        // ==========================================
        // DESCARGAR
        // ==========================================
        const nombreArchivo = `EstadoCuenta_Ortodoncia_${paciente.apellidos}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);

        console.log('✅ PDF generado exitosamente');
    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        throw error;
    }
}
