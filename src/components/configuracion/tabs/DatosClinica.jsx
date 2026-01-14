import { useState, useEffect } from 'react';
import { Save, Upload, Trash2, Building2 } from 'lucide-react';
import { subirLogo, eliminarLogoAnterior } from '../../../services/configuracion/configuracionService';
import Swal from 'sweetalert2';

export default function DatosClinica({ configuracion, onGuardar, guardando }) {
    const [formData, setFormData] = useState({
        nombre_clinica: '',
        ruc: '',
        direccion: '',
        telefono: '',
        celular: '',
        email_contacto: '',
        logo_url: '',
        slogan: '',
    });

    const [subiendoLogo, setSubiendoLogo] = useState(false);

    useEffect(() => {
        if (configuracion) {
            setFormData({
                nombre_clinica: configuracion.nombre_clinica || '',
                ruc: configuracion.ruc || '',
                direccion: configuracion.direccion || '',
                telefono: configuracion.telefono || '',
                celular: configuracion.celular || '',
                email_contacto: configuracion.email_contacto || '',
                logo_url: configuracion.logo_url || '',
                slogan: configuracion.slogan || '',
            });
        }
    }, [configuracion]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(formData);
    };

    const handleSubirLogo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Solo se permiten imágenes',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La imagen no debe pesar más de 2MB',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        try {
            setSubiendoLogo(true);

            // Eliminar logo anterior si existe
            if (formData.logo_url) {
                await eliminarLogoAnterior(formData.logo_url);
            }

            // Subir nuevo logo
            const url = await subirLogo(file);

            setFormData({
                ...formData,
                logo_url: url
            });

            Swal.fire({
                icon: 'success',
                title: 'Logo subido',
                text: 'No olvides guardar los cambios',
                timer: 2000,
                showConfirmButton: false,
                background: '#111827',
                color: '#F9FAFB',
            });
        } catch (error) {
            console.error('Error al subir logo:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo subir el logo',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setSubiendoLogo(false);
        }
    };

    const handleEliminarLogo = async () => {
        if (!formData.logo_url) return;

        const result = await Swal.fire({
            title: '¿Eliminar logo?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#111827',
            color: '#F9FAFB',
        });

        if (result.isConfirmed) {
            try {
                await eliminarLogoAnterior(formData.logo_url);
                setFormData({
                    ...formData,
                    logo_url: ''
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Logo eliminado',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#111827',
                    color: '#F9FAFB',
                });
            } catch (error) {
                console.error('Error al eliminar logo:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el logo',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Building2 className="inline w-5 h-5 mr-2" />
                    Logo de la Clínica
                </label>

                {formData.logo_url ? (
                    <div className="flex items-center gap-4">
                        <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg"
                        />
                        <div className="flex gap-2">
                            <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Cambiar
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSubirLogo}
                                    className="hidden"
                                    disabled={subiendoLogo}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={handleEliminarLogo}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-smile_500 transition">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <span className="text-sm text-gray-600">
                            {subiendoLogo ? 'Subiendo...' : 'Click para subir logo'}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                            PNG, JPG (máx. 2MB)
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleSubirLogo}
                            className="hidden"
                            disabled={subiendoLogo}
                        />
                    </label>
                )}
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Clínica *
                    </label>
                    <input
                        type="text"
                        name="nombre_clinica"
                        value={formData.nombre_clinica}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        RUC
                    </label>
                    <input
                        type="text"
                        name="ruc"
                        value={formData.ruc}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                    </label>
                    <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                    </label>
                    <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular
                    </label>
                    <input
                        type="text"
                        name="celular"
                        value={formData.celular}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de Contacto
                    </label>
                    <input
                        type="email"
                        name="email_contacto"
                        value={formData.email_contacto}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slogan
                    </label>
                    <input
                        type="text"
                        name="slogan"
                        value={formData.slogan}
                        onChange={handleChange}
                        placeholder="Ej: Tu sonrisa es nuestra prioridad"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-smile_500"
                    />
                </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={guardando}
                    className="px-6 py-3 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
}
