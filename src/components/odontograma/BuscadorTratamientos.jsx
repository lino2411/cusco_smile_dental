import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';


// Catálogo COMPLETO según Norma Técnica del Odontograma MINSA Perú (44 tratamientos)
const HALLAZGOS_CATALOGO = [
    // ==================== PATOLOGÍAS (ROJO) ====================
    { id: 1, codigo: 'CAR', nombre: 'Caries', categoria: 'patologia', icono: '🦷', colorAzul: false, colorRojo: true },
    { id: 2, codigo: 'FRAC', nombre: 'Fractura', categoria: 'traumatismo', icono: '💥', colorAzul: false, colorRojo: true },
    { id: 3, codigo: 'RR', nombre: 'Remanente Radicular', categoria: 'patologia', sigla: 'RR', icono: '🔻', colorAzul: false, colorRojo: true },
    { id: 4, codigo: 'EXT', nombre: 'Extracción Indicada', categoria: 'cirugia', icono: '❌', colorAzul: false, colorRojo: true },

    // ==================== RESTAURACIONES (AZUL) ====================
    { id: 5, codigo: 'AM', nombre: 'Amalgama', categoria: 'restauracion', sigla: 'AM', icono: '⚫', colorAzul: true, colorRojo: false },
    { id: 6, codigo: 'R', nombre: 'Resina', categoria: 'restauracion', sigla: 'R', icono: '⚪', colorAzul: true, colorRojo: false },
    { id: 7, codigo: 'IV', nombre: 'Ionómero de Vidrio', categoria: 'restauracion', sigla: 'IV', icono: '🔵', colorAzul: true, colorRojo: false },
    { id: 8, codigo: 'IM', nombre: 'Incrustación Metálica', categoria: 'restauracion', sigla: 'IM', icono: '🔶', colorAzul: true, colorRojo: false },
    { id: 9, codigo: 'IE', nombre: 'Incrustación Estética', categoria: 'restauracion', sigla: 'IE', icono: '💎', colorAzul: true, colorRojo: false },
    { id: 10, codigo: 'RTEMP', nombre: 'Restauración Temporal', categoria: 'restauracion', icono: '🟡', colorAzul: false, colorRojo: true },

    // ==================== CORONAS DEFINITIVAS (AZUL) ====================
    { id: 11, codigo: 'CC', nombre: 'Corona Completa', categoria: 'protesis', sigla: 'CC', icono: '👑', colorAzul: true, colorRojo: false },
    { id: 12, codigo: 'CMC', nombre: 'Corona Metal Cerámica', categoria: 'protesis', sigla: 'CMC', icono: '💎', colorAzul: true, colorRojo: false },
    { id: 13, codigo: 'CJ', nombre: 'Corona Jacket', categoria: 'protesis', sigla: 'CJ', icono: '✨', colorAzul: true, colorRojo: false },
    { id: 14, codigo: 'CF', nombre: 'Corona Fenestrada', categoria: 'protesis', sigla: 'CF', icono: '🪟', colorAzul: true, colorRojo: false },
    { id: 15, codigo: 'CV', nombre: 'Corona Veneer', categoria: 'protesis', sigla: 'CV', icono: '😁', colorAzul: true, colorRojo: false },
    { id: 16, codigo: 'CP', nombre: 'Corona Parcial (3/4, 4/5, 7/8)', categoria: 'protesis', sigla: 'CP', icono: '👑', colorAzul: true, colorRojo: false },
    { id: 17, codigo: 'CTEMP', nombre: 'Corona Temporal', categoria: 'protesis', icono: '🟠', colorAzul: false, colorRojo: true },

    // ==================== TRATAMIENTOS PULPARES (AZUL) ====================
    { id: 18, codigo: 'TC', nombre: 'Tratamiento de Conductos', categoria: 'endodoncia', sigla: 'TC', icono: '🔴', colorAzul: true, colorRojo: false },
    { id: 19, codigo: 'PC', nombre: 'Pulpectomía', categoria: 'endodoncia', sigla: 'PC', icono: '🔴', colorAzul: true, colorRojo: false },
    { id: 20, codigo: 'PP', nombre: 'Pulpotomía', categoria: 'endodoncia', sigla: 'PP', icono: '🔴', colorAzul: true, colorRojo: false },

    // ==================== PRÓTESIS (AZUL/ROJO según estado) ====================
    { id: 21, codigo: 'PR', nombre: 'Prótesis Removible', categoria: 'protesis', sigla: 'PR', icono: '🦷', colorAzul: true, colorRojo: true },
    { id: 22, codigo: 'PT', nombre: 'Prótesis Total', categoria: 'protesis', sigla: 'PT', icono: '😁', colorAzul: true, colorRojo: true },
    { id: 23, codigo: 'IMP', nombre: 'Implante', categoria: 'protesis', sigla: 'IMP', icono: '🔩', colorAzul: true, colorRojo: false },

    // ==================== AUSENCIAS (AZUL) ====================
    { id: 24, codigo: 'AUS', nombre: 'Diente Ausente', categoria: 'anomalia', icono: '⬜', colorAzul: true, colorRojo: false },
    { id: 25, codigo: 'EDENT', nombre: 'Edéntulo Total', categoria: 'anomalia', icono: '📏', colorAzul: true, colorRojo: false },

    // ==================== ANOMALÍAS DE FORMA (AZUL) ====================
    { id: 26, codigo: 'MAC', nombre: 'Macrodoncia', categoria: 'anomalia', sigla: 'MAC', icono: '🔍', colorAzul: true, colorRojo: false },
    { id: 27, codigo: 'MIC', nombre: 'Microdoncia', categoria: 'anomalia', sigla: 'MIC', icono: '🔬', colorAzul: true, colorRojo: false },
    { id: 28, codigo: 'CLAV', nombre: 'Diente en Clavija', categoria: 'anomalia', icono: '🔺', colorAzul: true, colorRojo: false },
    { id: 29, codigo: 'GEM', nombre: 'Geminación/Fusión', categoria: 'anomalia', icono: '👥', colorAzul: true, colorRojo: false },

    // ==================== ANOMALÍAS DE POSICIÓN (AZUL) ====================
    { id: 30, codigo: 'E', nombre: 'Diente Ectópico', categoria: 'anomalia', sigla: 'E', icono: '↗️', colorAzul: true, colorRojo: false },
    { id: 31, codigo: 'EXT', nombre: 'Diente Extruido', categoria: 'anomalia', icono: '⬆️', colorAzul: true, colorRojo: false },
    { id: 32, codigo: 'INT', nombre: 'Diente Intruido', categoria: 'anomalia', icono: '⬇️', colorAzul: true, colorRojo: false },
    { id: 33, codigo: 'GIRO', nombre: 'Giroversión', categoria: 'anomalia', icono: '🔄', colorAzul: true, colorRojo: false },
    { id: 34, codigo: 'MIG', nombre: 'Migración', categoria: 'anomalia', icono: '➡️', colorAzul: true, colorRojo: false },
    { id: 35, codigo: 'TRANS', nombre: 'Transposición', categoria: 'anomalia', icono: '🔀', colorAzul: true, colorRojo: false },

    // ==================== ANOMALÍAS DE NÚMERO (AZUL) ====================
    { id: 36, codigo: 'S', nombre: 'Supernumerario', categoria: 'anomalia', sigla: 'S', icono: '➕', colorAzul: true, colorRojo: false },

    // ==================== ANOMALÍAS DE ERUPCIÓN (AZUL) ====================
    { id: 37, codigo: 'I', nombre: 'Impactación', categoria: 'anomalia', sigla: 'I', icono: '🚫', colorAzul: true, colorRojo: false },
    { id: 38, codigo: 'SI', nombre: 'Semi-impactación', categoria: 'anomalia', sigla: 'SI', icono: '🔻', colorAzul: true, colorRojo: false },

    // ==================== CARACTERÍSTICAS (AZUL) ====================
    { id: 39, codigo: 'DIS', nombre: 'Discromía', categoria: 'anomalia', sigla: 'DIS', icono: '🟡', colorAzul: true, colorRojo: false },
    { id: 40, codigo: 'DES', nombre: 'Desgaste Oclusal/Incisal', categoria: 'anomalia', sigla: 'DES', icono: '⚡', colorAzul: true, colorRojo: false },
    { id: 41, codigo: 'DIAST', nombre: 'Diastema', categoria: 'anomalia', icono: '📏', colorAzul: true, colorRojo: false },
    { id: 42, codigo: 'MOV', nombre: 'Movilidad', categoria: 'anomalia', sigla: 'M', icono: '↔️', colorAzul: true, colorRojo: false },

    // ==================== ORTODONCIA (AZUL/ROJO según estado) ====================
    { id: 43, codigo: 'AOF', nombre: 'Aparato Ortodóntico Fijo', categoria: 'ortodoncia', icono: '🦷', colorAzul: true, colorRojo: true },
    { id: 44, codigo: 'AOR', nombre: 'Aparato Ortodóntico Removible', categoria: 'ortodoncia', icono: '🦷', colorAzul: true, colorRojo: true },
];


const categorias = {
    todas: 'Todas',
    patologia: 'Patologías',
    restauracion: 'Restauraciones',
    protesis: 'Prótesis',
    endodoncia: 'Endodoncia',
    cirugia: 'Cirugía',
    anomalia: 'Anomalías',
    traumatismo: 'Traumatismos',
    ortodoncia: 'Ortodoncia'
};


const BuscadorTratamientos = ({ onSeleccionar, tratamientoSeleccionado, onCerrar }) => {
    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas');


    const tratamientosFiltrados = useMemo(() => {
        let lista = HALLAZGOS_CATALOGO;


        // Filtrar por búsqueda
        if (busqueda.trim()) {
            const termino = busqueda.toLowerCase();
            lista = lista.filter(h =>
                h.nombre.toLowerCase().includes(termino) ||
                (h.sigla && h.sigla.toLowerCase().includes(termino)) ||
                (h.codigo && h.codigo.toLowerCase().includes(termino))
            );
        }


        // Filtrar por categoría
        if (categoriaFiltro !== 'todas') {
            lista = lista.filter(h => h.categoria === categoriaFiltro);
        }


        return lista;
    }, [busqueda, categoriaFiltro]);


    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-w-md w-full">


            {/* HEADER */}
            <div className="bg-gradient-to-r from-smile_600 to-smile_700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Buscar Tratamiento</h3>
                </div>
                {onCerrar && (
                    <button
                        onClick={onCerrar}
                        className="p-1 hover:bg-smile_800 rounded transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>


            {/* CONTADOR */}
            <div className="bg-smile_50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-smile_700 text-center">
                    📋 {HALLAZGOS_CATALOGO.length} tratamientos según Norma Técnica MINSA
                </p>
            </div>


            {/* BUSCADOR */}
            <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, sigla o código..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-smile_600 focus:ring-2 focus:ring-smile_100 outline-none transition-all text-sm"
                        autoFocus
                    />
                </div>


                {/* FILTRO POR CATEGORÍA */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        value={categoriaFiltro}
                        onChange={(e) => setCategoriaFiltro(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-smile_600 focus:ring-2 focus:ring-smile_100 outline-none transition-all text-sm appearance-none bg-white cursor-pointer"
                    >
                        {Object.entries(categorias).map(([valor, nombre]) => (
                            <option key={valor} value={valor}>{nombre}</option>
                        ))}
                    </select>
                </div>
            </div>


            {/* LISTA DE TRATAMIENTOS */}
            <div className="flex-1 overflow-y-auto max-h-96">
                {tratamientosFiltrados.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {tratamientosFiltrados.map(tratamiento => (
                            <button
                                key={tratamiento.id}
                                onClick={() => onSeleccionar(tratamiento)}
                                className={`
                  w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left
                  ${tratamientoSeleccionado?.id === tratamiento.id ? 'bg-smile_50 border-l-4 border-smile_600' : ''}
                `}
                            >
                                <span className="text-2xl flex-shrink-0">{tratamiento.icono}</span>


                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {tratamiento.nombre}
                                    </p>
                                    {tratamiento.sigla && (
                                        <p className="text-xs text-gray-500 font-mono">
                                            Sigla: {tratamiento.sigla}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 capitalize">
                                        {categorias[tratamiento.categoria]}
                                    </p>
                                </div>


                                <div className="flex gap-1 flex-shrink-0">
                                    {tratamiento.colorAzul && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center" title="Azul: Tratamiento existente">
                                            <span className="text-white text-xs font-bold">A</span>
                                        </div>
                                    )}
                                    {tratamiento.colorRojo && (
                                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center" title="Rojo: Plan/Patología">
                                            <span className="text-white text-xs font-bold">R</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            No se encontraron resultados
                        </p>
                        <p className="text-xs text-gray-500">
                            Intenta con otros términos de búsqueda
                        </p>
                    </div>
                )}
            </div>


            {/* FOOTER - Leyenda */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span>Azul: Existente</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span>Rojo: Plan/Hallazgo</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default BuscadorTratamientos;
