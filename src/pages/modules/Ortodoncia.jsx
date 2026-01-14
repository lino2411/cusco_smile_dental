import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, Download, Eye, ClipboardList, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../../services/supabaseClient";
import ControlOrtodonciaDetalleModal from "../../components/ortodoncia/ControlOrtodonciaDetalleModal";
import { generarPDFControlesOrtodoncia } from "../../utils/ortodoncia/controlesOrtodonciaPDFGenerator";
import { formatearFecha } from '../../utils/fechas';


export default function OrtodonciaGlobal() {
    const [controles, setControles] = useState([]);
    const [controlesFiltrados, setControlesFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [controlSeleccionado, setControlSeleccionado] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const gruposPorPagina = 4;

    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
            }
        };
        checkUser();
        cargarControles();
    }, [navigate]);

    const cargarControles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('controles_ortodoncia')
                .select(`
                    *,
                    paciente:paciente_id (
                        id,
                        nombres,
                        apellidos,
                        dni
                    )
                `)
                .order('fecha', { ascending: false });
            if (error) throw error;
            setControles(data || []);
            setControlesFiltrados(data || []);
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los controles de ortodoncia',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (busqueda.trim() === '') {
            setControlesFiltrados(controles);
        } else {
            const query = busqueda.toLowerCase();
            setControlesFiltrados(
                controles.filter((control) => {
                    const nombre = `${control.paciente?.nombres ?? ''} ${control.paciente?.apellidos ?? ''}`.toLowerCase();
                    return (
                        nombre.includes(query) ||
                        (control.paciente?.dni ?? '').includes(query) ||
                        (control.tratamiento_realizado?.toLowerCase() ?? '').includes(query)
                    );
                })
            );
        }
        setPaginaActual(1);
    }, [busqueda, controles]);

    const agruparPorPaciente = () => {
        const agrupado = {};
        controlesFiltrados.forEach(control => {
            const pacienteId = control.paciente?.id;
            if (!pacienteId) return;
            if (!agrupado[pacienteId]) {
                agrupado[pacienteId] = {
                    paciente: control.paciente,
                    controles: [],
                };
            }
            agrupado[pacienteId].controles.push(control);
        });
        return Object.values(agrupado);
    };

    const pacientesAgrupados = agruparPorPaciente();
    const totalPaginas = Math.ceil(pacientesAgrupados.length / gruposPorPagina);
    const inicio = (paginaActual - 1) * gruposPorPagina;
    const gruposPaginados = pacientesAgrupados.slice(inicio, inicio + gruposPorPagina);

    const totalControles = busqueda.trim() === '' ? controles.length : controlesFiltrados.length;
    const controlesMostrando = gruposPaginados.reduce((sum, grupo) => sum + grupo.controles.length, 0);

    const handleDescargarPDF = () => {
        try {
            generarPDFControlesOrtodoncia(controlesFiltrados);
            Swal.fire({
                title: 'PDF generado',
                text: 'El PDF se descargó correctamente',
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo generar el PDF',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        }
    };

    const handleVerControl = (control) => {
        setControlSeleccionado(control);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <div className="max-w-7xl mx-auto rounded-xl ">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between bg-gradient-to-r from-smile_600 to-smile_700 rounded-xl shadow-lg p-4 px-8 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <ClipboardList />
                                Lista de Control Ortodoncia
                            </h1>
                            <p className="text-sm text-white mt-1 mb-4">
                                Todos los controles de ortodoncia agrupados por paciente
                            </p>
                            <div className="inline-block bg-smile_700 p-1 rounded-lg text-sm text-white">
                                Total: <span className="font-semibold text-white">{totalControles}</span> controles ortodoncias
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={handleDescargarPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                <Download className="w-5 h-5" /> Exportar PDF
                            </button>
                        </div>
                    </div>
                    {/* Buscador */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI o tratamiento..."
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setPaginaActual(1);
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-smile_300 rounded-lg focus:border-smile_600 focus:ring-2 focus:ring-smile_100 focus:outline-none transition-all"
                        />
                    </div>
                </div>
                {/* Body agrupado por paciente */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-smile_600"></div>
                    </div>
                ) : gruposPaginados.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {busqueda ? 'No se encontraron resultados' : 'No hay controles de ortodoncia registrados'}
                        </h3>
                        <p className="text-gray-500">
                            {busqueda ? 'Intenta con otra búsqueda' : 'Los controles aparecerán aquí cuando se registren'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {gruposPaginados.map(grupo => (
                            <div key={grupo.paciente.id} className="bg-white rounded-xl shadow-md mb-3 p-0 border border-smile_600">
                                {/* Header paciente */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-smile_200 flex justify-between items-center rounded-2xl">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                            {grupo.paciente.nombres} {grupo.paciente.apellidos}
                                        </h3>
                                        <p className="inline-block bg-smile_100 px-2 py-1 rounded text-xs text-gray-700">DNI: {grupo.paciente.dni}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-smile_100 text-smile_700 text-sm font-medium rounded-full">
                                        {grupo.controles.length} {grupo.controles.length === 1 ? "control" : "controles"}
                                    </span>
                                </div>
                                {/* Tabla de controles */}
                                <div className="overflow-x-auto px-2 py-4">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-smile_100 text-left">
                                            <tr>
                                                <th className="px-4 py-2">Fecha</th>
                                                <th className="px-4 py-2">Tratamiento</th>
                                                <th className="px-4 py-2">Cuota</th>
                                                <th className="px-4 py-2 text-center">Firma</th>
                                                <th className="px-4 py-2">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grupo.controles.map((c, idx) => (
                                                <tr key={c.id}
                                                    className={`border-b rounded transition hover:bg-smile_50 ${idx % 2 === 0 ? 'bg-white' : 'bg-smile_25'}`}>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block text-smile_700 px-3 py-1 rounded text-xs font-medium">
                                                            {formatearFecha(c.fecha)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-semibold text-gray-800">Tratamiento:</span> {c.tratamiento_realizado}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-semibold text-gray-800">Cuota:</span> S/ {c.cuota ?? '-'}
                                                    </td>
                                                    {/* ✅ COLUMNA DE FIRMA CON ICONOS */}
                                                    <td className="px-4 py-3 text-center">
                                                        {c.firma_id ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleVerControl(c)}
                                                            className="px-4 py-1 bg-smile_600 hover:bg-smile_800 text-white rounded-lg transition-colors font-semibold group relative"
                                                        >
                                                            <Eye />
                                                            <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                                Ver Control Ortodoncia
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Estadísticas */}
                <div className='flex justify-between mb-4'>
                    <div className="mt-2 text-sm text-gray-600">
                        {busqueda.trim()
                            ? <>Mostrando <span className="font-medium text-gray-800">{controlesMostrando}</span> de <span className="font-medium text-gray-800">{totalControles}</span> controles filtrados</>
                            : <>Total: <span className="font-medium text-gray-800">{totalControles}</span> controles registrados</>}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        Última actualización: <time dateTime={new Date().toISOString()} className="font-medium text-gray-800">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</time>
                    </div>
                </div>

                {/* Controles de paginación */}
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

                {/* Modal de detalle */}
                {controlSeleccionado && (
                    <ControlOrtodonciaDetalleModal
                        control={controlSeleccionado}
                        onClose={() => setControlSeleccionado(null)}
                    />
                )}
            </div>
        </div>
    );
}
