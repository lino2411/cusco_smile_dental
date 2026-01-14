import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Agregado para verificación de sesión
import { FileText, Search, Calendar, User, Eye, Edit, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react'; // ✅ Agregados íconos para paginación
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import HistoriaClinicaDetalleModal from '../../components/historias/HistoriaClinicaDetalleModal';
import { generarPDFHistoriaClinica } from '../../utils/historiaClinica/historiaClinicaPDFGenerator';

export default function HistoriasClinicas() {
    const [historias, setHistorias] = useState([]);
    const [historiasFiltradas, setHistoriasFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [historiaDetalle, setHistoriaDetalle] = useState(null);
    // ✅ Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const historiasPorPagina = 4; // 👈 Similar a pacientesPorPagina = 6

    const navigate = useNavigate(); // ✅ Inicializado para verificación de sesión

    const cargarHistorias = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('historias_clinicas')
                .select(`
                    *,
                    paciente:paciente_id (
                        id,
                        nombres,
                        apellidos,
                        dni
                    ),
                    odontologo:odontologo_id (
                        nombre_completo
                    )
                `)
                .order('fecha', { ascending: false });
            if (error) throw error;
            setHistorias(data || []);
            setHistoriasFiltradas(data || []);
        } catch (error) {
            console.error('Error al cargar historias:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar las historias clínicas',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // ✅ Verificar sesión (como en Pacientes.jsx)
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
            }
        };
        checkUser();
        cargarHistorias();
    }, [navigate]);

    useEffect(() => {
        if (busqueda.trim() === '') {
            setHistoriasFiltradas(historias);
        } else {
            const filtradas = historias.filter((historia) => {
                const nombrePaciente = `${historia.paciente?.nombres || ''} ${historia.paciente?.apellidos || ''}`.toLowerCase();
                const dni = historia.paciente?.dni || '';
                const diagnostico = historia.diagnostico_definitivo?.toLowerCase() || '';
                const query = busqueda.toLowerCase();
                return nombrePaciente.includes(query) || dni.includes(query) || diagnostico.includes(query);
            });
            setHistoriasFiltradas(filtradas);
        }
        // ✅ Resetear página a 1 cuando cambie la búsqueda
        setPaginaActual(1);
    }, [busqueda, historias]);

    // ✅ Cálculo de paginación
    const totalPaginas = Math.ceil(historiasFiltradas.length / historiasPorPagina);
    const inicio = (paginaActual - 1) * historiasPorPagina;
    const historiasPaginadas = historiasFiltradas.slice(inicio, inicio + historiasPorPagina);

    // ✅ Estadísticas
    const totalHistorias = busqueda.trim() === '' ? historias.length : historiasFiltradas.length;
    const mostrando = historiasPaginadas.length;

    const handleVerDetalle = (historia) => {
        setHistoriaDetalle(historia);
    };

    const handleDescargarPDF = async (historia) => {
        try {
            await generarPDFHistoriaClinica(historia);
            Swal.fire({
                title: 'PDF generado',
                text: 'La historia clínica se descargó correctamente',
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo generar el PDF',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <div className="max-w-7xl mx-auto rounded-xl bg-smile_50">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-lg p-4 px-8 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-6 h-6 text-white" />
                                Lista de Historias Clínicas
                            </h1>
                            <p className="text-sm text-white mt-1 mb-4">
                                Gestión completa de historias clínicas del sistema
                            </p>
                            <div className="inline-block bg-smile_500 p-1 rounded-lg text-sm text-white">
                                Total: <span className="font-semibold text-white">{totalHistorias}</span> historias Clinicos
                            </div>
                        </div>
                    </div>
                    {/* Buscador (con reset de página) */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por paciente, DNI o diagnóstico..."
                            value={busqueda}
                            onChange={(e) => { // 👈 Agregado: reset de página
                                setBusqueda(e.target.value);
                                setPaginaActual(1);
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-smile_300 rounded-lg focus:border-smile_600 focus:ring-2 focus:ring-smile_100 focus:outline-none transition-all"
                        />
                    </div>
                </div>
                {/* Lista de Historias (con paginación) */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-smile_600"></div>
                    </div>
                ) : historiasPaginadas.length === 0 ? ( // 👈 Cambiado: verifica paginados
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {busqueda ? 'No se encontraron resultados' : 'No hay historias clínicas registradas'}
                        </h3>
                        <p className="text-gray-500">
                            {busqueda ? 'Intenta con otra búsqueda' : 'Las historias aparecerán aquí cuando se registren'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {historiasPaginadas.map((historia) => ( // 👈 Usa paginados
                            <div
                                key={historia.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5  border border-solid border-smile_300"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-smile_600" />
                                                <h3 className="font-semibold text-gray-900">
                                                    {historia.paciente?.nombres} {historia.paciente?.apellidos}
                                                </h3>
                                            </div>
                                            <span className="text-xs bg-smile_100 text-gray-900 px-2 py-1 rounded">
                                                DNI: {historia.paciente?.dni}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(historia.fecha).toLocaleDateString('es-PE', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                            {historia.odontologo && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    Dr. {historia.odontologo.nombre_completo}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-700">
                                                <strong>Motivo:</strong> {historia.motivo_consulta || 'No especificado'}
                                            </p>
                                            {historia.diagnostico_definitivo && (
                                                <p className="text-sm text-gray-700 mt-1">
                                                    <strong>Diagnóstico:</strong> {historia.diagnostico_definitivo}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleVerDetalle(historia)}
                                            className="px-3 py-2 bg-smile_500 text-white rounded-lg hover:bg-smile_700 transition-colors group relative"
                                            title="Ver detalle"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDescargarPDF(historia)}
                                            className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                            title="Descargar PDF"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ✅ Estadísticas (adaptadas) */}
                <div className='flex justify-between mb-4'>
                    <div className="mt-2 text-sm text-gray-600">
                        {busqueda.trim()
                            ? <>Mostrando <span className="font-medium text-gray-800">{mostrando}</span> de <span className="font-medium text-gray-800">{totalHistorias}</span> historias filtradas</>
                            : <>Total: <span className="font-medium text-gray-800">{totalHistorias}</span> historias registradas</>}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        Última actualización: <time dateTime={new Date().toISOString()} className="font-medium text-gray-800">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</time>
                    </div>
                </div>

                {/* ✅ Controles de paginación */}
                {totalPaginas > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6 mb-6">
                        <button
                            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                            className="px-2 py-1 bg-smile_600 text-white rounded hover:bg-smile_700 disabled:opacity-50"
                        >
                            <ChevronLeft />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
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

            </div>
            {/* Modal de Detalle */}
            {historiaDetalle && (
                <HistoriaClinicaDetalleModal
                    historia={historiaDetalle}
                    onClose={() => setHistoriaDetalle(null)}
                />
            )}
        </div>
    );
}