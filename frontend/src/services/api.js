const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || data?.detail || `Error en la solicitud (${res.status})`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Autenticación
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Reporte & Dashboard
  getReporte: () => request('/reporte'),

  // Estudiantes
  getEstudiantes: () => request('/estudiantes'),
  guardarEstudiante: (data, id) =>
    request(id ? `/estudiantes/${id}` : '/estudiantes', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  eliminarEstudiante: (id) => request(`/estudiantes/${id}`, { method: 'DELETE' }),

  // Docentes
  getDocentes: () => request('/docentes'),
  guardarDocente: (data, id) =>
    request(id ? `/docentes/${id}` : '/docentes', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  eliminarDocente: (id) => request(`/docentes/${id}`, { method: 'DELETE' }),

  // Materias
  getMaterias: () => request('/materias'),
  guardarMateria: (data, id) =>
    request(id ? `/materias/${id}` : '/materias', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  eliminarMateria: (id) => request(`/materias/${id}`, { method: 'DELETE' }),

  // Periodos
  getPeriodos: () => request('/periodos'),
  guardarPeriodo: (data, id) =>
    request(id ? `/periodos/${id}` : '/periodos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  eliminarPeriodo: (id) => request(`/periodos/${id}`, { method: 'DELETE' }),

  // Ofertas
  getOfertas: () => request('/ofertas'),
  getCombosOfertas: () => request('/ofertas/combos'),
  guardarOferta: (data, id) =>
    request(id ? `/ofertas/${id}` : '/ofertas', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  eliminarOferta: (id) => request(`/ofertas/${id}`, { method: 'DELETE' }),

  // Inscripciones
  getInscripciones: () => request('/inscripciones'),
  getCombosInscripciones: () => request('/inscripciones/combos'),
  guardarInscripcion: (data, id) =>
    request(id ? `/inscripciones/${id}` : '/inscripciones', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  actualizarNota: (id, notaFinal) =>
    request(`/inscripciones/${id}/nota`, {
      method: 'PATCH',
      body: JSON.stringify({ notaFinal }),
    }),
  eliminarInscripcion: (id) => request(`/inscripciones/${id}`, { method: 'DELETE' }),

  // Configuración
  getConfiguracion: () => request('/configuracion'),
  probarConexion: (data) =>
    request('/configuracion/probar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  guardarConexion: (data) =>
    request('/configuracion/guardar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  inicializarBD: () => request('/configuracion/inicializar', { method: 'POST' }),
};

