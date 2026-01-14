import ExcelJS from 'exceljs';

export const generarExcelListaPacientes = async (pacientes) => {
    if (!pacientes || pacientes.length === 0) {
        alert('No hay pacientes para exportar');
        return;
    }

    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pacientes', {
        properties: { tabColor: { argb: 'FF5DBEAB' } }
    });

    // ===== TÍTULO Y ENCABEZADO =====
    worksheet.mergeCells('A1:M1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CUSCO SMILE - LISTA DE PACIENTES';
    titleCell.font = { 
        name: 'Arial', 
        size: 16, 
        bold: true, 
        color: { argb: 'FF5DBEAB' } 
    };
    titleCell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
    };
    worksheet.getRow(1).height = 30;

    // Fecha de exportación
    worksheet.mergeCells('A2:M2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Fecha de exportación: ${new Date().toLocaleDateString('es-PE')}`;
    dateCell.font = { 
        name: 'Arial', 
        size: 10, 
        italic: true 
    };
    dateCell.alignment = { 
        horizontal: 'center' 
    };

    // Total de pacientes
    worksheet.mergeCells('A3:M3');
    const totalCell = worksheet.getCell('A3');
    totalCell.value = `Total de pacientes: ${pacientes.length}`;
    totalCell.font = { 
        name: 'Arial', 
        size: 10, 
        bold: true 
    };
    totalCell.alignment = { 
        horizontal: 'center' 
    };

    // Fila vacía
    worksheet.addRow([]);

    // ===== ENCABEZADOS DE COLUMNAS =====
    const headers = [
        'N°', 'DNI', 'Nombres', 'Apellidos', 'Sexo', 
        'Fecha Nacimiento', 'Edad', 'Celular', 'Celular Emergencia',
        'Dirección', 'Procedencia', 'Ocupación', 'Fecha Registro'
    ];

    const headerRow = worksheet.addRow(headers);
    
    // Estilo del encabezado
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF5DBEAB' } // Color Cusco Smile
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' } // Blanco
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    headerRow.height = 25;

    // ===== DATOS DE LOS PACIENTES =====
    pacientes.forEach((paciente, index) => {
        const row = worksheet.addRow([
            index + 1,
            paciente.dni || '-',
            paciente.nombres || '-',
            paciente.apellidos || '-',
            paciente.sexo === 'Masculino' ? 'Masculino' : paciente.sexo === 'Femenino' ? 'Femenino' : paciente.sexo || '-',
            paciente.fecha_nacimiento 
                ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-PE')
                : '-',
            paciente.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : '-',
            paciente.celular || '-',
            paciente.celular_emergencia || '-',
            paciente.direccion || '-',
            paciente.procedencia || '-',
            paciente.ocupacion || '-',
            paciente.fecha_registro 
                ? new Date(paciente.fecha_registro).toLocaleDateString('es-PE')
                : '-'
        ]);

        // Estilo de las filas de datos
        row.eachCell((cell, colNumber) => {
            cell.font = {
                name: 'Arial',
                size: 10
            };
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

            // Alternar colores de filas
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

    // ===== AJUSTAR ANCHOS DE COLUMNA =====
    worksheet.columns = [
        { width: 6 },   // N°
        { width: 12 },  // DNI
        { width: 20 },  // Nombres
        { width: 20 },  // Apellidos
        { width: 12 },  // Sexo
        { width: 16 },  // Fecha Nacimiento
        { width: 8 },   // Edad
        { width: 14 },  // Celular
        { width: 18 },  // Celular Emergencia
        { width: 35 },  // Dirección
        { width: 15 },  // Procedencia
        { width: 18 },  // Ocupación
        { width: 16 },  // Fecha Registro
    ];

    // ===== GUARDAR ARCHIVO =====
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const fechaActual = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Lista_Pacientes_Cusco_Smile_${fechaActual}.xlsx`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
};

// Función auxiliar para calcular edad
const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
};
