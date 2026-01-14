// src/context/PacienteContext.jsx
import { createContext, useState, useContext } from "react";
export const PacienteContext = createContext();

export function usePaciente() {
    return useContext(PacienteContext);
}

export function PacienteProvider({ children }) {
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    return (
        <PacienteContext.Provider value={{ pacienteSeleccionado, setPacienteSeleccionado }}>
            {children}
        </PacienteContext.Provider>
    );
}
