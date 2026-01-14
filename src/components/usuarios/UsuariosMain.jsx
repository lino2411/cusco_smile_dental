import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Stethoscope, UserCheck, Activity, MessageSquareWarning } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

// Componentes
import { supabase } from '../../services/supabaseClient';
import UsuariosTabla from './UsuariosTabla';
import UsuarioFormModal from './UsuarioFormModal';
import UsuarioCard from './UsuarioCard';
import { verificarPasswordActual } from '../../services/usuarios/authService';
import { usePermisos } from '../../context/PermisosContext';

// Servicios
import {
    obtenerUsuarios,
    obtenerEstadisticasUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} from '../../services/usuarios/usuariosService';

// Constantes
import { ROLES } from '../../constants/rolesConfig';

export default function UsuariosMain() {
    const [usuarios, setUsuarios] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [filtroRol, setFiltroRol] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const permisos = usePermisos();

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [listaUsuarios, stats] = await Promise.all([
                obtenerUsuarios(),
                obtenerEstadisticasUsuarios()
            ]);
            setUsuarios(listaUsuarios);
            setEstadisticas(stats);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            Swal.fire({
                title: 'Error al cargar usuarios',
                text: error.message,
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
                confirmButtonColor: '#EF4444'
            });
        } finally {
            setCargando(false);
        }
    };

    const handleCrearUsuario = () => {
        setUsuarioEditando(null);
        setModalAbierto(true);
    };

    const handleEditarUsuario = async (usuario) => {
        // Obtener email del admin actual
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo verificar tu sesión',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        // Pedir contraseña del admin
        const { value: password } = await Swal.fire({
            title: 'Confirma tu identidad',
            text: 'Para editar usuarios, ingresa tu contraseña de administrador',
            input: 'password',
            inputPlaceholder: 'Tu contraseña',
            inputAttributes: {
                autocomplete: 'new-password',
                minlength: 6,
            },
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            background: '#111827',
            color: '#F9FAFB',
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6B7280',
            inputValidator: (value) => {
                if (!value) return 'Debes ingresar tu contraseña';
            }
        });

        if (!password) return;

        // Verificar la contraseña
        try {
            await verificarPasswordActual(user.email, password);

            // Si es correcta, abrir el modal de edición
            setUsuarioEditando(usuario);
            setModalAbierto(true);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Contraseña incorrecta',
                text: 'No puedes editar usuarios sin verificar tu identidad',
                background: '#111827',
                color: '#F9FAFB',
                confirmButtonColor: '#EF4444',
            });
        }
    };

    const handleGuardarUsuario = async (datosUsuario) => {
        try {
            if (usuarioEditando) {
                // Actualizar usuario existente
                const resultado = await actualizarUsuario(usuarioEditando.id, datosUsuario);

                // Mensaje diferente si cambió el correo
                if (resultado.correo_cambiado) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Usuario actualizado',
                        html: `
                            <div style="color: #F9FAFB;">
                                <p style="margin-bottom: 16px;">
                                    Los datos de <strong>${datosUsuario.nombre_completo}</strong> se actualizaron correctamente.
                                </p>
                                <div style="background-color: #065F46; border-left: 4px solid #10B981; padding: 12px; border-radius: 8px; text-align: left; margin-top: 16px;">
                                    <p style="font-size: 14px; color: #6EE7B7; margin-bottom: 8px;">
                                        ✅ <strong>Correo actualizado:</strong>
                                    </p>
                                    <p style="font-family: monospace; font-size: 14px; color: #D1FAE5; margin-bottom: 8px; background-color: #1E293B; padding: 8px; border-radius: 4px;">
                                        ${datosUsuario.correo}
                                    </p>
                                    <p style="font-size: 12px; color: #A7F3D0; margin: 0;">
                                        ✅ El usuario puede iniciar sesión inmediatamente con su nuevo correo y su contraseña actual.
                                    </p>
                                </div>
                            </div>
                        `,
                        background: '#111827',
                        confirmButtonColor: '#10B981',
                        confirmButtonText: 'Entendido'
                    });
                } else {
                    // Mensaje simple si NO cambió el correo
                    Swal.fire({
                        title: '¡Usuario actualizado!',
                        text: 'Los datos se guardaron correctamente.',
                        icon: 'success',
                        background: '#111827',
                        color: '#F9FAFB',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } else {
                // Crear nuevo usuario
                await crearUsuario(datosUsuario);

                await Swal.fire({
                    icon: 'success',
                    title: '¡Usuario creado!',
                    html: `
                    <div style="color: #F9FAFB;">
                        <p style="margin-bottom: 16px;">
                            El usuario <strong>${datosUsuario.nombre_completo}</strong> ha sido registrado exitosamente.
                        </p>
                        <div style="background-color: #1E3A8A; border-left: 4px solid #3B82F6; padding: 12px; border-radius: 8px; text-align: left; margin-top: 16px;">
                            <p style="font-size: 14px; color: #93C5FD; margin-bottom: 8px;">
                                📧 <strong>Importante:</strong> Se ha enviado un correo de confirmación a:
                            </p>
                            <p style="font-family: monospace; font-size: 14px; color: #DBEAFE; margin-bottom: 8px; background-color: #1E293B; padding: 8px; border-radius: 4px;">
                                ${datosUsuario.correo}
                            </p>
                            <p style="font-size: 12px; color: #BFDBFE; margin: 0;">
                                ⚠️ El usuario debe confirmar su correo antes de poder iniciar sesión en el sistema.
                            </p>
                        </div>
                    </div>
                `,
                    background: '#111827',
                    confirmButtonColor: '#059669',
                    confirmButtonText: 'Entendido'
                });
            }

            setModalAbierto(false);
            cargarDatos();
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            Swal.fire({
                title: 'Error al guardar',
                text: error.message,
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
                confirmButtonColor: '#EF4444'
            });
        }
    };

    const handleEliminarUsuario = async (usuario) => {
        const result = await Swal.fire({
            title: '¿Eliminar usuario?',
            html: `Se eliminará a <strong>${usuario.nombre_completo}</strong>.<br/>Esta acción no se puede deshacer.`,
            icon: 'warning',
            background: '#111827',
            color: '#F9FAFB',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarUsuario(usuario.id, usuario.authuserid);

                Swal.fire({
                    title: '¡Usuario eliminado!',
                    text: 'El usuario se eliminó correctamente.',
                    icon: 'success',
                    background: '#111827',
                    color: '#F9FAFB',
                    timer: 2000,
                    showConfirmButton: false
                });

                cargarDatos();
            } catch (error) {
                console.error('Error al eliminar usuario:', error);
                Swal.fire({
                    title: 'Error al eliminar',
                    text: error.message,
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB',
                    confirmButtonColor: '#EF4444'
                });
            }
        }
    };

    // Filtrar usuarios
    const usuariosFiltrados = usuarios.filter(usuario => {
        const cumpleFiltroRol = filtroRol === 'todos' || usuario.rol === filtroRol;
        const cumpleBusqueda =
            usuario.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
            usuario.dni.includes(busqueda) ||
            (usuario.correo && usuario.correo.toLowerCase().includes(busqueda.toLowerCase()));

        return cumpleFiltroRol && cumpleBusqueda;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ==================== HEADER ==================== */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-xl p-6 border border-smile_500/20"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                                >
                                    <Users className="w-7 h-7" />
                                </motion.div>
                                Gestión de Usuarios
                            </h1>
                            <p className="text-smile_100 text-sm ml-1">
                                Administra el acceso al sistema
                            </p>
                        </div>
                        {permisos.usuarios.crear && (
                            <button
                                onClick={handleCrearUsuario}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-smile_600 rounded-lg hover:bg-smile_50 transition-all font-bold shadow-lg hover:shadow-xl"
                            >
                                <UserPlus className="w-5 h-5" />
                                Nuevo Usuario
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* ==================== ESTADÍSTICAS ==================== */}
                {estadisticas && (
                    <UsuarioCard estadisticas={estadisticas} />
                )}

                {/* ==================== FILTROS Y BÚSQUEDA ==================== */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Búsqueda */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, DNI o correo..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                autoComplete="off"
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-smile_500 transition-colors"
                            />
                        </div>

                        {/* Filtro por rol */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFiltroRol('todos')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroRol === 'todos'
                                    ? 'bg-smile_600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFiltroRol(ROLES.ADMIN)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroRol === ROLES.ADMIN
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Admins
                            </button>
                            <button
                                onClick={() => setFiltroRol(ROLES.ODONTOLOGO)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroRol === ROLES.ODONTOLOGO
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Odontólogos
                            </button>
                            <button
                                onClick={() => setFiltroRol(ROLES.RECEPCIONISTA)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filtroRol === ROLES.RECEPCIONISTA
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Recepcionistas
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ==================== TABLA DE USUARIOS ==================== */}
                {cargando ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-smile_200 border-t-smile_600 mx-auto mb-4"></div>
                                <Activity className="w-6 h-6 text-smile_600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-gray-600 font-medium">Cargando usuarios...</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto w-full">
                        <UsuariosTabla
                            usuarios={usuariosFiltrados}
                            onEditar={permisos.usuarios.editar ? handleEditarUsuario : null}
                            onEliminar={permisos.usuarios.eliminar ? handleEliminarUsuario : null}
                        />
                    </div>

                )}

                {/* ==================== MODAL CREAR/EDITAR ==================== */}
                {modalAbierto && (
                    <UsuarioFormModal
                        usuario={usuarioEditando}
                        onClose={() => setModalAbierto(false)}
                        onGuardar={handleGuardarUsuario}
                    />
                )}
            </div>
        </div>
    );
}
