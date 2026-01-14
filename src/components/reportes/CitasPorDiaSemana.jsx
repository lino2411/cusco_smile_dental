import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Clock } from 'lucide-react';
import { obtenerCitasPorDiaSemana } from '../../services/reportes/graficosAvanzadosService';

export default function CitasPorDiaSemana({ filtrosAplicados }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        setCargando(true);
        const resultado = await obtenerCitasPorDiaSemana(filtrosAplicados);
        setDatos(resultado);
        setCargando(false);
    };

    // Colores por día (gradiente de verde a azul)
    const COLORES = ['#5dbea3', '#4dabaa', '#3d98b1', '#2d85b8', '#1d72bf', '#0d5fc6', '#004ccd'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const tasaCompletadas = data.citas > 0 ? ((data.completadas / data.citas) * 100).toFixed(1) : 0;

            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">{data.dia}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Total citas: <span className="font-bold text-smile_600">{data.citas}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            Completadas: <span className="font-bold text-green-600">{data.completadas}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            Tasa: <span className="font-bold text-blue-600">{tasaCompletadas}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-80 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const totalCitas = datos.reduce((sum, d) => sum + d.citas, 0);
    const diaMasOcupado = datos.reduce((max, d) => d.citas > max.citas ? d : max, datos[0] || { dia: '-', citas: 0 });

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Citas por Día de la Semana</h3>
                        <p className="text-sm text-gray-500">Distribución semanal de citas</p>
                    </div>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-smile_50 to-smile_100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-smile_600" />
                        <p className="text-xs text-smile_600 font-medium">Total Citas</p>
                    </div>
                    <p className="text-3xl font-bold text-smile_900">{totalCitas}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-purple-600 font-medium">Día Más Ocupado</p>
                    </div>
                    <p className="text-xl font-bold text-purple-900">{diaMasOcupado.dia}</p>
                    <p className="text-sm text-purple-600">{diaMasOcupado.citas} citas</p>
                </div>
            </div>

            {/* Gráfico */}
            {datos.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={datos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="dia"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                            dataKey="citas"
                            name="Total Citas"
                            radius={[8, 8, 0, 0]}
                        >
                            {datos.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORES[index]} />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="completadas"
                            name="Completadas"
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No hay datos de citas por día de la semana
                </div>
            )}

            {/* Tabla resumen */}
            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-smile_200">
                            <th className="text-left py-2 px-3 font-bold text-gray-700">Día</th>
                            <th className="text-center py-2 px-3 font-bold text-gray-700">Total</th>
                            <th className="text-center py-2 px-3 font-bold text-gray-700">Completadas</th>
                            <th className="text-center py-2 px-3 font-bold text-gray-700">Tasa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.map((dia, index) => {
                            const tasa = dia.citas > 0 ? ((dia.completadas / dia.citas) * 100).toFixed(0) : 0;
                            return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium text-gray-800">{dia.dia}</td>
                                    <td className="py-2 px-3 text-center font-semibold text-smile_600">{dia.citas}</td>
                                    <td className="py-2 px-3 text-center font-semibold text-green-600">{dia.completadas}</td>
                                    <td className="py-2 px-3 text-center">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${tasa >= 80 ? 'bg-green-100 text-green-700' :
                                                tasa >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {tasa}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
