import { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Save } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export default function Apariencia({ configuracion, onGuardar, guardando }) {
    const { recargarTema } = useTheme();

    const [formData, setFormData] = useState({
        tema: 'light',
    });

    useEffect(() => {
        if (configuracion) {
            setFormData({
                tema: configuracion.tema || 'light',
            });
        }
    }, [configuracion]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onGuardar(formData);

        setTimeout(() => {
            recargarTema();
        }, 500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* TEMA */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-smile_600" />
                    Tema del Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Claro */}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tema: 'light' }))}
                        disabled={guardando}
                        className={`p-6 border-2 rounded-lg transition-all ${formData.tema === 'light'
                                ? 'border-smile_500 bg-smile_50 dark:bg-smile_900 ring-2 ring-smile_200'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                    >
                        <Sun className={`w-12 h-12 mx-auto mb-3 ${formData.tema === 'light' ? 'text-smile_600' : 'text-gray-400'
                            }`} />
                        <p className="font-bold text-gray-800 dark:text-gray-100">Modo Claro</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fondo blanco y texto oscuro</p>
                    </button>

                    {/* Oscuro */}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tema: 'dark' }))}
                        disabled={guardando}
                        className={`p-6 border-2 rounded-lg transition-all ${formData.tema === 'dark'
                                ? 'border-smile_500 bg-smile_50 dark:bg-smile_900 ring-2 ring-smile_200'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                    >
                        <Moon className={`w-12 h-12 mx-auto mb-3 ${formData.tema === 'dark' ? 'text-smile_600' : 'text-gray-400'
                            }`} />
                        <p className="font-bold text-gray-800 dark:text-gray-100">Modo Oscuro</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fondo oscuro y texto claro</p>
                    </button>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 rounded-r-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ <strong>Nota:</strong> El modo oscuro está en desarrollo. Por ahora solo está disponible el modo claro.
                    </p>
                </div>
            </div>

            {/* INFO SOBRE COLORES */}
            <div className="p-6 bg-smile_50 dark:bg-smile_900 border-l-4 border-smile_500 rounded-r-lg transition-colors">
                <h3 className="text-lg font-bold text-smile_800 dark:text-smile_300 mb-3 flex items-center gap-2">
                    🎨 Colores de Cusco Smile
                </h3>
                <p className="text-sm text-smile_800 dark:text-smile_300 mb-4">
                    El sistema utiliza los colores oficiales de la marca Cusco Smile Dental.
                </p>

                {/* Paleta de colores oficial (solo visual) */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-lg mx-auto mb-2 shadow-md" style={{ backgroundColor: '#5DBEAB' }}></div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Principal</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#5DBEAB</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-lg mx-auto mb-2 shadow-md" style={{ backgroundColor: '#4AA896' }}></div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Oscuro</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#4AA896</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-lg mx-auto mb-2 shadow-md" style={{ backgroundColor: '#73D7C5' }}></div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Medio</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#73D7C5</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-lg mx-auto mb-2 shadow-md" style={{ backgroundColor: '#9AE2D5' }}></div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Claro</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#9AE2D5</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-lg mx-auto mb-2 shadow-md" style={{ backgroundColor: '#E8F8F5' }}></div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Muy Claro</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#E8F8F5</p>
                    </div>
                </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="submit"
                    disabled={guardando}
                    className="px-6 py-3 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition-all font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                    {guardando ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
