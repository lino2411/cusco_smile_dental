import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDFListaPacientes = (pacientes) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    // ===== HEADER CON COLORES CUSCO SMILE =====
    doc.setFillColor(93, 190, 171);
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
    doc.text('LISTA DE PACIENTES REGISTRADOS', margin, 29);

    const fechaImpresion = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${fechaImpresion}`, pageWidth - margin - 55, 29);

    // ===== TABLA DE PACIENTES =====
    const tableData = pacientes.map((p, index) => [
        index + 1,
        p.dni || '-',
        `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Sin nombre',
        p.sexo === 'Masculino' ? 'M' : p.sexo === 'Femenino' ? 'F' : p.sexo || '-',
        p.celular || '-',
        p.fecha_registro 
            ? new Date(p.fecha_registro).toLocaleDateString('es-PE')
            : '-',
    ]);

    // ✅ CAMBIO CRÍTICO: Usa autoTable en lugar de doc.autoTable
    autoTable(doc, {
        startY: 42,
        head: [['N°', 'DNI', 'Nombre Completo', 'Sexo', 'Celular', 'Fecha Registro']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [93, 190, 171],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 30 },
            5: { halign: 'center', cellWidth: 30 },
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
    });

    // ===== PIE DE PÁGINA =====
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Página ${i} de ${totalPages}`,
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

    const fechaActual = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Lista_Pacientes_Cusco_Smile_${fechaActual}.pdf`;
    doc.save(nombreArchivo);
};
