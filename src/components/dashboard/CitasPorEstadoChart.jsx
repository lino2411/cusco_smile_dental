import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function CitasPorEstadoChart({ data }) {
    const estados = [
        { key: 'pendiente', label: 'Pendiente', color: 'from-cyan-400 to-cyan-600', solidColor: '#06b6d4', icon: '⏳' },
        { key: 'confirmada', label: 'Confirmada', color: 'from-green-400 to-green-600', solidColor: '#10b981', icon: '✓' },
        { key: 'reprogramada', label: 'Reprogramada', color: 'from-yellow-400 to-amber-600', solidColor: '#eab308', icon: '🔄' },
        { key: 'atendida', label: 'Atendida', color: 'from-blue-400 to-blue-600', solidColor: '#3b82f6', icon: '✔' },
        { key: 'cancelada', label: 'Cancelada', color: 'from-red-400 to-red-600', solidColor: '#ef4444', icon: '✖' }
    ];

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const maxValue = Math.max(...Object.values(data), 1);

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Citas por Estado</h3>
                        <p className="text-xs text-gray-500">Este mes • {total} total</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-600">{total}</span>
                </div>
            </div>

            {/* Gráfico de barras verticales */}
            <div className="relative">
                {/* Grid lines de fondo */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="border-t border-gray-100"></div>
                    ))}
                </div>

                {/* Barras */}
                <div className="relative flex items-end justify-around gap-3 h-64 pt-4">
                    {estados.map(({ key, label, color, solidColor, icon }, index) => {
                        const count = data[key] || 0;
                        const heightPercentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
                        const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

                        return (
                            <div
                                key={key}
                                className="flex-1 flex flex-col items-center gap-2 group/bar"
                            >
                                {/* Valor en la parte superior */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="text-center mb-1"
                                >
                                    <span className="text-xl font-black text-gray-900">{count}</span>
                                    <p className="text-xs text-gray-500">{percentage}%</p>
                                </motion.div>

                                {/* Barra vertical */}
                                <div className="relative w-full flex-1 flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercentage}%` }}
                                        transition={{
                                            duration: 0.8,
                                            delay: index * 0.1 + 0.2,
                                            ease: "easeOut"
                                        }}
                                        className={`w-full bg-gradient-to-t ${color} rounded-t-xl shadow-lg relative overflow-hidden group-hover/bar:shadow-2xl transition-shadow cursor-pointer`}
                                        style={{
                                            minHeight: count > 0 ? '40px' : '0px',
                                            maxHeight: '100%'
                                        }}
                                    >
                                        {/* Efecto de brillo animado */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-shimmer"></div>

                                        {/* Borde superior brillante */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 rounded-t-xl"></div>
                                    </motion.div>
                                </div>

                                {/* Label con icono */}
                                <div className="text-center mt-2">
                                    <div className="text-lg mb-1">{icon}</div>
                                    <p className="text-xs font-semibold text-gray-700 leading-tight max-w-[80px]">
                                        {label}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leyenda horizontal */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-3 justify-center">
                    {estados.map(({ key, label, solidColor, icon }) => {
                        const count = data[key] || 0;
                        return (
                            <div key={key} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: solidColor }}
                                ></div>
                                <span className="text-xs text-gray-600">
                                    {icon} {label} <span className="font-bold">({count})</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
