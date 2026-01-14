import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Colores Cusco Smile
const COLOR_SMILE = [93, 190, 171]; // #5DBEAB
const COLOR_DARK = [17, 24, 39]; // #111827
const COLOR_LIGHT = [245, 245, 245];

/**
 * Genera PDF del detalle de un movimiento de caja
 */
export const generarPDFMovimientoCaja = (movimiento) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 14;
        let currentY = 20;

        // ✅ Validar que existan los datos necesarios
        if (!movimiento) {
            console.error('Faltan datos del movimiento');
            alert('No se puede generar el PDF. Faltan datos.');
            return;
        }

        // ===== HEADER CON COLORES CUSCO SMILE =====
        doc.setFillColor(...COLOR_SMILE);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Título principal
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Cusco Smile', margin, 16);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('ATENCIÓN ODONTOLÓGICA ESPECIALIZADA', margin, 24);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        const titulo = movimiento.tipo_movimiento === 'ingreso' ? 'COMPROBANTE DE INGRESO' :
            movimiento.tipo_movimiento === 'egreso' ? 'COMPROBANTE DE EGRESO' :
                movimiento.tipo_movimiento === 'ajuste' ? 'COMPROBANTE DE AJUSTE' :
                    'COMPROBANTE DE CIERRE';
        doc.text(titulo, margin, 32);

        // Fecha de impresión
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255);
        const fechaImpresion = new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        doc.text(`Fecha de impresión: ${fechaImpresion}`, pageWidth - margin - 60, 32);

        currentY = 50;

        // ===== INFORMACIÓN PRINCIPAL DEL MOVIMIENTO =====
        doc.setFillColor(...COLOR_LIGHT);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 30, 'F');

        doc.setFontSize(14);
        doc.setTextColor(...COLOR_SMILE);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, margin + 3, currentY + 8);

        doc.setFontSize(10);
        doc.setTextColor(...COLOR_DARK);
        doc.setFont('helvetica', 'normal');
        doc.text(`N° Comprobante: ${movimiento.id.slice(0, 8).toUpperCase()}`, margin + 3, currentY + 16);
        doc.text(`Fecha: ${formatearFecha(movimiento.fecha)}`, margin + 3, currentY + 22);

        doc.text(`Tipo: ${movimiento.tipo_movimiento.toUpperCase()}`, pageWidth / 2, currentY + 16);
        doc.text(`Origen: ${movimiento.origen.replace('_', ' ').toUpperCase()}`, pageWidth / 2, currentY + 22);

        currentY += 40;

        // ===== FUNCIÓN PARA AGREGAR SECCIONES =====
        const agregarSeccion = (titulo, contenido) => {
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }

            // Título de sección
            doc.setFillColor(...COLOR_SMILE);
            doc.rect(margin, currentY, pageWidth - 2 * margin, 7, 'F');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(titulo, margin + 2, currentY + 5);

            currentY += 10;

            // Contenido
            doc.setTextColor(...COLOR_DARK);
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

        // ===== SECCIÓN: INFORMACIÓN DEL MOVIMIENTO =====
        agregarSeccion('INFORMACIÓN DEL MOVIMIENTO', [
            ['Tipo de Movimiento', movimiento.tipo_movimiento.toUpperCase()],
            ['Descripción', movimiento.descripcion],
            ['Origen', movimiento.origen.replace('_', ' ')],
            ['Fecha y Hora', formatearFechaHora(movimiento.fecha)],
        ]);

        // ===== SECCIÓN: DATOS DEL PACIENTE (si aplica) =====
        if (movimiento.pacientes) {
            agregarSeccion('DATOS DEL PACIENTE', [
                ['Nombre Completo', `${movimiento.pacientes.nombres} ${movimiento.pacientes.apellidos}`],
                ['DNI', movimiento.pacientes.dni],
            ]);
        }

        // ===== SECCIÓN: INFORMACIÓN ADICIONAL =====
        const datosAdicionales = [
            ['Registrado por', movimiento.usuarios?.nombre_completo || 'Sistema'],
            ['Monto del Movimiento', formatearMoneda(movimiento.monto)],
            ['Saldo Posterior', formatearMoneda(movimiento.saldo_post_movimiento)],
        ];

        if (movimiento.nota) {
            datosAdicionales.push(['Notas', movimiento.nota]);
        }

        agregarSeccion('INFORMACIÓN ADICIONAL', datosAdicionales);

        // ===== SECCIÓN: RESUMEN DE MONTOS =====
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFillColor(...COLOR_LIGHT);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 30, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_DARK);
        doc.text('RESUMEN DE MONTOS', margin + 3, currentY + 8);

        doc.setFontSize(11);
        const colorMonto = movimiento.tipo_movimiento === 'egreso' ? [239, 68, 68] : [34, 197, 94];
        doc.setTextColor(...colorMonto);
        doc.text(`Monto: ${formatearMoneda(movimiento.monto)}`, margin + 3, currentY + 16);

        doc.setTextColor(...COLOR_DARK);
        doc.setFontSize(10);
        doc.text(`Saldo Después del Movimiento: ${formatearMoneda(movimiento.saldo_post_movimiento)}`, margin + 3, currentY + 24);

        currentY += 35;

        // ===== INFORMACIÓN DE REGISTRO =====
        if (currentY > 260) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFillColor(...COLOR_LIGHT);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 15, 'F');

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text(`ID del Movimiento: ${movimiento.id}`, margin + 3, currentY + 6);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}`, margin + 3, currentY + 11);

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
            doc.text('Cusco Smile - Comprobante de Caja', margin, doc.internal.pageSize.height - 10);
        }

        // ===== DESCARGAR PDF =====
        const tipoArchivo = movimiento.tipo_movimiento.charAt(0).toUpperCase() + movimiento.tipo_movimiento.slice(1);
        const numeroComprobante = movimiento.id.slice(0, 8).toUpperCase();
        const nombreArchivo = `${tipoArchivo}_Caja_${numeroComprobante}.pdf`;
        doc.save(nombreArchivo);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar PDF: ' + error.message);
    }
};

// ===== FUNCIONES AUXILIARES =====
function formatearFecha(d) {
    if (!d) return 'No especificado';
    try {
        const fecha = new Date(d);
        return fecha.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return d;
    }
}

function formatearFechaHora(d) {
    if (!d) return 'No especificado';
    try {
        const fecha = new Date(d);
        return fecha.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }) + ' ' + fecha.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return d;
    }
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
    }).format(valor || 0);
}
