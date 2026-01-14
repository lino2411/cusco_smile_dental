import { useState, useEffect } from 'react';
import { obtenerOdontogramasPorPaciente, eliminarOdontograma } from '../../services/odontogramasService';
import OdontogramasLista from './OdontogramasLista';
import OdontogramaModal from './OdontogramaModal';
import Swal from 'sweetalert2';

export default function OdontogramasManager({ paciente }) {
    const [odontogramas, setOdontogramas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [odontogramaSeleccionado, setOdontogramaSeleccionado] = useState(null);
    const [tipoNuevoOdontograma, setTipoNuevoOdontograma] = useState('inicial');

    const cargarOdontogramas = async () => {
        setLoading(true);
        try {
            const data = await obtenerOdontogramasPorPaciente(paciente.id);
            setOdontogramas(data);
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo cargar los odontogramas',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarOdontogramas();
    }, [paciente]);

    const handleVerOdontograma = (odontograma) => {
        setOdontogramaSeleccionado(odontograma);
        setModoEdicion(false);
        setModalOpen(true);
    };

    const handleEditarOdontograma = (odontograma) => {
        setOdontogramaSeleccionado(odontograma);
        setModoEdicion(true);
        setModalOpen(true);
    };

    const handleNuevoOdontograma = (tipo) => {
        setTipoNuevoOdontograma(tipo);
        setOdontogramaSeleccionado(null);
        setModoEdicion(true);
        setModalOpen(true);
    };

    const handleCerrarModal = () => {
        setModalOpen(false);
        setOdontogramaSeleccionado(null);
        cargarOdontogramas();
    };

    const handleEliminarOdontograma = async (id) => {
        try {
            const resultado = await eliminarOdontograma(id);

            if (resultado) {
                Swal.fire({
                    title: 'Odontograma eliminado',
                    text: 'El odontograma fue eliminado correctamente',
                    icon: 'success',
                    background: '#111827',
                    color: '#F9FAFB',
                    timer: 2000,
                    showConfirmButton: false,
                });

                // Recargar la lista
                cargarOdontogramas();
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el odontograma',
                    icon: 'error',
                    background: '#111827',
                    color: '#F9FAFB',
                });
            }
        } catch (error) {
            console.error('Error al eliminar odontograma:', error);
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al eliminar el odontograma',
                icon: 'error',
                background: '#111827',
                color: '#F9FAFB',
            });
        }
    };

    return (
        <div className="space-y-4">
            <OdontogramasLista
                odontogramas={odontogramas}
                loading={loading}
                onVer={handleVerOdontograma}
                onEliminar={handleEliminarOdontograma}
                onNuevoOdontograma={handleNuevoOdontograma}
            />

            {modalOpen && (
                <OdontogramaModal
                    pacienteId={paciente.id}
                    paciente={paciente}
                    odontogramaExistente={odontogramaSeleccionado}
                    modoEdicion={modoEdicion}
                    tipoNuevoOdontograma={tipoNuevoOdontograma}
                    onClose={handleCerrarModal}
                    onGuardado={handleCerrarModal}
                />
            )}
        </div>
    );
}
