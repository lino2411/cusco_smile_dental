import ExcelJS from 'exceljs';
import Swal from 'sweetalert2'; // ✅ Importamos SweetAlert

export const generarExcelCitas = async (citas, filtros = {}) => {
    if (!citas || citas.length === 0) {
        Swal.fire({
            title: 'Sin datos',
            text: 'No hay citas para exportar en este rango.',
            icon: 'info',
            background: '#111827',
            color: '#F9FAFB'
        });
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Citas', {
        properties: { tabColor: { argb: 'FF5DBEAB' } }
    });

    // === Título y Encabezado ===
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CUSCO SMILE - AGENDA DE CITAS';
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF5DBEAB' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Fecha de exportación
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    const fechaExportacion = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    dateCell.value = `Generado el: ${fechaExportacion}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center' };

    // Rango de fechas filtradas
    if (filtros.inicio || filtros.fin) {
        worksheet.mergeCells('A3:H3');
        const rangoCell = worksheet.getCell('A3');
        const inicio = filtros.inicio ? filtros.inicio.split('-').reverse().join('/') : 'Inicio';
        const fin = filtros.fin ? filtros.fin.split('-').reverse().join('/') : 'Fin';
        rangoCell.value = `Filtro: ${inicio} al ${fin}`;
        rangoCell.font = { name: 'Arial', size: 10, bold: true };
        rangoCell.alignment = { horizontal: 'center' };
    }

    worksheet.mergeCells('A4:H4');
    const totalCell = worksheet.getCell('A4');
    totalCell.value = `Total de registros: ${citas.length}`;
    totalCell.font = { name: 'Arial', size: 10, bold: true };
    totalCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]); // Espacio vacío

    // === ENCABEZADOS DE COLUMNA ===
    const headers = ['N°', 'Paciente', 'Motivo', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Dentista', 'Estado'];
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF5DBEAB' } // Color corporativo
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' } // Blanco
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF5DBEAB' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'medium', color: { argb: 'FF4CA694' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
    });

    headerRow.height = 25;

    // === DATOS DE LAS CITAS ===
    citas.forEach((cita, index) => {
        // 1. Limpieza y formateo de Fecha (DD-MM-YYYY)
        const fecha = cita.fecha ? String(cita.fecha).split('T')[0].split('-').reverse().join('-') : '-';

        // 2. Limpieza de Hora (HH:MM) - Quitamos segundos si los tiene
        const horaInicio = cita.hora_inicio ? cita.hora_inicio.slice(0, 5) : '-';
        const horaFin = cita.hora_fin ? cita.hora_fin.slice(0, 5) : '-';

        // 3. Obtención correcta del Dentista
        const dentistaNombre = cita.dentista?.nombre_completo || cita.usuarios?.nombre_completo || 'No asignado';

        // 4. Formato de Estado (Capitalizado)
        const estado = cita.estado
            ? cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1).replace('_', ' ')
            : '-';

        const row = worksheet.addRow([
            index + 1,
            cita.nombre_paciente || 'Sin nombre',
            cita.motivo || '-',
            fecha,
            horaInicio,
            horaFin,
            dentistaNombre,
            estado
        ]);

        // Estilos por celda
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.alignment = {
                horizontal: colNumber === 1 || colNumber >= 4 ? 'center' : 'left',
                vertical: 'middle'
            };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } }
            };

            // Color de fondo alternado (Cebra)
            if (index % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFBFBFB' }
                };
            }

            // Colores condicionales para la columna ESTADO (columna 8)
            if (colNumber === 8) {
                cell.font = { ...cell.font, bold: true };
                const estadoLower = cita.estado?.toLowerCase();

                if (estadoLower === 'confirmada') {
                    cell.font.color = { argb: 'FF059669' }; // Verde
                } else if (estadoLower === 'cancelada') {
                    cell.font.color = { argb: 'FFDC2626' }; // Rojo
                } else if (estadoLower === 'pendiente') {
                    cell.font.color = { argb: 'FF0891B2' }; // Cyan
                } else if (estadoLower === 'atendida') {
                    cell.font.color = { argb: 'FF2563EB' }; // Azul
                } else if (estadoLower === 'en_consulta') {
                    cell.font.color = { argb: 'FF9333EA' }; // Morado
                } else {
                    cell.font.color = { argb: 'FFD97706' }; // Amarillo/Naranja
                }
            }
        });

        row.height = 20;
    });

    // === Ancho de columnas automático ===
    worksheet.columns = [
        { width: 6 },   // N°
        { width: 30 },  // Paciente
        { width: 25 },  // Motivo
        { width: 15 },  // Fecha
        { width: 12 },  // Hora Inicio
        { width: 12 },  // Hora Fin
        { width: 25 },  // Dentista
        { width: 15 }   // Estado
    ];

    // === GUARDAR EXCEL ===
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fechaArchivo = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Citas_${fechaArchivo}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();

    // Limpieza de memoria
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 100);

    // ✅ ALERTA DE ÉXITO INTEGRADA
    Swal.fire({
        title: '¡Excel Generado!',
        text: 'El reporte de citas se ha descargado correctamente.',
        icon: 'success',
        background: '#111827',
        color: '#F9FAFB',
        timer: 2000,
        showConfirmButton: false
    });
};