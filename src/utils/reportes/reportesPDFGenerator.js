import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';  // ✅ Importación correcta
import Swal from 'sweetalert2';

export const generarPDFReporteCompleto = (datos, filtros = {}) => {
    try {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-PE');

        // ===== ENCABEZADO =====
        doc.setFillColor(76, 179, 148);
        doc.rect(0, 0, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Cusco Smile', 15, 15);
        doc.setFontSize(10);
        doc.text('Atención Odontológica Especializada', 15, 22);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Generado: ${fecha}`, 180, 15, { align: 'right' });

        // ===== TÍTULO =====
        doc.setTextColor(76, 179, 148);
        doc.setFontSize(14);
        doc.text('REPORTE DE GESTIÓN DENTAL', 15, 40);

        // ===== FILTROS APLICADOS =====
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        let yPos = 50;

        if (filtros.fechaInicio || filtros.fechaFin || filtros.dentistaId) {
            doc.text('FILTROS APLICADOS:', 15, yPos);
            yPos += 6;

            if (filtros.fechaInicio) {
                doc.text(`• Fecha Inicio: ${filtros.fechaInicio}`, 15, yPos);
                yPos += 5;
            }
            if (filtros.fechaFin) {
                doc.text(`• Fecha Fin: ${filtros.fechaFin}`, 15, yPos);
                yPos += 5;
            }
            if (filtros.dentistaId) {
                doc.text(`• Dentista ID: ${filtros.dentistaId}`, 15, yPos);
                yPos += 5;
            }
            yPos += 3;
        }

        // ===== TABLA 1: RESUMEN FINANCIERO =====
        doc.setTextColor(76, 179, 148);
        doc.setFontSize(11);
        doc.text('💰 RESUMEN FINANCIERO', 15, yPos);
        yPos += 8;

        autoTable(doc, {  // ✅ USO CORRECTO
            startY: yPos,
            head: [['Concepto', 'Monto']],
            body: [
                ['Dinero Cobrado', `S/ ${formatearMonto(datos.pagos?.totalIngresos || 0)}`],
                ['Dinero por Cobrar', `S/ ${formatearMonto(datos.pagos?.totalPorCobrar || 0)}`],
                ['Ganancia del Período', `S/ ${formatearMonto(datos.pagos?.ganancia || 0)}`],
                ['Promedio por Pago', `S/ ${formatearMonto(datos.pagos?.promedioPago || 0)}`],
                ['Total de Pagos', datos.pagos?.cantidadPagos || 0]
            ],
            headStyles: {
                fillColor: [76, 179, 148],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: [80, 80, 80],
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [240, 248, 245]
            },
            margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ===== TABLA 2: RESUMEN DE CITAS =====
        doc.setTextColor(76, 179, 148);
        doc.setFontSize(11);
        doc.text('📅 RESUMEN DE CITAS', 15, yPos);
        yPos += 8;

        autoTable(doc, {  // ✅ USO CORRECTO
            startY: yPos,
            head: [['Concepto', 'Cantidad']],
            body: [
                ['Citas Programadas', datos.citas?.total || 0],
                ['Citas Atendidas', datos.citas?.atendidas || 0],
                ['Citas Canceladas', datos.citas?.canceladas || 0],
                ['Tasa de Asistencia', `${datos.citas?.tasaAsistencia || 0}%`],
                ['Pacientes Únicos', datos.pacientes?.activos || 0],
                ['Pacientes Nuevos', datos.pacientes?.nuevos || 0]
            ],
            headStyles: {
                fillColor: [76, 179, 148],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                textColor: [80, 80, 80],
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [240, 248, 245]
            },
            margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ===== TABLA 3: TOP 5 TRATAMIENTOS =====
        if (datos.tratamientos && datos.tratamientos.length > 0) {
            doc.setTextColor(76, 179, 148);
            doc.setFontSize(11);
            doc.text('🦷 TOP 5 TRATAMIENTOS', 15, yPos);
            yPos += 8;

            const tratamientosData = datos.tratamientos.slice(0, 5).map(t => [
                t.nombre,
                t.cantidad,
                `S/ ${formatearMonto(t.ingresos)}`
            ]);

            autoTable(doc, {  // ✅ USO CORRECTO
                startY: yPos,
                head: [['Tratamiento', 'Cantidad', 'Ingresos']],
                body: tratamientosData,
                headStyles: {
                    fillColor: [76, 179, 148],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    textColor: [80, 80, 80],
                    fontSize: 9
                },
                alternateRowStyles: {
                    fillColor: [240, 248, 245]
                },
                margin: { left: 15, right: 15 }
            });
        }

        // ===== PIE DE PÁGINA =====
        const totalPages = doc.internal.pages.length;
        for (let i = 1; i < totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Página ${i} de ${totalPages - 1}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // ===== DESCARGAR =====
        doc.save(`Reporte_Dental_${fecha.replace(/\//g, '-')}.pdf`);

        // ✅ SWAL CON ESTILO OSCURO PERSONALIZADO
        Swal.fire({
            title: '¡PDF Generado!',
            text: 'El reporte se ha generado correctamente.',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error al generar PDF:', error);

        // ✅ SWAL DE ERROR CON ESTILO OSCURO
        Swal.fire({
            title: 'Error al generar PDF',
            text: error.message,
            icon: 'error',
            background: '#1f2937',  // ✅ Fondo oscuro
            color: '#fff',  // ✅ Texto blanco
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Cerrar',
            iconColor: '#EF4444'
        });
    }
};

// ===== FUNCIÓN AUXILIAR =====
const formatearMonto = (monto) => {
    return typeof monto === 'number'
        ? monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })
        : '0.00';
};
