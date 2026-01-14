import ExcelJS from 'exceljs';

export const generarExcelCajaCentral = async (movimientos, filtros = {}) => {
    if (!movimientos || movimientos.length === 0) {
        alert('No hay movimientos para exportar');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Movimientos de Caja', {
        properties: { tabColor: { argb: 'FF5DBEAB' } }
    });

    // === Título y Encabezado ===
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CUSCO SMILE - CAJA CENTRAL';
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF5DBEAB' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:I2');
    const dateCell = worksheet.getCell('A2');
    const fechaExportacion = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    dateCell.value = `Fecha de exportación: ${fechaExportacion}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    // Rango de fechas filtradas
    if (filtros.inicio && filtros.fin) {
        worksheet.mergeCells('A3:I3');
        const rangoCell = worksheet.getCell('A3');
        rangoCell.value = `Período: ${filtros.inicio} al ${filtros.fin}`;
        rangoCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF5DBEAB' } };
        rangoCell.alignment = { horizontal: 'center' };
    }

    worksheet.mergeCells('A4:I4');
    const totalCell = worksheet.getCell('A4');
    totalCell.value = `Total de movimientos: ${movimientos.length}`;
    totalCell.font = { name: 'Arial', size: 10, bold: true };
    totalCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // === ENCABEZADOS ===
    const headers = [
        'N°', 'Fecha/Hora', 'Descripción', 'Tipo', 'Origen', 'Monto', 'Paciente', 'Usuario', 'Saldo'
    ];
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF5DBEAB' }
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    headerRow.height = 25;

    // === DATOS DE MOVIMIENTOS ===
    movimientos.forEach((mov, index) => {
        const fechaHora = mov.fecha
            ? new Date(mov.fecha).toLocaleString('es-PE', {
                timeZone: 'America/Lima',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : '-';

        const tipoTexto = mov.tipo_movimiento === 'ingreso'
            ? 'INGRESO'
            : mov.tipo_movimiento === 'egreso'
                ? 'EGRESO'
                : mov.tipo_movimiento === 'cierre'
                    ? 'CIERRE'
                    : 'AJUSTE';

        const origenTexto = mov.origen?.replace('_', ' ').toUpperCase() || '-';

        const pacienteNombre = mov.pacientes
            ? `${mov.pacientes.nombres || ''} ${mov.pacientes.apellidos || ''}`.trim()
            : '-';

        const usuarioNombre = mov.usuarios?.nombre_completo || 'Sistema';

        const montoFormato = mov.tipo_movimiento === 'egreso'
            ? `-S/ ${parseFloat(mov.monto || 0).toFixed(2)}`
            : `S/ ${parseFloat(mov.monto || 0).toFixed(2)}`;

        const saldoFormato = mov.saldo_post_movimiento !== undefined
            ? `S/ ${parseFloat(mov.saldo_post_movimiento || 0).toFixed(2)}`
            : '-';

        const row = worksheet.addRow([
            index + 1,
            fechaHora,
            mov.descripcion || '-',
            tipoTexto,
            origenTexto,
            montoFormato,
            pacienteNombre,
            usuarioNombre,
            saldoFormato
        ]);

        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.alignment = {
                horizontal: colNumber === 1 ? 'center' : 'left',
                vertical: 'middle'
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
            };

            // Color de fondo alternado
            if (index % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }
                };
            }

            // Color especial para tipo de movimiento
            if (colNumber === 4) { // Columna Tipo
                if (mov.tipo_movimiento === 'ingreso') {
                    cell.font = { ...cell.font, bold: true, color: { argb: 'FF059669' } };
                } else if (mov.tipo_movimiento === 'egreso') {
                    cell.font = { ...cell.font, bold: true, color: { argb: 'FFDC2626' } };
                }
            }

            // Negrita en monto
            if (colNumber === 6) {
                cell.font = { ...cell.font, bold: true };
            }
        });

        row.height = 20;
    });

    // === Totales al final ===
    worksheet.addRow([]);
    const totalIngresos = movimientos
        .filter(m => m.tipo_movimiento === 'ingreso')
        .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

    const totalEgresos = movimientos
        .filter(m => m.tipo_movimiento === 'egreso')
        .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

    const saldoFinal = totalIngresos - totalEgresos;

    const rowTotalIngresos = worksheet.addRow(['', '', '', '', 'TOTAL INGRESOS:', `S/ ${totalIngresos.toFixed(2)}`, '', '', '']);
    const rowTotalEgresos = worksheet.addRow(['', '', '', '', 'TOTAL EGRESOS:', `S/ ${totalEgresos.toFixed(2)}`, '', '', '']);
    const rowSaldoFinal = worksheet.addRow(['', '', '', '', 'SALDO FINAL:', `S/ ${saldoFinal.toFixed(2)}`, '', '', '']);

    [rowTotalIngresos, rowTotalEgresos, rowSaldoFinal].forEach(row => {
        row.eachCell((cell, colNumber) => {
            if (colNumber === 5 || colNumber === 6) {
                cell.font = { name: 'Arial', size: 11, bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0F2FE' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        });
    });

    // === Ancho de columnas ===
    worksheet.columns = [
        { width: 6 },   // N°
        { width: 18 },  // Fecha/Hora
        { width: 30 },  // Descripción
        { width: 12 },  // Tipo
        { width: 20 },  // Origen
        { width: 14 },  // Monto
        { width: 24 },  // Paciente
        { width: 20 },  // Usuario
        { width: 14 },  // Saldo
    ];

    // === GUARDAR EXCEL ===
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fechaActual = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Caja_Central_Cusco_Smile_${fechaActual}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
};
