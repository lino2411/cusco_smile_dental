import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TablaEndodoncia({ odontogramaId, endodoncias, onAdd, onUpdate, onDelete, disabled }) {
    const [lista, setLista] = useState(endodoncias || []);
    const [modoEdicion, setModoEdicion] = useState(null);
    const [form, setForm] = useState({
        od: '',  // ✅ Cambiado de numero_pieza a od
        diagnostico: '',
        longitud: '',
        lima_memoria: '',
    });

    useEffect(() => {
        setLista(endodoncias || []);
    }, [endodoncias]);

    const limpiarForm = () => {
        setForm({ od: '', diagnostico: '', longitud: '', lima_memoria: '' }); // ✅
        setModoEdicion(null);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGuardar = () => {
        if (!form.od) { // ✅ Validar 'od' en lugar de 'numero_pieza'
            Swal.fire({
                title: 'Error',
                text: 'Debe ingresar el número de pieza (OD)',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        if (modoEdicion) {
            onUpdate(modoEdicion, form);
            Swal.fire({
                title: 'Endodoncia actualizada',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });
        } else {
            onAdd(form);
            Swal.fire({
                title: 'Endodoncia agregada',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });
        }
        limpiarForm();
    };

    const handleEditar = (registro) => {
        setModoEdicion(registro.id);
        setForm({
            od: registro.od, // ✅ Cambiado
            diagnostico: registro.diagnostico,
            longitud: registro.longitud,
            lima_memoria: registro.lima_memoria,
        });
    };

    const handleEliminar = (id) => {
        Swal.fire({
            title: 'Eliminar endodoncia',
            text: '¿Está seguro de eliminar este registro?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#111827',
            color: '#F9FAFB',
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(id);
                Swal.fire({
                    title: 'Eliminado',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });
            }
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Tabla de Endodoncia</h3>

            {/* Formulario para agregar / editar */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <input
                    type="text"
                    name="od"  // ✅ Cambiado de numero_pieza a od
                    value={form.od}
                    onChange={handleChange}
                    placeholder="OD (Nº Pieza)"
                    disabled={disabled}
                    className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                />
                <input
                    type="text"
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    placeholder="Diagnóstico"
                    disabled={disabled}
                    className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                />
                <input
                    type="text"
                    name="longitud"
                    value={form.longitud}
                    onChange={handleChange}
                    placeholder="Longitud"
                    disabled={disabled}
                    className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                />
                <input
                    type="text"
                    name="lima_memoria"
                    value={form.lima_memoria}
                    onChange={handleChange}
                    placeholder="Lima Memoria"
                    disabled={disabled}
                    className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                />
                <button
                    onClick={handleGuardar}
                    disabled={disabled}
                    className={`flex items-center justify-center gap-2 bg-smile_600 hover:bg-smile_700 text-white rounded px-4 py-2 transition-colors font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    <PlusCircle className="w-5 h-5" />
                    {modoEdicion ? 'Actualizar' : 'Agregar'}
                </button>
            </div>

            {/* Tabla con registros */}
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">OD</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">Diagnóstico</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">Longitud</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">Lima Memoria</th>
                            <th className="border border-gray-300 p-2 text-center font-semibold text-gray-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-4xl">📋</span>
                                        <p className="font-medium">No hay registros de endodoncia</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            lista.map((endodoncia) => (
                                <tr key={endodoncia.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="border border-gray-300 p-2">{endodoncia.od}</td>
                                    <td className="border border-gray-300 p-2">{endodoncia.diagnostico}</td>
                                    <td className="border border-gray-300 p-2">{endodoncia.longitud}</td>
                                    <td className="border border-gray-300 p-2">{endodoncia.lima_memoria}</td>
                                    <td className="border border-gray-300 p-2">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleEditar(endodoncia)}
                                                disabled={disabled}
                                                className={`text-blue-600 hover:text-blue-800 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEliminar(endodoncia.id)}
                                                disabled={disabled}
                                                className={`text-red-600 hover:text-red-800 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
