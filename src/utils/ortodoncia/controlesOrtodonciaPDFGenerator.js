import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


export const generarPDFControlesOrtodoncia = (controles) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let currentY = 0;

  // ===== HEADER CORPORATIVO =====
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
  doc.text('LISTADO GLOBAL DE CONTROLES DE ORTODONCIA', margin, 29);

  const fechaImpresion = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${fechaImpresion}`, pageWidth - margin - 55, 29);

  // Agrupa controles por paciente
  const pacientesAgrupados = {};
  controles.forEach(c => {
    const id = c.paciente?.id;
    if (!id) return;
    if (!pacientesAgrupados[id]) pacientesAgrupados[id] = { paciente: c.paciente, controles: [] };
    pacientesAgrupados[id].controles.push(c);
  });
  const grupos = Object.values(pacientesAgrupados);

  currentY = 42;

  grupos.forEach((grupo, idx) => {
    if (idx !== 0 && currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      currentY = 20;
    }

    // ==== SUBHEADER DEL PACIENTE ====
    doc.setFillColor(210, 251, 243); // Celeste pastel
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(42, 43, 49);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${grupo.paciente.nombres} ${grupo.paciente.apellidos} (DNI: ${grupo.paciente.dni || '-'})`,
      margin + 2, currentY + 7
    );

    currentY += 13;

    // ==== TABLA DE CONTROLES ====
    const rows = grupo.controles.map((c, i) => [
      i + 1,
      new Date(c.fecha).toLocaleDateString('es-PE'),
      c.tratamiento_realizado,
      c.cuota !== undefined && c.cuota !== null ? `S/ ${c.cuota}` : '-',
      c.firma ? '✔' : '-'
    ]);

    autoTable(doc, {
      head: [['#', 'Fecha', 'Tratamiento Realizado', 'Cuota', 'Firma']],
      body: rows,
      startY: currentY,
      margin: { left: margin, right: margin },
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
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center', cellWidth: 14 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didDrawPage: (data) => {
        currentY = data.cursor.y + 10;
      },
    });

    if (currentY > doc.internal.pageSize.height - 30) {
      doc.addPage();
      currentY = 20;
    }
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
  const nombreArchivo = `Controles_Ortodoncia_Global_Cusco_Smile_${fechaActual}.pdf`;
  doc.save(nombreArchivo);
};
