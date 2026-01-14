import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, RefreshCw } from 'lucide-react';
import { obtenerTopTratamientos } from '../../services/reportes/reportesAvanzadosService';

/**
 * Componente: Top 10 Tratamientos Más Solicitados
 * Muestra un ranking de los tratamientos más populares
 */
export default function TopTratamientos({ filtrosAplicados }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const tratamientos = await obtenerTopTratamientos(
                filtrosAplicados?.fechaInicio,
                filtrosAplicados?.fechaFin,
                10
            );
            setDatos(tratamientos);
        } catch (error) {
            console.error('Error cargando top tratamientos:', error);
        } finally {
            setCargando(false);
        }
    };

    // Colores para las barras (degradado de verde a azul)
    const colores = [
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
        '#c084fc', '#d8b4fe'
    ];

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="w-8 h-8 text-smile_500 animate-spin" />
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
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top 10 Tratamientos Más Solicitados
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Los procedimientos más populares
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Total registros</p>
                    <p className="text-lg font-bold text-smile_600">
                        {datos.reduce((sum, t) => sum + t.cantidad, 0)}
                    </p>
                </div>
            </div>

            {/* Gráfico o Lista */}
            {datos.length > 0 ? (
                <div className="space-y-4">
                    {/* Gráfico de barras horizontal */}
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={datos}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis
                                dataKey="nombre"
                                type="category"
                                width={150}
                                tick={{ fill: '#374151', fontSize: 11 }}
                            />
                            <Tooltip
                                formatter={(value, name) => {
                                    if (name === 'cantidad') return [value, 'Cantidad'];
                                    return [value, name];
                                }}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Bar dataKey="cantidad" radius={[0, 8, 8, 0]}>
                                {datos.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Tabla de detalles */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detalles por Tratamiento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {datos.slice(0, 5).map((tratamiento, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: colores[index] }}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {tratamiento.nombre}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {tratamiento.cantidad} veces
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">
                                            S/ {tratamiento.ingresos.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                    No hay datos de tratamientos para este período
                </div>
            )}
        </div>
    );
}
