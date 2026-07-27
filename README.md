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
├── reference/index.html   ← HTML aprobado; el build falla si el generado no coincide
├── tools/verify-html.mjs  ← compara el build contra reference/ línea por línea
├── vercel.json            ← build command, output directory y headers de despliegue
└── package.json
```

El build (`_site/`) es un `index.html` con `styles.css`, `script.js` y `assets/` copiados
tal cual. El chequeo *byte a byte* real es `diff -u reference/index.html _site/index.html`
(debe salir vacío, exit code 0); `npm run verify` hace una comparación más liviana de líneas
normalizadas — ver más abajo.

### Cómo usar `reference/index.html`

Nació como el HTML original congelado, para probar que la migración a Eleventy no cambiaba
ni un pixel. Ese trabajo terminó. Hoy es la **salida aprobada**: el build falla si lo
generado no coincide, así que atrapa cambios accidentales en secciones que no tocaste.

**Cuando cambies algo a propósito, el build va a fallar. Eso es correcto, no un estorbo.**
El procedimiento es:

```bash
npm run build                                   # falla y te dice la primera línea distinta
diff -u reference/index.html _site/index.html   # LEE este diff: ¿es solo lo que querías?
cp _site/index.html reference/index.html        # solo si el diff es exactamente lo esperado
npm run build                                   # vuelve a pasar
```

Revisar ese diff **es** la prueba. Copiar la referencia por reflejo, sin leerlo, convierte
el chequeo en un sello de goma y deja pasar justo el error que existe para atrapar.

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

## Panel de administración (`/admin`)

Decap CMS, con 9 archivos de contenido editables. **El código está listo pero
el panel todavía no se entrega al cliente**: se activa al migrar al VPS.

La autenticación reutiliza el Cloudflare Worker `cms-auth` de Informática HN
—el mismo de Ágape—, así que no hay infraestructura nueva que construir. Para
activarlo hacen falta tres cosas, ninguna en este repositorio:

1. `site_domain` en `src/admin/config.yml` apuntando al dominio del VPS.
2. Ese origen agregado a la lista de permitidos del Worker, en el repo privado
   `informatica-hn/cms-auth`. Si falta, el login falla con *origin not allowed*.
3. Una cuenta de GitHub para el editor, con acceso de escritura **solo** a este
   repositorio.

### Pendientes antes de producción

- [ ] Quitar el header `X-Robots-Tag: noindex, nofollow` de `vercel.json`.
      Está puesto a propósito para que Google **no** indexe la URL temporal de Vercel y no
      compita después con el dominio real.
- [ ] Completar `og:url` y `og:image` en `src/index.njk` con el dominio final
      (hacen falta URLs absolutas para que WhatsApp muestre la vista previa del enlace).

## Contenido pendiente

Lo que falta viene del cliente, no es trabajo de código:

- **Fotos reales.** Las 19 imágenes de merch, galerías y miniaturas son placeholders con la
  marca WayBack y la leyenda *"Foto pendiente"*. Hoy esto **no es un cambio de datos**: cada
  `<img>` placeholder trae `src="{{ pixel }}"` (el píxel transparente) y `data-ph="..."` fijos
  en la plantilla `src/index.njk`, y el JSON de `src/_data/` correspondiente no tiene clave
  `src`. Para reemplazar una foto hay que editar la plantilla: pon el archivo en
  `src/assets/`, cambia ese `src="{{ pixel }}"` por la ruta real en el `<img>` de
  `src/index.njk` que corresponda a esa foto, y borra su atributo `data-ph`. *(Pendiente: un
  mecanismo para que esto sea un cambio solo de datos, sin tocar la plantilla — decisión de
  alcance del dueño del repositorio.)*
- **IDs de YouTube.** Los `data-id` de la sección Música son placeholders
  (`VIDEO_LIBRE`, `VIDEO_SALVADOR`, `VIDEO_LIBRO`). El de ISA LOPEZ (`FqAj3bXxmG`) tiene
  10 caracteres y los IDs de YouTube tienen 11 — hay que confirmarlo.
## Secciones retiradas

Dos secciones se quitaron a propósito, para no mostrarle al cliente cosas que no funcionan.
Se reponen si las pide:

- **Invitaciones.** Era un formulario que validaba y mostraba "✓ ¡Gracias!" pero **no enviaba
  nada a ningún lado** — quien lo llenara se quedaba esperando una respuesta que nunca
  llegaría. Su llamado a la acción vive ahora en el botón "Quiero participar" de Honduras
  Adora, que abre WhatsApp con un mensaje ya redactado. Para reponerla hace falta primero
  conectarla a un servicio de correo o a un endpoint en el VPS.
- **Recursos.** Pistas, acordes y patches para músicos. Los tres enlaces estaban desactivados
  (`href="#"` con `onclick="return false"`) esperando archivos del cliente.

El CSS de ambas sigue en `styles.css` y el manejador de formularios sigue en `script.js`, sin
uso. No estorban y facilitan reponerlas; si se decide que no vuelven, se pueden borrar.

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
