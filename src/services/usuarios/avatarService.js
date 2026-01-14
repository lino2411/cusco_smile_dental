import { supabase } from "../supabaseClient";

/**
 * Subir avatar a Supabase Storage
 */
export const subirAvatar = async (file, dni) => {
    try {
        // Validar archivo
        if (!file) throw new Error('No se proporcionó ningún archivo');

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            throw new Error('Solo se permiten imágenes');
        }

        // Validar tamaño (máximo 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            throw new Error('La imagen no debe superar 2MB');
        }

        // Generar nombre único
        const fileExt = file.name.split('.').pop();
        const fileName = `${dni}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Subir archivo
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error al subir avatar:', error);
        throw error;
    }
};

/**
 * Eliminar avatar anterior
 */
export const eliminarAvatar = async (avatarUrl) => {
    try {
        if (!avatarUrl) return;

        // Extraer path del avatar
        const urlParts = avatarUrl.split('/storage/v1/object/public/avatars/');
        if (urlParts.length < 2) return;

        const path = urlParts[1];
        if (!path) return;

        const { error } = await supabase.storage
            .from('avatars')
            .remove([`avatars/${path}`]);

        if (error) throw error;
    } catch (error) {
        console.error('Error al eliminar avatar:', error);
        // No lanzar error, es opcional
    }
};
