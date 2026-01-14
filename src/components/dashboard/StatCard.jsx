import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, color = 'blue', trend, trendValue, delay = 0, subtitle }) {
    const colorClasses = {
        blue: {
            border: 'border-blue-600',
            badge: 'bg-blue-600',
            icon: 'text-blue-600',
            text: 'text-blue-600'
        },
        green: {
            border: 'border-green-600',
            badge: 'bg-green-600',
            icon: 'text-green-600',
            text: 'text-green-600'
        },
        purple: {
            border: 'border-purple-600',
            badge: 'bg-purple-600',
            icon: 'text-purple-600',
            text: 'text-purple-600'
        },
        orange: {
            border: 'border-orange-600',
            badge: 'bg-orange-600',
            icon: 'text-orange-600',
            text: 'text-orange-600'
        },
        smile: {
            border: 'border-smile_600',
            badge: 'bg-smile_600',
            icon: 'text-smile_600',
            text: 'text-smile_600'
        }
    };

    const colors = colorClasses[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.05 }}
            className={`bg-white rounded-lg shadow-lg p-4 border-l-4 ${colors.border} transition-transform`}
        >
            {/* Header: Badge + Icono */}
            <div className="flex items-center justify-between mb-2">
                <p className={`text-xs text-white font-semibold ${colors.badge} px-2 py-1 rounded-lg inline-block`}>
                    {title}
                </p>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>

            {/* Valor principal */}
            <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${colors.text}`}>
                    {value}
                </p>

                {/* Trend badge opcional */}
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trendValue}
                    </div>
                )}
            </div>

            {/* Subtítulo / Descripción */}
            <p className="text-xs text-gray-500 mt-1">
                {subtitle || 'Estadística general'}
            </p>
        </motion.div>
    );
}
