/**
 * ============================================================================
 * COMPONENTE DE LOGIN - VERSIÓN FINAL
 * ============================================================================
 * Versión: 1.2 - Anti-autocompletado del navegador
 * Fecha: 09 de Enero 2026
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { loginAttemptsService } from '../services/loginAttemptsService';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaIdCard, FaLock, FaLockOpen, FaUserMd } from 'react-icons/fa';

export default function Login() {
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);
    const [formKey, setFormKey] = useState(Date.now()); // ✅ Key único para forzar re-render
    const navigate = useNavigate();
    const formRef = useRef(null);

    const swalStyle = {
        background: '#111827',
        color: '#ffffff',
        customClass: {
            popup: 'rounded-lg p-6',
            title: 'text-lg font-semibold text-white',
            content: 'text-sm text-slate-200',
            confirmButton: 'bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded',
            cancelButton: 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-2',
        },
        buttonsStyling: false,
    };

    // ✅ EFFECT: Limpiar campos al montar componente
    useEffect(() => {
        const checkSessionAndCleanFields = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('✅ Sesión activa detectada, redirigiendo...');
                navigate('/dashboard', { replace: true });
            } else {
                // ✅ FORZAR limpieza completa
                console.log('🧹 Limpiando campos del login...');
                setDni('');
                setPassword('');
                setIsLocked(false);
                setTiempoRestante(0);
                setFormKey(Date.now()); // Cambiar key para forzar re-render

                // ✅ Resetear el formulario HTML nativo
                if (formRef.current) {
                    formRef.current.reset();
                }
            }
        };

        checkSessionAndCleanFields();

        // ✅ Limpieza al desmontar
        return () => {
            setDni('');
            setPassword('');
            if (formRef.current) {
                formRef.current.reset();
            }
        };
    }, [navigate]);

    const mostrarAlertaBloqueo = (minutos) => {
        Swal.fire({
            title: '🔒 Acceso Bloqueado',
            html: `
                <div class="text-center">
                    <p class="mb-3">Ha excedido el número de intentos permitidos.</p>
                    <div class="bg-red-500/20 p-3 rounded-lg mb-3">
                        <p class="text-lg font-bold text-red-400">Bloqueado por ${minutos} minuto(s)</p>
                    </div>
                    <p class="text-sm text-slate-300">
                        Por favor, intente nuevamente después o contacte al administrador.
                    </p>
                </div>
            `,
            icon: 'error',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,
            ...swalStyle,
            customClass: {
                ...swalStyle.customClass,
                confirmButton: 'bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded',
            }
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const dniValue = String(dni || '').trim();
        if (!dniValue) {
            Swal.fire({
                title: '⚠️ Campo Vacío',
                text: 'Por favor ingresa tu DNI',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                ...swalStyle
            });
            return;
        }

        if (!password) {
            Swal.fire({
                title: '⚠️ Campo Vacío',
                text: 'Por favor ingresa tu contraseña',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                ...swalStyle
            });
            return;
        }

        setLoading(true);

        try {
            const { bloqueado, tiempoRestante: minutos } = await loginAttemptsService.verificarBloqueo(dniValue);

            if (bloqueado) {
                setIsLocked(true);
                setTiempoRestante(minutos);
                mostrarAlertaBloqueo(minutos);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.rpc('get_user_by_dni', { d: dniValue });

            if (error) {
                console.error('❌ Error RPC:', error);
                Swal.fire({
                    title: '❌ Error del Sistema',
                    text: 'Error al consultar usuario. Intente nuevamente.',
                    icon: 'error',
                    confirmButtonText: 'Entendido',
                    ...swalStyle
                });
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                const resultado = await loginAttemptsService.registrarIntentoFallido(dniValue);

                if (resultado.bloqueado) {
                    setIsLocked(true);
                    setTiempoRestante(15);
                    mostrarAlertaBloqueo(15);
                } else {
                    Swal.fire({
                        title: '⚠️ DNI No Registrado',
                        html: `
                            <div class="text-center">
                                <p class="mb-3">El DNI <strong>${dniValue}</strong> no está registrado.</p>
                                <div class="bg-yellow-500/20 p-3 rounded-lg">
                                    <p class="text-yellow-400 font-semibold">
                                        Le quedan <strong>${resultado.intentosRestantes}</strong> intento(s)
                                    </p>
                                </div>
                            </div>
                        `,
                        icon: 'warning',
                        confirmButtonText: 'Reintentar',
                        ...swalStyle
                    });
                }

                setLoading(false);
                return;
            }

            const usuario = data[0];

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: usuario.correo,
                password,
            });

            if (authError) {
                const resultado = await loginAttemptsService.registrarIntentoFallido(dniValue);

                if (resultado.bloqueado) {
                    setIsLocked(true);
                    setTiempoRestante(15);
                    mostrarAlertaBloqueo(15);
                } else {
                    Swal.fire({
                        title: '❌ Contraseña Incorrecta',
                        html: `
                            <div class="text-center">
                                <p class="mb-3">La contraseña ingresada es incorrecta.</p>
                                <div class="bg-red-500/20 p-3 rounded-lg">
                                    <p class="text-red-400 font-semibold">
                                        Le quedan <strong>${resultado.intentosRestantes}</strong> intento(s)
                                    </p>
                                </div>
                            </div>
                        `,
                        icon: 'error',
                        confirmButtonText: 'Reintentar',
                        ...swalStyle
                    });
                }

                setLoading(false);
                return;
            }

            await loginAttemptsService.resetearIntentos(dniValue);
            localStorage.setItem('rol', usuario.rol);

            // ✅ Limpiar campos antes de mostrar alerta
            setDni('');
            setPassword('');
            if (formRef.current) {
                formRef.current.reset();
            }

            Swal.fire({
                title: '✅ Bienvenido',
                text: 'Acceso concedido.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                ...swalStyle
            });

            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1500);

        } catch (err) {
            console.error('❌ Error inesperado:', err);
            Swal.fire({
                title: '❌ Error Inesperado',
                text: 'Ocurrió un error. Intente nuevamente.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                ...swalStyle
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1598256989800-fe5f95da9787?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870')`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
            </div>

            <div className="relative z-10 h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-solid border-smile_600 shadow-lg">
                            <img
                                src="/logo/logo_smile.png"
                                alt="logo smile dental"
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                        <h1 className="text-3xl mb-2 flex items-center justify-center font-bold bg-gradient-to-r from-smile_400 to-smile_600 bg-clip-text text-transparent">
                            Consultorio Dental Cusco Smile
                        </h1>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-solid border-smile_600 p-8">
                        {isLocked && tiempoRestante > 0 && (
                            <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg animate-pulse">
                                <div className="flex items-center justify-center space-x-2">
                                    <FaLock className="text-red-400 text-xl" />
                                    <p className="text-red-200 text-sm font-semibold">
                                        Acceso bloqueado por {tiempoRestante} minuto(s)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ✅ Form con key única y ref para forzar reset */}
                        <form
                            key={formKey}
                            ref={formRef}
                            onSubmit={handleLogin}
                            className="space-y-6"
                            autoComplete="off"
                        >
                            <div>
                                <label htmlFor="dni" className="block text-sm font-medium text-smile_100 mb-2">
                                    DNI
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaIdCard className="h-5 w-5 text-smile_300" />
                                    </div>
                                    {/* ✅ Input con múltiples técnicas anti-autocompletado */}
                                    <input
                                        id="dni"
                                        name={`dni-${formKey}`}
                                        type="text"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                        data-form-type="other"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                        disabled={isLocked}
                                        className={`block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-smile_200 focus:outline-none focus:ring-2 focus:ring-smile_400 focus:border-transparent transition-all duration-300 backdrop-blur-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        placeholder="Ingrese su DNI"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-smile_100 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-smile_300" />
                                    </div>
                                    {/* ✅ Input contraseña con técnicas anti-autocompletado */}
                                    <input
                                        id="password"
                                        name={`password-${formKey}`}
                                        type="password"
                                        autoComplete="new-password"
                                        data-form-type="other"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLocked}
                                        className={`block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-smile_200 focus:outline-none focus:ring-2 focus:ring-smile_400 focus:border-transparent transition-all duration-300 backdrop-blur-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        placeholder="Ingrese su contraseña"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || isLocked}
                                className={`flex justify-center items-center gap-3 w-full py-3 px-4 bg-gradient-to-r from-smile_500 to-smile_600 text-white font-semibold rounded-lg shadow-lg hover:from-smile_600 hover:to-smile_700 focus:outline-none focus:ring-2 focus:ring-smile_400 focus:ring-offset-2 focus:ring-offset-transparent transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isLocked ? 'grayscale' : ''
                                    }`}
                            >
                                <FaLockOpen className="h-5 w-5" />
                                {isLocked ? '🔒 Acceso Bloqueado' : 'Ingresar al Sistema'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-smile_200">
                                Máximo 3 intentos • Bloqueo temporal de 15 minutos
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
                        <div className="relative w-24 h-24 mb-4">
                            <div className="absolute inset-0 border-4 border-smile_200/30 border-t-smile_400 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin" style={{ animationDelay: '150ms' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FaUserMd className="text-white text-2xl" />
                            </div>
                        </div>
                        <p className="text-white text-lg font-medium animate-pulse">
                            Autenticando usuario...
                        </p>
                        <div className="mt-4 flex space-x-1">
                            <div className="w-2 h-2 bg-smile_400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-smile_400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-smile_400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
