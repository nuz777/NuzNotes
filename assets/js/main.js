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

// Elementos de los apartados (vistas y muro)
const tabEditor = $('tab-editor');
const tabMuro = $('tab-muro');
const tabBadge = $('tab-badge');
const vistaEditor = $('vista-editor');
const vistaMuro = $('vista-muro');
const muroGrid = $('muro-grid');
const muroVacio = $('muro-vacio');
const buscarMuro = $('buscar-muro');
const toast = $('toast');

let notas = cargar();
let activaId = null;
let temporizador = null;
let vistaActual = 'editor';
let toastTimer = null;

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
  actualizarContadores();
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

function actualizarContadores() {
  const total = notas.length;

  if (headerContador) {
    if (total === 0) {
      headerContador.textContent = '0 notas guardadas';
    } else if (total === 1) {
      headerContador.textContent = '1 nota guardada';
    } else {
      headerContador.textContent = `${total} notas guardadas`;
    }
  }

  if (tabBadge) {
    tabBadge.textContent = total;
  }
}

function actualizarContadorTexto() {
  if (!contadorCaracteres) return;
  const txt = cuerpo.value || '';
  const caracteres = txt.length;
  const palabras = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  contadorCaracteres.textContent = `${palabras} ${palabras === 1 ? 'palabra' : 'palabras'} · ${caracteres} car.`;
}

function mostrarToast(mensaje, icono = '✓') {
  if (!toast) return;
  toast.innerHTML = `<span style="font-size:1.1rem;color:#818cf8;">${icono}</span> <span>${mensaje}</span>`;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function cambiarVista(vista) {
  vistaActual = vista;

  if (vista === 'editor') {
    tabEditor.classList.add('active');
    tabEditor.setAttribute('aria-selected', 'true');
    tabMuro.classList.remove('active');
    tabMuro.setAttribute('aria-selected', 'false');

    vistaEditor.hidden = false;
    vistaEditor.classList.add('active');
    vistaMuro.hidden = true;
    vistaMuro.classList.remove('active');
    render();
  } else {
    tabMuro.classList.add('active');
    tabMuro.setAttribute('aria-selected', 'true');
    tabEditor.classList.remove('active');
    tabEditor.setAttribute('aria-selected', 'false');

    vistaMuro.hidden = false;
    vistaMuro.classList.add('active');
    vistaEditor.hidden = true;
    vistaEditor.classList.remove('active');
    renderMuro();
  }
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

  // Asegura cambiar al editor y enfocar el título
  if (vistaActual !== 'editor') {
    cambiarVista('editor');
  }

  seleccionar(nota.id);
  titulo.focus();
  mostrarToast('Nueva nota creada');
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

  actualizarContadores();
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
  mostrarToast('Nota eliminada', '🗑️');
}

function borrarDesdeMuro(id, cardElement, e) {
  e.stopPropagation();
  const nota = notas.find((n) => n.id === id);
  if (!nota) return;
  const nombre = nota.titulo ? `"${nota.titulo}"` : 'esta nota sin título';
  if (!confirm(`¿Estás seguro de que deseas eliminar ${nombre}?`)) return;

  // Animación de salida antes de borrar del DOM
  cardElement.classList.add('deleting');

  setTimeout(() => {
    notas = notas.filter((n) => n.id !== id);
    guardar();

    if (activaId === id) {
      activaId = notas[0]?.id ?? null;
      seleccionar(activaId);
    }

    renderMuro();
    render();
    mostrarToast('Nota eliminada', '🗑️');
  }, 280);
}

function copiarNota(id, e) {
  e.stopPropagation();
  const nota = notas.find((n) => n.id === id);
  if (!nota) return;

  const texto = [nota.titulo, nota.cuerpo].filter(Boolean).join('\n\n');
  if (!texto.trim()) {
    mostrarToast('La nota está vacía', 'ℹ️');
    return;
  }

  navigator.clipboard
    .writeText(texto)
    .then(() => {
      mostrarToast('Nota copiada al portapapeles', '📋');
    })
    .catch(() => {
      mostrarToast('No se pudo copiar la nota', '⚠️');
    });
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
      v.textContent =
        n.cuerpo.trim().split('\n')[0] || 'Sin contenido adicional...';

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
  if (!hayResultados && vacioMensaje) {
    vacioMensaje.textContent = notas.length
      ? 'No se encontraron notas con esa búsqueda.'
      : 'No hay notas todavía.';
  }
}

// Renderizado del Muro de Cards con animaciones
function renderMuro() {
  if (!muroGrid) return;

  const q = (buscarMuro?.value || '').trim().toLowerCase();
  const visibles = notas
    .filter(
      (n) =>
        !q ||
        n.titulo.toLowerCase().includes(q) ||
        n.cuerpo.toLowerCase().includes(q)
    )
    .sort((a, b) => b.actualizada - a.actualizada);

  muroGrid.replaceChildren();

  // 1. Tarjeta especial para crear una nueva nota (siempre visible como primera opción)
  const addCard = document.createElement('div');
  addCard.className = 'muro-card-add';
  addCard.setAttribute('role', 'button');
  addCard.setAttribute('tabindex', '0');
  addCard.title = 'Crear nueva nota';
  addCard.innerHTML = `
    <div class="add-icon-circle">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </div>
    <div class="add-title">Nueva Tarjeta</div>
    <div class="add-desc">Haz clic para escribir una nota</div>
  `;
  addCard.addEventListener('click', nuevaNota);
  addCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      nuevaNota();
    }
  });
  muroGrid.appendChild(addCard);

  // 2. Renderizado de las cards de cada nota
  visibles.forEach((n, index) => {
    const card = document.createElement('article');
    card.className = 'muro-card';
    card.setAttribute('data-color', index % 6);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    // Retardo escalonado de animación
    card.style.setProperty('--card-delay', `${(index + 1) * 0.045}s`);

    const palabras = n.cuerpo.trim() ? n.cuerpo.trim().split(/\s+/).length : 0;
    const palabrasTexto = `${palabras} ${palabras === 1 ? 'palabra' : 'palabras'}`;
    const tituloTexto = n.titulo.trim() || 'Nota sin título';
    const cuerpoTexto = n.cuerpo.trim() || 'Sin contenido adicional...';

    card.innerHTML = `
      <div class="muro-card-accent"></div>
      <div>
        <div class="muro-card-header">
          <h3 class="muro-card-title">${escapeHTML(tituloTexto)}</h3>
          <div class="muro-card-actions">
            <button class="card-action-btn btn-copiar" type="button" title="Copiar nota">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="card-action-btn delete btn-borrar-card" type="button" title="Eliminar nota">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <p class="muro-card-body">${escapeHTML(cuerpoTexto)}</p>
      </div>

      <div class="muro-card-footer">
        <div class="muro-card-date">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${formatFecha(n.actualizada)}</span>
        </div>
        <div class="muro-card-meta">
          <span class="muro-card-words">${palabrasTexto}</span>
          <span class="muro-card-open">
            Abrir
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        </div>
      </div>
    `;

    // Abrir nota en el editor al hacer clic en la tarjeta
    card.addEventListener('click', () => {
      seleccionar(n.id);
      cambiarVista('editor');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        seleccionar(n.id);
        cambiarVista('editor');
      }
    });

    // Botones de acción interna
    const btnCopiar = card.querySelector('.btn-copiar');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', (e) => copiarNota(n.id, e));
    }

    const btnBorrarCard = card.querySelector('.btn-borrar-card');
    if (btnBorrarCard) {
      btnBorrarCard.addEventListener('click', (e) => borrarDesdeMuro(n.id, card, e));
    }

    muroGrid.appendChild(card);
  });

  const hayResultados = visibles.length > 0;
  if (muroVacio) {
    muroVacio.hidden = hayResultados || !q;
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Event Listeners
if (tabEditor) tabEditor.addEventListener('click', () => cambiarVista('editor'));
if (tabMuro) tabMuro.addEventListener('click', () => cambiarVista('muro'));

if (btnNueva) btnNueva.addEventListener('click', nuevaNota);
if (btnNuevaVacio) btnNuevaVacio.addEventListener('click', nuevaNota);
if (btnBorrar) btnBorrar.addEventListener('click', borrarActiva);

titulo.addEventListener('input', editar);
cuerpo.addEventListener('input', editar);
buscar.addEventListener('input', render);

if (buscarMuro) {
  buscarMuro.addEventListener('input', renderMuro);
}

// Sincroniza si la app está abierta en otra pestaña
window.addEventListener('storage', (e) => {
  if (e.key !== CLAVE) return;
  notas = cargar();
  if (!notas.some((n) => n.id === activaId)) activaId = null;
  seleccionar(activaId);
  if (vistaActual === 'muro') renderMuro();
});

// Inicialización
seleccionar(notas[0]?.id ?? null);
