import { Search } from "lucide-react";

export default function PacientesSearch({ busqueda, setBusqueda, setPaginaActual }) {
    return (
        <div className="relative mb-6 w-full">
            <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1); // 👈 reinicia la paginación al buscar
                }}
                placeholder="Buscar paciente por nombre o DNI..."
                className="w-full pl-10 pr-4 py-3 border border-smile_300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-smile_500 text-sm text-gray-900"
            />

            {/* Ícono de búsqueda */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
            </div>

            {/* Botón para limpiar búsqueda */}
            {busqueda && (
                <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
