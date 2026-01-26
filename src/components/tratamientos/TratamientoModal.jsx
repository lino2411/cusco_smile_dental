import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Package } from 'lucide-react';
import Swal from 'sweetalert2';
import { crearTratamiento } from '../../services/tratamientos/tratamientosService';

const CATEGORIAS = [
    'Consulta',
    'Prevención',
    'Restauración',
    'Endodoncia',
    'Rehabilitación',
    'Estética',
    'Ortodoncia',
    'Cirugía',
    'Diagnóstico',
    'Otros'
];

function TratamientoModalContent({ onClose, onTratamientoGuardado }) {
    const [loading, setLoading] = useState(false);
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('');
    const [costoSugerido, setCostoSugerido] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // ✅ Evitar propagación

        if (!nombre.trim()) {
            Swal.fire({
                title: 'Campo incompleto',
                text: 'Por favor ingresa el nombre del tratamiento',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        setLoading(true);
        try {
            console.log('🚀 Creando tratamiento:', { nombre, categoria, costoSugerido });

            const nuevoTratamiento = await crearTratamiento({
                nombre: nombre.trim(),
                categoria: categoria || null,
                costo_sugerido: costoSugerido || 0,
            });

            console.log('✅ Tratamiento creado:', nuevoTratamiento);

            Swal.fire({
                title: '¡Registrado!',
                text: 'El tratamiento ha sido agregado correctamente',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });

            onTratamientoGuardado(nuevoTratamiento);
            onClose();
        } catch (error) {
            console.error('❌ ERROR COMPLETO:', error);
            console.error('❌ ERROR MESSAGE:', error.message);
            console.error('❌ ERROR CODE:', error.code);

            let mensajeError = 'No se pudo guardar el tratamiento';
            if (error.message?.includes('duplicate') || error.code === '23505') {
                mensajeError = 'Este tratamiento ya existe en la lista';
            }

            Swal.fire({
                title: 'Error',
                text: mensajeError,
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-smile_600 to-smile_700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Package className="w-6 h-6" />
                                Nuevo Tratamiento
                            </h2>
                            <p className="text-smile_100 text-sm mt-1">
                                Agrega un nuevo tratamiento al catálogo
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre del tratamiento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Tratamiento *
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Extracción de molar"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoría
                        </label>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                        >
                            <option value="">Sin categoría</option>
                            {CATEGORIAS.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Costo sugerido */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Costo Sugerido (Opcional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                S/
                            </span>
                            <input
                                type="number"
                                value={costoSugerido}
                                onChange={(e) => setCostoSugerido(e.target.value)}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Este costo es solo referencial
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-smile_600 hover:bg-smile_700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Tratamiento
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Exportar con Portal
export default function TratamientoModal(props) {
    return createPortal(
        <TratamientoModalContent {...props} />,
        document.body
    );
}
