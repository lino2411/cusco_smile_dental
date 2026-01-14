import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generarPDFPaciente = (paciente) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let currentY = 20;

    // ===== HEADER CON COLORES CUSCO SMILE =====
    doc.setFillColor(93, 190, 171); // Color principal Cusco Smile
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
    doc.text('FICHA DEL PACIENTE', margin, 32);

    // Fecha de impresión
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fechaImpresion = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.text(`Fecha de impresión: ${fechaImpresion}`, pageWidth - margin - 55, 32);

    currentY = 50;

    // ===== INFORMACIÓN PRINCIPAL DEL PACIENTE =====
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 30, 'F');

    doc.setFontSize(14);
    doc.setTextColor(93, 190, 171);
    doc.setFont('helvetica', 'bold');
    doc.text(
        `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim() || 'Sin nombre',
        margin + 3,
        currentY + 8
    );

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`DNI: ${paciente.dni || 'No especificado'}`, margin + 3, currentY + 16);

    if (paciente.fecha_nacimiento) {
        const edad = calculateAge(paciente.fecha_nacimiento);
        doc.text(`Edad: ${edad} años`, margin + 3, currentY + 22);
    }

    doc.text(`Celular: ${paciente.celular || 'No especificado'}`, pageWidth / 2, currentY + 16);
    doc.text(
        `Sexo: ${paciente.sexo === 'Masculino' ? 'Masculino' : paciente.sexo === 'Femenino' ? 'Femenino' : paciente.sexo || 'No especificado'}`,
        pageWidth / 2,
        currentY + 22
    );

    currentY += 40;

    // ===== FUNCIÓN PARA AGREGAR SECCIONES =====
    const agregarSeccion = (titulo, contenido) => {
        if (currentY > 270) {
            doc.addPage();
            currentY = 20;
        }

        // Título de sección
        doc.setFillColor(93, 190, 171);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 7, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, margin + 2, currentY + 5);

        currentY += 10;

        // Contenido
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        if (Array.isArray(contenido)) {
            // Es una tabla de datos
            contenido.forEach(([label, valor]) => {
                if (currentY > 275) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin + 3, currentY);
                doc.setFont('helvetica', 'normal');
                const valorTexto = valor || 'No especificado';
                const lineas = doc.splitTextToSize(valorTexto, pageWidth - margin - 60);
                doc.text(lineas, margin + 50, currentY);
                currentY += Math.max(5, lineas.length * 5);
            });
        } else {
            // Es texto libre
            const lineas = doc.splitTextToSize(contenido || 'No especificado', pageWidth - 2 * margin - 4);
            doc.text(lineas, margin + 3, currentY);
            currentY += lineas.length * 5 + 5;
        }

        currentY += 5;
    };

    // ===== SECCIÓN: DATOS PERSONALES =====
    agregarSeccion('DATOS PERSONALES', [
        ['Nombres', paciente.nombres],
        ['Apellidos', paciente.apellidos],
        ['DNI', paciente.dni],
        [
            'Fecha de Nacimiento',
            paciente.fecha_nacimiento
                ? `${formatDate(paciente.fecha_nacimiento)} (${calculateAge(paciente.fecha_nacimiento)} años)`
                : null,
        ],
        ['Lugar de Nacimiento', paciente.lugar_nacimiento],
        ['Sexo', paciente.sexo === 'Masculino' ? 'Masculino' : paciente.sexo === 'Femenino' ? 'Femenino' : paciente.sexo],
    ]);

    // ===== SECCIÓN: CONTACTO =====
    agregarSeccion('CONTACTO Y UBICACIÓN', [
        ['Celular', paciente.celular],
        ['Celular de Emergencia', paciente.celular_emergencia],
        ['Dirección', paciente.direccion],
        ['Procedencia', paciente.procedencia],
        ['Ocupación', paciente.ocupacion],
    ]);

    // ===== SECCIÓN: VIAJES =====
    if (paciente.viajes_ultimo_anio) {
        agregarSeccion('VIAJES EN EL ÚLTIMO AÑO', paciente.viajes_ultimo_anio);
    }

    // ===== SECCIÓN: OBSERVACIONES =====
    if (paciente.observaciones) {
        agregarSeccion('OBSERVACIONES', paciente.observaciones);
    }

    // ===== INFORMACIÓN DE REGISTRO =====
    if (currentY > 260) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 15, 'F');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');

    if (paciente.fecha_registro) {
        doc.text(`Fecha de registro: ${formatDate(paciente.fecha_registro)}`, margin + 3, currentY + 6);
    }
    if (paciente.fecha_actualizacion) {
        doc.text(`Última actualización: ${formatDate(paciente.fecha_actualizacion)}`, margin + 3, currentY + 11);
    }

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
        doc.text('Cusco Smile - Ficha del Paciente', margin, doc.internal.pageSize.height - 10);
    }

    // ===== DESCARGAR PDF =====
    const nombreArchivo = `Ficha_Paciente_${paciente.nombres || 'Sin_nombre'}_${paciente.apellidos || ''}.pdf`.replace(/\s+/g, '_');
    doc.save(nombreArchivo);
};

// ===== FUNCIONES AUXILIARES =====
function formatDate(d) {
    if (!d) return 'No especificado';
    try {
        return new Date(d).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return d;
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return 0;
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    } catch {
        return 0;
    }
}
