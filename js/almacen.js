// Todo lo que se guarda en la tablet pasa por aquí.
// Si el almacenamiento falla (lleno o bloqueado), el juego sigue funcionando.

export const CLAVES = { banco: 'cc.banco', ajustes: 'cc.ajustes', partida: 'cc.partida', pin: 'cc.pin' };

export function crearAlmacen(storage) {
  const memoria = new Map();

  function leer(clave, defecto) {
    try {
      const v = storage ? storage.getItem(clave) : (memoria.has(clave) ? memoria.get(clave) : null);
      return v == null ? defecto : JSON.parse(v);
    } catch {
      return defecto;
    }
  }

  function guardar(clave, valor) {
    const texto = JSON.stringify(valor);
    if (!storage) { memoria.set(clave, texto); return { ok: true }; }
    try {
      storage.setItem(clave, texto);
      return { ok: true };
    } catch (e) {
      const cuota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      return { ok: false, error: cuota ? 'cuota' : 'bloqueado' };
    }
  }

  function borrar(clave) {
    try { storage ? storage.removeItem(clave) : memoria.delete(clave); } catch { /* sin efecto */ }
  }

  const banco = () => leer(CLAVES.banco, []);

  function listarPropuestas(filtro = {}) {
    return banco().filter(p => (!filtro.estado || p.estado === filtro.estado) && (!filtro.curso || Number(p.curso) === Number(filtro.curso)));
  }

  function guardarPropuesta(p) {
    const lista = banco();
    const k = p.id ? lista.findIndex(x => x.id === p.id) : -1;
    const registro = {
      enMazo: false, comentario: '', ...p,
      id: p.id || `CC-COM-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
      estado: p.estado || 'pendiente',
      creada: p.creada || new Date().toISOString(),
    };
    if (k >= 0) lista[k] = registro; else lista.push(registro);
    const r = guardar(CLAVES.banco, lista);
    return r.ok ? { ok: true, id: registro.id } : r;
  }

  function actualizar(id, cambios) {
    const lista = banco();
    const p = lista.find(x => x.id === id);
    if (!p) return { ok: false, error: 'no-existe' };
    Object.assign(p, cambios);
    return guardar(CLAVES.banco, lista);
  }

  const cambiarEstado = (id, estado, comentario = '') =>
    actualizar(id, { estado, comentario, ...(estado !== 'aprobada' ? { enMazo: false } : {}) });
  const activarEnMazo = (id, enMazo) => actualizar(id, { enMazo: !!enMazo });

  function eliminarPropuesta(id) {
    return guardar(CLAVES.banco, banco().filter(p => p.id !== id));
  }

  function cartasComunidad(curso) {
    return banco()
      .filter(p => p.estado === 'aprobada' && p.enMazo && Number(p.curso) === Number(curso))
      .map(({ autor, fuente, comentario, estado, enMazo, creada, ...carta }) => ({ ...carta, autor, comunidad: true }));
  }

  return { leer, guardar, borrar, listarPropuestas, guardarPropuesta, cambiarEstado, activarEnMazo, eliminarPropuesta, cartasComunidad };
}

function storageDelNavegador() {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    s.setItem('cc.prueba', '1');
    s.removeItem('cc.prueba');
    return s;
  } catch {
    return null;
  }
}

export const almacen = crearAlmacen(storageDelNavegador());
