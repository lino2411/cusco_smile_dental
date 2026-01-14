import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { obtenerDistribucionEstados } from '../../services/reportes/reportesAvanzadosService';

/**
 * Componente: Distribución de Estados de Citas
 * Gráfico circular que muestra la proporción de citas por estado
 */
export default function DistribucionEstados({ filtrosAplicados }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const distribucion = await obtenerDistribucionEstados(
                filtrosAplicados?.fechaInicio,
                filtrosAplicados?.fechaFin
            );
            setDatos(distribucion);
        } catch (error) {
            console.error('Error cargando distribución:', error);
        } finally {
            setCargando(false);
        }
    };

    // Etiquetas personalizadas para el gráfico
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-bold text-sm"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="w-8 h-8 text-smile_500 animate-spin" />
                </div>
            </div>
        );
    }

    const totalCitas = datos.reduce((sum, estado) => sum + estado.cantidad, 0);

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-purple-600" />
                    Distribución por Estado
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Proporción de citas según su estado
                </p>
            </div>

            {datos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico Circular */}
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={datos}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="cantidad"
                                >
                                    {datos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [
                                        `${value} citas (${props.payload.porcentaje}%)`,
                                        props.payload.nombre
                                    ]}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Lista de Estados */}
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                                Total de Citas
                            </p>
                            <p className="text-3xl font-black text-gray-900">
                                {totalCitas}
                            </p>
                        </div>

                        {datos.map((estado, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: estado.color }}
                                    ></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {estado.nombre}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {estado.cantidad} citas
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                        {estado.porcentaje}%
                                    </p>
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${estado.porcentaje}%`,
                                                backgroundColor: estado.color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                    No hay datos de distribución para este período
                </div>
            )}
        </div>
    );
}
