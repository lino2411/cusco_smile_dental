import { useState, useEffect } from 'react';
import { UserCheck, TrendingUp, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { obtenerProductividadDentistas } from '../../services/reportes/reportesAvanzadosService';

/**
 * Componente: Productividad por Dentista
 * Tabla comparativa del desempeño de cada dentista
 */
export default function ProductividadDentistas({ filtrosAplicados }) {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const productividad = await obtenerProductividadDentistas(
                filtrosAplicados?.fechaInicio,
                filtrosAplicados?.fechaFin
            );
            setDatos(productividad);
        } catch (error) {
            console.error('Error cargando productividad:', error);
        } finally {
            setCargando(false);
        }
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

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-smile_600" />
                    Productividad por Dentista
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Análisis comparativo del desempeño
                </p>
            </div>

            {/* Tabla */}
            {datos.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-smile_50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                    Dentista
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Total Citas
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                                    Atendidas
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                                    Canceladas
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                                    <TrendingUp className="w-4 h-4 inline mr-1" />
                                    Tasa Asist.
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Ingresos
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {datos.map((dentista, index) => (
                                <tr
                                    key={dentista.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-smile_100 flex items-center justify-center">
                                                <span className="text-smile_700 font-bold text-sm">
                                                    {dentista.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {dentista.nombre}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    #{index + 1} en ranking
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-100 text-cyan-700 font-bold">
                                            {dentista.totalCitas}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                            {dentista.atendidas}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                                            {dentista.canceladas}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-lg font-bold ${dentista.tasaAsistencia >= 80 ? 'text-green-600' :
                                                    dentista.tasaAsistencia >= 60 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                }`}>
                                                {dentista.tasaAsistencia}%
                                            </span>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${dentista.tasaAsistencia >= 80 ? 'bg-green-500' :
                                                            dentista.tasaAsistencia >= 60 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                        }`}
                                                    style={{ width: `${dentista.tasaAsistencia}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-lg font-bold text-green-600">
                                            S/ {dentista.ingresos.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold">
                            <tr>
                                <td className="px-4 py-3 text-gray-700">TOTAL</td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                    {datos.reduce((sum, d) => sum + d.totalCitas, 0)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                    {datos.reduce((sum, d) => sum + d.atendidas, 0)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                    {datos.reduce((sum, d) => sum + d.canceladas, 0)}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                    {(datos.reduce((sum, d) => sum + parseFloat(d.tasaAsistencia), 0) / datos.length).toFixed(1)}%
                                </td>
                                <td className="px-4 py-3 text-right text-green-600">
                                    S/ {datos.reduce((sum, d) => sum + d.ingresos, 0).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No hay datos de productividad para este período
                </div>
            )}
        </div>
    );
}
