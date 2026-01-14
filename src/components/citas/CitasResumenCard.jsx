import { useMemo } from 'react';
import { Users, Clock, Check, UserCheck, RotateCcw, XCircle } from 'lucide-react';

export default function CitasResumenCard({ estadisticas }) {
    // ✅ NUEVO: Calcular porcentajes de forma segura
    const calcularPorcentaje = (valor) => {
        if (!estadisticas.total || estadisticas.total === 0) return '0.0';
        return ((valor / estadisticas.total) * 100).toFixed(1);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">

            {/* TOTAL */}
            <div className="bg-white rounded-lg shadow-lg p-4 border-solid border-l-4 border-smile_600 transition-transform hover:scale-105">
                {/* ✅ NUEVO: Icono agregado */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold bg-smile_600 p-1 rounded-lg inline-block">Total</p>
                    <Users className="w-5 h-5 text-smile_600" />
                </div>
                <p className="text-2xl font-bold text-smile_600">{estadisticas.total || 0}</p>
                {/* ✅ NUEVO: Indicador de base */}
                <p className="text-xs text-gray-500 mt-1">Base de cálculo</p>
            </div>

            {/* PENDIENTES */}
            <div className="bg-white rounded-lg shadow-lg p-4 border-solid border-l-4 border-cyan-600 transition-transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold bg-cyan-600 p-1 rounded-lg inline-block">Pendientes</p>
                    <Clock className="w-5 h-5 text-cyan-600" />
                </div>
                <p className="text-2xl font-bold text-cyan-600">{estadisticas.pendientes || 0}</p>
                {/* ✅ NUEVO: Porcentaje */}
                <p className="text-xs text-gray-500 mt-1">
                    {calcularPorcentaje(estadisticas.pendientes || 0)}% del total
                </p>
            </div>

            {/* CONFIRMADAS */}
            <div className="bg-white rounded-lg shadow-lg p-4 border-solid border-l-4 border-green-600 transition-transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold bg-green-600 p-1 rounded-lg inline-block">Confirmadas</p>
                    <Check className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{estadisticas.confirmadas || 0}</p>
                {/* ✅ NUEVO: Porcentaje */}
                <p className="text-xs text-gray-500 mt-1">
                    {calcularPorcentaje(estadisticas.confirmadas || 0)}% del total
                </p>
            </div>

            {/* ATENDIDAS */}
            <div className="bg-white rounded-lg shadow-lg p-4 border-solid border-l-4 border-blue-600 transition-transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold bg-blue-600 p-1 rounded-lg inline-block">Atendidas</p>
                    <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.atendidas || 0}</p>
                {/* ✅ NUEVO: Porcentaje */}
                <p className="text-xs text-gray-500 mt-1">
                    {calcularPorcentaje(estadisticas.atendidas || 0)}% del total
                </p>
            </div>

            {/* REPROGRAMADAS */}
            <div className="bg-white rounded-lg shadow-lg p-4 border-solid border-l-4 border-yellow-500 transition-transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold bg-yellow-500 p-1 rounded-lg inline-block">Reprogramadas</p>
                    <RotateCcw className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.reprogramadas || 0}</p>
                {/* ✅ NUEVO: Porcentaje */}
                <p className="text-xs text-gray-500 mt-1">
                    {calcularPorcentaje(estadisticas.reprogramadas || 0)}% del total
                </p>
            </div>

            {/* CANCELADAS */}
            <div className="bg-white rounded-lg shadow-lg p-4 border-solid border-l-4 border-red-600 transition-transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-semibold bg-red-600 p-1 rounded-lg inline-block">Canceladas</p>
                    <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-500">{estadisticas.canceladas || 0}</p>
                {/* ✅ NUEVO: Porcentaje */}
                <p className="text-xs text-gray-500 mt-1">
                    {calcularPorcentaje(estadisticas.canceladas || 0)}% del total
                </p>
            </div>
        </div>
    );
}
