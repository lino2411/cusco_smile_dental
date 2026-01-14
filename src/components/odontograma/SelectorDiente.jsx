import React from 'react';

const SelectorDiente = ({ onSeleccionar, dienteSeleccionado }) => {
    const dientesSuperiores = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const dientesInferiores = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 text-center">
                Paso 1: Selecciona el diente
            </h3>

            {/* Dientes superiores */}
            <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Dientes Superiores</p>
                <div className="grid grid-cols-8 gap-2">
                    {dientesSuperiores.map(num => (
                        <button
                            key={num}
                            onClick={() => onSeleccionar(num)}
                            className={`h-12 rounded-lg font-bold text-sm transition-all ${dienteSeleccionado === num
                                    ? 'bg-smile_600 text-white shadow-lg ring-4 ring-smile_200 scale-110'
                                    : 'bg-gray-100 text-gray-700 hover:bg-smile_100 hover:text-smile_700'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dientes inferiores */}
            <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Dientes Inferiores</p>
                <div className="grid grid-cols-8 gap-2">
                    {dientesInferiores.map(num => (
                        <button
                            key={num}
                            onClick={() => onSeleccionar(num)}
                            className={`h-12 rounded-lg font-bold text-sm transition-all ${dienteSeleccionado === num
                                    ? 'bg-smile_600 text-white shadow-lg ring-4 ring-smile_200 scale-110'
                                    : 'bg-gray-100 text-gray-700 hover:bg-smile_100 hover:text-smile_700'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {dienteSeleccionado && (
                <div className="mt-4 p-3 bg-smile_100 rounded-lg border-2 border-smile_300 text-center">
                    <p className="text-sm font-bold text-smile_800">
                        ✅ Diente seleccionado: {dienteSeleccionado}
                    </p>
                </div>
            )}
        </div>
    );
};

export default SelectorDiente;
