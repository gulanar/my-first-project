/* DataLens · Part 1: misleading charts */
(function () {
  "use strict";
  const DL = window.DL;
  const C = DL.chart;
  const { $, $$ } = DL;
  const t = DL.t;

  const MONTHS = {
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  };
  const pctStr = (v, digits) => (v > 0 ? "+" : v < 0 ? "−" : "") + DL.fmt(Math.abs(v), digits) + "%";

  /* =======================================================================
     Lab 1 · Truncated axis
     ======================================================================= */
  function initTruncated() {
    const host = $("#truncChart");
    if (!host) return;
    const input = $("#truncMin");
    const out = $("#truncMinOut");
    const pen = $("#truncPen");
    const A = 86;
    const B = 89;
    const yMax = 90;
    let yMin = +input.value;
    let stopTween = null;

    const presets = DL.seg($("#truncPresets"), (v) => animateTo(+v));

    function ticksFor(lo) {
      const nice = C.niceTicks(lo, yMax, 5);
      const step = nice.length > 1 ? nice[1] - nice[0] : 10;
      return [lo].concat(nice.filter((v) => v > lo + step * 0.45));
    }

    function render() {
      const svg = C.render(host, {
        type: "bar",
        w: 560,
        h: 360,
        title: { ar: "رضا العملاء", en: "Customer satisfaction" },
        sub: { ar: "نسبة العملاء الراضين، 2025", en: "Share of satisfied customers, 2025" },
        labels: [
          { ar: "العلامة (أ)", en: "Brand A" },
          { ar: "العلامة (ب)", en: "Brand B" },
        ],
        values: [A, B],
        yMin,
        yMax,
        ticks: ticksFor(yMin),
        unit: "%",
        barCls: ["ch-bar--4", ""],
        barRatio: 0.46,
      });
      if (pen.checked && yMin > 0) {
        const P = svg.__P;
        C.annotate(svg, "axisStart", t({ ar: "يبدأ من " + yMin + "%!", en: "starts at " + yMin + "%!" }), {
          box: { x: 10, y: P.y1 - 12, w: P.x0 - 12, h: 22 },
          ny: P.y1 + 40,
        });
      }

      out.textContent = yMin + "%";
      const real = (B - A) / A;
      const visual = (B - A) / (A - yMin);
      const lie = visual / real;
      $("#truncVisual").textContent = pctStr(visual * 100, visual * 100 < 10 ? 1 : 0);
      $("#truncLie").textContent = DL.fmt(lie, lie < 10 ? 1 : 0);
      $("#truncPin").style.setProperty("--v", DL.clamp((Math.log10(lie) / 2) * 100, 0, 100) + "%");
      $("#truncVisualBox").classList.toggle("is-bad", lie > 1.5);
      const lieBox = $("#truncLieBox");
      lieBox.classList.toggle("is-bad", lie > 1.5);
      lieBox.classList.toggle("is-good", lie <= 1.05);

      const ratio = (B - yMin) / (A - yMin);
      const v = $("#truncVerdict");
      let cls;
      let msg;
      if (lie <= 1.05) {
        cls = "verdict--good";
        msg = {
          ar: "<strong>رسم صادق.</strong> الأعمدة تبدأ من الصفر، فتطابق أطوالُها الأرقام: العلامة (ب) متقدمة بـ3 نقاط فقط.",
          en: "<strong>Honest.</strong> The bars start at zero, so their lengths match the numbers: brand B is only 3 points ahead.",
        };
      } else if (lie <= 3) {
        cls = "verdict--warn";
        msg = {
          ar: "<strong>بدأ التضليل.</strong> عمود (ب) يبدو أطول بنسبة " + DL.fmt(visual * 100, 0) + "%، والفرق الحقيقي 3.5% فقط.",
          en: "<strong>Already misleading.</strong> Brand B's bar looks " + DL.fmt(visual * 100, 0) + "% longer, but the real gap is 3.5%.",
        };
      } else {
        cls = "verdict--bad";
        msg = {
          ar: "<strong>تضليل صارخ.</strong> عمود (ب) يبدو أكبر بـ" + DL.fmt(ratio, 1) + " مرة. فرق 3 نقاط صار يبدو كاكتساح، وقد يكتب إعلان: «(ب) يسحق (أ)».",
          en: "<strong>Badly misleading.</strong> Brand B's bar looks " + DL.fmt(ratio, 1) + "× as big. A 3-point gap now looks like a landslide, and an ad could say \"B crushes A\".",
        };
      }
      v.className = "verdict " + cls;
      v.innerHTML = DL.icon(cls === "verdict--good" ? "check" : "alert") + "<div>" + t(msg) + "</div>";
      presets.set(String(yMin), true);
    }

    function animateTo(target) {
      if (stopTween) stopTween();
      stopTween = DL.tween(yMin, target, 650, (x) => {
        yMin = Math.round(x);
        input.value = yMin;
        DL.syncRange(input);
        render();
      });
    }

    input.addEventListener("input", () => {
      if (stopTween) stopTween();
      yMin = +input.value;
      render();
    });
    pen.addEventListener("change", render);
    DL.onLang(render);
  }

  /* =======================================================================
     Lab 2 · Cherry-picked range
     ======================================================================= */
  function initCherry() {
    const host = $("#cherryChart");
    if (!host) return;
    const overview = $("#cherryOverview");
    const N = 120;
    const rand = DL.rng(2026);
    const series = [];
    let price = 40;
    for (let i = 0; i < N; i++) {
      let g = 0.011 + (rand() - 0.5) * 0.06;
      if (i >= 60 && i <= 68) g -= 0.05;
      if (i >= 69 && i <= 82) g += 0.03;
      if (i >= 116) g -= 0.035;
      price *= 1 + g;
      series.push(Math.round(price * 100) / 100);
    }
    const argmax = (a, b) => {
      let k = a;
      for (let i = a; i <= b; i++) if (series[i] > series[k]) k = i;
      return k;
    };
    const argmin = (a, b) => {
      let k = a;
      for (let i = a; i <= b; i++) if (series[i] < series[k]) k = i;
      return k;
    };
    const peak = argmax(52, 64);
    const trough = argmin(62, 74);
    const peak2 = argmax(trough, 92);
    const PRESETS = { last: [N - 5, N - 1], crash: [peak, trough], rebound: [trough, peak2], all: [0, N - 1] };
    const change = (a, b) => ((series[b] - series[a]) / series[a]) * 100;
    const monthLabel = (i, short) => {
      const y = 2016 + Math.floor(i / 12);
      const m = i % 12;
      return {
        ar: MONTHS.ar[m] + " " + y,
        en: MONTHS.en[m] + " " + (short ? "’" + String(y).slice(2) : y),
      };
    };

    let a = 0;
    let b = N - 1;
    const presetSeg = DL.seg($("#cherryPresets"), (v) => setWindow(PRESETS[v][0], PRESETS[v][1], true));

    function headline(p) {
      const n = DL.fmt(Math.abs(p), 0);
      if (p >= 40) return { cls: "txt-truth", ar: "سهم نوفاتك يحلّق " + n + "%! المستثمرون يحتفلون", en: "NovaTech SOARS " + n + "%! Investors celebrate" };
      if (p >= 10) return { cls: "txt-truth", ar: "نوفاتك يصعد " + n + "% بثبات", en: "NovaTech climbs a steady " + n + "%" };
      if (p > -5) return { cls: "", ar: "نوفاتك يراوح مكانه", en: "NovaTech is going nowhere" };
      if (p > -20) return { cls: "txt-trick", ar: "نوفاتك يتراجع " + n + "%: هل انتهى الحلم؟", en: "NovaTech slides " + n + "%: is the party over?" };
      return { cls: "txt-trick", ar: "انهيار! سهم نوفاتك يهوي " + n + "%", en: "CRASH! NovaTech plunges " + n + "%" };
    }

    function renderMain() {
      const vals = series.slice(a, b + 1);
      const n = vals.length;
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const pad = (hi - lo) * 0.14 || 2;
      const yMin = Math.max(0, Math.floor(lo - pad));
      const yMax = Math.ceil(hi + pad);
      const long = n > 30;
      const labels = vals.map((_, k) => {
        const i = a + k;
        if (long) return i % 12 === 0 ? String(2016 + i / 12) : "";
        return monthLabel(i, true);
      });
      const p = change(a, b);
      C.render(host, {
        type: "line",
        w: 560,
        h: 300,
        labels,
        values: vals,
        yMin,
        yMax,
        tickCount: 4,
        unit: "$",
        lineCls: p < 0 ? "ch-line--trick" : "",
        labelEvery: long ? 1 : Math.max(1, Math.ceil(n / 5)),
        dots: n <= 16,
        xPad: 14,
        alt: t({ ar: "سعر السهم في النافذة المختارة", en: "Share price in the selected window" }),
      });
    }

    const OW = 560;
    const OH = 92;
    const OP = 14;
    const ox = (i) => OP + (i / (N - 1)) * (OW - OP * 2);
    function renderOverview() {
      const lo = Math.min(...series);
      const hi = Math.max(...series);
      const oy = (v) => 10 + (1 - (v - lo) / (hi - lo)) * (OH - 34);
      const svg = C.el("svg", { viewBox: "0 0 " + OW + " " + OH, cls: "chart", "aria-hidden": "true", style: "touch-action:none;cursor:grab" });
      C.el("rect", { x: 0, y: 0, width: OW, height: OH, rx: 10, cls: "ch-frame" }, svg);
      for (let yr = 0; yr < 10; yr++) {
        const x = ox(yr * 12);
        C.el("line", { x1: x, x2: x, y1: 6, y2: OH - 20, cls: "ch-grid" }, svg);
        C.el("text", { x: x + 3, y: OH - 6, cls: "t-num", style: "font-size:10px", text: String(2016 + yr) }, svg);
      }
      C.el("path", { d: "M" + series.map((v, i) => ox(i).toFixed(1) + " " + oy(v).toFixed(1)).join(" L"), cls: "ch-line ch-line--thin" }, svg);
      const xa = ox(a);
      const xb = ox(b);
      C.el("rect", { x: 0, y: 0, width: Math.max(0, xa), height: OH, style: "fill:var(--paper);opacity:.72" }, svg);
      C.el("rect", { x: xb, y: 0, width: Math.max(0, OW - xb), height: OH, style: "fill:var(--paper);opacity:.72" }, svg);
      C.el("rect", { x: xa, y: 3, width: Math.max(2, xb - xa), height: OH - 22, rx: 6, style: "fill:var(--marker);stroke:var(--amber);stroke-width:2" }, svg);
      [xa, xb].forEach((x) => C.el("rect", { x: x - 4, y: 22, width: 8, height: OH - 62, rx: 4, style: "fill:var(--ink)" }, svg));
      overview.innerHTML = "";
      overview.appendChild(svg);
      return svg;
    }

    function update() {
      renderMain();
      renderOverview();
      const p = change(a, b);
      const all = change(0, N - 1);
      const h = headline(p);
      const hl = $("#cherryHeadline");
      hl.className = h.cls;
      hl.textContent = "“" + t(h) + "”";
      const ra = monthLabel(a);
      const rb = monthLabel(b);
      $("#cherryRange").textContent = t(ra) + " → " + t(rb);
      $("#cherryWin").textContent = pctStr(p, 0);
      $("#cherryWinBox").className = "readout " + (p < 0 ? "is-bad" : "is-good");
      $("#cherryAll").textContent = pctStr(all, 0);
      overview.setAttribute("aria-valuenow", a);
      overview.setAttribute("aria-valuetext", t(ra) + " – " + t(rb));

      const months = b - a + 1;
      const v = $("#cherryVerdict");
      if (a === 0 && b === N - 1) {
        v.className = "verdict verdict--good";
        v.innerHTML =
          DL.icon("check") +
          "<div>" +
          t({
            ar: "<strong>هذه الصورة الكاملة:</strong> ارتفاع بنسبة " + DL.fmt(all, 0) + "% في 10 سنوات، مع انهيار بنسبة " + DL.fmt(Math.abs(change(peak, trough)), 0) + "% في الطريق. أي نافذة أقصر تروي جزءًا من القصة فقط.",
            en: "<strong>This is the full record:</strong> up " + DL.fmt(all, 0) + "% in 10 years, with a " + DL.fmt(Math.abs(change(peak, trough)), 0) + "% crash along the way. Any shorter window tells only part of the story.",
          }) +
          "</div>";
      } else {
        const mismatch = Math.sign(p) !== Math.sign(all) || Math.abs(p) > Math.abs(all) * 0.5;
        v.className = "verdict " + (mismatch ? "verdict--bad" : "verdict--warn");
        v.innerHTML =
          DL.icon("alert") +
          "<div>" +
          t({
            ar: "<strong>نافذة منتقاة:</strong> تعرض " + months + " شهرًا من أصل 120. العنوان المبني عليها يتجاهل " + (120 - months) + " شهرًا، والاتجاه في 10 سنوات هو " + pctStr(all, 0) + ".",
            en: "<strong>A hand-picked window:</strong> it shows " + months + " of 120 months. A headline built on it ignores the other " + (120 - months) + ", and the 10-year trend is " + pctStr(all, 0) + ".",
          }) +
          "</div>";
      }
      const match = Object.keys(PRESETS).find((k) => PRESETS[k][0] === a && PRESETS[k][1] === b);
      presetSeg.set(match || "", true);
    }

    let stopTween = null;
    function setWindow(na, nb, animate) {
      na = Math.round(DL.clamp(na, 0, N - 4));
      nb = Math.round(DL.clamp(nb, na + 3, N - 1));
      if (stopTween) stopTween();
      if (!animate) {
        a = na;
        b = nb;
        update();
        return;
      }
      const a0 = a;
      const b0 = b;
      stopTween = DL.tween(0, 1, 600, (k) => {
        a = Math.round(a0 + (na - a0) * k);
        b = Math.round(b0 + (nb - b0) * k);
        update();
      });
    }

    // Dragging on the overview
    let drag = null;
    const toIndex = (e) => {
      const r = overview.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * OW;
      return DL.clamp(((vx - OP) / (OW - OP * 2)) * (N - 1), 0, N - 1);
    };
    overview.addEventListener("pointerdown", (e) => {
      const i = toIndex(e);
      const r = overview.getBoundingClientRect();
      const tol = (12 / r.width) * OW * ((N - 1) / (OW - OP * 2));
      if (Math.abs(i - a) <= tol) drag = { mode: "left" };
      else if (Math.abs(i - b) <= tol) drag = { mode: "right" };
      else if (i > a && i < b) drag = { mode: "move", offset: i - a };
      else {
        const w = b - a;
        setWindow(i - w / 2, i + w / 2);
        drag = { mode: "move", offset: w / 2 };
      }
      overview.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    overview.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const i = toIndex(e);
      if (drag.mode === "left") setWindow(Math.min(i, b - 3), b);
      else if (drag.mode === "right") setWindow(a, Math.max(i, a + 3));
      else {
        const w = b - a;
        const na = DL.clamp(i - drag.offset, 0, N - 1 - w);
        setWindow(na, na + w);
      }
    });
    const end = () => (drag = null);
    overview.addEventListener("pointerup", end);
    overview.addEventListener("pointercancel", end);
    overview.addEventListener("keydown", (e) => {
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const step = e.altKey ? 12 : 1;
      if (e.shiftKey) setWindow(a, b + dir * step);
      else {
        const w = b - a;
        const na = DL.clamp(a + dir * step, 0, N - 1 - w);
        setWindow(na, na + w);
      }
    });

    DL.onLang(update);
  }

  /* =======================================================================
     Lab 3 · 3D pie
     ======================================================================= */
  function initPie() {
    const host = $("#pieChart");
    if (!host) return;
    const tilt = $("#pieTilt");
    const rot = $("#pieRot");
    const values = [27, 25, 25, 23];
    const labels = [
      { ar: "ألفا", en: "Alpha" },
      { ar: "بيتا", en: "Beta" },
      { ar: "غاما", en: "Gamma" },
      { ar: "دلتا", en: "Delta" },
    ];
    const colors = ["--c1", "--c2", "--c3", "--c4"];
    let mode = "3d";
    DL.seg($("#pieMode"), (v) => {
      mode = v;
      render();
    });
    const title = { ar: "ما تطبيق الدراسة الذي تستخدمه أكثر؟", en: "Which study app do you use most?" };
    const sub = { ar: "استطلاع لـ400 طالب (توضيحي)", en: "Survey of 400 students (illustrative)" };

    function render() {
      $("#pieTiltCtl").hidden = mode !== "3d";
      $("#pieRotCtl").hidden = mode !== "3d";
      $("#pieTiltOut").textContent = tilt.value + "°";
      $("#pieRotOut").textContent = rot.value + "°";
      let rows;
      if (mode === "bars") {
        const order = values.map((v, i) => i).sort((x, y) => values[y] - values[x]);
        C.render(host, {
          type: "hbar",
          w: 560,
          h: 330,
          title,
          sub,
          labels: order.map((i) => labels[i]),
          values: order.map((i) => values[i]),
          xMax: 32,
          unit: "%",
          left: 90,
          barCls: order.map((i) => ["", "ch-bar--2", "ch-bar--3", "ch-bar--4"][i]),
        });
        rows = values.map((v, i) => ({ i, trueShare: v / 100, visShare: v / 100 }));
      } else {
        const svg = C.render(host, {
          type: "pie3d",
          w: 560,
          h: 360,
          title,
          sub,
          values,
          labels,
          colors,
          flat: mode === "flat",
          tilt: Math.cos((+tilt.value * Math.PI) / 180),
          rotation: +rot.value,
          depth: 46,
          pctOnSlices: true,
        });
        rows = svg.__slices;
      }

      const body = $("#pieTable");
      body.innerHTML = rows
        .map((s) => {
          const tr = s.trueShare * 100;
          const vs = s.visShare * 100;
          const diff = vs - tr;
          const cls = diff > 1.5 ? "txt-trick" : diff < -1.5 ? "txt-lens" : "txt-truth";
          return (
            "<tr><td><i style=\"display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:8px;background:var(" +
            colors[s.i] +
            ')"></i>' +
            DL.escape(t(labels[s.i])) +
            '</td><td class="mono">' +
            DL.fmt(tr, 0) +
            '%</td><td class="mono ' +
            cls +
            '">' +
            DL.fmt(vs, 1) +
            "%" +
            (Math.abs(diff) > 1.5 ? " " + (diff > 0 ? "▲" : "▼") : "") +
            "</td></tr>"
          );
        })
        .join("");

      const v = $("#pieVerdict");
      if (mode === "3d") {
        const top = rows.reduce((m, s) => (s.visShare > m.visShare ? s : m), rows[0]);
        const smallest = values.indexOf(Math.min(...values));
        const inflated = top.visShare * 100 - top.trueShare * 100;
        if (inflated > 1.5) {
          v.className = "verdict verdict--bad";
          v.innerHTML =
            DL.icon("alert") +
            "<div>" +
            (top.i === smallest
              ? t({
                  ar: "<strong>" + t(labels[top.i]) + "</strong> هي الأصغر فعليًا (" + DL.fmt(top.trueShare * 100, 0) + "%) لكنها تأخذ " + DL.fmt(top.visShare * 100, 0) + "% من الحبر لأنها في المقدمة. أصغر خيار يبدو الأكبر!",
                  en: "<strong>" + t(labels[top.i]) + "</strong> is actually the smallest (" + DL.fmt(top.trueShare * 100, 0) + "%) but takes " + DL.fmt(top.visShare * 100, 0) + "% of the ink because it sits at the front. The smallest option looks the biggest!",
                })
              : t({
                  ar: "<strong>" + t(labels[top.i]) + "</strong> تبدو الأكبر بـ" + DL.fmt(top.visShare * 100, 0) + "% من الحبر، مع أن حصتها الحقيقية " + DL.fmt(top.trueShare * 100, 0) + "%. دوّر الفطيرة وشاهد «الفائز» يتغيّر.",
                  en: "<strong>" + t(labels[top.i]) + "</strong> looks biggest with " + DL.fmt(top.visShare * 100, 0) + "% of the ink, though its true share is " + DL.fmt(top.trueShare * 100, 0) + "%. Rotate the pie and watch the \"winner\" change.",
                })) +
            "</div>";
        } else {
          v.className = "verdict verdict--warn";
          v.innerHTML = DL.icon("info") + "<div>" + t({ ar: "قلّل الإمالة يُقلّ التشويه. زد الإمالة لترى الشريحة الأمامية تتضخم.", en: "Less tilt, less distortion. Add tilt to watch the front slice swell." }) + "</div>";
        }
      } else if (mode === "flat") {
        v.className = "verdict verdict--warn";
        v.innerHTML =
          DL.icon("info") +
          "<div>" +
          t({
            ar: "<strong>أفضل:</strong> من الأعلى تطابق مساحة كل شريحة حصتها تمامًا. لكن مقارنة 27% بـ25% بالزوايا ما زالت صعبة؛ الأعمدة أوضح.",
            en: "<strong>Better:</strong> seen from above, each slice's area matches its share exactly. Comparing 27% with 25% by angle is still hard, though; bars make it easy.",
          }) +
          "</div>";
      } else {
        v.className = "verdict verdict--good";
        v.innerHTML =
          DL.icon("check") +
          "<div>" +
          t({
            ar: "<strong>الأوضح:</strong> أعمدة مرتّبة من الأكبر إلى الأصغر تجعل الفروق الصغيرة سهلة القراءة. والنتيجة الحقيقية: سباق متقارب جدًا.",
            en: "<strong>Clearest:</strong> bars sorted from largest to smallest make small differences easy to read. The real result is a very close race.",
          }) +
          "</div>";
      }
    }

    tilt.addEventListener("input", render);
    rot.addEventListener("input", render);
    DL.onLang(render);
  }

  /* =======================================================================
     Spot the trick
     ======================================================================= */
  const REGION = {
    title: { ar: "العنوان والعنوان الفرعي", en: "Title and subtitle" },
    yaxis: { ar: "المحور الرأسي", en: "Vertical axis" },
    yaxis2: { ar: "المحور الأيمن", en: "Right-hand axis" },
    xaxis: { ar: "المحور الأفقي", en: "Horizontal axis" },
    plot: { ar: "منطقة الرسم", en: "Chart area" },
    legend: { ar: "مفتاح الرسم", en: "Legend" },
    iconA: { ar: "الصورة الأولى", en: "First picture" },
    iconB: { ar: "الصورة الثانية", en: "Second picture" },
    source: { ar: "سطر المصدر", en: "Source line" },
  };
  const MISS = {
    title: { ar: "العنوان يصنع الانطباع، لكن الخدعة هنا في طريقة رسم البيانات.", en: "The title sets the mood, but this trick is in how the data is drawn." },
    plot: { ar: "الأشكال تتبع قاعدة ما. ابحث عن القاعدة: المحاور والأرقام والمقياس.", en: "The shapes follow a rule. Find the rule: check the axes, the numbers and the scale." },
    xaxis: { ar: "المحور الأفقي ليس المشكلة في هذا الرسم.", en: "The horizontal axis isn't the problem in this chart." },
    yaxis: { ar: "هذا المحور سليم في هذا الرسم.", en: "This axis is fine in this chart." },
    yaxis2: { ar: "هذا المحور سليم في هذا الرسم.", en: "This axis is fine in this chart." },
    legend: { ar: "المفتاح يسمّي الأجزاء فقط. انظر إلى الأرقام نفسها.", en: "The legend only names the parts. Look at the numbers themselves." },
    iconA: { ar: "هذه الصورة هي نقطة المقارنة. قارنها بالأخرى.", en: "This picture is the baseline. Compare it with the other one." },
    iconB: { ar: "انظر إلى الصورة الأخرى.", en: "Look at the other picture." },
    source: { ar: "اقرأ المصدر دائمًا، لكن الخدعة في مكان آخر.", en: "Always read the source, but the trick is elsewhere." },
  };
  const M6 = [0, 1, 2, 3, 4, 5].map((m) => ({ ar: MONTHS.ar[m], en: MONTHS.en[m] }));

  const SPOTS = [
    {
      id: "invert",
      name: { ar: "البطالة", en: "Unemployment" },
      trickName: { ar: "المحور المقلوب", en: "Inverted axis" },
      trick: ["yaxis"],
      note: { ar: "الصفر في الأعلى!", en: "zero is at the top!" },
      spec: {
        type: "line",
        title: { ar: "البطالة تسير في الاتجاه الصحيح", en: "Unemployment is heading the right way" },
        sub: { ar: "معدل البطالة، 2019–2024 (توضيحي)", en: "Unemployment rate, 2019–2024 (illustrative)" },
        labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
        values: [4.1, 4.6, 5.2, 5.9, 6.4, 6.8],
        yMin: 0,
        yMax: 8,
        ticks: [0, 2, 4, 6, 8],
        unit: "%",
        invert: true,
        area: true,
        areaCls: "ch-area--trick",
        lineCls: "ch-line--trick",
        showValues: true,
        digits: 1,
      },
      honest: {
        type: "line",
        title: { ar: "البطالة ارتفعت من 4.1% إلى 6.8%", en: "Unemployment rose from 4.1% to 6.8%" },
        sub: { ar: "معدل البطالة، 2019–2024 (توضيحي)", en: "Unemployment rate, 2019–2024 (illustrative)" },
        labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
        values: [4.1, 4.6, 5.2, 5.9, 6.4, 6.8],
        yMin: 0,
        yMax: 8,
        ticks: [0, 2, 4, 6, 8],
        unit: "%",
        area: true,
        showValues: true,
        digits: 1,
      },
      hint: { ar: "اقرأ أرقام المحور الرأسي من الأعلى إلى الأسفل. أين الصفر؟", en: "Read the vertical axis from top to bottom. Where is zero?" },
      explain: {
        ar: "المحور الرأسي مقلوب: 0% في الأعلى و8% في الأسفل. الخط ينزل بينما البطالة ترتفع فعليًا من 4.1% إلى 6.8%. نعتاد أن «الأعلى = أكثر»، فنقرأ الرسم عكس معناه.",
        en: "The vertical axis is upside down: 0% at the top and 8% at the bottom. The line falls while unemployment actually rises from 4.1% to 6.8%. We expect up to mean more, so we read the chart backwards.",
      },
      ask: { ar: "اسأل: في أي اتجاه تكبر الأرقام على هذا المحور؟", en: "Ask: which way do the numbers grow on this axis?" },
    },
    {
      id: "picto",
      name: { ar: "أسعار المنازل", en: "Home prices" },
      trickName: { ar: "تكبير المساحة", en: "Area scaling" },
      trick: ["iconB"],
      note: { ar: "مساحة ×4", en: "4× the area" },
      noteOpts: { side: "right", nyFrac: 0.55 },
      spec: {
        type: "pictogram",
        title: { ar: "متوسط سعر المنزل تضاعف!", en: "Average home price DOUBLED!" },
        sub: { ar: "متوسط السعر، 2005 مقابل 2025 (توضيحي)", en: "Average price, 2005 vs 2025 (illustrative)" },
        values: [1, 2],
        valueLabels: [
          { ar: "150 ألف دولار", en: "$150k" },
          { ar: "300 ألف دولار", en: "$300k" },
        ],
        labels: ["2005", "2025"],
        base: 84,
      },
      honest: {
        type: "bar",
        title: { ar: "متوسط سعر المنزل تضاعف", en: "Average home price doubled" },
        sub: { ar: "متوسط السعر بآلاف الدولارات (توضيحي)", en: "Average price, thousands of dollars (illustrative)" },
        labels: ["2005", "2025"],
        values: [150, 300],
        yMin: 0,
        yMax: 350,
        ticks: [0, 100, 200, 300],
        barCls: ["ch-bar--4", ""],
        barRatio: 0.42,
      },
      hint: { ar: "السعر تضاعف مرة واحدة. كم مرة تضاعف حجم البيت المرسوم؟", en: "The price doubled once. How many times bigger is the drawn house?" },
      explain: {
        ar: "السعر تضاعف، لكن البيت تضاعف طولًا وعرضًا معًا، فصار يغطي أربعة أضعاف المساحة. أعيننا تقارن المساحات، فنرى قفزة ×4 بدل ×2.",
        en: "The price doubled, but the house doubled in both height and width, so it covers four times the area. Our eyes compare areas, so we see a 4× jump instead of 2×.",
      },
      ask: { ar: "اسأل: هل يكبر الطول أم المساحة؟", en: "Ask: is it the length or the area that grows?" },
    },
    {
      id: "uneven",
      name: { ar: "عضوية النادي", en: "Club members" },
      trickName: { ar: "فواصل زمنية غير متساوية", en: "Uneven time intervals" },
      trick: ["xaxis"],
      note: { ar: "10 سنوات = سنة واحدة؟", en: "10 years = 1 year?" },
      spec: {
        type: "line",
        title: { ar: "عضوية النادي تنمو بثبات", en: "Club membership grows steadily" },
        sub: { ar: "عدد الأعضاء (توضيحي)", en: "Number of members (illustrative)" },
        labels: ["2000", "2010", "2020", "2022", "2023", "2024"],
        values: [200, 400, 600, 800, 1000, 1200],
        yMin: 0,
        yMax: 1400,
        ticks: [0, 400, 800, 1200],
      },
      honest: {
        type: "line",
        title: { ar: "نمو بطيء 20 عامًا، ثم انطلاقة", en: "Slow growth for 20 years, then take-off" },
        sub: { ar: "عدد الأعضاء، السنوات بمقياس حقيقي (توضيحي)", en: "Number of members, years drawn to scale (illustrative)" },
        labels: ["2000", "2010", "2020", "2022", "2023", "2024"],
        xValues: [2000, 2010, 2020, 2022, 2023, 2024],
        values: [200, 400, 600, 800, 1000, 1200],
        yMin: 0,
        yMax: 1400,
        ticks: [0, 400, 800, 1200],
      },
      hint: { ar: "كم سنة بين كل تاريخين متجاورين؟", en: "How many years lie between neighbouring dates?" },
      explain: {
        ar: "السنوات متباعدة بالتساوي على الورق لا في الزمن: أول فجوتين 10 سنوات، والباقي سنة أو سنتان. نمو 20 عضوًا في السنة حتى 2020، ثم 100–200 في السنة بعدها، يظهر كخط مستقيم واحد.",
        en: "The years are evenly spaced on the page but not in time: the first two gaps are 10 years, the rest are 1–2 years. Growth of 20 members a year until 2020, then 100–200 a year, shows up as one straight line.",
      },
      ask: { ar: "اسأل: هل التواريخ متباعدة بانتظام؟", en: "Ask: are the dates evenly spaced?" },
    },
    {
      id: "dual",
      name: { ar: "الرواتب والأسعار", en: "Wages vs prices" },
      trickName: { ar: "محوران بمقياسين مختلفين", en: "Mismatched dual axes" },
      trick: ["yaxis2", "yaxis"],
      note: { ar: "99 إلى 108 فقط", en: "only 99 to 108" },
      noteOpts: { nyFrac: 0.8 },
      spec: {
        type: "line",
        title: { ar: "الأسعار تسبق الرواتب!", en: "Prices are racing ahead of wages!" },
        sub: { ar: "متوسط الراتب الشهري (يسار) ومؤشر الأسعار (يمين)، توضيحي", en: "Average monthly wage (left) and price index (right), illustrative" },
        labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
        values: [2000, 2032, 2064, 2096, 2128, 2160],
        yMin: 0,
        yMax: 2400,
        ticks: [0, 600, 1200, 1800, 2400],
        y2: { values: [100, 101.5, 103, 104.5, 106, 107.5], yMin: 99, yMax: 108, ticks: [99, 102, 105, 108] },
        legend: [{ label: { ar: "الراتب", en: "Wage" } }, { label: { ar: "الأسعار", en: "Prices" } }],
      },
      honest: {
        type: "line",
        title: { ar: "الرواتب (+8%) واكبت الأسعار (+7.5%)", en: "Wages (+8%) kept pace with prices (+7.5%)" },
        sub: { ar: "كلاهما كمؤشر يبدأ من 100 في 2019 (توضيحي)", en: "Both as an index, 2019 = 100 (illustrative)" },
        labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
        values: [100, 101.6, 103.2, 104.8, 106.4, 108],
        values2: [100, 101.5, 103, 104.5, 106, 107.5],
        yMin: 90,
        yMax: 115,
        ticks: [90, 95, 100, 105, 110, 115],
        legend: [{ label: { ar: "الراتب", en: "Wage" } }, { label: { ar: "الأسعار", en: "Prices" } }],
      },
      hint: { ar: "قارن أرقام المحور الأيسر بأرقام المحور الأيمن.", en: "Compare the numbers on the left axis with those on the right axis." },
      explain: {
        ar: "لكل خط محوره. محور الرواتب يبدأ من الصفر فتبدو مسطّحة، ومحور الأسعار يمتد من 99 إلى 108 فقط فتبدو شديدة الصعود. في الحقيقة ارتفعت الرواتب 8% والأسعار 7.5%.",
        en: "Each line has its own axis. The wage axis starts at zero, so wages look flat; the price axis runs only from 99 to 108, so prices look steep. In fact wages rose 8% and prices 7.5%.",
      },
      ask: { ar: "اسأل: هل يلتقي الخطان لو رُسما على مقياس واحد؟", en: "Ask: would the lines meet if drawn on one scale?" },
    },
    {
      id: "pie193",
      name: { ar: "استطلاع المرشحين", en: "Candidate poll" },
      trickName: { ar: "فطيرة تتجاوز 100%", en: "A pie over 100%" },
      trick: ["plot", "legend"],
      noteRegion: "legend",
      note: { ar: "المجموع 193%!", en: "adds up to 193%!" },
      spec: {
        type: "pie",
        title: { ar: "من ستدعم للرئاسة؟", en: "Who would you back for president?" },
        sub: { ar: "نتائج استطلاع (مستوحى من رسم تلفزيوني حقيقي)", en: "Poll results (based on a real TV graphic)" },
        values: [70, 63, 60],
        pctLabels: ["70%", "63%", "60%"],
        labels: [
          { ar: "المرشح (أ)", en: "Candidate A" },
          { ar: "المرشح (ب)", en: "Candidate B" },
          { ar: "المرشح (ج)", en: "Candidate C" },
        ],
        legendValues: ["70%", "63%", "60%"],
      },
      honest: {
        type: "bar",
        title: { ar: "نسبة من سيدعمون كل مرشح", en: "Share who would back each candidate" },
        sub: { ar: "كان يمكن اختيار أكثر من مرشح", en: "People could pick more than one" },
        labels: [
          { ar: "(أ)", en: "A" },
          { ar: "(ب)", en: "B" },
          { ar: "(ج)", en: "C" },
        ],
        values: [70, 63, 60],
        yMin: 0,
        yMax: 100,
        ticks: [0, 25, 50, 75, 100],
        unit: "%",
        barRatio: 0.5,
      },
      hint: { ar: "اجمع النسب الثلاث.", en: "Add up the three percentages." },
      explain: {
        ar: "الفطيرة تعرض أجزاء كلٍّ واحد، فيجب أن يكون مجموع شرائحها 100%. هنا المجموع 193% لأن المشاركين استطاعوا دعم أكثر من مرشح. الأعمدة المنفصلة لكل مرشح هي الرسم الصادق.",
        en: "A pie shows parts of one whole, so its slices must add up to 100%. These add up to 193% because people could back more than one candidate. Separate bars for each candidate would be honest.",
      },
      ask: { ar: "اسأل: هل تشكّل الأجزاء كلًّا واحدًا؟", en: "Ask: do the parts make one whole?" },
    },
    {
      id: "cumulative",
      name: { ar: "المبيعات", en: "Sales" },
      trickName: { ar: "المجموع التراكمي", en: "Cumulative total" },
      trick: ["title", "yaxis"],
      note: { ar: "«تراكمي»!", en: "\"cumulative\"!" },
      spec: {
        type: "line",
        title: { ar: "المبيعات لا تتوقف عن النمو", en: "Sales never stop growing" },
        sub: { ar: "إجمالي المبيعات التراكمي منذ يناير (بالآلاف)، توضيحي", en: "Cumulative total sales since January (thousands), illustrative" },
        labels: M6,
        values: [120, 225, 317, 397, 463, 518],
        yMin: 0,
        yMax: 600,
        ticks: [0, 200, 400, 600],
        area: true,
      },
      honest: {
        type: "bar",
        title: { ar: "المبيعات الشهرية تراجعت كل شهر", en: "Monthly sales fell every month" },
        sub: { ar: "المبيعات في كل شهر (بالآلاف)، توضيحي", en: "Sales in each month (thousands), illustrative" },
        labels: M6,
        values: [120, 105, 92, 80, 66, 55],
        yMin: 0,
        yMax: 140,
        ticks: [0, 35, 70, 105, 140],
        barCls: ["", "ch-bar--trick", "ch-bar--trick", "ch-bar--trick", "ch-bar--trick", "ch-bar--trick"],
      },
      hint: { ar: "اقرأ السطر الصغير تحت العنوان بعناية.", en: "Read the small print under the title carefully." },
      explain: {
        ar: "السطر الصغير يقول «تراكمي»: كل نقطة تضيف الشهر الجديد إلى كل ما قبله، فلا يمكن للخط أن ينزل أبدًا. أما المبيعات الشهرية فتراجعت كل شهر، من 120 ألفًا إلى 55 ألفًا.",
        en: "The small print says cumulative: each point adds the new month to all the months before, so the line can never go down. Monthly sales actually fell every month, from 120 to 55 thousand.",
      },
      ask: { ar: "اسأل: هل هذا مجموع أم قيمة لكل فترة؟", en: "Ask: is this a total or a per-period value?" },
    },
  ];

  function initSpot() {
    const stage = $("#spotStage");
    if (!stage) return;
    const list = $("#spotList");
    const feedback = $("#spotFeedback");
    const btnReveal = $("#spotReveal");
    const btnHonest = $("#spotHonest");
    const btnNext = $("#spotNext");
    let cur = 0;
    let misses = 0;
    let lastMiss = null;
    let showHonest = false;
    let done = DL.store.get("spotDone", {});
    if (typeof done !== "object" || !done) done = {};

    function renderList() {
      list.innerHTML = SPOTS.map((s, i) => {
        const st = done[s.id];
        return (
          '<li role="presentation"><button class="spot-tab' +
          (st === "found" ? " is-found" : "") +
          '" type="button" role="tab" aria-selected="' +
          (i === cur) +
          '" data-i="' +
          i +
          '"><span class="spot-tab__n">' +
          (st === "found" ? DL.icon("check") : st === "shown" ? DL.icon("eye") : i + 1) +
          "</span><span>" +
          DL.escape(t(s.name)) +
          "</span></button></li>"
        );
      }).join("");
      const found = SPOTS.filter((s) => done[s.id] === "found").length;
      const li = document.createElement("li");
      li.className = "spot-score";
      li.setAttribute("role", "presentation");
      li.innerHTML = t("وجدتَ", "Found") + " <strong>" + found + " / " + SPOTS.length + "</strong>";
      list.appendChild(li);
      $$(".spot-tab", list).forEach((b) =>
        b.addEventListener("click", () => {
          go(+b.dataset.i);
        })
      );
    }

    function go(i) {
      cur = (i + SPOTS.length) % SPOTS.length;
      misses = 0;
      lastMiss = null;
      showHonest = false;
      renderList();
      renderStage();
    }

    function renderStage() {
      const item = SPOTS[cur];
      const st = done[item.id];
      $("#spotTitle").textContent = cur + 1 + " / " + SPOTS.length + " · " + t(item.name);
      let svg;
      if (showHonest) {
        svg = C.render(stage, Object.assign({ w: 600, h: 380, grow: true }, item.honest));
        stage.classList.remove("spotting");
      } else {
        svg = C.render(stage, Object.assign({ w: 600, h: 380 }, item.spec, { spot: !st }));
        stage.classList.toggle("spotting", !st);
        if (st) C.annotate(svg, item.noteRegion || item.trick[0], t(item.note), item.noteOpts);
      }
      $$(".ch-hot", svg).forEach((h) => {
        h.setAttribute("tabindex", "0");
        h.setAttribute("role", "button");
        h.setAttribute("aria-label", t(REGION[h.dataset.region] || { ar: "", en: "" }));
        h.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick(h);
          }
        });
        h.addEventListener("click", () => pick(h));
      });
      renderFeedback();
      btnReveal.hidden = !!st;
      btnHonest.hidden = !st;
      $("#spotHonestLabel").textContent = showHonest
        ? t("عُد إلى الرسم المضلِّل", "Back to the misleading version")
        : t("أرني النسخة الصادقة", "Show the honest version");
    }

    function renderFeedback() {
      const item = SPOTS[cur];
      const st = done[item.id];
      if (st) {
        feedback.innerHTML =
          '<div class="explain' +
          (showHonest ? "" : " explain--trick") +
          '"><h4>' +
          DL.icon(showHonest ? "shield" : st === "found" ? "check" : "eye") +
          (showHonest
            ? t("النسخة الصادقة", "The honest version")
            : (st === "found" ? t("وجدتها: ", "Found it: ") : t("الخدعة: ", "The trick: ")) + DL.escape(t(item.trickName))) +
          "</h4><p>" +
          DL.escape(t(item.explain)) +
          '</p><p class="ask">' +
          DL.escape(t(item.ask)) +
          "</p></div>";
        return;
      }
      if (!lastMiss) {
        feedback.innerHTML =
          '<p class="lab__note" style="display:flex;gap:8px;align-items:center">' +
          DL.icon("target") +
          t("مرّر المؤشر فوق الرسم لترى المناطق القابلة للضغط.", "Hover over the chart to see the areas you can click.") +
          "</p>";
        return;
      }
      feedback.innerHTML =
        '<div class="verdict verdict--warn">' +
        DL.icon("help") +
        "<div><strong>" +
        t("ليس هنا. ", "Not here. ") +
        "</strong>" +
        DL.escape(t(MISS[lastMiss] || MISS.plot)) +
        (misses >= 2 ? "<br><strong>" + t("تلميح: ", "Hint: ") + "</strong>" + DL.escape(t(item.hint)) : "") +
        "</div></div>";
    }

    function resolve(how) {
      const item = SPOTS[cur];
      if (!done[item.id] || how === "found") done[item.id] = how;
      DL.store.set("spotDone", done);
      renderList();
      renderStage();
      if (how === "found") DL.toast(t("أحسنت! وجدت الخدعة.", "Nice catch!"), "check");
      if (SPOTS.every((s) => done[s.id]) && DL.progress.get("charts") !== "done") {
        DL.progress.mark("charts", "done");
        setTimeout(() => DL.toast(t("أكملت الجزء الأول!", "Part 1 complete!"), "trophy"), 900);
      }
    }

    function pick(hot) {
      const item = SPOTS[cur];
      const region = hot.dataset.region;
      if (item.trick.includes(region)) {
        resolve("found");
      } else {
        misses++;
        lastMiss = region;
        hot.classList.remove("is-miss");
        void hot.getBoundingClientRect();
        hot.classList.add("is-miss");
        renderFeedback();
      }
    }

    btnReveal.addEventListener("click", () => resolve("shown"));
    btnHonest.addEventListener("click", () => {
      showHonest = !showHonest;
      renderStage();
    });
    btnNext.addEventListener("click", () => {
      const next = SPOTS.findIndex((s, i) => i > cur && !done[s.id]);
      const first = SPOTS.findIndex((s) => !done[s.id]);
      go(next >= 0 ? next : first >= 0 ? first : cur + 1);
    });

    DL.onLang(() => {
      renderList();
      renderStage();
    });
  }

  initTruncated();
  initCherry();
  initPie();
  initSpot();
})();
