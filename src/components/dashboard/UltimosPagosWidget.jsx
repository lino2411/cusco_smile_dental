import { DollarSign, TrendingUp, ChevronRight, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UltimosPagosWidget({ pagos }) {
    const navigate = useNavigate();

    const formatearMonto = (monto) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto);
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short'
        });
    };

    const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.a_cuenta || 0), 0);

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Últimos Pagos</h3>
                        <p className="text-xs text-gray-500">Total: {formatearMonto(totalPagos)}</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard/pagos')}
                    className="flex items-center gap-1 text-sm text-smile_600 hover:text-smile_700 font-semibold group/btn"
                >
                    Ver todos
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            {pagos.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                        <DollarSign className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-gray-500 font-medium">No hay pagos registrados</p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {pagos.map((pago, index) => (
                        <motion.div
                            key={pago.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-white to-green-50/30 group/item"
                            onClick={() => navigate('/dashboard/pagos')}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                    {pago.pacientes?.nombres?.charAt(0)}{pago.pacientes?.apellidos?.charAt(0)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">
                                        {pago.pacientes?.nombres} {pago.pacientes?.apellidos}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{pago.tratamiento_realizado}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{formatearFecha(pago.fecha)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <div className="text-right">
                                    <p className="text-xl font-black text-green-600">
                                        {formatearMonto(pago.a_cuenta)}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
