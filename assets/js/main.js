const CLAVE = 'block-de-notas:v1';

const $ = (id) => document.getElementById(id);
const lista = $('lista');
const vacio = $('vacio');
const vacioMensaje = $('vacio-mensaje');
const buscar = $('buscar');
const titulo = $('titulo');
const cuerpo = $('cuerpo');
const estado = $('estado');
const editor = $('editor-contenido');
const sinSeleccion = $('sin-seleccion');
const headerContador = $('header-contador');
const fechaNota = $('fecha-nota');
const contadorCaracteres = $('contador-caracteres');
const statusIndicator = document.querySelector('.status-indicator');
const btnNueva = $('btn-nueva');
const btnNuevaVacio = $('btn-nueva-vacio');
const btnBorrar = $('btn-borrar');

let notas = cargar();
let activaId = null;
let temporizador = null;

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(notas));
    if (estado) estado.textContent = 'Guardado';
    if (statusIndicator) statusIndicator.classList.remove('saving');
  } catch {
    if (estado) estado.textContent = 'Error al guardar (almacenamiento lleno)';
    if (statusIndicator) statusIndicator.classList.remove('saving');
  }
  actualizarContadorHeader();
}

function formatFecha(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const ahora = new Date();
  const esHoy = d.toDateString() === ahora.toDateString();
  const opcionesHora = { hour: '2-digit', minute: '2-digit' };

  if (esHoy) {
    return `Hoy, ${d.toLocaleTimeString('es', opcionesHora)}`;
  }

  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) {
    return `Ayer, ${d.toLocaleTimeString('es', opcionesHora)}`;
  }

  return (
    d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('es', opcionesHora)
  );
}

function actualizarContadorHeader() {
  if (!headerContador) return;
  const total = notas.length;
  if (total === 0) {
    headerContador.textContent = '0 notas guardadas';
  } else if (total === 1) {
    headerContador.textContent = '1 nota guardada';
  } else {
    headerContador.textContent = `${total} notas guardadas`;
  }
}

function actualizarContadorTexto() {
  if (!contadorCaracteres) return;
  const txt = cuerpo.value || '';
  const caracteres = txt.length;
  const palabras = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  contadorCaracteres.textContent = `${palabras} ${palabras === 1 ? 'palabra' : 'palabras'} · ${caracteres} car.`;
}

function nuevaNota() {
  const nota = {
    id: crypto.randomUUID(),
    titulo: '',
    cuerpo: '',
    actualizada: Date.now(),
  };
  notas.unshift(nota);
  guardar();
  seleccionar(nota.id);
  titulo.focus();
}

function seleccionar(id) {
  activaId = id;
  const nota = notas.find((n) => n.id === id);
  editor.hidden = !nota;
  sinSeleccion.hidden = !!nota;

  if (nota) {
    titulo.value = nota.titulo;
    cuerpo.value = nota.cuerpo;
    if (fechaNota) fechaNota.textContent = formatFecha(nota.actualizada);
    if (estado) estado.textContent = 'Guardado';
    if (statusIndicator) statusIndicator.classList.remove('saving');
    actualizarContadorTexto();
  }

  actualizarContadorHeader();
  render();
}

function borrarActiva() {
  const nota = notas.find((n) => n.id === activaId);
  if (!nota) return;
  const nombre = nota.titulo ? `"${nota.titulo}"` : 'esta nota sin título';
  if (!confirm(`¿Estás seguro de que deseas eliminar ${nombre}?`)) return;

  notas = notas.filter((n) => n.id !== activaId);
  guardar();
  seleccionar(notas[0]?.id ?? null);
}

function editar() {
  const nota = notas.find((n) => n.id === activaId);
  if (!nota) return;

  nota.titulo = titulo.value;
  nota.cuerpo = cuerpo.value;
  nota.actualizada = Date.now();

  if (fechaNota) fechaNota.textContent = formatFecha(nota.actualizada);
  if (estado) estado.textContent = 'Guardando...';
  if (statusIndicator) statusIndicator.classList.add('saving');

  actualizarContadorTexto();

  clearTimeout(temporizador);
  temporizador = setTimeout(guardar, 350);
  render();
}

function render() {
  const q = buscar.value.trim().toLowerCase();
  const visibles = notas
    .filter(
      (n) =>
        !q ||
        n.titulo.toLowerCase().includes(q) ||
        n.cuerpo.toLowerCase().includes(q)
    )
    .sort((a, b) => b.actualizada - a.actualizada);

  lista.replaceChildren(
    ...visibles.map((n) => {
      const li = document.createElement('li');
      if (n.id === activaId) li.className = 'activa';

      const t = document.createElement('div');
      t.className = 't';
      t.textContent = n.titulo.trim() || 'Nota sin título';

      const v = document.createElement('div');
      v.className = 'v';
      v.textContent = n.cuerpo.trim().split('\n')[0] || 'Sin contenido adicional...';

      const f = document.createElement('div');
      f.className = 'f';
      f.textContent = formatFecha(n.actualizada);

      li.append(t, v, f);
      li.addEventListener('click', () => seleccionar(n.id));
      return li;
    })
  );

  const hayResultados = visibles.length > 0;
  vacio.hidden = hayResultados;
  if (!hayResultados) {
    if (vacioMensaje) {
      vacioMensaje.textContent = notas.length
        ? 'No se encontraron notas con esa búsqueda.'
        : 'No hay notas todavía.';
    }
  }
}

// Event Listeners
if (btnNueva) btnNueva.addEventListener('click', nuevaNota);
if (btnNuevaVacio) btnNuevaVacio.addEventListener('click', nuevaNota);
if (btnBorrar) btnBorrar.addEventListener('click', borrarActiva);
titulo.addEventListener('input', editar);
cuerpo.addEventListener('input', editar);
buscar.addEventListener('input', render);

// Sincroniza si la app está abierta en otra pestaña
window.addEventListener('storage', (e) => {
  if (e.key !== CLAVE) return;
  notas = cargar();
  if (!notas.some((n) => n.id === activaId)) activaId = null;
  seleccionar(activaId);
});

// Inicialización
seleccionar(notas[0]?.id ?? null);
