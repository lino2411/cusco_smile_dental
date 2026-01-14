/**
 * Configuración de roles del sistema
 * Basado en: rol text check (rol in ('admin', 'odontologo', 'recepcionista'))
 */
export const ROLES = {
    ADMIN: 'admin',
    ODONTOLOGO: 'odontologo',
    RECEPCIONISTA: 'recepcionista'
};

/**
 * Labels en español para los roles
 */
export const ROLES_LABELS = {
    admin: 'Administrador',
    odontologo: 'Odontólogo',
    recepcionista: 'Recepcionista'
};

/**
 * Colores para badges de roles (Tailwind)
 */
export const ROLES_COLORS = {
    admin: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-300'
    },
    odontologo: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300'
    },
    recepcionista: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300'
    }
};

/**
 * Lista de roles para select/dropdown
 */
export const ROLES_OPTIONS = [
    { value: 'admin', label: 'Administrador' },
    { value: 'odontologo', label: 'Odontólogo' },
    { value: 'recepcionista', label: 'Recepcionista' }
];
