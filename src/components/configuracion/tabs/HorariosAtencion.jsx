import { useState, useEffect } from 'react';
import { Clock, Calendar, Save, Plus, Trash2 } from 'lucide-react';

export default function HorariosAtencion({ configuracion, onGuardar, guardando }) {
    const [formData, setFormData] = useState({
        horario_lunes_viernes: '',
        horario_sabado: '',
        horario_domingo: '',
        dias_festivos: [],
    });

    const [nuevoFestivo, setNuevoFestivo] = useState({
        fecha: '',
        descripcion: '',
    });

    useEffect(() => {
        if (configuracion) {
            setFormData({
                horario_lunes_viernes: configuracion.horario_lunes_viernes || '',
                horario_sabado: configuracion.horario_sabado || '',
                horario_domingo: configuracion.horario_domingo || '',
                dias_festivos: configuracion.dias_festivos || [],
            });
        }
    }, [configuracion]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAgregarFestivo = () => {
        if (!nuevoFestivo.fecha || !nuevoFestivo.descripcion) {
            return;
        }

        const festivos = [...formData.dias_festivos, nuevoFestivo];
        setFormData(prev => ({ ...prev, dias_festivos: festivos }));
        setNuevoFestivo({ fecha: '', descripcion: '' });
    };

    const handleEliminarFestivo = (index) => {
        const festivos = formData.dias_festivos.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, dias_festivos: festivos }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onGuardar(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* HORARIOS DE ATENCIÓN */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-smile_600" />
                    Horarios de Atención
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lunes a Viernes */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Lunes a Viernes
                        </label>
                        <input
                            type="text"
                            name="horario_lunes_viernes"
                            value={formData.horario_lunes_viernes}
                            onChange={handleChange}
                            disabled={guardando}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="08:00 - 18:00"
                        />
                    </div>

                    {/* Sábado */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Sábado
                        </label>
                        <input
                            type="text"
                            name="horario_sabado"
                            value={formData.horario_sabado}
                            onChange={handleChange}
                            disabled={guardando}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="08:00 - 13:00"
                        />
                    </div>

                    {/* Domingo */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Domingo
                        </label>
                        <input
                            type="text"
                            name="horario_domingo"
                            value={formData.horario_domingo}
                            onChange={handleChange}
                            disabled={guardando}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="Cerrado"
                        />
                    </div>
                </div>
            </div>

            {/* DÍAS FESTIVOS */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-smile_600" />
                    Días Festivos
                </h3>

                {/* Agregar nuevo festivo */}
                <div className="bg-smile_50 border-2 border-smile_200 rounded-lg p-4 mb-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={nuevoFestivo.fecha}
                                onChange={(e) => setNuevoFestivo({ ...nuevoFestivo, fecha: e.target.value })}
                                disabled={guardando}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Descripción
                            </label>
                            <input
                                type="text"
                                value={nuevoFestivo.descripcion}
                                onChange={(e) => setNuevoFestivo({ ...nuevoFestivo, descripcion: e.target.value })}
                                disabled={guardando}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                                placeholder="Ej: Año Nuevo"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAgregarFestivo}
                            disabled={guardando || !nuevoFestivo.fecha || !nuevoFestivo.descripcion}
                            className="px-4 py-2.5 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Agregar
                        </button>
                    </div>
                </div>

                {/* Lista de festivos */}
                {formData.dias_festivos.length > 0 ? (
                    <div className="space-y-2">
                        {formData.dias_festivos.map((festivo, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4"
                            >
                                <div>
                                    <p className="font-bold text-gray-800">{festivo.descripcion}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(festivo.fecha + 'T00:00:00').toLocaleDateString('es-PE', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleEliminarFestivo(index)}
                                    disabled={guardando}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No hay días festivos registrados</p>
                    </div>
                )}
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="flex justify-end pt-4 border-t">
                <button
                    type="submit"
                    disabled={guardando}
                    className="px-6 py-3 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
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
