import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generarPDFHistoriaClinica = (historia) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 20;

    // ===== HEADER =====
    doc.setFillColor(93, 190, 171); // Color Cusco Smile
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Logo o nombre de la clínica
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Cusco Smile', margin, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Atención Odontológica Especializada', margin, 22);
    doc.text('Historia Clínica', margin, 28);

    // Fecha de impresión
    doc.setFontSize(8);
    doc.text(
        `Fecha de impresión: ${new Date().toLocaleDateString('es-PE')}`,
        pageWidth - margin - 50,
        28,
        { align: 'right' }
    );

    currentY = 45;

    // ===== INFORMACIÓN DEL PACIENTE =====
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 25, 'F');

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', margin + 3, currentY + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const pacienteNombre = historia.paciente 
        ? `${historia.paciente.nombres || ''} ${historia.paciente.apellidos || ''}`.trim()
        : 'No especificado';
    const pacienteDNI = historia.paciente?.dni || 'No especificado';

    doc.text(`Nombre: ${pacienteNombre}`, margin + 3, currentY + 14);
    doc.text(`DNI: ${pacienteDNI}`, margin + 3, currentY + 20);

    // Fecha de consulta y odontólogo
    const fechaConsulta = new Date(historia.fecha).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const odontologo = historia.odontologo?.nombre_completo || 'No especificado';

    doc.text(`Fecha de consulta: ${fechaConsulta}`, pageWidth / 2, currentY + 14);
    doc.text(`Odontólogo: Dr. ${odontologo}`, pageWidth / 2, currentY + 20);

    currentY += 35;

    // ===== CONTENIDO =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    const agregarSeccion = (titulo, contenido, altura = 15) => {
        if (currentY > 270) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFillColor(93, 190, 171);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(titulo, margin + 2, currentY + 4);

        currentY += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        const texto = contenido || 'No especificado';
        const lineas = doc.splitTextToSize(texto, pageWidth - 2 * margin - 4);

        doc.text(lineas, margin + 2, currentY);
        currentY += Math.max(altura, lineas.length * 5 + 5);
    };

    // Motivo de Consulta
    agregarSeccion('MOTIVO DE CONSULTA', historia.motivo_consulta);

    // Enfermedad Actual
    if (currentY > 260) {
        doc.addPage();
        currentY = 20;
    }
    doc.setFillColor(93, 190, 171);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ENFERMEDAD ACTUAL', margin + 2, currentY + 4);
    currentY += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Tiempo de enfermedad:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(historia.tiempo_enfermedad || 'No especificado', margin + 45, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Signos y síntomas:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(historia.signos_sintomas || 'No especificado', margin + 45, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Relato:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 5;
    const relatoLineas = doc.splitTextToSize(
        historia.relato_enfermedad || 'No especificado',
        pageWidth - 2 * margin - 4
    );
    doc.text(relatoLineas, margin + 2, currentY);
    currentY += relatoLineas.length * 5 + 8;

    // Antecedentes
    doc.setFontSize(10);
    agregarSeccion('ANTECEDENTES PATOLÓGICOS PERSONALES', historia.antecedentes_personales);
    agregarSeccion('ANTECEDENTES PATOLÓGICOS FAMILIARES', historia.antecedentes_familiares);

    // Examen Clínico - Signos Vitales
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }
    doc.setFillColor(93, 190, 171);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EXAMEN CLÍNICO - SIGNOS VITALES', margin + 2, currentY + 4);
    currentY += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const col1X = margin + 2;
    const col2X = pageWidth / 2;

    doc.text(`P.A.: ${historia.presion_arterial || '-'}`, col1X, currentY);
    doc.text(`Pulso: ${historia.pulso || '-'}`, col2X, currentY);
    currentY += 5;
    doc.text(`Temperatura: ${historia.temperatura || '-'}`, col1X, currentY);
    doc.text(`SpO2: ${historia.spo2 || '-'}`, col2X, currentY);
    currentY += 10;

    doc.setFontSize(10);
    agregarSeccion('EXAMEN CLÍNICO GENERAL', historia.examen_fisico);

    // Diagnóstico
    if (currentY > 240) {
        doc.addPage();
        currentY = 20;
    }
    doc.setFillColor(93, 190, 171);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNÓSTICO (CIE-10)', margin + 2, currentY + 4);
    currentY += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Presuntivo:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(historia.diagnostico_presuntivo || 'No especificado', margin + 25, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Definitivo:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(historia.diagnostico_definitivo || 'No especificado', margin + 25, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Código CIE-10:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(historia.cie10_codigo || 'No especificado', margin + 30, currentY);
    currentY += 10;

    // Plan de Tratamiento
    doc.setFontSize(10);
    agregarSeccion('PLAN DE TRATAMIENTO', historia.plan_tratamiento);
    agregarSeccion('PRONÓSTICO', historia.pronostico);

    // Tratamiento Farmacológico
    if (currentY > 240) {
        doc.addPage();
        currentY = 20;
    }
    doc.setFillColor(93, 190, 171);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TRATAMIENTO FARMACOLÓGICO / RECOMENDACIONES', margin + 2, currentY + 4);
    currentY += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Medicamentos:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 5;
    const medicamentosLineas = doc.splitTextToSize(
        historia.tratamiento_farmacologico || 'No especificado',
        pageWidth - 2 * margin - 4
    );
    doc.text(medicamentosLineas, margin + 2, currentY);
    currentY += medicamentosLineas.length * 5 + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Recomendaciones:', margin + 2, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 5;
    const recomendacionesLineas = doc.splitTextToSize(
        historia.recomendaciones || 'No especificado',
        pageWidth - 2 * margin - 4
    );
    doc.text(recomendacionesLineas, margin + 2, currentY);
    currentY += recomendacionesLineas.length * 5 + 8;

    // Control y Evolución
    doc.setFontSize(10);
    agregarSeccion('CONTROL Y EVOLUCIÓN', historia.control_evolucion);

    // ===== FOOTER =====
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
            'Cusco Smile - Historia Clínica',
            margin,
            doc.internal.pageSize.height - 10
        );
    }

    // Descargar PDF
    const nombreArchivo = `Historia_Clinica_${pacienteNombre.replace(/\s+/g, '_')}_${fechaConsulta.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
};
