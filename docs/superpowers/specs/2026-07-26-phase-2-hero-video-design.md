# WayBack Phase 2 Design — Hero Video, Real Videos, Social Icons

Phase 2 of 4. Phase 1 (the Eleventy migration) is merged and deployed.

## Goal

Deliver the client-requested features that Phase 1 deliberately deferred, plus
the two defects it carried over unchanged to keep its diff clean.

Unlike Phase 1, this phase changes the page on purpose. The
`reference/index.html` gate will fail on every step; the procedure is to read
the diff, confirm it is only what was intended, then re-baseline. Reading that
diff is the review — copying it reflexively defeats the check.

## Scope

1. Hero background video, muted and looping, with a sound toggle.
2. Remove the hero's "Ver video" button (client request; also resolves one of
   the two broken YouTube links).
3. Replace the three placeholder video IDs with the six real official videos,
   using real YouTube thumbnails.
4. Social icons in the hero, in addition to the footer.
5. Fix the footer YouTube link, which 404s.
6. Fix the `▶` glyph, which has no coverage in either site font.
7. Fix the ISA LOPEZ video ID.

## Confirmed data

All verified live on 2026-07-26. Every thumbnail returns HTTP 200 at
`maxresdefault`.

| Video ID | Title |
|---|---|
| `swcG_IQ8VF4` | Libre en Tu Presencia (feat. Bani Muñoz) — also the hero video |
| `2I3WFLYv8Xc` | Eres Mi Salvador (En Vivo) |
| `-KJT_Fb1hQg` | El Libro De La Vida (Inscríbeme) |
| `djr0cZejfe0` | De Regreso Al Camino (En Vivo) |
| `C7stmRE5YXc` | Todo Lo Puedo |
| `lIIWkSSrojM` | Sí Sí (HCH TV Digital) |

The ISA LOPEZ id in the Mahanaim section was `FqAj3bXxmG` — ten characters,
where YouTube ids have eleven. The real video is `FqAj3bXxmGs`, "EN LA
TEMPESTAD - ISA LOPEZ VIDEO OFICIAL", on the channel *Isa Lopez Oficial*. A
single trailing character had been dropped when it was copied.

The footer YouTube link points at `youtube.com/waybackoficial`, which returns
404. The working URL is `youtube.com/@WayBackOficial` — the handle form needs
the `@`.

## Hero video

### Why it cannot autoplay with sound

The client asked for the video to play with audio on page load. Browsers forbid
this. iOS Safari never permits audio without a prior user gesture; Chrome on
Android blocks it unless the visitor already has a high media-engagement score
for the domain. Since the client reviews on a phone, audio autoplay would
simply not happen there.

Muted autoplay is permitted everywhere, so the video autoplays muted and a
visible control lets anyone turn sound on with one tap. This is as close to the
request as the platform allows, and it is what Apple, Spotify and most band
sites do.

### Implementation

The YouTube IFrame Player API, not a bare `<iframe>`. The API is required to
unmute programmatically from the button's click handler, to know when playback
has actually begun so the fade-in is not guessed, and to cap playback quality.

Player parameters and why each is needed:

- `playsinline=1` — **critical**. Without it iOS takes the video fullscreen
  the moment it plays, hijacking the page.
- `mute=1` and `autoplay=1` — muted autoplay is the only autoplay allowed.
- `loop=1` **with** `playlist=swcG_IQ8VF4` — YouTube ignores `loop` for a
  single video unless the same id is repeated in `playlist`.
- `controls=0`, `disablekb=1`, `fs=0`, `iv_load_policy=3`, `modestbranding=1`,
  `rel=0` — the video is a background, so its chrome must not appear or
  capture input.

The iframe is 16:9 and the hero is not, so CSS scales it to cover the box the
way `object-fit: cover` would, centred, with the overflow clipped.

### The load sequence the client asked for

The existing hero — gradient, band photo, title — renders immediately from
static HTML and needs no JavaScript. The video mounts behind it and fades in
over 600ms only once the player reports it is actually playing. If the API
never loads, the video is blocked, or the network is slow, the existing hero is
simply what stays on screen. The feature degrades to today's page rather than
to a blank box.

### Contrast

Text sits on top of moving video, so a dark scrim goes between them. Without
it, legibility depends on whatever frame happens to be showing — bright frames
would leave white text unreadable. The scrim is what keeps the title above the
WCAG AA contrast threshold at all times, not a stylistic choice.

### When the video does not load at all

Three cases deliberately skip it:

- `prefers-reduced-motion: reduce` — an accessibility setting; a looping
  background video is exactly what it asks to suppress.
- `navigator.connection.saveData` — the visitor asked their browser to
  conserve data.
- Viewport under 680px on a connection reporting `2g` or `slow-2g`. The video
  is roughly 4:18 long, and a large share of this audience is on Honduran
  mobile data. Playback quality is also capped on small viewports.

In all three the static hero remains, which is a complete experience on its own.

## Social icons

The four icons already exist as inline SVG in the footer. Rather than
duplicating several hundred characters of path data into the hero, they move
into a Nunjucks macro that both places call. One definition, two call sites.

## The `▶` glyph

`▶` (U+25B6) appears in five play buttons and has no glyph in either Bricolage
Grotesque or DM Sans, so it renders through whatever fallback font the device
supplies — on many it is a missing-character box. The site already uses inline
SVG for every other icon; these become SVG too, which removes the dependency on
font coverage entirely.

## Verification

1. The generated HTML diff contains only intended changes, reviewed before
   re-baselining `reference/index.html`.
2. All six video ids and the ISA LOPEZ id resolve, and their thumbnails load.
3. No link in the page 404s.
4. `▶` appears nowhere in the output.
5. The hero renders correctly at 375px, 768px and 1440px, with and without the
   video, and the title stays legible over every frame.
6. With JavaScript disabled the hero still renders completely.
7. The sound toggle is reachable by keyboard and announces its state.

Items 5 through 7 need a browser and are the repository owner's to confirm.
