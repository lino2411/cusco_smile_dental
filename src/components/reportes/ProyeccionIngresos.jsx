import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { obtenerProyeccionIngresos } from '../../services/reportes/graficosAvanzadosService';

export default function ProyeccionIngresos() {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        const resultado = await obtenerProyeccionIngresos();
        setDatos(resultado);
        setCargando(false);
    };

    const formatearMonto = (valor) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 0
        }).format(valor);
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

    if (!datos) return null;

    // Combinar histórico y proyecciones
    const datosCompletos = [
        ...datos.historico.map(d => ({ ...d, tipo: 'Real' })),
        ...datos.proyecciones.map(d => ({ ...d, tipo: 'Proyección' }))
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">{data.mes}</p>
                    <p className={`text-sm font-medium ${data.esProyeccion ? 'text-orange-600' : 'text-smile_600'}`}>
                        {formatearMonto(data.ingresos)}
                    </p>
                    {data.esProyeccion && (
                        <p className="text-xs text-gray-500 mt-1">Estimado</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Proyección de Ingresos</h3>
                        <p className="text-sm text-gray-500">Basado en últimos 3 meses</p>
                    </div>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Promedio Mensual</p>
                    <p className="text-lg font-bold text-green-700">
                        {formatearMonto(datos.promedioMensual)}
                    </p>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-smile_500"></div>
                    <span className="text-sm text-gray-600">Ingresos Reales</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-600">Proyección Estimada</span>
                </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={datosCompletos}>
                    <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5dbea3" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#5dbea3" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="ingresos"
                        fill="url(#colorIngresos)"
                        stroke="none"
                    />
                    <Line
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#5dbea3"
                        strokeWidth={3}
                        dot={(props) => {
                            const { cx, cy, payload } = props;
                            return (
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill={payload.esProyeccion ? '#f97316' : '#5dbea3'}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            );
                        }}
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Detalles de proyección */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {datos.proyecciones.map((proyeccion, index) => (
                    <div
                        key={index}
                        className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-orange-600 font-medium mb-1">
                                    Proyección {proyeccion.mes}
                                </p>
                                <p className="text-2xl font-bold text-orange-900">
                                    {formatearMonto(proyeccion.ingresos)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-orange-400" />
                        </div>
                        <p className="text-xs text-orange-600 mt-2">
                            Basado en promedio de últimos 3 meses
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
