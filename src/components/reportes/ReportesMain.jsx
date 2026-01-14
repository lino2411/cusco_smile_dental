import { useState, useEffect } from 'react';
import {
    BarChart3,
    DollarSign,
    Users,
    Calendar,
    TrendingUp,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';


// ==================== COMPONENTES BASE ====================
import ReporteCard from './ReporteCard';
import FiltrosGlobales from './FiltrosGlobales';


// ==================== FASE 2: GRÁFICOS ====================
import GraficoCitas from './GraficoCitas';
import GraficoIngresos from './GraficoIngresos';


// ==================== FASE 3: REPORTES AVANZADOS ====================
import TopTratamientos from './TopTratamientos';
import ProductividadDentistas from './ProductividadDentistas';
import DistribucionEstados from './DistribucionEstados';
import ResumenFinanciero from './ResumenFinanciero';


// ==================== SERVICIOS ====================
import { obtenerResumenEjecutivo } from '../../services/reportes/reportesService';
import { obtenerUsuariosPorRol } from '../../services/usuarios/usuariosService';


// ==================== UTILS EXPORTACION DE PDF Y EXCEL ====================
import { generarPDFReporteCompleto } from '../../utils/reportes/reportesPDFGenerator';
import { generarExcelReporteCompleto } from '../../utils/reportes/reportesExcelGenerator';

// ==================== NUEVOS GRÁFICOS AVANZADOS ====================
import GraficoComparacionMensual from './GraficoComparacionMensual';
import RankingPacientesTop from './RankingPacientesTop';
import ProyeccionIngresos from './ProyeccionIngresos';
import CitasPorDiaSemana from './CitasPorDiaSemana';


/**
 * Componente principal del módulo de Reportes
 * Integra todas las fases del sistema de reportes
 */
export default function ReportesMain() {
    const [datos, setDatos] = useState(null);
    const [dentistas, setDentistas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtrosAplicados, setFiltrosAplicados] = useState({});


    useEffect(() => {
        cargarDatosIniciales();
    }, []);


    const cargarDatosIniciales = async () => {
        try {
            setCargando(true);

            const [listaDentistas, resumen] = await Promise.all([
                obtenerUsuariosPorRol('odontologo'),
                obtenerResumenEjecutivo()
            ]);

            setDentistas(listaDentistas || []);
            setDatos(resumen);
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        } finally {
            setCargando(false);
        }
    };


    const handleAplicarFiltros = async (filtros) => {
        try {
            setCargando(true);
            setFiltrosAplicados(filtros);

            const resumen = await obtenerResumenEjecutivo({
                fechaInicio: filtros.fechaInicio,
                fechaFin: filtros.fechaFin,
                dentistaId: filtros.dentistaId
            });

            setDatos(resumen);
        } catch (error) {
            console.error('Error aplicando filtros:', error);
        } finally {
            setCargando(false);
        }
    };


    const handleLimpiarFiltros = () => {
        setFiltrosAplicados({});
        cargarDatosIniciales();
    };


    // ===== ✅ FUNCIONES DE EXPORTACIÓN CON FILTROS =====
    const handleExportarPDF = () => {
        if (!datos) {
            alert('No hay datos para exportar');
            return;
        }

        // ✅ IMPORTANTE: Pasar datos + filtros aplicados
        generarPDFReporteCompleto(
            datos,
            filtrosAplicados || {
                fechaInicio: '',
                fechaFin: '',
                dentistaId: ''
            }
        );
    };

    const handleExportarExcel = () => {
        if (!datos) {
            alert('No hay datos para exportar');
            return;
        }

        // ✅ IMPORTANTE: Pasar datos + filtros aplicados
        generarExcelReporteCompleto(
            datos,
            filtrosAplicados || {
                fechaInicio: '',
                fechaFin: '',
                dentistaId: ''
            }
        );
    };

    const formatearMonto = (monto) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2
        }).format(monto);
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ==================== HEADER CON COLORES SMILE ==================== */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-xl p-6 border border-smile_500/20"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                                >
                                    <BarChart3 className="w-7 h-7" />
                                </motion.div>
                                Centro de Reportes
                            </h1>
                            <p className="text-smile_100 text-sm ml-1">
                                Análisis completo y detallado de tu clínica dental
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/20">
                            <p className="text-white/70 text-xs font-medium mb-0.5">Última actualización</p>
                            <p className="text-white font-bold text-sm">
                                {new Date().toLocaleString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ==================== FILTROS GLOBALES ==================== */}
                <FiltrosGlobales
                    onAplicarFiltros={handleAplicarFiltros}
                    onLimpiar={handleLimpiarFiltros}
                    onExportarPDF={handleExportarPDF}
                    onExportarExcel={handleExportarExcel}
                    dentistas={dentistas}
                    cargando={cargando}
                />

                {/* ==================== CONTENIDO PRINCIPAL ==================== */}
                {cargando ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-smile_200 border-t-smile_600 mx-auto mb-4"></div>
                                <Activity className="w-6 h-6 text-smile_600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-gray-600 font-medium">Cargando reportes...</p>
                            <p className="text-gray-400 text-sm mt-1">Analizando datos de la clínica</p>
                        </div>
                    </div>
                ) : datos ? (
                    <>
                        {/* ==================== FASE 1: CARDS DE RESUMEN ==================== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <ReporteCard
                                title="Citas Programadas"
                                value={datos.citas.total}
                                subtitle={`${datos.citas.atendidas} ya atendidas`}
                                percentage={datos.citas.tasaAsistencia}
                                trend="up"
                                icon={Calendar}
                                color="cyan"
                                delay={0}
                                tooltip="Total de citas registradas en el sistema, incluyendo pendientes, confirmadas y atendidas."
                            />

                            <ReporteCard
                                title="Dinero Cobrado"
                                value={formatearMonto(datos.pagos.totalIngresos)}
                                subtitle={`De ${datos.pagos.cantidadPagos} pagos`}
                                percentage={15.3}
                                trend="up"
                                icon={DollarSign}
                                color="green"
                                delay={0.1}
                                tooltip="Total de ingresos generados por pagos de tratamientos realizados en el período seleccionado."
                            />

                            <ReporteCard
                                title="Pacientes este Mes"
                                value={datos.pacientes.activos}
                                subtitle={`${datos.pacientes.nuevos} son nuevos`}
                                percentage={8.2}
                                trend="up"
                                icon={Users}
                                color="purple"
                                delay={0.2}
                                tooltip="Pacientes únicos que tuvieron al menos una cita este mes. Los nuevos son pacientes registrados por primera vez."
                            />

                            <ReporteCard
                                title="Pacientes que Vinieron"
                                value={`${datos.citas.tasaAsistencia}%`}
                                subtitle={`${datos.citas.canceladas} no vinieron`}
                                percentage={datos.citas.tasaAsistencia}
                                trend={datos.citas.tasaAsistencia > 80 ? 'up' : 'down'}
                                icon={TrendingUp}
                                color="blue"
                                delay={0.3}
                                tooltip="Porcentaje de pacientes que asistieron a sus citas programadas. Un valor mayor a 80% es considerado excelente."
                            />
                        </div>

                        {/* ==================== FASE 2: GRÁFICOS INTERACTIVOS ==================== */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <GraficoCitas filtrosAplicados={filtrosAplicados} />
                            <GraficoIngresos
                                filtrosAplicados={filtrosAplicados}
                                totalIngresos={datos.pagos.totalIngresos}
                            />
                        </div>

                        {/* ==================== NUEVOS GRÁFICOS AVANZADOS ==================== */}

                        {/* 1. Comparación Mensual */}
                        <GraficoComparacionMensual filtrosAplicados={filtrosAplicados} />

                        {/* 2. Proyección de Ingresos */}
                        <ProyeccionIngresos />

                        {/* 3. Ranking de Pacientes y Día de Semana */}
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                            <RankingPacientesTop filtrosAplicados={filtrosAplicados} />
                            <CitasPorDiaSemana filtrosAplicados={filtrosAplicados} />
                        </div>

                        {/* ==================== FASE 3: REPORTES AVANZADOS ==================== */}

                        {/* 1. Resumen Financiero Completo */}
                        <ResumenFinanciero filtrosAplicados={filtrosAplicados} />

                        {/* 2. Top 10 Tratamientos Más Solicitados */}
                        <TopTratamientos filtrosAplicados={filtrosAplicados} />

                        {/* 3. Productividad por Dentista */}
                        <ProductividadDentistas filtrosAplicados={filtrosAplicados} />

                        {/* 4. Distribución de Estados de Citas */}
                        <DistribucionEstados filtrosAplicados={filtrosAplicados} />

                    </>
                ) : (
                    <div className="text-center py-20">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
                            <p className="text-red-600 font-medium mb-2">⚠️ Error al cargar datos</p>
                            <p className="text-red-500 text-sm mb-4">No se pudieron obtener los reportes</p>
                            <button
                                onClick={cargarDatosIniciales}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
