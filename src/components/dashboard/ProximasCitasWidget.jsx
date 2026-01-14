import { Clock, User, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProximasCitasWidget({ citas }) {
    const navigate = useNavigate();

    const getEstadoConfig = (estado) => {
        const configs = {
            'pendiente': {
                bg: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
                text: 'text-cyan-700',
                label: 'Pendiente',
                icon: '⏳'
            },
            'confirmada': {
                bg: 'bg-gradient-to-r from-green-400 to-green-600',
                text: 'text-green-700',
                label: 'Confirmada',
                icon: '✓'
            },
            'en_consulta': {
                bg: 'bg-gradient-to-r from-purple-400 to-purple-600',
                text: 'text-purple-700',
                label: 'En Consulta',
                icon: '👨‍⚕️'
            }
        };
        return configs[estado] || configs['pendiente'];
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Próximas Citas</h3>
                        <p className="text-xs text-gray-500">Hoy • {citas.length} programadas</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard/citas')}
                    className="flex items-center gap-1 text-sm text-smile_600 hover:text-smile_700 font-semibold group/btn"
                >
                    Ver todas
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            {citas.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No hay citas para hoy</p>
                    <p className="text-xs text-gray-400 mt-1">¡Disfruta tu día libre!</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {citas.map((cita, index) => {
                        const config = getEstadoConfig(cita.estado);

                        return (
                            <motion.div
                                key={cita.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                className="relative p-4 rounded-xl border-2 border-gray-100 hover:border-smile_500 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50 group/card overflow-hidden"
                                onClick={() => navigate('/dashboard/citas')}
                            >
                                {/* Efecto de brillo lateral */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-smile_400 to-smile_600 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        {/* Hora */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                                                <Clock className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-lg font-black text-gray-900">
                                                {cita.hora_inicio?.substring(0, 5)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${config.bg} shadow-md flex items-center gap-1`}>
                                                <span>{config.icon}</span>
                                                {config.label}
                                            </span>
                                        </div>

                                        {/* Paciente */}
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-bold text-gray-900">{cita.nombre_paciente}</span>
                                        </div>

                                        {/* Motivo */}
                                        <p className="text-sm text-gray-600 ml-7 line-clamp-1">{cita.motivo}</p>
                                    </div>

                                    {/* Icono de flecha */}
                                    <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-1 transition-all" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
