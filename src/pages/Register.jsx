import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [dni, setDni] = useState('');
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('admin');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setLoading(true);

        // 1. Verificar si el DNI ya existe
        const { data: dniExistente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('dni', dni);

        if (dniExistente && dniExistente.length > 0) {
            Swal.fire('Error', 'El DNI ya está registrado', 'error');
            setLoading(false);
            return;
        }

        // 2. Verificar si el correo ya existe en Auth
        const { data: correoExistente } = await supabase.auth.getUserByEmail(correo);
        if (correoExistente?.user) {
            Swal.fire('Error', 'El correo ya está registrado en Auth', 'error');
            setLoading(false);
            return;
        }

        // 3. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: correo,
            password: password
        });

        if (authError || !authData.user) {
            Swal.fire('Error', 'No se pudo crear el usuario en Auth', 'error');
            setLoading(false);
            return;
        }

        const auth_user_id = authData.user.id;

        // 4. Insertar en tabla usuarios
        const { error: dbError } = await supabase.from('usuarios').insert([
            {
                dni,
                nombre_completo: nombre,
                correo,
                telefono,
                rol,
                auth_user_id
            }
        ]);

        if (dbError) {
            Swal.fire('Error', 'No se pudo guardar en la base de datos', 'error');
            setLoading(false);
            return;
        }

        Swal.fire('Éxito', 'Usuario registrado correctamente', 'success');
        navigate('/');
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Registro de Usuario</h2>
            <input type="text" placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} className="input" />
            <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} className="input" />
            <input type="email" placeholder="Correo" value={correo} onChange={e => setCorreo(e.target.value)} className="input" />
            <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} className="input" />
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="input" />
            <select value={rol} onChange={e => setRol(e.target.value)} className="input">
                <option value="admin">Admin</option>
                <option value="recepcion">Recepción</option>
                <option value="odontologo">Odontólogo</option>
            </select>
            <button onClick={handleRegister} disabled={loading} className="btn mt-4">
                {loading ? 'Registrando...' : 'Registrar'}
            </button>
        </div>
    );
}
