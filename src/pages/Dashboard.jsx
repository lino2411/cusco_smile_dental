import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet, useLocation } from 'react-router-dom';
import { Calendar, Users, DollarSign, TrendingUp, LayoutDashboard, Sparkles } from 'lucide-react';

// Componentes del dashboard
import RecordatoriosWidget from '../components/dashboard/RecordatoriosWidget';
import StatCard from '../components/dashboard/StatCard';
import CitasPorEstadoChart from '../components/dashboard/CitasPorEstadoChart';
import ProximasCitasWidget from '../components/dashboard/ProximasCitasWidget';
import UltimosPagosWidget from '../components/dashboard/UltimosPagosWidget';

// Servicio
import { obtenerEstadisticasDashboard } from '../services/dashboard/dashboardService';

export default function Dashboard() {
    const location = useLocation();
    const isDashboardRoot = location.pathname === '/dashboard';

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDashboardRoot) {
            cargarEstadisticas();
        }
    }, [isDashboardRoot]);

    const cargarEstadisticas = async () => {
        setLoading(true);
        const data = await obtenerEstadisticasDashboard();
        setStats(data);
        setLoading(false);
    };

    const formatearMonto = (monto) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2
        }).format(monto);
    };

    const obtenerFechaCompleta = () => {
        return new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header nombre="Admin General" />
                <div className="p-6 space-y-6 overflow-y-auto bg-gray-50">
                    {isDashboardRoot ? (
                        <>
                            {/* Header con Gradiente */}
                            <div className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-xl p-6 mb-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                                            <LayoutDashboard className="w-8 h-8" />
                                            Bienvenido a Cusco Smile
                                        </h1>
                                        <p className="text-smile_100 text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Resumen de tu clínica dental • {obtenerFechaCompleta()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                                            <p className="text-white/80 text-xs font-medium">Sistema en línea</p>
                                            <p className="text-white font-bold text-sm">✓ Operativo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Widget de Recordatorios */}
                            <RecordatoriosWidget />

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-smile_600 mx-auto mb-4"></div>
                                        <p className="text-gray-600 font-medium">Cargando estadísticas...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Cards de Estadísticas Principales */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard
                                            title="Citas de Hoy"
                                            value={stats.citasHoy}
                                            icon={Calendar}
                                            color="smile"
                                            subtitle="Programadas para hoy"
                                            delay={0}
                                        />
                                        <StatCard
                                            title="Citas del Mes"
                                            value={stats.citasMes}
                                            icon={TrendingUp}
                                            color="blue"
                                            subtitle="Total este mes"
                                            delay={0.1}
                                        />
                                        <StatCard
                                            title="Total Pacientes"
                                            value={stats.totalPacientes}
                                            icon={Users}
                                            color="purple"
                                            subtitle="Pacientes registrados"
                                            delay={0.2}
                                        />
                                        <StatCard
                                            title="Ingresos del Mes"
                                            value={formatearMonto(stats.ingresosMes)}
                                            icon={DollarSign}
                                            color="green"
                                            subtitle="Ingresos acumulados"
                                            delay={0.3}
                                        />
                                    </div>

                                    {/* Gráfico y Próximas Citas */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <CitasPorEstadoChart data={stats.citasPorEstado} />
                                        <ProximasCitasWidget citas={stats.proximasCitas} />
                                    </div>

                                    {/* Últimos Pagos y Pacientes Recientes */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <UltimosPagosWidget pagos={stats.ultimosPagos} />

                                        {/* Widget: Pacientes Recientes */}
                                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                                    <Users className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">Pacientes Recientes</h3>
                                                    <p className="text-xs text-gray-500">Últimos {stats.pacientesRecientes.length} registros</p>
                                                </div>
                                            </div>

                                            {stats.pacientesRecientes.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                                                        <Users className="w-10 h-10 text-purple-500" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">No hay pacientes registrados</p>
                                                    <p className="text-xs text-gray-400 mt-1">Los nuevos pacientes aparecerán aquí</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {stats.pacientesRecientes.map((paciente, index) => (
                                                        <div
                                                            key={paciente.id}
                                                            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-white to-purple-50/30 group"
                                                            style={{
                                                                animationDelay: `${index * 0.1}s`
                                                            }}
                                                        >
                                                            {/* Avatar con iniciales */}
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                {paciente.nombres?.charAt(0)}{paciente.apellidos?.charAt(0)}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-gray-900 truncate">
                                                                    {paciente.nombres} {paciente.apellidos}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {paciente.creado_en
                                                                        ? `Registrado: ${new Date(paciente.creado_en).toLocaleDateString('es-PE')}`
                                                                        : 'Fecha no disponible'
                                                                    }
                                                                </p>
                                                            </div>

                                                            {/* Indicador de nuevo (opcional - si fue registrado hoy) */}
                                                            {paciente.creado_en &&
                                                                new Date(paciente.creado_en).toDateString() === new Date().toDateString() && (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                                        Nuevo
                                                                    </span>
                                                                )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
        </div>
    );
}
