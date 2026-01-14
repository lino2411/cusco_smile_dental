// src/components/usuarios/UsuariosCard.jsx
import { Users, Shield, Stethoscope, UserCheck } from "lucide-react";

export default function UsuariosCard({ estadisticas }) {
    const total = estadisticas?.total || 0;
    const admins = estadisticas?.admins || 0;
    const odontologos = estadisticas?.odontologos || 0;
    const recepcionistas = estadisticas?.recepcionistas || 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Usuarios */}
            <div className="bg-blue-100 rounded-2xl shadow-md p-5 border border-blue-600 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-200 p-2.5 rounded-xl">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Total Usuarios</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">{total}</p>
            </div>

            {/* Administradores */}
            <div className="bg-purple-100 rounded-2xl shadow-md p-5 border border-purple-600 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-200 p-2.5 rounded-xl">
                        <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Administradores</p>
                </div>
                <p className="text-3xl font-bold text-purple-700">{admins}</p>
            </div>

            {/* Odontólogos */}
            <div className="bg-blue-100 rounded-2xl shadow-md p-5 border border-blue-600 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-200 p-2.5 rounded-xl">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Odontólogos</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">{odontologos}</p>
            </div>

            {/* Recepcionistas */}
            <div className="bg-green-100 rounded-2xl shadow-md p-5 border border-green-600 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-200 p-2.5 rounded-xl">
                        <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Recepcionistas</p>
                </div>
                <p className="text-3xl font-bold text-green-700">{recepcionistas}</p>
            </div>
        </div>
    );
}
