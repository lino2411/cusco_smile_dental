import { supabase } from './supabaseClient';

// ✅ Función para obtener fecha local en ISO
const getLocalISOString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// ✅ Obtener todos los pacientes ordenados por fecha de registro
export async function obtenerPacientes() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('fecha_registro', { ascending: false });

  if (error) {
    console.error('Error al obtener pacientes:', error.message);
    return [];
  }

  return data;
}

// ✅ Registrar un nuevo paciente - CORREGIDO
export async function registrarPaciente(form) {
  const pacienteData = Object.fromEntries(
    Object.entries({
      dni: form.dni,
      nombres: form.nombres,
      apellidos: form.apellidos,
      fecha_nacimiento: form.fecha_nacimiento,
      lugar_nacimiento: form.lugar_nacimiento,
      direccion: form.direccion,
      procedencia: form.procedencia,
      ocupacion: form.ocupacion,
      celular_emergencia: form.celular_emergencia,
      viajes_ultimo_anio: form.viajes_ultimo_anio,
      sexo: form.sexo,
      observaciones: form.observaciones,
      celular: form.celular,
      fecha_registro: getLocalISOString(),
      fecha_actualizacion: getLocalISOString(),
    }).map(([key, value]) => [key, value === "" ? null : value])
  );

  const { data, error } = await supabase
    .from("pacientes")
    .insert([pacienteData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error("El DNI ya se encuentra registrado.");
    }
    console.error("Error al registrar paciente:", error);
    throw error; // ✅ Lanzar error en lugar de devolver null
  }

  return data;
}

// ✅ Actualizar un paciente por su ID
export async function actualizarPaciente(form, id) {
  const pacienteActualizado = Object.fromEntries(
    Object.entries({
      dni: form.dni,
      nombres: form.nombres,
      apellidos: form.apellidos,
      fecha_nacimiento: form.fecha_nacimiento,
      lugar_nacimiento: form.lugar_nacimiento,
      direccion: form.direccion,
      procedencia: form.procedencia,
      ocupacion: form.ocupacion,
      celular_emergencia: form.celular_emergencia,
      viajes_ultimo_anio: form.viajes_ultimo_anio,
      sexo: form.sexo,
      observaciones: form.observaciones,
      celular: form.celular,
      echa_actualizacion: getLocalISOString(),
    }).map(([key, value]) => [key, value === "" ? null : value])
  );

  const { data, error } = await supabase
    .from("pacientes")
    .update(pacienteActualizado)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar paciente:", error.message);
    throw error; // ✅ Lanzar error
  }

  return data;
}

// ✅ Eliminar un paciente por su ID
export async function eliminarPaciente(id) {
  const { error } = await supabase
    .from("pacientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar paciente:", error.message);
    return false;
  }

  return true;
}

