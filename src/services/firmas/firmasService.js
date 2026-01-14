import { supabase } from '../supabaseClient';

/**
 * Guardar firma digital en Supabase Storage y registrar en BD
 * @param {string} firmaBase64 - Imagen de firma en base64
 * @param {string} tipoDocumento - 'pago', 'ortodoncia', 'consentimiento', etc.
 * @param {string} documentoId - ID del documento relacionado
 * @param {string} firmadoPorNombre - Nombre completo del paciente
 * @param {string} firmadoPorDni - DNI del paciente (opcional)
 * @returns {Promise<object>} - Datos de la firma guardada
 */
export async function guardarFirma(firmaBase64, tipoDocumento, documentoId, firmadoPorNombre, firmadoPorDni = null) {
    try {
        // 1. Convertir base64 a blob
        const base64Data = firmaBase64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/png' });

        // 2. Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${tipoDocumento}_${documentoId}_${timestamp}_${randomString}.png`;

        // 3. Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('firmas')
            .upload(fileName, blob, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 4. Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('firmas')
            .getPublicUrl(fileName);

        const firmaUrl = urlData.publicUrl;

        // 5. Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        // 6. Obtener IP (opcional)
        let ipAddress = null;
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
        } catch (e) {
            console.log('No se pudo obtener IP:', e);
        }

        // 7. Registrar en la tabla firmas
        const { data: firmaData, error: firmaError } = await supabase
            .from('firmas')
            .insert({
                tipo_documento: tipoDocumento,
                documento_id: documentoId,
                firma_url: firmaUrl,
                firmado_por_nombre: firmadoPorNombre,
                firmado_por_dni: firmadoPorDni,
                ip_address: ipAddress,
                user_agent: navigator.userAgent,
                created_by: user?.id
            })
            .select()
            .single();

        if (firmaError) throw firmaError;

        return firmaData;

    } catch (error) {
        console.error('Error guardando firma:', error);
        throw new Error(`Error al guardar la firma: ${error.message}`);
    }
}

/**
 * Obtener firma por documento
 */
export async function obtenerFirmaPorDocumento(tipoDocumento, documentoId) {
    try {
        const { data, error } = await supabase
            .from('firmas')
            .select('*')
            .eq('tipo_documento', tipoDocumento)
            .eq('documento_id', documentoId)
            .order('fecha_firma', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        return data;
    } catch (error) {
        console.error('Error obteniendo firma:', error);
        return null;
    }
}

/**
 * Eliminar firma
 */
export async function eliminarFirma(firmaId, firmaUrl) {
    try {
        // 1. Extraer nombre del archivo de la URL
        const fileName = firmaUrl.split('/').pop();

        // 2. Eliminar de Storage
        const { error: storageError } = await supabase.storage
            .from('firmas')
            .remove([fileName]);

        if (storageError) throw storageError;

        // 3. Eliminar registro de la BD
        const { error: dbError } = await supabase
            .from('firmas')
            .delete()
            .eq('id', firmaId);

        if (dbError) throw dbError;

        return true;
    } catch (error) {
        console.error('Error eliminando firma:', error);
        throw new Error(`Error al eliminar la firma: ${error.message}`);
    }
}

/**
 * Obtener todas las firmas de un tipo de documento
 */
export async function obtenerFirmasPorTipo(tipoDocumento) {
    try {
        const { data, error } = await supabase
            .from('firmas')
            .select('*')
            .eq('tipo_documento', tipoDocumento)
            .order('fecha_firma', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error obteniendo firmas:', error);
        return [];
    }
}
