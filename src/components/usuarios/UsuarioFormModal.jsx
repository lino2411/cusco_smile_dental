import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Shield, Key, Eye, EyeOff, RefreshCcw, Save, MessageSquareWarning, Camera, Upload, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLES_OPTIONS } from '../../constants/rolesConfig';
import { verificarDNIExistente } from '../../services/usuarios/usuariosService';
import { subirAvatar, eliminarAvatar } from '../../services/usuarios/avatarService';
import { supabase } from '../../services/supabaseClient';
import { cambiarMiPassword, cambiarPasswordUsuario, enviarEmailResetPassword } from '../../services/usuarios/authService';


export default function UsuarioFormModal({ usuario, onClose, onGuardar }) {
    const esEdicion = !!usuario;
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        dni: '',
        nombre_completo: '',
        correo: '',
        celular: '',
        rol: '',
        password: '',
        avatar_url: '',
        es_admin: false
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    useEffect(() => {
        if (usuario) {
            setFormData({
                dni: usuario.dni || '',
                nombre_completo: usuario.nombre_completo || '',
                correo: usuario.correo || '',
                celular: usuario.celular || '',
                rol: usuario.rol || '',
                password: '',
                avatar_url: usuario.avatar_url || '',
                es_admin: usuario.es_admin || false
            });
            setAvatarPreview(usuario.avatar_url || null);
        } else {
            setFormData({
                dni: '',
                nombre_completo: '',
                correo: '',
                celular: '',
                rol: '',
                password: '',
                avatar_url: '',
                es_admin: false
            });
            setAvatarPreview(null);
        }
        setAvatarFile(null);
        setErrores({});
    }, [usuario]);

    // Manejo de Avatar
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo
            if (!file.type.startsWith('image/')) {
                setErrores(prev => ({ ...prev, avatar: 'Solo se permiten imágenes' }));
                return;
            }

            // Validar tamaño (2MB)
            if (file.size > 2 * 1024 * 1024) {
                setErrores(prev => ({ ...prev, avatar: 'La imagen no debe superar 2MB' }));
                return;
            }

            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setErrores(prev => ({ ...prev, avatar: '' }));
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setFormData(prev => ({ ...prev, avatar_url: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validarFormulario = async () => {
        const nuevosErrores = {};

        // Validar DNI
        if (!formData.dni.trim()) {
            nuevosErrores.dni = 'El DNI es obligatorio';
        } else if (!/^\d{8}$/.test(formData.dni)) {
            nuevosErrores.dni = 'El DNI debe tener 8 dígitos';
        } else if (!esEdicion) {
            const dniExiste = await verificarDNIExistente(formData.dni);
            if (dniExiste) {
                nuevosErrores.dni = 'Este DNI ya está registrado';
            }
        }

        // Validar nombre completo
        if (!formData.nombre_completo.trim()) {
            nuevosErrores.nombre_completo = 'El nombre completo es obligatorio';
        } else if (formData.nombre_completo.trim().length < 3) {
            nuevosErrores.nombre_completo = 'El nombre debe tener al menos 3 caracteres';
        }

        // VALIDACIÓN DE CORREO (más permisiva)
        if (formData.correo.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
                nuevosErrores.correo = 'El formato del correo no es válido';
            } else {
                const dominio = formData.correo.split('@')[1].toLowerCase();
                const dominiosNoPermitidos = ['clinica.local', 'example.com', 'test.com', 'fake.com'];
                if (dominiosNoPermitidos.includes(dominio)) {
                    nuevosErrores.correo = 'Por favor, usa un correo electrónico real (Gmail, Outlook, etc.)';
                }
            }
        }

        // Validar celular (opcional)
        if (formData.celular.trim() && !/^\d{9}$/.test(formData.celular)) {
            nuevosErrores.celular = 'El celular debe tener 9 dígitos';
        }

        // Validar rol
        if (!formData.rol) {
            nuevosErrores.rol = 'Debe seleccionar un rol';
        }

        // Validar contraseña
        if (!esEdicion) {
            if (!formData.password) {
                nuevosErrores.password = 'La contraseña es obligatoria';
            } else if (formData.password.length < 6) {
                nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const esValido = await validarFormulario();
        if (!esValido) return;

        setGuardando(true);
        try {
            let avatarUrl = formData.avatar_url;

            // Si hay una nueva imagen, subirla
            if (avatarFile) {
                setUploadingAvatar(true);

                // Si es edición y ya tenía avatar, eliminar el anterior
                if (usuario?.avatar_url) {
                    await eliminarAvatar(usuario.avatar_url);
                }

                avatarUrl = await subirAvatar(avatarFile, formData.dni);
            }

            await onGuardar({
                ...formData,
                avatar_url: avatarUrl
            });

        } catch (error) {
            console.error('Error en handleSubmit:', error);
        } finally {
            setGuardando(false);
            setUploadingAvatar(false);
        }
    };

    const handleCambiarPassword = async () => {
        if (!usuario || !usuario.auth_user_id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Este usuario no tiene cuenta de acceso asociada',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        // Siempre cambio directo, sin importar qué usuario sea
        const { value: formValues } = await Swal.fire({
            title: 'Cambiar contraseña',
            html: `
            <input 
                type="password" 
                id="nueva-pass" 
                class="swal2-input" 
                placeholder="Nueva contraseña" 
                autocomplete="new-password"
                minlength="6"
            >
            <input 
                type="password" 
                id="confirmar-pass" 
                class="swal2-input" 
                placeholder="Confirmar contraseña" 
                autocomplete="new-password"
                minlength="6"
            >
        `,
            showCancelButton: true,
            confirmButtonText: 'Cambiar',
            cancelButtonText: 'Cancelar',
            background: '#111827',
            color: '#F9FAFB',
            confirmButtonColor: '#059669',
            didOpen: () => {
                document.getElementById('nueva-pass').value = '';
                document.getElementById('confirmar-pass').value = '';
            },
            preConfirm: () => {
                const nueva = document.getElementById('nueva-pass').value;
                const confirmar = document.getElementById('confirmar-pass').value;

                if (!nueva || !confirmar) {
                    Swal.showValidationMessage('Debes completar ambos campos');
                    return false;
                }

                if (nueva.length < 6) {
                    Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
                    return false;
                }

                if (nueva !== confirmar) {
                    Swal.showValidationMessage('Las contraseñas no coinciden');
                    return false;
                }

                return nueva;
            }
        });

        if (formValues) {
            try {
                await cambiarPasswordUsuario(usuario.auth_user_id, formValues);

                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña actualizada!',
                    text: `La contraseña de ${usuario.nombre_completo} se cambió correctamente.`,
                    timer: 2500,
                    showConfirmButton: false,
                    background: '#111827',
                    color: '#F9FAFB',
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message,
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]"
                >
                    {/* ✅ HEADER FIJO */}
                    <div className="bg-gradient-to-r from-smile_600 to-smile_700 p-6 border-b border-smile_500/20 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <User className="w-6 h-6" />
                                    </div>
                                    {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h2>
                                <p className="text-smile_100 text-sm mt-1">
                                    {esEdicion
                                        ? 'Modifica los datos del usuario'
                                        : 'Completa los datos para crear un nuevo usuario'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={guardando || uploadingAvatar}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* ✅ CONTENIDO CON SCROLL */}
                    <div className="overflow-y-auto flex-1 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ✅ SECCIÓN DE FOTO DE PERFIL */}
                            <div className="flex flex-col items-center gap-4 pb-6 border-b-2 border-gray-100">
                                <div className="relative group">
                                    {/* Avatar circular */}
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-smile_500 shadow-xl bg-gradient-to-br from-smile_50 to-smile_100">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-smile_100 to-smile_200">
                                                <User className="w-16 h-16 text-smile_600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón de cámara overlay */}
                                    <button
                                        type="button"
                                        onClick={handleAvatarClick}
                                        disabled={guardando || uploadingAvatar}
                                        className="absolute bottom-1 right-1 bg-smile_500 hover:bg-smile_600 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="text-center space-y-2">
                                    <p className="text-sm font-bold text-gray-700">
                                        Foto de perfil
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleAvatarClick}
                                            disabled={guardando || uploadingAvatar}
                                            className="text-sm text-smile_600 hover:text-smile_700 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                                        </button>
                                        {avatarPreview && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveAvatar}
                                                    disabled={guardando || uploadingAvatar}
                                                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        JPG, PNG o GIF (máx. 2MB)
                                    </p>
                                    {errores.avatar && (
                                        <p className="text-xs text-red-500 font-medium">{errores.avatar}</p>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            {/* ✅ INFORMACIÓN PERSONAL - GRID 2 COLUMNAS */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-smile_500 rounded-full"></div>
                                    Información Personal
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {/* DNI */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            DNI <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="dni"
                                            value={formData.dni}
                                            onChange={handleChange}
                                            disabled={esEdicion || guardando || uploadingAvatar}
                                            maxLength={8}
                                            placeholder="Ej: 12345678"
                                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${errores.dni
                                                ? 'border-red-300 focus:border-red-500'
                                                : 'border-gray-200 focus:border-smile_500'
                                                }`}
                                        />
                                        {errores.dni && (
                                            <p className="text-red-500 text-sm mt-1">{errores.dni}</p>
                                        )}
                                    </div>

                                    {/* Nombre Completo */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Nombre Completo <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre_completo"
                                            value={formData.nombre_completo}
                                            onChange={handleChange}
                                            disabled={guardando || uploadingAvatar}
                                            placeholder="Ej: Juan Pérez García"
                                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors disabled:bg-gray-100 ${errores.nombre_completo
                                                ? 'border-red-300 focus:border-red-500'
                                                : 'border-gray-200 focus:border-smile_500'
                                                }`}
                                        />
                                        {errores.nombre_completo && (
                                            <p className="text-red-500 text-sm mt-1">{errores.nombre_completo}</p>
                                        )}
                                    </div>

                                    {/* Celular */}
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-smile_600" />
                                            Celular
                                            <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="celular"
                                            value={formData.celular}
                                            onChange={handleChange}
                                            disabled={guardando || uploadingAvatar}
                                            maxLength={9}
                                            placeholder="Ej: 987654321"
                                            autoComplete='off'
                                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors disabled:bg-gray-100 ${errores.celular
                                                ? 'border-red-300 focus:border-red-500'
                                                : 'border-gray-200 focus:border-smile_500'
                                                }`}
                                        />
                                        {errores.celular && (
                                            <p className="text-red-500 text-sm mt-1">{errores.celular}</p>
                                        )}
                                    </div>

                                    {/* Rol */}
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-smile_600" />
                                            Rol <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="rol"
                                            value={formData.rol}
                                            onChange={handleChange}
                                            disabled={guardando || uploadingAvatar}
                                            className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors disabled:bg-gray-100 ${errores.rol
                                                ? 'border-red-300 focus:border-red-500'
                                                : 'border-gray-200 focus:border-smile_500'
                                                }`}
                                        >
                                            <option value="">Seleccionar rol</option>
                                            {ROLES_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errores.rol && (
                                            <p className="text-red-500 text-sm mt-1">{errores.rol}</p>
                                        )}
                                    </div>

                                    {/* ✨ NUEVO: Permisos administrativos */}
                                    {(formData.rol === 'odontologo' || formData.rol === 'admin') && (
                                        <div className="md:col-span-2">
                                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                                <label className="flex items-start gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        name="es_admin"
                                                        checked={formData.es_admin || false}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            es_admin: e.target.checked
                                                        }))}
                                                        disabled={guardando || uploadingAvatar}
                                                        className="mt-1 w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer disabled:opacity-50"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Shield className="w-5 h-5 text-purple-600" />
                                                            <span className="font-bold text-purple-900">
                                                                Permisos administrativos
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-purple-700">
                                                            Este usuario podrá gestionar otros usuarios, ver reportes completos y tiene acceso total al sistema.
                                                        </p>
                                                        <p className="text-xs text-purple-600 mt-2 font-medium">
                                                            💡 Marca esto solo para dueños, socios o personal de confianza.
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* ✅ INFORMACIÓN DE ACCESO */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-smile_500 rounded-full"></div>
                                    Información de Acceso
                                </h3>

                                {/* Correo con advertencia */}
                                <div className="mb-5">
                                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-smile_600" />
                                        Correo Electrónico <span className="text-red-500">*</span>
                                    </label>

                                    {/* Advertencia visible */}
                                    <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                                        <div className="flex items-start gap-2">
                                            <MessageSquareWarning className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-xs text-blue-800">
                                                <p className="font-semibold mb-1">ℹ️ Información:</p>
                                                <p>Tiene que ser <strong>CORREO</strong> <strong>VALIDO EXISTENTE</strong> ya que se le enviara la confirmacion de acceso al correo. El usuario podrá iniciar sesión con su <strong>DNI</strong> y la contraseña asignada. Si cambias el correo, se sincronizará automáticamente.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        type="email"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        disabled={guardando || uploadingAvatar}
                                        required
                                        placeholder="ejemplo@gmail.com"
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors disabled:bg-gray-100 ${errores.correo
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-gray-200 focus:border-smile_500'
                                            }`}
                                    />
                                    {errores.correo && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <span className="font-semibold">⚠</span> {errores.correo}
                                        </p>
                                    )}
                                </div>

                                {/* Contraseña (solo al crear) */}
                                {!esEdicion && (
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Key className="w-4 h-4 text-smile_600" />
                                            Contraseña <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={mostrarPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                disabled={guardando || uploadingAvatar}
                                                placeholder="Mínimo 6 caracteres"
                                                autoComplete="new-password"
                                                className={`w-full px-4 py-2.5 pr-12 border-2 rounded-lg focus:outline-none transition-colors disabled:bg-gray-100 ${errores.password
                                                    ? 'border-red-300 focus:border-red-500'
                                                    : 'border-gray-200 focus:border-smile_500'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                                disabled={guardando || uploadingAvatar}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                            >
                                                {mostrarPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        {errores.password && (
                                            <p className="text-red-500 text-sm mt-1">{errores.password}</p>
                                        )}
                                        <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                                            <span>🔐</span>
                                            El usuario usará su <strong>DNI</strong> y esta contraseña para iniciar sesión
                                        </p>
                                    </div>
                                )}
                                {/* Botón cambiar contraseña (solo si estamos editando) */}
                                {usuario && (
                                    <div className="border-t pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCambiarPassword}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            Cambiar contraseña
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Se enviará un correo de recuperación al usuario
                                        </p>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* ✅ FOOTER FIJO */}
                    <div className="bg-smile_50 p-6 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={guardando || uploadingAvatar}
                                className="flex gap-2 items-center px-6 py-3 border-2 bg-red-500 hover:bg-red-600 border-gray-300 text-white rounded-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-5 h-5" /> Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={guardando || uploadingAvatar}
                                className="px-6 py-3 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[180px]"
                            >
                                {guardando || uploadingAvatar ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {uploadingAvatar ? 'Subiendo...' : 'Guardando...'}
                                    </>
                                ) : (
                                    esEdicion ? <><RefreshCcw className="w-5 h-5" /> Actualizar Usuario</> : <><Save className="w-5 h-5" /> Crear Usuario</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
