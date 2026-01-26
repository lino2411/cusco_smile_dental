import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { obtenerTratamientos, eliminarTratamiento } from '../../services/tratamientos/tratamientosService';
import TratamientoModal from '../tratamientos/TratamientoModal';

export default function SelectorTratamiento({ value, onChange }) {
    const [busqueda, setBusqueda] = useState('');
    const [mostrarLista, setMostrarLista] = useState(false);
    const [tratamientos, setTratamientos] = useState([]);
    const [tratamientosFiltrados, setTratamientosFiltrados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const wrapperRef = useRef(null);
    const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

    // Cargar tratamientos desde BD al montar
    useEffect(() => {
        cargarTratamientos();
    }, []);

    const cargarTratamientos = async () => {
        try {
            setCargando(true);
            const data = await obtenerTratamientos();
            setTratamientos(data);
            setTratamientosFiltrados(data);
        } catch (error) {
            console.error('Error cargando tratamientos:', error);
        } finally {
            setCargando(false);
        }
    };

    // Manejar tratamiento creado
    const handleTratamientoCreado = (nuevoTratamiento) => {
        cargarTratamientos(); // Recargar lista
        onChange(nuevoTratamiento.nombre); // Seleccionar automáticamente
        setMostrarLista(false);
    };

    // Filtrar tratamientos según búsqueda
    useEffect(() => {
        if (busqueda.trim() === '') {
            setTratamientosFiltrados(tratamientos);
        } else {
            setTratamientosFiltrados(
                tratamientos.filter(t =>
                    t.nombre.toLowerCase().includes(busqueda.toLowerCase())
                )
            );
        }
    }, [busqueda, tratamientos]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setMostrarLista(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSeleccionar = (tratamiento) => {
        onChange(tratamiento.nombre);
        setMostrarLista(false);
        setBusqueda('');
    };

    // NUEVA FUNCIÓN: Eliminar tratamiento
    const handleEliminar = async (e, tratamiento) => {
        e.stopPropagation(); // Evitar que se seleccione al hacer clic en eliminar

        const result = await Swal.fire({
            title: '¿Eliminar tratamiento?',
            html: `<p class="text-gray-300">El tratamiento <strong>"${tratamiento.nombre}"</strong> se eliminará de la lista.</p><p class="text-sm text-gray-400 mt-2">Se eliminará permanentemente de la base de datos.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            background: '#111827',
            color: '#F9FAFB',
        });

        if (result.isConfirmed) {
            try {
                await eliminarTratamiento(tratamiento.id);

                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El tratamiento ha sido eliminado de la lista',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });

                // Recargar lista
                cargarTratamientos();

                // Si el tratamiento eliminado era el seleccionado, limpiar selección
                if (value === tratamiento.nombre) {
                    onChange('');
                }
            } catch (error) {
                console.error('Error al eliminar tratamiento:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el tratamiento',
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:border-smile_600 transition-all flex items-center justify-between bg-white"
                onClick={() => setMostrarLista(!mostrarLista)}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || 'Selecciona un tratamiento'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarLista ? 'rotate-180' : ''}`} />
            </div>

            {mostrarLista && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
                    {/* Buscador */}
                    <div className="p-3 border-b bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar tratamiento..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:outline-none text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* BOTÓN AGREGAR NUEVO TRATAMIENTO */}
                    <div className="p-2 border-b bg-white">
                        <button
                            type="button"
                            onClick={() => {
                                setMostrarLista(false);
                                setMostrarModalNuevo(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Nuevo Tratamiento
                        </button>
                    </div>

                    {/* Lista de tratamientos */}
                    <div className="overflow-y-auto max-h-80">
                        {cargando ? (
                            <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-smile_600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Cargando...</p>
                            </div>
                        ) : tratamientosFiltrados.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No se encontraron tratamientos
                            </div>
                        ) : (
                            tratamientosFiltrados.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => handleSeleccionar(t)}
                                    className="group px-4 py-2.5 hover:bg-smile_50 cursor-pointer transition-colors border-b last:border-b-0 flex items-start justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {t.nombre}
                                        </div>
                                        {t.categoria && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {t.categoria}
                                                {t.costo_sugerido > 0 &&
                                                    ` • S/ ${t.costo_sugerido.toFixed(2)}`
                                                }
                                            </div>
                                        )}
                                    </div>
                                    {/* BOTÓN ELIMINAR (visible al hacer hover) */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleEliminar(e, t)}
                                        className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar tratamiento"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ✅ MODAL PARA CREAR TRATAMIENTO */}
            {mostrarModalNuevo && (
                <TratamientoModal
                    onClose={() => setMostrarModalNuevo(false)}
                    onTratamientoGuardado={handleTratamientoCreado}
                />
            )}
        </div>
    );
}
