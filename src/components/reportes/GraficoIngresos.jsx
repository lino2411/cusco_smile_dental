import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, RefreshCw } from 'lucide-react';
import { obtenerDatosIngresosPorMes } from '../../services/reportes/graficosService';

export default function GraficoIngresos({ filtrosAplicados, totalIngresos }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const datosIngresos = await obtenerDatosIngresosPorMes(
                6,
                filtrosAplicados?.dentistaId || null
            );
            setDatos(datosIngresos);
        } catch (error) {
            console.error('Error cargando gráfico de ingresos:', error);
        } finally {
            setCargando(false);
        }
    };

    const formatearMonto = (valor) => {
        if (valor >= 1000) {
            return `S/ ${(valor / 1000).toFixed(1)}k`;
        }
        return `S/ ${valor}`;
    };

    const calcularTotal = () => {
        return datos.reduce((sum, item) => sum + item.ingresos, 0);
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center justify-center h-80">
                    <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Evolución de Ingresos
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Últimos 6 meses</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Total período</p>
                    <p className="text-lg font-bold text-green-600">
                        S/ {calcularTotal().toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Gráfico */}
            {datos.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={datos}>
                        <defs>
                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="mes"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={formatearMonto}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                            formatter={(value) => [`S/ ${value.toLocaleString()}`, 'Ingresos']}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="ingresos"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#colorIngresos)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                    No hay datos disponibles para este período
                </div>
            )}
        </div>
    );
}
