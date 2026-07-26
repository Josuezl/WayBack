# WayBack Eleventy Migration Design

Phase 1 of 4. Later phases are summarized at the end for context only; this
spec covers Phase 1 exclusively.

## Goal

Convert the hand-written `index.html` into an Eleventy site whose content lives
in structured data files, so that a Git-based CMS has something coherent to
edit. A plain HTML site cannot be administered by Decap CMS, which reads and
writes JSON, YAML, and Markdown rather than arbitrary markup.

This phase changes no pixels. The rendered page must be semantically identical
to the page in production today. Every visual and behavioural change requested
by the client — hero background video, the six official YouTube videos, social
icons in the hero — belongs to Phase 2 and is explicitly out of scope here.

Keeping the refactor visually inert is what makes it verifiable: the migration
is correct when the generated HTML matches the current HTML, and any difference
is a defect rather than a judgement call.

## Non-Goals

- No visual, layout, copy, or behavioural change of any kind.
- No CMS, no `/admin`, no authentication. That is Phase 3.
- No VPS deployment or GitHub Actions. That is Phase 4.
- No changes to `styles.css` or `script.js`. Both files move verbatim.
- No image or asset optimization.
- No new dependencies beyond Eleventy itself.

## Prerequisite

Node.js LTS must be installed on the development machine. It is currently
absent, along with npm and Homebrew, so the site cannot be built or previewed
locally until this is resolved. The official installer from nodejs.org is the
shortest path given the absence of Homebrew.

Eleventy 3.x requires Node 18 or newer.

## Repository Layout

```
weyback/
├── src/
│   ├── index.njk            ← the current index.html, with content interpolated
│   ├── _data/               ← Eleventy global data, one file per section
│   │   ├── site.json
│   │   ├── hero.json
│   │   ├── sobre.json
│   │   ├── musica.json
│   │   ├── eventos.json
│   │   ├── merch.json
│   │   ├── hondurasAdora.json
│   │   ├── recursos.json
│   │   ├── mahanaim.json
│   │   └── footer.json
│   ├── styles.css           ← byte-identical to today's file
│   ├── script.js            ← byte-identical to today's file
│   └── assets/
│       └── wayback-banda.jpeg
├── _site/                   ← build output, git-ignored
├── .eleventy.js
├── package.json
├── vercel.json
└── docs/superpowers/specs/
```

Eleventy's `_data` directory exposes each JSON file as a global variable named
after the file, so `src/_data/eventos.json` is available to templates as
`eventos` with no glue code. Splitting content one-file-per-section rather than
into a single blob means each file maps cleanly onto one CMS collection in
Phase 3, and it mirrors the `content/current-event.json` shape already used in
Ágape.

Nunjucks is the template language because `.njk` accepts existing HTML
unmodified; migration consists of replacing literal text with variables rather
than rewriting markup. This is the property that makes a visually inert
migration realistic.

## Content Model

Every piece of text and every image path currently hard-coded in `index.html`
moves into `_data`. The ten content files below cover the page in full.

`site.json` holds page metadata: title, description, theme colour, Open Graph
fields, and the navigation link list.

`hero.json` holds the heading, the typewriter phrase array, the subtitle, and
**both** call-to-action buttons with their labels and targets. The "Ver video"
button is retained in this phase even though the client has asked for its
removal, because removing it would be a visual change; it is deleted in
Phase 2.

`sobre.json` holds the section number, heading, and an array of paragraphs.

`musica.json` holds two release lists (`proximos` as plain strings, `recientes`
as objects with `titulo` and an optional `nota` for the `<em>` detail), an
array of three video cards each with `id`, `titulo` and `caption`, and the
Spotify artist ID as a single top-level field.

`eventos.json` holds an array of three events. The date block renders two lines
of differing kinds — the first card reads "2026 / Por confirmar" while the
others read "15 / AGO 2026" — so the fields are named `fechaPrincipal` and
`fechaSecundaria` rather than day and month, which would not fit the first
card. Each event also carries `titulo`, `lugar`, `etiqueta`, and a `destacado`
boolean that selects the `event-card--soon` modifier.

`merch.json` holds four products with `titulo` and `subtitulo`, plus the
WhatsApp number and the call-to-action sentence.

`hondurasAdora.json` holds the lead paragraph, the redirect notice, six gallery
entries with `alt` and `caption`, and the CTA year, text, and button label.

`recursos.json` holds the section description, three resource cards with
`icono`, `titulo`, and `descripcion`, and four concert gallery entries.

`mahanaim.json` holds the lead paragraph and two video cards in the same shape
as `musica.json`.

`footer.json` holds the brand tagline, four social links, two platform links,
and the mission and vision paragraphs.

### Placeholder images

The nineteen pending photographs are currently marked with a `data-ph`
attribute carrying an aspect ratio, which `script.js` uses to paint a branded
placeholder. That mechanism is unchanged. In the data files an image is
expressed as either a real `src` or a `ph` ratio, never both, and the template
emits the corresponding attribute. Replacing a placeholder with a real photo
therefore becomes a data edit rather than a markup edit, which is what makes it
a CMS operation in Phase 3.

### Known bad data carried over unchanged

Three values are wrong today and stay wrong in this phase, so that the diff
stays clean. They are listed here so they are not mistaken for migration
defects, and they are fixed in Phase 2:

- The footer YouTube link points at `youtube.com/waybackoficial`, which returns
  404. The working URL is `youtube.com/@WayBackOficial`.
- The hero "Ver video" button points at the same broken URL. The client has
  asked for this button to be removed entirely, which resolves it.
- The three video IDs in the Música section (`VIDEO_LIBRE`, `VIDEO_SALVADOR`,
  `VIDEO_LIBRO`) and the ISA LOPEZ ID `FqAj3bXxmG` are placeholders. Real IDs
  have been identified from the channel feed and are applied in Phase 2.

## Build and Deployment

`package.json` declares Eleventy as the single dev dependency and exposes two
scripts: `dev` runs the local server with hot reload, and `build` produces
`_site/`.

`.eleventy.js` sets `src` as input and `_site` as output, and registers
passthrough copy for `styles.css`, `script.js`, and `assets/` so those files are
emitted byte-for-byte rather than processed.

`vercel.json` keeps its existing headers unchanged, including the
`X-Robots-Tag: noindex` that prevents the temporary Vercel URL from being
indexed. Vercel additionally needs the build command `npm run build` and the
output directory `_site`; because a `package.json` now exists, Vercel will stop
treating the repository as a zero-config static site and must be told
explicitly.

`.gitignore` gains `_site/`. It already ignores `node_modules/`.

## Verification

The migration is correct when the generated page is semantically identical to
the current one. This is checked mechanically, not by eye:

1. Capture the current `index.html` as a reference before any change.
2. Run the build.
3. Normalize both the reference and `_site/index.html` for insignificant
   whitespace, then diff them. The expected result is an empty diff. There are
   no permitted exceptions: attribute names, attribute order, and attribute
   values must all match, including the transparent-pixel `src` that
   accompanies every `data-ph` placeholder. Any surviving difference is a
   defect and must be resolved before the phase is considered done.
4. Confirm `_site/styles.css`, `_site/script.js`, and
   `_site/assets/wayback-banda.jpeg` are byte-identical to their sources, by
   checksum.
5. Serve `_site/` and confirm the page and all three assets return 200.
6. Confirm the page renders correctly at 375px, 768px, and 1440px widths,
   covering the two breakpoints at 920px and 680px. The client will review on
   both a phone and a computer, so both must be checked.

Steps 3 and 4 are the substance of this phase. Steps 5 and 6 guard against a
build that diffs cleanly but fails to assemble.

## Failure Handling

- A malformed data file fails the Eleventy build, so broken content cannot
  reach production.
- A failed Vercel build leaves the previous deployment serving.
- Because content and presentation are now separate, a content mistake can be
  reverted with a single commit without touching markup.

## Later Phases

Recorded for context; each will receive its own spec.

**Phase 2 — features.** Hero background video using the YouTube IFrame Player
API, muted and looping with a sound toggle, because browsers refuse autoplay
with audio and iOS refuses it unconditionally. The six official videos replace
the placeholder grid. Social icons move into the hero. The broken YouTube URL
and the `▶` glyph, which has no coverage in either site font and renders as a
missing-character box, are fixed.

**Phase 3 — Decap CMS.** `/admin` served statically, `config.yml` pointing at
the GitHub backend and the `_data` files. WayBack's origin is added to the
existing `cms-auth.informaticahn.com` Worker allowlist; the editor receives a
GitHub account with write access limited to this repository. No new
authentication infrastructure is built, because the `cms-auth` Worker was
designed for reuse across Informática HN clients.

The panel is wanted for testing before the real domain exists, so the Vercel
production alias is allowlisted rather than waiting. Vercel preview URLs change
on every deployment and cannot be allowlisted; only the production alias is
stable. When the Cloudflare domain is added in Phase 4, its origin is added to
the allowlist and the Vercel origin is removed.

**Phase 4 — VPS.** GitHub Actions with atomic release and rollback, mirroring
the Ágape deployment, plus the Cloudflare domain.
