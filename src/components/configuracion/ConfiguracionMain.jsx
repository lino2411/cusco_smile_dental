import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { obtenerConfiguracion, actualizarConfiguracion } from '../../services/configuracion/configuracionService';
import { usePermisos } from '../../context/PermisosContext';


// Tabs
import General from './tabs/General';
import DatosClinica from './tabs/DatosClinica';
import HorariosAtencion from './tabs/HorariosAtencion';
import Apariencia from './tabs/Apariencia';


export default function ConfiguracionMain() {
    const permisos = usePermisos();
    const [tabActivo, setTabActivo] = useState('clinica');
    const [configuracion, setConfiguracion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);


    useEffect(() => {
        cargarConfiguracion();
    }, []);


    const cargarConfiguracion = async () => {
        try {
            setCargando(true);
            const data = await obtenerConfiguracion();
            setConfiguracion(data);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la configuración',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setCargando(false);
        }
    };


    const handleGuardar = async (datosActualizados) => {
        if (!permisos.usuarios.editar) {
            Swal.fire({
                icon: 'error',
                title: 'Sin permisos',
                text: 'Solo los administradores pueden editar la configuración',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }


        try {
            setGuardando(true);
            await actualizarConfiguracion(datosActualizados);


            Swal.fire({
                icon: 'success',
                title: '¡Configuración guardada!',
                text: 'Los cambios se guardaron correctamente',
                timer: 2000,
                showConfirmButton: false,
                background: '#111827',
                color: '#F9FAFB',
            });


            await cargarConfiguracion();
        } catch (error) {
            console.error('Error al guardar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar la configuración',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setGuardando(false);
        }
    };


    const tabs = [
        { id: 'general', label: '🏢 General', icon: '🏢' },
        { id: 'clinica', label: '🏥 Datos de la Clínica', icon: '🏥' },
        { id: 'horarios', label: '🕐 Horarios', icon: '🕐' },
        { id: 'apariencia', label: '🎨 Apariencia', icon: '🎨' },
    ];


    if (cargando) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-smile_600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando configuración...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors">
            <div className="max-w-6xl mx-auto space-y-6">


                {/* HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-xl p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Settings className="w-8 h-8" />
                                Configuración del Sistema
                            </h1>
                            <p className="text-smile_100 mt-1">
                                Personaliza los datos de tu clínica
                            </p>
                        </div>
                        <button
                            onClick={cargarConfiguracion}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                            <RefreshCcw className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </motion.div>


                {/* TABS */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTabActivo(tab.id)}
                                    className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${tabActivo === tab.id
                                            ? 'bg-smile_50 dark:bg-smile_900/30 text-smile_700 dark:text-smile_400 border-b-4 border-smile_600'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* CONTENIDO DEL TAB */}
                    <div className="p-6 dark:bg-gray-800">
                        {tabActivo === 'general' && (
                            <General
                                configuracion={configuracion}
                                onGuardar={handleGuardar}
                                guardando={guardando}
                            />
                        )}
                        {tabActivo === 'clinica' && (
                            <DatosClinica
                                configuracion={configuracion}
                                onGuardar={handleGuardar}
                                guardando={guardando}
                            />
                        )}
                        {tabActivo === 'horarios' && (
                            <HorariosAtencion
                                configuracion={configuracion}
                                onGuardar={handleGuardar}
                                guardando={guardando}
                            />
                        )}
                        {tabActivo === 'apariencia' && (
                            <Apariencia
                                configuracion={configuracion}
                                onGuardar={handleGuardar}
                                guardando={guardando}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
