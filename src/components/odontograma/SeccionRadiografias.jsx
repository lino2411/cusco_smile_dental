import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { subirArchivoRadiografia, obtenerRadiografiasPorOdontograma, eliminarRadiografiaService } from '../../services/odontogramasService';

export default function SeccionRadiografias({ odontogramaId, disabled }) {
    const [radiografias, setRadiografias] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputFileRef = useRef(null);

    const cargarRadiografias = async () => {
        setLoading(true);
        try {
            const fotos = await obtenerRadiografiasPorOdontograma(odontogramaId);
            setRadiografias(fotos);
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar las radiografías',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (odontogramaId) {
            cargarRadiografias();
        }
    }, [odontogramaId]);

    const handleSubirArchivo = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        setLoading(true);
        try {
            await subirArchivoRadiografia(odontogramaId, archivo);
            Swal.fire({
                title: 'Radiografía subida',
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 1500,
                showConfirmButton: false,
            });
            cargarRadiografias();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo subir la radiografía',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
            inputFileRef.current.value = null; // Reset input
        }
    };

    const handleEliminar = async (id) => {
        const result = await Swal.fire({
            title: 'Eliminar radiografía',
            text: '¿Seguro que quieres eliminar esta radiografía?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#111827',
            color: '#F9FAFB',
        });
        if (result.isConfirmed) {
            setLoading(true);
            try {
                await eliminarRadiografiaService(id);
                Swal.fire({
                    title: 'Radiografía eliminada',
                    icon: 'success',
                    background: '#111827',
                    color: '#F9FAFB',
                    timer: 1500,
                    showConfirmButton: false,
                });
                cargarRadiografias();
            } catch {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar la radiografía',
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Radiografías Periapicales</h3>

            <input
                type="file"
                accept="image/*"
                ref={inputFileRef}
                className="hidden"
                onChange={handleSubirArchivo}
                disabled={disabled || loading}
            />

            <button
                onClick={() => inputFileRef.current.click()}
                disabled={disabled || loading}
                className={`flex items-center gap-2 bg-smile_600 hover:bg-smile_700 text-white px-4 py-2 rounded transition ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                <PlusCircle className="w-5 h-5" />
                Subir radiografía
            </button>

            {loading && <p className="mt-4 text-gray-600">Cargando...</p>}

            <div className="mt-4 grid grid-cols-3 gap-4">
                {radiografias.length === 0 ? (
                    <p className="text-gray-500 col-span-3 text-center">No hay radiografías subidas</p>
                ) : (
                    radiografias.map((foto) => (
                        <div key={foto.id} className="relative group border rounded overflow-hidden">
                            <img
                                src={foto.url}
                                alt={foto.descripcion || 'Radiografía'}
                                className="w-full h-32 object-cover"
                                loading="lazy"
                            />
                            {!disabled && (
                                <button
                                    onClick={() => handleEliminar(foto.id)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                    aria-label="Eliminar radiografía"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
