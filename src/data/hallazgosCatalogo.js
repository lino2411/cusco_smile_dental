// ========================================
// CATÁLOGO DE 33 HALLAZGOS ODONTOLÓGICOS
// Según Norma Técnica del Odontograma (MINSA/Colegio Odontológico del Perú)
// ========================================

export const CATEGORIAS_HALLAZGOS = {
    RESTAURACION: 'restauracion',
    CORONA: 'corona',
    PULPAR: 'pulpar',
    PATOLOGIA: 'patologia',
    ANOMALIA: 'anomalia',
    ESTADO: 'estado',
    PROTESIS: 'protesis',
    ORTODONCIA: 'ortodoncia',
    TRATAMIENTO: 'tratamiento'
};

export const HALLAZGOS_CATALOGO = [
    // ============ RESTAURACIONES (6) ============
    {
        id: 1,
        codigo: 'restauracion_amalgama',
        nombre: 'Restauración con Amalgama',
        sigla: 'AM',
        categoria: CATEGORIAS_HALLAZGOS.RESTAURACION,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: true,
        descripcion: 'Restauración con amalgama de plata pintada en azul',
        icono: '🦷'
    },
    {
        id: 2,
        codigo: 'restauracion_resina',
        nombre: 'Restauración con Resina',
        sigla: 'R',
        categoria: CATEGORIAS_HALLAZGOS.RESTAURACION,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: true,
        descripcion: 'Restauración con resina compuesta pintada en azul',
        icono: '🦷'
    },
    {
        id: 3,
        codigo: 'restauracion_ionomero',
        nombre: 'Restauración con Ionómero',
        sigla: 'IV',
        categoria: CATEGORIAS_HALLAZGOS.RESTAURACION,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: true,
        descripcion: 'Restauración con ionómero de vidrio pintada en azul',
        icono: '🦷'
    },
    {
        id: 4,
        codigo: 'incrustacion_metalica',
        nombre: 'Incrustación Metálica',
        sigla: 'IM',
        categoria: CATEGORIAS_HALLAZGOS.RESTAURACION,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: true,
        descripcion: 'Incrustación metálica pintada en azul',
        icono: '🦷'
    },
    {
        id: 5,
        codigo: 'incrustacion_estetica',
        nombre: 'Incrustación Estética',
        sigla: 'IE',
        categoria: CATEGORIAS_HALLAZGOS.RESTAURACION,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: true,
        descripcion: 'Incrustación estética (cerámica/resina) pintada en azul',
        icono: '🦷'
    },
    {
        id: 6,
        codigo: 'restauracion_temporal',
        nombre: 'Restauración Temporal',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.RESTAURACION,
        colorAzul: false,
        colorRojo: true,
        permiteSuperficies: true,
        descripcion: 'Restauración temporal pintada en rojo',
        icono: '⚠️'
    },

    // ============ CORONAS (7) ============
    {
        id: 7,
        codigo: 'corona_completa',
        nombre: 'Corona Completa',
        sigla: 'CC',
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Circunferencia azul alrededor de la corona',
        icono: '👑'
    },
    {
        id: 8,
        codigo: 'corona_fenestrada',
        nombre: 'Corona Fenestrada',
        sigla: 'CF',
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Corona metálica con ventana vestibular',
        icono: '👑'
    },
    {
        id: 9,
        codigo: 'corona_metal_ceramica',
        nombre: 'Corona Metal Cerámica',
        sigla: 'CMC',
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Corona con núcleo metálico revestido con cerámica',
        icono: '👑'
    },
    {
        id: 10,
        codigo: 'corona_jacket',
        nombre: 'Corona Jacket',
        sigla: 'CJ',
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Corona estética libre de metal',
        icono: '👑'
    },
    {
        id: 11,
        codigo: 'corona_veneer',
        nombre: 'Corona Veneer',
        sigla: 'CV',
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Corona completa con frente estético',
        icono: '👑'
    },
    {
        id: 12,
        codigo: 'corona_parcial',
        nombre: 'Corona Parcial',
        sigla: '3/4',
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Coronas 3/4, 4/5, 7/8 (parcial metálica)',
        icono: '👑'
    },
    {
        id: 13,
        codigo: 'corona_temporal',
        nombre: 'Corona Temporal',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.CORONA,
        colorAzul: false,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Circunferencia roja alrededor de corona (provisoria)',
        icono: '⚠️'
    },

    // ============ TRATAMIENTO PULPAR (3) ============
    {
        id: 14,
        codigo: 'tratamiento_conductos',
        nombre: 'Tratamiento de Conductos',
        sigla: 'TC',
        categoria: CATEGORIAS_HALLAZGOS.PULPAR,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Línea vertical azul en raíz con sigla TC',
        icono: '🔵'
    },
    {
        id: 15,
        codigo: 'pulpectomia',
        nombre: 'Pulpectomía',
        sigla: 'PC',
        categoria: CATEGORIAS_HALLAZGOS.PULPAR,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Línea vertical azul en raíz con sigla PC',
        icono: '🔵'
    },
    {
        id: 16,
        codigo: 'pulpotomia',
        nombre: 'Pulpotomía',
        sigla: 'PP',
        categoria: CATEGORIAS_HALLAZGOS.PULPAR,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Línea vertical azul en raíz con sigla PP',
        icono: '🔵'
    },

    // ============ PATOLOGÍAS (4) ============
    {
        id: 17,
        codigo: 'caries',
        nombre: 'Caries',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.PATOLOGIA,
        colorAzul: false,
        colorRojo: true,
        permiteSuperficies: true,
        descripcion: 'Lesión cariosa pintada en rojo en superficies comprometidas',
        icono: '🔴'
    },
    {
        id: 18,
        codigo: 'fractura',
        nombre: 'Fractura',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.PATOLOGIA,
        colorAzul: false,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Línea roja en sentido de fractura (corona/raíz)',
        icono: '⚡'
    },
    {
        id: 19,
        codigo: 'movilidad',
        nombre: 'Movilidad',
        sigla: 'M1',
        categoria: CATEGORIAS_HALLAZGOS.PATOLOGIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'M seguido del grado (M1, M2, M3)',
        icono: '〰️'
    },
    {
        id: 20,
        codigo: 'remanente_radicular',
        nombre: 'Remanente Radicular',
        sigla: 'RR',
        categoria: CATEGORIAS_HALLAZGOS.PATOLOGIA,
        colorAzul: false,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Fragmento radicular en alveolo (RR en rojo sobre raíz)',
        icono: '🔴'
    },

    // ============ ANOMALÍAS (12) ============
    {
        id: 21,
        codigo: 'diastema',
        nombre: 'Diastema',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Paréntesis invertido entre piezas con espacio',
        icono: '↔️'
    },
    {
        id: 22,
        codigo: 'diente_discromico',
        nombre: 'Diente Discrómico',
        sigla: 'DIS',
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Alteraciones de color del diente',
        icono: '🎨'
    },
    {
        id: 23,
        codigo: 'diente_ectopico',
        nombre: 'Diente Ectópico',
        sigla: 'E',
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Diente erupcionado fuera del lugar que corresponde',
        icono: '↗️'
    },
    {
        id: 24,
        codigo: 'diente_clavija',
        nombre: 'Diente en Clavija',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Triángulo azul circunscribiendo el número del diente',
        icono: '🔺'
    },
    {
        id: 25,
        codigo: 'diente_extruido',
        nombre: 'Diente Extruido',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Flecha azul hacia el plano oclusal',
        icono: '⬆️'
    },
    {
        id: 26,
        codigo: 'diente_intruido',
        nombre: 'Diente Intruido',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Flecha azul vertical hacia el ápice',
        icono: '⬇️'
    },
    {
        id: 27,
        codigo: 'desgaste_oclusal',
        nombre: 'Desgaste Oclusal/Incisal',
        sigla: 'DES',
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Pérdida gradual de estructura dentaria (superficies lisas)',
        icono: '📉'
    },
    {
        id: 28,
        codigo: 'geminacion_fusion',
        nombre: 'Geminación/Fusión',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Dos circunferencias interceptadas en azul',
        icono: '⚭'
    },
    {
        id: 29,
        codigo: 'giroversion',
        nombre: 'Giroversión',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Flecha curva azul a nivel del plano oclusal',
        icono: '↻'
    },
    {
        id: 30,
        codigo: 'macrodoncia',
        nombre: 'Macrodoncia',
        sigla: 'MAC',
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Pieza aumentada en relación a volumen normal',
        icono: '⬆️'
    },
    {
        id: 31,
        codigo: 'microdoncia',
        nombre: 'Microdoncia',
        sigla: 'MIC',
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Pieza disminuida en relación a volumen normal',
        icono: '⬇️'
    },
    {
        id: 32,
        codigo: 'migracion',
        nombre: 'Migración',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Flecha horizontal azul siguiendo sentido de migración',
        icono: '➡️'
    },
    {
        id: 33,
        codigo: 'transposicion',
        nombre: 'Transposición',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Dos flechas curvas azules entrecruzadas',
        icono: '⇄'
    },
    {
        id: 34,
        codigo: 'supernumerario',
        nombre: 'Supernumerario',
        sigla: 'S',
        categoria: CATEGORIAS_HALLAZGOS.ANOMALIA,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'S en circunferencia azul entre ápices adyacentes',
        icono: '➕'
    },

    // ============ ESTADOS (4) ============
    {
        id: 35,
        codigo: 'diente_ausente',
        nombre: 'Diente Ausente',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ESTADO,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Aspa (X) azul sobre la pieza que no está presente',
        icono: '❌'
    },
    {
        id: 36,
        codigo: 'impactacion',
        nombre: 'Impactación',
        sigla: 'I',
        categoria: CATEGORIAS_HALLAZGOS.ESTADO,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Pieza que no erupcionó (sin comunicación con cavidad bucal)',
        icono: '🔒'
    },
    {
        id: 37,
        codigo: 'semi_impactacion',
        nombre: 'Semi-impactación',
        sigla: 'SI',
        categoria: CATEGORIAS_HALLAZGOS.ESTADO,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Pieza que no erupcionó totalmente',
        icono: '🔓'
    },
    {
        id: 38,
        codigo: 'edentulo_total',
        nombre: 'Edéntulo Total',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ESTADO,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Línea horizontal azul sobre coronas del maxilar edéntulo',
        icono: '➖'
    },

    // ============ PRÓTESIS (2) ============
    {
        id: 39,
        codigo: 'protesis_removible',
        nombre: 'Prótesis Removible',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.PROTESIS,
        colorAzul: true,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Dos líneas horizontales paralelas a nivel de ápices',
        icono: '🦷'
    },
    {
        id: 40,
        codigo: 'protesis_total',
        nombre: 'Prótesis Total',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.PROTESIS,
        colorAzul: true,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Dos líneas paralelas horizontales sobre coronas',
        icono: '🦷'
    },

    // ============ ORTODONCIA (2) ============
    {
        id: 41,
        codigo: 'aparato_fijo',
        nombre: 'Aparato Ortodóntico Fijo',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ORTODONCIA,
        colorAzul: true,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Cuadrados con cruz en ápices unidos por línea recta',
        icono: '🔧'
    },
    {
        id: 42,
        codigo: 'aparato_removible',
        nombre: 'Aparato Ortodóntico Removible',
        sigla: null,
        categoria: CATEGORIAS_HALLAZGOS.ORTODONCIA,
        colorAzul: true,
        colorRojo: true,
        permiteSuperficies: false,
        descripcion: 'Línea en zig-zag a altura de ápices',
        icono: '〰️'
    },

    // ============ TRATAMIENTOS (1) ============
    {
        id: 43,
        codigo: 'implante',
        nombre: 'Implante',
        sigla: 'IMP',
        categoria: CATEGORIAS_HALLAZGOS.TRATAMIENTO,
        colorAzul: true,
        colorRojo: false,
        permiteSuperficies: false,
        descripcion: 'Dispositivo mecánico que sustituye raíz perdida',
        icono: '🔩'
    }
];

// ============ FUNCIONES AUXILIARES ============

export const obtenerHallazgoPorCodigo = (codigo) => {
    return HALLAZGOS_CATALOGO.find(h => h.codigo === codigo);
};

export const obtenerHallazgosPorCategoria = (categoria) => {
    return HALLAZGOS_CATALOGO.filter(h => h.categoria === categoria);
};

export const obtenerHallazgosQuePermitanSuperficies = () => {
    return HALLAZGOS_CATALOGO.filter(h => h.permiteSuperficies);
};

export const buscarHallazgos = (termino) => {
    const terminoLower = termino.toLowerCase();
    return HALLAZGOS_CATALOGO.filter(h =>
        h.nombre.toLowerCase().includes(terminoLower) ||
        (h.sigla && h.sigla.toLowerCase().includes(terminoLower)) ||
        h.descripcion.toLowerCase().includes(terminoLower)
    );
};

export const obtenerCategorias = () => {
    const categoriasUnicas = [...new Set(HALLAZGOS_CATALOGO.map(h => h.categoria))];
    return categoriasUnicas.map(cat => ({
        valor: cat,
        etiqueta: cat.charAt(0).toUpperCase() + cat.slice(1),
        cantidad: HALLAZGOS_CATALOGO.filter(h => h.categoria === cat).length
    }));
};

export const obtenerNombresCategoriasLegibles = {
    [CATEGORIAS_HALLAZGOS.RESTAURACION]: 'Restauraciones',
    [CATEGORIAS_HALLAZGOS.CORONA]: 'Coronas',
    [CATEGORIAS_HALLAZGOS.PULPAR]: 'Tratamiento Pulpar',
    [CATEGORIAS_HALLAZGOS.PATOLOGIA]: 'Patologías',
    [CATEGORIAS_HALLAZGOS.ANOMALIA]: 'Anomalías',
    [CATEGORIAS_HALLAZGOS.ESTADO]: 'Estados',
    [CATEGORIAS_HALLAZGOS.PROTESIS]: 'Prótesis',
    [CATEGORIAS_HALLAZGOS.ORTODONCIA]: 'Ortodoncia',
    [CATEGORIAS_HALLAZGOS.TRATAMIENTO]: 'Tratamientos'
};
