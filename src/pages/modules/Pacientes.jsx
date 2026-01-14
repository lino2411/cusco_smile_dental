// e:/Documentos (D)/2025/LINO/Proyectos/cusco_smile_dental/src/pages/modules/Pacientes.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PacientesTable from '../../components/pacientes/PacientesTable';
import PacientesSearch from '../../components/pacientes/PacientesSearch';
import PacientesFormModal from '../../components/pacientes/PacientesFormModal';
import { obtenerPacientes, eliminarPaciente } from '../../services/pacientesService';
import PacientePerfilModal from '../../components/pacientes/PacientePerfilModal';
import { supabase } from '../../services/supabaseClient';
import { generarPDFListaPacientes } from '../../utils/pacientes/pacientesListaPDFGenerator';
import { generarExcelListaPacientes } from '../../utils/pacientes/pacientesListaExcelGenerator';
import { usePaciente } from '../../context/PacienteContext';
import { UserPlus, ChevronLeft, ChevronRight, FileSpreadsheet, FileUp, Users } from "lucide-react";
import { useConfiguracion } from '../../hooks/useConfiguracion';
import Swal from 'sweetalert2';

export default function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [loading, setLoading] = useState(true);
    // ✅ Nuevos estados para edición
    const [pacienteEditando, setPacienteEditando] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    // ✅ Estado para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const pacientesPorPagina = 6;

    // ✅ Estado para ver perfil de paciente
    const [pacientePerfil, setPacientePerfil] = useState(null);
    // ✅ Contexto de paciente
    const { setPacienteSeleccionado } = usePaciente();

    const navigate = useNavigate(); // ✅ 3. Inicializa useNavigate

    // ✅ Hook para abrir el perfil del paciente desde la URL
    const [searchParams, setSearchParams] = useSearchParams();

    // ✅ Función para ver perfil de paciente
    const handleVerPerfilPaciente = (paciente) => {
        setPacienteSeleccionado(paciente);
    };

    // ✅ Función para exportar pacientes a Excel
    const handleExportExcel = async () => {
        await generarExcelListaPacientes(pacientes);

        Swal.fire({
            title: 'Excel generado',
            text: 'La lista de pacientes se descargó correctamente',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 2000,
            showConfirmButton: false,
        });
    };

    // ✅ Función exportar pacientes a PDF
    const handleExportPDF = () => {
        generarPDFListaPacientes(pacientes);

        Swal.fire({
            title: 'PDF generado',
            text: 'La lista de pacientes se descargó correctamente',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 2000,
            showConfirmButton: false,
        });
    };

    // ✅ Función para cargar o recargar los pacientes
    const cargarPacientes = useCallback(async (abrirPerfilId = null, tab = null) => {
        setLoading(true); // Inicia la carga
        try {
            const data = await obtenerPacientes();
            setPacientes(data);
        } catch (error) {
            console.error('Error al cargar pacientes:', error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ useEffect para la carga inicial de pacientes.
    useEffect(() => {
        cargarPacientes();
    }, [cargarPacientes]);

    // ✅ useEffect SEPARADO Y ESTABLE para abrir el modal desde la URL.
    // Se ejecuta solo cuando la lista de pacientes ha terminado de cargar.
    useEffect(() => {
        // No hacer nada si los pacientes aún están cargando.
        if (loading || pacientes.length === 0) {
            return;
        }

        const pacienteIdParam = searchParams.get("pacienteId");
        if (pacienteIdParam && pacientes.length > 0) {
            const pacienteEncontrado = pacientes.find(p => p.id === pacienteIdParam);
            if (pacienteEncontrado) {
                // Abrimos el modal con los datos del paciente.
                setPacientePerfil(pacienteEncontrado);
            }
        }
    }, [loading, pacientes, searchParams]);

    // ✅ NUEVO: Función para recargar solo los documentos del paciente activo (cuando se elimina uno)
    const recargarDocumentosPaciente = async () => {
        if (!pacientePerfil) return;

        try {
            const { data, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('paciente_id', pacientePerfil.id)
                .order('fecha_subida', { ascending: false });

            if (error) {
                console.error('Error al recargar documentos:', error.message);
                return;
            }

            // ✅ Actualizar el perfil completo con los nuevos documentos
            /* setPacientePerfil((prev) => ({
                ...prev,
                documentos: data || []
            })); */

            // ✅ También actualizar la lista principal de pacientes
            setPacientes((prevPacientes) =>
                prevPacientes.map((p) => // TODO: Revisar si esto es necesario
                    p.id === pacientePerfil.id
                        ? { ...p, documentos: data || [] }
                        : p
                )
            );
        } catch (error) {
            console.error('Error en recargarDocumentosPaciente:', error.message);
        }
        await cargarPacientes();
    };

    // ✅ Filtrado de pacientes según búsqueda
    const pacientesFiltrados = pacientes
        .filter((p) => {
            const nombre = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase();
            const dni = p.dni || '';
            const query = busqueda.toLowerCase();
            return nombre.includes(query) || dni.includes(query);
        })
        .sort((a, b) => {
            // Ordena por fecha de registro (más recientes primero)
            return new Date(b.fecha_registro) - new Date(a.fecha_registro);
        });

    // ✅ Cálculo de paginación
    const totalPaginas = Math.ceil(pacientesFiltrados.length / pacientesPorPagina);
    const inicio = (paginaActual - 1) * pacientesPorPagina;
    const pacientesPaginados = pacientesFiltrados.slice(inicio, inicio + pacientesPorPagina);

    // Estadísticas de paginación
    const total = pacientes.length; // total sin filtrar
    const mostrando = pacientesPaginados.length; // pacientes visibles en la página actual

    // ✅ Función para eliminar paciente
    const handleEliminarPaciente = async (id) => {
        const ok = await eliminarPaciente(id);
        if (ok) {
            Swal.fire({
                title: "Paciente eliminado",
                text: "Se eliminó correctamente",
                icon: "success",
                background: '#111827',
                color: '#F9FAFB',
            });
            cargarPacientes(); // 👈 Usa la nueva función para recargar
        } else {
            Swal.fire({
                title: "Error",
                text: "No se pudo eliminar el paciente",
                icon: "error",
                background: '#111827',
                color: '#F9FAFB',
            });
        }
    };

    return (
        <div className='px-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors'>
            {/* Header */}
            <div className="flex justify-between items-center mb-8 p-8 bg-gradient-to-r from-smile_600  to-smile_700 rounded-xl shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Users />Lista de Pacientes
                    </h1>
                    <p className="text-smile_100">Consulte todo sus pacientes</p>
                </div>
                <div className='flex justify-center items-center gap-2'>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-800 transition-colors rounded-lg shadow-lg border-x border-white border-solid"
                    >
                        <FileUp />Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-800 transition-colors rounded-lg shadow-lg border-x border-white border-solid"
                    >
                        <FileUp />PDF
                    </button>
                    <button
                        onClick={() => {
                            setMostrarFormulario(true);
                            setModoEdicion(false);
                            setPacienteEditando(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-smile_600 hover:bg-gray-100 font-bold transition-colors rounded-lg shadow-lg border-x border-white border-solid"
                    >
                        <UserPlus /> Nuevo Paciente
                    </button>
                </div>
            </div>

            {/* // Componente de búsqueda */}
            <PacientesSearch
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                setPaginaActual={setPaginaActual} // 👈 nueva prop
            />

            {/* ✅ Pasa función de edición al componente de tabla */}
            <PacientesTable
                pacientes={pacientesPaginados}
                loading={loading}
                onEditarPaciente={(paciente) => {
                    setPacienteEditando(paciente);
                    setModoEdicion(true);
                    setMostrarFormulario(true);
                }}
                onEliminarPaciente={handleEliminarPaciente}
                onVerPerfilPaciente={(paciente) => setPacientePerfil(paciente)}
            />

            {/* // Muestra estadísticas de pacientes filtrados */}
            <div className='flex justify-between'>
                {/* // Información de pacientes mostrados */}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {busqueda.trim()
                        ? <>Mostrando <span className="font-medium text-gray-800 dark:text-gray-200">{mostrando}</span> de <span className="font-medium text-gray-800 dark:text-gray-200">{total}</span> pacientes filtrados</>
                        : <>Total: <span className="font-medium text-gray-800 dark:text-gray-200">{total}</span> pacientes registrados</>}
                </div>
                {/* // Información de última actualización */}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Última actualización: <time dateTime={new Date().toISOString()} className="font-medium text-gray-800 dark:text-gray-200">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</time>
                </div>
            </div>

            {/* // ✅ Controles de paginación */}
            {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaActual === 1}
                        className="px-2 py-1 bg-smile_600 text-white rounded hover:bg-smile_700 disabled:opacity-50"
                    >
                        <ChevronLeft />
                    </button>

                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Página {paginaActual} de {totalPaginas}
                    </span>

                    <button
                        onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaActual === totalPaginas}
                        className="px-2 py-1 bg-smile_600 rounded text-white hover:bg-smile_700 disabled:opacity-50"
                    >
                        <ChevronRight />
                    </button>
                </div>
            )}

            {/* ✅ Modal para crear o editar */}
            {mostrarFormulario && (
                <PacientesFormModal
                    onClose={() => {
                        setMostrarFormulario(false);
                        setPacienteEditando(null);
                        setModoEdicion(false);
                    }}
                    pacienteEditando={pacienteEditando}
                    modoEdicion={modoEdicion}
                    onPacienteCreado={(nuevo) => setPacientes([nuevo, ...pacientes])}
                    onPacienteActualizado={(actualizado) => {
                        const actualizados = pacientes.map((p) =>
                            p.id === actualizado.id ? actualizado : p
                        );
                        setPacientes(actualizados);
                    }}
                />
            )}

            {/* Modal para ver perfil de paciente */}
            {pacientePerfil && (
                <PacientePerfilModal
                    paciente={pacientePerfil}
                    onClose={() => setPacientePerfil(null)}
                    onPacienteActualizado={(actualizado) => {
                        const actualizados = pacientes.map((p) =>
                            p.id === actualizado.id ? actualizado : p
                        );
                        setPacientes(actualizados);
                        setPacientePerfil(actualizado);
                    }}
                />
            )}
        </div>
    );
}
