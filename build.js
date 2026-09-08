#!/usr/bin/env node
/*
 * Static generator for the CV site. No dependencies, no framework: it reads
 * three JSON files and writes two HTML pages.
 *
 *   node build.js            → index.html (en) and uk/index.html
 *
 * Why a generator and not one page with client-side i18n: a résumé is read by
 * search engines and by recruiters with JavaScript off. Each language is a
 * real page with real text, its own <title>, canonical and hreflang.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const site = readJson("content/site.json");
const LANGS = ["en", "uk"];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Where a page for `code` lives, relative to the site root. */
function pagePath(code) {
  return code === "en" ? "" : code + "/";
}

/** Prefix that gets you from a page back to the site root. */
function upTo(code) {
  return code === "en" ? "" : "../";
}

function hrefBetween(from, to) {
  if (from === to) return "./";
  return from === "en" ? pagePath(to) : upTo(from) + pagePath(to);
}

/* ------------------------------------------------------------- fragments */

/** A field that is either one value for both languages or {en, uk}. */
function perLang(value, code) {
  if (!value) return "";
  return typeof value === "string" ? value : value[code] || "";
}

function marginNote(text) {
  return text ? `<p class="margin-note">${esc(text)}</p>` : "";
}

function filmCard(film, meta, t, base) {
  const format = meta.format === "landscape" ? "landscape" : "portrait";
  const poster = `${base}assets/posters/${meta.poster}-${t.code}.jpg`;
  const duration = (meta.duration && meta.duration[t.code]) || "";
  const badges = [t.videos.formats[format], duration].filter(Boolean);
  /* Each film exists in two languages, so both `youtube` and `url` accept
     either one value for both pages or {"en": "...", "uk": "..."}. */
  const id = perLang(meta.youtube, t.code);
  const embed = id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
  const watchUrl = id ? `https://youtu.be/${id}` : perLang(meta.url, t.code);
  const label = `${t.videos.watch}: ${film.title}`;

  const frame = embed
    ? `<button type="button" class="film__frame" data-embed="${esc(embed)}" data-title="${esc(film.title)}" aria-label="${esc(label)}">
            <img src="${esc(poster)}" alt="" width="${format === "landscape" ? 960 : 540}" height="${format === "landscape" ? 540 : 960}" loading="lazy" decoding="async">
            <span class="film__play" aria-hidden="true"><span></span></span>
            <span class="film__badges">${badges.map((b) => `<span>${esc(b)}</span>`).join("")}</span>
          </button>`
    : watchUrl
      ? `<a class="film__frame" href="${esc(watchUrl)}" target="_blank" rel="noopener" aria-label="${esc(label)}">
            <img src="${esc(poster)}" alt="" loading="lazy" decoding="async">
            <span class="film__play" aria-hidden="true"><span></span></span>
            <span class="film__badges">${badges.map((b) => `<span>${esc(b)}</span>`).join("")}</span>
          </a>`
      : `<div class="film__frame">
            <img src="${esc(poster)}" alt="${esc(film.title)}" loading="lazy" decoding="async">
            <span class="film__badges">${badges.map((b) => `<span>${esc(b)}</span>`).join("")}</span>
            <span class="film__soon">${esc(t.videos.soon)}</span>
          </div>`;

  /* The "not published yet" note is written once under the section lead —
     five copies of the same sentence is not a design. */
  const link = watchUrl
    ? `<p class="film__link"><a href="${esc(watchUrl)}" target="_blank" rel="noopener">${esc(t.videos.watchOn)} →</a></p>`
    : "";

  return `<article class="film film--${format} reveal">
          <div class="sketch sketch--b film__shot">${frame}</div>
          <div class="film__body">
            <h3>${esc(film.title)}</h3>
            <p class="film__surface">${esc(film.surface)}</p>
            <p class="film__blurb">${esc(film.blurb)}</p>
            ${link}
          </div>
        </article>`;
}

function jobBlock(job) {
  const items = job.items
    .map(
      (item) =>
        `<li>${item.lead ? `<b>${esc(item.lead)}</b> ` : ""}${esc(item.text)}</li>`
    )
    .join("\n            ");

  return `<article class="job reveal">
          <div class="job__head">
            <h3 class="job__role">${esc(job.role)}</h3>
            <span class="job__period">${esc(job.period)}</span>
          </div>
          <p class="job__org">${esc(job.org)}</p>
          <ul>
            ${items}
          </ul>
        </article>`;
}

function jsonLd(t, url, base) {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.hero.name,
    jobTitle: t.hero.role,
    description: t.meta.description,
    email: "mailto:" + site.author.email,
    telephone: site.author.phone,
    url,
    image: url + "assets/photo.jpg",
    sameAs: [site.author.linkedin].filter(Boolean),
    address: { "@type": "PostalAddress", addressLocality: "Kyiv", addressCountry: "UA" },
    knowsLanguage: ["uk", "ru", "en"],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "National University of Food Technologies",
    },
  };
  void base;
  return JSON.stringify(person, null, 2);
}

/* ------------------------------------------------------------------ page */

function page(t) {
  const base = upTo(t.code);
  const url = site.baseUrl.replace(/\/+$/, "") + "/" + pagePath(t.code);
  const other = LANGS.filter((code) => code !== t.code);
  const a = site.author;
  const name = t.code === "uk" ? a.nameUk : a.name;

  const langLinks = site.languages
    .map((lang) => {
      const current = lang.code === t.code;
      return `<a href="${esc(hrefBetween(t.code, lang.code))}" data-lang-switch="${lang.code}" hreflang="${lang.code}"${
        current ? ' aria-current="true"' : ""
      } lang="${lang.code}">${esc(lang.label)}</a>`;
    })
    .join("\n          ");

  const alternates = LANGS.map(
    (code) =>
      `<link rel="alternate" hreflang="${code}" href="${esc(site.baseUrl.replace(/\/+$/, "") + "/" + pagePath(code))}">`
  )
    .concat([
      `<link rel="alternate" hreflang="x-default" href="${esc(site.baseUrl.replace(/\/+$/, "") + "/")}">`,
    ])
    .join("\n  ");

  const films = site.videos
    .map((meta) => {
      const film = t.videos.items.find((item) => item.key === meta.key);
      return film ? filmCard(film, meta, t, base) : "";
    })
    .join("\n        ");

  const numbers = t.numbers.lines
    .map(
      (line) => `<div class="terminal__row">
            <div class="cmd">${esc(line.cmd)}</div>
            <div><span class="out">${esc(line.out)}</span> <span class="lbl">${esc(line.label)}</span></div>
          </div>`
    )
    .join("\n          ");

  const skills = t.skills.groups
    .map(
      (group) => `<div class="skill reveal">
            <h3>${esc(group.name)}</h3>
            <p>${esc(group.items)}</p>
          </div>`
    )
    .join("\n          ");

  const education = t.education.items
    .map((item) => `<p><b>${esc(item.lead)}</b> — ${esc(item.text)}</p>`)
    .join("\n          ");

  const pdfEn = `${base}cv/CV-Dymenko-Leonid-en.pdf`;
  const pdfUk = `${base}cv/CV-Dymenko-Leonid-uk.pdf`;
  const ownPdf = t.code === "uk" ? pdfUk : pdfEn;

  return `<!doctype html>
<html lang="${t.code}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Draw-in is a JavaScript effect; without it nothing may ever be hidden. -->
  <script>document.documentElement.classList.add("js");</script>
  <title>${esc(t.meta.title)}</title>
  <meta name="description" content="${esc(t.meta.description)}">
  <meta name="author" content="${esc(name)}">
  <link rel="canonical" href="${esc(url)}">
  ${alternates}
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${esc(t.meta.title)}">
  <meta property="og:description" content="${esc(t.meta.description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:locale" content="${t.code === "uk" ? "uk_UA" : "en_US"}">
  <meta property="og:image" content="${esc(site.baseUrl.replace(/\/+$/, "") + "/assets/og-" + t.code + ".jpg")}">
  <meta property="og:image:alt" content="${esc(t.meta.ogAlt)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#f2efe4" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#1d2b24" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Neucha&family=JetBrains+Mono:wght@400;700&display=swap">
  <link rel="stylesheet" href="${base}assets/style.css">
  <script type="application/ld+json">
${jsonLd(t, url, base)}
  </script>
</head>
<body>
  <a class="skip" href="#main">${esc(t.nav.skip)}</a>

  <!-- One turbulence field, three seeds: every frame on the page is drawn
       through it, the way the films are drawn through Rough.js. -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <filter id="wobble-a"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
    <filter id="wobble-b"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.4"/></filter>
    <filter id="wobble-c"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="19" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>
  </svg>

  <header class="bar">
    <div class="bar__in">
      <a class="bar__name" href="#top">${esc(name)}</a>
      <nav aria-label="${esc(t.nav.profile)}">
        <a href="#video">${esc(t.nav.video)}</a>
        <a href="#profile">${esc(t.nav.profile)}</a>
        <a href="#skills">${esc(t.nav.skills)}</a>
        <a href="#experience">${esc(t.nav.experience)}</a>
        <a href="#contact">${esc(t.nav.contact)}</a>
      </nav>
      <div class="bar__tools">
        <div class="lang">
          ${langLinks}
        </div>
        <button type="button" class="theme-toggle" data-label-light="${esc(t.footer.themeLight)}" data-label-dark="${esc(t.footer.themeDark)}" data-aria="${esc(t.footer.theme)}">${esc(t.footer.themeDark)}</button>
      </div>
    </div>
  </header>

  <main id="main" class="sheet">
    <section class="hero" id="top">
      ${marginNote(t.hero.margin)}
      <div class="hero__grid">
        <div>
          <p class="hero__hi">${esc(t.hero.hi)}</p>
          <h1>${esc(t.hero.name)}</h1>
          <p class="hero__role">${esc(t.hero.role)}</p>
          <p class="hero__role-note">${esc(t.hero.roleNote)}</p>
          <p class="hero__location">${esc(t.hero.location)}</p>
          <p class="hero__pitch">${esc(t.hero.pitch)}</p>
          <p class="hero__open">${esc(t.hero.open)}</p>
          <div class="cta">
            <a class="btn btn--primary sketch" href="#video">${esc(t.hero.ctaVideo)}</a>
            <a class="btn sketch sketch--b" href="${esc(ownPdf)}" download>${esc(t.hero.ctaPdf)}</a>
            <a class="btn sketch sketch--c" href="mailto:${esc(a.email)}">${esc(t.hero.ctaMail)}</a>
          </div>
        </div>
        <figure class="photo sketch sketch--b">
          <img src="${base}assets/photo.jpg" alt="${esc(t.hero.photoAlt)}" width="416" height="554">
          <span class="photo__tape" aria-hidden="true"></span>
        </figure>
      </div>
    </section>

    <section class="numbers reveal" aria-label="${esc(t.numbers.title)}">
      <div class="terminal">
        <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
          ${numbers}
      </div>
      <p class="note">${esc(t.numbers.note)}</p>
    </section>

    <section id="video">
      ${marginNote(t.videos.margin)}
      <h2>${esc(t.videos.title)}</h2>
      <p class="lead">${esc(t.videos.lead)}</p>
      ${site.videos.every((meta) => !perLang(meta.youtube, t.code) && !perLang(meta.url, t.code)) ? `<p class="note">${esc(t.videos.soonNote)}</p>` : ""}
      <div class="films">
        ${films}
      </div>
    </section>

    <section id="profile">
      ${marginNote(t.profile.margin)}
      <h2>${esc(t.profile.title)}</h2>
      ${t.profile.paragraphs.map((p) => `<p class="lead reveal">${esc(p)}</p>`).join("\n      ")}
    </section>

    <section id="skills">
      ${marginNote(t.skills.margin)}
      <h2>${esc(t.skills.title)}</h2>
      <div class="skills__grid">
          ${skills}
      </div>
    </section>

    <section id="experience">
      ${marginNote(t.experience.margin)}
      <h2>${esc(t.experience.title)}</h2>
      <div class="jobs">
        ${t.experience.jobs.map(jobBlock).join("\n        ")}
      </div>
    </section>

    <section id="education">
      <h2>${esc(t.education.title)}</h2>
      <div class="edu reveal">
          ${education}
      </div>
    </section>

    <section id="contact">
      ${marginNote(t.contact.margin)}
      <h2>${esc(t.contact.title)}</h2>
      <p class="lead">${esc(t.contact.lead)}</p>
      <div class="contact__cards">
        <div class="contact__card sketch reveal">
          <h3>${esc(t.contact.emailLabel)}</h3>
          <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>
        </div>
        <div class="contact__card sketch sketch--b reveal">
          <h3>${esc(t.contact.phoneLabel)}</h3>
          <a href="tel:${esc(a.phone.replace(/\s/g, ""))}">${esc(a.phone)}</a>
        </div>
        <div class="contact__card sketch sketch--c reveal">
          <h3>${esc(t.contact.linkedinLabel)}</h3>
          <a href="${esc(a.linkedin)}" target="_blank" rel="noopener">${esc(a.linkedinLabel)}</a>
        </div>
        <div class="contact__card sketch reveal">
          <h3>${esc(t.contact.pdfLabel)}</h3>
          <a href="${esc(pdfEn)}" download>EN</a> · <a href="${esc(pdfUk)}" download>UA</a>
          <p>${esc(t.code === "uk" ? t.contact.pdfUk : t.contact.pdfEn)}</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p><strong>${esc(t.footer.author)}</strong></p>
      <p>${esc(t.footer.made)}</p>
      <p>${esc(t.footer.rights)}</p>
    </footer>
  </main>

  <script src="${base}assets/main.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ main */

function build() {
  const written = [];

  for (const code of LANGS) {
    const t = readJson(`content/${code}.json`);
    const out = path.join(ROOT, pagePath(code), "index.html");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, page(t), "utf8");
    written.push(path.relative(ROOT, out));
  }

  const base = site.baseUrl.replace(/\/+$/, "");
  const now = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
${LANGS.map((code) => `  <url><loc>${base}/${pagePath(code)}</loc><lastmod>${now}</lastmod></url>`).join("\n")}
</urlset>
`.replace("www.sitemap.org", "www.sitemaps.org");
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
  written.push("sitemap.xml");

  fs.writeFileSync(
    path.join(ROOT, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
    "utf8"
  );
  written.push("robots.txt");

  fs.writeFileSync(path.join(ROOT, ".nojekyll"), "", "utf8");

  console.log("built: " + written.join(", "));
}

build();
