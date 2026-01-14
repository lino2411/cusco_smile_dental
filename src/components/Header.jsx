import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { LogOut, Clock, User, ChevronRight } from 'lucide-react';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                const { data, error } = await supabase
                    .from('usuarios')
                    .select('nombre_completo, rol')
                    .eq('auth_user_id', session.user.id)
                    .single();

                if (!error && data) setUsuario(data);
            } catch (e) {
                console.error('Error al cargar usuario:', e);
            }
        };

        cargarUsuario();
    }, []);

    const breadcrumbs = location.pathname
        .split('/')
        .filter(Boolean)
        .map((segment, index, arr) => ({
            label: segment
                .split('-')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            path: '/' + arr.slice(0, index + 1).join('/'),
            isLast: index === arr.length - 1,
        }));

    const formatRol = (rol) =>
        !rol ? '' : rol.charAt(0).toUpperCase() + rol.slice(1);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro que quieres cerrar la sesión?',
            icon: 'warning',
            background: '#111827',
            color: '#ffffff',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        try {
            await supabase.auth.signOut();
            localStorage.removeItem('rol');
            navigate('/');
            Swal.fire({
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#111827',
                color: '#ffffff',
            });
        } catch (e) {
            console.error('Error al cerrar sesión', e);
        }
    };

    return (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
            <div className="px-6 py-3 flex items-center justify-between">
                {/* Bloque izquierda: saludo + rol + breadcrumbs */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-smile_100 dark:bg-smile_800 flex items-center justify-center transition-colors">
                            <User className="w-5 h-5 text-smile_600 dark:text-smile_300" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Bienvenido de nuevo</p>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                {usuario?.nombre_completo || 'Usuario'}
                            </h1>
                            {usuario?.rol && (
                                <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-smile_50 dark:bg-smile_900 text-smile_700 dark:text-smile_300 border border-smile_100 dark:border-smile_700 transition-colors">
                                    {formatRol(usuario.rol)}
                                </span>
                            )}
                        </div>
                    </div>

                    {breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span className="text-gray-400 dark:text-gray-500">Estás en:</span>
                            {breadcrumbs.map((crumb, idx) => (
                                <span key={crumb.path} className="flex items-center gap-1">
                                    {idx > 0 && (
                                        <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                                    )}
                                    {crumb.isLast ? (
                                        <span className="font-semibold text-smile_600 dark:text-smile_400">
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => navigate(crumb.path)}
                                            className="hover:text-smile_600 dark:hover:text-smile_400 transition-colors"
                                        >
                                            {crumb.label}
                                        </button>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Bloque derecha: fecha/hora + logout */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                        <Clock className="w-4 h-4 text-smile_600 dark:text-smile_400" />
                        <div className="text-xs">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {currentTime.toLocaleDateString('es-PE', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                                {currentTime.toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Cerrar sesión</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
