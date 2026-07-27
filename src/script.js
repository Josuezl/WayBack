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

  /* ---- Carrusel continuo de videos ---- */
  initCarrusel();

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

  /* ---- Formularios ---- */
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const ok = form.querySelector('[data-success]');
      if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      form.reset();
      setTimeout(() => { if (ok) ok.hidden = true; }, 6000);
    });
  });
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
            sincronizarBoton();
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
  function sincronizarBoton() {
    if (!reproductor || typeof reproductor.isMuted !== 'function') return;
    const suena = !reproductor.isMuted();
    // data-suena guarda el ESTADO; la etiqueta y el icono muestran la ACCION
    // contraria, que es lo que pasa si haces clic.
    boton.dataset.suena = String(suena);
    const txt = boton.querySelector('.hero__sound-txt');
    if (txt) txt.textContent = suena ? boton.dataset.silenciar : boton.dataset.activar;
  }

  boton.addEventListener('click', () => {
    if (!reproductor || typeof reproductor.isMuted !== 'function') return;
    if (reproductor.isMuted()) {
      reproductor.unMute();
      reproductor.setVolume(70);
    } else {
      reproductor.mute();
    }
    sincronizarBoton();
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
function initCarrusel() {
  const carrusel = document.getElementById('carruselMusica');
  if (!carrusel) return;

  const pista = carrusel.querySelector('.carrusel__pista');
  if (!pista || !pista.children.length) return;

  // Sin movimiento no hace falta duplicar nada: se deja deslizable a mano.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const copia = pista.cloneNode(true);
  copia.querySelectorAll('.yt-lite').forEach(c => {
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
  // algo se reproduce no tiene defensa posible.
  pista.addEventListener('click', () => carrusel.classList.add('is-paused'));
}
