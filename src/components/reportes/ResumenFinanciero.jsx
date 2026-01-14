import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PiggyBank, RefreshCw } from 'lucide-react';
import { obtenerResumenFinanciero } from '../../services/reportes/reportesAvanzadosService';

/**
 * Componente: Resumen Financiero Detallado
 * Panel completo con métricas financieras y métodos de pago
 */
export default function ResumenFinanciero({ filtrosAplicados }) {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, [filtrosAplicados]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const resumen = await obtenerResumenFinanciero(
                filtrosAplicados?.fechaInicio,
                filtrosAplicados?.fechaFin
            );
            setDatos(resumen);
        } catch (error) {
            console.error('Error cargando resumen financiero:', error);
        } finally {
            setCargando(false);
        }
    };

    const formatearMonto = (monto) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2
        }).format(monto);
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

    if (!datos) return null;

    const tasaCobro = datos.totalCostos > 0
        ? ((datos.totalIngresos / datos.totalCostos) * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Resumen Financiero Detallado
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Análisis completo de ingresos y egresos
                </p>
            </div>

            <div className="space-y-6">
                {/* Cards de Métricas Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Ingresos */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <p className="text-xs font-semibold text-green-700 uppercase">
                                Dinero Cobrado  {/* ✅ Antes: "Ingresos" */}
                            </p>
                        </div>
                        <p className="text-2xl font-black text-green-700">
                            {formatearMonto(datos.totalIngresos)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            {datos.cantidadTransacciones} pagos recibidos  {/* ✅ Antes: "transacciones" */}
                        </p>
                    </div>

                    {/* Costos */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-orange-600" />
                            <p className="text-xs font-semibold text-orange-700 uppercase">
                                Total de Tratamientos  {/* ✅ Antes: "Costos" */}
                            </p>
                        </div>
                        <p className="text-2xl font-black text-orange-700">
                            {formatearMonto(datos.totalCostos)}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            Valor total facturado  {/* ✅ Más claro */}
                        </p>
                    </div>

                    {/* Deudas */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-red-600" />
                            <p className="text-xs font-semibold text-red-700 uppercase">
                                Dinero por Cobrar  {/* ✅ Antes: "Deudas" */}
                            </p>
                        </div>
                        <p className="text-2xl font-black text-red-700">
                            {formatearMonto(datos.totalDeudas)}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            Pacientes deben pagar  {/* ✅ Más claro */}
                        </p>
                    </div>

                    {/* Utilidad Estimada */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                            <PiggyBank className="w-4 h-4 text-blue-600" />
                            <p className="text-xs font-semibold text-blue-700 uppercase">
                                Ganancia del Período  {/* ✅ Antes: "Utilidad" */}
                            </p>
                        </div>
                        <p className="text-2xl font-black text-blue-700">
                            {formatearMonto(datos.utilidad)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Aproximado  {/* ✅ Antes: "Estimado" */}
                        </p>
                    </div>
                </div>

                {/* Indicadores Adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                            Promedio por Pago  {/* ✅ Antes: "Promedio por Transacción" */}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                            {formatearMonto(datos.promedioTransaccion)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                            Efectividad de Cobros  {/* ✅ Antes: "Tasa de Cobro" */}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                            {tasaCobro}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            De S/ 100 cobras S/ {tasaCobro}  {/* ✅ Explicación adicional */}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                            Total de Pagos  {/* ✅ Antes: "Total Transacciones" */}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                            {datos.cantidadTransacciones}
                        </p>
                    </div>
                </div>

                {/* Métodos de Pago */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-smile_600" />
                        Distribución por Método de Pago
                    </h4>

                    <div className="space-y-3">
                        {datos.metodosPago.length > 0 ? (
                            datos.metodosPago.map((metodo, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-gray-900">
                                                {metodo.metodo}
                                            </p>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatearMonto(metodo.total)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {metodo.cantidad} pagos
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-smile_500 to-smile_600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${metodo.porcentaje}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 min-w-[50px] text-right">
                                                {metodo.porcentaje}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">
                                No hay datos de métodos de pago
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
