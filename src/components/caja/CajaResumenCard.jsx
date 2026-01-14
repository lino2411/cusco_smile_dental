import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { formatearMoneda } from '../../utils/formatos';

export default function CajaResumenCard({ tipo, monto, icono }) {
    const config = {
        ingresos: {
            color: 'green',
            icon: TrendingUp,
            bgColor: 'bg-green-100',
            borderColor: 'border-green-500'
        },
        egresos: {
            color: 'red',
            icon: TrendingDown,
            bgColor: 'bg-red-100',
            borderColor: 'border-red-500'
        },
        saldo: {
            color: 'blue',
            icon: DollarSign,
            bgColor: 'bg-blue-100',
            borderColor: 'border-blue-500'
        }
    };

    const { color, icon: Icono, bgColor, borderColor } = config[tipo] || config.saldo;

    return (
        <div className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${borderColor} transition-transform hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium capitalize">{tipo}</p>
                    <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{formatearMoneda(monto)}</p>
                </div>
                <Icono className={`w-10 h-10 text-${color}-500 opacity-70`} />
            </div>
        </div>
    );
}