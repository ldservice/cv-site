# CV site — Leonid Dymenko

A one-page résumé site in English (`/`) and Ukrainian (`/uk/`), with five video CVs
embedded from YouTube. Live at **https://ldservice.github.io/cv-site/**

The look is not a theme picked off a shelf: it is the surface the films themselves are
drawn on. Light is squared notebook paper in blue ballpoint, dark is chalk on a green
board — the same palettes, the same two handwriting faces, the same wobbly frames, drawn
here by an SVG turbulence filter instead of Rough.js.

## Build

No dependencies, no framework, no build step beyond one Node script.

```bash
node build.js     # content/*.json → index.html, uk/index.html, sitemap.xml, robots.txt
node serve.js     # local preview on http://localhost:4173
```

`index.html` and `uk/index.html` are generated — edit the text in `content/*.json` and
rebuild. Each language is a real page with its own title, description, canonical and
hreflang: a résumé has to be readable by a search engine and by a recruiter with
JavaScript switched off. What JavaScript adds is the theme switch, the draw-in on scroll,
and loading a video player only once someone clicks a film — until then the page makes no
request to YouTube and sets no cookies.

## Layout

| Path | What it is |
|---|---|
| `content/site.json` | site URL, contacts, the list of films and their YouTube ids |
| `content/en.json`, `content/uk.json` | every string on the page, one file per language |
| `build.js` | the generator |
| `assets/style.css` | one stylesheet, two surfaces |
| `assets/main.js` | theme, click-to-play embeds, reveal on scroll |
| `assets/posters/` | frames taken from the films, two per film |
| `cv/*.pdf` | the one-page résumé, English and Ukrainian |

## Author

Written and designed by **Leonid Dymenko** — AI Workflow Engineer, Kyiv.
The films are made by his own rendering pipeline; this page is about the same work.

Code is MIT (see `LICENSE`). The résumé texts, the photograph and the films are not:
all rights reserved.
