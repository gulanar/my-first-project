/* DataLens · Home: lens hero, quick challenge, five-question cards, journey */
(function () {
  "use strict";
  const DL = window.DL;
  const { $, $$ } = DL;

  /* ---------------------------------------------------------------------
     Hero lens: a misleading chart, with the honest one under the glass
     --------------------------------------------------------------------- */
  function initLens() {
    const stage = $("#lensStage");
    if (!stage) return;
    const lie = $("#lensLie");
    const truth = $("#lensTruth");
    const quarters = [
      { ar: "الربع 1", en: "Q1" },
      { ar: "الربع 2", en: "Q2" },
      { ar: "الربع 3", en: "Q3" },
      { ar: "الربع 4", en: "Q4" },
    ];
    const values = [50.2, 50.6, 51.1, 51.9];
    const sub = { ar: "المبيعات الفصلية (بالملايين)", en: "Quarterly sales (millions)" };

    const draw = () => {
      DL.chart.render(lie, {
        type: "bar",
        w: 480,
        h: 340,
        title: { ar: "المبيعات تنفجر هذا العام!", en: "Sales EXPLODE this year!" },
        sub,
        labels: quarters,
        values,
        yMin: 50,
        yMax: 52,
        ticks: [50, 50.5, 51, 51.5, 52],
        digits: 1,
        barCls: ["", "", "", "ch-bar--trick"],
        left: 52,
      });
      DL.chart.render(truth, {
        type: "bar",
        w: 480,
        h: 340,
        title: { ar: "المبيعات نمت 3.4% هذا العام", en: "Sales grew 3.4% this year" },
        sub,
        labels: quarters,
        values,
        yMin: 0,
        yMax: 60,
        ticks: [0, 10, 20, 30, 40, 50, 60],
        digits: 1,
        barCls: "ch-bar--truth",
        left: 52,
      });
    };
    DL.onLang(draw);

    let x = 0.7;
    let y = 0.56;
    let idle = true;
    let idleTimer;
    let raf;
    const t0 = performance.now();

    const place = () => {
      const w = stage.clientWidth;
      stage.style.setProperty("--lx", (x * 100).toFixed(2) + "%");
      stage.style.setProperty("--ly", (y * 100).toFixed(2) + "%");
      stage.style.setProperty("--lr", Math.round(Math.max(52, Math.min(96, w * 0.17))) + "px");
    };

    const loop = (now) => {
      if (idle) {
        const s = (now - t0) / 1000;
        x = 0.56 + 0.28 * Math.sin(s * 0.55);
        y = 0.6 + 0.18 * Math.sin(s * 1.1 + 0.6);
        place();
      }
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      idle = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => (idle = !DL.reduced()), 3500);
    };

    const fromEvent = (e) => {
      const r = stage.getBoundingClientRect();
      x = DL.clamp((e.clientX - r.left) / r.width, 0.04, 0.96);
      y = DL.clamp((e.clientY - r.top) / r.height, 0.06, 0.94);
      place();
      wake();
    };
    stage.addEventListener("pointermove", fromEvent);
    stage.addEventListener("pointerdown", fromEvent);
    stage.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.1 : 0.04;
      const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!k) return;
      e.preventDefault();
      x = DL.clamp(x + k[0], 0.04, 0.96);
      y = DL.clamp(y + k[1], 0.06, 0.94);
      place();
      wake();
    });
    window.addEventListener("resize", place);
    place();

    if (DL.reduced()) {
      idle = false;
      return;
    }
    // Only animate while the hero is on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            if (!raf) raf = requestAnimationFrame(loop);
          } else if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      }).observe(stage);
    } else {
      raf = requestAnimationFrame(loop);
    }
  }

  /* ---------------------------------------------------------------------
     Quick challenge: two charts of the same vote
     --------------------------------------------------------------------- */
  function initQuickPick() {
    const wrap = $("#quickPick");
    if (!wrap) return;
    const out = $("#quickResult");
    const labels = [
      { ar: "نعم", en: "Yes" },
      { ar: "لا", en: "No" },
    ];
    let answered = null;

    const draw = () => {
      const a = wrap.querySelector('[data-pick="a"]');
      const b = wrap.querySelector('[data-pick="b"]');
      const svgA = DL.chart.render(a, {
        type: "bar",
        w: 420,
        h: 300,
        title: { ar: "الرسم (أ)", en: "Chart A" },
        sub: { ar: "نتيجة التصويت", en: "Vote result" },
        labels,
        values: [51, 49],
        yMin: 48,
        yMax: 52,
        ticks: [48, 49, 50, 51, 52],
        unit: "%",
        barCls: ["", "ch-bar--4"],
      });
      const svgB = DL.chart.render(b, {
        type: "bar",
        w: 420,
        h: 300,
        title: { ar: "الرسم (ب)", en: "Chart B" },
        sub: { ar: "نتيجة التصويت", en: "Vote result" },
        labels,
        values: [51, 49],
        yMin: 0,
        yMax: 60,
        ticks: [0, 20, 40, 60],
        unit: "%",
        barCls: ["", "ch-bar--4"],
      });
      a.setAttribute("aria-label", DL.t("الرسم (أ): محور يبدأ من 48%", "Chart A: axis starts at 48%"));
      b.setAttribute("aria-label", DL.t("الرسم (ب): محور يبدأ من الصفر", "Chart B: axis starts at zero"));
      if (answered) {
        DL.chart.annotate(svgA, "yaxis", DL.t("يبدأ من 48!", "starts at 48!"));
        DL.chart.annotate(svgB, "yaxis", DL.t("يبدأ من الصفر", "starts at zero"), { good: true });
        showResult();
      }
    };

    const showResult = () => {
      const right = answered === "b";
      out.innerHTML =
        '<div class="verdict ' + (right ? "verdict--good" : "verdict--bad") + '">' +
        DL.icon(right ? "check" : "x") +
        "<div><strong>" +
        (right ? DL.t("إجابة صحيحة!", "Correct!") : DL.t("ليس تمامًا.", "Not quite.")) +
        "</strong> " +
        DL.t(
          "في الرسم (أ) يبدأ المحور من 48%، فيبدو عمود «نعم» أطول بثلاث مرات من «لا» رغم أن الفرق نقطتان فقط. الرسم (ب) يبدأ من الصفر، فتعكس أطوال الأعمدة الأرقام الحقيقية.",
          "Chart A's axis starts at 48%, so the yes bar looks three times taller than the no bar, even though the gap is only 2 points. Chart B starts at zero, so the bar lengths match the real numbers."
        ) +
        ' <a class="txt-lens" href="charts.html#truncated" style="font-weight:600">' +
        DL.t("جرّب مختبر المحور المقطوع ←", "Try the truncated-axis lab →") +
        "</a></div></div>";
    };

    $$("[data-pick]", wrap).forEach((btn) =>
      btn.addEventListener("click", () => {
        answered = btn.dataset.pick;
        draw();
      })
    );
    DL.onLang(draw);
  }

  /* ---------------------------------------------------------------------
     Flip cards
     --------------------------------------------------------------------- */
  function initFlips() {
    $$(".flip").forEach((card) =>
      card.addEventListener("click", () => {
        const on = !card.classList.contains("is-flipped");
        card.classList.toggle("is-flipped", on);
        card.setAttribute("aria-pressed", on ? "true" : "false");
      })
    );
  }

  /* ---------------------------------------------------------------------
     Journey progress
     --------------------------------------------------------------------- */
  function initJourney() {
    const labels = {
      new: { ar: "لم تبدأ", en: "Not started" },
      visited: { ar: "قيد التقدّم", en: "In progress" },
      done: { ar: "مكتمل", en: "Completed" },
    };
    const render = () => {
      $$(".status[data-part]").forEach((s) => {
        const state = DL.progress.get(s.dataset.part);
        s.setAttribute("data-state", state);
        s.innerHTML = (state === "done" ? DL.icon("check") : "") + "<span>" + DL.t(labels[state]) + "</span>";
      });
      const pct = DL.progress.percent();
      const bar = $("#journeyBar");
      if (bar) {
        bar.setAttribute("aria-valuenow", pct);
        bar.querySelector("span").style.setProperty("--w", pct + "%");
      }
      const label = $("#journeyPct");
      if (label) label.textContent = pct + "%";
    };
    DL.onLang(render);
    document.addEventListener("dl:progress", render);
  }

  initLens();
  initQuickPick();
  initFlips();
  initJourney();
})();
