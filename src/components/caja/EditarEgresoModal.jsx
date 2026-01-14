import { useState, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';

export default function EditarEgresoModal({ egreso, onClose, onEgresoEditado }) {
    const [form, setForm] = useState({
        descripcion: egreso.descripcion || '',
        monto: egreso.monto || '',
        nota: egreso.nota || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = useCallback((campo, valor) => {
        setForm(prev => ({ ...prev, [campo]: valor }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!form.descripcion.trim() || !form.monto || parseFloat(form.monto) <= 0) {
            Swal.fire({
                title: "Validación",
                text: "Descripción y monto válido son obligatorios",
                icon: "warning",
                background: "#111827",
                color: "#F9FAFB"
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('caja_movimientos')
                .update({
                    descripcion: form.descripcion,
                    monto: parseFloat(form.monto),
                    nota: form.nota
                })
                .eq('id', egreso.id);

            if (error) throw error;

            Swal.fire({
                title: "¡Actualizado!",
                text: "Egreso editado correctamente",
                icon: "success",
                timer: 1500,
                background: "#111827",
                color: "#F9FAFB",
                showConfirmButton: false
            });

            onEgresoEditado();
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error.message || "No se pudo actualizar el egreso",
                icon: "error",
                background: "#111827",
                color: "#F9FAFB"
            });
        } finally {
            setLoading(false);
        }
    }, [form, egreso.id, onEgresoEditado]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                    <div className="bg-white p-4 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-smile_600"></div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-smile_600 to-smile_700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Save className="w-6 h-6" />
                        Editar Egreso
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-smile_800 rounded-lg text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                        <input
                            type="text"
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none"
                            placeholder="Ej: Compra de insumos"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monto *</label>
                        <input
                            type="number"
                            value={form.monto}
                            onChange={e => handleChange('monto', e.target.value)}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none"
                            placeholder="0.00"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                        <textarea
                            value={form.nota}
                            onChange={e => handleChange('nota', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none resize-none"
                            placeholder="Detalles adicionales..."
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 flex items-center justify-center gap-2 text-white bg-red-500 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 flex items-center justify-center gap-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg font-medium shadow-md disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
