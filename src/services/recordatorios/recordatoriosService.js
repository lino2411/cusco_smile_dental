import { supabase } from '../supabaseClient';

export const contarRecordatoriosPendientes = async () => {
    try {
        const { count, error } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .eq('recordatorio_pendiente', true)
            .in('estado', ['pendiente', 'confirmada']);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error contando recordatorios:', error);
        return 0;
    }
};
