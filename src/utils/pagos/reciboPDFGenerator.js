import { jsPDF } from 'jspdf'; // ✅ Cambio 1: Usar export nombrado
import autoTable from 'jspdf-autotable'; // ✅ Cambio 2: Importar autoTable


// Colores Cusco Smile
const COLOR_SMILE = [93, 190, 171];
const COLOR_DARK = [17, 24, 39];
const COLOR_LIGHT = [245, 245, 245];


/**
 * Genera PDF del estado de cuenta de un paciente
 * @param {Object} paciente - Datos del paciente
 * @param {Array} pagos - Lista de pagos
 * @param {Object} firmas - Objeto con firmas en Base64 { pagoId: firmaBase64 }
 */
export function generarPDFEstadoCuenta(paciente, pagos, firmas = {}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;


    // ===== HEADER =====
    doc.setFillColor(...COLOR_SMILE);
    doc.rect(0, 0, pageWidth, 35, 'F');


    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Cusco Smile', margin, 15);


    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ATENCIÓN ODONTOLÓGICA ESPECIALIZADA', margin, 22);


    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', margin, 29);


    doc.setFontSize(9);
    doc.text(
        `Fecha: ${new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })}`,
        pageWidth - margin - 60,
        29
    );


    let yPos = 42;


    // ===== INFORMACIÓN DEL PACIENTE =====
    doc.setTextColor(...COLOR_DARK);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 20, 'F');


    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', margin + 5, yPos + 7);


    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paciente: ${paciente.nombres} ${paciente.apellidos}`, margin + 5, yPos + 13);
    doc.text(`DNI: ${paciente.dni}`, margin + 100, yPos + 13);


    yPos += 28;


    // ===== TABLA DE PAGOS CON FIRMA =====
    const tableData = pagos.map(pago => {
        const debe = parseFloat(pago.costo) - parseFloat(pago.a_cuenta || 0);
        const fechaSolo = pago.fecha.split('T')[0];
        const [year, month, day] = fechaSolo.split('-');


        return [
            `${day}/${month}/${year}`,
            pago.tratamiento_realizado,
            `S/ ${parseFloat(pago.costo).toFixed(2)}`,
            `S/ ${parseFloat(pago.a_cuenta || 0).toFixed(2)}`,
            `S/ ${debe.toFixed(2)}`,
            `S/ ${parseFloat(pago.saldo || 0).toFixed(2)}`,
            '' // ✅ Columna vacía para firma (se agregará después)
        ];
    });


    // ✅ CAMBIO 3: Usar autoTable en vez de doc.autoTable
    autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Tratamiento', 'Costo', 'A Cuenta', 'Debe', 'Saldo', 'Firma']],
        body: tableData,
        theme: 'grid',
        tableWidth: 'auto',
        headStyles: {
            fillColor: COLOR_SMILE,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 8
        },
        bodyStyles: {
            textColor: COLOR_DARK,
            fontSize: 8,
            minCellHeight: 16 // ✅ Altura mínima para que quepa la firma
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 18 },  // Fecha (era 20)
            1: { halign: 'left', cellWidth: 40 },    // Tratamiento (era 42)
            2: { halign: 'right', cellWidth: 18 },   // Costo (era 20)
            3: { halign: 'right', cellWidth: 18 },   // A Cuenta (era 20)
            4: { halign: 'right', cellWidth: 18 },   // Debe (era 20)
            5: { halign: 'right', cellWidth: 18 },   // Saldo (era 20)
            6: { halign: 'center', cellWidth: 28 }   // Firma (era 30)
        },
        // Nuevo total: 18+40+18+18+18+18+28 = 158 unidades 

        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        didDrawCell: (data) => {
            // ✅ Dibujar firmas en la columna 6
            if (data.column.index === 6 && data.section === 'body') {
                const pagoIndex = data.row.index;
                const pago = pagos[pagoIndex];

                if (pago && firmas[pago.id]) {
                    try {
                        const firmaBase64 = firmas[pago.id];
                        const cellX = data.cell.x;
                        const cellY = data.cell.y;
                        const cellWidth = data.cell.width;
                        const cellHeight = data.cell.height;

                        // Centrar firma en la celda
                        const firmaWidth = 25;
                        const firmaHeight = 10;
                        const firmaX = cellX + (cellWidth - firmaWidth) / 2;
                        const firmaY = cellY + (cellHeight - firmaHeight) / 2;

                        doc.addImage(firmaBase64, 'PNG', firmaX, firmaY, firmaWidth, firmaHeight);
                    } catch (error) {
                        console.warn('⚠️ Error al agregar firma en PDF:', error);
                        // Si falla, mostrar texto
                        doc.setFontSize(7);
                        doc.setTextColor(150, 150, 150);
                        doc.text('✓', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' });
                    }
                } else {
                    // Sin firma - mostrar texto
                    doc.setFontSize(7);
                    doc.setTextColor(180, 180, 180);
                    doc.text('Sin firma', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' });
                }
            }
        }
    });


    // Calcular totales
    const totalCosto = pagos.reduce((sum, p) => sum + parseFloat(p.costo || 0), 0);
    const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.a_cuenta || 0), 0);
    const totalDebe = totalCosto - totalPagado;


    // ===== TOTALES =====
    const finalY = doc.lastAutoTable.finalY + 10;


    doc.setFillColor(240, 240, 240);
    doc.rect(margin, finalY, pageWidth - (margin * 2), 30, 'F');


    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');


    const col1X = margin + 20;
    const col2X = pageWidth / 2;
    const col3X = pageWidth - margin - 50;


    doc.setTextColor(...COLOR_DARK);
    doc.text('Total Tratamientos:', col1X, finalY + 10);
    doc.text(`S/ ${totalCosto.toFixed(2)}`, col1X, finalY + 18);


    doc.setTextColor(34, 197, 94);
    doc.text('Total Pagado:', col2X, finalY + 10);
    doc.text(`S/ ${totalPagado.toFixed(2)}`, col2X, finalY + 18);


    doc.setTextColor(239, 68, 68);
    doc.text('Total Debe:', col3X, finalY + 10);
    doc.text(`S/ ${totalDebe.toFixed(2)}`, col3X, finalY + 18);


    // ===== FOOTER =====
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
        'Este documento es un estado de cuenta generado automáticamente.',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
    );


    // Guardar PDF
    const nombreArchivo = `Estado_Cuenta_${paciente.apellidos}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);

    console.log('✅ PDF generado exitosamente');
}

/**
 * Genera PDF de un recibo individual
 */
export function generarPDFRecibo(pago, paciente, firmaBase64 = null) {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 14;
        let currentY = 20;


        // ✅ Validar datos
        if (!pago || !paciente) {
            console.error('Faltan datos del pago o paciente');
            alert('No se puede generar el PDF. Faltan datos.');
            return;
        }


        const costo = parseFloat(pago.costo) || 0;
        const aCuenta = parseFloat(pago.a_cuenta) || 0;
        const debe = costo - aCuenta;


        // ✅ CORREGIDO: Formatear fecha sin conversión de zona horaria
        let fechaFormateada = 'Sin fecha';
        if (pago.fecha) {
            try {
                const fechaSolo = pago.fecha.split('T')[0]; // "2025-12-15"
                const [year, month, day] = fechaSolo.split('-');

                // Crear fecha en zona horaria local sin conversión UTC
                const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

                fechaFormateada = fecha.toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            } catch (error) {
                console.error('Error al formatear fecha:', error);
                fechaFormateada = pago.fecha.split('T')[0]; // Fallback
            }
        }


        const numeroRecibo = (pago.id || 'SIN-ID').toString().slice(0, 8).toUpperCase();


        // ===== HEADER =====
        doc.setFillColor(...COLOR_SMILE);
        doc.rect(0, 0, pageWidth, 40, 'F');


        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Cusco Smile', margin, 16);


        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('ATENCIÓN ODONTOLÓGICA ESPECIALIZADA', margin, 24);


        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPROBANTE DE PAGO', margin, 32);


        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`N° ${numeroRecibo}`, pageWidth - margin - 40, 24);
        doc.text(`Fecha: ${fechaFormateada}`, pageWidth - margin - 70, 32);


        currentY = 50;


        // ===== FUNCIÓN HELPER =====
        const agregarSeccion = (titulo, contenido) => {
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }


            doc.setFillColor(...COLOR_SMILE);
            doc.rect(margin, currentY, pageWidth - 2 * margin, 7, 'F');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(titulo, margin + 2, currentY + 5);


            currentY += 10;


            doc.setTextColor(...COLOR_DARK);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);


            if (Array.isArray(contenido)) {
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
                const lineas = doc.splitTextToSize(contenido || 'No especificado', pageWidth - 2 * margin - 4);
                doc.text(lineas, margin + 3, currentY);
                currentY += lineas.length * 5 + 5;
            }


            currentY += 5;
        };


        // ===== DATOS DEL PACIENTE =====
        const nombreCompleto = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim() || 'Sin nombre';
        const dniPaciente = (paciente.dni || 'Sin DNI').toString();


        agregarSeccion('DATOS DEL PACIENTE', [
            ['Nombre Completo', nombreCompleto],
            ['DNI', dniPaciente],
        ]);


        // ===== DETALLE DEL TRATAMIENTO =====
        const tratamiento = (pago.tratamiento_realizado || 'Sin especificar').toString();
        const metodoPago = (pago.metodo_pago || 'No especificado').toString();


        const datosTratamiento = [
            ['Tratamiento', tratamiento],
            ['Método de Pago', metodoPago],
            ['Fecha del Pago', fechaFormateada],
        ];


        if (pago.observaciones) {
            datosTratamiento.push(['Observaciones', pago.observaciones]);
        }


        agregarSeccion('DETALLE DEL TRATAMIENTO', datosTratamiento);


        // ===== RESUMEN DE MONTOS =====
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }


        doc.setFillColor(...COLOR_LIGHT);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 35, 'F');


        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_DARK);
        doc.text('RESUMEN DE MONTOS', margin + 3, currentY + 8);


        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Costo Total: ${formatearMoneda(costo)}`, margin + 3, currentY + 16);


        doc.setTextColor(34, 197, 94);
        doc.text(`Monto Pagado: ${formatearMoneda(aCuenta)}`, margin + 3, currentY + 23);


        const colorDebe = debe > 0 ? [239, 68, 68] : [34, 197, 94];
        doc.setTextColor(...colorDebe);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Saldo Pendiente: ${formatearMoneda(debe)}`, margin + 3, currentY + 31);


        currentY += 40;


        // ===== FIRMA DEL PACIENTE =====
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }


        doc.setFillColor(...COLOR_SMILE);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 7, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('FIRMA DEL PACIENTE', margin + 2, currentY + 5);


        currentY += 10;


        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 40, 'F');


        if (firmaBase64) {
            const firmaWidth = 70;
            const firmaHeight = 30;
            const firmaX = (pageWidth - firmaWidth) / 2;


            try {
                doc.addImage(firmaBase64, 'PNG', firmaX, currentY + 5, firmaWidth, firmaHeight);
            } catch (errorImagen) {
                console.error('❌ Error al agregar imagen:', errorImagen);
                doc.setTextColor(150, 150, 150);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.text('Error al cargar firma', pageWidth / 2, currentY + 20, { align: 'center' });
            }


            currentY += 45;


            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text(`Firmado por: ${nombreCompleto}`, margin + 3, currentY);
        } else {
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.text('Sin firma registrada', pageWidth / 2, currentY + 20, { align: 'center' });
            currentY += 45;
        }


        currentY += 10;


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
        doc.text(`ID del Pago: ${pago.id}`, margin + 3, currentY + 6);
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
                pageHeight - 10,
                { align: 'center' }
            );
            doc.text('Cusco Smile - Comprobante de Pago', margin, pageHeight - 10);
        }


        // ===== DESCARGAR =====
        const apellidoPaciente = (paciente.apellidos || 'Paciente').toString();
        const nombreArchivo = `Comprobante_Pago_${apellidoPaciente}_${numeroRecibo}.pdf`;
        doc.save(nombreArchivo);


    } catch (error) {
        console.error('Error completo al generar PDF:', error);
        alert('Error al generar PDF: ' + error.message);
    }
}


function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
    }).format(valor || 0);
}
