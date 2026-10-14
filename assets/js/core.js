/* =========================================================================
   DataLens core: language, theme, navigation, motion, progress, UI helpers
   ========================================================================= */
(function () {
  "use strict";

  const DL = (window.DL = window.DL || {});
  const root = document.documentElement;
  const STORE_KEY = "datalens:v1";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  DL.$ = $;
  DL.$$ = $$;
  DL.reduced = () => reduceMotion.matches;

  /* ---------------------------------------------------------------------
     Storage (always wrapped: private windows can refuse it)
     --------------------------------------------------------------------- */
  const store = {
    read() {
      try {
        return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      } catch (e) {
        return {};
      }
    },
    write(data) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch (e) {
        /* storage unavailable: keep working without persistence */
      }
    },
    get(key, fallback) {
      const data = this.read();
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : fallback;
    },
    set(key, value) {
      const data = this.read();
      data[key] = value;
      this.write(data);
    },
  };
  DL.store = store;

  /* ---------------------------------------------------------------------
     Language
     --------------------------------------------------------------------- */
  DL.lang = () => (root.lang === "en" ? "en" : "ar");

  /** Pick the active language from {ar, en}, or from two arguments. */
  DL.t = function (a, b) {
    if (b !== undefined) return DL.lang() === "ar" ? a : b;
    if (a && typeof a === "object") return a[DL.lang()] ?? a.en ?? a.ar ?? "";
    return a ?? "";
  };

  function applyLangAttributes() {
    const lang = DL.lang();
    const body = document.body;
    if (body) {
      const title = body.getAttribute("data-title-" + lang);
      if (title) document.title = title;
    }
    $$("[data-i18n-attrs]").forEach((el) => {
      el.getAttribute("data-i18n-attrs")
        .split(",")
        .forEach((attr) => {
          attr = attr.trim();
          const value = el.getAttribute("data-" + attr + "-" + lang);
          if (value !== null) el.setAttribute(attr, value);
        });
    });
    $$("[data-lang-toggle]").forEach((btn) => {
      const label = btn.querySelector(".lang-label");
      if (label) label.textContent = lang === "ar" ? "EN" : "ع";
      btn.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
      btn.setAttribute("lang", lang === "ar" ? "en" : "ar");
      btn.setAttribute("data-keep", "");
    });
  }

  DL.setLang = function (lang) {
    if (lang !== "ar" && lang !== "en") return;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    store.set("lang", lang);
    applyLangAttributes();
    document.dispatchEvent(new CustomEvent("dl:lang", { detail: { lang } }));
  };

  /** Run fn now and again whenever the language changes. */
  DL.onLang = function (fn) {
    fn(DL.lang());
    document.addEventListener("dl:lang", (e) => fn(e.detail.lang));
  };

  /* ---------------------------------------------------------------------
     Theme
     --------------------------------------------------------------------- */
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  DL.theme = () => root.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light");

  DL.setTheme = function (theme) {
    root.setAttribute("data-theme", theme);
    store.set("theme", theme);
    $$("[data-theme-toggle]").forEach((b) =>
      b.setAttribute("aria-pressed", theme === "dark" ? "true" : "false")
    );
    document.dispatchEvent(new CustomEvent("dl:theme", { detail: { theme } }));
  };

  /* ---------------------------------------------------------------------
     Icon sprite (inline so <use href="#i-…"> works from file:// too)
     --------------------------------------------------------------------- */
  const ICONS = {
    lens: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
    bars: '<path d="M3 21h18"/><rect x="5" y="11" width="3.2" height="7" rx="1"/><rect x="10.4" y="5" width="3.2" height="13" rx="1"/><rect x="15.8" y="13.5" width="3.2" height="4.5" rx="1"/>',
    line: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
    pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    alert: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    down: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4"/><circle cx="12" cy="3.5" r="1"/><path d="M9 13h.01M15 13h.01M9.5 16.5h5"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    news: '<rect x="3" y="5" width="15" height="15" rx="2"/><path d="M18 9h3v9a2 2 0 0 1-2 2"/><path d="M7 9h7M7 13h7M7 16h4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
    shield: '<path d="m12 3 8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    restart: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4.5A2.5 2.5 0 0 0 8 10M16 6h3.5A2.5 2.5 0 0 1 16 10M12 13v4M8 21h8M9.5 17h5"/>',
    flame: '<path d="M12 21c-3.9 0-7-2.7-7-6.5 0-3 2-5 3.5-6.5.3 1.6 1.2 2.7 2.5 3.2C11 7.5 12.5 5 15 3c0 3 4 5.5 4 11 0 4-3.1 7-7 7z"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h3l8 5V4L7 9H4a1 1 0 0 0-1 1z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
    tv: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 3 4 3 4-3"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><path d="M7.5 7.5h.01"/>',
    pulse: '<path d="M3 12h4l2.5-5 3.5 10 2.5-5H21"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.8 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.5-3-1.5M12 6v2M12 16v2"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    shuffle: '<path d="M3 7h3.5c2 0 3.2 1 4.5 3l2 3.5c1.2 2 2.5 3.5 4.5 3.5H21M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M14.3 8.4C15 7.5 16 7 17.5 7H21"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    cap: '<path d="m2 9 10-5 10 5-10 5L2 9z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    list: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
    pen: '<path d="m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z"/><path d="m14.5 6.5 3 3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7-2.6 0-4.3-1.3-5.7-3.5L3 14.2a1.5 1.5 0 0 1 2.4-1.8L8 15"/>',
    swipe: '<path d="M4 12h16"/><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
    plane: '<path d="M12 3c.8 0 1.5.7 1.5 1.5V9l7 4v2l-7-2v4.5l2.5 2V21L12 20l-4 1v-1.5l2.5-2V13l-7 2v-2l7-4V4.5C10.5 3.7 11.2 3 12 3z"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  };

  function injectSprite() {
    if (document.getElementById("dl-sprite")) return;
    const symbols = Object.keys(ICONS)
      .map((k) => '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + "</symbol>")
      .join("");
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<svg id="dl-sprite" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
      symbols +
      "</svg>";
    document.body.insertBefore(wrap.firstChild, document.body.firstChild);
  }

  DL.icon = (name, cls) =>
    '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';

  /* ---------------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------------- */
  DL.escape = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  DL.fmt = (v, digits = 0) =>
    Number(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

  DL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /** Deterministic pseudo-random generator, so demos look the same on every visit. */
  DL.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  DL.shuffle = function (arr, rand = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /** Tween a number with requestAnimationFrame. */
  DL.tween = function (from, to, duration, onStep, onDone) {
    if (DL.reduced() || duration <= 0) {
      onStep(to);
      if (onDone) onDone();
      return () => {};
    }
    let raf;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      onStep(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(frame);
      else if (onDone) onDone();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  };

  /* ---------------------------------------------------------------------
     Toasts & clipboard
     --------------------------------------------------------------------- */
  let toastHost;
  DL.toast = function (message, icon = "check") {
    if (!toastHost) {
      toastHost = document.createElement("div");
      toastHost.className = "toast-host";
      toastHost.setAttribute("role", "status");
      toastHost.setAttribute("aria-live", "polite");
      document.body.appendChild(toastHost);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = DL.icon(icon) + "<span></span>";
    t.querySelector("span").textContent = message;
    toastHost.appendChild(t);
    setTimeout(() => {
      t.classList.add("is-out");
      setTimeout(() => t.remove(), 320);
    }, 2400);
  };

  DL.copy = function (text) {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      ta.remove();
      return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        () => true,
        () => fallback()
      );
    }
    return Promise.resolve(fallback());
  };

  /* ---------------------------------------------------------------------
     Progress through the learning journey
     --------------------------------------------------------------------- */
  DL.progress = {
    parts: ["charts", "traps", "ai", "cases", "quiz"],
    all() {
      return store.get("progress", {});
    },
    get(page) {
      return this.all()[page] || "new";
    },
    mark(page, state) {
      const p = this.all();
      if (state === "visited" && p[page] === "done") return;
      p[page] = state;
      store.set("progress", p);
      document.dispatchEvent(new CustomEvent("dl:progress", { detail: { page, state } }));
    },
    percent() {
      const p = this.all();
      const score = this.parts.reduce((sum, k) => sum + (p[k] === "done" ? 1 : p[k] === "visited" ? 0.35 : 0), 0);
      return Math.round((score / this.parts.length) * 100);
    },
  };

  function initCompleteButtons() {
    const page = document.body.dataset.page;
    $$("[data-complete]").forEach((btn) => {
      const target = btn.getAttribute("data-complete") || page;
      const render = () => {
        const done = DL.progress.get(target) === "done";
        btn.classList.toggle("is-done", done);
        btn.setAttribute("aria-pressed", done ? "true" : "false");
        btn.innerHTML = done
          ? DL.icon("check") + "<span>" + DL.t("أنهيت هذا الجزء", "Part completed") + "</span>"
          : DL.icon("check") + "<span>" + DL.t("وضع علامة: أنهيت هذا الجزء", "Mark this part as done") + "</span>";
      };
      btn.addEventListener("click", () => {
        const done = DL.progress.get(target) === "done";
        DL.progress.mark(target, done ? "visited" : "done");
        render();
        if (!done) DL.toast(DL.t("رائع! تم حفظ تقدّمك.", "Nice! Your progress is saved."));
      });
      document.addEventListener("dl:progress", render);
      document.addEventListener("dl:lang", render);
      render();
    });
  }

  /* ---------------------------------------------------------------------
     Navigation
     --------------------------------------------------------------------- */
  function initNav() {
    const nav = $(".nav");
    if (!nav) return;
    const toggle = $(".nav__toggle", nav);
    const links = $(".nav__links", nav);
    const page = document.body.dataset.page;

    $$("[data-nav]", nav).forEach((a) => {
      if (a.dataset.nav === page) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });

    if (toggle && links) {
      const setOpen = (open) => {
        links.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.innerHTML = DL.icon(open ? "x" : "menu");
      };
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        setOpen(!links.classList.contains("is-open"));
      });
      document.addEventListener("click", (e) => {
        if (links.classList.contains("is-open") && !links.contains(e.target)) setOpen(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && links.classList.contains("is-open")) {
          setOpen(false);
          toggle.focus();
        }
      });
      $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    }

    $$("[data-lang-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => DL.setLang(DL.lang() === "ar" ? "en" : "ar"))
    );
    $$("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", DL.theme() === "dark" ? "true" : "false");
      btn.addEventListener("click", () => DL.setTheme(DL.theme() === "dark" ? "light" : "dark"));
    });
  }

  /* ---------------------------------------------------------------------
     Scroll-linked UI: progress bar, nav shadow, back-to-top
     --------------------------------------------------------------------- */
  function initScrollUI() {
    const bar = $(".read-progress");
    const nav = $(".nav");
    const toTop = $(".to-top");
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY || root.scrollTop;
      const max = root.scrollHeight - root.clientHeight;
      const p = max > 0 ? Math.min(1, y / max) : 0;
      if (bar) bar.style.setProperty("--p", p.toFixed(4));
      if (nav) nav.classList.toggle("is-scrolled", y > 8);
      if (toTop) {
        toTop.classList.toggle("is-on", y > 600);
        toTop.style.setProperty("--p", p.toFixed(4));
      }
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update);
    update();

    if (toTop) {
      toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: DL.reduced() ? "auto" : "smooth" });
        const target = $("#main") || document.body;
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    }
  }

  /* ---------------------------------------------------------------------
     Reveal on scroll, staggered groups, counters
     --------------------------------------------------------------------- */
  DL.observeReveal = function (ctx) {
    const items = $$(".reveal:not(.is-in)", ctx);
    $$("[data-stagger]", ctx).forEach((group) => {
      const step = parseInt(group.getAttribute("data-stagger"), 10) || 80;
      $$(":scope > .reveal", group).forEach((el, i) => el.style.setProperty("--d", i * step + "ms"));
    });
    if (!("IntersectionObserver" in window) || DL.reduced()) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    items.forEach((el) => io.observe(el));
  };

  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const digits = parseInt(el.getAttribute("data-digits") || "0", 10);
      const suffix = el.getAttribute("data-suffix") || "";
      DL.tween(0, target, 1600, (v) => (el.textContent = DL.fmt(v, digits) + suffix));
    };
    if (!("IntersectionObserver" in window)) return els.forEach(run);
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run(e.target);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.6 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Micro-interactions
     --------------------------------------------------------------------- */
  function initSpotlight() {
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest && e.target.closest(".spot");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      },
      { passive: true }
    );
  }

  function initRotators() {
    $$("[data-rotator]").forEach((rot) => {
      const items = $$(":scope > span", rot);
      if (items.length < 2) return;
      let i = 0;
      items[0].classList.add("is-on");
      setInterval(() => {
        if (document.hidden) return;
        const prev = items[i];
        i = (i + 1) % items.length;
        prev.classList.remove("is-on");
        prev.classList.add("is-out");
        items[i].classList.remove("is-out");
        items[i].classList.add("is-on");
        setTimeout(() => prev.classList.remove("is-out"), 600);
      }, 2600);
    });
  }

  function initTickers() {
    $$("[data-ticker]").forEach((ticker) => {
      const track = $(".ticker__track", ticker);
      if (!track || track.dataset.ready) return;
      track.dataset.ready = "1";
      Array.from(track.children).forEach((child) => {
        const clone = child.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });
      const setSpeed = () => {
        const w = track.scrollWidth / 2;
        track.style.setProperty("--dur", Math.max(30, w / 55) + "s");
      };
      setSpeed();
      document.addEventListener("dl:lang", setSpeed);
    });
  }

  /** Keep the filled part of a range track in sync with its value. */
  DL.syncRange = function (input) {
    const min = parseFloat(input.min || 0);
    const max = parseFloat(input.max || 100);
    const v = parseFloat(input.value);
    input.style.setProperty("--fill", ((v - min) / (max - min)) * 100 + "%");
  };

  function initRanges() {
    $$(".range").forEach((r) => DL.syncRange(r));
    document.addEventListener("input", (e) => {
      if (e.target.classList && e.target.classList.contains("range")) DL.syncRange(e.target);
    });
  }

  /** Segmented control: buttons inside .seg with data-value. */
  DL.seg = function (el, onChange) {
    const buttons = $$("button", el);
    const set = (value, silent) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === String(value) ? "true" : "false"));
      if (!silent && onChange) onChange(value);
    };
    buttons.forEach((b) => b.addEventListener("click", () => set(b.dataset.value)));
    return { set };
  };

  /** Filter chips that toggle visibility of tagged items. */
  DL.filterChips = function (group, items, onChange) {
    const chips = $$("[data-filter]", group);
    const apply = (value) => {
      chips.forEach((c) => c.setAttribute("aria-pressed", c.dataset.filter === value ? "true" : "false"));
      let shown = 0;
      items().forEach((item) => {
        const tags = (item.getAttribute("data-tags") || "").split(/\s+/);
        const on = value === "all" || tags.includes(value);
        item.classList.toggle("is-hidden", !on);
        item.hidden = !on;
        if (on) {
          item.style.animation = "none";
          void item.offsetWidth;
          item.style.animation = "";
          shown++;
        }
      });
      if (onChange) onChange(value, shown);
    };
    chips.forEach((c) => c.addEventListener("click", () => apply(c.dataset.filter)));
    return { apply };
  };

  /* ---------------------------------------------------------------------
     Modal (<dialog>)
     --------------------------------------------------------------------- */
  DL.modal = function (dialog) {
    if (!dialog) return null;
    let lastFocus = null;
    const close = () => {
      if (dialog.open) dialog.close();
    };
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) close();
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    });
    $$("[data-close]", dialog).forEach((b) => b.addEventListener("click", close));
    return {
      open() {
        lastFocus = document.activeElement;
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
        document.body.style.overflow = "hidden";
      },
      close,
      el: dialog,
    };
  };

  /* ---------------------------------------------------------------------
     Confetti burst for good scores
     --------------------------------------------------------------------- */
  DL.confetti = function () {
    if (DL.reduced()) return;
    const canvas = document.createElement("canvas");
    canvas.className = "confetti";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (canvas.width = innerWidth * dpr);
    const H = (canvas.height = innerHeight * dpr);
    const styles = getComputedStyle(root);
    const colors = ["--c1", "--c2", "--c3", "--c5", "--c6"].map((v) => styles.getPropertyValue(v).trim() || "#1e4fd6");
    const parts = Array.from({ length: 160 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3,
      y: H * 0.35,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (-Math.random() * 14 - 6) * dpr,
      s: (Math.random() * 6 + 4) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const start = performance.now();
    const frame = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += 0.35 * dpr;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - t / 2600);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (t < 2600) requestAnimationFrame(frame);
      else canvas.remove();
    };
    requestAnimationFrame(frame);
  };

  /* ---------------------------------------------------------------------
     Sub-navigation scroll spy
     --------------------------------------------------------------------- */
  function initSubnav() {
    const links = $$(".subnav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) map.set(sec, a);
    });
    const setActive = (a) => {
      links.forEach((l) => l.classList.toggle("is-active", l === a));
      if (a && a.scrollIntoView) {
        const list = a.closest(".subnav__list");
        if (list) {
          const lr = list.getBoundingClientRect();
          const ar = a.getBoundingClientRect();
          if (ar.left < lr.left || ar.right > lr.right) {
            list.scrollBy({ left: ar.left - lr.left - 24, behavior: "smooth" });
          }
        }
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(map.get(e.target));
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    map.forEach((_, sec) => io.observe(sec));
  }

  /* ---------------------------------------------------------------------
     Page transitions between the site's own pages
     --------------------------------------------------------------------- */
  function initTransitions() {
    const veil = document.createElement("div");
    veil.className = "veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || /^[a-z]+:/i.test(href)) return;
      if (!/\.html(#.*)?$/i.test(href.split("?")[0])) return;
      if (DL.reduced()) return;
      e.preventDefault();
      root.classList.add("is-leaving");
      setTimeout(() => {
        window.location.href = a.href;
      }, 260);
    });
    window.addEventListener("pageshow", () => root.classList.remove("is-leaving"));
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  function boot() {
    injectSprite();
    applyLangAttributes();
    initNav();
    initScrollUI();
    DL.observeReveal(document);
    initCounters();
    initSpotlight();
    initRotators();
    initTickers();
    initRanges();
    initSubnav();
    initTransitions();
    initCompleteButtons();

    const page = document.body.dataset.page;
    if (page && DL.progress.parts.includes(page)) DL.progress.mark(page, "visited");

    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    darkQuery.addEventListener &&
      darkQuery.addEventListener("change", () => {
        if (!root.getAttribute("data-theme")) document.dispatchEvent(new CustomEvent("dl:theme"));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
