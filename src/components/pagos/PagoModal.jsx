import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, DollarSign, CreditCard, Calendar, FileText, Trash2, Receipt, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import {
    crearPago,
    actualizarPago,
    obtenerPagoPorId,
    registrarHistorialPago,
    eliminarHistorialPago,
    obtenerMetodosPago,
} from '../../services/pagosService';
import { TRATAMIENTOS } from '../../data/tratamientos';
import SelectorTratamiento from './SelectorTratamiento';
import { pacienteTienePagoInicialOrtodoncia } from '../../services/pagosService';
import { registrarMovimientoCaja } from '../../services/cajaService';
import { obtenerFechaPeruHoy } from '../../utils/fechas';
import SignaturePad from '../common/SignaturePad';
import SignatureCanvas from 'react-signature-canvas';


export default function PagoModal({ pago = null, onClose, onPagoGuardado = () => { }, usuario }) {
    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [pacientes, setPacientes] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [historialPagos, setHistorialPagos] = useState([]);

    // Estados para el selector con buscador
    const [busquedaPaciente, setBusquedaPaciente] = useState('');
    const [mostrarDropdown, setMostrarDropdown] = useState(false);

    // Datos del pago
    const [pacienteId, setPacienteId] = useState(pago?.paciente_id || '');
    const [fecha, setFecha] = useState(pago?.fecha || obtenerFechaPeruHoy());

    // ✅ AGREGAR ESTAS LÍNEAS QUE FALTAN:
    const [tratamiento, setTratamiento] = useState(pago?.tratamiento_realizado || '');
    const [costo, setCosto] = useState(pago?.costo || '');
    const [aCuenta, setACuenta] = useState(pago?.a_cuenta || '');
    const [metodoPago, setMetodoPago] = useState(pago?.metodo_pago || '');
    const [observaciones, setObservaciones] = useState(pago?.observaciones || '');

    // Estados para pagos parciales
    const [mostrarFormPago, setMostrarFormPago] = useState(false);
    const [montoParcial, setMontoParcial] = useState('');
    const [metodoPagoParcial, setMetodoPagoParcial] = useState('');
    const [observacionesParcial, setObservacionesParcial] = useState('');

    const [tieneOrtodoncia, setTieneOrtodoncia] = useState(false);
    const [firmaGuardada, setFirmaGuardada] = useState(null);
    const [firmaDibujada, setFirmaDibujada] = useState(null); // Base64 de la firma
    // const firmaRef = useRef(null);
    // const [mostrarFirma, setMostrarFirma] = useState(true);



    // useEffect #1 - Cargar datos al abrir modal
    useEffect(() => {
        cargarDatos();
    }, [pago]);

    // useEffect #2: Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = event.target.closest('.relative');
            if (!dropdown && mostrarDropdown) {
                setMostrarDropdown(false);
                setBusquedaPaciente('');
            }
        };

        if (mostrarDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [mostrarDropdown]);

    // useEffect 
    useEffect(() => {
        async function checkTieneOrto() {
            const result = await pacienteTienePagoInicialOrtodoncia(pacienteId);
            setTieneOrtodoncia(!!result);
        }
        checkTieneOrto();
    }, [pacienteId]);


    // Cargar datos al abrir el modal
    const cargarDatos = async () => {
        try {
            // Cargar pacientes
            const { data: pacientesData } = await supabase
                .from('pacientes')
                .select('id, dni, nombres, apellidos, celular')
                .order('nombres', { ascending: true });
            setPacientes(pacientesData || []);

            // Cargar métodos de pago
            const metodosData = await obtenerMetodosPago();
            setMetodosPago(metodosData);

            // Si hay un pago existente, cargar historial
            if (pago?.id) {
                const pagoCompleto = await obtenerPagoPorId(pago.id);
                setHistorialPagos(pagoCompleto.historial_pagos || []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    const calcularDebe = () => {
        const costoNum = parseFloat(costo) || 0;
        const aCuentaNum = parseFloat(aCuenta) || 0;
        return Math.max(0, costoNum - aCuentaNum);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!pacienteId || !tratamiento || !costo) {
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Por favor completa los campos obligatorios',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        setLoading(true);
        try {
            // ✅ OBTENER USUARIO
            const { data: { session } } = await supabase.auth.getSession();
            const { data: usuarioData } = await supabase
                .from('usuarios')
                .select('id')
                .eq('auth_user_id', session.user.id)
                .single();

            const datosPago = {
                paciente_id: pacienteId,
                fecha,
                tratamiento_realizado: tratamiento,
                costo: parseFloat(costo),
                a_cuenta: parseFloat(aCuenta) || 0,
                saldo: 0,
                metodo_pago: metodoPago,
                observaciones,
                usuario_registro: usuarioData?.id,
                firma_id: null, // Se actualizará después si hay firma
            };

            let pagoGuardado;

            if (pago?.id) {
                // ✅ MODO EDICIÓN
                await actualizarPago(pago.id, datosPago);
                pagoGuardado = { id: pago.id };

                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'El pago ha sido actualizado correctamente',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });
            } else {
                // ✅ MODO CREAR
                pagoGuardado = await crearPago(datosPago);

                if (firmaDibujada) {
                    try {
                        const pacienteInfo = pacientes.find(p => p.id === pacienteId);
                        const nombreCompleto = `${pacienteInfo.nombres} ${pacienteInfo.apellidos}`;

                        // Importar función de firma
                        const { guardarFirma } = await import('../../services/firmas/firmasService');

                        const firmaData = await guardarFirma(
                            firmaDibujada,
                            'pago',
                            pagoGuardado.id,
                            nombreCompleto,
                            pacienteInfo.dni
                        );

                        await actualizarPago(pagoGuardado.id, {
                            ...datosPago,
                            firma_id: firmaData.id
                        });

                    } catch (errorFirma) {
                        console.error('❌ Error guardando firma:', errorFirma);
                        Swal.fire({
                            title: 'Pago guardado, pero...',
                            text: 'No se pudo guardar la firma. Puedes editarlo y volver a firmar.',
                            icon: 'warning',
                            background: '#111827',
                            color: '#F9FAFB',
                        });
                    }
                }

                Swal.fire({
                    title: '¡Registrado!',
                    text: firmaDibujada ? 'Pago y firma registrados correctamente' : 'El pago ha sido registrado correctamente',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });
            }

            onPagoGuardado();
            onClose();
        } catch (error) {
            console.error('Error al guardar pago:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo guardar el pago',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    // ✅ COMPONENTE DE FIRMA SIMPLE - VERSIÓN CORREGIDA
    const FirmaPadSimple = () => {
        const sigCanvas = useRef(null);
        const [firmaTemporal, setFirmaTemporal] = useState(null);

        const limpiar = () => {
            if (sigCanvas.current) {
                sigCanvas.current.clear();
                setFirmaDibujada(null);
                setFirmaTemporal(null);
            }
        };

        const guardarFirma = () => {
            if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                const firmaBase64 = sigCanvas.current.toDataURL('image/png');
                setFirmaDibujada(firmaBase64);
                setFirmaTemporal(firmaBase64);

                Swal.fire({
                    title: '¡Firma guardada!',
                    text: 'La firma se guardará al registrar el pago',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });
            } else {
                Swal.fire({
                    title: 'Canvas vacío',
                    text: 'Por favor dibuja una firma primero',
                    icon: 'warning',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        };

        return (
            <div className="border-2 border-dashed border-smile_300 rounded-lg p-4 bg-smile_50/30">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-700 flex items-center gap-2">
                        ✍️ Firma del Paciente
                        {firmaTemporal && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                ✓ Guardada
                            </span>
                        )}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={guardarFirma}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            💾 Guardar
                        </button>
                        <button
                            type="button"
                            onClick={limpiar}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            🗑️ Borrar
                        </button>
                    </div>
                </div>
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <SignatureCanvas
                        ref={sigCanvas}
                        canvasProps={{
                            width: 800,
                            height: 200,
                            className: 'w-full cursor-crosshair',
                        }}
                        backgroundColor="white"
                        penColor="black"
                        minWidth={1}
                        maxWidth={3}
                        velocityFilterWeight={0.7}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    💡 Dibuja la firma y haz clic en "💾 Guardar" antes de guardar el pago.
                </p>
            </div>
        );
    };

    const handleAgregarPagoParcial = async () => {
        if (!montoParcial || !metodoPagoParcial) {
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Por favor completa el monto y método de pago',
                icon: 'warning',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        const montoNum = parseFloat(montoParcial);
        const debe = calcularDebe();

        if (montoNum > debe) {
            Swal.fire({
                title: 'Monto inválido',
                text: 'El monto no puede ser mayor a la deuda',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
            return;
        }

        try {
            const nuevoPago = await registrarHistorialPago({
                pago_id: pago.id,
                monto: montoNum,
                metodo_pago: metodoPagoParcial,
                observaciones: observacionesParcial,
            });

            setHistorialPagos([nuevoPago, ...historialPagos]);
            setACuenta((parseFloat(aCuenta) + montoNum).toString());

            // Limpiar formulario
            setMontoParcial('');
            setMetodoPagoParcial('');
            setObservacionesParcial('');
            setMostrarFormPago(false);

            Swal.fire({
                title: '¡Pago registrado!',
                text: 'El pago parcial ha sido registrado',
                icon: 'success',
                timer: 1500,
                background: '#111827',
                color: '#F9FAFB',
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al registrar pago:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo registrar el pago',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        }
    };

    const handleEliminarHistorial = async (historialId) => {
        const result = await Swal.fire({
            title: '¿Eliminar pago?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            background: '#111827',
            color: '#F9FAFB',
        });

        if (result.isConfirmed) {
            try {
                await eliminarHistorialPago(historialId, pago.id);
                setHistorialPagos(historialPagos.filter((h) => h.id !== historialId));

                // Recalcular total pagado
                const historialActualizado = historialPagos.filter((h) => h.id !== historialId);
                const nuevoTotal = historialActualizado.reduce(
                    (sum, h) => sum + parseFloat(h.monto),
                    0
                );
                setACuenta(nuevoTotal.toString());

                Swal.fire({
                    title: '¡Eliminado!',
                    icon: 'success',
                    timer: 1500,
                    background: '#111827',
                    color: '#F9FAFB',
                    showConfirmButton: false,
                });
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el pago',
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        }
    };

    // ✅ FUNCIONES PARA EL SELECTOR DE TRATAMIENTO
    const handleSeleccionTratamiento = (t) => {
        setTratamiento(t);

        // Notificar si es ortodoncia para activar pestaña (llamar callback)
        if (
            tratamientosOrto.some((n) => t.toLowerCase().includes(n.toLowerCase()))
        ) {
            onPagoGuardado?.(true); // Activa pestaña ortodoncia
        } else {
            onPagoGuardado?.(false); // Desactiva alerta pestaña
        }
    };

    // ✅ FUNCIONES PARA FORMATEAR MONTO
    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
        }).format(valor || 0);
    };

    const tratamientosOrto = [
        "Ortodoncia (Cuota inicial)",
        "Ortodoncia interceptiva (cuota inicial)",
        "Ortodoncia (Cuota mensual)",
        "Ortodoncia interceptiva (cuota mensual)",
    ];

    // ✅ CALCULA DIRECTAMENTE SIN LLAMAR A calcularDebe()
    const costoNum = parseFloat(costo) || 0;
    const aCuentaNum = parseFloat(aCuenta) || 0;
    const debe = Math.max(0, costoNum - aCuentaNum);
    const porcentajePagado = costoNum > 0 ? (aCuentaNum / costoNum) * 100 : 0;


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-smile_600 to-smile_700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <DollarSign className="w-7 h-7" />
                                {pago?.id ? 'Editar Pago' : 'Nuevo Pago'}
                            </h2>
                            <p className="text-smile_100 text-sm mt-1">
                                {pago?.id ? 'Modifica la información del pago' : 'Registra un nuevo pago de tratamiento'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-smile_800 rounded-lg transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información del pago */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-smile_600" />
                                Información del Pago
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Paciente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Paciente *
                                    </label>
                                    {/* ✅ MODO EDICIÓN: Paciente bloqueado */}
                                    {pago?.id ? (
                                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                                            {pacientes.find(p => p.id === pacienteId)?.nombres} {pacientes.find(p => p.id === pacienteId)?.apellidos} - DNI: {pacientes.find(p => p.id === pacienteId)?.dni}
                                        </div>
                                    ) : (
                                        /* ✅ MODO NUEVO: Dropdown con paciente preseleccionado si existe */
                                        <div className="relative">
                                            <div
                                                onClick={() => setMostrarDropdown(!mostrarDropdown)}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none cursor-pointer bg-white hover:border-gray-400 transition-colors flex items-center justify-between"
                                            >
                                                {pacienteId ? (
                                                    <span className="text-gray-900 font-medium">
                                                        {pacientes.find(p => p.id === pacienteId)?.nombres} {pacientes.find(p => p.id === pacienteId)?.apellidos} - DNI: {pacientes.find(p => p.id === pacienteId)?.dni}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">Seleccionar paciente</span>
                                                )}
                                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${mostrarDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {mostrarDropdown && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 flex flex-col">
                                                    <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                                                        <div className="flex gap-2 md:col-span-2 relative">
                                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar por nombre o DNI..."
                                                                value={busquedaPaciente}
                                                                onChange={(e) => setBusquedaPaciente(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="overflow-y-auto flex-1">
                                                        {pacientes
                                                            .filter(p => {
                                                                if (!busquedaPaciente) return true;
                                                                const busqueda = busquedaPaciente.toLowerCase();
                                                                return (
                                                                    p.nombres.toLowerCase().includes(busqueda) ||
                                                                    p.apellidos.toLowerCase().includes(busqueda) ||
                                                                    p.dni.includes(busqueda)
                                                                );
                                                            })
                                                            .map((p) => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPacienteId(p.id);
                                                                        setMostrarDropdown(false);
                                                                        setBusquedaPaciente('');
                                                                    }}
                                                                    className={`w-full text-left px-4 py-3 hover:bg-smile_50 transition-colors border-b border-gray-100 last:border-b-0 ${pacienteId === p.id ? 'bg-smile_100 font-medium' : ''}`}
                                                                >
                                                                    <div className="font-medium text-gray-900">
                                                                        {p.nombres} {p.apellidos}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">
                                                                        DNI: {p.dni} {p.celular && `• Tel: ${p.celular}`}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Fecha */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>

                                {/* Tratamiento realizados */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tratamiento Realizado *
                                    </label>
                                    <SelectorTratamiento
                                        value={tratamiento}
                                        onChange={handleSeleccionTratamiento}
                                        tratamientos={TRATAMIENTOS}
                                    />
                                </div>

                                {/* Costo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Costo Total *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            S/
                                        </span>
                                        <input
                                            type="number"
                                            value={costo}
                                            onChange={(e) => setCosto(e.target.value)}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* A cuenta */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Monto Pagado
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            S/
                                        </span>
                                        <input
                                            type="number"
                                            value={aCuenta}
                                            onChange={(e) => setACuenta(e.target.value)}
                                            step="0.01"
                                            min="0"
                                            max={costo}
                                            placeholder="0.00"
                                            disabled={pago && historialPagos.length > 0}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Método de pago */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <CreditCard className="w-4 h-4 inline mr-1" />
                                        Método de Pago
                                    </label>
                                    <select
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Seleccionar método</option>
                                        {metodosPago.map((metodo) => (
                                            <option key={metodo.id} value={metodo.nombre}>
                                                {metodo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Observaciones */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Observaciones
                                    </label>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        rows="3"
                                        placeholder="Notas adicionales..."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>

                                {/* Firma del Paciente */}
                                {/* Firma del Paciente */}
                                <div className="md:col-span-2">
                                    {pago?.id ? (
                                        // Modo EDICIÓN - Usar SignaturePad completo
                                        <>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Firma del Paciente
                                            </label>
                                            <SignaturePad
                                                tipoDocumento="pago"
                                                documentoId={pago.id}
                                                pacienteNombre={
                                                    pacientes.find(p => p.id === pacienteId)
                                                        ? `${pacientes.find(p => p.id === pacienteId).nombres} ${pacientes.find(p => p.id === pacienteId).apellidos}`
                                                        : ''
                                                }
                                                pacienteDni={pacientes.find(p => p.id === pacienteId)?.dni}
                                                onFirmaGuardada={(firma) => setFirmaGuardada(firma)}
                                                soloLectura={false}
                                            />
                                        </>
                                    ) : (
                                        // Modo NUEVO - Usar componente simple
                                        <FirmaPadSimple />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Resumen de pago */}
                        {costo && (
                            <div className="bg-gradient-to-br from-smile_50 to-smile_100 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Costo Total:</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatearMoneda(costo)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Pagado:</span>
                                        <span className="text-xl font-bold text-green-600">
                                            {formatearMoneda(aCuenta)}
                                        </span>
                                    </div>
                                    <div className="border-t border-smile_200 pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Debe:</span>
                                            <span className="text-2xl font-bold text-red-600">
                                                {formatearMoneda(debe)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                                            <span>Progreso de pago</span>
                                            <span className="font-medium">{porcentajePagado.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 transition-all duration-500"
                                                style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Historial de pagos parciales */}
                        {pago?.id && (
                            <div className="bg-gray-50 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-smile_600" />
                                        Historial de Pagos
                                    </h3>
                                    {debe > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setMostrarFormPago(!mostrarFormPago)}
                                            className="flex items-center gap-2 px-4 py-2 bg-smile_600 hover:bg-smile_700 text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Registrar Pago
                                        </button>
                                    )}
                                </div>

                                {/* Formulario para nuevo pago parcial */}
                                {mostrarFormPago && (
                                    <div className="bg-white rounded-lg p-4 mb-4 border-2 border-smile_200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Monto *
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                        S/
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={montoParcial}
                                                        onChange={(e) => setMontoParcial(e.target.value)}
                                                        step="0.01"
                                                        min="0"
                                                        max={debe}
                                                        placeholder="0.00"
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Método *
                                                </label>
                                                <select
                                                    value={metodoPagoParcial}
                                                    onChange={(e) => setMetodoPagoParcial(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 outline-none"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {metodosPago.map((metodo) => (
                                                        <option key={metodo.id} value={metodo.nombre}>
                                                            {metodo.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAgregarPagoParcial}
                                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMostrarFormPago(false);
                                                        setMontoParcial('');
                                                        setMetodoPagoParcial('');
                                                        setObservacionesParcial('');
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de pagos */}
                                {historialPagos.length > 0 ? (
                                    <div className="space-y-2">
                                        {historialPagos.map((historial) => (
                                            <div
                                                key={historial.id}
                                                className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <DollarSign className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {formatearMoneda(historial.monto)}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(historial.fecha).toLocaleDateString('es-ES')} •{' '}
                                                                {historial.metodo_pago}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEliminarHistorial(historial.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                        <p>No hay pagos registrados</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer - ✅ BOTONES CORREGIDOS */}
                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        type="button"
                        className="px-6 py-2.5 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-smile_600 to-smile_700 hover:from-smile_700 hover:to-smile_800 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Guardando...' : pago?.id ? 'Actualizar Pago' : 'Guardar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}