# WayBack — De Regreso al Camino

Sitio web de **WayBack**, banda hondureña de Electro-Pop Cristiano y organizadora del festival
**Honduras Adora**.

Sitio generado con **Eleventy**: el contenido vive en JSON, la plantilla en Nunjucks,
y el build produce HTML estático puro — sin JS de servidor ni framework en el cliente.

## Estructura

```
.
├── src/
│   ├── index.njk         ← plantilla (Nunjucks) que arma las 9 secciones
│   ├── styles.css        ← estilos, patrones y responsive
│   ├── script.js         ← tilt, reveals, máquina de escribir, placeholders, formularios
│   ├── assets/
│   │   └── wayback-banda.jpeg
│   └── _data/            ← contenido de cada sección, un JSON por bloque
│       ├── site.json         (metadata, nav, Open Graph)
│       ├── hero.json
│       ├── sobre.json
│       ├── musica.json
│       ├── eventos.json
│       ├── merch.json
│       ├── hondurasAdora.json
│       ├── mahanaim.json
│       ├── recursos.json
│       └── footer.json
├── eleventy.config.js     ← input/output dirs + passthrough de CSS/JS/assets
├── reference/index.html   ← snapshot congelado del HTML original (para verificar)
├── tools/verify-html.mjs  ← compara el build contra reference/ línea por línea
├── vercel.json            ← build command, output directory y headers de despliegue
└── package.json
```

El build (`_site/`) es un `index.html` con `styles.css`, `script.js` y `assets/` copiados
tal cual. El chequeo *byte a byte* real contra el `index.html` original es
`diff -u reference/index.html _site/index.html` (debe salir vacío, exit code 0); `npm run
verify` hace una comparación más liviana de líneas normalizadas — ver más abajo.

## Ejecutar en local

Requiere Node (instalado vía [nvm](https://github.com/nvm-sh/nvm)). En una shell no interactiva
nvm no queda en el `PATH` por defecto; hay que exportarlo antes de correr `npm`:

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"
npm install
```

```bash
npm run dev     # eleventy --serve, recarga en vivo en http://localhost:8080
npm run build   # genera _site/ y, vía postbuild, compara líneas normalizadas contra
                # reference/index.html; falla el build si difieren (así falla el deploy de Vercel)
npm run verify  # alias de build: siempre reconstruye antes de comparar, nunca compara contra
                # un _site/ viejo
```

`npm run verify` (y el `postbuild` de `npm run build`) usan `tools/verify-html.mjs`, que
**normaliza líneas** (recorta espacios y descarta líneas vacías) antes de comparar — no es una
comparación byte a byte. Para el chequeo exacto de bytes hay que correr
`diff -u reference/index.html _site/index.html` aparte; solo eso garantiza que no cambió nada,
ni siquiera un espacio.

## Despliegue

**Etapa actual — revisión del cliente:** Vercel, conectado a este repo.
Cada `git push` a `main` publica automáticamente.

**Etapa final:** dominio propio (Cloudflare) apuntando al VPS de DigitalOcean.
Al ser un sitio estático, el despliegue es copiar estos archivos al *document root* de nginx.

### Pendientes antes de producción

- [ ] Quitar el header `X-Robots-Tag: noindex, nofollow` de `vercel.json`.
      Está puesto a propósito para que Google **no** indexe la URL temporal de Vercel y no
      compita después con el dominio real.
- [ ] Completar `og:url` y `og:image` en `src/index.njk` con el dominio final
      (hacen falta URLs absolutas para que WhatsApp muestre la vista previa del enlace).

## Contenido pendiente

Lo que falta viene del cliente, no es trabajo de código:

- **Fotos reales.** Las 19 imágenes de merch, galerías y miniaturas son placeholders con la
  marca WayBack y la leyenda *"Foto pendiente"*. Para reemplazar una: pon la foto en `src/assets/`,
  cambia el `src` en el JSON de `src/_data/` correspondiente y **borra el atributo `data-ph`**.
- **IDs de YouTube.** Los `data-id` de la sección Música son placeholders
  (`VIDEO_LIBRE`, `VIDEO_SALVADOR`, `VIDEO_LIBRO`). El de ISA LOPEZ (`FqAj3bXxmG`) tiene
  10 caracteres y los IDs de YouTube tienen 11 — hay que confirmarlo.
- **Formulario de invitaciones.** Hoy solo valida y muestra un mensaje de éxito; **no envía
  nada a ningún lado**. Falta conectarlo a un servicio de correo o a un endpoint en el VPS.
- **Sección Recursos.** Los tres enlaces (pistas, acordes, patches) están desactivados
  a la espera de los archivos.

## Personalizar

- **Colores:** variables en `:root` de `styles.css` (`--rojo`, `--azul`, `--morado`,
  `--azul-cielo`, `--crema`, …).
- **Tipografías:** `<link>` de Google Fonts en `src/index.njk` + `--font-display` / `--font-body`.
- **Texto que se escribe solo:** arreglo `phrases` en `initTypewriter()` de `script.js`.
  Acepta varias frases y las alterna (escribe → borra → siguiente).
- **Patrón cultural:** está en `.hero__pattern` (CSS). Se puede sustituir por un SVG de
  motivos lencas o textiles propios.
- **WhatsApp:** botón de merch a `https://wa.me/50496236221` (9623-6221).
- **Spotify:** el `iframe` ya apunta al artista real.
- **Caché durante la revisión:** si cambias `styles.css` o `script.js`, sube el número de
  `?v=` en los `<link>`/`<script>` de `src/index.njk` para que el cliente no vea una versión vieja.

> Nota: próximamente `hondurasadora.com` redirigirá a la sección de Honduras Adora.

## Diseño

Propuesta **"Honduras Vibrante"**: estilo neo-brutalista alegre — bordes marcados, sombras
sólidas, bloques de color saturado. Paleta derivada de los colores institucionales
(rojo `#e11d2e`, azul `#0a47a8`, morado `#6d28d9`, azul cielo `#00a3e0`, amarillo `#ffd23f`
sobre crema `#fff7ec`). Tipografías Bricolage Grotesque + DM Sans.

Se evaluaron tres propuestas de diseño; esta fue la elegida.
