import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import {
    FaUsers,
    FaUserInjured,
    FaFileMedical,
    FaTooth,
    FaBars,
    FaTimes,
    FaUserCircle,
    FaChevronDown,
    FaChevronUp,
    FaCalendarAlt,
    FaChartBar,
} from 'react-icons/fa';
import { ClipboardList, LayoutDashboard, Wallet, CircleDollarSign, Settings } from 'lucide-react';
import { contarRecordatoriosPendientes } from '../services/recordatorios/recordatoriosService';
import { obtenerConfiguracion } from '../services/configuracion/configuracionService';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
        title: 'Gestión',
        items: [
            { name: 'Caja Central', path: '/dashboard/caja', icon: Wallet },
            { name: 'Usuarios', path: '/dashboard/usuarios', icon: FaUsers },
            { name: 'Pagos', path: '/dashboard/pagos', icon: CircleDollarSign },
            { name: 'Citas', path: '/dashboard/citas', icon: FaCalendarAlt, hasBadge: true },
        ],
    },
    {
        title: 'Clínica',
        items: [
            { name: 'Pacientes', path: '/dashboard/pacientes', icon: FaUserInjured },
            { name: 'Historias Clínicas', path: '/dashboard/historias-clinicas', icon: FaFileMedical },
            { name: 'Odontogramas', path: '/dashboard/odontogramas', icon: FaTooth },
            { name: 'Ortodoncia', path: '/dashboard/ortodoncia', icon: ClipboardList },
            { name: 'Reportes', path: '/dashboard/reportes', icon: FaChartBar },
        ],
    },
    {
        title: 'Configuración',
        items: [
            { name: 'Configuración', path: '/dashboard/configuracion', icon: Settings },
        ],
    },
];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState(['Gestión', 'Clínica']);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recordatoriosPendientes, setRecordatoriosPendientes] = useState(0);
    const [configuracion, setConfiguracion] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Cargar usuario
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: usuarioData } = await supabase
                    .from('usuarios')
                    .select('nombre_completo, rol')
                    .eq('auth_user_id', session.user.id)
                    .single();

                if (usuarioData) {
                    setUsuario(usuarioData);
                } else {
                    setUsuario({
                        nombre_completo: session.user.email?.split('@')[0] || 'Usuario',
                        rol: 'Usuario'
                    });
                }
            }

            // Cargar configuración
            const config = await obtenerConfiguracion();
            setConfiguracion(config);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setUsuario({ nombre_completo: 'Usuario', rol: 'Usuario' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarRecordatorios();
        const interval = setInterval(cargarRecordatorios, 120000);
        return () => clearInterval(interval);
    }, []);

    const cargarRecordatorios = async () => {
        const count = await contarRecordatoriosPendientes();
        setRecordatoriosPendientes(count);
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleSection = (title) => {
        if (openSections.includes(title)) {
            setOpenSections(openSections.filter(s => s !== title));
        } else {
            setOpenSections([...openSections, title]);
        }
    };

    const formatRol = (rol) => {
        if (!rol) return 'Usuario';
        return rol.charAt(0).toUpperCase() + rol.slice(1);
    };

    // Colores fijos de Cusco Smile (no dinámicos)
    const colorPrimario = '#4AA896'; // smile_600
    const nombreClinica = configuracion?.nombre_clinica || 'Cusco Smile';
    const descripcionClinica = configuracion?.descripcion || 'Atención Odontológica Especializada';


    return (
        <div
            className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-screen sticky top-0 left-0 transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${isCollapsed ? 'w-20' : 'w-72'
                }`}
        >
            {/* Header con Logo */}
            <div className="px-4 py-5 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                {!isCollapsed && (
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-3">
                            {/* Logo dinámico */}
                            {configuracion?.logo_url ? (
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg p-1">
                                    <img
                                        src={configuracion.logo_url}
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${colorPrimario}dd, ${colorPrimario})`
                                    }}
                                >
                                    <FaTooth className="text-white text-xl" />
                                </div>
                            )}

                            {/* Nombre dinámico */}
                            <h2
                                className="text-xl font-bold"
                                style={{
                                    background: `linear-gradient(135deg, ${colorPrimario}dd, ${colorPrimario})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                {configuracion?.nombre_clinica || 'Cusco Smile'}
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 ml-1">
                            {configuracion?.slogan || 'Atención Odontológica Especializada'}
                        </p>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 text-gray-300 hover:text-white flex-shrink-0"
                >
                    {isCollapsed ? <FaBars size={20} /> : <FaTimes size={20} />}
                </button>
            </div>

            {/* Usuario */}
            <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-700/50 bg-gray-800/30">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${colorPrimario}dd, ${colorPrimario})`,
                        ringColor: `${colorPrimario}30`
                    }}
                >
                    <FaUserCircle size={24} className="text-white" />
                </div>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <>
                                <div className="h-4 bg-gray-700 rounded animate-pulse w-24 mb-1"></div>
                                <div className="h-3 bg-gray-700 rounded animate-pulse w-16"></div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-white truncate">
                                    {usuario?.nombre_completo || 'Usuario'}
                                </p>
                                <p
                                    className="text-xs truncate font-medium"
                                    style={{ color: colorPrimario }}
                                >
                                    {formatRol(usuario?.rol)}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Navegación */}
            <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                <ul className="space-y-1">
                    {navItems.map((item, index) => {
                        if (item.title) {
                            const isOpen = openSections.includes(item.title);
                            return (
                                <li key={index} className="pt-3">
                                    {!isCollapsed && (
                                        <button
                                            onClick={() => toggleSection(item.title)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors group"
                                            style={{
                                                '--hover-color': colorPrimario
                                            }}
                                        >
                                            <span>{item.title}</span>
                                            {isOpen ? (
                                                <FaChevronUp className="text-gray-500 group-hover:text-white transition-colors" size={12} />
                                            ) : (
                                                <FaChevronDown className="text-gray-500 group-hover:text-white transition-colors" size={12} />
                                            )}
                                        </button>
                                    )}
                                    {(isOpen || isCollapsed) && (
                                        <ul className="mt-1 space-y-1">
                                            {item.items.map((subItem) => (
                                                <li key={subItem.path}>
                                                    <SidebarLink
                                                        isCollapsed={isCollapsed}
                                                        item={subItem}
                                                        badgeCount={subItem.hasBadge ? recordatoriosPendientes : 0}
                                                        colorPrimario={colorPrimario}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        }
                        return (
                            <li key={item.path}>
                                <SidebarLink
                                    isCollapsed={isCollapsed}
                                    item={item}
                                    badgeCount={0}
                                    colorPrimario={colorPrimario}
                                />
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            {!isCollapsed && (
                <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
                    <p className="text-xs text-center text-gray-500">
                        © 2025 {configuracion?.nombre_clinica || 'Cusco Smile'}
                    </p>
                </div>
            )}
        </div>
    );
}

// Componente SidebarLink con colores dinámicos
function SidebarLink({ item, isCollapsed, badgeCount = 0, colorPrimario = '#10B981' }) {
    const isDashboard = item.path === '/dashboard';

    return (
        <NavLink
            to={item.path}
            end={isDashboard}
            className={({ isActive }) =>
                `group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden ${isActive
                    ? 'text-white shadow-lg scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
                }`
            }
            style={({ isActive }) => ({
                background: isActive
                    ? `linear-gradient(135deg, ${colorPrimario}dd, ${colorPrimario})`
                    : 'transparent',
                boxShadow: isActive ? `0 4px 14px ${colorPrimario}30` : 'none'
            })}
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                    )}

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                            <item.icon size={20} />
                        </div>
                        {!isCollapsed && (
                            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'} truncate`}>
                                {item.name}
                            </span>
                        )}
                    </div>

                    {badgeCount > 0 && (
                        <div className="flex-shrink-0">
                            <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                                {badgeCount}
                            </span>
                        </div>
                    )}

                    {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    )}
                </>
            )}
        </NavLink>
    );
}
