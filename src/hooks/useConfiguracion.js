import { useState, useEffect } from 'react';
import { obtenerConfiguracion } from '../services/configuracion/configuracionService';

export function useConfiguracion() {
    const [configuracion, setConfiguracion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            const config = await obtenerConfiguracion();
            setConfiguracion(config);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Colores FIJOS de Cusco Smile (no modificables por el usuario)
    const colores = {
        primario: '#5DBEAB',      // smile_500
        secundario: '#73D7C5',    // smile_300
        oscuro: '#4AA896',        // smile_600
        claro: '#9AE2D5',         // smile_200
        muyClaro: '#E8F8F5',      // smile_50
    };

    return {
        configuracion,
        colores,
        loading,
        recargar: cargarConfiguracion,
    };
}
