import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TablaPresupuesto({ presupuestos, onAgregar, onActualizar, onEliminar, disabled }) {
    const [editandoId, setEditandoId] = useState(null);
    const [nuevaFila, setNuevaFila] = useState(null);
    const [formData, setFormData] = useState({
        tratamiento: '',
        cantidad: 1,
        costo_unitario: 0,
    });

    const calcularTotal = () => {
        return presupuestos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0).toFixed(2);
    };

    const handleAgregarFila = () => {
        setNuevaFila(true);
        setFormData({ tratamiento: '', cantidad: 1, costo_unitario: 0 });
    };

    const handleGuardarNueva = async () => {
        if (!formData.tratamiento.trim()) {
            Swal.fire({
                title: 'Error',
                text: 'El tratamiento es obligatorio',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        await onAgregar(formData.tratamiento, formData.cantidad, formData.costo_unitario);
        setNuevaFila(null);
        setFormData({ tratamiento: '', cantidad: 1, costo_unitario: 0 });
    };

    const handleCancelarNueva = () => {
        setNuevaFila(null);
        setFormData({ tratamiento: '', cantidad: 1, costo_unitario: 0 });
    };

    const handleEditar = (presupuesto) => {
        setEditandoId(presupuesto.id);
        setFormData({
            tratamiento: presupuesto.tratamiento,
            cantidad: presupuesto.cantidad,
            costo_unitario: presupuesto.costo_unitario,
        });
    };

    const handleGuardarEdicion = async (id) => {
        await onActualizar(id, formData.tratamiento, formData.cantidad, formData.costo_unitario);
        setEditandoId(null);
    };

    const handleCancelarEdicion = () => {
        setEditandoId(null);
    };

    const handleEliminar = (id) => {
        Swal.fire({
            title: '¿Eliminar tratamiento?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            background: '#111827',
            color: '#F9FAFB',
        }).then((result) => {
            if (result.isConfirmed) {
                onEliminar(id);
            }
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Presupuesto</h3>
                {!disabled && (
                    <button
                        onClick={handleAgregarFila}
                        disabled={nuevaFila}
                        className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Tratamiento
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-smile_600 text-white">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                                Tratamiento
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-24">
                                Cantidad
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-32">
                                Costo Unit.
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-32">
                                Total
                            </th>
                            {!disabled && (
                                <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-28">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {presupuestos.map((presupuesto) => (
                            <tr key={presupuesto.id} className="hover:bg-gray-50">
                                {editandoId === presupuesto.id ? (
                                    <>
                                        <td className="border border-gray-300 px-2 py-2">
                                            <input
                                                type="text"
                                                value={formData.tratamiento}
                                                onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                                                className="w-full px-2 py-1 border border-gray-300 rounded focus:border-smile_600 focus:ring-1 focus:ring-smile_600 outline-none"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.cantidad}
                                                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:border-smile_600 focus:ring-1 focus:ring-smile_600 outline-none"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.costo_unitario}
                                                onChange={(e) => setFormData({ ...formData, costo_unitario: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:border-smile_600 focus:ring-1 focus:ring-smile_600 outline-none"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                            S/. {(formData.cantidad * formData.costo_unitario).toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleGuardarEdicion(presupuesto.id)}
                                                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={handleCancelarEdicion}
                                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                            {presupuesto.tratamiento}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                            {presupuesto.cantidad}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-gray-900">
                                            S/. {parseFloat(presupuesto.costo_unitario).toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-gray-900">
                                            S/. {parseFloat(presupuesto.total).toFixed(2)}
                                        </td>
                                        {!disabled && (
                                            <td className="border border-gray-300 px-2 py-2">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEditar(presupuesto)}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(presupuesto.id)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}

                        {/* Nueva fila */}
                        {nuevaFila && (
                            <tr className="bg-blue-50">
                                <td className="border border-gray-300 px-2 py-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre del tratamiento..."
                                        value={formData.tratamiento}
                                        onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:border-smile_600 focus:ring-1 focus:ring-smile_600 outline-none"
                                        autoFocus
                                    />
                                </td>
                                <td className="border border-gray-300 px-2 py-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:border-smile_600 focus:ring-1 focus:ring-smile_600 outline-none"
                                    />
                                </td>
                                <td className="border border-gray-300 px-2 py-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.costo_unitario}
                                        onChange={(e) => setFormData({ ...formData, costo_unitario: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:border-smile_600 focus:ring-1 focus:ring-smile_600 outline-none"
                                    />
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                                    S/. {(formData.cantidad * formData.costo_unitario).toFixed(2)}
                                </td>
                                <td className="border border-gray-300 px-2 py-2">
                                    <div className="flex justify-center gap-1">
                                        <button
                                            onClick={handleGuardarNueva}
                                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleCancelarNueva}
                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Total */}
                        <tr className="bg-smile_100 font-bold">
                            <td colSpan={disabled ? 3 : 3} className="border border-gray-300 px-4 py-3 text-right">
                                TOTAL:
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-right text-lg">
                                S/. {calcularTotal()}
                            </td>
                            {!disabled && <td className="border border-gray-300"></td>}
                        </tr>
                    </tbody>
                </table>
            </div>

            {presupuestos.length === 0 && !nuevaFila && (
                <div className="text-center py-8 text-gray-500">
                    No hay tratamientos en el presupuesto. Haz clic en "Agregar Tratamiento" para comenzar.
                </div>
            )}
        </div>
    );
}
