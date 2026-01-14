import { createContext, useContext, useEffect, useState } from 'react';
import { obtenerConfiguracion } from '../services/configuracion/configuracionService';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarTema();
    }, []);

    const cargarTema = async () => {
        try {
            const config = await obtenerConfiguracion();
            const temaGuardado = config?.tema || 'light';
            setTheme(temaGuardado);
            aplicarTema(temaGuardado);
        } catch (error) {
            console.error('Error al cargar tema:', error);
            aplicarTema('light');
        } finally {
            setLoading(false);
        }
    };

    const aplicarTema = (nuevoTema) => {
        const root = window.document.documentElement;

        if (nuevoTema === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        setTheme(nuevoTema);
    };

    const toggleTheme = () => {
        const nuevoTema = theme === 'light' ? 'dark' : 'light';
        aplicarTema(nuevoTema);
    };

    const recargarTema = () => {
        cargarTema();
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, aplicarTema, loading, recargarTema }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe usarse dentro de ThemeProvider');
    }
    return context;
}
