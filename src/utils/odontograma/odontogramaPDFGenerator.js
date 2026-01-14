import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Colores Cusco Smile
const COLOR_PRIMARY = [93, 190, 171];
const COLOR_DARK = [17, 24, 39];

const CATALOGO_TRATAMIENTOS = {
    'car': 'Caries', 'frac': 'Fractura', 'rr': 'Remanente Radicular',
    'ext': 'Extracción Indicada', 'am': 'Amalgama', 'r': 'Resina',
    'iv': 'Ionómero de Vidrio', 'im': 'Incrustación Metálica',
    'ie': 'Incrustación Estética', 'rtemp': 'Restauración Temporal',
    'cc': 'Corona Completa', 'cmc': 'Corona Metal Cerámica',
    'cj': 'Corona Jacket', 'cf': 'Corona Fenestrada',
    'cv': 'Corona Veneer', 'cp': 'Corona Parcial',
    'ctemp': 'Corona Temporal', 'tc': 'Tratamiento de Conductos',
    'pc': 'Pulpectomía', 'pp': 'Pulpotomía',
    'pr': 'Prótesis Removible', 'pt': 'Prótesis Total',
    'imp': 'Implante', 'aus': 'Diente Ausente',
};

export const generarPDFOdontograma = async (odontograma, paciente) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 14;

    // ==================== HEADER ====================
    doc.setFillColor(...COLOR_PRIMARY);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Cusco Smile', margin, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Atención Odontológica Especializada', margin, 22);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const tipoLabel = odontograma.tipo === 'inicial' ? 'INICIAL' :
        odontograma.tipo === 'evolutivo' ? 'EVOLUTIVO' : 'FINAL';
    doc.text(`ODONTOGRAMA ${tipoLabel}`, margin, 29);

    doc.setFontSize(8);
    doc.text(
        `Fecha de impresión: ${new Date().toLocaleDateString('es-PE')}`,
        pageWidth - margin - 50,
        28
    );

    yPosition = 45;

    // ==================== DATOS DEL PACIENTE ====================
    doc.setTextColor(...COLOR_DARK);
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 25, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', 20, yPosition + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const nombreCompleto = [paciente?.nombres, paciente?.apellidos].filter(Boolean).join(' ') || 'No especificado';
    const dniPaciente = paciente?.dni || '-';

    doc.text(`Paciente: ${nombreCompleto}`, 20, yPosition + 13);
    doc.text(`DNI: ${dniPaciente}`, 20, yPosition + 18);
    doc.text(`Fecha: ${new Date(odontograma.fecha).toLocaleDateString('es-PE')}`, 120, yPosition + 13);
    doc.text(`Tipo: ${odontograma.tipo_denticion === 'adulto' ? 'Adulto (32 piezas)' : 'Niño (20 piezas)'}`, 120, yPosition + 18);

    yPosition += 35;

    // ==================== ODONTOGRAMA VISUAL ====================
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text('ODONTOGRAMA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Capturar el canvas del odontograma
    try {
        const canvasElement = document.querySelector('canvas');
        if (canvasElement) {
            const canvas = await html2canvas(canvasElement, {
                backgroundColor: '#ffffff',
                scale: 1.5
            });

            const imgData = canvas.toDataURL('image/png');

            // Tamaño regular: 75% del ancho de la página
            const imgWidth = (pageWidth - 2 * margin) * 0.75;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Centrar horizontalmente
            const xOffset = (pageWidth - imgWidth) / 2;

            doc.addImage(imgData, 'PNG', xOffset, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 8;

        } else {
            // Si no hay canvas, dibujar un rectángulo vacío
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(margin, yPosition, pageWidth - 2 * margin, 70);

            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('SUPERIOR', pageWidth / 2, yPosition + 10, { align: 'center' });
            doc.text('INFERIOR', pageWidth / 2, yPosition + 65, { align: 'center' });

            yPosition += 78;
        }
    } catch (error) {
        console.error('Error al capturar canvas:', error);

        // Fallback: dibujar rectángulo vacío
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 70);
        yPosition += 78;
    }

    // Leyenda
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(239, 68, 68);
    doc.circle(margin + 2, yPosition - 1, 1.5, 'F');
    doc.setTextColor(...COLOR_DARK);
    doc.text('Rojo = Plan de tratamiento', margin + 6, yPosition);

    doc.setFillColor(59, 130, 246);
    doc.circle(margin + 65, yPosition - 1, 1.5, 'F');
    doc.text('Azul = Tratamiento existente', margin + 69, yPosition);

    yPosition += 10;

    // ==================== TABLA TRATAMIENTOS ====================
    if (odontograma.piezas_dentales && odontograma.piezas_dentales.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(`Tratamientos Registrados (${odontograma.piezas_dentales.length})`, margin, yPosition);
        yPosition += 5;

        const tratamientosData = odontograma.piezas_dentales.map(pieza => {
            const esRojo = pieza.color === 'rojo' || pieza.es_plan_tratamiento;
            const tipo = esRojo ? 'Plan' : 'Existente';
            const nombreTratamiento = CATALOGO_TRATAMIENTOS[pieza.estado.toLowerCase()] || pieza.estado;

            return [
                pieza.numero_pieza.toString(),
                pieza.superficie || 'corona',
                nombreTratamiento,
                tipo
            ];
        });

        autoTable(doc, {
            startY: yPosition,
            head: [['Pieza', 'Superficie', 'Tratamiento', 'Tipo']],
            body: tratamientosData,
            theme: 'striped',
            headStyles: {
                fillColor: COLOR_PRIMARY,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
            },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 30, halign: 'center' },
            },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
    }

    // ==================== PRESUPUESTO ====================
    if (odontograma.presupuestos && odontograma.presupuestos.length > 0) {
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text('Presupuesto', margin, yPosition);
        yPosition += 5;

        const presupuestoData = odontograma.presupuestos.map(p => [
            p.tratamiento,
            p.cantidad.toString(),
            `S/. ${parseFloat(p.costo_unitario).toFixed(2)}`,
            `S/. ${parseFloat(p.total).toFixed(2)}`
        ]);

        const total = odontograma.presupuestos.reduce((sum, p) => sum + parseFloat(p.total), 0);

        autoTable(doc, {
            startY: yPosition,
            head: [['Tratamiento', 'Cantidad', 'Costo Unit.', 'Total']],
            body: presupuestoData,
            foot: [['', '', 'TOTAL:', `S/. ${total.toFixed(2)}`]],
            theme: 'grid',
            headStyles: {
                fillColor: COLOR_PRIMARY,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
            },
            footStyles: {
                fillColor: [220, 252, 231],
                textColor: COLOR_DARK,
                fontStyle: 'bold',
                fontSize: 9,
            },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 35, halign: 'right' },
            },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
    }

    // ==================== OBSERVACIONES ====================
    if (odontograma.observaciones && odontograma.observaciones.trim() !== '') {
        if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text('Observaciones:', margin, yPosition);
        yPosition += 5;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR_DARK);
        const splitObservaciones = doc.splitTextToSize(odontograma.observaciones, pageWidth - 2 * margin);
        doc.text(splitObservaciones, margin, yPosition);
    }

    // ==================== FOOTER ====================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')} - Página ${i} de ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    const nombreArchivo = `Odontograma_${paciente?.apellidos || 'Paciente'}_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
};
