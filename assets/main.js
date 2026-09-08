/*
 * The page works without this file: the résumé is plain HTML, the films are
 * links to YouTube. Everything here is an upgrade — theme, click-to-play
 * embeds (no YouTube request until someone asks for one), and the draw-in.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var STORE_THEME = "cv.theme";
  var STORE_LANG = "cv.lang";

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* private mode: preferences simply do not persist */
    }
    return null;
  }

  /* ------------------------------------------------------------- theme */

  var saved = store(STORE_THEME);
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function paintToggle(button) {
    var next = currentTheme() === "dark" ? "light" : "dark";
    button.textContent = button.getAttribute("data-label-" + next);
    button.setAttribute("aria-label", button.getAttribute("data-aria") + ": " + button.textContent);
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    paintToggle(toggle);
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store(STORE_THEME, next);
      paintToggle(toggle);
    });
  }

  /* ------------------------------------------------- language preference */

  var langLinks = document.querySelectorAll("[data-lang-switch]");
  Array.prototype.forEach.call(langLinks, function (link) {
    link.addEventListener("click", function () {
      store(STORE_LANG, link.getAttribute("data-lang-switch"));
    });
  });

  var here = root.getAttribute("lang");
  var wanted = store(STORE_LANG);
  var target = document.querySelector('[data-lang-switch="' + wanted + '"]');
  if (wanted && here && wanted !== here && target && !window.location.search) {
    window.location.replace(target.getAttribute("href"));
  }

  /* -------------------------------------------------------- film embeds */

  Array.prototype.forEach.call(document.querySelectorAll("[data-embed]"), function (frame) {
    frame.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.className = "film__embed";
      iframe.src = frame.getAttribute("data-embed") + "?autoplay=1&rel=0";
      iframe.title = frame.getAttribute("data-title") || "video";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      frame.replaceChildren(iframe);
      frame.removeAttribute("data-embed");
    });
  });

  /* ------------------------------------------------------------- reveal */

  /*
   * Deliberately a scroll handler and not an IntersectionObserver: the CSS
   * hides these blocks, so whatever shows them again has to work in every
   * context the page can end up in — in-app browsers, screenshot tools,
   * an emulated viewport that never fires an observer. A missed callback
   * here would mean a résumé nobody can read.
   */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  reveals.forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i % 4, 3) * 60 + "ms";
  });

  var ticking = false;

  function sweep() {
    ticking = false;
    var edge = (window.innerHeight || 800) * 1.05;
    reveals = reveals.filter(function (el) {
      if (el.getBoundingClientRect().top > edge) return true;
      el.classList.add("is-in");
      return false;
    });
    if (!reveals.length) {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    }
  }

  function queue() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(sweep);
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("load", queue);
  sweep();
})();
