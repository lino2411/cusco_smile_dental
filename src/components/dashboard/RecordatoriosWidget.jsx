import { useState, useEffect } from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contarRecordatoriosPendientes } from '../../services/recordatorios/recordatoriosService';

export default function RecordatoriosWidget() {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        cargarCount();

        // Recargar cada 2 minutos
        const interval = setInterval(cargarCount, 120000);
        return () => clearInterval(interval);
    }, []);

    const cargarCount = async () => {
        setLoading(true);
        const total = await contarRecordatoriosPendientes();
        setCount(total);
        setLoading(false);
    };

    if (loading) return null;
    if (count === 0) return null;

    return (
        <div
            className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl shadow-lg border-2 border-orange-200 p-5 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            onClick={() => navigate('/dashboard/citas')}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-3 rounded-xl shadow-lg">
                        <Bell className="w-7 h-7 text-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            🔔 Recordatorios Pendientes
                        </h3>
                        <p className="text-sm text-gray-600">
                            Tienes <strong className="text-orange-600 text-lg">{count}</strong> mensaje{count !== 1 ? 's' : ''} por enviar a tus pacientes
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors shadow-md">
                    <span>Ir a Citas</span>
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
