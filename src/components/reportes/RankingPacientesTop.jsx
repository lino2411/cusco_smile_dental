import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Users } from 'lucide-react';
import { obtenerTopPacientesVisitas } from '../../services/reportes/graficosAvanzadosService';

export default function RankingPacientesTop({ filtrosAplicados }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        setCargando(true);
        const resultado = await obtenerTopPacientesVisitas(filtrosAplicados);
        setDatos(resultado);
        setCargando(false);
    };

    const COLORES = [
        '#5dbea3', '#4da894', '#3d9285', '#2d7c76', '#1d6667',
        '#0d5058', '#7ec9b5', '#9ed7c7', '#bee5d9', '#def3eb'
    ];

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

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Top 10 Pacientes Más Frecuentes</h3>
                        <p className="text-sm text-gray-500">Pacientes que más veces visitaron la clínica</p>
                    </div>
                </div>
                <div className="bg-smile_50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-smile_600 font-medium">
                        Total: {datos.reduce((sum, p) => sum + p.visitas, 0)} visitas
                    </p>
                </div>
            </div>

            {datos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Barras */}
                    <div>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={datos} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" />
                                <YAxis
                                    type="category"
                                    dataKey="nombre"
                                    width={120}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="visitas" radius={[0, 8, 8, 0]}>
                                    {datos.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tabla Ranking */}
                    <div className="overflow-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-smile_200">
                                    <th className="text-left py-3 px-3 text-sm font-bold text-gray-700">#</th>
                                    <th className="text-left py-3 px-3 text-sm font-bold text-gray-700">Paciente</th>
                                    <th className="text-center py-3 px-3 text-sm font-bold text-gray-700">Visitas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.map((paciente, index) => (
                                    <tr
                                        key={paciente.id}
                                        className="border-b border-gray-100 hover:bg-smile_50 transition-colors"
                                    >
                                        <td className="py-3 px-3">
                                            <div className="flex items-center justify-center">
                                                {index < 3 ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                            index === 1 ? 'bg-gray-400' :
                                                                'bg-orange-400'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-gray-600 bg-gray-100">
                                                        {index + 1}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-smile_100 flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-smile_600" />
                                                </div>
                                                <span className="font-medium text-gray-800 text-sm">
                                                    {paciente.nombre}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="text-center">
                                                <span className="inline-block bg-smile_100 text-smile_700 px-3 py-1 rounded-full font-bold text-sm">
                                                    {paciente.visitas}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <Users className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                        <p>No hay datos de visitas para mostrar</p>
                    </div>
                </div>
            )}
        </div>
    );
}
