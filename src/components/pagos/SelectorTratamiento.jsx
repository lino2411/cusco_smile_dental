import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SelectorTratamiento({ value, onChange, tratamientos }) {
    const [busqueda, setBusqueda] = useState('');
    const [mostrarLista, setMostrarLista] = useState(false);
    const [tratamientosFiltrados, setTratamientosFiltrados] = useState(tratamientos);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (busqueda.trim() === '') {
            setTratamientosFiltrados(tratamientos);
        } else {
            setTratamientosFiltrados(
                tratamientos.filter(t => t.toLowerCase().includes(busqueda.toLowerCase()))
            );
        }
    }, [busqueda, tratamientos]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setMostrarLista(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSeleccionar = (tratamiento) => {
        onChange(tratamiento);
        setMostrarLista(false);
        setBusqueda('');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer hover:border-smile_600 transition-all flex items-center justify-between bg-white"
                onClick={() => setMostrarLista(!mostrarLista)}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || 'Selecciona un tratamiento'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarLista ? 'rotate-180' : ''}`} />
            </div>
            {mostrarLista && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar tratamiento..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-smile_500 focus:outline-none text-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                        {tratamientosFiltrados.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No se encontraron tratamientos</div>
                        ) : (
                            tratamientosFiltrados.map((t, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSeleccionar(t)}
                                    className="px-4 py-2.5 hover:bg-smile_50 cursor-pointer transition-colors border-b last:border-b-0 text-sm text-gray-900"
                                >
                                    {t}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
