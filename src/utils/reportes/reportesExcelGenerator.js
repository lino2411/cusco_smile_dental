import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';

export const generarExcelReporteCompleto = async (datos, filtros = {}) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte Dental');

        // ✅ OFFSET: Desplazamiento para centrar (empezar en columna D)
        const colOffset = 3; // Columna D (A=1, B=2, C=3, D=4)

        // ===== ENCABEZADO =====
        worksheet.mergeCells(1, colOffset, 1, colOffset + 2); // Fila 1, columnas D-F
        const headerCell = worksheet.getCell(1, colOffset);
        headerCell.value = 'Cusco Smile - Reporte de Gestión Dental';
        headerCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CB394' } };
        headerCell.alignment = { horizontal: 'center', vertical: 'center' };
        worksheet.getRow(1).height = 25;

        // ===== INFORMACIÓN DE FILTROS =====
        let currentRow = 3;

        if (filtros.fechaInicio || filtros.fechaFin || filtros.dentistaId) {
            const filterCell = worksheet.getCell(currentRow, colOffset);
            filterCell.value = 'FILTROS APLICADOS:';
            filterCell.font = { bold: true, color: { argb: 'FF4CB394' } };
            currentRow += 1;

            if (filtros.fechaInicio) {
                worksheet.getCell(currentRow, colOffset).value = `Fecha Inicio: ${filtros.fechaInicio}`;
                currentRow += 1;
            }
            if (filtros.fechaFin) {
                worksheet.getCell(currentRow, colOffset).value = `Fecha Fin: ${filtros.fechaFin}`;
                currentRow += 1;
            }
            if (filtros.dentistaId) {
                worksheet.getCell(currentRow, colOffset).value = `Dentista ID: ${filtros.dentistaId}`;
                currentRow += 1;
            }
            currentRow += 1;
        }

        // ===== TABLA 1: RESUMEN FINANCIERO =====
        const headerRowFinanzas = currentRow;
        worksheet.getCell(headerRowFinanzas, colOffset).value = '💰 RESUMEN FINANCIERO';
        worksheet.getCell(headerRowFinanzas, colOffset).font = { bold: true, size: 12, color: { argb: 'FF4CB394' } };
        currentRow += 2;

        const finanzasHeaders = ['Concepto', 'Monto'];
        finanzasHeaders.forEach((header, index) => {
            const cell = worksheet.getCell(currentRow, colOffset + index);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CB394' } };
            cell.alignment = { horizontal: 'center', vertical: 'center' };
        });
        currentRow += 1;

        const finanzasData = [
            ['Dinero Cobrado', `S/ ${formatearMonto(datos.pagos?.totalIngresos || 0)}`],
            ['Dinero por Cobrar', `S/ ${formatearMonto(datos.pagos?.totalPorCobrar || 0)}`],
            ['Ganancia del Período', `S/ ${formatearMonto(datos.pagos?.ganancia || 0)}`],
            ['Promedio por Pago', `S/ ${formatearMonto(datos.pagos?.promedioPago || 0)}`],
            ['Total de Pagos', datos.pagos?.cantidadPagos || 0]
        ];

        finanzasData.forEach(row => {
            row.forEach((value, index) => {
                const cell = worksheet.getCell(currentRow, colOffset + index);
                cell.value = value;
                cell.alignment = { horizontal: 'center', vertical: 'center' };
            });
            currentRow += 1;
        });

        currentRow += 2;

        // ===== TABLA 2: RESUMEN DE CITAS =====
        const headerRowCitas = currentRow;
        worksheet.getCell(headerRowCitas, colOffset).value = '📅 RESUMEN DE CITAS';
        worksheet.getCell(headerRowCitas, colOffset).font = { bold: true, size: 12, color: { argb: 'FF4CB394' } };
        currentRow += 2;

        const citasHeaders = ['Concepto', 'Cantidad'];
        citasHeaders.forEach((header, index) => {
            const cell = worksheet.getCell(currentRow, colOffset + index);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CB394' } };
            cell.alignment = { horizontal: 'center', vertical: 'center' };
        });
        currentRow += 1;

        const citasData = [
            ['Citas Programadas', datos.citas?.total || 0],
            ['Citas Atendidas', datos.citas?.atendidas || 0],
            ['Citas Canceladas', datos.citas?.canceladas || 0],
            ['Tasa de Asistencia', `${datos.citas?.tasaAsistencia || 0}%`],
            ['Pacientes Únicos', datos.pacientes?.activos || 0],
            ['Pacientes Nuevos', datos.pacientes?.nuevos || 0]
        ];

        citasData.forEach(row => {
            row.forEach((value, index) => {
                const cell = worksheet.getCell(currentRow, colOffset + index);
                cell.value = value;
                cell.alignment = { horizontal: 'center', vertical: 'center' };
            });
            currentRow += 1;
        });

        currentRow += 2;

        // ===== TABLA 3: TOP 5 TRATAMIENTOS =====
        if (datos.tratamientos && datos.tratamientos.length > 0) {
            const headerRowTratamientos = currentRow;
            worksheet.getCell(headerRowTratamientos, colOffset).value = '🦷 TOP 5 TRATAMIENTOS';
            worksheet.getCell(headerRowTratamientos, colOffset).font = { bold: true, size: 12, color: { argb: 'FF4CB394' } };
            currentRow += 2;

            const tratamientosHeaders = ['Tratamiento', 'Cantidad', 'Ingresos'];
            tratamientosHeaders.forEach((header, index) => {
                const cell = worksheet.getCell(currentRow, colOffset + index);
                cell.value = header;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CB394' } };
                cell.alignment = { horizontal: 'center', vertical: 'center' };
            });
            currentRow += 1;

            datos.tratamientos.slice(0, 5).forEach(tratamiento => {
                const tratamientoData = [
                    tratamiento.nombre,
                    tratamiento.cantidad,
                    `S/ ${formatearMonto(tratamiento.ingresos)}`
                ];

                tratamientoData.forEach((value, index) => {
                    const cell = worksheet.getCell(currentRow, colOffset + index);
                    cell.value = value;
                    cell.alignment = { horizontal: 'center', vertical: 'center' };
                });

                currentRow += 1;
            });
        }

        // ===== AJUSTAR ANCHO DE COLUMNAS =====
        worksheet.getColumn(colOffset).width = 30;      // Columna D
        worksheet.getColumn(colOffset + 1).width = 15;  // Columna E
        worksheet.getColumn(colOffset + 2).width = 15;  // Columna F

        // ===== DESCARGAR =====
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fecha = new Date().toLocaleDateString('es-PE');
        link.download = `Reporte_Dental_${fecha.replace(/\//g, '-')}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        // ✅ SWAL CON ESTILO OSCURO PERSONALIZADO
        Swal.fire({
            title: '¡Excel Generado!',
            text: 'El reporte se ha generado correctamente.',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error al generar Excel:', error);

        // ✅ SWAL DE ERROR CON ESTILO OSCURO
        Swal.fire({
            title: 'Error al generar Excel',
            text: error.message,
            icon: 'error',
            background: '#1f2937',
            color: '#fff',
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
