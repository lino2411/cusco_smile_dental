import { useState } from 'react';
import { Filter, Download, FileText, X, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FiltrosGlobales({
    onAplicarFiltros,
    onLimpiar,
    onExportarPDF,
    onExportarExcel,
    dentistas,
    cargando
}) {
    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: '',
        dentistaId: ''
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleAplicar = () => {
        onAplicarFiltros(filtros);
    };

    const handleLimpiar = () => {
        setFiltros({
            fechaInicio: '',
            fechaFin: '',
            dentistaId: ''
        });
        onLimpiar();
        setMostrarFiltros(false);
    };

    const hayFiltrosAplicados = filtros.fechaInicio || filtros.fechaFin || filtros.dentistaId;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-smile_100 rounded-xl shadow-lg p-5 border border-gray-100"
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Título y botón de filtros */}
                <div className="flex items-center gap-3 flex-1">
                    <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${mostrarFiltros
                            ? 'bg-smile_600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span className="hidden sm:inline">Filtros</span>
                        {hayFiltrosAplicados && (
                            <span className="bg-white text-smile_600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {[filtros.fechaInicio, filtros.fechaFin, filtros.dentistaId].filter(Boolean).length}
                            </span>
                        )}
                    </button>

                    {hayFiltrosAplicados && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={handleLimpiar}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all font-medium"
                        >
                            <X className="w-5 h-5" />
                            <span className="hidden sm:inline">Limpiar</span>
                        </motion.button>
                    )}
                </div>

                {/* Botones de exportación */}
                <div className="flex items-center gap-3 flex-wrap">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExportarPDF}
                        disabled={cargando}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                    >
                        <FileText className="w-5 h-5" />
                        <span className="hidden sm:inline">PDF</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExportarExcel}
                        disabled={cargando}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                    >
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">Excel</span>
                    </motion.button>
                </div>
            </div>

            {/* Panel de filtros desplegable */}
            <AnimatePresence>
                {mostrarFiltros && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-5 mt-5 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Fecha Inicio */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 text-smile_600" />
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaInicio"
                                        value={filtros.fechaInicio}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-smile_500 focus:ring-2 focus:ring-smile_200 transition-all"
                                    />
                                </div>

                                {/* Fecha Fin */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 text-smile_600" />
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaFin"
                                        value={filtros.fechaFin}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-smile_500 focus:ring-2 focus:ring-smile_200 transition-all"
                                    />
                                </div>

                                {/* Dentista */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <User className="w-4 h-4 text-smile_600" />
                                        Dentista
                                    </label>
                                    <select
                                        name="dentistaId"
                                        value={filtros.dentistaId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-smile_500 focus:ring-2 focus:ring-smile_200 transition-all bg-white"
                                    >
                                        <option value="">Todos los dentistas</option>
                                        {dentistas.map(dentista => (
                                            <option key={dentista.id} value={dentista.id}>
                                                {dentista.nombre_completo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Botón Aplicar */}
                            <div className="flex justify-end mt-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAplicar}
                                    disabled={cargando}
                                    className="px-6 py-2.5 bg-smile_600 hover:bg-smile_700 disabled:bg-gray-300 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                                >
                                    Aplicar Filtros
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
