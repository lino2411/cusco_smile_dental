import ExcelJS from 'exceljs';

// ✅ NUEVA FUNCIÓN: Formatear fecha sin problemas de timezone
const formatearFechaSinTimezone = (fecha) => {
    if (!fecha) return '-';
    const fechaSolo = fecha.split('T')[0]; // "2025-12-15"
    const [year, month, day] = fechaSolo.split('-');
    return `${day}/${month}/${year}`; // "15/12/2025"
};

export const generarExcelListaPagos = async (pagos) => {
    if (!pagos || pagos.length === 0) {
        alert('No hay pagos para exportar');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pagos', {
        properties: { tabColor: { argb: 'FF5DBEAB' } }
    });

    // === Título y Encabezado ===
    worksheet.mergeCells('A1:K1'); // ✅ Cambiado de J1 a K1
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CUSCO SMILE - LISTA DE PAGOS';
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF5DBEAB' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:K2'); // ✅ Cambiado de J2 a K2
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Fecha de exportación: ${new Date().toLocaleDateString('es-PE')}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true };
    dateCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:K3'); // ✅ Cambiado de J3 a K3
    const totalCell = worksheet.getCell('A3');
    totalCell.value = `Total de pagos: ${pagos.length}`;
    totalCell.font = { name: 'Arial', size: 10, bold: true };
    totalCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // === ENCABEZADOS ===
    const headers = [
        'N°', 'Fecha', 'Paciente', 'DNI', 'Tratamiento', 'Costo', 'Pagado', 'Debe', 'Estado', 'Firma Paciente', 'Observaciones' // ✅ Agregada columna "Firma Paciente"
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

    // === DATOS DE PAGOS ===
    pagos.forEach((pago, index) => {
        const debe = (parseFloat(pago.costo) || 0) - (parseFloat(pago.a_cuenta) || 0);

        // ✅ Determinar estado de firma
        const tieneFirma = pago.firma_id ? true : false;
        const estadoFirma = tieneFirma ? 'Sí ✓' : 'No ✗';

        const row = worksheet.addRow([
            index + 1,
            formatearFechaSinTimezone(pago.fecha),
            (pago.pacientes?.nombres || '-') + ' ' + (pago.pacientes?.apellidos || '-'),
            pago.pacientes?.dni || '-',
            pago.tratamiento_realizado || '-',
            pago.costo ? `S/ ${parseFloat(pago.costo).toFixed(2)}` : '-',
            pago.a_cuenta ? `S/ ${parseFloat(pago.a_cuenta).toFixed(2)}` : '-',
            `S/ ${debe.toFixed(2)}`,
            pago.estado === 'pagado'
                ? 'Pagado'
                : pago.estado === 'parcial'
                    ? 'Parcial'
                    : 'Pendiente',
            estadoFirma, // ✅ Agregado estado de firma
            pago.observaciones || '-'
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

            // ✅ Estilos condicionales para columna de Firma (columna 10)
            if (colNumber === 10) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    bold: true,
                    color: { argb: tieneFirma ? 'FF22C55E' : 'FFEF4444' } // Verde o Rojo
                };
            }

            if (index % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }
                };
            }
        });
        row.height = 20;
    });

    worksheet.columns = [
        { width: 6 },   // N°
        { width: 12 },  // Fecha
        { width: 24 },  // Paciente
        { width: 12 },  // DNI
        { width: 25 },  // Tratamiento
        { width: 12 },  // Costo
        { width: 12 },  // Pagado
        { width: 12 },  // Debe
        { width: 12 },  // Estado
        { width: 16 },  // Firma Paciente (nueva columna)
        { width: 24 },  // Observaciones
    ];

    // === GUARDAR EXCEL ===
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const fechaActual = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Lista_Pagos_Cusco_Smile_${fechaActual}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
};
