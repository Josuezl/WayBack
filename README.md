# WayBack — De Regreso al Camino

Sitio web de **WayBack**, banda hondureña de Electro-Pop Cristiano y organizadora del festival
**Honduras Adora**.

Sitio estático: HTML + CSS + JS, sin build ni dependencias.

## Estructura

```
.
├── index.html   ← contenido (9 secciones)
├── styles.css   ← estilos, patrones y responsive
├── script.js    ← tilt, reveals, máquina de escribir, placeholders, formularios
├── vercel.json  ← headers de despliegue
└── assets/
    └── wayback-banda.jpeg
```

## Ejecutar en local

Abrir `index.html` directo en el navegador, o levantar cualquier servidor estático
(por ejemplo la extensión *Live Server* de VS Code, que sirve en `http://localhost:5500`).

## Despliegue

**Etapa actual — revisión del cliente:** Vercel, conectado a este repo.
Cada `git push` a `main` publica automáticamente.

**Etapa final:** dominio propio (Cloudflare) apuntando al VPS de DigitalOcean.
Al ser un sitio estático, el despliegue es copiar estos archivos al *document root* de nginx.

### Pendientes antes de producción

- [ ] Quitar el header `X-Robots-Tag: noindex, nofollow` de `vercel.json`.
      Está puesto a propósito para que Google **no** indexe la URL temporal de Vercel y no
      compita después con el dominio real.
- [ ] Completar `og:url` y `og:image` en `index.html` con el dominio final
      (hacen falta URLs absolutas para que WhatsApp muestre la vista previa del enlace).

## Contenido pendiente

Lo que falta viene del cliente, no es trabajo de código:

- **Fotos reales.** Las 19 imágenes de merch, galerías y miniaturas son placeholders con la
  marca WayBack y la leyenda *"Foto pendiente"*. Para reemplazar una: pon la foto en `assets/`,
  cambia el `src` y **borra el atributo `data-ph`**.
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
- **Tipografías:** `<link>` de Google Fonts en `index.html` + `--font-display` / `--font-body`.
- **Texto que se escribe solo:** arreglo `phrases` en `initTypewriter()` de `script.js`.
  Acepta varias frases y las alterna (escribe → borra → siguiente).
- **Patrón cultural:** está en `.hero__pattern` (CSS). Se puede sustituir por un SVG de
  motivos lencas o textiles propios.
- **WhatsApp:** botón de merch a `https://wa.me/50496236221` (9623-6221).
- **Spotify:** el `iframe` ya apunta al artista real.
- **Caché durante la revisión:** si cambias `styles.css` o `script.js`, sube el número de
  `?v=` en los `<link>`/`<script>` de `index.html` para que el cliente no vea una versión vieja.

> Nota: próximamente `hondurasadora.com` redirigirá a la sección de Honduras Adora.

## Diseño

Propuesta **"Honduras Vibrante"**: estilo neo-brutalista alegre — bordes marcados, sombras
sólidas, bloques de color saturado. Paleta derivada de los colores institucionales
(rojo `#e11d2e`, azul `#0a47a8`, morado `#6d28d9`, azul cielo `#00a3e0`, amarillo `#ffd23f`
sobre crema `#fff7ec`). Tipografías Bricolage Grotesque + DM Sans.

Se evaluaron tres propuestas de diseño; esta fue la elegida.
