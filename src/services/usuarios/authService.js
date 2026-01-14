import { supabase } from '../supabaseClient';

/**
 * Verificar la contraseña del usuario actual
 * Intenta hacer login temporal para validar la contraseña
 */
export const verificarPasswordActual = async (email, password) => {
    try {
        // Guardar sesión actual
        const { data: { session: sessionActual } } = await supabase.auth.getSession();

        // Intentar login con las credenciales
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw new Error('Contraseña incorrecta');

        // Restaurar sesión original si se guardó
        if (sessionActual) {
            await supabase.auth.setSession({
                access_token: sessionActual.access_token,
                refresh_token: sessionActual.refresh_token,
            });
        }

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Cambiar la contraseña del usuario actualmente logueado
 */
export const cambiarMiPassword = async (nuevaPassword) => {
    try {
        if (nuevaPassword.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        const { data, error } = await supabase.auth.updateUser({
            password: nuevaPassword
        });

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * Enviar correo de recuperación de contraseña a un usuario
 */
export const enviarEmailResetPassword = async (email) => {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
        });

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * Cambiar contraseña de cualquier usuario (admin)
 */
export const cambiarPasswordUsuario = async (authUserId, nuevaPassword) => {
    try {
        if (!authUserId) {
            throw new Error('auth_user_id es requerido');
        }

        if (nuevaPassword.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        const { data, error } = await supabase.rpc('change_user_password', {
            target_user_id: authUserId,
            new_password: nuevaPassword
        });

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};
