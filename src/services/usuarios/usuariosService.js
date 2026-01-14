import { supabase } from "../supabaseClient";


/**
 * Obtener todos los usuarios
 */
export const obtenerUsuarios = async () => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('creado_en', { ascending: false });


        if (error) throw error;


        return data || [];
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
};


/**
 * Obtener usuarios por rol
 */
export const obtenerUsuariosPorRol = async (rol) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('rol', rol)
            .order('nombre_completo', { ascending: true });


        if (error) throw error;


        return data || [];
    } catch (error) {
        console.error(`Error al obtener usuarios con rol ${rol}:`, error);
        throw error;
    }
};


/**
 * Obtener un usuario por ID
 */
export const obtenerUsuarioPorId = async (id) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();


        if (error) throw error;


        return data;
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        throw error;
    }
};


/**
 * Obtener un usuario por DNI
 */
export const obtenerUsuarioPorDNI = async (dni) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('dni', dni)
            .maybeSingle();


        if (error) throw error;


        return data;
    } catch (error) {
        console.error('Error al obtener usuario por DNI:', error);
        throw error;
    }
};


/**
 * Verificar si un DNI ya existe
 */
export const verificarDNIExistente = async (dni, excluirId = null) => {
    try {
        let query = supabase
            .from('usuarios')
            .select('id')
            .eq('dni', dni);


        if (excluirId) {
            query = query.neq('id', excluirId);
        }


        const { data, error } = await query.maybeSingle();


        if (error && error.code !== 'PGRST116') {
            throw error;
        }


        return !!data;
    } catch (error) {
        console.error('Error al verificar DNI:', error);
        return false;
    }
};


/**
 * Crear usuario (Auth + BD)
 */
export const crearUsuario = async (datosUsuario) => {
    try {
        const { dni, nombre_completo, correo, celular, rol, password, es_admin } = datosUsuario;


        // Validaciones
        if (!dni || !nombre_completo || !rol || !password) {
            throw new Error('DNI, nombre completo, rol y contraseña son obligatorios');
        }


        if (!correo || !correo.trim()) {
            throw new Error('El correo electrónico es obligatorio');
        }


        if (dni.length !== 8) {
            throw new Error('El DNI debe tener 8 dígitos');
        }


        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }


        // Verificar que el DNI no exista
        const dniExiste = await verificarDNIExistente(dni);
        if (dniExiste) {
            throw new Error('El DNI ya está registrado en el sistema');
        }


        const emailFinal = correo.trim();


        // PASO 1: Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emailFinal,
            password: password,
            options: {
                data: {
                    dni: dni,
                    rol: rol,
                    nombre_completo: nombre_completo
                }
            }
        });


        if (authError) {
            console.error('Error al crear usuario en Auth:', authError);
            throw new Error(`No se pudo crear la cuenta: ${authError.message}`);
        }


        if (!authData.user) {
            throw new Error('No se pudo crear la cuenta de usuario');
        }


        // PASO 2: Crear registro en tabla usuarios
        const { data: usuarioData, error: dbError } = await supabase
            .from('usuarios')
            .insert([
                {
                    dni: dni,
                    nombre_completo: nombre_completo,
                    correo: emailFinal,
                    celular: celular,
                    rol: rol,
                    auth_user_id: authData.user.id,
                    avatar_url: datosUsuario.avatar_url || null,
                    es_admin: es_admin || false
                }
            ])
            .select()
            .single();


        if (dbError) {
            console.error('Error al insertar usuario en BD:', dbError);


            // Rollback: eliminar de Auth si falló la BD
            try {
                await supabase.auth.admin.deleteUser(authData.user.id);
            } catch (deleteError) {
                console.error('Error al hacer rollback:', deleteError);
            }


            throw new Error(`Error al registrar usuario: ${dbError.message}`);
        }


        return usuarioData;


    } catch (error) {
        console.error('Error en crearUsuario:', error);
        throw error;
    }
};


/**
 * Actualizar usuario
 */
export const actualizarUsuario = async (id, datosActualizados) => {
    try {
        const { nombre_completo, correo, celular, rol, avatar_url, es_admin } = datosActualizados;


        if (!nombre_completo || !rol) {
            throw new Error('Nombre completo y rol son obligatorios');
        }


        if (!correo || !correo.trim()) {
            throw new Error('El correo electrónico es obligatorio');
        }


        // Obtener usuario actual para detectar cambio de correo
        const { data: usuarioAnterior } = await supabase
            .from('usuarios')
            .select('correo')
            .eq('id', id)
            .single();


        const correoAnterior = usuarioAnterior?.correo;
        const correoCambio = correoAnterior !== correo.trim();


        // Actualizar usuario (el trigger sincronizará el email automáticamente)
        const { data, error } = await supabase
            .from('usuarios')
            .update({
                nombre_completo: nombre_completo.trim(),
                correo: correo.trim(),
                celular: celular?.trim() || null,
                rol: rol,
                avatar_url: avatar_url || null,
                es_admin: es_admin !== undefined ? es_admin : false
            })
            .eq('id', id)
            .select()
            .single();


        if (error) throw error;


        return {
            ...data,
            correo_cambiado: correoCambio
        };
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
};


/**
 * Cambiar contraseña de un usuario
 */
export const cambiarPasswordUsuario = async (auth_user_id, nuevaPassword) => {
    try {
        if (!auth_user_id) {
            throw new Error('El usuario no tiene cuenta de autenticación');
        }


        if (nuevaPassword.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }


        const { data, error } = await supabase.rpc('change_user_password', {
            target_user_id: auth_user_id,
            new_password: nuevaPassword
        });


        if (error) throw error;


        return data;
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        throw error;
    }
};


/**
 * Eliminar usuario (Auth + BD)
 */
export const eliminarUsuario = async (id, auth_user_id) => {
    try {
        // PASO 1: Eliminar de la BD
        const { error: dbError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);


        if (dbError) throw dbError;


        // PASO 2: Eliminar de Auth
        if (auth_user_id) {
            try {
                await supabase.auth.admin.deleteUser(auth_user_id);
            } catch (authError) {
                console.warn('No se pudo eliminar de Auth:', authError);
            }
        }


        return { success: true };
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
};


/**
 * Obtener estadísticas de usuarios
 */
export const obtenerEstadisticasUsuarios = async () => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('rol');


        if (error) throw error;


        const stats = {
            total: data.length,
            admins: data.filter(u => u.rol === 'admin').length,
            odontologos: data.filter(u => u.rol === 'odontologo').length,
            recepcionistas: data.filter(u => u.rol === 'recepcionista').length
        };


        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        throw error;
    }
};
