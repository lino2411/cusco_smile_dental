import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useState } from 'react';

export default function ReporteCard({
    title,
    value,
    subtitle,
    percentage,
    trend = 'up',
    icon: Icon,
    color = 'blue',
    onClick,
    delay = 0,
    tooltip = null  // ✅ NUEVO: Tooltip explicativo
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    const colorConfig = {
        cyan: {
            bg: 'bg-cyan-100',
            border: 'border-cyan-300',
            icon: 'text-cyan-600',
            iconBg: 'bg-cyan-200',
            text: 'text-cyan-900',
            subtitle: 'text-cyan-600'
        },
        green: {
            bg: 'bg-green-100',
            border: 'border-green-300',
            icon: 'text-green-600',
            iconBg: 'bg-green-200',
            text: 'text-green-900',
            subtitle: 'text-green-600'
        },
        purple: {
            bg: 'bg-purple-100',
            border: 'border-purple-300',
            icon: 'text-purple-600',
            iconBg: 'bg-purple-200',
            text: 'text-purple-900',
            subtitle: 'text-purple-600'
        },
        blue: {
            bg: 'bg-blue-100',
            border: 'border-blue-300',
            icon: 'text-blue-600',
            iconBg: 'bg-blue-200',
            text: 'text-blue-900',
            subtitle: 'text-blue-600'
        }
    };

    const colors = colorConfig[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay,
                ease: "easeOut"  // ✅ Animación más suave
            }}
            whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }  // ✅ Hover suave
            }}
            onClick={onClick}
            className={`${colors.bg} ${colors.border} border-2 rounded-xl p-5 shadow-md hover:shadow-xl transition-all cursor-pointer relative overflow-hidden`}
        >
            {/* ✅ NUEVO: Tooltip */}
            {tooltip && (
                <div className="absolute top-1 right-1 z-50">
                    <div
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />

                        {/* Tooltip flotante */}
                        {showTooltip && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="absolute right-0 top-6 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-2xl z-50"
                            >
                                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                {tooltip}
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`${colors.iconBg} p-2.5 rounded-lg`}>
                            <Icon className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">{title}</p>
                    </div>

                    <div className="mb-2">
                        <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
                    </div>

                    <p className={`text-xs ${colors.subtitle} font-medium`}>{subtitle}</p>
                </div>

                {percentage !== undefined && (
                    <div className="flex flex-col items-end">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend === 'up'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                            }`}>
                            {trend === 'up' ? (
                                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                            )}
                            <span className={`text-xs font-bold ${trend === 'up'
                                ? 'text-green-700'
                                : 'text-red-700'
                                }`}>
                                {percentage}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ✅ Efecto de brillo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
        </motion.div>
    );
}
