import { supabase } from "./supabaseClient";

export const obtenerDocumentosPorPaciente = async (pacienteId) => {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("fecha_subida", { ascending: false });

  if (error) {
    console.error("Error al obtener documentos:", error);
    return [];
  }

  return data;
};
