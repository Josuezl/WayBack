/* =========================================================
   WayBack · Diseño 3 — "Honduras Vibrante" · script.js
   ========================================================= */

/* ---- Placeholder de imágenes (estilo vibrante) ----
   Se usa en dos casos:
   1. <img data-ph="640/360"> → foto pendiente de entregar por el cliente.
   2. onerror de una imagen real que no cargó.
   Al reemplazar un placeholder por la foto definitiva, borra el data-ph. */
function imgFallback(img) {
  img.onerror = null;
  const label = (img.alt || 'WayBack').slice(0, 40);
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
