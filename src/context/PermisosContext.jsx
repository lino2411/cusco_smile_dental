import { createContext, useContext, useState, useEffect } from 'react';

const PermisosContext = createContext();

export function PermisosProvider({ children }) {
    const [rol, setRol] = useState(null);

    useEffect(() => {
        // Obtener rol desde localStorage (se guarda en Login.jsx)
        const rolGuardado = localStorage.getItem('rol');
        setRol(rolGuardado);

        // Escuchar cambios en localStorage
        const handleStorageChange = () => {
            setRol(localStorage.getItem('rol'));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ✅ Verificar permisos - acepta 'admin', 'Administrador', etc.
    const esAdmin = rol === 'admin' || rol === 'Administrador';
    const esOdontologo = rol === 'odontologo' || rol === 'Odontólogo';
    const esRecepcionista = rol === 'recepcionista' || rol === 'Recepcionista';


    const permisos = {
        // ===== MÓDULO: USUARIOS =====
        usuarios: {
            ver: esAdmin || esOdontologo || esRecepcionista,
            crear: esAdmin || esOdontologo,
            editar: esAdmin || esOdontologo,
            eliminar: esAdmin || esOdontologo,
            cambiarPassword: esAdmin,
        },

        // ===== MÓDULO: PACIENTES =====
        pacientes: {
            ver: true,
            crear: true,
            editar: true,
            eliminar: esAdmin,
            verDocumentos: true,
            subirDocumentos: true,
        },

        // ===== MÓDULO: CITAS =====
        citas: {
            ver: true,
            crear: true,
            editar: true,
            eliminar: esAdmin,
            cancelar: esAdmin || esRecepcionista,
        },

        // ===== MÓDULO: HISTORIAS CLÍNICAS =====
        historias: {
            ver: true,
            crear: esAdmin || esOdontologo,
            editar: esAdmin || esOdontologo,
            eliminar: esAdmin,
        },

        // ===== MÓDULO: ODONTOGRAMAS =====
        odontogramas: {
            ver: true,
            crear: esAdmin || esOdontologo,
            editar: esAdmin || esOdontologo,
            eliminar: esAdmin,
        },

        // ===== MÓDULO: PAGOS =====
        pagos: {
            ver: true,
            crear: true,
            editar: esAdmin || esRecepcionista,
            eliminar: esAdmin,
            verReportes: esAdmin,
        },

        // ===== MÓDULO: CAJA =====
        caja: {
            ver: esAdmin || esRecepcionista,
            registrarMovimiento: esAdmin || esRecepcionista,
            cerrarCaja: esAdmin,
            verReportes: esAdmin,
        },

        // ===== MÓDULO: REPORTES =====
        reportes: {
            ver: esAdmin,
            exportar: esAdmin,
        },
    };

    return (
        <PermisosContext.Provider value={permisos}>
            {children}
        </PermisosContext.Provider>
    );
}

export const usePermisos = () => {
    const context = useContext(PermisosContext);
    if (!context) {
        throw new Error('usePermisos debe usarse dentro de PermisosProvider');
    }
    return context;
};
