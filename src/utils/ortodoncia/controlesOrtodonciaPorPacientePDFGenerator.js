import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Función para generar el encabezado del documento
const addHeader = (doc, pacienteNombre) => {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    doc.setFillColor(93, 190, 171); // Verde corporativo
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
    doc.text(`CONTROLES DE ORTODONCIA: ${pacienteNombre.toUpperCase()}`, margin, 29);

    const fechaImpresion = new Date().toLocaleDateString('es-PE');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${fechaImpresion}`, pageWidth - margin - 40, 29);
};

// Función para agregar el pie de página
const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            'Cusco Smile - Sistema de Gestión',
            margin,
            doc.internal.pageSize.height - 10
        );
    }
};

export const generarPDFControlesPorPaciente = (controles, pacienteNombre) => {
    if (!controles || controles.length === 0) {
        console.error("No hay datos de controles para generar el PDF.");
        return;
    }

    const doc = new jsPDF();
    addHeader(doc, pacienteNombre);

    const tableRows = controles.map((c, index) => [
        index + 1,
        new Date(c.fecha).toLocaleDateString('es-PE'),
        c.tratamiento_realizado || 'N/A',
        c.cuota != null ? `S/ ${c.cuota.toFixed(2)}` : '-',
        c.firma_id ? 'SI' : 'NO',  // ✅ Cambiado a texto simple
    ]);

    autoTable(doc, {
        head: [['#', 'Fecha', 'Tratamiento Realizado', 'Cuota', 'Firma']],
        body: tableRows,
        startY: 42,
        margin: { left: 14, right: 14 },
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [93, 190, 171],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { halign: 'right', cellWidth: 24 },
            4: { halign: 'center', cellWidth: 14 },
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        didDrawCell: (data) => {
            // Colorear la celda de firma
            if (data.section === 'body' && data.column.index === 4) {
                const valor = data.cell.raw;
                if (valor === 'SI') {
                    doc.setTextColor(0, 128, 0); // Verde
                    doc.setFont('helvetica', 'bold');
                } else {
                    doc.setTextColor(128, 128, 128); // Gris
                    doc.setFont('helvetica', 'normal');
                }
            }
        },
    });

    addFooter(doc);

    const fechaActual = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Controles_Ortodoncia_${pacienteNombre.replace(/\s/g, '_')}_${fechaActual}.pdf`;
    doc.save(nombreArchivo);
};
