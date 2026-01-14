/**
 * ============================================================================
 * SERVICIO DE CONTROL DE INTENTOS DE LOGIN - PRODUCCIÓN
 * ============================================================================
 */

import { supabase } from './supabaseClient';

const TIEMPO_BLOQUEO_MINUTOS = 15;
const MAX_INTENTOS = 3;

export const loginAttemptsService = {
    async verificarBloqueo(dni) {
        try {
            const { data, error } = await supabase
                .from('login_attempts')
                .select('*')
                .eq('dni', dni);

            if (error) {
                console.error('Error al verificar bloqueo:', error);
                return { bloqueado: false, intentos: 0, tiempoRestante: 0 };
            }

            if (!data || data.length === 0) {
                return { bloqueado: false, intentos: 0, tiempoRestante: 0 };
            }

            const registro = data[0];

            if (registro.bloqueado_hasta) {
                const tiempoBloqueo = new Date(registro.bloqueado_hasta).getTime();
                const ahora = Date.now();

                if (tiempoBloqueo > ahora) {
                    const minutosRestantes = Math.ceil((tiempoBloqueo - ahora) / 1000 / 60);
                    return {
                        bloqueado: true,
                        intentos: registro.intentos,
                        tiempoRestante: minutosRestantes
                    };
                } else {
                    await this.resetearIntentos(dni);
                    return { bloqueado: false, intentos: 0, tiempoRestante: 0 };
                }
            }

            return {
                bloqueado: false,
                intentos: registro.intentos || 0,
                tiempoRestante: 0
            };

        } catch (err) {
            console.error('Error inesperado al verificar bloqueo:', err);
            return { bloqueado: false, intentos: 0, tiempoRestante: 0 };
        }
    },

    async registrarIntentoFallido(dni, ipAddress = null) {
        try {
            const { data: existing } = await supabase
                .from('login_attempts')
                .select('*')
                .eq('dni', dni);

            const registroExistente = existing && existing.length > 0 ? existing[0] : null;
            const nuevosIntentos = (registroExistente?.intentos || 0) + 1;
            const bloqueado = nuevosIntentos >= MAX_INTENTOS;

            let bloqueadoHasta = null;
            if (bloqueado) {
                const ahora = new Date();
                bloqueadoHasta = new Date(ahora.getTime() + TIEMPO_BLOQUEO_MINUTOS * 60 * 1000);
            }

            if (registroExistente) {
                const { error } = await supabase
                    .from('login_attempts')
                    .update({
                        intentos: nuevosIntentos,
                        bloqueado_hasta: bloqueadoHasta,
                        ultimo_intento: new Date().toISOString(),
                        ip_address: ipAddress || registroExistente.ip_address
                    })
                    .eq('dni', dni);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('login_attempts')
                    .insert({
                        dni,
                        intentos: nuevosIntentos,
                        bloqueado_hasta: bloqueadoHasta,
                        ip_address: ipAddress
                    });

                if (error) throw error;
            }

            return {
                intentos: nuevosIntentos,
                bloqueado,
                intentosRestantes: bloqueado ? 0 : MAX_INTENTOS - nuevosIntentos
            };

        } catch (err) {
            console.error('Error al registrar intento fallido:', err);
            return { intentos: 0, bloqueado: false, intentosRestantes: MAX_INTENTOS };
        }
    },

    async resetearIntentos(dni) {
        try {
            const { error } = await supabase
                .from('login_attempts')
                .delete()
                .eq('dni', dni);

            if (error) throw error;
            return true;

        } catch (err) {
            console.error('Error al resetear intentos:', err);
            return false;
        }
    }
};

export default loginAttemptsService;
