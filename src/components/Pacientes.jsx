// src/pages/modules/Pacientes.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { FaEye } from 'react-icons/fa';

export default function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarPacientes = async () => {
            const { data, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) {
                console.error('Error al cargar pacientes:', error.message);
            } else {
                setPacientes(data);
            }
            setLoading(false);
        };

        cargarPacientes();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Lista de Pacientes</h2>
            {loading ? (
                <p>Cargando pacientes...</p>
            ) : (
                <table className="min-w-full bg-white border rounded shadow">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left p-2">DNI</th>
                            <th className="text-left p-2">Nombre</th>
                            <th className="text-left p-2">Sexo</th>
                            <th className="text-left p-2">Celular</th>
                            <th className="text-left p-2">Fecha Registro</th>
                            <th className="text-left p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pacientes.map((p) => (
                            <tr key={p.id} className="border-t">
                                <td className="p-2">{p.dni}</td>
                                <td className="p-2">{`${p.nombres} ${p.apellidos}`}</td>
                                <td className="p-2">{p.sexo}</td>
                                <td className="p-2">{p.celular}</td>
                                <td className="p-2">{new Date(p.creado_en).toLocaleDateString()}</td>
                                <td className="p-2">
                                    <button className="text-blue-600 hover:text-blue-800">
                                        <FaEye />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
