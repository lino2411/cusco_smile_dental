import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Upload, Save, X } from 'lucide-react';
import { subirLogo, eliminarLogoAnterior } from '../../../services/configuracion/configuracionService';

export default function General({ configuracion, onGuardar, guardando }) {
    const [formData, setFormData] = useState({
        nombre_clinica: '',
        descripcion: '',
        direccion: '',
        telefono: '',
        email: '',
        ruc: '',
        logo_url: '',
    });
    const [archivoLogo, setArchivoLogo] = useState(null);
    const [previsualizacion, setPrevisualizacion] = useState(null);
    const [subiendoLogo, setSubiendoLogo] = useState(false);

    useEffect(() => {
        if (configuracion) {
            setFormData({
                nombre_clinica: configuracion.nombre_clinica || '',
                descripcion: configuracion.descripcion || '',
                direccion: configuracion.direccion || '',
                telefono: configuracion.telefono || '',
                email: configuracion.email || '',
                ruc: configuracion.ruc || '',
                logo_url: configuracion.logo_url || '',
            });
            setPrevisualizacion(configuracion.logo_url);
        }
    }, [configuracion]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        // Validar tipo de archivo
        if (!archivo.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida');
            return;
        }

        // Validar tamaño (max 2MB)
        if (archivo.size > 2 * 1024 * 1024) {
            alert('El archivo es muy grande. Máximo 2MB');
            return;
        }

        setArchivoLogo(archivo);

        // Crear previsualización
        const reader = new FileReader();
        reader.onloadend = () => {
            setPrevisualizacion(reader.result);
        };
        reader.readAsDataURL(archivo);
    };

    const handleEliminarLogo = () => {
        setArchivoLogo(null);
        setPrevisualizacion(null);
        setFormData(prev => ({ ...prev, logo_url: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let datosActualizados = { ...formData };

            // Si hay un nuevo logo, subirlo primero
            if (archivoLogo) {
                setSubiendoLogo(true);

                // Eliminar logo anterior si existe
                if (formData.logo_url) {
                    await eliminarLogoAnterior(formData.logo_url);
                }

                // Subir nuevo logo
                const logoUrl = await subirLogo(archivoLogo);
                datosActualizados.logo_url = logoUrl;
            }

            await onGuardar(datosActualizados);
            setArchivoLogo(null);
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar la configuración');
        } finally {
            setSubiendoLogo(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* LOGO */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-smile_600" />
                    Logo de la Clínica
                </h3>

                <div className="flex items-start gap-6">
                    {/* Previsualización */}
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden">
                        {previsualizacion ? (
                            <>
                                <img
                                    src={previsualizacion}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-4"
                                />
                                <button
                                    type="button"
                                    onClick={handleEliminarLogo}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <div className="text-center">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Sin logo</p>
                            </div>
                        )}
                    </div>

                    {/* Input de archivo */}
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Subir Logo
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={guardando || subiendoLogo}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-smile_50 file:text-smile_700 hover:file:bg-smile_100 cursor-pointer disabled:opacity-50"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            PNG, JPG o SVG. Máximo 2MB. Recomendado: 300x300px
                        </p>
                    </div>
                </div>
            </div>

            {/* INFORMACIÓN GENERAL */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-smile_600" />
                    Información General
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre de la clínica */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Nombre de la Clínica *
                        </label>
                        <input
                            type="text"
                            name="nombre_clinica"
                            value={formData.nombre_clinica}
                            onChange={handleChange}
                            required
                            disabled={guardando || subiendoLogo}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="Ej: Cusco Smile Dental"
                        />
                    </div>

                    {/* RUC */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            RUC / Identificación Fiscal
                        </label>
                        <input
                            type="text"
                            name="ruc"
                            value={formData.ruc}
                            onChange={handleChange}
                            disabled={guardando || subiendoLogo}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="20123456789"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Descripción / Slogan
                        </label>
                        <input
                            type="text"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            disabled={guardando || subiendoLogo}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="Ej: Atención Odontológica Especializada"
                        />
                    </div>
                </div>
            </div>

            {/* INFORMACIÓN DE CONTACTO */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-smile_600" />
                    Información de Contacto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Teléfono */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            disabled={guardando || subiendoLogo}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="(01) 234-5678"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={guardando || subiendoLogo}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100"
                            placeholder="contacto@clinica.com"
                        />
                    </div>

                    {/* Dirección */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Dirección
                        </label>
                        <textarea
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            disabled={guardando || subiendoLogo}
                            rows="3"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 disabled:bg-gray-100 resize-none"
                            placeholder="Av. Principal 123, Distrito, Ciudad"
                        />
                    </div>
                </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="flex justify-end pt-4 border-t">
                <button
                    type="submit"
                    disabled={guardando || subiendoLogo}
                    className="px-6 py-3 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
                >
                    {guardando || subiendoLogo ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {subiendoLogo ? 'Subiendo logo...' : 'Guardando...'}
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
