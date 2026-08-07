/* =========================================================
   WayBack · Diseño 3 — "Honduras Vibrante" · script.js
   ========================================================= */

/* ---- Placeholder de imágenes (estilo vibrante) ----
   Se usa en dos casos:
   1. <img data-ph="640/360"> → foto pendiente de entregar por el cliente.
   2. onerror de una imagen real que no cargó.
   Al reemplazar un placeholder por la foto definitiva, borra el data-ph. */
/* Un SVG es XML: un `&`, `<` o `>` suelto lo invalida entero y el navegador
   lo rechaza mostrando el icono de imagen rota. Pasaba con "Julián & Becky". */
function escaparXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function imgFallback(img) {
  img.onerror = null;
  const label = escaparXml((img.alt || 'WayBack').slice(0, 40));
  const palette = [['#e11d2e', '#6d28d9'], ['#0a47a8', '#00a3e0'], ['#6d28d9', '#e11d2e']];
  const [c1, c2] = palette[(label.length) % palette.length];

  // Respeta la proporción del hueco para que el texto no se recorte con object-fit: cover.
  const [rw, rh] = (img.dataset.ph || '800/600').split('/').map(Number);
  const w = 800, h = Math.round(800 * (rh / rw)) || 600;
  const unit = Math.min(w, h) / 100;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
       <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
         <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
       </linearGradient></defs>
       <rect width='${w}' height='${h}' fill='url(#g)'/>
       <g fill='#ffffff' fill-opacity='.12'>
         <circle cx='${w * .15}' cy='${h * .2}' r='${unit * 12}'/>
         <circle cx='${w * .87}' cy='${h * .8}' r='${unit * 18}'/>
         <rect x='${w * .7}' y='${h * .13}' width='${unit * 22}' height='${unit * 22}'
               transform='rotate(20 ${w * .77} ${h * .22})'/>
       </g>
       <text x='50%' y='45%' fill='#fff' font-family='Arial' font-size='${unit * 9}'
             font-weight='900' text-anchor='middle'>WayBack</text>
       <text x='50%' y='55%' fill='#ffd23f' font-family='Arial' font-size='${unit * 4.4}'
             font-weight='bold' text-anchor='middle'>${label}</text>
       <text x='50%' y='63%' fill='#ffffff' fill-opacity='.72' font-family='Arial'
             font-size='${unit * 3.2}' text-anchor='middle'>Foto pendiente</text>
     </svg>`;
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
window.imgFallback = imgFallback;

document.addEventListener('DOMContentLoaded', () => {
  /* Año */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Pinta los placeholders de fotos pendientes ---- */
  document.querySelectorAll('img[data-ph]').forEach(imgFallback);

  /* ---- Nav scrolled ---- */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 30);
  }, { passive: true });

  /* ---- Menú móvil ---- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---- Reveal ---- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); revealer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealer.observe(el));

  /* ---- Efecto máquina de escribir en "De Regreso al Camino" ---- */
  initTypewriter();

  /* ---- Tilt 3D en tarjetas (solo dispositivos con puntero fino) ---- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(800px) rotateX(${-py * 5}deg) rotateY(${px * 5}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---- Video de fondo del hero ---- */
  initHeroVideo();

  /* ---- Visor de fotos ----
     Antes que los carruseles a propósito: lee las fotos originales, y en
     cuanto initCarrusel corre hay el doble de <figure> en el DOM. */
  initVisor();

  /* ---- Carruseles continuos (videos y galerías de fotos) ---- */
  document.querySelectorAll('.carrusel').forEach(initCarrusel);

  /* ---- YouTube lite-embed ---- */
  document.querySelectorAll('.yt-lite').forEach(card => {
    card.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${card.dataset.id}?autoplay=1&rel=0`;
      iframe.title = card.dataset.title || 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      card.innerHTML = '';
      card.appendChild(iframe);
    });
  });

  /* ---- Formularios que llegan al correo de la banda ---- */
  document.querySelectorAll('form[data-correo]').forEach(prepararFormularioCorreo);
});

/* ===================== Typewriter =====================
   Escribe el texto, hace pausa, lo borra y lo vuelve a escribir en bucle.
   Para cambiar/añadir frases, edita el arreglo `phrases`.
   ====================================================== */
function initTypewriter() {
  const el = document.getElementById('typeLine');
  if (!el) return;
  const caret = document.querySelector('.hero__line .caret');
  const phrases = ['De Regreso al Camino'];

  // Respeta accesibilidad: sin animación, muestra el texto fijo.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = phrases[0];
    if (caret) caret.style.display = 'none';
    return;
  }

  let p = 0, i = 0, deleting = false;
  function tick() {
    const word = phrases[p];
    el.textContent = word.slice(0, i);
    let delay = deleting ? 55 : 110;
    if (!deleting && i === word.length) {
      delay = 1700; deleting = true;            // pausa al terminar de escribir
    } else if (deleting && i === 0) {
      deleting = false; p = (p + 1) % phrases.length; delay = 500; // pausa antes de reescribir
    } else {
      i += deleting ? -1 : 1;
    }
    setTimeout(tick, delay);
  }
  tick();
}

/* ===================== Video de fondo del hero =====================
   Los navegadores prohiben el autoplay CON audio: iOS nunca lo permite sin un
   gesto previo del usuario, y Chrome en Android solo si la persona ya visita
   mucho el dominio. Por eso el video arranca en mudo y un boton visible activa
   el sonido con un toque.

   Se usa la IFrame Player API y no un <iframe> pelado porque hace falta
   des-silenciar desde el click, saber cuando la reproduccion realmente empezo
   (para no adivinar el fundido) y limitar la calidad en moviles.

   Si algo falla —API bloqueada, video no embebible, red lenta— no pasa nada:
   queda el hero estatico de siempre, que es una experiencia completa por si
   sola. El video es una mejora, no un requisito.
   ====================================================================== */
function initHeroVideo() {
  const caja = document.getElementById('heroVideo');
  const boton = document.getElementById('heroSound');
  // YT.Player REEMPLAZA el elemento que recibe por el iframe. Por eso se le
  // pasa un div interno desechable: si le pasaramos `caja`, se llevaria por
  // delante la clase .hero__video y con ella el dimensionado y el fundido —
  // el video sonaria pero no se veria.
  const montaje = document.getElementById('heroVideoMount');
  const hero = document.getElementById('hero');
  if (!caja || !boton || !montaje || !hero) return;

  const id = caja.dataset.videoId;
  if (!id) return;

  // Tres razones para no cargarlo nunca.
  const conexion = navigator.connection || {};
  const lento = /(^|-)2g$/.test(conexion.effectiveType || '');
  if (
    matchMedia('(prefers-reduced-motion: reduce)').matches || // lo pidio el usuario
    conexion.saveData ||                                      // pidio ahorrar datos
    (lento && innerWidth <= 680)                              // 4:18 de video en 2G no
  ) return;

  let reproductor = null;

  // Fuente de verdad del sonido. Arranca en false porque el video se lanza en
  // mudo a proposito. NO se usa isMuted(): la API de YouTube no lo actualiza
  // de forma sincrona, asi que leerlo justo despues de unMute() devuelve el
  // valor anterior y la etiqueta queda desfasada un clic.
  let suena = false;

  cargarApi(() => {
    reproductor = new YT.Player(montaje, {
      videoId: id,
      playerVars: {
        autoplay: 1,
        mute: 1,            // unica forma de que el autoplay sea permitido siempre
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: id,       // YouTube ignora loop en un solo video sin esto
        modestbranding: 1,
        playsinline: 1,     // sin esto iOS se va a pantalla completa y secuestra la pagina
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (e) => {
          if (innerWidth <= 680) e.target.setPlaybackQuality('small');

          // Arranca en mudo a proposito. Intentarlo con sonido hacia que
          // navegadores como Brave o Safari en iOS mostraran un aviso de
          // "contenido bloqueado" al visitante — peor experiencia que
          // simplemente empezar en silencio. El boton queda para activarlo.
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: (e) => {
          // Recien cuando de verdad esta reproduciendo se revela el video,
          // se desvanece la foto y aparece el boton. Antes de eso el hero se
          // ve como siempre.
          if (e.data === YT.PlayerState.PLAYING) {
            caja.classList.add('is-playing');
            hero.classList.add('has-video');
            boton.hidden = false;
            // Se pinta con NUESTRO estado, no consultando al reproductor.
            // Este evento se dispara en cada vuelta del bucle, y consultarlo
            // aqui pisaba la etiqueta correcta que acababa de poner el clic.
            pintarBoton(suena);
          }
        },
        onError: () => {
          caja.classList.remove('is-playing');
          hero.classList.remove('has-video');
          boton.hidden = true;
        },
      },
    });
  });

  // El boton refleja el estado REAL del reproductor, no uno que llevemos por
  // aparte. Asi da igual si el audio arranco solo o si el navegador lo
  // bloqueo: lo que se ve y lo que anuncia el lector de pantalla siempre
  // coinciden con lo que de verdad esta pasando.
  function pintarBoton(estaSonando) {
    // data-suena guarda el ESTADO; la etiqueta y el icono muestran la ACCION
    // contraria, que es lo que pasa si haces clic.
    boton.dataset.suena = String(estaSonando);
    const txt = boton.querySelector('.hero__sound-txt');
    if (txt) txt.textContent = estaSonando ? boton.dataset.silenciar : boton.dataset.activar;
  }

  boton.addEventListener('click', () => {
    if (!reproductor || typeof reproductor.mute !== 'function') return;
    suena = !suena;                 // nuestra variable manda, no isMuted()
    if (suena) {
      reproductor.unMute();
      reproductor.setVolume(70);
    } else {
      reproductor.mute();
    }
    pintarBoton(suena);
  });
}

/* Carga la IFrame API una sola vez y avisa cuando este lista. */
function cargarApi(cuandoEsteLista) {
  if (window.YT && window.YT.Player) { cuandoEsteLista(); return; }

  const previo = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof previo === 'function') previo();
    cuandoEsteLista();
  };

  if (document.querySelector('script[data-yt-api]')) return; // ya se esta cargando
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.async = true;
  s.dataset.ytApi = '1';
  document.head.appendChild(s);
}

/* ===================== Carrusel continuo =====================
   Duplica las tarjetas para que el bucle no tenga costura: la animacion
   recorre el 50% del ancho de la pista, asi que al terminar la copia queda
   exactamente donde estaba el original y el reinicio no se ve.

   La copia lleva aria-hidden porque para un lector de pantalla los videos
   estan una sola vez; verlos repetidos seria ruido.
   ====================================================================== */
function initCarrusel(carrusel) {
  const pista = carrusel.querySelector('.carrusel__pista');
  if (!pista || !pista.children.length) return;

  // Sin movimiento no hace falta duplicar nada: se deja deslizable a mano.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // La animacion recorre el 50% del ancho, que es un PORCENTAJE: con una
  // duracion fija, una galeria de 12 fotos avanzaria al triple de velocidad
  // que una de 4. Se mide la pista antes de duplicarla y se traduce a
  // segundos a ritmo constante, asi que da igual cuantas fotos cargue el
  // cliente desde el panel: todas se desplazan igual de rapido.
  const PIXELES_POR_SEGUNDO = 65;
  const recorrido = pista.scrollWidth;
  if (recorrido) pista.style.animationDuration = `${Math.round(recorrido / PIXELES_POR_SEGUNDO)}s`;

  const copia = pista.cloneNode(true);
  copia.querySelectorAll('.yt-lite, figure').forEach(c => {
    c.setAttribute('aria-hidden', 'true');
    // Fuera del recorrido de tabulacion: son los mismos videos, no otros.
    c.querySelectorAll('button').forEach(b => b.tabIndex = -1);
    // Sin esto las copias son INVISIBLES: .reveal arranca en opacity 0 y solo
    // se revela cuando el IntersectionObserver la ve, pero ese observador ya
    // corrio antes de que existieran estas copias. Se veia un vacio del ancho
    // exacto de los seis videos duplicados.
    c.classList.remove('reveal');
    c.classList.add('is-visible');
  });
  while (copia.firstChild) pista.appendChild(copia.firstChild);
  carrusel.classList.add('is-duplicado');

  // Al abrir un video el carrusel se detiene: dejarlo deslizando mientras
  // algo se reproduce no tiene defensa posible. Solo aplica a los videos: en
  // las galerias de fotos el clic abre el visor, que ya detiene y reanuda por
  // su cuenta. Sin esta comprobacion, ver una foto dejaba el carrusel parado
  // para siempre.
  pista.addEventListener('click', (e) => {
    if (e.target.closest('.yt-lite')) carrusel.classList.add('is-paused');
  });
}

/* ===================== Visor de fotos =====================
   El cliente pidio que las galerias siguieran girando solas pero que ademas
   se pudiera abrir una foto en grande y avanzar a mano.

   Las listas se arman UNA vez, al arrancar, leyendo el DOM antes de que
   initCarrusel duplique las tarjetas. Cada boton lleva su indice en
   data-indice, asi que una copia abre exactamente la misma foto que el
   original sin que el visor tenga que saber que existen copias.

   El merch guarda sus dos vistas en un <template>: la de espalda no se pinta
   en la tarjeta, existe solo para que el visor tenga a donde avanzar. Al
   estar en un template el navegador no la descarga hasta que se abre.
   ====================================================================== */
function initVisor() {
  const visor = document.getElementById('visor');
  const img = document.getElementById('visorImg');
  const pie = document.getElementById('visorPie');
  if (!visor || !img || !pie) return;

  const grupos = new Map();
  document.querySelectorAll('[data-galeria]').forEach((caja) => {
    const plantilla = caja.querySelector('template[data-vistas]');
    const fuente = plantilla
      ? plantilla.content.querySelectorAll('img')
      : caja.querySelectorAll('figure img');
    grupos.set(caja.dataset.galeria, [...fuente].map((el) => ({
      src: el.getAttribute('src'),
      alt: el.alt,
      etiqueta: el.dataset.etiqueta || '',
    })));
  });
  if (!grupos.size) return;

  let lista = [];
  let indice = 0;
  let focoPrevio = null;

  function pintar() {
    const foto = lista[indice];
    img.src = foto.src;
    img.alt = foto.alt;
    const cuenta = lista.length > 1 ? `${indice + 1} de ${lista.length}` : '';
    pie.textContent = [foto.etiqueta, cuenta].filter(Boolean).join(' · ');
  }

  function paso(n) {
    indice = (indice + n + lista.length) % lista.length;
    pintar();
  }

  function abrir(galeria, desde) {
    const fotos = grupos.get(galeria);
    if (!fotos || !fotos.length) return;
    lista = fotos;
    indice = Math.min(Math.max(desde, 0), fotos.length - 1);
    focoPrevio = document.activeElement;
    visor.dataset.soloUna = String(fotos.length < 2);
    visor.hidden = false;
    // Sin esto la pagina de atras se sigue desplazando bajo el visor.
    document.body.style.overflow = 'hidden';
    document.querySelectorAll('.carrusel').forEach(c => c.classList.add('is-visor'));
    pintar();
    visor.querySelector('.visor__cerrar').focus();
  }

  function cerrar() {
    visor.hidden = true;
    img.removeAttribute('src');
    document.body.style.overflow = '';
    document.querySelectorAll('.carrusel').forEach(c => c.classList.remove('is-visor'));
    // Devuelve el foco a la foto desde la que se abrio: quien navega con
    // teclado se quedaria al principio de la pagina si no.
    if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus();
  }

  // Se resuelve al APOYAR el dedo y se abre al soltar, en vez de escuchar
  // `click` a secas.
  //
  // El carrusel no se detiene al tocarlo en un telefono: no hay hover. Entre
  // que el dedo baja y sube, la foto ya se movio, asi que el elemento bajo el
  // dedo al soltar es otro. Ante eso el navegador dispara el click sobre el
  // ancestro comun de ambos —la pista, no el boton—, y `closest('.foto-zoom')`
  // devolvia null: tocar una foto no hacia absolutamente nada. En el
  // escritorio no se notaba porque el hover congela la pista antes del clic.
  //
  // Guardar el boton al apoyar lo vuelve inmune al movimiento. La distancia
  // recorrida separa ademas el toque del arrastre: quien desliza el carrusel
  // con el dedo no queria abrir una foto.
  //
  // Delegado en el documento porque las copias del carrusel nacen despues.
  const TOLERANCIA_TOQUE = 12; // px
  let candidato = null;

  document.addEventListener('pointerdown', (e) => {
    const boton = e.target.closest('.foto-zoom');
    candidato = boton ? { boton, x: e.clientX, y: e.clientY } : null;
  });

  document.addEventListener('pointercancel', () => { candidato = null; });

  document.addEventListener('pointerup', (e) => {
    if (!candidato) return;
    const { boton, x, y } = candidato;
    candidato = null;
    if (Math.hypot(e.clientX - x, e.clientY - y) > TOLERANCIA_TOQUE) return;
    const caja = boton.closest('[data-galeria]');
    if (caja) abrir(caja.dataset.galeria, Number(boton.dataset.indice) || 0);
  });

  // Enter o Espacio sobre el boton: el navegador dispara `click` sin que haya
  // pasado ningun puntero, y ahi `detail` vale 0. Los toques y clics reales
  // traen detail >= 1, asi que esto no los duplica.
  document.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const boton = e.target.closest('.foto-zoom');
    if (!boton) return;
    const caja = boton.closest('[data-galeria]');
    if (caja) abrir(caja.dataset.galeria, Number(boton.dataset.indice) || 0);
  });

  visor.querySelectorAll('[data-visor]').forEach((boton) => {
    boton.addEventListener('click', () => {
      if (boton.dataset.visor === 'cerrar') cerrar();
      else paso(Number(boton.dataset.visor));
    });
  });

  // Tocar el fondo cierra; tocar la foto o los botones, no.
  visor.addEventListener('click', (e) => { if (e.target === visor) cerrar(); });

  document.addEventListener('keydown', (e) => {
    if (visor.hidden) return;
    if (e.key === 'Escape') cerrar();
    else if (e.key === 'ArrowRight') paso(1);
    else if (e.key === 'ArrowLeft') paso(-1);
  });

  // Deslizar con el dedo: en el telefono es el gesto que la gente prueba
  // primero, antes de buscar la flecha.
  let inicioX = null;
  visor.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', (e) => {
    if (inicioX === null) return;
    const recorrido = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(recorrido) > 55) paso(recorrido < 0 ? 1 : -1);
    inicioX = null;
  }, { passive: true });
}

/* ===================== Formularios por correo =====================
   El cliente pidio que los formularios lleguen a waybackmusichn@gmail.com. Un
   sitio estatico no puede enviar correo por si solo, asi que FormSubmit hace
   de intermediario. Se eligio porque no exige cuenta ni clave: la direccion
   va en el `action` y se activa confirmando una vez desde la bandeja.

   El <form> ya es un POST valido sin JavaScript. Esto solo lo intercepta para
   enviarlo en segundo plano y responder ahi mismo, sin sacar a nadie del
   sitio ni perder lo que escribio.

   Si el envio falla se dice y se ofrece la direccion: es mejor que un
   "Gracias" que no significa nada — que es justo lo que hacia la version
   original de esta pagina.
   ====================================================================== */
function prepararFormularioCorreo(form) {
  const correo = form.dataset.correo;
  if (!correo) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // La validacion nativa del navegador ya marca los campos faltantes.
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const boton = form.querySelector('button[type="submit"]');
    const etiqueta = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Enviando…';

    try {
      const respuesta = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(correo)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      avisar(form, form.dataset.gracias || '¡Gracias! Recibimos tu mensaje.', true);
      form.reset();
    } catch {
      avisar(form, `No pudimos enviar el mensaje. Escríbenos a ${correo}.`, false);
    } finally {
      boton.disabled = false;
      boton.textContent = etiqueta;
    }
  });
}

/* Muestra la respuesta dentro del propio formulario. role="status" hace que
   un lector de pantalla la anuncie: sin eso el envio seria silencioso para
   quien no ve el cambio de color. */
function avisar(form, texto, bien) {
  let aviso = form.querySelector('.form__success');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.className = 'form__success';
    aviso.setAttribute('role', 'status');
    form.appendChild(aviso);
  }
  aviso.classList.toggle('form__success--error', !bien);
  aviso.textContent = texto;
}
