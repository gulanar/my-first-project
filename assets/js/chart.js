/* =========================================================================
   DataLens chart engine: small, theme-aware SVG charts.
   Every chart can expose clickable regions (for "spot the trick")
   and receive red-pen annotations.
   ========================================================================= */
(function () {
  "use strict";

  const DL = window.DL;
  const NS = "http://www.w3.org/2000/svg";
  const t = (v) => DL.t(v);

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === "text") n.textContent = v;
        else if (k === "cls") n.setAttribute("class", v);
        else n.setAttribute(k, v);
      }
    }
    // Arabic labels inside an LTR chart: render them right-to-left, keeping their visual anchor
    if (tag === "text" && /[\u0600-\u06FF]/.test(n.textContent)) {
      n.setAttribute("direction", "rtl");
      const a = n.getAttribute("text-anchor") || "start";
      n.setAttribute("text-anchor", a === "start" ? "end" : a === "end" ? "start" : a);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

  function niceTicks(min, max, count) {
    count = count || 5;
    const span = max - min;
    if (span <= 0) return [min];
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const ticks = [];
    for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) {
      ticks.push(Math.round(v * 1e6) / 1e6);
    }
    return ticks;
  }

  const fmtNum = (v, unit, digits) => {
    const d = digits !== undefined ? digits : Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0;
    const s = DL.fmt(v, d);
    if (!unit) return s;
    if (unit === "%") return s + "%";
    if (unit.startsWith("$")) return "$" + s;
    return s + unit;
  };

  /* ---------------------------------------------------------------------
     Hand-drawn pen marks
     --------------------------------------------------------------------- */
  function smoothPath(pts, closed) {
    if (pts.length < 2) return "";
    let d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d +=
        " C" +
        [c1x, c1y, c2x, c2y, p2[0], p2[1]].map((n) => n.toFixed(1)).join(" ");
    }
    return closed ? d + " Z" : d;
  }

  function penEllipse(cx, cy, rx, ry, seed) {
    const rand = DL.rng(seed || 7);
    const pts = [];
    const n = 36;
    const start = -2.2 + rand() * 0.4;
    for (let i = 0; i <= n + 5; i++) {
      const a = start + (i / n) * Math.PI * 2;
      const wobble = 1 + (rand() - 0.5) * 0.07;
      const grow = 1 + (i / n) * 0.07;
      pts.push([cx + Math.cos(a) * rx * wobble * grow, cy + Math.sin(a) * ry * wobble * grow]);
    }
    return smoothPath(pts);
  }

  function drawPath(svg, d, cls) {
    const p = el("path", { d, cls: cls + " ch-draw" }, svg);
    try {
      p.style.setProperty("--len", Math.ceil(p.getTotalLength()) + 2);
    } catch (e) {
      p.style.setProperty("--len", 1600);
    }
    return p;
  }

  /** Circle a named region with a red (or green) pen and add a note. */
  function annotate(svg, regionName, note, opts) {
    opts = opts || {};
    const regions = svg.__regions || {};
    const r = regions[regionName] || opts.box;
    if (!r) return;
    const layer = svg.querySelector(".ch-notes") || el("g", { cls: "ch-notes" }, svg);
    const pad = opts.pad ?? 8;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const rx = r.w / 2 + pad;
    const ry = r.h / 2 + pad;
    drawPath(layer, penEllipse(cx, cy, rx, ry, (r.x * 13 + r.y * 7) | 0), opts.good ? "ch-greenpen" : "ch-redpen");
    if (note) {
      const W = svg.viewBox.baseVal.width;
      const H = svg.viewBox.baseVal.height;
      let nx;
      let ny;
      let anchor;
      if (opts.nx !== undefined || opts.ny !== undefined) {
        nx = opts.nx ?? cx;
        ny = opts.ny ?? cy - ry - 10;
        anchor = nx < W * 0.25 ? "start" : nx > W * 0.75 ? "end" : "middle";
        if (anchor === "start") nx = Math.max(6, nx - rx);
        if (anchor === "end") nx = Math.min(W - 6, nx + rx);
      } else if (opts.side || r.h > r.w * 1.5) {
        // tall, narrow region (an axis) or an explicit side: write the note beside it
        const leftSide = opts.side ? opts.side === "right" : cx < W / 2;
        nx = leftSide ? cx + rx + 8 : cx - rx - 8;
        anchor = leftSide ? "start" : "end";
        ny = r.y + (opts.nyFrac !== undefined ? r.h * opts.nyFrac : Math.min(46, r.h * 0.22) + 6);
      } else {
        nx = cx;
        anchor = "middle";
        ny = cy - ry - 10 >= 20 ? cy - ry - 10 : cy + ry + 20;
        if (ny > H - 6) ny = cy - ry - 10;
      }
      ny = Math.min(H - 6, Math.max(16, ny));
      const txt = el("text", { x: nx, y: ny, "text-anchor": anchor, cls: "t-pen" + (opts.good ? " t-pen--good" : ""), text: note }, layer);
      txt.style.opacity = 0;
      txt.animate &&
        txt.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: DL.reduced() ? 0 : 650, fill: "forwards" });
      if (!txt.animate) txt.style.opacity = 1;
    }
  }

  /* ---------------------------------------------------------------------
     Frame shared by axis-based charts
     --------------------------------------------------------------------- */
  function frame(spec) {
    const W = spec.w || 560;
    const H = spec.h || 360;
    const svg = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      cls: "chart",
      role: "img",
      "aria-label": t(spec.alt) || t(spec.title) || "",
    });
    svg.__regions = {};
    el("rect", { x: 0, y: 0, width: W, height: H, cls: "ch-frame", rx: 10 }, svg);

    const rtl = DL.lang() === "ar";
    const hasTitle = !!spec.title;
    const top = spec.top ?? (hasTitle ? (spec.sub ? 76 : 58) : 22);
    const bottom = spec.bottom ?? (spec.source ? 66 : 46);
    const left = spec.left ?? 60;
    const right = spec.right ?? (spec.y2 ? 62 : 24);
    const P = { x0: left, x1: W - right, y0: top, y1: H - bottom, W, H };

    if (hasTitle) {
      const tx = rtl ? W - 18 : 18;
      const anchor = rtl ? "end" : "start";
      el("text", { x: tx, y: 30, "text-anchor": anchor, cls: "t-title", text: t(spec.title) }, svg);
      if (spec.sub) el("text", { x: tx, y: 52, "text-anchor": anchor, cls: "t-sub", text: t(spec.sub) }, svg);
      svg.__regions.title = { x: 8, y: 8, w: W - 16, h: (spec.sub ? 54 : 34) };
    }
    if (spec.source) {
      el("text", { x: rtl ? W - 18 : 18, y: H - 12, "text-anchor": rtl ? "end" : "start", cls: "t-source", text: t(spec.source) }, svg);
      svg.__regions.source = { x: 8, y: H - 28, w: W - 16, h: 22 };
    }
    return { svg, P, W, H };
  }

  function addHotspots(svg, spec) {
    if (!spec.spot) return;
    const g = el("g", { cls: "ch-hots" }, svg);
    Object.keys(svg.__regions).forEach((name) => {
      const r = svg.__regions[name];
      el("rect", { x: r.x, y: r.y, width: r.w, height: r.h, rx: 8, cls: "ch-hot", "data-region": name }, g);
    });
  }

  function yAxis(svg, P, scale, ticks, opts) {
    opts = opts || {};
    const side = opts.side || "left";
    const g = el("g", {}, svg);
    ticks.forEach((v) => {
      const y = scale(v);
      if (!opts.noGrid) el("line", { x1: P.x0, x2: P.x1, y1: y, y2: y, cls: "ch-grid" }, g);
      el(
        "text",
        {
          x: side === "left" ? P.x0 - 10 : P.x1 + 10,
          y: y + 4,
          "text-anchor": side === "left" ? "end" : "start",
          cls: "t-num",
          text: fmtNum(v, opts.unit, opts.digits),
        },
        g
      );
    });
    const x = side === "left" ? P.x0 : P.x1;
    el("line", { x1: x, x2: x, y1: P.y0 - 6, y2: P.y1, cls: "ch-axis" }, g);
    if (opts.title) {
      el(
        "text",
        {
          x: side === "left" ? 14 : P.W - 14,
          y: (P.y0 + P.y1) / 2,
          "text-anchor": "middle",
          cls: "t-axis",
          transform: "rotate(" + (side === "left" ? -90 : 90) + " " + (side === "left" ? 14 : P.W - 14) + " " + (P.y0 + P.y1) / 2 + ")",
          text: t(opts.title),
        },
        g
      );
    }
    const name = side === "left" ? "yaxis" : "yaxis2";
    svg.__regions[name] =
      side === "left"
        ? { x: 4, y: P.y0 - 14, w: P.x0 - 4, h: P.y1 - P.y0 + 22 }
        : { x: P.x1, y: P.y0 - 14, w: P.W - P.x1 - 4, h: P.y1 - P.y0 + 22 };
    return g;
  }

  function xLabels(svg, P, labels, xs, opts) {
    opts = opts || {};
    const g = el("g", {}, svg);
    el("line", { x1: P.x0, x2: P.x1, y1: P.y1, y2: P.y1, cls: opts.zero ? "ch-zero" : "ch-axis" }, g);
    const every = opts.every || 1;
    labels.forEach((lab, i) => {
      if (i % every !== 0 && i !== labels.length - 1) return;
      el("text", { x: xs[i], y: P.y1 + 20, "text-anchor": "middle", cls: "t-num", text: t(lab) }, g);
    });
    svg.__regions.xaxis = { x: P.x0 - 10, y: P.y1 + 2, w: P.x1 - P.x0 + 20, h: 28 };
    return g;
  }

  function axisBreak(svg, P) {
    const x = P.x0;
    const y = P.y1 - 14;
    el("path", { d: "M" + (x - 9) + " " + (y + 4) + " l6 -6 l6 6 l6 -6", cls: "ch-axis" }, svg);
    el("path", { d: "M" + (x - 9) + " " + (y + 10) + " l6 -6 l6 6 l6 -6", cls: "ch-axis" }, svg);
  }

  /* ---------------------------------------------------------------------
     Chart types
     --------------------------------------------------------------------- */
  const types = {};

  /* Vertical bars ----------------------------------------------------- */
  types.bar = function (spec) {
    const { svg, P } = frame(spec);
    const n = spec.values.length;
    const yMin = spec.yMin ?? 0;
    const yMax = spec.yMax ?? Math.max(...spec.values) * 1.15;
    const invert = !!spec.invert;
    const scale = invert ? lin(yMin, yMax, P.y0, P.y1) : lin(yMin, yMax, P.y1, P.y0);
    const ticks = spec.ticks || niceTicks(yMin, yMax, spec.tickCount || 5);
    yAxis(svg, P, scale, ticks, { unit: spec.unit, title: spec.yTitle, digits: spec.digits });
    const band = (P.x1 - P.x0) / n;
    const bw = Math.min(band * (spec.barRatio || 0.58), 92);
    const xs = spec.values.map((_, i) => P.x0 + band * (i + 0.5));
    const g = el("g", { cls: "ch-bars" }, svg);
    spec.values.forEach((v, i) => {
      const vClamped = Math.max(yMin, Math.min(yMax, v));
      let y, h;
      if (invert) {
        y = P.y0;
        h = Math.max(0, scale(vClamped) - P.y0);
      } else {
        y = scale(vClamped);
        h = Math.max(0, P.y1 - y);
      }
      const cls = "ch-bar " + (spec.barCls ? (Array.isArray(spec.barCls) ? spec.barCls[i] || "" : spec.barCls) : "");
      const r = el("rect", { x: xs[i] - bw / 2, y, width: bw, height: h, rx: 4, cls }, g);
      if (spec.grow && !DL.reduced()) {
        r.style.transformBox = "fill-box";
        r.style.transformOrigin = invert ? "top" : "bottom";
        r.animate && r.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 700, delay: i * 70, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
      }
      if (spec.showValues !== false) {
        const ty = invert ? y + h + 16 : y - 8;
        el("text", { x: xs[i], y: ty, "text-anchor": "middle", cls: "t-val", text: fmtNum(v, spec.unit, spec.digits) }, g);
      }
    });
    xLabels(svg, P, spec.labels, xs, { zero: yMin === 0 && !invert });
    if (spec.showBreak && yMin !== 0) axisBreak(svg, P);
    svg.__regions.plot = { x: P.x0 + 4, y: P.y0, w: P.x1 - P.x0 - 8, h: P.y1 - P.y0 - 2 };
    svg.__scale = scale;
    svg.__P = P;
    addHotspots(svg, spec);
    return svg;
  };

  /* Lines (optionally area, inverted axis, uneven x, dual axis) ------- */
  types.line = function (spec) {
    const { svg, P } = frame(spec);
    if (spec.legend) P.y0 += 24;
    const vals = spec.values;
    const n = vals.length;
    const yMin = spec.yMin ?? 0;
    const yMax = spec.yMax ?? Math.max(...vals) * 1.15;
    const invert = !!spec.invert;
    const scale = invert ? lin(yMin, yMax, P.y0, P.y1) : lin(yMin, yMax, P.y1, P.y0);
    const ticks = spec.ticks || niceTicks(yMin, yMax, spec.tickCount || 5);
    yAxis(svg, P, scale, ticks, { unit: spec.unit, title: spec.yTitle, digits: spec.digits });

    let xs;
    const pad = spec.xPad ?? 22;
    if (spec.xValues) {
      const xMin = Math.min(...spec.xValues);
      const xMax = Math.max(...spec.xValues);
      const xs0 = lin(xMin, xMax, P.x0 + pad, P.x1 - pad);
      xs = spec.xValues.map(xs0);
    } else {
      const step = n > 1 ? (P.x1 - P.x0 - pad * 2) / (n - 1) : 0;
      xs = vals.map((_, i) => P.x0 + pad + step * i);
    }

    let s2;
    if (spec.y2) {
      const y2 = spec.y2;
      s2 = lin(y2.yMin, y2.yMax, P.y1, P.y0);
      yAxis(svg, P, s2, y2.ticks || niceTicks(y2.yMin, y2.yMax, 5), {
        side: "right",
        unit: y2.unit,
        title: y2.title,
        noGrid: true,
        digits: y2.digits,
      });
    }

    const pts = vals.map((v, i) => [xs[i], scale(v)]);
    if (spec.area) {
      const baseY = invert ? P.y0 : P.y1;
      const d =
        "M" + pts[0][0] + " " + baseY + " " + pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
        " L" + pts[pts.length - 1][0] + " " + baseY + " Z";
      el("path", { d, cls: "ch-area " + (spec.areaCls || "") }, svg);
    }
    const line = el("path", { d: "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"), cls: "ch-line " + (spec.lineCls || "") }, svg);
    if (spec.draw && !DL.reduced()) {
      try {
        const len = line.getTotalLength();
        line.style.strokeDasharray = len;
        line.animate && line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1100, easing: "cubic-bezier(.2,.8,.2,1)" });
      } catch (e) {
        /* ignore */
      }
    }
    if (spec.dots !== false && n <= 16) {
      pts.forEach((p) => el("circle", { cx: p[0], cy: p[1], r: 4.5, cls: "ch-dot" }, svg));
    }
    if (spec.showValues) {
      pts.forEach((p, i) =>
        el("text", { x: p[0], y: p[1] + (invert ? 20 : -12), "text-anchor": "middle", cls: "t-val", text: fmtNum(vals[i], spec.unit, spec.digits) }, svg)
      );
    }
    if (spec.values2) {
      const q = spec.values2.map((v, i) => [xs[i], scale(v)]);
      el("path", { d: "M" + q.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"), cls: "ch-line ch-line--2" }, svg);
      q.forEach((p) => el("circle", { cx: p[0], cy: p[1], r: 4.5, cls: "ch-dot ch-dot--2" }, svg));
    }
    if (spec.y2) {
      const p2 = spec.y2.values.map((v, i) => [xs[i], s2(v)]);
      el("path", { d: "M" + p2.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"), cls: "ch-line ch-line--2" }, svg);
      p2.forEach((p) => el("circle", { cx: p[0], cy: p[1], r: 4.5, cls: "ch-dot ch-dot--2" }, svg));
    }
    xLabels(svg, P, spec.labels, xs, { every: spec.labelEvery });
    if (spec.legend) {
      const rtl = DL.lang() === "ar";
      let lx = rtl ? P.x1 - 4 : P.x0 + 8;
      const ly = P.y0 - 12;
      spec.legend.forEach((item, i) => {
        const g = el("g", {}, svg);
        const label = t(item.label);
        const w = label.length * 6.6 + 26;
        const x = rtl ? lx - w : lx;
        el("rect", { x, y: ly - 9, width: 12, height: 4, rx: 2, style: "fill:var(--" + (i === 0 ? "c1" : "c2") + ")" }, g);
        el("text", { x: x + 18, y: ly - 3, cls: "t-axis", text: label }, g);
        lx = rtl ? x - 14 : x + w + 14;
      });
    }
    svg.__regions.plot = { x: P.x0 + 4, y: P.y0, w: P.x1 - P.x0 - 8, h: P.y1 - P.y0 - 2 };
    svg.__scale = scale;
    svg.__P = P;
    svg.__xs = xs;
    addHotspots(svg, spec);
    return svg;
  };

  /* Horizontal sorted bars -------------------------------------------- */
  types.hbar = function (spec) {
    const { svg, P } = frame(Object.assign({ left: spec.left ?? 130, bottom: spec.source ? 60 : 34 }, spec));
    const n = spec.values.length;
    const xMax = spec.xMax ?? Math.max(...spec.values) * 1.15;
    const scale = lin(0, xMax, P.x0, P.x1);
    const band = (P.y1 - P.y0) / n;
    const bh = Math.min(band * 0.62, 34);
    el("line", { x1: P.x0, x2: P.x0, y1: P.y0 - 4, y2: P.y1, cls: "ch-zero" }, svg);
    spec.values.forEach((v, i) => {
      const y = P.y0 + band * (i + 0.5);
      el("text", { x: P.x0 - 10, y: y + 4, "text-anchor": "end", cls: "t-axis", text: t(spec.labels[i]) }, svg);
      const cls = "ch-bar " + (spec.barCls ? (Array.isArray(spec.barCls) ? spec.barCls[i] || "" : spec.barCls) : "");
      el("rect", { x: P.x0, y: y - bh / 2, width: Math.max(0, scale(v) - P.x0), height: bh, rx: 4, cls }, svg);
      el("text", { x: scale(v) + 8, y: y + 4, cls: "t-val", text: fmtNum(v, spec.unit, spec.digits) }, svg);
    });
    svg.__regions.yaxis = { x: 4, y: P.y0 - 4, w: P.x0 - 4, h: P.y1 - P.y0 + 8 };
    svg.__regions.plot = { x: P.x0 + 2, y: P.y0 - 4, w: P.x1 - P.x0, h: P.y1 - P.y0 + 8 };
    addHotspots(svg, spec);
    return svg;
  };

  /* Flat pie ------------------------------------------------------------ */
  types.pie = function (spec) {
    const { svg, P, W } = frame(Object.assign({ bottom: spec.source ? 40 : 16 }, spec));
    const rtl = DL.lang() === "ar";
    const vals = spec.values;
    const total = vals.reduce((a, b) => a + b, 0);
    const r = Math.min((P.y1 - P.y0) / 2, (W * 0.5) / 2) - 6;
    const cx = rtl ? W - 24 - r - 10 : P.x0 + r - 30;
    const cy = (P.y0 + P.y1) / 2;
    let a = -Math.PI / 2;
    const colors = spec.colors || ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6"];
    vals.forEach((v, i) => {
      const da = (v / total) * Math.PI * 2;
      const a1 = a + da;
      const large = da > Math.PI ? 1 : 0;
      const p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const d =
        vals.length === 1
          ? "M" + (cx - r) + " " + cy + " a" + r + " " + r + " 0 1 0 " + 2 * r + " 0 a" + r + " " + r + " 0 1 0 " + -2 * r + " 0"
          : "M" + cx + " " + cy + " L" + p0[0] + " " + p0[1] + " A" + r + " " + r + " 0 " + large + " 1 " + p1[0] + " " + p1[1] + " Z";
      el("path", { d, cls: "ch-slice", style: "fill:var(" + colors[i % colors.length] + ")" }, svg);
      const mid = a + da / 2;
      const lbl = spec.pctLabels ? spec.pctLabels[i] : Math.round((v / total) * 100) + "%";
      el("text", { x: cx + r * 0.62 * Math.cos(mid), y: cy + r * 0.62 * Math.sin(mid) + 5, "text-anchor": "middle", cls: "t-onbar", text: lbl, style: "font-size:14px" }, svg);
      a = a1;
    });
    // legend
    const lx = rtl ? cx - r - 34 : cx + r + 34;
    const startY = cy - (vals.length * 30) / 2 + 12;
    vals.forEach((v, i) => {
      const y = startY + i * 30;
      el("rect", { x: rtl ? lx - 14 : lx, y: y - 11, width: 14, height: 14, rx: 3, style: "fill:var(" + colors[i % colors.length] + ")" }, svg);
      el("text", { x: rtl ? lx - 22 : lx + 22, y: y + 1, "text-anchor": rtl ? "end" : "start", cls: "t-axis", style: "font-size:13px;fill:var(--ink)", text: t(spec.labels[i]) + (spec.legendValues ? "  " + spec.legendValues[i] : "") }, svg);
    });
    svg.__regions.plot = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
    svg.__regions.legend = { x: rtl ? lx - 170 : lx - 6, y: startY - 22, w: 176, h: vals.length * 30 + 8 };
    addHotspots(svg, spec);
    return svg;
  };

  /* 3D pie with perspective, returns visible shares too ---------------- */
  function pie3dGeometry(values, o) {
    const total = values.reduce((a, b) => a + b, 0);
    const tilt = o.tilt; // 1 = seen from above, smaller = more tilted
    const rx = o.rx;
    const persp = o.flat ? 0 : 0.26 * (1 - tilt);
    const depth = o.flat ? 0 : o.depth * Math.min(1, (1 - tilt) / 0.6);
    const pt = (a, z) => [o.cx + rx * Math.cos(a) * (1 + persp * Math.sin(a)), o.cy + rx * tilt * Math.sin(a) + (z || 0)];
    const rot = (o.rotation || 0) * (Math.PI / 180);
    let a = rot - Math.PI / 2;
    const slices = values.map((v, i) => {
      const da = (v / total) * Math.PI * 2;
      const s = { i, a0: a, a1: a + da, v };
      a += da;
      return s;
    });
    const area = (poly) => {
      let s = 0;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const q = poly[(i + 1) % poly.length];
        s += p[0] * q[1] - q[0] * p[1];
      }
      return Math.abs(s) / 2;
    };
    slices.forEach((s) => {
      const steps = Math.max(4, Math.ceil(((s.a1 - s.a0) / (Math.PI * 2)) * 120));
      const top = [[o.cx, o.cy]];
      for (let k = 0; k <= steps; k++) top.push(pt(s.a0 + ((s.a1 - s.a0) * k) / steps));
      s.top = top;
      s.sides = [];
      if (depth > 0.5) {
        for (let m = -2; m <= 2; m++) {
          const lo = Math.max(s.a0, m * 2 * Math.PI);
          const hi = Math.min(s.a1, m * 2 * Math.PI + Math.PI);
          if (hi - lo > 1e-4) {
            const st = Math.max(2, Math.ceil(((hi - lo) / Math.PI) * 60));
            const up = [];
            const dn = [];
            for (let k = 0; k <= st; k++) {
              const aa = lo + ((hi - lo) * k) / st;
              up.push(pt(aa, 0));
              dn.push(pt(aa, depth));
            }
            s.sides.push(up.concat(dn.reverse()));
          }
        }
      }
      s.visible = area(s.top) + s.sides.reduce((sum, p) => sum + area(p), 0);
    });
    const visTotal = slices.reduce((sum, s) => sum + s.visible, 0);
    slices.forEach((s) => {
      s.trueShare = s.v / total;
      s.visShare = s.visible / visTotal;
    });
    return slices;
  }

  const polyD = (poly) => "M" + poly.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";

  types.pie3d = function (spec) {
    const { svg, P, W } = frame(Object.assign({ bottom: spec.source ? 40 : 16 }, spec));
    const rtl = DL.lang() === "ar";
    const colors = spec.colors || ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6"];
    const rx = spec.rx || Math.min(170, (P.x1 - P.x0) * 0.32);
    const tilt = spec.flat ? 1 : spec.tilt ?? 0.42;
    const depth = spec.depth ?? 44;
    const cx = spec.legend === false ? W / 2 : rtl ? W - 30 - rx : 30 + rx;
    const cy = (P.y0 + P.y1) / 2 - (spec.flat ? 0 : depth * 0.35);
    const slices = pie3dGeometry(spec.values, { cx, cy, rx: spec.flat ? Math.min(rx, (P.y1 - P.y0) / 2 - 4) : rx, tilt, depth, rotation: spec.rotation || 0, flat: spec.flat });
    const g = el("g", {}, svg);
    slices.forEach((s) => {
      s.sides.forEach((poly) =>
        el("path", { d: polyD(poly), cls: "ch-slice", style: "fill:var(" + colors[s.i % colors.length] + ");filter:brightness(.72)" }, g)
      );
    });
    slices.forEach((s) => {
      el("path", { d: polyD(s.top), cls: "ch-slice", style: "fill:var(" + colors[s.i % colors.length] + ")" }, g);
    });
    if (spec.pctOnSlices) {
      slices.forEach((s) => {
        const mid = (s.a0 + s.a1) / 2;
        const r = spec.flat ? Math.min(rx, (P.y1 - P.y0) / 2 - 4) : rx;
        const tl = spec.flat ? 1 : tilt;
        el("text", { x: cx + r * 0.6 * Math.cos(mid), y: cy + r * tl * 0.6 * Math.sin(mid) + 5, "text-anchor": "middle", cls: "t-onbar", style: "font-size:13px", text: Math.round(s.trueShare * 100) + "%" }, g);
      });
    }
    if (spec.legend !== false) {
      const lx = rtl ? cx - rx - 40 : cx + rx + 40;
      const startY = (P.y0 + P.y1) / 2 - (spec.values.length * 30) / 2 + 12;
      spec.values.forEach((v, i) => {
        const y = startY + i * 30;
        el("rect", { x: rtl ? lx - 14 : lx, y: y - 11, width: 14, height: 14, rx: 3, style: "fill:var(" + colors[i % colors.length] + ")" }, svg);
        el("text", { x: rtl ? lx - 22 : lx + 22, y: y + 1, "text-anchor": rtl ? "end" : "start", cls: "t-axis", style: "font-size:13px;fill:var(--ink)", text: t(spec.labels[i]) + (spec.legendPct ? "  " + Math.round((v / spec.values.reduce((a, b) => a + b, 0)) * 100) + "%" : "") }, svg);
      });
      svg.__regions.legend = { x: rtl ? lx - 150 : lx - 6, y: startY - 22, w: 156, h: spec.values.length * 30 + 8 };
    }
    svg.__regions.plot = { x: cx - rx, y: cy - rx * tilt - 4, w: rx * 2, h: rx * tilt * 2 + depth + 8 };
    svg.__slices = slices;
    addHotspots(svg, spec);
    return svg;
  };

  /* Pictogram: two houses, scaled honestly (area) or not (both sides) -- */
  function house(g, x, baseY, size, cls) {
    // drawn in a 100×100 box, anchored bottom-centre
    const s = size / 100;
    const ox = x - 50 * s;
    const oy = baseY - 100 * s;
    const P = (px, py) => (ox + px * s).toFixed(1) + " " + (oy + py * s).toFixed(1);
    el("path", { d: "M" + P(6, 50) + " L" + P(50, 8) + " L" + P(94, 50) + " Z", cls }, g);
    el("rect", { x: ox + 16 * s, y: oy + 46 * s, width: 68 * s, height: 54 * s, cls }, g);
    el("rect", { x: ox + 43 * s, y: oy + 68 * s, width: 14 * s, height: 32 * s, cls: "ch-frame" }, g);
    el("rect", { x: ox + 24 * s, y: oy + 58 * s, width: 12 * s, height: 12 * s, cls: "ch-frame" }, g);
    el("rect", { x: ox + 64 * s, y: oy + 58 * s, width: 12 * s, height: 12 * s, cls: "ch-frame" }, g);
  }

  types.pictogram = function (spec) {
    const { svg, P, W } = frame(Object.assign({ bottom: spec.source ? 66 : 44 }, spec));
    const [a, b] = spec.values;
    const base = spec.base || 82;
    const sizeA = base;
    const sizeB = spec.honest ? base * Math.sqrt(b / a) : base * (b / a);
    const baseY = P.y1;
    const xA = P.x0 + (P.x1 - P.x0) * 0.26;
    const xB = P.x0 + (P.x1 - P.x0) * 0.66;
    el("line", { x1: P.x0 - 20, x2: P.x1 + 10, y1: baseY, y2: baseY, cls: "ch-axis" }, svg);
    const g = el("g", {}, svg);
    house(g, xA, baseY, sizeA, "ch-bar ch-bar--4");
    house(g, xB, baseY, sizeB, "ch-bar");
    el("text", { x: xA, y: baseY - sizeA - 10, "text-anchor": "middle", cls: "t-val", text: t(spec.valueLabels[0]) }, svg);
    el("text", { x: xB, y: baseY - sizeB - 10, "text-anchor": "middle", cls: "t-val", text: t(spec.valueLabels[1]) }, svg);
    el("text", { x: xA, y: baseY + 20, "text-anchor": "middle", cls: "t-num", text: t(spec.labels[0]) }, svg);
    el("text", { x: xB, y: baseY + 20, "text-anchor": "middle", cls: "t-num", text: t(spec.labels[1]) }, svg);
    svg.__regions.iconA = { x: xA - sizeA / 2 - 4, y: baseY - sizeA - 2, w: sizeA + 8, h: sizeA + 2 };
    svg.__regions.iconB = { x: xB - sizeB / 2 - 4, y: baseY - sizeB - 2, w: sizeB + 8, h: sizeB + 2 };
    svg.__regions.xaxis = { x: P.x0, y: baseY + 2, w: P.x1 - P.x0, h: 26 };
    addHotspots(svg, spec);
    return svg;
  };

  /* Grouped vertical bars (several series per group) ----------------- */
  function legendRow(svg, P, items, y) {
    const rtl = DL.lang() === "ar";
    let x = rtl ? P.x1 : P.x0;
    items.forEach((it) => {
      const label = t(it.label);
      const w = label.length * 6.8 + 24;
      const bx = rtl ? x - w : x;
      el("rect", { x: bx, y: y - 10, width: 12, height: 12, rx: 3, cls: "ch-bar " + (it.cls || "") }, svg);
      el("text", { x: bx + 18, y: y, cls: "t-axis", style: "fill:var(--ink)", text: label }, svg);
      x = rtl ? bx - 16 : bx + w + 16;
    });
  }

  types.grouped = function (spec) {
    const { svg, P } = frame(spec);
    P.y0 += 24;
    const yMax = spec.yMax ?? 100;
    const scale = lin(0, yMax, P.y1, P.y0);
    yAxis(svg, P, scale, spec.ticks || niceTicks(0, yMax, 5), { unit: spec.unit });
    const G = spec.groups.length;
    const S = spec.series.length;
    const band = (P.x1 - P.x0) / G;
    const gap = 8;
    const bw = Math.min((band * 0.72 - gap * (S - 1)) / S, 70);
    const xs = spec.groups.map((_, gi) => P.x0 + band * (gi + 0.5));
    spec.series.forEach((ser, si) => {
      ser.values.forEach((v, gi) => {
        const x = xs[gi] - (S * bw + (S - 1) * gap) / 2 + si * (bw + gap);
        const y = scale(v);
        const r = el("rect", { x, y, width: bw, height: P.y1 - y, rx: 4, cls: "ch-bar " + (ser.cls || "") }, svg);
        if (spec.grow && !DL.reduced() && r.animate) {
          r.style.transformBox = "fill-box";
          r.style.transformOrigin = "bottom";
          r.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 650, delay: (gi * S + si) * 60, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
        }
        el("text", { x: x + bw / 2, y: y - 8, "text-anchor": "middle", cls: "t-val", text: fmtNum(v, spec.unit, spec.digits) }, svg);
      });
    });
    xLabels(svg, P, spec.groups, xs, { zero: true });
    legendRow(svg, P, spec.series, P.y0 - 14);
    svg.__regions.plot = { x: P.x0, y: P.y0, w: P.x1 - P.x0, h: P.y1 - P.y0 };
    addHotspots(svg, spec);
    return svg;
  };

  /* Horizontal 100% stacked bars ---------------------------------------- */
  types.stacked = function (spec) {
    const { svg, P } = frame(Object.assign({ left: 110, bottom: 24 }, spec));
    P.y0 += 24;
    const n = spec.rows.length;
    const band = (P.y1 - P.y0) / n;
    const bh = Math.min(band * 0.6, 46);
    spec.rows.forEach((row, ri) => {
      const total = row.parts.reduce((a, p) => a + p.v, 0);
      const y = P.y0 + band * (ri + 0.5) - bh / 2;
      el("text", { x: P.x0 - 12, y: y + bh / 2 + 5, "text-anchor": "end", cls: "t-axis", style: "font-size:13px;fill:var(--ink)", text: t(row.label) }, svg);
      let x = P.x0;
      row.parts.forEach((part, pi) => {
        const w = (part.v / total) * (P.x1 - P.x0);
        const r = el("rect", { x, y, width: Math.max(0, w - 2), height: bh, rx: 4, cls: "ch-bar " + (spec.series[pi].cls || "") }, svg);
        if (spec.grow && !DL.reduced() && r.animate) {
          r.style.transformBox = "fill-box";
          r.style.transformOrigin = "left";
          r.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, delay: ri * 120 + pi * 80, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
        }
        if (w > 54) el("text", { x: x + w / 2, y: y + bh / 2 + 5, "text-anchor": "middle", cls: "t-onbar", text: part.text || DL.fmt((part.v / total) * 100, 0) + "%" }, svg);
        x += w;
      });
    });
    legendRow(svg, P, spec.series, P.y0 - 14);
    addHotspots(svg, spec);
    return svg;
  };

  /* Scatter plot with optional trend line ------------------------------ */
  types.scatter = function (spec) {
    const { svg, P } = frame(Object.assign({ bottom: spec.source ? 80 : 60, left: 64 }, spec));
    const xs = lin(spec.xMin, spec.xMax, P.x0 + 10, P.x1 - 10);
    const ys = lin(spec.yMin, spec.yMax, P.y1, P.y0);
    yAxis(svg, P, ys, spec.yTicks || niceTicks(spec.yMin, spec.yMax, 5), { title: spec.yTitle });
    el("line", { x1: P.x0, x2: P.x1, y1: P.y1, y2: P.y1, cls: "ch-axis" }, svg);
    (spec.xTicks || niceTicks(spec.xMin, spec.xMax, 6)).forEach((v) =>
      el("text", { x: xs(v), y: P.y1 + 18, "text-anchor": "middle", cls: "t-num", text: fmtNum(v) }, svg)
    );
    if (spec.xTitle) el("text", { x: (P.x0 + P.x1) / 2, y: P.y1 + 42, "text-anchor": "middle", cls: "t-axis", text: t(spec.xTitle) }, svg);
    const pts = spec.points;
    if (spec.trend && pts.length > 2) {
      const n = pts.length;
      const mx = pts.reduce((a, p) => a + p.x, 0) / n;
      const my = pts.reduce((a, p) => a + p.y, 0) / n;
      const sxy = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
      const sxx = pts.reduce((a, p) => a + (p.x - mx) * (p.x - mx), 0);
      const slope = sxy / sxx;
      const icpt = my - slope * mx;
      const x0 = spec.xMin;
      const x1 = spec.xMax;
      el("line", { x1: xs(x0), y1: ys(icpt + slope * x0), x2: xs(x1), y2: ys(icpt + slope * x1), cls: "ch-line ch-line--thin", style: "stroke-dasharray:6 6;opacity:.7" }, svg);
    }
    const g = el("g", {}, svg);
    pts.forEach((p, i) => {
      const c = el("circle", { cx: xs(p.x), cy: ys(p.y), r: spec.r || 6.5, cls: "ch-dot--fill", style: p.color ? "fill:" + p.color : null }, g);
      if (spec.grow && !DL.reduced() && c.animate) {
        c.style.transformBox = "fill-box";
        c.style.transformOrigin = "center";
        c.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 400, delay: i * 18, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" });
      }
    });
    svg.__regions.plot = { x: P.x0, y: P.y0, w: P.x1 - P.x0, h: P.y1 - P.y0 };
    svg.__regions.xaxis = { x: P.x0, y: P.y1 + 2, w: P.x1 - P.x0, h: 46 };
    addHotspots(svg, spec);
    return svg;
  };

  /* ---------------------------------------------------------------------
     Public API
     --------------------------------------------------------------------- */
  function render(container, spec) {
    const fn = types[spec.type];
    if (!fn) throw new Error("Unknown chart type: " + spec.type);
    const svg = fn(spec);
    if (container) {
      container.innerHTML = "";
      container.appendChild(svg);
    }
    if (spec.notes) spec.notes.forEach((nt) => annotate(svg, nt.region, t(nt.text), nt));
    return svg;
  }

  DL.chart = { el, lin, niceTicks, fmtNum, render, annotate, penEllipse, drawPath, smoothPath, pie3dGeometry, types };
})();
