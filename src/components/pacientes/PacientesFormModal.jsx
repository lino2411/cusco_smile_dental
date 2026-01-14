import { useState, useEffect } from 'react';
import { registrarPaciente } from '../../services/pacientesService';
import { actualizarPaciente } from "../../services/pacientesService";
import { supabase } from '../../services/supabaseClient';
import Swal from 'sweetalert2';
import { FaUserPlus, FaSave, FaEdit } from 'react-icons/fa';
import { File, Info, CloudUpload, Upload, FileText, Loader2 } from 'lucide-react';
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";


// ✅ Esquema de validación Yup
const schema = Yup.object().shape({
    dni: Yup.string()
        .required("El DNI es obligatorio.")
        .matches(/^\d{8}$/, "Solo se permiten números de 8 dígitos."),
    nombres: Yup.string()
        .required("El nombre es obligatorio.")
        .matches(/^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]+$/, "Solo se permiten letras y espacios."),
    apellidos: Yup.string()
        .matches(/^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]+$/, "Solo se permiten letras y espacios.")
        .nullable(),
    celular: Yup.string()
        .required("El celular es obligatorio.")
        .matches(/^\d{9}$/, "Debe tener 9 dígitos numéricos."),
    celular_emergencia: Yup.string()
        .nullable()
        .test(
            "formato-celular-emergencia",
            "Debe tener 9 dígitos numéricos.",
            (value) => !value || /^\d{9}$/.test(value)
        ),
});


export default function PacientesFormModal({
    onClose,
    onPacienteCreado,
    onPacienteActualizado,
    pacienteEditando,
    modoEdicion,
}) {
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [tipoDocumento, setTipoDocumento] = useState("");
    const [descripcionDocumento, setDescripcionDocumento] = useState("");
    const [documentos, setDocumentos] = useState([]);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false); // ✅ Estado para el loading

    // ✅ Función corregida para subir un documento
    const handleSubirDocumento = async () => {
        if (!archivoSeleccionado || !tipoDocumento) {
            Swal.fire({ title: "Faltan datos", text: "Selecciona archivo y tipo", icon: "warning" });
            return;
        }

        setSubiendoArchivo(true);

        try {
            const nombreSeguro = archivoSeleccionado.name
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9._-]/g, '');
            const nombreArchivo = `${pacienteEditando?.id || "nuevo"}_${Date.now()}_${nombreSeguro}`;

            const { data, error } = await supabase.storage
                .from("documentos_pacientes")
                .upload(nombreArchivo, archivoSeleccionado);

            if (error || !data) {
                Swal.fire({ title: "Error al subir", text: error?.message || "No se pudo subir el archivo.", icon: "error" });
                return;
            }

            // ✅ CORRECCIÓN: Guardar solo el path
            const nuevoDoc = {
                tipo: tipoDocumento,
                descripcion: descripcionDocumento,
                url: data.path, // ✅ Usar data.path
                nombre_archivo: archivoSeleccionado.name,
            };

            setDocumentos([...documentos, nuevoDoc]);
            setArchivoSeleccionado(null);
            setTipoDocumento("");
            setDescripcionDocumento("");
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({ title: "Error", text: "No se pudo subir el archivo", icon: "error" });
        } finally {
            setSubiendoArchivo(false);
        }
    };


    // ✅ Configuración de react-hook-form con Yup validación de datos 
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onChange",
    });


    // ✅ Cargar datos si se está editando
    useEffect(() => {
        if (pacienteEditando) {
            Object.entries(pacienteEditando).forEach(([key, value]) => {
                setValue(key, value ?? "");
            });
        }
    }, [pacienteEditando, setValue]);


    // ✅ Envío del formulario
    const onSubmit = async (formData) => {
        try {
            const camposLimpios = {
                ...Object.fromEntries(
                    Object.entries(formData).map(([key, value]) => [key, value === "" ? null : value])
                ),
                fecha_actualizacion: new Date().toISOString(),
            };

            if (modoEdicion && pacienteEditando) {
                const { data, error } = await supabase
                    .from("pacientes")
                    .update(camposLimpios)
                    .eq("id", pacienteEditando.id)
                    .select()
                    .single();

                if (error) throw error;

                Swal.fire({
                    title: "Paciente actualizado",
                    text: "Datos guardados correctamente",
                    icon: "success",
                    background: '#111827',
                    color: '#F9FAFB'
                });

                onPacienteActualizado(data);
                const pacienteIdFinal = data.id;

                // Guardar documentos si hay
                if (documentos.length > 0 && pacienteIdFinal) {
                    const docsConPaciente = documentos.map((doc) => ({
                        paciente_id: pacienteIdFinal,
                        tipo: doc.tipo,
                        descripcion: doc.descripcion,
                        url: doc.url,
                        nombre_archivo: doc.nombre_archivo,
                    }));

                    const { error: errorDocs } = await supabase
                        .from("documentos")
                        .insert(docsConPaciente);

                    if (errorDocs) {
                        console.error("Error al guardar documentos:", errorDocs.message);
                        Swal.fire({
                            title: "Documentos no guardados",
                            text: errorDocs.message,
                            icon: "error",
                            background: '#111827',
                            color: '#F9FAFB'
                        });
                    }
                }
                onClose();
            } else {
                // ✅ MODO CREACIÓN - CORREGIDO
                const nuevo = await registrarPaciente(camposLimpios);

                // ✅ Validar que nuevo no sea null/undefined
                if (!nuevo || !nuevo.id) {
                    Swal.fire({
                        title: "Error",
                        text: "No se pudo registrar el paciente",
                        icon: "error",
                        background: '#111827',
                        color: '#F9FAFB'
                    });
                    return;
                }

                const pacienteIdFinal = nuevo.id;

                // Guardar documentos si hay
                if (documentos.length > 0 && pacienteIdFinal) {
                    const docsConPaciente = documentos.map((doc) => ({
                        paciente_id: pacienteIdFinal,
                        tipo: doc.tipo,
                        descripcion: doc.descripcion,
                        url: doc.url,
                        nombre_archivo: doc.nombre_archivo,
                    }));

                    const { error: errorDocs } = await supabase
                        .from("documentos")
                        .insert(docsConPaciente);

                    if (errorDocs) {
                        console.error("Error al guardar documentos:", errorDocs.message);
                        Swal.fire({
                            title: "Documentos no guardados",
                            text: errorDocs.message,
                            icon: "error",
                            background: '#111827',
                            color: '#F9FAFB'
                        });
                    }
                }

                // ✅ Mostrar éxito y cerrar
                Swal.fire({
                    title: "Paciente registrado",
                    text: "Guardado correctamente",
                    icon: "success",
                    background: '#111827',
                    color: '#F9FAFB'
                });
                onPacienteCreado(nuevo);
                reset();
                onClose();
            }

        } catch (err) {
            // ✅ Manejo mejorado de errores
            console.error("Error al guardar paciente:", err);

            if (err.message && err.message.includes("El DNI ya se encuentra registrado")) {
                Swal.fire({
                    title: "DNI Duplicado",
                    text: err.message,
                    icon: "error",
                    background: '#111827',
                    color: '#F9FAFB'
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: err.message || "Hubo un problema al guardar los datos. Por favor, verifica los campos.",
                    icon: "error",
                    background: '#111827',
                    color: '#F9FAFB'
                });
            }
        }
    };

    // ✅ Render del formulario
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header Minimalista */}
                <div className="px-8 py-6 bg-smile_600 border-b border-gray-100">
                    <h2 className="flex gap-2 items-center text-xl font-bold text-white">
                        <FaUserPlus />
                        {modoEdicion ? "Actualizar Paciente" : "Nuevo Paciente"}
                    </h2>
                    <p className="text-sm text-gray-200 mt-1">
                        {modoEdicion ? "Modifica la información del paciente" : "Registra un nuevo paciente en el sistema"}
                    </p>
                </div>

                {/* Contenido con scroll */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

                    {/* Sección 1: Identificación */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Identificación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* DNI */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">DNI</label>
                                <input
                                    {...register("dni")}
                                    placeholder="12345678"
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${errors.dni
                                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                        } focus:outline-none`}
                                />
                                {errors.dni && <p className="text-xs text-red-600">{errors.dni.message}</p>}
                            </div>

                            {/* Nombres */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nombres</label>
                                <input
                                    {...register("nombres")}
                                    placeholder="Juan Carlos"
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${errors.nombres
                                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                        } focus:outline-none`}
                                />
                                {errors.nombres && <p className="text-xs text-red-600">{errors.nombres.message}</p>}
                            </div>

                            {/* Apellidos */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Apellidos</label>
                                <input
                                    {...register("apellidos")}
                                    placeholder="García López"
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${errors.apellidos
                                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                        } focus:outline-none`}
                                />
                                {errors.apellidos && <p className="text-xs text-red-600">{errors.apellidos.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Información Personal */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Información Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Fecha de Nacimiento */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    {...register("fecha_nacimiento")}
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Sexo */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Sexo</label>
                                <select
                                    {...register("sexo")}
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer"
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                            </div>


                            {/* Lugar de Nacimiento */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Lugar de Nacimiento</label>
                                <input
                                    {...register("lugar_nacimiento")}
                                    placeholder="Cusco, Perú"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Contacto */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contacto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Celular */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Celular</label>
                                <input
                                    {...register("celular")}
                                    placeholder="987654321"
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${errors.celular
                                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                        } focus:outline-none`}
                                />
                                {errors.celular && <p className="text-xs text-red-600">{errors.celular.message}</p>}
                            </div>

                            {/* Celular de Emergencia */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Celular de Emergencia</label>
                                <input
                                    {...register("celular_emergencia")}
                                    placeholder="987654321"
                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${errors.celular_emergencia
                                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                        } focus:outline-none`}
                                />
                                {errors.celular_emergencia && <p className="text-xs text-red-600">{errors.celular_emergencia.message}</p>}
                            </div>

                            {/* Dirección */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Dirección</label>
                                <input
                                    {...register("direccion")}
                                    placeholder="Av. Principal 123, Apt. 4B"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Ubicación y Ocupación */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Ubicación y Ocupación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Procedencia</label>
                                <input
                                    {...register("procedencia")}
                                    placeholder="Cusco"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Ocupación</label>
                                <input
                                    {...register("ocupacion")}
                                    placeholder="Profesión u oficio"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección 5: Notas */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Notas Adicionales</h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Viajes en el Último Año</label>
                                <textarea
                                    {...register("viajes_ultimo_anio")}
                                    placeholder="Describe los destinos visitados..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Observaciones</label>
                                <textarea
                                    {...register("observaciones")}
                                    placeholder="Notas o comentarios relevantes..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ✅ SECCIÓN DOCUMENTOS - DISEÑO ORIGINAL MANTENIDO */}
                    {modoEdicion && (
                        <div className="col-span-2 space-y-3 border-t border-gray-100 pt-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-800">Subir documentos del paciente</h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {documentos.length} {documentos.length === 1 ? 'archivo' : 'archivos'}
                                </span>
                            </div>

                            {/* Zona de subida compacta */}
                            <div className="relative group">
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-white hover:border-blue-400 transition-all duration-300 group-hover:shadow-md"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <CloudUpload className='text-blue-500' />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                            {archivoSeleccionado ? archivoSeleccionado.name : 'Selecciona o arrastra un archivo'}
                                        </p>
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG o DOCX hasta 10MB</p>
                                    </div>
                                    {archivoSeleccionado && (
                                        <div className="flex-shrink-0 px-3 py-1 bg-green-100 rounded-full">
                                            <span className="text-xs font-medium text-green-700">✓ Listo</span>
                                        </div>
                                    )}
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                                />
                            </div>

                            {/* Opciones en grid compacto */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <File className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select
                                        value={tipoDocumento}
                                        onChange={(e) => setTipoDocumento(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none transition-all"
                                    >
                                        <option value="">Tipo de documento *</option>
                                        <option value="DNI">📄 DNI</option>
                                        <option value="Radiografía">🩻 Radiografía</option>
                                        <option value="Consentimiento">✍️ Consentimiento</option>
                                        <option value="Otro">📋 Otro</option>
                                    </select>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={descripcionDocumento}
                                        onChange={(e) => setDescripcionDocumento(e.target.value)}
                                        placeholder="Descripción (opcional) ejem: 'Frontal del DNI'"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Botón moderno con loading */}
                            <div className="relative">
                                {subiendoArchivo && (
                                    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-lg">
                                        <div className="text-center">
                                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-2" />
                                            <p className="text-sm font-medium text-gray-700">Subiendo archivo...</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSubirDocumento}
                                    disabled={!archivoSeleccionado || !tipoDocumento || subiendoArchivo}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                                >
                                    <Upload className="w-4 h-4" />
                                    Subir documento
                                </button>
                            </div>

                            {/* Lista elegante y compacta */}
                            <div className="space-y-2 pt-2">
                                <p className="text-xs font-medium text-gray-600">Documentos subidos</p>

                                {documentos.length === 0 ? (
                                    <div className="flex items-center justify-center py-4 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                                        <div className="text-center">
                                            <FileText className='text-gray-400 mx-auto mb-2' />
                                            <p className="text-xs text-gray-400">Aún no hay documentos</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {documentos.map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="group flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre_archivo}</p>
                                                        <p className="text-xs text-gray-600">Tipo: {doc.tipo}</p>
                                                        {doc.descripcion && (
                                                            <p className="text-xs text-gray-500 truncate">{doc.descripcion}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    onClick={() => {
                                                        setDocumentos(documentos.filter((_, i) => i !== idx));
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-end gap-3">
                    {/* // ✅ Botón Cancelar */}
                    <button
                        type="button"
                        onClick={() => {
                            Swal.fire({
                                title: "¿Cancelar?",
                                text: modoEdicion ? "Se descartarán los cambios" : "Se descartará el registro",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Si, cancelar",
                                cancelButtonText: "No",
                                reverseButtons: true,
                                background: '#111827',
                                color: '#F9FAFB',
                            }).then((result) => {
                                if (result.isConfirmed) onClose();
                            });
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-300 border border-gray-300 rounded-lg hover:bg-gray-400 text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>

                    {/* // ✅ Botón Guardar/Actualizar */}
                    <button
                        type="submit"
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${modoEdicion
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-smile_600 hover:bg-smile_700'
                            }`}
                    >
                        {modoEdicion ? (
                            <>
                                <FaEdit /> Actualizar
                            </>
                        ) : (
                            <>
                                <FaSave /> Guardar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

}
