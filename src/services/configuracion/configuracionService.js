/**
 * ============================================================================
 * SERVICIO DE CONFIGURACIÓN - PRODUCCIÓN
 * ============================================================================
 */

import { supabase } from '../supabaseClient';

const CONFIGURACION_DEFAULT = {
    nombre_clinica: 'Cusco Smile Dental',
    tema: 'light',
    logo_url: '/logo/logo_smile.png',
    color_primario: '#14b8a6',
    color_secundario: '#0d9488',
    direccion: '',
    telefono: '',
    correo: '',
    horario_atencion: '',
};

export const obtenerConfiguracion = async () => {
    try {
        const { data, error } = await supabase
            .from('configuracion_sistema')
            .select('*');

        if (error) {
            console.error('Error al obtener configuración:', error);
            return CONFIGURACION_DEFAULT;
        }

        if (!data || data.length === 0) {
            return CONFIGURACION_DEFAULT;
        }

        return data[0];

    } catch (error) {
        console.error('Error inesperado al obtener configuración:', error);
        return CONFIGURACION_DEFAULT;
    }
};

export const actualizarConfiguracion = async (configuracion) => {
    try {
        const { data: configs } = await supabase
            .from('configuracion_sistema')
            .select('id');

        if (!configs || configs.length === 0) {
            const { data, error } = await supabase
                .from('configuracion_sistema')
                .insert({
                    ...CONFIGURACION_DEFAULT,
                    ...configuracion
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const configId = configs[0].id;

        const { data, error } = await supabase
            .from('configuracion_sistema')
            .update(configuracion)
            .eq('id', configId)
            .select()
            .single();

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        throw error;
    }
};

export const subirLogo = async (archivo) => {
    try {
        const timestamp = Date.now();
        const extension = archivo.name.split('.').pop();
        const nombreArchivo = `logo_${timestamp}.${extension}`;

        const { error } = await supabase.storage
            .from('logos')
            .upload(nombreArchivo, archivo, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('logos')
            .getPublicUrl(nombreArchivo);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Error al subir logo:', error);
        throw error;
    }
};

export const eliminarLogoAnterior = async (logoUrl) => {
    try {
        if (!logoUrl) return;

        const nombreArchivo = logoUrl.split('/').pop();

        await supabase.storage
            .from('logos')
            .remove([nombreArchivo]);

    } catch (error) {
        console.error('Error al eliminar logo anterior:', error);
    }
};

export { CONFIGURACION_DEFAULT };
