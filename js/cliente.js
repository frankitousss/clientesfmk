// ============================================================
// FMK BARBERSHOP · clientesfmk — landing pública + panel del cliente
// ============================================================

let usuarioActual = null; // perfil del cliente logueado, o null si es invitado
let accionPendiente = null; // { tipo: 'reservar'|'comprar', datos: ... } — se ejecuta después de loguearse

// ---------- Elementos del modal ----------
const modalAuth = document.getElementById('modal-auth');
const tabLogin = document.getElementById('tab-login');
const tabRegistro = document.getElementById('tab-registro');
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const formOlvide = document.getElementById('form-olvide');
const mensajeLogin = document.getElementById('mensaje-login');
const mensajeRegistro = document.getElementById('mensaje-registro');
const mensajeOlvide = document.getElementById('mensaje-olvide');

function mostrarMensaje(el, texto, tipo) {
  el.textContent = texto;
  el.className = `mensaje visible mensaje--${tipo}`;
}

function ocultarMensaje(el) {
  el.className = 'mensaje';
  el.textContent = '';
}

function mostrarPestañaLogin() {
  tabLogin.classList.add('activo');
  tabRegistro.classList.remove('activo');
  formLogin.classList.remove('oculto');
  formRegistro.classList.add('oculto');
  formOlvide.classList.add('oculto');
}

tabLogin.addEventListener('click', mostrarPestañaLogin);

tabRegistro.addEventListener('click', () => {
  tabRegistro.classList.add('activo');
  tabLogin.classList.remove('activo');
  formRegistro.classList.remove('oculto');
  formLogin.classList.add('oculto');
  formOlvide.classList.add('oculto');
});

// ---------- Modal de confirmación / aviso (reemplaza confirm() y alert() nativos) ----------
// Se usan Promises para poder seguir escribiendo "if (!await mostrarConfirmacion(...)) return;"
const modalConfirmar = document.getElementById('modal-confirmar');
const confirmarTitulo = document.getElementById('confirmar-titulo');
const confirmarMensaje = document.getElementById('confirmar-mensaje');
const btnConfirmarSi = document.getElementById('confirmar-si');
const btnConfirmarNo = document.getElementById('confirmar-no');

function mostrarConfirmacion(mensaje, titulo = 'Confirmar turno') {
  return new Promise((resolve) => {
    confirmarTitulo.textContent = titulo;
    confirmarMensaje.textContent = mensaje;
    modalConfirmar.classList.remove('oculto');

    function limpiar(resultado) {
      modalConfirmar.classList.add('oculto');
      btnConfirmarSi.removeEventListener('click', onSi);
      btnConfirmarNo.removeEventListener('click', onNo);
      modalConfirmar.removeEventListener('click', onFondo);
      resolve(resultado);
    }
    function onSi() { limpiar(true); }
    function onNo() { limpiar(false); }
    function onFondo(e) { if (e.target === modalConfirmar) limpiar(false); }

    btnConfirmarSi.addEventListener('click', onSi);
    btnConfirmarNo.addEventListener('click', onNo);
    modalConfirmar.addEventListener('click', onFondo);
  });
}

const modalAvisoGeneral = document.getElementById('modal-aviso-general');
const avisoGeneralMensaje = document.getElementById('aviso-general-mensaje');
const btnAvisoGeneralCerrar = document.getElementById('aviso-general-cerrar');

function mostrarAviso(mensaje) {
  return new Promise((resolve) => {
    avisoGeneralMensaje.textContent = mensaje;
    modalAvisoGeneral.classList.remove('oculto');

    function limpiar() {
      modalAvisoGeneral.classList.add('oculto');
      btnAvisoGeneralCerrar.removeEventListener('click', onCerrar);
      modalAvisoGeneral.removeEventListener('click', onFondo);
      resolve();
    }
    function onCerrar() { limpiar(); }
    function onFondo(e) { if (e.target === modalAvisoGeneral) limpiar(); }

    btnAvisoGeneralCerrar.addEventListener('click', onCerrar);
    modalAvisoGeneral.addEventListener('click', onFondo);
  });
}

// ---------- Abrir / cerrar el modal (el "cuadrado" de login, no un alert) ----------
function abrirModal(pestaña = 'login', accion = null) {
  accionPendiente = accion;
  ocultarMensaje(mensajeLogin);
  ocultarMensaje(mensajeRegistro);
  ocultarMensaje(mensajeOlvide);
  formOlvide.classList.add('oculto');
  if (pestaña === 'registro') {
    tabRegistro.click();
  } else {
    mostrarPestañaLogin();
  }
  modalAuth.classList.remove('oculto');
}

function cerrarModal() {
  modalAuth.classList.add('oculto');
  accionPendiente = null;
}

document.getElementById('modal-cerrar').addEventListener('click', cerrarModal);
modalAuth.addEventListener('click', (e) => {
  if (e.target === modalAuth) cerrarModal();
});

document.getElementById('btn-abrir-login').addEventListener('click', () => abrirModal('login'));
document.getElementById('btn-login-turnos').addEventListener('click', () => abrirModal('login'));
document.getElementById('btn-login-tarjeta').addEventListener('click', () => abrirModal('login'));

// ---------- Mostrar / ocultar contraseña ----------
document.querySelectorAll('.btn-ojo').forEach((boton) => {
  boton.addEventListener('click', () => {
    const input = document.getElementById(boton.dataset.toggle);
    const esOculta = input.type === 'password';
    input.type = esOculta ? 'text' : 'password';
    boton.setAttribute('aria-label', esOculta ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
});

// ---------- Olvidé mi contraseña ----------
document.getElementById('btn-olvide').addEventListener('click', () => {
  formLogin.classList.add('oculto');
  formOlvide.classList.remove('oculto');
});

document.getElementById('btn-volver-login').addEventListener('click', () => {
  formOlvide.classList.add('oculto');
  mostrarPestañaLogin();
});

formOlvide.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensaje(mensajeOlvide);
  const email = document.getElementById('olvide-email').value.trim();

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname.replace('index.html', '') + 'reset.html',
  });

  if (error) {
    mostrarMensaje(mensajeOlvide, 'No pudimos enviar el email: ' + error.message, 'error');
    return;
  }

  mostrarMensaje(mensajeOlvide, 'Listo. Revisá tu email (y la carpeta de spam) para crear una contraseña nueva.', 'ok');
});

// ---------- Login (con email o DNI) ----------
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensaje(mensajeLogin);

  const usuario = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-password').value;

  if (!usuario || !password) {
    mostrarMensaje(mensajeLogin, 'Completá usuario y contraseña.', 'error');
    return;
  }

  let email = usuario;

  if (!usuario.includes('@')) {
    const { data: emailEncontrado, error: errorDni } = await supabaseClient.rpc('email_by_dni', { p_dni: usuario });

    if (errorDni) {
      mostrarMensaje(mensajeLogin, 'No pudimos validar el DNI: ' + errorDni.message, 'error');
      return;
    }
    if (!emailEncontrado) {
      mostrarMensaje(mensajeLogin, 'No encontramos ninguna cuenta con ese DNI.', 'error');
      return;
    }
    email = emailEncontrado;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      mostrarMensaje(mensajeLogin, 'Tenés que confirmar tu email antes de entrar. Revisá tu casilla de correo.', 'error');
    } else if (error.message.toLowerCase().includes('invalid login credentials')) {
      mostrarMensaje(mensajeLogin, 'Usuario o contraseña incorrectos.', 'error');
    } else {
      mostrarMensaje(mensajeLogin, 'No pudimos iniciar sesión: ' + error.message, 'error');
    }
    return;
  }

  const perfil = await cargarPerfil(data.user.id);
  if (!perfil) return; // cargarPerfil ya mostró el error y cerró la sesión si hacía falta

  cerrarModalYContinuar();
});

// ---------- Registro ----------
formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensaje(mensajeRegistro);

  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const passwordConfirmar = document.getElementById('reg-password-confirmar').value;
  const username = document.getElementById('reg-username').value.trim();
  const dni = document.getElementById('reg-dni').value.trim();

  if (!dni) {
    mostrarMensaje(mensajeRegistro, 'Ingresá tu DNI para crear la cuenta.', 'error');
    return;
  }

  if (password !== passwordConfirmar) {
    mostrarMensaje(mensajeRegistro, 'Las contraseñas no coinciden.', 'error');
    return;
  }

  if (password.length < 6) {
    mostrarMensaje(mensajeRegistro, 'La contraseña tiene que tener al menos 6 caracteres.', 'error');
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    mostrarMensaje(mensajeRegistro, 'No pudimos crear la cuenta: ' + error.message, 'error');
    return;
  }

  const userId = data.user?.id;
  if (!userId) {
    mostrarMensaje(mensajeRegistro, 'Revisá tu email para confirmar la cuenta y después iniciá sesión.', 'ok');
    return;
  }

  const { error: errorPerfil } = await supabaseClient.from('profiles').insert({
    id: userId,
    role: 'cliente',
    full_name: nombre,
    username: username || null,
    dni: dni,
  });

  if (errorPerfil) {
    mostrarMensaje(mensajeRegistro, 'La cuenta se creó pero falló el perfil: ' + errorPerfil.message, 'error');
    return;
  }

  await supabaseClient.from('tarjetas_fidelidad').insert({ cliente_id: userId });

  const { data: sesion } = await supabaseClient.auth.getSession();
  if (sesion.session) {
    const perfil = await cargarPerfil(userId);
    if (!perfil) return;
    cerrarModalYContinuar();
  } else {
    mostrarMensaje(mensajeRegistro, '¡Cuenta creada! Revisá tu email para confirmarla y después iniciá sesión.', 'ok');
    formRegistro.reset();
  }
});

// Al loguearse/registrarse: cierra el modal, actualiza la vista y retoma
// la acción que el usuario quería hacer (reservar un horario, por ejemplo).
function cerrarModalYContinuar() {
  const accion = accionPendiente;
  modalAuth.classList.add('oculto');
  accionPendiente = null;
  actualizarVistaSesion();
  cargarMisTurnos();
  cargarTarjeta();

  if (accion?.tipo === 'reservar') {
    reservarTurno(accion.datos);
  } else if (accion?.tipo === 'comprar') {
    procesarCompra(accion.datos);
  }
}

// ============================================================
// SESIÓN
// ============================================================

async function cargarPerfil(userId) {
  const { data: perfil, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !perfil) {
    mostrarMensaje(mensajeLogin, 'No pudimos cargar tu perfil. Probá de nuevo.', 'error');
    await supabaseClient.auth.signOut();
    usuarioActual = null;
    return null;
  }

  if (perfil.role !== 'cliente') {
    mostrarMensaje(mensajeLogin, 'Esta cuenta es de barbero. Usá el panel de barberos para entrar.', 'error');
    await supabaseClient.auth.signOut();
    usuarioActual = null;
    return null;
  }

  usuarioActual = perfil;
  return perfil;
}

function actualizarVistaSesion() {
  const navUsuario = document.getElementById('nav-usuario');
  const btnAbrirLogin = document.getElementById('btn-abrir-login');
  const btnSalir = document.getElementById('btn-salir');
  const candadoTurnos = document.getElementById('candado-turnos');
  const candadoTarjeta = document.getElementById('candado-tarjeta');
  const contenidoTarjeta = document.getElementById('contenido-tarjeta');

  if (usuarioActual) {
    navUsuario.classList.remove('oculto');
    document.getElementById('nombre-usuario').textContent = usuarioActual.full_name;
    btnAbrirLogin.classList.add('oculto');
    btnSalir.classList.remove('oculto');
    candadoTurnos.classList.add('oculto');
    candadoTarjeta.classList.add('oculto');
    contenidoTarjeta.classList.remove('oculto');
  } else {
    navUsuario.classList.add('oculto');
    btnAbrirLogin.classList.remove('oculto');
    btnSalir.classList.add('oculto');
    candadoTurnos.classList.remove('oculto');
    candadoTarjeta.classList.remove('oculto');
    contenidoTarjeta.classList.add('oculto');
    document.getElementById('mis-turnos').innerHTML = '';
  }
}

document.getElementById('btn-salir').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  usuarioActual = null;
  actualizarVistaSesion();
  cargarHorariosDisponibles();
});

(async function iniciar() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    await cargarPerfil(data.session.user.id);
  }
  actualizarVistaSesion();

  cambiarSeccion('reservar');
  cargarHorariosDisponibles();
  cargarMisTurnos();
  cargarTarjeta();
  cargarProductosTienda();
})();

// ---------- Navegación entre secciones ----------
const secciones = ['reservar', 'tarjeta', 'tienda', 'cursos'];

function cambiarSeccion(nombre) {
  secciones.forEach((s) => {
    document.getElementById(`seccion-${s}`).classList.toggle('oculto', s !== nombre);
    document.getElementById(`nav-${s}`).classList.toggle('activo', s === nombre);
  });
}

secciones.forEach((s) => {
  document.getElementById(`nav-${s}`).addEventListener('click', () => {
    if (s === 'tarjeta' && !usuarioActual) {
      cambiarSeccion(s);
      return; // se muestra el candado, no hace falta el modal todavía
    }
    cambiarSeccion(s);
  });
});

// ============================================================
// RESERVAR TURNO
// ============================================================

let horariosCargados = []; // todos los horarios disponibles (sin filtrar), para poder filtrar por día sin volver a pedirlos

async function cargarHorariosDisponibles() {
  const cont = document.getElementById('horarios-disponibles');
  cont.innerHTML = 'Cargando...';

  const { fecha: hoy, hora: ahora } = fechaHoraActualLocal();

  // Además de disponibles, que ya no sean horarios que ya pasaron
  // (día anterior, o el mismo día pero a una hora que ya pasó).
  const { data: horarios, error } = await supabaseClient
    .from('horarios')
    .select('*, profiles:barbero_id(full_name)')
    .eq('disponible', true)
    .or(`fecha.gt.${hoy},and(fecha.eq.${hoy},hora.gte.${ahora})`)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) {
    cont.innerHTML = `<div class="mensaje mensaje--error visible">${error.message}</div>`;
    return;
  }

  horariosCargados = horarios;
  renderizarHorarios();
}

const HORARIOS_POR_PAGINA = 4;
let paginaHorarios = 0;

function renderizarHorarios() {
  const cont = document.getElementById('horarios-disponibles');
  const paginacion = document.getElementById('paginacion-horarios');
  const fechaFiltro = document.getElementById('filtro-fecha').value;

  const horarios = fechaFiltro
    ? horariosCargados.filter((h) => h.fecha === fechaFiltro)
    : horariosCargados;

  if (!horarios.length) {
    cont.innerHTML = fechaFiltro
      ? '<div class="vacio">No hay horarios disponibles ese día. Probá con otra fecha.</div>'
      : '<div class="vacio">No hay horarios disponibles por ahora. Volvé más tarde.</div>';
    paginacion.innerHTML = '';
    return;
  }

  const totalPaginas = Math.ceil(horarios.length / HORARIOS_POR_PAGINA);
  if (paginaHorarios >= totalPaginas) paginaHorarios = totalPaginas - 1;
  if (paginaHorarios < 0) paginaHorarios = 0;

  const inicio = paginaHorarios * HORARIOS_POR_PAGINA;
  const horariosPagina = horarios.slice(inicio, inicio + HORARIOS_POR_PAGINA);

  cont.innerHTML = '';
  horariosPagina.forEach((h) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'horario-btn';
    boton.textContent = `${formatearFecha(h.fecha)} · ${h.hora.slice(0, 5)} hs`;
    boton.addEventListener('click', () => {
      if (!usuarioActual) {
        abrirModal('login', { tipo: 'reservar', datos: h });
        return;
      }
      reservarTurno(h);
    });
    cont.appendChild(boton);
  });

  if (totalPaginas <= 1) {
    paginacion.innerHTML = '';
    return;
  }

  paginacion.innerHTML = `
    <button type="button" class="btn btn--chico" id="btn-pagina-anterior" ${paginaHorarios === 0 ? 'disabled' : ''}>‹ Anterior</button>
    <span class="paginacion__pagina">Página ${paginaHorarios + 1} de ${totalPaginas}</span>
    <button type="button" class="btn btn--chico" id="btn-pagina-siguiente" ${paginaHorarios >= totalPaginas - 1 ? 'disabled' : ''}>Siguiente ›</button>
  `;

  document.getElementById('btn-pagina-anterior').addEventListener('click', () => {
    paginaHorarios--;
    renderizarHorarios();
  });
  document.getElementById('btn-pagina-siguiente').addEventListener('click', () => {
    paginaHorarios++;
    renderizarHorarios();
  });
}

document.getElementById('filtro-fecha').addEventListener('change', () => {
  paginaHorarios = 0;
  renderizarHorarios();
});
document.getElementById('btn-limpiar-filtro').addEventListener('click', () => {
  document.getElementById('filtro-fecha').value = '';
  paginaHorarios = 0;
  renderizarHorarios();
});

// Número de WhatsApp del barbero (con código de país, sin espacios ni signos).
const WHATSAPP_BARBERO = '5491132555791';

async function reservarTurno(horario) {
  if (!usuarioActual) {
    abrirModal('login', { tipo: 'reservar', datos: horario });
    return;
  }

  const confirmado = await mostrarConfirmacion(
    `¿Reservar el turno del ${formatearFecha(horario.fecha)} a las ${horario.hora.slice(0, 5)} hs?`,
    'Confirmar turno'
  );
  if (!confirmado) return;

  const { error: errorTurno } = await supabaseClient.from('turnos').insert({
    horario_id: horario.id,
    barbero_id: horario.barbero_id,
    cliente_id: usuarioActual.id,
    fecha: horario.fecha,
    hora: horario.hora,
  });

  if (errorTurno) {
    await mostrarAviso('No se pudo reservar: ' + errorTurno.message);
    return;
  }

  await supabaseClient.from('horarios').update({ disponible: false }).eq('id', horario.id);

  cargarHorariosDisponibles();
  cargarMisTurnos();

  // Al confirmar con "Sí", se va directo a WhatsApp con el turno ya armado.
  const mensaje = `Hola! Quiero confirmar mi turno del ${formatearFecha(horario.fecha)} a las ${horario.hora.slice(0, 5)} hs.`;
  window.location.href = `https://wa.me/${WHATSAPP_BARBERO}?text=${encodeURIComponent(mensaje)}`;
}

async function cargarMisTurnos() {
  if (!usuarioActual) return;
  const cont = document.getElementById('mis-turnos');
  cont.innerHTML = 'Cargando...';

  const { data: turnos, error } = await supabaseClient
    .from('turnos')
    .select('id, fecha, hora, estado, profiles:barbero_id(full_name)')
    .eq('cliente_id', usuarioActual.id)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) {
    cont.innerHTML = `<div class="mensaje mensaje--error visible">${error.message}</div>`;
    return;
  }

  if (!turnos.length) {
    cont.innerHTML = '<div class="vacio">Todavía no reservaste ningún turno.</div>';
    return;
  }

  const hoyStr = new Date().toISOString().slice(0, 10);

  cont.innerHTML = '';
  turnos.forEach((t) => {
    const esFuturoYReservado = t.estado === 'reservado' && t.fecha >= hoyStr;

    const fila = document.createElement('div');
    fila.className = 'item-lista';
    fila.innerHTML = `
      <div class="item-lista__info">
        <strong>${t.profiles?.full_name ?? 'Barbero'}</strong>
        <span>${formatearFecha(t.fecha)} · ${t.hora.slice(0, 5)} hs</span>
      </div>
      <div style="display:flex; align-items:center; gap:0.6rem;">
        <span class="pill pill--${t.estado}">${etiquetaEstado(t.estado)}</span>
        ${esFuturoYReservado
          ? `<button class="btn btn--chico btn--peligro" data-cancelar="${t.id}">Cancelar</button>`
          : `<button class="btn btn--chico btn--fantasma" data-borrar="${t.id}">Borrar</button>`}
      </div>
    `;
    cont.appendChild(fila);
  });

  cont.querySelectorAll('[data-cancelar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmado = await mostrarConfirmacion('¿Cancelar este turno?', 'Cancelar turno');
      if (!confirmado) return;
      const { error } = await supabaseClient.from('turnos').update({ estado: 'cancelado' }).eq('id', btn.dataset.cancelar);
      if (error) {
        await mostrarAviso('No se pudo cancelar: ' + error.message);
        return;
      }
      cargarMisTurnos();
      cargarHorariosDisponibles();
    });
  });

  cont.querySelectorAll('[data-borrar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmado = await mostrarConfirmacion('¿Borrar este turno de tu historial?', 'Borrar turno');
      if (!confirmado) return;
      const { error } = await supabaseClient.from('turnos').delete().eq('id', btn.dataset.borrar);
      if (error) {
        await mostrarAviso('No se pudo borrar: ' + error.message);
        return;
      }
      cargarMisTurnos();
    });
  });
}

// ============================================================
// TARJETA DE FIDELIDAD
// ============================================================

async function cargarTarjeta() {
  if (!usuarioActual) return;

  const { data: tarjeta } = await supabaseClient
    .from('tarjetas_fidelidad')
    .select('*')
    .eq('cliente_id', usuarioActual.id)
    .maybeSingle();

  const sellosGrid = document.getElementById('sellos-grid');
  sellosGrid.innerHTML = '';

  const sellos = tarjeta?.sellos ?? 0;

  for (let i = 1; i <= 10; i++) {
    const div = document.createElement('div');
    div.className = 'sello' + (i <= sellos ? ' lleno' : '');
    div.textContent = i <= sellos ? '✓' : i;
    sellosGrid.appendChild(div);
  }

  document.getElementById('stat-cortes').textContent = tarjeta?.cortes_totales ?? 0;
  document.getElementById('stat-gratis').textContent = tarjeta?.cortes_gratis_disponibles ?? 0;

  const restantes = 10 - sellos;
  const nota = document.getElementById('nota-tarjeta');
  if ((tarjeta?.cortes_gratis_disponibles ?? 0) > 0) {
    nota.textContent = '¡Tenés un corte gratis disponible! Avisale a tu barbero.';
  } else {
    nota.textContent = `Te faltan ${restantes} corte${restantes === 1 ? '' : 's'} para ganar uno gratis. Cada 3 cortes hay una recompensa mínima.`;
  }
}

// ============================================================
// GALERÍA DE VIDEOS (slider automático: pasan uno detrás de otro, sin pausa)
// ============================================================

(function iniciarSliderVideos() {
  const slider = document.getElementById('galeria-videos-slider');
  if (!slider) return;

  const tarjetas = Array.from(slider.querySelectorAll('.video-card'));
  if (!tarjetas.length) return;

  let indiceActual = tarjetas.findIndex((t) => t.classList.contains('activo'));
  if (indiceActual === -1) indiceActual = 0;

  function reproducir(indice) {
    tarjetas.forEach((tarjeta, i) => {
      const video = tarjeta.querySelector('video');
      tarjeta.classList.toggle('activo', i === indice);
      if (i === indice) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  tarjetas.forEach((tarjeta, i) => {
    const video = tarjeta.querySelector('video');
    video.addEventListener('ended', () => {
      indiceActual = (i + 1) % tarjetas.length;
      reproducir(indiceActual);
    });
  });

  reproducir(indiceActual);
})();

// ============================================================
// TIENDA (browsable para invitados, "Comprar" pide iniciar sesión)
// ============================================================

async function cargarProductosTienda() {
  const cont = document.getElementById('lista-productos-cliente');
  cont.innerHTML = 'Cargando...';

  const { data: productos, error } = await supabaseClient
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (error) {
    cont.innerHTML = `<div class="mensaje mensaje--error visible">${error.message}</div>`;
    return;
  }

  if (!productos.length) {
    cont.innerHTML = '<div class="vacio">Todavía no hay productos cargados en la tienda.</div>';
    return;
  }

  cont.innerHTML = '';
  productos.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'producto-card';
    card.innerHTML = `
      ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}">` : ''}
      <div class="producto-card__cuerpo">
        <h3>${p.nombre}</h3>
        <p class="texto-tenue">${p.descripcion ?? ''}</p>
        <span class="producto-card__precio">$${Number(p.precio).toLocaleString('es-AR')}</span>
      </div>
      <div class="producto-card__acciones">
        <button type="button" class="btn btn--violeta" style="width:100%" data-comprar="${p.id}">Comprar</button>
      </div>
    `;
    cont.appendChild(card);
  });

  cont.querySelectorAll('[data-comprar]').forEach((btn) => {
    const producto = productos.find((p) => p.id === btn.dataset.comprar);
    btn.addEventListener('click', () => {
      if (!usuarioActual) {
        abrirModal('login', { tipo: 'comprar', datos: producto });
        return;
      }
      procesarCompra(producto);
    });
  });
}

// ---------- Modal de compra (pago + entrega antes de ir a WhatsApp) ----------
const modalCompra = document.getElementById('modal-compra');
const formCompra = document.getElementById('form-compra');
const compraProductoNombre = document.getElementById('compra-producto-nombre');
const compraDireccionCampo = document.getElementById('compra-direccion-campo');
const compraCantidadInput = document.getElementById('compra-cantidad');
const compraTotal = document.getElementById('compra-total');
let productoEnCompra = null;

document.getElementById('modal-compra-cerrar').addEventListener('click', () => {
  modalCompra.classList.add('oculto');
});
modalCompra.addEventListener('click', (e) => {
  if (e.target === modalCompra) modalCompra.classList.add('oculto');
});

document.querySelectorAll('input[name="compra-envio"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const conEnvio = document.querySelector('input[name="compra-envio"]:checked').value === 'con';
    compraDireccionCampo.classList.toggle('oculto', !conEnvio);
  });
});

function actualizarTotalCompra() {
  if (!productoEnCompra) return;
  const cantidad = Math.max(1, parseInt(compraCantidadInput.value, 10) || 1);
  const total = Number(productoEnCompra.precio) * cantidad;
  compraTotal.textContent = `Total: $${total.toLocaleString('es-AR')} (${cantidad} × $${Number(productoEnCompra.precio).toLocaleString('es-AR')})`;
}

compraCantidadInput.addEventListener('input', actualizarTotalCompra);

formCompra.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!productoEnCompra) return;

  const cantidad = Math.max(1, parseInt(compraCantidadInput.value, 10) || 1);
  const pago = document.querySelector('input[name="compra-pago"]:checked').value;
  const envio = document.querySelector('input[name="compra-envio"]:checked').value; // 'con' | 'sin'
  const direccion = document.getElementById('compra-direccion').value.trim();

  if (envio === 'con' && !direccion) {
    document.getElementById('compra-direccion').focus();
    return;
  }

  const precioUnitario = Number(productoEnCompra.precio);
  const total = precioUnitario * cantidad;

  let mensaje = `Hola! Quiero comprar:\n`;
  mensaje += `Producto: ${productoEnCompra.nombre}\n`;
  mensaje += `Cantidad: ${cantidad}\n`;
  mensaje += `Precio unitario: $${precioUnitario.toLocaleString('es-AR')}\n`;
  mensaje += `Total: $${total.toLocaleString('es-AR')}\n\n`;
  mensaje += `Forma de pago: ${pago}.\n`;
  mensaje += envio === 'con'
    ? `Entrega: envío a domicilio, dirección: ${direccion}.\n`
    : `Entrega: paso a retirarlo por el local.\n`;
  mensaje += `Soy ${usuarioActual.full_name}, DNI ${usuarioActual.dni ?? 's/d'}.`;

  modalCompra.classList.add('oculto');
  window.location.href = `https://wa.me/${WHATSAPP_BARBERO}?text=${encodeURIComponent(mensaje)}`;
});

async function procesarCompra(producto) {
  productoEnCompra = producto;
  compraProductoNombre.textContent = `${producto.nombre} · $${Number(producto.precio).toLocaleString('es-AR')}`;
  formCompra.reset();
  compraCantidadInput.value = 1;
  compraDireccionCampo.classList.add('oculto');
  actualizarTotalCompra();
  modalCompra.classList.remove('oculto');
}

// ============================================================
// Utilidades
// ============================================================

function fechaHoraActualLocal() {
  const ahora = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    fecha: `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`,
    hora: `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`,
  };
}

function formatearFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-');
  return `${dia}/${mes}/${anio}`;
}

function etiquetaEstado(estado) {
  return { reservado: 'Reservado', completado: 'Completado', cancelado: 'Cancelado' }[estado] ?? estado;
}
