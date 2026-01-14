import { useState, useEffect } from "react";
import { X, FileText, Eye, Download, Trash, User, Plus, DollarSign } from 'lucide-react';
import { generarPDFPaciente } from "../../utils/pacientes/pacientePDFGenerator";
import Swal from "sweetalert2";
import { supabase } from "../../services/supabaseClient";
import PacientesFormModal from "./PacientesFormModal";
import HistoriasClinicasTable from '../historias/HistoriasClinicasTable';
import HistoriaClinicaFormModal from '../historias/HistoriaClinicaFormModal';
import HistoriaClinicaDetalleModal from '../historias/HistoriaClinicaDetalleModal';
import {
    obtenerHistoriasClinicasPorPaciente,
    eliminarHistoriaClinica
} from '../../services/historiasClinicasService';
import OdontogramasLista from '../odontograma/OdontogramasLista';
import OdontogramaModal from '../odontograma/OdontogramaModal';
import { obtenerOdontogramasPorPaciente, eliminarOdontograma, obtenerOdontogramaPorId } from '../../services/odontogramasService';
import PagosPorPaciente from '../pagos/PagosPorPaciente';
import ControlesOrtodonciaPorPaciente from '../ortodoncia/ControlesOrtodonciaPorPaciente';
import { pacienteTienePagoInicialOrtodoncia } from '../../services/pagosService';
import OdontogramasManager from '../odontograma/OdontogramasManager';



// Modal para ver y editar el perfil del paciente
export default function PacientePerfilModal({ paciente, onClose, onPacienteActualizado }) {
    // Estados para edición de paciente
    const [modoEdicion, setModoEdicion] = useState(false);
    const [pacienteEditando, setPacienteEditando] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [cargandoDocumentos, setCargandoDocumentos] = useState(true);
    // Estados para historias clínicas
    const [activeTab, setActiveTab] = useState('datos'); // 'datos', 'historias', 'odontogramas', 'pagos'
    const [historias, setHistorias] = useState([]);
    const [loadingHistorias, setLoadingHistorias] = useState(false);
    const [mostrarFormHistoria, setMostrarFormHistoria] = useState(false);
    const [historiaEditando, setHistoriaEditando] = useState(null);
    const [historiaDetalle, setHistoriaDetalle] = useState(null);
    // Estados para Odontogramas
    const [odontogramas, setOdontogramas] = useState([]);
    const [loadingOdontogramas, setLoadingOdontogramas] = useState(false);
    const [mostrarFormOdontograma, setMostrarFormOdontograma] = useState(false);
    const [odontogramaSeleccionado, setOdontogramaSeleccionado] = useState(null);
    const [tipoNuevoOdontograma, setTipoNuevoOdontograma] = useState('inicial');

    // Estados para Pagos y Ortodoncia 
    const [tieneOrtodoncia, setTieneOrtodoncia] = useState(false);




    if (!paciente) return null;

    // ✅ FUNCIÓN DEFINIDA AQUÍ
    const cargarDocumentos = async () => {
        setCargandoDocumentos(true);
        try {
            const { data, error } = await supabase
                .from("documentos")
                .select("*")
                .eq("paciente_id", paciente.id)
                .order("fecha_subida", { ascending: false });

            if (error) {
                console.error("Error al cargar documentos:", error);
                setDocumentos([]);
            } else {
                setDocumentos(data || []);
            }
        } catch (error) {
            console.error("Error en cargarDocumentos:", error);
            setDocumentos([]);
        } finally {
            setCargandoDocumentos(false);
        }
    };

    // ✅ Cargar documentos al montar y cuando cambie el paciente
    useEffect(() => {
        cargarDocumentos();
    }, [paciente.id]);

    // Verificar si el paciente tiene pago inicial de ortodoncia
    useEffect(() => {
        async function verificarOrtodoncia() {
            const resultado = await pacienteTienePagoInicialOrtodoncia(paciente.id);
            setTieneOrtodoncia(resultado);
        }
        verificarOrtodoncia();
    }, [paciente.id, activeTab]); // Se recalcula cuando cambia la pestaña activa

    // Formatea fecha
    const formatDate = (d) => {
        if (!d) return "-";
        try {
            return new Date(d).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return d;
        }
    };

    // Cargar historias clínicas
    const cargarHistorias = async () => {
        setLoadingHistorias(true);
        try {
            const data = await obtenerHistoriasClinicasPorPaciente(paciente.id);
            setHistorias(data);
        } catch (error) {
            console.error('Error al cargar historias:', error);
        } finally {
            setLoadingHistorias(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'historias') {
            cargarHistorias();
        }
    }, [activeTab, paciente.id]);


    // Calcula edad
    const calculateAge = (birthDate) => {
        if (!birthDate) return "-";
        try {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        } catch {
            return "-";
        }
    };

    // ✅ Elimina documento con logs de debugging
    const handleEliminarDocumento = async (documentoId) => {
        const confirmar = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f9fafb'
        });

        if (!confirmar.isConfirmed) return;

        const doc = documentos.find((d) => d.id === documentoId);

        if (!doc) {
            Swal.fire({
                title: "Error",
                text: "No se encontró el documento.",
                icon: "error",
                background: '#1f2937',
                color: '#f9fafb'
            });
            return;
        }

        try {
            // Extraer path del archivo
            const pathArchivo = doc.url.includes('http')
                ? doc.url.substring(doc.url.lastIndexOf('documentos_pacientes/') + 'documentos_pacientes/'.length)
                : doc.url;

            // Eliminar del Storage
            const { error: storageError } = await supabase.storage
                .from("documentos_pacientes")
                .remove([pathArchivo]);

            if (storageError) {
                Swal.fire({
                    title: "Error al eliminar archivo",
                    text: storageError.message,
                    icon: "error",
                    background: '#1f2937',
                    color: '#f9fafb'
                });
                return;
            }

            // Eliminar de la base de datos
            const { data: deleteData, error: dbError } = await supabase
                .from("documentos")
                .delete()
                .eq("id", documentoId)
                .select();

            if (dbError) {
                Swal.fire({
                    title: "Error al eliminar registro",
                    text: dbError.message,
                    icon: "error",
                    background: '#1f2937',
                    color: '#f9fafb'
                });
                return;
            }

            if (!deleteData || deleteData.length === 0) {
                Swal.fire({
                    title: "Advertencia",
                    text: "No se pudo eliminar el documento.",
                    icon: "warning",
                    background: '#1f2937',
                    color: '#f9fafb'
                });
                return;
            }

            // Recargar documentos
            await cargarDocumentos();

            Swal.fire({
                title: "Documento eliminado",
                text: "El documento se eliminó correctamente",
                icon: "success",
                timer: 2000, // ✅ La alerta se cierra sola después de 2 segundos
                showConfirmButton: false, // ✅ Oculta el botón "OK"
                background: '#1f2937',
                color: '#f9fafb'
            });
        } catch (error) {
            console.error("Error al eliminar documento:", error);
            Swal.fire({
                title: "Error",
                text: "Ocurrió un error al eliminar el documento",
                icon: "error",
                background: '#1f2937',
                color: '#f9fafb'
            });
        }
    };

    // ✅ Función para generar URL firmada y abrirla
    const handleVerDocumento = async (path) => {
        const pathLimpio = path.includes('http')
            ? path.substring(path.lastIndexOf('documentos_pacientes/') + 'documentos_pacientes/'.length)
            : path;

        const { data, error } = await supabase.storage
            .from("documentos_pacientes")
            .createSignedUrl(pathLimpio, 60);

        if (error) {
            Swal.fire({
                title: "Error",
                text: "No se pudo generar el enlace para ver el documento.",
                icon: "error",
                background: '#1f2937',
                color: '#f9fafb'
            });
            return;
        }
        window.open(data.signedUrl, "_blank");
    };

    // ✅ Función para generar URL firmada y descargarla
    const handleDescargarDocumento = async (path, nombreArchivo) => {
        const pathLimpio = path.includes('http')
            ? path.substring(path.lastIndexOf('documentos_pacientes/') + 'documentos_pacientes/'.length)
            : path;

        const { data, error } = await supabase.storage
            .from("documentos_pacientes")
            .createSignedUrl(pathLimpio, 60, { download: true });

        if (error) {
            Swal.fire({
                title: "Error",
                text: "No se pudo generar el enlace de descarga.",
                icon: "error",
                background: '#1f2937',
                color: '#f9fafb'
            });
            return;
        }
        window.location.href = data.signedUrl;
    };

    // Handlers para historias clínicas
    const handleNuevaHistoria = () => {
        setHistoriaEditando(null);
        setMostrarFormHistoria(true);
    };

    const handleEditarHistoria = (historia) => {
        setHistoriaEditando(historia);
        setMostrarFormHistoria(true);
    };

    const handleVerHistoria = (historia) => {
        setHistoriaDetalle(historia);
    };

    const handleEliminarHistoria = async (id) => {
        const resultado = await eliminarHistoriaClinica(id);
        if (resultado) {
            Swal.fire({
                title: "Historia eliminada",
                text: "La historia clínica fue eliminada correctamente",
                icon: "success",
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false,
            });
            cargarHistorias();
        }
    };

    const handleHistoriaCreada = (nuevaHistoria) => {
        setHistorias([nuevaHistoria, ...historias]);
        setMostrarFormHistoria(false);
    };

    const handleHistoriaActualizada = (historiaActualizada) => {
        setHistorias(historias.map(h =>
            h.id === historiaActualizada.id ? historiaActualizada : h
        ));
        setMostrarFormHistoria(false);
    };

    // Cargar odontogramas del paciente
    const cargarOdontogramas = async () => {
        setLoadingOdontogramas(true);
        try {
            const data = await obtenerOdontogramasPorPaciente(paciente.id);
            setOdontogramas(data);
        } catch (error) {
            console.error('Error al cargar odontogramas:', error);
        } finally {
            setLoadingOdontogramas(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'odontogramas') {
            cargarOdontogramas();
        }
    }, [activeTab, paciente.id]);

    useEffect(() => { // Se ejecuta una sola vez cuando el modal se monta.
        // Intentar leer la instrucción guardada por Pacientes.jsx
        const tabGuardada = localStorage.getItem("perfil_tab_activa");

        if (tabGuardada) {
            setActiveTab(tabGuardada);
            localStorage.removeItem("perfil_tab_activa");
        } else {
            setActiveTab('datos'); // Por defecto
        }
    }, []); // El array vacío asegura que solo se ejecute una vez.

    // Handlers para odontogramas 
    const handleNuevoOdontograma = (tipo) => {
        setTipoNuevoOdontograma(tipo || 'inicial');
        setOdontogramaSeleccionado(null);
        setMostrarFormOdontograma(true);
    };

    const handleVerOdontograma = async (odontograma) => {
        const completo = await obtenerOdontogramaPorId(odontograma.id);
        setOdontogramaSeleccionado(completo);
        setMostrarFormOdontograma(true);
    };

    const handleEliminarOdontograma = async (id) => {
        const resultado = await eliminarOdontograma(id);
        if (resultado) {
            Swal.fire({
                title: "Odontograma eliminado",
                text: "El odontograma fue eliminado correctamente",
                icon: "success",
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false,
            });
            cargarOdontogramas();
        }
    };




    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Header con Tabs */}
                    <div className="bg-gradient-to-r from-smile_600 to-smile_700 p-6 border-b border-smile_700">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                                    <User className="w-6 h-6" />
                                    {paciente.nombres} {paciente.apellidos}
                                </h2>
                                <p className="text-smile_100 text-sm mt-1">DNI: {paciente.dni}</p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="p-2 rounded-full hover:bg-smile_800 transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={() => setActiveTab('datos')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'datos'
                                    ? 'bg-white text-smile_700'
                                    : 'bg-smile_700 text-white hover:bg-smile_800'
                                    }`}
                            >
                                <User className="w-4 h-4 inline mr-2" />
                                Datos Personales
                            </button>
                            <button
                                onClick={() => setActiveTab('historias')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'historias'
                                    ? 'bg-white text-smile_700'
                                    : 'bg-smile_700 text-white hover:bg-smile_800'
                                    }`}
                            >
                                <FileText className="w-4 h-4 inline mr-2" />
                                Historia Clínica
                            </button>
                            <button
                                onClick={() => setActiveTab('odontogramas')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'odontogramas'
                                    ? 'bg-white text-smile_700'
                                    : 'bg-smile_700 text-white hover:bg-smile_800'
                                    }`}
                            >
                                🦷 Odontogramas
                            </button>

                            {/* ✅ NUEVA PESTAÑA DE PAGOS */}
                            <button
                                onClick={() => setActiveTab('pagos')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'pagos'
                                    ? 'bg-white text-smile_700'
                                    : 'bg-smile_700 text-white hover:bg-smile_800'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4 inline mr-2" />
                                Pagos
                            </button>

                            {/* //  NUEVA PESTAÑA DE ORTODONCIA */}
                            <button
                                onClick={() => tieneOrtodoncia && setActiveTab('ortodoncia')}
                                disabled={!tieneOrtodoncia}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${!tieneOrtodoncia
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : activeTab === 'ortodoncia'
                                        ? 'bg-white text-smile_700'
                                        : 'bg-smile_700 text-white hover:bg-smile_800'
                                    }`}
                                title={!tieneOrtodoncia ? 'El paciente no tiene tratamiento de ortodoncia registrado' : ''}
                            >
                                🦷 Ortodoncia
                            </button>

                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 overflow-y-auto flex-1">
                        {activeTab === 'datos' ? (
                            // Contenido de Datos Personales (tu código actual)
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Datos Personales */}
                                <div className="space-y-4">
                                    <h4 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">Datos Personales</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">DNI</label>
                                            <p className="text-sm text-gray-900">{paciente.dni || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Nombres</label>
                                            <p className="text-sm text-gray-900">{paciente.nombres || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Apellidos</label>
                                            <p className="text-sm text-gray-900">{paciente.apellidos || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Fecha de Nacimiento</label>
                                            <p className="text-sm text-gray-900">{formatDate(paciente.fecha_nacimiento)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Edad</label>
                                            <p className="text-sm text-gray-900">{calculateAge(paciente.fecha_nacimiento)} años</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Lugar de Nacimiento</label>
                                            <p className="text-sm text-gray-900">{paciente.lugar_nacimiento || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Sexo</label>
                                            <p className="text-sm text-gray-900">
                                                {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Femenino" : paciente.sexo || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contacto y Procedencia */}
                                <div className="space-y-4">
                                    <h4 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">Contacto y Procedencia</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Celular</label>
                                            <p className="text-sm text-gray-900">{paciente.celular || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Celular Emergencia</label>
                                            <p className="text-sm text-gray-900">{paciente.celular_emergencia || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Dirección</label>
                                            <p className="text-sm text-gray-900">{paciente.direccion || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Procedencia</label>
                                            <p className="text-sm text-gray-900">{paciente.procedencia || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Ocupación</label>
                                            <p className="text-sm text-gray-900">{paciente.ocupacion || "-"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Viajes */}
                                <div className="lg:col-span-2 space-y-4">
                                    <h4 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">Viajes en el Último Año</h4>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto border border-gray-200">
                                        {paciente.viajes_ultimo_anio || "-"}
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <div className="lg:col-span-2 space-y-4">
                                    <h4 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">Observaciones</h4>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto border border-gray-200">
                                        {paciente.observaciones || "-"}
                                    </div>
                                </div>

                                {/* Documentos */}
                                <div className="lg:col-span-2 space-y-4">
                                    <h4 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
                                        Documentos
                                    </h4>

                                    {cargandoDocumentos ? (
                                        <p className="text-sm text-gray-500">Cargando documentos...</p>
                                    ) : documentos.length === 0 ? (
                                        <p className="text-sm text-gray-500">No hay documentos subidos</p>
                                    ) : (
                                        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                                            <thead className="bg-smile_100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Tipo</th>
                                                    <th className="px-3 py-2 text-left">Documento</th>
                                                    <th className="px-3 py-2 text-left">Descripción</th>
                                                    <th className="px-3 py-2 text-left">Fecha</th>
                                                    <th className="px-3 py-2 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {documentos.map((doc) => (
                                                    <tr key={doc.id} className="border-t">
                                                        <td className="px-3 py-2">{doc.tipo}</td>
                                                        <td className="px-3 py-2 truncate max-w-[180px]">
                                                            <span title={doc.nombre_archivo || doc.url.split("/").pop()}>
                                                                {doc.nombre_archivo
                                                                    ? doc.nombre_archivo
                                                                    : (() => {
                                                                        const nombre = doc.url.split("/").pop();
                                                                        const partes = nombre.split("_");
                                                                        return partes.length > 2
                                                                            ? partes.slice(2).join("_")
                                                                            : nombre;
                                                                    })()}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">{doc.descripcion || "-"}</td>
                                                        <td className="px-3 py-2">
                                                            {new Date(doc.fecha_subida).toLocaleDateString("es-PE")}
                                                        </td>
                                                        <td className="px-3 py-2 text-center space-x-2">
                                                            <button
                                                                onClick={() => handleVerDocumento(doc.url)}
                                                                className="px-3 py-1 text-white bg-sky-500 rounded hover:bg-sky-700 transition-colors group relative"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                                <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                                    Ver documento
                                                                </span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleDescargarDocumento(doc.url, doc.nombre_archivo || "documento")}
                                                                className="px-3 py-1 text-white bg-indigo-500 rounded hover:bg-indigo-800 transition-colors group relative"
                                                            >
                                                                <Download className="w-5 h-5" />
                                                                <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                                    Descargar documento
                                                                </span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleEliminarDocumento(doc.id)}
                                                                className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-800 transition-colors group relative"
                                                            >
                                                                <Trash className="w-5 h-5" />
                                                                <span className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md py-1 px-2 -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-lg">
                                                                    Eliminar documento
                                                                </span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Fechas */}
                                <div className="lg:col-span-2 flex justify-between text-xs text-gray-500 mt-4">
                                    <span><strong>Registrado:</strong> {formatDate(paciente.fecha_registro)}</span>
                                    <span><strong>Última actualización:</strong> {formatDate(paciente.fecha_actualizacion)}</span>
                                </div>
                            </div>
                        ) : activeTab === 'historias' ? (
                            // Contenido de Historia Clínica
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Historial de Consultas
                                    </h3>
                                    <button
                                        onClick={handleNuevaHistoria}
                                        className="flex items-center gap-2 px-4 py-2 bg-smile_500 hover:bg-smile_800 text-white rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nueva Historia
                                    </button>
                                </div>

                                <HistoriasClinicasTable
                                    historias={historias}
                                    loading={loadingHistorias}
                                    onEditar={handleEditarHistoria}
                                    onEliminar={handleEliminarHistoria}
                                    onVer={handleVerHistoria}
                                />
                            </div>
                        ) : activeTab === 'odontogramas' ? (
                            // ✅ Contenido de Odontogramas
                            <OdontogramasManager paciente={paciente} />
                        ) : activeTab === 'pagos' ? (
                            // ✅ NUEVO: Contenido de Pagos
                            <div className="space-y-4">
                                <PagosPorPaciente
                                    pacienteId={paciente.id}
                                    pacienteNombre={`${paciente.nombres} ${paciente.apellidos}`}
                                    onPagoCreado={async (esOrtodoncia) => {
                                        setTieneOrtodoncia(!!esOrtodoncia);
                                        if (esOrtodoncia) setActiveTab("ortodoncia");
                                    }}
                                />
                            </div>
                        ) : activeTab === 'ortodoncia' ? (
                            <ControlesOrtodonciaPorPaciente
                                pacienteId={paciente.id}
                                pacienteNombre={`${paciente.nombres} ${paciente.apellidos}`}
                                pacienteDni={paciente.dni}
                            />
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-4">
                        {activeTab === 'datos' && (
                            <>
                                <button
                                    onClick={() => {
                                        setPacienteEditando(paciente);
                                        setModoEdicion(true);
                                    }}
                                    className="px-5 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                                >
                                    Editar
                                </button>

                                <button
                                    onClick={() => generarPDFPaciente(paciente)}
                                    className="px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    Descargar PDF
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Formulario de edición de paciente */}
            {modoEdicion && (
                <PacientesFormModal
                    onClose={() => setModoEdicion(false)}
                    onPacienteCreado={() => { }}
                    onPacienteActualizado={(actualizado) => {
                        setModoEdicion(false);
                        onPacienteActualizado(actualizado);
                        cargarDocumentos();
                    }}
                    pacienteEditando={pacienteEditando}
                    modoEdicion={true}
                />
            )}

            {/* Modales de Historia Clínica */}
            {mostrarFormHistoria && (
                <HistoriaClinicaFormModal
                    onClose={() => setMostrarFormHistoria(false)}
                    onHistoriaCreada={handleHistoriaCreada}
                    onHistoriaActualizada={handleHistoriaActualizada}
                    historiaEditando={historiaEditando}
                    modoEdicion={!!historiaEditando}
                    pacienteId={paciente.id}
                    pacienteNombre={`${paciente.nombres} ${paciente.apellidos}`}
                />
            )}

            {historiaDetalle && (
                <HistoriaClinicaDetalleModal
                    historia={historiaDetalle}
                    onClose={() => setHistoriaDetalle(null)}
                />
            )}
            {/* Modal de Odontograma */}
            {mostrarFormOdontograma && (
                <OdontogramaModal
                    onClose={() => {
                        setMostrarFormOdontograma(false);
                        setTipoNuevoOdontograma('inicial'); // ← AGREGAR
                    }}
                    pacienteId={paciente.id}
                    paciente={paciente}
                    pacienteNombre={`${paciente.nombres} ${paciente.apellidos}`}
                    odontogramaExistente={odontogramaSeleccionado}
                    modoEdicion={!odontogramaSeleccionado}
                    tipoNuevoOdontograma={tipoNuevoOdontograma} // ← AGREGAR ESTA LÍNEA
                    onGuardado={() => {
                        cargarOdontogramas();
                        setMostrarFormOdontograma(false);
                        setTipoNuevoOdontograma('inicial'); // ← AGREGAR
                    }}
                />
            )}
        </>
    );
}
