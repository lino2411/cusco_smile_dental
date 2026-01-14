import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { obtenerDatosCitasPorMes } from '../../services/reportes/graficosService';

export default function GraficoCitas({ filtrosAplicados }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const datosCitas = await obtenerDatosCitasPorMes(
                6,
                filtrosAplicados?.dentistaId || null
            );
            setDatos(datosCitas);
        } catch (error) {
            console.error('Error cargando gráfico de citas:', error);
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center justify-center h-80">
                    <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
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
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Evolución de Citas
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Últimos 6 meses</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-gray-600">Total</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Atendidas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">Canceladas</span>
                    </div>
                </div>
            </div>

            {/* Gráfico */}
            {datos.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={datos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="mes"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Bar dataKey="citas" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Total Citas" />
                        <Bar dataKey="atendidas" fill="#10b981" radius={[8, 8, 0, 0]} name="Atendidas" />
                        <Bar dataKey="canceladas" fill="#ef4444" radius={[8, 8, 0, 0]} name="Canceladas" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                    No hay datos disponibles para este período
                </div>
            )}
        </div>
    );
}
