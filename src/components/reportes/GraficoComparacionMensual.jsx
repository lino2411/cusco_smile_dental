import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { obtenerComparacionMensual } from '../../services/reportes/graficosAvanzadosService';

export default function GraficoComparacionMensual({ filtrosAplicados }) {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        setCargando(true);
        const resultado = await obtenerComparacionMensual(filtrosAplicados);
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
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!datos) return null;

    const datosGrafico = [
        {
            categoria: 'Citas',
            [datos.mesAnterior.nombre]: datos.mesAnterior.citas,
            [datos.mesActual.nombre]: datos.mesActual.citas
        },
        {
            categoria: 'Ingresos (S/)',
            [datos.mesAnterior.nombre]: datos.mesAnterior.ingresos,
            [datos.mesActual.nombre]: datos.mesActual.ingresos
        },
        {
            categoria: 'Pacientes',
            [datos.mesAnterior.nombre]: datos.mesAnterior.pacientes,
            [datos.mesActual.nombre]: datos.mesActual.pacientes
        }
    ];

    const calcularCambio = (actual, anterior) => {
        if (anterior === 0) return 100;
        return ((actual - anterior) / anterior * 100).toFixed(1);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Comparación Mensual</h3>
                        <p className="text-sm text-gray-500">
                            {datos.mesActual.nombre} vs {datos.mesAnterior.nombre}
                        </p>
                    </div>
                </div>
            </div>

            {/* Indicadores de cambio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Citas</p>
                    <p className="text-2xl font-bold text-blue-900">{datos.mesActual.citas}</p>
                    <div className="flex items-center gap-1 mt-2">
                        {datos.mesActual.citas >= datos.mesAnterior.citas ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${datos.mesActual.citas >= datos.mesAnterior.citas ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {calcularCambio(datos.mesActual.citas, datos.mesAnterior.citas)}%
                        </span>
                        <span className="text-xs text-gray-500">vs mes anterior</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Ingresos</p>
                    <p className="text-2xl font-bold text-green-900">
                        {formatearMonto(datos.mesActual.ingresos)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                        {datos.mesActual.ingresos >= datos.mesAnterior.ingresos ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${datos.mesActual.ingresos >= datos.mesAnterior.ingresos ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {calcularCambio(datos.mesActual.ingresos, datos.mesAnterior.ingresos)}%
                        </span>
                        <span className="text-xs text-gray-500">vs mes anterior</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Pacientes</p>
                    <p className="text-2xl font-bold text-purple-900">{datos.mesActual.pacientes}</p>
                    <div className="flex items-center gap-1 mt-2">
                        {datos.mesActual.pacientes >= datos.mesAnterior.pacientes ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${datos.mesActual.pacientes >= datos.mesAnterior.pacientes ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {calcularCambio(datos.mesActual.pacientes, datos.mesAnterior.pacientes)}%
                        </span>
                        <span className="text-xs text-gray-500">vs mes anterior</span>
                    </div>
                </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="categoria" />
                    <YAxis />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend />
                    <Bar dataKey={datos.mesAnterior.nombre} fill="#94a3b8" radius={[8, 8, 0, 0]} />
                    <Bar dataKey={datos.mesActual.nombre} fill="#5dbea3" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
