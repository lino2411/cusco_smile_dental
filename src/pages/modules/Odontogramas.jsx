import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Agregado para verificación de sesión
import { Search, Eye, FileDown, Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'; // ✅ Agregados íconos para paginación
import { FaTooth } from "react-icons/fa";
import { supabase } from '../../services/supabaseClient';
import { generarPDFOdontograma } from '../../utils/odontograma/odontogramaPDFGenerator';
import OdontogramaModal from '../../components/odontograma/OdontogramaModal';

export default function Odontogramas() {
    const [odontogramas, setOdontogramas] = useState([]);
    const [odontogramasFiltrados, setOdontogramasFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [odontogramaSeleccionado, setOdontogramaSeleccionado] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    // ✅ Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const gruposPorPagina = 4; // 👈 Similar a pacientesPorPagina = 6

    const navigate = useNavigate(); // ✅ Inicializado para verificación de sesión

    // Cargar todos los odontogramas
    useEffect(() => {
        // ✅ Verificar sesión (como en Pacientes.jsx)
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
            }
        };
        checkUser();
        cargarOdontogramas();
    }, [navigate]);

    // Filtrar odontogramas
    useEffect(() => {
        let resultados = odontogramas;
        // Filtro por búsqueda
        if (busqueda) {
            resultados = resultados.filter(
                (o) =>
                    o.pacientes?.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
                    o.pacientes?.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
                    o.pacientes?.dni?.includes(busqueda)
            );
        }
        // Filtro por tipo
        if (filtroTipo !== 'todos') {
            resultados = resultados.filter((o) => o.tipo === filtroTipo);
        }
        setOdontogramasFiltrados(resultados);
        // ✅ Resetear página a 1 cuando cambie la búsqueda o filtro
        setPaginaActual(1);
    }, [busqueda, filtroTipo, odontogramas]);

    const cargarOdontogramas = async () => {
        try {
            // ✅ Consulta corregida
            const { data, error } = await supabase
                .from('odontogramas')
                .select(`
                    *,
                    pacientes!inner (
                        id,
                        dni,
                        nombres,
                        apellidos
                    )
                `)
                .order('fecha', { ascending: false });
            if (error) {
                console.error('Error de Supabase:', error);
                throw error;
            }
            // Cargar relaciones adicionales para cada odontograma
            if (data && data.length > 0) {
                const odontogramasCompletos = await Promise.all(
                    data.map(async (odontograma) => {
                        // Cargar piezas dentales
                        const { data: piezas } = await supabase
                            .from('piezas_dentales')
                            .select('*')
                            .eq('odontograma_id', odontograma.id);
                        // Cargar presupuestos
                        const { data: presupuestos } = await supabase
                            .from('presupuestos')
                            .select('*')
                            .eq('odontograma_id', odontograma.id);
                        // Cargar endodoncias
                        const { data: endodoncias } = await supabase
                            .from('endodoncias')
                            .select('*')
                            .eq('odontograma_id', odontograma.id);
                        return {
                            ...odontograma,
                            piezas_dentales: piezas || [],
                            presupuestos: presupuestos || [],
                            endodoncias: endodoncias || [],
                        };
                    })
                );
                setOdontogramas(odontogramasCompletos);
            } else {
                setOdontogramas([]);
            }
        } catch (error) {
            console.error('Error al cargar odontogramas:', error);
            setOdontogramas([]);
        } finally {
            setLoading(false);
        }
    };

    const agruparPorPaciente = () => {
        const agrupado = {};
        odontogramasFiltrados.forEach((o) => {
            const pacienteId = o.paciente_id;
            if (!agrupado[pacienteId]) {
                agrupado[pacienteId] = {
                    paciente: o.pacientes,
                    odontogramas: [],
                };
            }
            agrupado[pacienteId].odontogramas.push(o);
        });
        return Object.values(agrupado);
    };

    // ✅ Cálculo de paginación (paginamos grupos de pacientes)
    const pacientesAgrupados = agruparPorPaciente();
    const totalPaginas = Math.ceil(pacientesAgrupados.length / gruposPorPagina);
    const inicio = (paginaActual - 1) * gruposPorPagina;
    const gruposPaginados = pacientesAgrupados.slice(inicio, inicio + gruposPorPagina);

    // ✅ Estadísticas para paginación
    const totalOdontogramas = odontogramasFiltrados.length;
    const odontogramasMostrando = gruposPaginados.reduce((sum, grupo) => sum + grupo.odontogramas.length, 0);

    const handleVerOdontograma = (odontograma) => {
        setOdontogramaSeleccionado(odontograma);
        setMostrarModal(true);
    };

    const handleDescargarPDF = (odontograma) => {
        generarPDFOdontograma(odontograma, odontograma.pacientes);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-smile_600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Cargando odontogramas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-lg p-8 mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <FaTooth />Lista de Odontogramas Registrados
                    </h1>
                    <p className="text-smile_100">
                        Consulta y exporta odontogramas de todos los pacientes
                    </p>
                </div>
                {/* Barra de búsqueda y filtros */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Búsqueda */}
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido o DNI..."
                                value={busqueda}
                                onChange={(e) => { // 👈 Agregado: reset de página
                                    setBusqueda(e.target.value);
                                    setPaginaActual(1);
                                }}
                                className="w-full pl-10 pr-4 py-3 border border-smile_300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        {/* Filtro por tipo */}
                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none transition-transform duration-300 group-focus-within:rotate-180 group-focus-within:text-smile_500" />
                            <select
                                value={filtroTipo}
                                onChange={(e) => { // 👈 Agregado: reset de página
                                    setFiltroTipo(e.target.value);
                                    setPaginaActual(1);
                                }}
                                className="w-full pl-10 pr-4 py-3 border border-smile_300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                            >
                                <option value="todos">Todos los Odontogramas</option>
                                <option value="inicial">Odontograma Iniciales</option>
                                <option value="evolutivo">Odontograma Evolutivos</option>
                            </select>
                        </div>
                    </div>
                </div>
                {/* Estadísticas (actualizadas con filtrados) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-smile_600">
                        <p className="text-gray-600 text-sm font-medium">Total Odontogramas</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{odontogramasFiltrados.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                        <p className="text-gray-600 text-sm font-medium">Iniciales</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {odontogramasFiltrados.filter((o) => o.tipo === 'inicial').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600">
                        <p className="text-gray-600 text-sm font-medium">Evolutivos</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {odontogramasFiltrados.filter((o) => o.tipo === 'evolutivo').length}
                        </p>
                    </div>
                </div>
                {/* Lista de odontogramas agrupados por paciente (con paginación) */}
                {gruposPaginados.length === 0 ? ( // 👈 Cambiado: verifica paginados
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron odontogramas</h3>
                        <p className="text-gray-600">
                            {busqueda || filtroTipo !== 'todos'
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Aún no hay odontogramas registrados'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {gruposPaginados.map((grupo) => ( // 👈 Usa gruposPaginados
                            <div key={grupo.paciente.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                                {/* Header del paciente */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {grupo.paciente.nombres} {grupo.paciente.apellidos}
                                            </h3>
                                            <p className="bg-smile_100 inline-block px-2 py-1 rounded text-xs text-gray-600">DNI: {grupo.paciente.dni}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-smile_100 text-smile_700 text-sm font-medium rounded-full">
                                            {grupo.odontogramas.length} {grupo.odontogramas.length === 1 ? 'odontograma' : 'odontogramas'}
                                        </span>
                                    </div>
                                </div>
                                {/* Lista de odontogramas */}
                                <div className="divide-y divide-gray-200">
                                    {grupo.odontogramas.map((odontograma) => (
                                        <div key={odontograma.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-12 h-12 text-gray-300 rounded-lg flex items-center justify-center ${odontograma.tipo === 'inicial'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-indigo-100 text-indigo-600'
                                                            }`}
                                                    >
                                                        <FaTooth />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium rounded ${odontograma.tipo === 'inicial'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-indigo-100 text-indigo-700'
                                                                    }`}
                                                            >
                                                                {odontograma.tipo.charAt(0).toUpperCase() + odontograma.tipo.slice(1)}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                {new Date(odontograma.fecha).toLocaleDateString('es-ES', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                        {odontograma.observaciones && (
                                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                                                {odontograma.observaciones}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Botones de acción */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleVerOdontograma(odontograma)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Ver
                                                    </button>
                                                    <button
                                                        onClick={() => handleDescargarPDF(odontograma)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        <FileDown className="w-4 h-4" />
                                                        PDF
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ✅ Estadísticas (adaptadas) */}
                <div className='flex justify-between mb-4'>
                    <div className="mt-2 text-sm text-gray-600">
                        {busqueda || filtroTipo !== 'todos'
                            ? <>Mostrando <span className="font-medium text-gray-800">{odontogramasMostrando}</span> de <span className="font-medium text-gray-800">{totalOdontogramas}</span> odontogramas filtrados</>
                            : <>Total: <span className="font-medium text-gray-800">{totalOdontogramas}</span> odontogramas registrados</>}
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
            {/* Modal de visualización (solo lectura) */}
            {mostrarModal && odontogramaSeleccionado && (
                <OdontogramaModal
                    onClose={() => {
                        setMostrarModal(false);
                        setOdontogramaSeleccionado(null);
                    }}
                    pacienteId={odontogramaSeleccionado.paciente_id}
                    paciente={odontogramaSeleccionado.pacientes}
                    pacienteNombre={`${odontogramaSeleccionado.pacientes.nombres} ${odontogramaSeleccionado.pacientes.apellidos}`}
                    odontogramaExistente={odontogramaSeleccionado}
                    modoEdicion={false}
                    soloLectura={true}
                    onGuardado={() => { }}
                />
            )}
        </div>
    );
}