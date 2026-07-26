# WayBack Eleventy Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the hand-written `index.html` into an Eleventy site whose content lives in JSON data files, without changing a single rendered pixel.

**Architecture:** Eleventy reads `src/index.njk` and ten JSON files in `src/_data/`, and writes `_site/index.html`. `styles.css`, `script.js` and `assets/` pass through untouched. Correctness is proven by diffing the generated HTML against a snapshot of the current production HTML — the diff must be empty.

**Tech Stack:** Eleventy 3.x, Nunjucks templates, plain JSON data. No other dependencies.

## Global Constraints

- **Node is installed via nvm but is not on the PATH in non-interactive shells.** nvm is a shell function sourced from an interactive profile, so `node` and `npm` appear missing to any tooling that shells out. Every task must export the PATH first:

  ```bash
  export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"
  ```

  Available versions are v22.23.1 and v24.15.0; the plan uses v22.23.1, which satisfies Eleventy 3.x's Node 18+ floor. Without this line, `npm` fails with `env: node: No such file or directory` — a PATH problem, not a missing install. Do not install Node.
- **No visual, layout, copy, or behavioural change.** Any rendered difference is a defect.
- **`styles.css` and `script.js` are never edited.** They move verbatim and are verified by checksum.
- **No dependency other than `@11ty/eleventy`.** The verification harness is written in plain Node.
- **Known-bad values are carried over unchanged**, per the spec: the footer YouTube link that 404s, the hero "Ver video" button, and the four placeholder video IDs (`VIDEO_LIBRE`, `VIDEO_SALVADOR`, `VIDEO_LIBRO`, `FqAj3bXxmG`). Fixing them here would pollute the diff. They are Phase 2 work.
- **Spanish is the content language.** Data keys are Spanish to match the copy they hold; commit messages are English per the repo convention.
- Commit after every task.

---

## File Structure

| File | Responsibility |
|---|---|
| `eleventy.config.js` | Input/output dirs, passthrough copy rules |
| `package.json` | Eleventy dependency, `dev` / `build` / `verify` scripts |
| `tools/verify-html.mjs` | Normalizes and diffs generated HTML against the reference |
| `reference/index.html` | Frozen snapshot of today's production HTML. Never edited after Task 1 |
| `src/index.njk` | The page template. Starts as a verbatim copy, loses literals task by task |
| `src/_data/*.json` | Ten content files, one per section |
| `src/styles.css`, `src/script.js`, `src/assets/` | Moved verbatim from repo root |

`reference/index.html` is the fixture the whole plan leans on. It is committed so the diff is reproducible on any machine and in CI.

---

### Task 1: Eleventy scaffold and verification harness

Builds the pipeline and the test that guards every later task. At the end of this task `src/index.njk` is still a literal copy of the page with no variables, so the diff must pass trivially. If it does not pass here, nothing later can be trusted.

**Files:**
- Create: `package.json`, `eleventy.config.js`, `tools/verify-html.mjs`, `reference/index.html`
- Create (by moving): `src/index.njk`, `src/styles.css`, `src/script.js`, `src/assets/wayback-banda.jpeg`
- Modify: `.gitignore`
- Delete: `index.html`, `styles.css`, `script.js`, `assets/` at repo root

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run build` writes `_site/`. `npm run verify` exits 0 when `_site/index.html` matches `reference/index.html` after whitespace normalization, and exits 1 with the first differing line otherwise. Every later task calls `npm run verify`.

- [ ] **Step 1: Put Node on the PATH and confirm it runs**

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"
node --version   # expected: v22.23.1
npm --version    # expected: 10.9.8
```

Node is already installed via nvm. If these fail, it is a PATH problem — do not install Node. Re-export the line above; it must be re-exported in every shell, including in every later task.

- [ ] **Step 2: Freeze the reference snapshot**

This must happen before any file moves, while `index.html` is still the exact file serving in production.

```bash
mkdir -p reference
cp index.html reference/index.html
```

- [ ] **Step 3: Write the verification harness**

Create `tools/verify-html.mjs`:

```js
// Compara el HTML generado contra la referencia congelada.
// Normaliza solo espacios insignificantes: recorta cada linea y descarta las
// vacias. Cualquier diferencia de contenido, atributos u orden sobrevive.
import { readFileSync } from 'node:fs';

function normalize(html) {
  return html
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

const [refPath, outPath] = process.argv.slice(2);
const refLines = normalize(readFileSync(refPath, 'utf8')).split('\n');
const outLines = normalize(readFileSync(outPath, 'utf8')).split('\n');

let firstDiff = -1;
const max = Math.max(refLines.length, outLines.length);
for (let i = 0; i < max; i += 1) {
  if (refLines[i] !== outLines[i]) {
    firstDiff = i;
    break;
  }
}

if (firstDiff === -1) {
  console.log(`OK: ${outLines.length} lineas identicas a la referencia`);
  process.exit(0);
}

console.error(`DIFERENCIA en la linea normalizada ${firstDiff + 1}`);
console.error(`  referencia: ${refLines[firstDiff] ?? '(no existe)'}`);
console.error(`  generado:   ${outLines[firstDiff] ?? '(no existe)'}`);
console.error(
  `\nTotal de lineas: referencia ${refLines.length}, generado ${outLines.length}`
);
process.exit(1);
```

- [ ] **Step 4: Run the harness to verify it fails**

```bash
node tools/verify-html.mjs reference/index.html _site/index.html
```

Expected: FAIL with `ENOENT` on `_site/index.html`, because nothing is built yet. This confirms the harness actually reads the build output rather than passing vacuously.

- [ ] **Step 5: Create package.json**

```json
{
  "name": "wayback",
  "version": "1.0.0",
  "private": true,
  "description": "Sitio web de WayBack - De Regreso al Camino",
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy",
    "verify": "node tools/verify-html.mjs reference/index.html _site/index.html"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  }
}
```

- [ ] **Step 6: Create eleventy.config.js**

Do not add `"type": "module"` to `package.json`; this config is CommonJS.

```js
module.exports = function (eleventyConfig) {
  // Estos tres se copian tal cual, sin que Eleventy los procese.
  eleventyConfig.addPassthroughCopy({ 'src/styles.css': 'styles.css' });
  eleventyConfig.addPassthroughCopy({ 'src/script.js': 'script.js' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  return {
    dir: { input: 'src', output: '_site', data: '_data' },
    htmlTemplateEngine: 'njk',
  };
};
```

- [ ] **Step 7: Move the site files into src/**

`index.html` becomes `index.njk` unchanged — Nunjucks passes through plain HTML that contains no template syntax.

```bash
mkdir -p src
git mv index.html src/index.njk
git mv styles.css src/styles.css
git mv script.js src/script.js
git mv assets src/assets
```

- [ ] **Step 8: Ignore the build output**

Append to `.gitignore`:

```
# Salida del build
_site/
```

- [ ] **Step 9: Install and build**

```bash
npm install
npm run build
```

Expected: Eleventy reports writing `_site/index.html` plus three passthrough copies.

- [ ] **Step 10: Run the verification — it must now pass**

```bash
npm run verify
```

Expected: `OK: <n> lineas identicas a la referencia`

If it fails, the cause is Nunjucks reacting to something in the HTML. The likely culprit is a literal `{{` or `{%` sequence. There is none in this page, but check before changing the template.

- [ ] **Step 11: Verify the passthrough assets are byte-identical**

```bash
shasum -a 256 src/styles.css _site/styles.css
shasum -a 256 src/script.js _site/script.js
shasum -a 256 src/assets/wayback-banda.jpeg _site/assets/wayback-banda.jpeg
```

Expected: each pair prints the same hash.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "build: add eleventy scaffold and html diff harness"
```

---

### Task 2: Extract page metadata and navigation

**Files:**
- Create: `src/_data/site.json`
- Modify: `src/index.njk` (head block and `<header class="nav">`)

**Interfaces:**
- Consumes: the harness from Task 1.
- Produces: global `site` with keys `lang`, `titulo`, `descripcion`, `themeColor`, `og` (`type`, `locale`, `siteName`, `titulo`, `descripcion`), `marca`, and `nav` (array of `{ href, texto }`).

- [ ] **Step 1: Create src/_data/site.json**

```json
{
  "lang": "es",
  "titulo": "WayBack – De Regreso al Camino | Electro-Pop Cristiano 🇭🇳",
  "descripcion": "WayBack (De Regreso al Camino): banda hondureña de Electro-Pop Cristiano. Honduras es tierra de adoración.",
  "themeColor": "#0a47a8",
  "og": {
    "type": "website",
    "locale": "es_HN",
    "siteName": "WayBack",
    "titulo": "WayBack – De Regreso al Camino",
    "descripcion": "Banda Hondureña de Electro-Pop Cristiano"
  },
  "marca": "WayBack",
  "nav": [
    { "href": "#sobre", "texto": "Sobre" },
    { "href": "#musica", "texto": "Música" },
    { "href": "#eventos", "texto": "Eventos" },
    { "href": "#merch", "texto": "Merch" },
    { "href": "#honduras-adora", "texto": "Honduras Adora" },
    { "href": "#invitaciones", "texto": "Invitaciones" },
    { "href": "#recursos", "texto": "Recursos" },
    { "href": "#mahanaim", "texto": "Mahanaim" }
  ]
}
```

- [ ] **Step 2: Replace the literals in src/index.njk**

Replace `<html lang="es">` with `<html lang="{{ site.lang }}">`.

Replace the title and the two description/theme meta tags:

```njk
  <title>{{ site.titulo }}</title>
  <meta name="description" content="{{ site.descripcion }}" />
  <meta name="theme-color" content="{{ site.themeColor }}" />
```

Replace the five active Open Graph tags. Leave the HTML comment block and the two commented-out `og:url` / `og:image` lines exactly as they are — they are inert text and must survive the diff:

```njk
  <meta property="og:type" content="{{ site.og.type }}" />
  <meta property="og:locale" content="{{ site.og.locale }}" />
  <meta property="og:site_name" content="{{ site.og.siteName }}" />
  <meta property="og:title" content="{{ site.og.titulo }}" />
  <meta property="og:description" content="{{ site.og.descripcion }}" />
```

Replace the nav links. The loop must emit one `<a>` per line at six spaces of indentation to match the reference:

```njk
    <a href="#hero" class="brand"><span class="brand__mark">W</span> {{ site.marca }}</a>
    <nav class="nav__links" id="navLinks" aria-label="Navegación principal">
      {%- for enlace in site.nav %}
      <a href="{{ enlace.href }}">{{ enlace.texto }}</a>
      {%- endfor %}
    </nav>
```

The `{%-` whitespace-control markers matter. Without them Nunjucks leaves blank lines where the tags were; the harness drops blank lines, so this is belt and braces rather than strictly required.

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run verify
```

Expected: PASS.

If it fails on the title line, the cause is Nunjucks HTML-escaping the `–` en dash or the flag emoji. Neither is escaped by Nunjucks, so a failure here means the JSON string does not match the original character-for-character. Compare with `grep -n "<title>" reference/index.html`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extract page metadata and nav into site data"
```

---

### Task 3: Extract hero and Sobre Nosotros

**Files:**
- Create: `src/_data/hero.json`, `src/_data/sobre.json`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: Task 1 harness.
- Produces: global `hero` with `titulo`, `frases` (array), `subtitulo`, `acciones` (array of `{ clase, href, texto, externo }`), `foto` (`src`, `alt`, `caption`); global `sobre` with `num`, `titulo`, `parrafos` (array, first one renders with class `lead`).

- [ ] **Step 1: Create src/_data/hero.json**

`frases` is an array because `initTypewriter()` in `script.js` already cycles through a list. The "Ver video" button keeps its broken URL — see Global Constraints.

```json
{
  "titulo": "WayBack",
  "frases": ["De Regreso al Camino"],
  "subtitulo": "Banda Hondureña de Electro-Pop Cristiano",
  "acciones": [
    { "clase": "btn--red", "href": "#sobre", "texto": "Explorar ↓", "externo": false },
    { "clase": "btn--white", "href": "https://youtube.com/waybackoficial", "texto": "▶ Ver video", "externo": true }
  ],
  "foto": {
    "src": "assets/wayback-banda.jpeg",
    "alt": "Integrantes de WayBack",
    "caption": "WayBack · Honduras"
  }
}
```

- [ ] **Step 2: Create src/_data/sobre.json**

```json
{
  "num": "01",
  "titulo": "Sobre Nosotros",
  "parrafos": [
    "WayBack (en español \"De Regreso al Camino\"), es un ministerio musical hondureño conformado por jóvenes hondureños, unidos con el mismo sentir de producir y hacer música que le de exaltación al Señor Jesucristo, y que aquellos que se han alejado del camino de Dios, puedan regresar y ser restaurados por Él.",
    "Musicalmente, es una banda de Pop-Electrónico/Alternativo, combinando sonidos modernos y digitales con instrumentación en vivo, letras Bíblicas y melodías congregacionales, buscando producir canciones cristocéntricas y que conecten con la presencia de Dios.",
    "Además, WayBack es el organizador y anfitrión del festival de adoración \"Honduras Adora\", que reúne a ministros de diferentes países, con la visión de interceder por la nación y declarar, que Honduras es tierra de adoración."
  ]
}
```

**The straight quotes around "De Regreso al Camino" and "Honduras Adora" are literal `"` characters in the source HTML, escaped here as `\"` because JSON requires it.** Do not substitute typographic quotes; that would change the rendered output.

- [ ] **Step 3: Replace the hero markup in src/index.njk**

The `aria-label` on `.hero__line` duplicates the first typewriter phrase:

```njk
        <div class="hero__content">
          <h1 class="hero__title reveal">{{ hero.titulo }}</h1>
          <p class="hero__line reveal" aria-label="{{ hero.frases[0] }}"><span id="typeLine" class="type"></span><span class="caret" aria-hidden="true"></span></p>
          <p class="hero__subtitle reveal">{{ hero.subtitulo }}</p>
          <div class="hero__actions reveal">
            {%- for accion in hero.acciones %}
            <a class="btn {{ accion.clase }}" href="{{ accion.href }}"{% if accion.externo %} target="_blank" rel="noopener"{% endif %}>{{ accion.texto }}</a>
            {%- endfor %}
          </div>
        </div>

        <figure class="hero__photo reveal">
          <div class="hero__photo-frame">
            <img src="{{ hero.foto.src }}" alt="{{ hero.foto.alt }}" />
          </div>
          <figcaption>{{ hero.foto.caption }}</figcaption>
        </figure>
```

- [ ] **Step 4: Replace the Sobre markup**

The first paragraph carries `class="lead"` and the rest do not, so the loop branches on index:

```njk
        <div class="card card--blue tilt reveal">
          <span class="card__num">{{ sobre.num }}</span>
          <h2 class="card__title">{{ sobre.titulo }}</h2>
          {%- for parrafo in sobre.parrafos %}
          {% if loop.first %}<p class="lead">{{ parrafo }}</p>{% else %}<p>{{ parrafo }}</p>{% endif %}
          {%- endfor %}
        </div>
```

- [ ] **Step 5: Build and verify**

```bash
npm run build && npm run verify
```

Expected: PASS.

A failure on a Sobre paragraph almost certainly means a smart quote crept into the JSON. Check with `grep -n 'De Regreso al Camino' reference/index.html`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: extract hero and about section into data files"
```

---

### Task 4: Extract the Música section

The video card markup defined here is reused verbatim by Mahanaim in Task 7, so the shapes must match.

**Files:**
- Create: `src/_data/musica.json`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: Task 1 harness.
- Produces: global `musica` with `num`, `titulo`, `proximos` (`titulo` plus `items` array of strings), `recientes` (`titulo` plus `items` array of `{ titulo, nota }`, all three of which have a `nota`), `videos` (array of `{ id, titulo, ph, alt, caption }`), and `spotifyArtistId`.

- [ ] **Step 1: Create src/_data/musica.json**

The three video `id` values are placeholders and stay that way in this phase.

```json
{
  "num": "02",
  "titulo": "La Música",
  "proximos": {
    "titulo": "Próximos lanzamientos",
    "items": ["Medley Hay Libertad", "ENCUENTRO", "No Dejaré de Alabarte", "Atmósfera Celestial"]
  },
  "recientes": {
    "titulo": "Lanzamientos recientes",
    "items": [
      { "titulo": "Libre en Tu Presencia", "nota": "feat. Bani Muñoz · En Vivo desde Honduras Adora 2025" },
      { "titulo": "Eres Mi Salvador", "nota": "En Vivo" },
      { "titulo": "El Libro de la Vida", "nota": "En Vivo" }
    ]
  },
  "videos": [
    { "id": "VIDEO_LIBRE", "titulo": "Libre en Tu Presencia", "ph": "640/360", "alt": "Libre en Tu Presencia", "caption": "Libre en Tu Presencia · feat. Bani Muñoz" },
    { "id": "VIDEO_SALVADOR", "titulo": "Eres Mi Salvador", "ph": "640/360", "alt": "Eres Mi Salvador", "caption": "Eres Mi Salvador · En Vivo" },
    { "id": "VIDEO_LIBRO", "titulo": "El Libro de la Vida", "ph": "640/360", "alt": "El Libro de la Vida", "caption": "El Libro de la Vida · En Vivo" }
  ],
  "spotifyArtistId": "15S8x4SA16werdAc7KkJMd"
}
```

- [ ] **Step 2: Add the transparent-pixel constant to src/index.njk**

Every placeholder image shares one 1x1 transparent GIF. Define it once at the very top of the file, above `<!DOCTYPE html>`, so Tasks 5, 6 and 7 can reuse it. The `{%- ... -%}` markers strip the line entirely so no stray blank line reaches the output:

```njk
{%- set pixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" -%}
```

- [ ] **Step 3: Replace the Música markup**

```njk
        <header class="section__title reveal"><span class="badge-num">{{ musica.num }}</span><h2>{{ musica.titulo }}</h2></header>

        <div class="split">
          <div class="card card--purple tilt reveal">
            <h3>{{ musica.proximos.titulo }}</h3>
            <ul class="ticks">
              {%- for item in musica.proximos.items %}
              <li>{{ item }}</li>
              {%- endfor %}
            </ul>
          </div>
          <div class="card card--red tilt reveal">
            <h3>{{ musica.recientes.titulo }}</h3>
            <ul class="ticks">
              {%- for item in musica.recientes.items %}
              <li>{{ item.titulo }} <em>{{ item.nota }}</em></li>
              {%- endfor %}
            </ul>
          </div>
        </div>

        <div class="music-grid">
          {%- for video in musica.videos %}
          <article class="yt-lite reveal" data-id="{{ video.id }}" data-title="{{ video.titulo }}">
            <img src="{{ pixel }}" data-ph="{{ video.ph }}" alt="{{ video.alt }}" />
            <button class="yt-lite__play" aria-label="Reproducir">▶</button>
            <span class="yt-lite__cap">{{ video.caption }}</span>
          </article>
          {%- endfor %}
        </div>

        <div class="spotify reveal">
          <iframe title="WayBack en Spotify" style="border-radius:16px" src="https://open.spotify.com/embed/artist/{{ musica.spotifyArtistId }}?utm_source=generator" width="100%" height="352" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
```

- [ ] **Step 4: Build and verify**

```bash
npm run build && npm run verify
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: extract music section into data file"
```

---

### Task 5: Extract Eventos and Merch

**Files:**
- Create: `src/_data/eventos.json`, `src/_data/merch.json`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `pixel` from Task 4.
- Produces: global `eventos` with `num`, `titulo`, `items` (array of `{ fechaPrincipal, fechaSecundaria, titulo, lugar, etiqueta, destacado }`); global `merch` with `num`, `titulo`, `productos` (array of `{ ph, alt, titulo, subtitulo }`), `cta` (`textoAntes`, `telefono`, `textoDespues`, `whatsappUrl`, `boton`).

- [ ] **Step 1: Create src/_data/eventos.json**

`destacado` drives both the `event-card--soon` modifier and the solid pill. The first card's date block holds a year and a phrase rather than a day and a month, which is why the fields are named generically.

```json
{
  "num": "03",
  "titulo": "Eventos",
  "items": [
    { "fechaPrincipal": "2026", "fechaSecundaria": "Por confirmar", "titulo": "Honduras Adora 2026", "lugar": "Festival de adoración · Honduras", "etiqueta": "Próximamente", "destacado": true },
    { "fechaPrincipal": "15", "fechaSecundaria": "AGO 2026", "titulo": "Noche de Adoración", "lugar": "Tegucigalpa, Honduras", "etiqueta": "Concierto", "destacado": false },
    { "fechaPrincipal": "27", "fechaSecundaria": "SEP 2026", "titulo": "WayBack en Vivo", "lugar": "San Pedro Sula, Honduras", "etiqueta": "Concierto", "destacado": false }
  ]
}
```

- [ ] **Step 2: Create src/_data/merch.json**

The CTA sentence is split around the phone number because the number sits inside `<strong>`.

```json
{
  "num": "04",
  "titulo": "Merch",
  "productos": [
    { "ph": "600/600", "alt": "Hoodie WayBack", "titulo": "Hoodie \"De Regreso\"", "subtitulo": "Edición limitada" },
    { "ph": "600/600", "alt": "Camiseta WayBack", "titulo": "Camiseta Catracha", "subtitulo": "Algodón premium" },
    { "ph": "600/600", "alt": "Gorra WayBack", "titulo": "Gorra Bordada", "subtitulo": "Logo WayBack" },
    { "ph": "600/600", "alt": "Tote bag WayBack", "titulo": "Tote Bag", "subtitulo": "Honduras Adora" }
  ],
  "cta": {
    "textoAntes": "Adquiérela vía WhatsApp: ",
    "telefono": "9623-6221",
    "textoDespues": ". No tenemos tienda en línea por el momento.",
    "whatsappUrl": "https://wa.me/50496236221",
    "boton": "Comprar por WhatsApp"
  }
}
```

- [ ] **Step 3: Replace the Eventos markup**

```njk
        <header class="section__title reveal"><span class="badge-num">{{ eventos.num }}</span><h2>{{ eventos.titulo }}</h2></header>
        <div class="events">
          {%- for evento in eventos.items %}
          <article class="event-card{% if evento.destacado %} event-card--soon{% endif %} tilt reveal">
            <div class="event-card__date"><strong>{{ evento.fechaPrincipal }}</strong><span>{{ evento.fechaSecundaria }}</span></div>
            <h3>{{ evento.titulo }}</h3>
            <p>{{ evento.lugar }}</p>
            <span class="pill{% if not evento.destacado %} pill--ghost{% endif %}">{{ evento.etiqueta }}</span>
          </article>
          {%- endfor %}
        </div>
```

- [ ] **Step 4: Replace the Merch markup**

The inline WhatsApp `<svg>` is presentation, not content, so it stays literal in the template. Copy the existing `<svg>` element across unchanged — do not retype its path data.

```njk
        <header class="section__title reveal"><span class="badge-num">{{ merch.num }}</span><h2>{{ merch.titulo }}</h2></header>
        <div class="merch-grid">
          {%- for producto in merch.productos %}
          <figure class="merch-card tilt reveal"><img src="{{ pixel }}" data-ph="{{ producto.ph }}" alt="{{ producto.alt }}" /><figcaption><strong>{{ producto.titulo }}</strong><span>{{ producto.subtitulo }}</span></figcaption></figure>
          {%- endfor %}
        </div>
        <div class="card card--white merch-cta reveal">
          <p>{{ merch.cta.textoAntes }}<strong>{{ merch.cta.telefono }}</strong>{{ merch.cta.textoDespues }}</p>
          <a class="btn btn--green" href="{{ merch.cta.whatsappUrl }}" target="_blank" rel="noopener">
```

Leave the `<svg>` line untouched, then:

```njk
            {{ merch.cta.boton }}
          </a>
        </div>
```

- [ ] **Step 5: Build and verify**

```bash
npm run build && npm run verify
```

Expected: PASS.

If the merch CTA line differs, check that `textoAntes` keeps its trailing space and `textoDespues` keeps its leading period. Those two characters live in the data, not the template.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: extract events and merch into data files"
```

---

### Task 6: Extract Honduras Adora and Recursos

**Files:**
- Create: `src/_data/hondurasAdora.json`, `src/_data/recursos.json`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `pixel` from Task 4.
- Produces: global `hondurasAdora` with `num`, `titulo`, `lead`, `aviso` (`textoAntes`, `dominio`, `textoDespues`), `galeria` (array of `{ ph, alt, caption }`), `cta` (`anio`, `texto`, `boton`, `href`); global `recursos` with `num`, `titulo`, `descripcion`, `tarjetas` (array of `{ clase, icono, titulo, descripcion }`), `subtituloGaleria`, `galeria` (array of `{ ph, alt }`).

- [ ] **Step 1: Create src/_data/hondurasAdora.json**

**Critical:** in the third gallery entry the `alt` attribute contains a bare `&` while the `figcaption` contains `&amp;`. They are stored as two separate fields, and the template renders `alt` with the `| safe` filter so Nunjucks does not escape it into `&amp;`. Both forms parse identically in HTML, but reproducing the original exactly is what keeps the diff empty.

```json
{
  "num": "05",
  "titulo": "Honduras Adora",
  "lead": "\"Honduras Adora\", es un festival de música cristiana, que reúne a ministros de diferentes países, con la visión de interceder por la nación y declarar, que Honduras es tierra de adoración.",
  "aviso": {
    "textoAntes": "📍 Próximamente ",
    "dominio": "hondurasadora.com",
    "textoDespues": " redirigirá aquí."
  },
  "galeria": [
    { "ph": "420/520", "alt": "Ágape Worship · 2024", "caption": "Ágape Worship · 2024" },
    { "ph": "420/520", "alt": "WayBack · 2024", "caption": "WayBack · 2024" },
    { "ph": "420/520", "alt": "Julián & Becky Collazos · 2024", "caption": "Julián &amp; Becky Collazos" },
    { "ph": "420/520", "alt": "Bani Muñoz", "caption": "Bani Muñoz · 24/25" },
    { "ph": "420/520", "alt": "Juan Carlos Alvarado · 2024", "caption": "Juan Carlos Alvarado" },
    { "ph": "420/520", "alt": "Averly Morillo · 2025", "caption": "Averly Morillo · 2025" }
  ],
  "cta": {
    "anio": "2026",
    "texto": "La próxima edición está en camino. ¡Honduras es tierra de adoración!",
    "boton": "Quiero participar",
    "href": "#invitaciones"
  }
}
```

- [ ] **Step 2: Create src/_data/recursos.json**

The three resource cards are dead links today (`href="#"` with `onclick="return false"`), pending files from the client. That markup stays literal in the template.

```json
{
  "num": "07",
  "titulo": "Recursos",
  "descripcion": "Para músicos y cantantes: pistas, acordes y recursos para tocar la música de WayBack.",
  "tarjetas": [
    { "clase": "card--blue", "icono": "🎚️", "titulo": "Pistas / Multitracks", "descripcion": "Stems y pistas de acompañamiento." },
    { "clase": "card--purple", "icono": "🎸", "titulo": "Acordes & Charts", "descripcion": "Cifrados y tonalidades por canción." },
    { "clase": "card--red", "icono": "🎹", "titulo": "Patches & Sonidos", "descripcion": "Presets para recrear nuestro sonido." }
  ],
  "subtituloGaleria": "Galería de conciertos",
  "galeria": [
    { "ph": "440/320", "alt": "Concierto WayBack" },
    { "ph": "440/320", "alt": "Concierto WayBack" },
    { "ph": "440/320", "alt": "Concierto WayBack" },
    { "ph": "440/320", "alt": "Concierto WayBack" }
  ]
}
```

- [ ] **Step 3: Replace the Honduras Adora markup**

Note `| safe` on the `alt` and on the caption, for the reason given in Step 1.

```njk
        <header class="section__title section__title--light reveal"><span class="badge-num badge-num--light">{{ hondurasAdora.num }}</span><h2>{{ hondurasAdora.titulo }}</h2></header>
        <p class="festival-lead reveal">{{ hondurasAdora.lead }}</p>
        <p class="notice reveal">{{ hondurasAdora.aviso.textoAntes }}<strong>{{ hondurasAdora.aviso.dominio }}</strong>{{ hondurasAdora.aviso.textoDespues }}</p>

        <div class="gallery">
          {%- for foto in hondurasAdora.galeria %}
          <figure class="reveal"><img src="{{ pixel }}" data-ph="{{ foto.ph }}" alt="{{ foto.alt | safe }}" /><figcaption>{{ foto.caption | safe }}</figcaption></figure>
          {%- endfor %}
        </div>

        <div class="festival-cta reveal">
          <span class="festival-cta__year">{{ hondurasAdora.cta.anio }}</span>
          <p>{{ hondurasAdora.cta.texto }}</p>
          <a class="btn btn--white" href="{{ hondurasAdora.cta.href }}">{{ hondurasAdora.cta.boton }}</a>
        </div>
```

- [ ] **Step 4: Replace the Recursos markup**

```njk
        <header class="section__title reveal"><span class="badge-num">{{ recursos.num }}</span><h2>{{ recursos.titulo }}</h2></header>
        <p class="section__desc reveal">{{ recursos.descripcion }}</p>
        <div class="split split--3">
          {%- for tarjeta in recursos.tarjetas %}
          <a class="card {{ tarjeta.clase }} tilt reveal resource" href="#" onclick="return false"><span class="resource__icon">{{ tarjeta.icono }}</span><h3>{{ tarjeta.titulo }}</h3><p>{{ tarjeta.descripcion }}</p></a>
          {%- endfor %}
        </div>
        <h3 class="subhead reveal">{{ recursos.subtituloGaleria }}</h3>
        <div class="gallery gallery--wide">
          {%- for foto in recursos.galeria %}
          <figure class="reveal"><img src="{{ pixel }}" data-ph="{{ foto.ph }}" alt="{{ foto.alt }}" /></figure>
          {%- endfor %}
        </div>
```

- [ ] **Step 5: Build and verify**

```bash
npm run build && npm run verify
```

Expected: PASS.

If the gallery line for Julián & Becky differs, the `| safe` filter is missing. Compare the two renderings: the reference has `alt="Julián & Becky Collazos · 2024"` with a bare ampersand.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: extract festival and resources into data files"
```

---

### Task 7: Extract Mahanaim Records and the footer

**Files:**
- Create: `src/_data/mahanaim.json`, `src/_data/footer.json`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `pixel` from Task 4; the video card shape from Task 4.
- Produces: global `mahanaim` with `num`, `titulo`, `lead`, `videos` (same shape as `musica.videos`); global `footer` with `marca`, `tagline`, `redes` (array of `{ nombre, href }`), `plataformas` (array of `{ nombre, href }`), `mision` (`titulo`, `texto`), `vision` (`titulo`, `texto`), `copyright` (`textoAntes`, `textoDespues`), `volverArriba`.

- [ ] **Step 1: Create src/_data/mahanaim.json**

The ISA LOPEZ id has ten characters; real YouTube ids have eleven. It is wrong and stays wrong in this phase.

The reference markup carries an HTML comment immediately after the ISA LOPEZ `<article>` opening tag. Rather than dropping it — which would break the no-exceptions diff rule — it becomes an optional `comentario` field that the template emits conditionally. Only the first video has one.

```json
{
  "num": "08",
  "titulo": "Mahanaim Records",
  "lead": "Mahanaim Records es un ministerio/ONG que apoya a personas que quieren lanzar su música y no tienen tanto recurso para lograrlo.",
  "videos": [
    { "id": "FqAj3bXxmG", "titulo": "ISA LOPEZ", "ph": "640/360", "alt": "ISA LOPEZ", "caption": "ISA LOPEZ · Mahanaim Records", "comentario": "TODO: confirmar ID de YouTube de ISA LOPEZ" },
    { "id": "G0D9iBJDhGA", "titulo": "JEFF CASTRO", "ph": "640/360", "alt": "JEFF CASTRO", "caption": "JEFF CASTRO · Mahanaim Records" }
  ]
}
```

- [ ] **Step 2: Create src/_data/footer.json**

The four social `<svg>` icons stay literal in the template; only their `href` and `aria-label` become data. The YouTube href 404s and is preserved — see Global Constraints.

```json
{
  "marca": "WayBack",
  "tagline": "De Regreso al Camino · Banda Hondureña de Electro-Pop Cristiano · wayback.org",
  "redes": [
    { "nombre": "Facebook", "href": "https://facebook.com/WayBackOficialHN" },
    { "nombre": "Instagram", "href": "https://instagram.com/waybackoficial" },
    { "nombre": "TikTok", "href": "https://tiktok.com/@waybackoficial" },
    { "nombre": "YouTube", "href": "https://youtube.com/waybackoficial" }
  ],
  "plataformas": [
    { "nombre": "Spotify", "href": "https://open.spotify.com/artist/15S8x4SA16werdAc7KkJMd" },
    { "nombre": "YouTube Music", "href": "https://music.youtube.com/@WayBackOficial" }
  ],
  "mision": {
    "titulo": "Misión",
    "texto": "Ser un instrumento en las manos de Dios, creando música y espacios para que los hijos pródigos vuelvan al camino y aquellos que no le conocen, puedan aceptarlo como su Señor y Salvador."
  },
  "vision": {
    "titulo": "Visión",
    "texto": "Ser un ministerio orgullosamente hondureño, sano y enfocado, que llegue a todas las partes de Honduras, Centroamérica y el mundo, siendo íntegros en todo lo que hacemos."
  },
  "copyright": {
    "textoAntes": "© ",
    "textoDespues": " WayBack · Hecho con fe en Honduras 🇭🇳"
  },
  "volverArriba": "Volver arriba ↑"
}
```

- [ ] **Step 3: Replace the Mahanaim markup**

```njk
        <header class="section__title reveal"><span class="badge-num">{{ mahanaim.num }}</span><h2>{{ mahanaim.titulo }}</h2></header>
        <div class="card card--purple reveal" style="margin-bottom:28px">
          <p class="lead" style="margin:0">{{ mahanaim.lead }}</p>
        </div>
        <div class="music-grid">
          {%- for video in mahanaim.videos %}
          <article class="yt-lite reveal" data-id="{{ video.id }}" data-title="{{ video.titulo }}">{% if video.comentario %}<!-- {{ video.comentario }} -->{% endif %}
            <img src="{{ pixel }}" data-ph="{{ video.ph }}" alt="{{ video.alt }}" />
            <button class="yt-lite__play" aria-label="Reproducir">▶</button>
            <span class="yt-lite__cap">{{ video.caption }}</span>
          </article>
          {%- endfor %}
        </div>
```

The `{% if video.comentario %}` sits on the same line as the closing `>` of the `<article>` tag, with no whitespace between them, because that is exactly where the comment lives in the reference. The second video has no `comentario` key, so nothing is emitted for it.

- [ ] **Step 4: Replace the footer markup**

Keep each `<svg>` exactly as it appears in the reference. Only the wrapping `<a>` becomes a loop. Because the four icons differ, the loop indexes into the literal SVGs by social name:

```njk
          <a href="#hero" class="brand"><span class="brand__mark">W</span> {{ footer.marca }}</a>
          <p>{{ footer.tagline }}</p>
```

The social block is **not** a loop, because each of the four `<a>` elements wraps a different inline `<svg>` and those paths cannot be templated without moving hundreds of characters of path data into JSON. Instead, keep all four `<a>` elements exactly as they appear in `reference/index.html` and substitute only the two attributes on each opening tag. Open `reference/index.html`, find the `<div class="socials">` block, and edit the four opening tags in place to:

```njk
            <a href="{{ footer.redes[0].href }}" target="_blank" rel="noopener" aria-label="{{ footer.redes[0].nombre }}">
            <a href="{{ footer.redes[1].href }}" target="_blank" rel="noopener" aria-label="{{ footer.redes[1].nombre }}">
            <a href="{{ footer.redes[2].href }}" target="_blank" rel="noopener" aria-label="{{ footer.redes[2].nombre }}">
            <a href="{{ footer.redes[3].href }}" target="_blank" rel="noopener" aria-label="{{ footer.redes[3].nombre }}">
```

Index 0 is Facebook, 1 Instagram, 2 TikTok, 3 YouTube — the same order as in `footer.json`. Each keeps its original `<svg>` child and closing `</a>` untouched. Do not retype any `<svg>` path data.

```njk
          <div class="platforms">
            {%- for plataforma in footer.plataformas %}
            <a href="{{ plataforma.href }}" target="_blank" rel="noopener">{{ plataforma.nombre }}</a>
            {%- endfor %}
          </div>
        </div>
        <div class="footer__mv">
          <h4>{{ footer.mision.titulo }}</h4>
          <p>{{ footer.mision.texto }}</p>
          <h4>{{ footer.vision.titulo }}</h4>
          <p>{{ footer.vision.texto }}</p>
        </div>
      </div>
      <div class="footer__bottom">
        <span>{{ footer.copyright.textoAntes }}<span id="year"></span>{{ footer.copyright.textoDespues }}</span>
        <a href="#hero">{{ footer.volverArriba }}</a>
      </div>
```

- [ ] **Step 5: Build and verify**

```bash
npm run build && npm run verify
```

Expected: PASS.

If the ISA LOPEZ line differs, check the spacing around the `{% if %}` — the comment must sit flush against the `>` of the `<article>` tag with no intervening whitespace.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: extract mahanaim and footer into data files"
```

---

### Task 8: Point Vercel at the build and confirm the deploy

**Files:**
- Modify: `vercel.json`, `README.md`

**Interfaces:**
- Consumes: a working `npm run build` from Tasks 1-7.
- Produces: a Vercel deployment serving `_site/` that is visually identical to the current one.

- [ ] **Step 1: Add the build configuration to vercel.json**

A `package.json` now exists, so Vercel stops treating the repository as a zero-config static site and must be told what to run. Keep every existing header — especially `X-Robots-Tag`, which stops the temporary Vercel URL being indexed.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "_site",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Run the full verification suite one last time**

```bash
npm run build
npm run verify
shasum -a 256 src/styles.css _site/styles.css
shasum -a 256 src/script.js _site/script.js
shasum -a 256 src/assets/wayback-banda.jpeg _site/assets/wayback-banda.jpeg
```

Expected: verify passes; each checksum pair matches.

- [ ] **Step 3: Check the page in a browser at three widths**

```bash
npx @11ty/eleventy --serve
```

Open `http://localhost:8080` and confirm at 375px, 768px and 1440px that the layout matches production. These widths sit either side of the 680px and 920px breakpoints in `styles.css`. Confirm specifically: the mobile menu opens and closes, the typewriter animates, the nineteen branded placeholders paint, and the hero photo renders.

- [ ] **Step 4: Update README.md**

Replace the "Ejecutar en local" and "Estructura" sections to describe the Eleventy layout, `npm run dev` and `npm run build`. Add the ISA LOPEZ video id warning to the pending-content list. Keep the production checklist about `X-Robots-Tag` and the Open Graph URLs.

- [ ] **Step 5: Commit and push**

Pushing triggers the Vercel deploy. This is the first push of the phase; everything before it stayed local, per the agreed review-locally-then-ship workflow.

```bash
git add -A
git commit -m "build: point vercel at the eleventy output"
git push origin main
```

- [ ] **Step 6: Confirm the deployed page**

Open the Vercel production URL on both a phone and a desktop browser. Confirm it is indistinguishable from before the migration. If anything differs, roll back by promoting the previous deployment in the Vercel dashboard; the repository is not left broken because the previous build output is still serving until the new one succeeds.

---

## Phase Complete

At this point the content is fully separated from the markup and the site still looks exactly as it did. Phase 2 adds the hero background video, the six official YouTube videos, the hero social icons, and fixes the broken YouTube URL and the `▶` glyph. Phase 3 adds Decap CMS at `/admin`, pointed at these ten data files, with WayBack's Vercel production alias added to the `cms-auth.informaticahn.com` Worker allowlist — the client wants the panel available for testing before the real domain exists.
