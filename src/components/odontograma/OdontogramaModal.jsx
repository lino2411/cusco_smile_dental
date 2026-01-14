import { supabase } from '../../services/supabaseClient';
import { useState, useEffect } from 'react';
import { X, Save, SquarePen, Download, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import OdontogramaCanvas from './OdontogramaCanvas';
import BuscadorTratamientos from './BuscadorTratamientos';
import SelectorDiente from './SelectorDiente';
import TablaPresupuesto from './TablaPresupuesto';
import TablaEndodoncia from './TablaEndodoncia';
import SeccionRadiografias from './SeccionRadiografias';
import {
    crearOdontograma,
    actualizarOdontograma,
    guardarPiezaDental,
    eliminarPiezaDental,
    guardarPresupuesto,
    actualizarPresupuesto,
    eliminarPresupuesto,
    guardarEndodoncia,
    actualizarEndodonciaService,
    eliminarEndodonciaService,
    subirArchivoRadiografia,
    obtenerRadiografiasPorOdontograma,
    eliminarRadiografiaService,
    obtenerOdontogramaPorId,
} from '../../services/odontogramasService';
import { generarPDFOdontograma } from '../../utils/odontograma/odontogramaPDFGenerator';

// IMPORTAR CATÁLOGO DE TRATAMIENTOS
const HALLAZGOS_CATALOGO = [
    { id: 1, codigo: 'CAR', nombre: 'Caries', categoria: 'patologia', icono: '🦷', colorAzul: false, colorRojo: true },
    { id: 2, codigo: 'FRAC', nombre: 'Fractura', categoria: 'traumatismo', icono: '💥', colorAzul: false, colorRojo: true },
    { id: 3, codigo: 'RR', nombre: 'Remanente Radicular', categoria: 'patologia', sigla: 'RR', icono: '🔻', colorAzul: false, colorRojo: true },
    { id: 4, codigo: 'EXT', nombre: 'Extracción Indicada', categoria: 'cirugia', icono: '❌', colorAzul: false, colorRojo: true },
    { id: 5, codigo: 'AM', nombre: 'Amalgama', categoria: 'restauracion', sigla: 'AM', icono: '⚫', colorAzul: true, colorRojo: false },
    { id: 6, codigo: 'R', nombre: 'Resina', categoria: 'restauracion', sigla: 'R', icono: '⚪', colorAzul: true, colorRojo: false },
    { id: 7, codigo: 'IV', nombre: 'Ionómero de Vidrio', categoria: 'restauracion', sigla: 'IV', icono: '🔵', colorAzul: true, colorRojo: false },
    { id: 8, codigo: 'IM', nombre: 'Incrustación Metálica', categoria: 'restauracion', sigla: 'IM', icono: '🔶', colorAzul: true, colorRojo: false },
    { id: 9, codigo: 'IE', nombre: 'Incrustación Estética', categoria: 'restauracion', sigla: 'IE', icono: '💎', colorAzul: true, colorRojo: false },
    { id: 10, codigo: 'RTEMP', nombre: 'Restauración Temporal', categoria: 'restauracion', icono: '🟡', colorAzul: false, colorRojo: true },
    { id: 11, codigo: 'CC', nombre: 'Corona Completa', categoria: 'protesis', sigla: 'CC', icono: '👑', colorAzul: true, colorRojo: false },
    { id: 12, codigo: 'CMC', nombre: 'Corona Metal Cerámica', categoria: 'protesis', sigla: 'CMC', icono: '💎', colorAzul: true, colorRojo: false },
    { id: 13, codigo: 'CJ', nombre: 'Corona Jacket', categoria: 'protesis', sigla: 'CJ', icono: '✨', colorAzul: true, colorRojo: false },
    { id: 14, codigo: 'CF', nombre: 'Corona Fenestrada', categoria: 'protesis', sigla: 'CF', icono: '🪟', colorAzul: true, colorRojo: false },
    { id: 15, codigo: 'CV', nombre: 'Corona Veneer', categoria: 'protesis', sigla: 'CV', icono: '😁', colorAzul: true, colorRojo: false },
    { id: 16, codigo: 'CP', nombre: 'Corona Parcial', categoria: 'protesis', sigla: 'CP', icono: '👑', colorAzul: true, colorRojo: false },
    { id: 17, codigo: 'CTEMP', nombre: 'Corona Temporal', categoria: 'protesis', icono: '🟠', colorAzul: false, colorRojo: true },
    { id: 18, codigo: 'TC', nombre: 'Tratamiento de Conductos', categoria: 'endodoncia', sigla: 'TC', icono: '🔴', colorAzul: true, colorRojo: false },
    { id: 19, codigo: 'PC', nombre: 'Pulpectomía', categoria: 'endodoncia', sigla: 'PC', icono: '🔴', colorAzul: true, colorRojo: false },
    { id: 20, codigo: 'PP', nombre: 'Pulpotomía', categoria: 'endodoncia', sigla: 'PP', icono: '🔴', colorAzul: true, colorRojo: false },
    { id: 21, codigo: 'PR', nombre: 'Prótesis Removible', categoria: 'protesis', sigla: 'PR', icono: '🦷', colorAzul: true, colorRojo: true },
    { id: 22, codigo: 'PT', nombre: 'Prótesis Total', categoria: 'protesis', sigla: 'PT', icono: '😁', colorAzul: true, colorRojo: true },
    { id: 23, codigo: 'IMP', nombre: 'Implante', categoria: 'protesis', sigla: 'IMP', icono: '🔩', colorAzul: true, colorRojo: false },
    { id: 24, codigo: 'AUS', nombre: 'Diente Ausente', categoria: 'anomalia', icono: '⬜', colorAzul: true, colorRojo: false },
];


export default function OdontogramaModal({
    onClose,
    pacienteId,
    paciente,
    pacienteNombre,
    odontogramaExistente = null,
    modoEdicion = false,
    onGuardado,
    tipoNuevoOdontograma = 'inicial',
    soloLectura = false,
}) {
    // ==================== ESTADOS ====================
    const [loading, setLoading] = useState(false);
    const [tipoDenticion, setTipoDenticion] = useState(odontogramaExistente?.tipo_denticion || 'adulto');
    const [estadosDientes, setEstadosDientes] = useState({});
    const [notasDientes, setNotasDientes] = useState({});
    const [hallazgos, setHallazgos] = useState([]);
    const [presupuestos, setPresupuestos] = useState([]);
    const [observaciones, setObservaciones] = useState(odontogramaExistente?.observaciones || '');
    const [especificaciones, setEspecificaciones] = useState('');
    const [odontogramaId, setOdontogramaId] = useState(odontogramaExistente?.id || null);
    const [modoEditando, setModoEditando] = useState(modoEdicion);
    const [tipo, setTipo] = useState(odontogramaExistente?.tipo || tipoNuevoOdontograma || 'inicial');
    const [endodoncias, setEndodoncias] = useState([]);
    const [mostrarBuscador, setMostrarBuscador] = useState(false);
    const [dienteSeleccionado, setDienteSeleccionado] = useState(null);
    const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState(null);
    const [modoMarcadoLibre, setModoMarcadoLibre] = useState(false);
    const [tratamientoParaMarcar, setTratamientoParaMarcar] = useState(null);
    const [pasoActual, setPasoActual] = useState(1);


    // ==================== EFECTOS ====================
    useEffect(() => {
        const cargarDatos = async () => {
            if (odontogramaExistente) {
                setLoading(true);
                try {
                    setOdontogramaId(odontogramaExistente.id);
                    setTipo(odontogramaExistente.tipo);
                    setTipoDenticion(odontogramaExistente.tipo_denticion);
                    setObservaciones(odontogramaExistente.observaciones || '');
                    setEspecificaciones(odontogramaExistente.especificaciones || '');


                    const { data: piezasData } = await supabase
                        .from('piezas_dentales')
                        .select('*')
                        .eq('odontograma_id', odontogramaExistente.id);


                    if (piezasData && piezasData.length > 0) {
                        const estadosTemp = {};
                        const notasTemp = {};
                        const hallazgosTemp = [];


                        piezasData.forEach(pieza => {
                            estadosTemp[pieza.numero_pieza] = pieza.estado;
                            if (pieza.nota) {
                                notasTemp[pieza.numero_pieza] = pieza.nota;
                            }

                            // ✅ BUSCAR EL TRATAMIENTO COMPLETO DEL CATÁLOGO
                            const tratamientoEncontrado = HALLAZGOS_CATALOGO.find(t =>
                                t.codigo.toLowerCase() === pieza.estado.toLowerCase()
                            );

                            // ✅ DETERMINAR COLOR según coordenadas si existen, o por defecto azul
                            let colorFinal = 'azul';

                            // Si tiene coordenadas, significa que fue marcado con el nuevo sistema
                            // No podemos saber el color original, así que usamos azul por defecto
                            // A menos que el tratamiento solo permita rojo
                            if (tratamientoEncontrado) {
                                if (tratamientoEncontrado.colorRojo && !tratamientoEncontrado.colorAzul) {
                                    colorFinal = 'rojo';
                                }
                            }

                            hallazgosTemp.push({
                                numero_pieza: pieza.numero_pieza,
                                superficie: pieza.superficie || 'corona',
                                estado: pieza.estado,
                                codigo: tratamientoEncontrado ? tratamientoEncontrado.codigo : pieza.estado.toUpperCase(),
                                nombre: tratamientoEncontrado ? tratamientoEncontrado.nombre : pieza.estado,
                                icono: tratamientoEncontrado ? tratamientoEncontrado.icono : '🦷',
                                nota: pieza.nota,
                                es_plan_tratamiento: colorFinal === 'rojo',
                                color: colorFinal,
                                coordenada_x: pieza.coordenada_x || null,
                                coordenada_y: pieza.coordenada_y || null
                            });
                        });


                        setEstadosDientes(estadosTemp);
                        setNotasDientes(notasTemp);
                        setHallazgos(hallazgosTemp);
                    }


                    if (odontogramaExistente.tipo === 'evolutivo') {
                        const { data: endodonciaData } = await supabase
                            .from('endodoncias')
                            .select('*')
                            .eq('odontograma_id', odontogramaExistente.id)
                            .order('fecha', { ascending: true });


                        setEndodoncias(endodonciaData || []);
                    }


                    const { data: presupuestosData } = await supabase
                        .from('presupuestos')
                        .select('*')
                        .eq('odontograma_id', odontogramaExistente.id)
                        .order('creado_en', { ascending: true });


                    setPresupuestos(presupuestosData || []);


                } catch (error) {
                    console.error('Error al cargar odontograma:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo cargar el odontograma',
                        icon: 'error',
                        background: '#111827',
                        color: '#F9FAFB',
                    });
                } finally {
                    setLoading(false);
                }
            }
        };


        cargarDatos();
    }, [odontogramaExistente]);

    // ==================== HANDLERS PRINCIPALES ====================
    const handleGuardar = async () => {
        setLoading(true);
        try {
            let currentOdontogramaId = odontogramaId;


            if (!currentOdontogramaId) {
                const nuevoOdontograma = await crearOdontograma(
                    pacienteId,
                    tipo,
                    tipoDenticion,
                    observaciones,
                    especificaciones
                );
                currentOdontogramaId = nuevoOdontograma.id;
                setOdontogramaId(currentOdontogramaId);
            } else {
                await actualizarOdontograma(currentOdontogramaId, observaciones, especificaciones);
            }


            for (const hallazgo of hallazgos) {
                const nota = notasDientes[hallazgo.numero_pieza] || '';
                await guardarPiezaDental(
                    currentOdontogramaId,
                    hallazgo.numero_pieza,
                    hallazgo.codigo.toLowerCase(),
                    nota,
                    hallazgo.superficie || 'corona',
                    hallazgo.coordenada_x,  // ✅ Coordenada X
                    hallazgo.coordenada_y,  // ✅ Coordenada Y
                    hallazgo.color,         // ✅ Color
                    hallazgo.es_plan_tratamiento  // ✅ Plan
                );
            }


            Swal.fire({
                title: '✅ Odontograma guardado',
                text: `El odontograma ${tipo === 'inicial' ? 'inicial' : 'evolutivo'} se guardó correctamente`,
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 2000,
                showConfirmButton: false,
            });


            if (onGuardado) onGuardado();
            onClose();
        } catch (error) {
            console.error('Error al guardar odontograma:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar el odontograma',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };


    const confirmarGuardar = () => {
        Swal.fire({
            title: '¿Guardar odontograma?',
            text: 'Se guardarán todos los cambios realizados',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#5DBEAB',
            cancelButtonColor: '#6B7280',
            background: '#111827',
            color: '#F9FAFB',
        }).then((result) => {
            if (result.isConfirmed) {
                handleGuardar();
            }
        });
    };


    const handleCerrar = () => {
        if (modoEditando && (hallazgos.length > 0 || presupuestos.length > 0)) {
            Swal.fire({
                title: '¿Cerrar sin guardar?',
                text: 'Hay cambios sin guardar. ¿Estás seguro?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cerrar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#EF4444',
                background: '#111827',
                color: '#F9FAFB',
            }).then((result) => {
                if (result.isConfirmed) {
                    onClose();
                }
            });
        } else {
            onClose();
        }
    };


    // ==================== HANDLERS NUEVO FLUJO ====================
    const handleAbrirBuscador = () => {
        setDienteSeleccionado(null);
        setTratamientoSeleccionado(null);
        setPasoActual(1);
        setMostrarBuscador(true);
    };

    const handleSeleccionarDiente = (numeroDiente) => {
        setDienteSeleccionado(numeroDiente);
    };

    const handleSeleccionarTratamiento = (tratamiento) => {
        setTratamientoSeleccionado(tratamiento);
    };

    const handleSiguientePaso = () => {
        if (pasoActual === 1 && !dienteSeleccionado) {
            Swal.fire({
                title: 'Selecciona un diente',
                text: 'Debes seleccionar un diente primero',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        if (pasoActual === 2 && !tratamientoSeleccionado) {
            Swal.fire({
                title: 'Selecciona un tratamiento',
                text: 'Debes seleccionar un tratamiento',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        setPasoActual(pasoActual + 1);
    };

    const handlePasoAnterior = () => {
        setPasoActual(pasoActual - 1);
    };

    const handleAplicarTratamiento = async (tipoColor) => {
        if (!dienteSeleccionado || !tratamientoSeleccionado) return;

        // Activar modo marcado libre
        setModoMarcadoLibre(true);
        setTratamientoParaMarcar({
            ...tratamientoSeleccionado,
            numero_diente: dienteSeleccionado,
            color: tipoColor,
            es_plan_tratamiento: tipoColor === 'rojo'
        });
        setMostrarBuscador(false);

        Swal.fire({
            title: '🎯 Modo marcado activado',
            html: `
                <div class="text-center">
                    <p class="text-xl font-bold mb-2">Diente ${dienteSeleccionado}</p>
                    <p class="text-lg font-semibold mb-2">${tratamientoSeleccionado.nombre}</p>
                    <p class="text-sm text-gray-600">Haz click en el odontograma donde quieras marcar</p>
                    <div class="mt-4 flex items-center justify-center gap-2">
                        <div class="w-6 h-6 rounded-full ${tipoColor === 'rojo' ? 'bg-red-500' : 'bg-blue-500'}"></div>
                        <span class="font-medium">${tipoColor === 'rojo' ? 'Plan de tratamiento' : 'Tratamiento existente'}</span>
                    </div>
                </div>
            `,
            icon: 'info',
            background: '#111827',
            color: '#F9FAFB',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#5DBEAB'
        });
    };

    const handleMarcarPunto = (x, y) => {
        if (!tratamientoParaMarcar) return;

        const nuevoHallazgo = {
            numero_pieza: tratamientoParaMarcar.numero_diente,
            superficie: 'corona',
            estado: tratamientoParaMarcar.codigo.toLowerCase(),
            codigo: tratamientoParaMarcar.codigo,
            nombre: tratamientoParaMarcar.nombre,
            icono: tratamientoParaMarcar.icono,
            es_plan_tratamiento: tratamientoParaMarcar.es_plan_tratamiento,
            color: tratamientoParaMarcar.color,
            coordenada_x: x,
            coordenada_y: y
        };

        setHallazgos([...hallazgos, nuevoHallazgo]);

        // Desactivar modo marcado
        setModoMarcadoLibre(false);
        setTratamientoParaMarcar(null);

        Swal.fire({
            title: '✅ Marca registrada',
            html: `
                <div class="text-center">
                    <p class="text-xl font-bold">Diente ${tratamientoParaMarcar.numero_diente}</p>
                    <p class="text-lg">${tratamientoParaMarcar.nombre}</p>
                </div>
            `,
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleEliminarHallazgo = (numeroDiente, superficie) => {
        Swal.fire({
            title: '¿Eliminar hallazgo?',
            text: `Diente ${numeroDiente} - ${superficie}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            background: '#111827',
            color: '#F9FAFB',
        }).then((result) => {
            if (result.isConfirmed) {
                setHallazgos(hallazgos.filter(h => !(h.numero_pieza === numeroDiente && h.superficie === superficie)));

                Swal.fire({
                    title: 'Hallazgo eliminado',
                    icon: 'success',
                    background: '#111827',
                    color: '#F9FAFB',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };


    // ==================== HANDLERS PRESUPUESTO ====================
    const handleAgregarPresupuesto = async (tratamiento, cantidad, costoUnitario) => {
        if (!odontogramaId) {
            const nuevoOdontograma = await crearOdontograma(
                pacienteId,
                tipo,
                tipoDenticion,
                observaciones,
                especificaciones
            );
            setOdontogramaId(nuevoOdontograma.id);

            const nuevo = await guardarPresupuesto(nuevoOdontograma.id, tratamiento, cantidad, costoUnitario);
            setPresupuestos([...presupuestos, nuevo]);
        } else {
            const nuevo = await guardarPresupuesto(odontogramaId, tratamiento, cantidad, costoUnitario);
            setPresupuestos([...presupuestos, nuevo]);
        }

        Swal.fire({
            title: 'Tratamiento agregado',
            text: 'El tratamiento se agregó al presupuesto',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 1500,
            showConfirmButton: false,
        });
    };


    const handleActualizarPresupuesto = async (id, tratamiento, cantidad, costoUnitario) => {
        const actualizado = await actualizarPresupuesto(id, tratamiento, cantidad, costoUnitario);
        setPresupuestos(presupuestos.map((p) => (p.id === id ? actualizado : p)));

        Swal.fire({
            title: 'Tratamiento actualizado',
            icon: 'success',
            background: '#111827',
            color: '#F9FAFB',
            timer: 1500,
            showConfirmButton: false,
        });
    };


    const handleEliminarPresupuesto = async (id) => {
        const ok = await eliminarPresupuesto(id);
        if (ok) {
            setPresupuestos(presupuestos.filter((p) => p.id !== id));
            Swal.fire({
                title: 'Tratamiento eliminado',
                icon: 'success',
                background: '#111827',
                color: '#F9FAFB',
                timer: 1500,
                showConfirmButton: false,
            });
        }
    };


    // ==================== HANDLERS ENDODONCIA ====================
    const agregarEndodoncia = async (nuevoRegistro) => {
        setLoading(true);
        try {
            let currentOdontogramaId = odontogramaId;

            if (!currentOdontogramaId) {
                const nuevoOdontograma = await crearOdontograma(
                    pacienteId,
                    tipo,
                    tipoDenticion,
                    observaciones,
                    especificaciones
                );
                currentOdontogramaId = nuevoOdontograma.id;
                setOdontogramaId(currentOdontogramaId);
            }

            const creado = await guardarEndodoncia(currentOdontogramaId, nuevoRegistro);
            setEndodoncias([...endodoncias, creado]);

            Swal.fire({
                title: '¡Endodoncia agregada!',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al agregar endodoncia:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo agregar el registro',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };


    const actualizarEndodoncia = async (id, datosActualizados) => {
        setLoading(true);
        try {
            const actualizado = await actualizarEndodonciaService(id, datosActualizados);
            setEndodoncias(endodoncias.map(e => (e.id === id ? actualizado : e)));
            Swal.fire({
                title: 'Endodoncia actualizada',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar el registro',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };


    const eliminarEndodoncia = async (id) => {
        setLoading(true);
        try {
            await eliminarEndodonciaService(id);
            setEndodoncias(endodoncias.filter(e => e.id !== id));
            Swal.fire({
                title: 'Endodoncia eliminada',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el registro',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };


    // ==================== RENDER ====================
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col my-8">


                {/* HEADER */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-smile_600 to-smile_700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                🦷 Odontograma {tipo === 'inicial' ? 'Inicial' : 'Evolutivo'}
                                {!modoEditando && odontogramaExistente && (
                                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Solo lectura</span>
                                )}
                            </h2>
                            <p className="text-smile_100 text-sm mt-1">
                                Paciente: {paciente?.nombres} {paciente?.apellidos} | DNI: {paciente?.dni}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {odontogramaExistente && !modoEditando && !soloLectura && (
                                <>
                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoading(true);

                                                // 1. Cargar odontograma con piezas dentales
                                                const { data: odontogramaCompleto, error: errorOdonto } = await supabase
                                                    .from('odontogramas')
                                                    .select(`
                *,
                piezas_dentales (*)
            `)
                                                    .eq('id', odontogramaExistente.id)
                                                    .single();

                                                if (errorOdonto) {
                                                    throw errorOdonto;
                                                }

                                                // 2. Cargar presupuestos
                                                const { data: presupuestosData, error: errorPresup } = await supabase
                                                    .from('presupuestos')
                                                    .select('*')
                                                    .eq('odontograma_id', odontogramaExistente.id)
                                                    .order('creado_en', { ascending: true });

                                                if (errorPresup) {
                                                    console.error('Error al cargar presupuestos:', errorPresup);
                                                }

                                                // 3. Agregar presupuestos al objeto
                                                odontogramaCompleto.presupuestos = presupuestosData || [];

                                                // 4. Generar PDF
                                                generarPDFOdontograma(odontogramaCompleto, paciente);

                                            } catch (error) {
                                                console.error('Error al preparar PDF:', error);
                                                Swal.fire({
                                                    title: 'Error',
                                                    text: 'No se pudo generar el PDF',
                                                    icon: 'error',
                                                    background: '#111827',
                                                    color: '#F9FAFB',
                                                });
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Descargar PDF
                                    </button>
                                    <button
                                        onClick={() => setModoEditando(true)}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                    >
                                        <SquarePen className="w-5 h-5" />
                                        Editar
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleCerrar}
                                className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>


                {/* CONTENIDO */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">


                    {/* ODONTOGRAMA CANVAS */}
                    <OdontogramaCanvas
                        hallazgos={hallazgos}
                        onMarcarPunto={handleMarcarPunto}
                        modoMarcado={modoMarcadoLibre}
                        tratamientoActivo={tratamientoParaMarcar}
                        onAbrirBuscador={handleAbrirBuscador}
                        modoEdicion={modoEditando}
                    />


                    {/* TABLA DE TRATAMIENTOS */}
                    {hallazgos.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-smile_600 to-smile_700 px-4 py-3">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    📋 Tratamientos Registrados ({hallazgos.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Pieza</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Superficie</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Tratamiento</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Tipo</th>
                                            {modoEditando && (
                                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Acciones</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {hallazgos.map((h, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-white text-xs ${h.color === 'rojo' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                        {h.numero_pieza}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-medium capitalize bg-gray-100 px-2 py-1 rounded">{h.superficie}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{h.icono || '🦷'}</span>
                                                        <span className="font-medium text-gray-900">{h.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${h.color === 'rojo' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${h.color === 'rojo' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                        {h.es_plan_tratamiento ? 'Plan' : 'Existente'}
                                                    </span>
                                                </td>
                                                {modoEditando && (
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleEliminarHallazgo(h.numero_pieza, h.superficie)}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {/* NOTAS POR DIENTE */}
                    {!modoEditando && odontogramaExistente?.piezas_dentales && (() => {
                        const piezasConNota = odontogramaExistente.piezas_dentales.filter(p => p.nota);
                        return piezasConNota.length > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-smile_600" />
                                    Notas por diente
                                </h3>
                                <div className="space-y-3">
                                    {piezasConNota.map(pieza => (
                                        <div key={pieza.numero_pieza} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-smile_600 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">
                                                            {pieza.numero_pieza}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                                        Diente {pieza.numero_pieza}
                                                    </p>
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {pieza.nota}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null;
                    })()}


                    {/* TABLA DE ENDODONCIA */}
                    {tipo === 'evolutivo' && (
                        <TablaEndodoncia
                            odontogramaId={odontogramaId}
                            endodoncias={endodoncias}
                            onAdd={agregarEndodoncia}
                            onUpdate={actualizarEndodoncia}
                            onDelete={eliminarEndodoncia}
                            disabled={!modoEditando || loading}
                        />
                    )}


                    {/* RADIOGRAFÍAS */}
                    {odontogramaId && (
                        <SeccionRadiografias
                            odontogramaId={odontogramaId}
                            disabled={!modoEditando || loading}
                        />
                    )}


                    {/* TABLA DE PRESUPUESTO */}
                    <TablaPresupuesto
                        presupuestos={presupuestos}
                        onAgregar={handleAgregarPresupuesto}
                        onActualizar={handleActualizarPresupuesto}
                        onEliminar={handleEliminarPresupuesto}
                        disabled={!modoEditando || loading}
                    />


                    {/* OBSERVACIONES */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Observaciones:
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows="4"
                            disabled={!modoEditando}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-smile_600 focus:ring-2 focus:ring-smile_100 outline-none transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Escribe observaciones sobre el estado dental del paciente..."
                        />
                    </div>


                    {/* ESPECIFICACIONES */}
                    {modoEditando && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Especificaciones:
                            </label>
                            <textarea
                                value={especificaciones}
                                onChange={(e) => setEspecificaciones(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-smile_600 focus:ring-2 focus:ring-smile_100 outline-none transition-all resize-none"
                                placeholder="Detalles adicionales del tratamiento o plan..."
                            />
                        </div>
                    )}


                    {!modoEditando && odontogramaExistente?.especificaciones && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Especificaciones:
                            </label>
                            <p className="text-sm text-gray-600">{odontogramaExistente.especificaciones}</p>
                        </div>
                    )}


                </div>


                {/* FOOTER */}
                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-end gap-3">
                    <button
                        onClick={handleCerrar}
                        disabled={loading}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        <X />Cerrar
                    </button>
                    {modoEditando && (
                        <button
                            onClick={confirmarGuardar}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-smile_600 to-smile_700 hover:from-smile_700 hover:to-smile_800 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
            </div>


            {/* MODAL BUSCADOR CON 3 PASOS */}
            {mostrarBuscador && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">


                        <div className="bg-gradient-to-r from-smile_600 to-smile_700 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                Agregar Tratamiento - Paso {pasoActual} de 3
                            </h3>
                            <button
                                onClick={() => {
                                    setMostrarBuscador(false);
                                    setDienteSeleccionado(null);
                                    setTratamientoSeleccionado(null);
                                    setPasoActual(1);
                                }}
                                className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>


                        <div className="flex-1 overflow-y-auto p-6">
                            {/* PASO 1: Selector de diente */}
                            {pasoActual === 1 && (
                                <SelectorDiente
                                    onSeleccionar={handleSeleccionarDiente}
                                    dienteSeleccionado={dienteSeleccionado}
                                />
                            )}

                            {/* PASO 2: Selector de tratamiento */}
                            {pasoActual === 2 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 text-center mb-4">
                                        Paso 2: Selecciona el tratamiento
                                    </h3>
                                    <BuscadorTratamientos
                                        onSeleccionar={handleSeleccionarTratamiento}
                                        tratamientoSeleccionado={tratamientoSeleccionado}
                                    />
                                </div>
                            )}

                            {/* PASO 3: Selector de color */}
                            {pasoActual === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-800 text-center">
                                        Paso 3: Selecciona el tipo
                                    </h3>

                                    <div className="bg-smile_50 border-2 border-smile_200 rounded-xl p-6">
                                        <p className="text-center mb-4">
                                            <span className="font-bold text-xl">Diente {dienteSeleccionado}</span>
                                            <span className="mx-2">-</span>
                                            <span className="text-lg">{tratamientoSeleccionado?.nombre}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleAplicarTratamiento('azul')}
                                            className="flex flex-col items-center gap-4 p-6 border-4 border-blue-300 rounded-xl hover:bg-blue-50 transition-all"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-blue-500 border-4 border-blue-700"></div>
                                            <div className="text-center">
                                                <p className="font-bold text-blue-700 text-lg">Azul</p>
                                                <p className="text-sm text-blue-600">Tratamiento Existente</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleAplicarTratamiento('rojo')}
                                            className="flex flex-col items-center gap-4 p-6 border-4 border-red-300 rounded-xl hover:bg-red-50 transition-all"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-red-500 border-4 border-red-700"></div>
                                            <div className="text-center">
                                                <p className="font-bold text-red-700 text-lg">Rojo</p>
                                                <p className="text-sm text-red-600">Plan de Tratamiento</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>


                        <div className="border-t border-gray-200 px-6 py-4 flex justify-between gap-3">
                            <button
                                onClick={handlePasoAnterior}
                                disabled={pasoActual === 1}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Anterior
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setMostrarBuscador(false);
                                        setDienteSeleccionado(null);
                                        setTratamientoSeleccionado(null);
                                        setPasoActual(1);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                                >
                                    Cancelar
                                </button>

                                {pasoActual < 3 && (
                                    <button
                                        onClick={handleSiguientePaso}
                                        className="px-6 py-2 bg-smile_600 text-white rounded-lg hover:bg-smile_700 transition font-medium"
                                    >
                                        Siguiente →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
