/* DataLens · Part 2: statistical traps */
(function () {
  "use strict";
  const DL = window.DL;
  const C = DL.chart;
  const { $, $$ } = DL;
  const t = DL.t;

  const verdict = (el, kind, html) => {
    el.className = "verdict verdict--" + kind;
    el.innerHTML = DL.icon(kind === "good" ? "check" : kind === "bad" ? "alert" : "info") + "<div>" + html + "</div>";
  };

  /* =======================================================================
     1 · Correlation vs causation
     ======================================================================= */
  function initCorrelation() {
    const host = $("#corrChart");
    if (!host) return;
    const toggle = $("#corrReveal");
    const rand = DL.rng(7);
    const weeks = Array.from({ length: 26 }, (_, i) => {
      const T = 15 + 20 * Math.sin((Math.PI * (i + 0.5)) / 26) + (rand() - 0.5) * 4;
      const ice = 2 + 0.55 * T + (rand() - 0.5) * 3;
      const drown = Math.max(0, Math.round(-1.5 + 0.32 * T + (rand() - 0.5) * 2.6));
      return { T, ice, drown };
    });
    const pearson = (xs, ys) => {
      const n = xs.length;
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = ys.reduce((a, b) => a + b, 0) / n;
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (let i = 0; i < n; i++) {
        sxy += (xs[i] - mx) * (ys[i] - my);
        sxx += (xs[i] - mx) ** 2;
        syy += (ys[i] - my) ** 2;
      }
      return sxy / Math.sqrt(sxx * syy);
    };
    const r = pearson(
      weeks.map((w) => w.ice),
      weeks.map((w) => w.drown)
    );
    const tempColor = (T) => {
      const k = DL.clamp((T - 15) / 20, 0, 1);
      const hue = 195 - k * 187;
      return "hsl(" + hue.toFixed(0) + " 78% " + (48 + Math.sin(k * Math.PI) * 4).toFixed(0) + "%)";
    };

    function render() {
      const on = toggle.checked;
      C.render(host, {
        type: "scatter",
        w: 560,
        h: 380,
        title: on
          ? { ar: "الطقس الحار يحرّك الاثنين معًا", en: "Hot weather drives both" }
          : { ar: "مثلجات أكثر = غرق أكثر؟", en: "More ice cream, more drownings?" },
        sub: { ar: "كل نقطة أسبوع واحد (توضيحي)", en: "Each dot is one week (illustrative)" },
        points: weeks.map((w) => ({ x: w.ice, y: w.drown, color: on ? tempColor(w.T) : null })),
        xMin: 8,
        xMax: 24,
        yMin: 0,
        yMax: 12,
        yTicks: [0, 3, 6, 9, 12],
        xTitle: { ar: "مبيعات المثلجات (مئات الوحدات أسبوعيًا)", en: "Ice cream sales (hundreds per week)" },
        yTitle: { ar: "حوادث الغرق أسبوعيًا", en: "Drownings per week" },
        trend: true,
        grow: false,
      });
      $("#corrR").textContent = "r = " + DL.fmt(r, 2);
      $("#corrLegend").hidden = !on;
      const diagram = $("#corrDiagram");
      diagram.hidden = !on;
      if (on) drawDiagram(diagram);
      verdict(
        $("#corrVerdict"),
        on ? "good" : "warn",
        on
          ? t({
              ar: "<strong>العامل الخفي: الحرارة.</strong> في الأسابيع الحارة يشتري الناس مثلجات أكثر ويسبحون أكثر، والسباحة الأكثر تعني حوادث غرق أكثر. منع المثلجات لن ينقذ أحدًا.",
              en: "<strong>The hidden factor is heat.</strong> In hot weeks people buy more ice cream and swim more, and more swimming means more drownings. Banning ice cream would save no one.",
            })
          : t({
              ar: "<strong>ارتباط قوي (r = " + DL.fmt(r, 2) + ").</strong> هل تسبّب المثلجات الغرق؟ قبل أن تجيب، شغّل المفتاح لتكشف ما يحدث خلف الرسم.",
              en: "<strong>A strong correlation (r = " + DL.fmt(r, 2) + ").</strong> Does ice cream cause drowning? Before you answer, flip the switch to see what's behind the chart.",
            })
      );
    }

    function drawDiagram(host2) {
      const W = 560;
      const H = 170;
      const svg = C.el("svg", { viewBox: "0 0 " + W + " " + H, cls: "chart", role: "img", "aria-label": t({ ar: "مخطط سببي: الحرارة تزيد المثلجات والسباحة، والسباحة تزيد الغرق", en: "Causal diagram: heat increases ice cream sales and swimming; swimming increases drownings" }) });
      const defs = C.el("defs", {}, svg);
      const mk = C.el("marker", { id: "dl-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      C.el("path", { d: "M0 0 L10 5 L0 10 z", style: "fill:var(--ink-2)" }, mk);
      const node = (x, y, w, h, label, accent) => {
        C.el("rect", { x, y, width: w, height: h, rx: 10, style: "fill:var(--surface);stroke:" + (accent || "var(--line-2)") + ";stroke-width:2" }, svg);
        C.el("text", { x: x + w / 2, y: y + h / 2 + 5, "text-anchor": "middle", style: "fill:var(--ink);font-weight:600;font-size:13px", text: t(label) }, svg);
      };
      const arrow = (d) => {
        const p = C.el("path", { d, style: "fill:none;stroke:var(--ink-2);stroke-width:2", "marker-end": "url(#dl-arrow)" }, svg);
        return p;
      };
      arrow("M152 78 C 250 40, 300 30, 396 30");
      arrow("M152 92 C 180 120, 190 130, 216 130");
      arrow("M362 130 L 396 130");
      const dash = C.el("path", { d: "M470 52 L470 108", style: "fill:none;stroke:var(--redpen);stroke-width:2.5;stroke-dasharray:6 5" }, svg);
      void dash;
      C.el("circle", { cx: 470, cy: 80, r: 11, style: "fill:var(--surface);stroke:var(--redpen);stroke-width:2.5" }, svg);
      C.el("path", { d: "M465 75 L475 85 M475 75 L465 85", style: "stroke:var(--redpen);stroke-width:2.5;stroke-linecap:round" }, svg);
      node(14, 62, 138, 46, { ar: "طقس حار", en: "Hot weather" }, "var(--amber)");
      node(398, 10, 150, 42, { ar: "مبيعات المثلجات", en: "Ice cream sales" });
      node(218, 110, 144, 42, { ar: "سباحة أكثر", en: "More swimming" });
      node(398, 110, 150, 42, { ar: "حوادث الغرق", en: "Drownings" });
      C.el("text", { x: 452, y: 84, "text-anchor": "end", style: "fill:var(--redpen);font-weight:700;font-size:12px", text: t({ ar: "لا صلة مباشرة", en: "no direct link" }) }, svg);
      host2.innerHTML = "";
      host2.appendChild(svg);
      if (!DL.reduced() && svg.animate) svg.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "ease-out" });
    }

    toggle.addEventListener("change", render);
    DL.onLang(render);

    // Which explanation fits?
    const OPTIONS = {
      cause: { ar: "سببية حقيقية", en: "Real causation" },
      reverse: { ar: "سببية معكوسة", en: "Reverse causation" },
      confounder: { ar: "عامل ثالث خفي", en: "Hidden third factor" },
      chance: { ar: "مصادفة", en: "Coincidence" },
    };
    const CLAIMS = [
      {
        claim: { ar: "الطلاب الذين يتناولون الفطور يحصلون على درجات أعلى.", en: "Students who eat breakfast get higher grades." },
        answer: "confounder",
        why: {
          ar: "العائلات ذات الروتين المنتظم أو الدخل الأعلى أو النوم الأفضل قد تُنتج طلابًا يفطرون ويتفوّقون معًا. قد يساعد الفطور قليلًا، لكن هذا النمط وحده لا يثبت ذلك.",
          en: "Families with regular routines, more income or more sleep may produce students who both eat breakfast and do well. Breakfast might help a little, but this pattern alone can't show it.",
        },
      },
      {
        claim: { ar: "من يزورون الطبيب أكثر يكونون أكثر مرضًا، إذن زيارات الطبيب تُمرض الناس.", en: "People who see the doctor more often are sicker, so doctor visits make people ill." },
        answer: "reverse",
        why: { ar: "المرض هو الذي يسبّب زيارة الطبيب، لا العكس.", en: "Being ill causes the doctor visits, not the other way round." },
      },
      {
        claim: { ar: "في السنوات التي يظهر فيها ممثل معيّن في أفلام أكثر، يغرق عدد أكبر من الناس في المسابح.", en: "In years when one actor appears in more films, more people drown in swimming pools." },
        answer: "chance",
        why: {
          ar: "ابحث في آلاف السلاسل غير المرتبطة وستجد بعضها متطابقًا بالحظ. لا شيء يربط الأمرين، فهي مصادفة.",
          en: "Search thousands of unrelated data series and some will match by luck. Nothing links these two, so it's a coincidence.",
        },
      },
      {
        claim: {
          ar: "عقود من الدراسات تربط التدخين بسرطان الرئة، مع خطر أكبر لمن يدخّن أكثر، وآلية بيولوجية معروفة.",
          en: "Decades of studies link smoking to lung cancer, with higher risk for heavier smokers and a known biological mechanism.",
        },
        answer: "cause",
        why: {
          ar: "الارتباط قد يكون سببيًا. هنا تشير دراسات مستقلة كثيرة، وعلاقة الجرعة بالأثر، وآلية واضحة، إلى الاتجاه نفسه.",
          en: "Correlation can be causal. Here many independent studies, a dose-response pattern and a clear mechanism all point the same way.",
        },
      },
    ];
    const answers = {};
    const quiz = $("#corrQuiz");
    function renderQuiz() {
      quiz.innerHTML = CLAIMS.map((c, ci) => {
        const a = answers[ci];
        const opts = Object.keys(OPTIONS)
          .map((k) => {
            let cls = "chip";
            if (a) {
              if (k === c.answer) cls += " is-active";
            }
            const mark = a && k === a && k !== c.answer ? ' style="border-color:var(--redpen);color:var(--redpen);text-decoration:line-through"' : "";
            return '<button class="' + cls + '" type="button" data-ci="' + ci + '" data-k="' + k + '"' + (a ? " disabled" : "") + mark + ">" + DL.escape(t(OPTIONS[k])) + "</button>";
          })
          .join("");
        const res = a
          ? '<div class="explain' + (a === c.answer ? "" : " explain--trick") + '"><h4>' + DL.icon(a === c.answer ? "check" : "x") + (a === c.answer ? t("صحيح", "Correct") : t("الأرجح: ", "Most likely: ") + DL.escape(t(OPTIONS[c.answer]))) + "</h4><p>" + DL.escape(t(c.why)) + "</p></div>"
          : "";
        return '<div class="q-inline reveal is-in"><p class="q-inline__claim">«' + DL.escape(t(c.claim)) + '»</p><div class="chip-row">' + opts + "</div>" + res + "</div>";
      }).join("");
      const done = Object.keys(answers).length;
      const right = Object.keys(answers).filter((k) => answers[k] === CLAIMS[k].answer).length;
      $("#corrScore").textContent = done ? right + " / " + CLAIMS.length : "";
      $$("button[data-ci]", quiz).forEach((b) =>
        b.addEventListener("click", () => {
          answers[b.dataset.ci] = b.dataset.k;
          renderQuiz();
        })
      );
    }
    DL.onLang(renderQuiz);
  }

  /* =======================================================================
     2 · Sampling bias
     ======================================================================= */
  function initSampling() {
    const host = $("#sampleGrid");
    if (!host) return;
    const COLS = 20;
    const N = 400;
    const TRUE = 140;
    const rand = DL.rng(31);
    const people = Array.from({ length: N }, (_, i) => {
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      const dStadium = Math.hypot(19 - c, 19 - r);
      return { i, c, r, dStadium, dLibrary: Math.hypot(c, r), score: -dStadium + (rand() - 0.5) * 9, fan: false };
    });
    people
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, TRUE)
      .forEach((p) => (p.fan = true));

    let method = "random";
    let sample = [];
    const pickN = (pool, n) => DL.shuffle(pool).slice(0, n);
    function draw() {
      if (method === "random") sample = pickN(people, 60);
      else if (method === "stadium") sample = pickN(people.slice().sort((a, b) => a.dStadium - b.dStadium).slice(0, 110), 60);
      else if (method === "library") sample = pickN(people.slice().sort((a, b) => a.dLibrary - b.dLibrary).slice(0, 110), 60);
      else sample = people.filter((p) => Math.random() < (p.fan ? 0.55 : 0.12));
      render();
    }

    function render() {
      const inSample = new Set(sample.map((p) => p.i));
      const W = 440;
      const H = 474;
      const cell = 20;
      const ox = 20;
      const oy = 44;
      const svg = C.el("svg", { viewBox: "0 0 " + W + " " + H, cls: "chart dot-grid", role: "img", "aria-label": t({ ar: "شبكة من 400 شخص، الملوّنون يؤيدون الملعب", en: "A grid of 400 people; coloured dots support the stadium" }) });
      C.el("rect", { x: 0, y: 0, width: W, height: H, rx: 12, cls: "ch-frame" }, svg);
      C.el("rect", { x: 8, y: 6, width: 26, height: 26, rx: 6, style: "fill:var(--teal-soft);stroke:var(--teal);stroke-width:1.5" }, svg);
      C.el("text", { x: 42, y: 24, style: "fill:var(--teal);font-weight:600;font-size:13px", text: t({ ar: "المكتبة", en: "Library" }) }, svg);
      C.el("rect", { x: W - 34, y: H - 32, width: 26, height: 26, rx: 6, style: "fill:var(--lens-soft);stroke:var(--lens);stroke-width:1.5" }, svg);
      C.el("text", { x: W - 42, y: H - 14, "text-anchor": "end", style: "fill:var(--lens);font-weight:600;font-size:13px", text: t({ ar: "الملعب", en: "Stadium" }) }, svg);
      people.forEach((p) => {
        const on = inSample.has(p.i);
        C.el(
          "circle",
          {
            cx: ox + p.c * cell + cell / 2,
            cy: oy + p.r * cell + cell / 2,
            r: on ? 8 : 6.2,
            style:
              "fill:" + (p.fan ? "var(--c1)" : "var(--line-2)") +
              ";opacity:" + (sample.length && !on ? 0.28 : 1) +
              (on ? ";stroke:var(--ink);stroke-width:2.5" : ""),
          },
          svg
        );
      });
      host.innerHTML = "";
      host.appendChild(svg);

      const fans = sample.filter((p) => p.fan).length;
      const est = sample.length ? (fans / sample.length) * 100 : 0;
      const err = est - 35;
      $("#sampleN").textContent = sample.length;
      const errEl = $("#sampleErr");
      errEl.textContent = (err >= 0 ? "+" : "−") + DL.fmt(Math.abs(err), 0) + " " + t("نقطة", "pts");
      errEl.parentElement.className = "readout " + (Math.abs(err) > 12 ? "is-bad" : "is-good");
      $("#sampleBars").innerHTML = [
        { label: { ar: "الحقيقة في البلدة", en: "Truth in the town" }, v: 35, c: "var(--truth)" },
        { label: { ar: "ما تقوله العيّنة", en: "What the sample says" }, v: est, c: Math.abs(err) > 12 ? "var(--redpen)" : "var(--lens)" },
      ]
        .map(
          (b) =>
            '<div class="readout"><span>' + DL.escape(t(b.label)) + '</span><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;height:12px;border-radius:999px;background:var(--surface-3);overflow:hidden"><span style="display:block;height:100%;width:' + b.v.toFixed(1) + "%;background:" + b.c + ';border-radius:inherit;transition:width .5s var(--ease)"></span></div><strong style="min-width:3.2em;text-align:end">' + DL.fmt(b.v, 0) + "%</strong></div></div>"
        )
        .join("");

      const texts = {
        random: {
          kind: Math.abs(err) <= 12 ? "good" : "warn",
          ar: "<strong>عيّنة عشوائية:</strong> لكل شخص الفرصة نفسها ليُختار. يبقى خطأ صغير بالصدفة (هذا هو هامش الخطأ) لكن لا يُفضَّل طرف على آخر. اسحب عيّنات جديدة وراقب النتيجة تحوم حول 35%.",
          en: "<strong>Random sample:</strong> everyone has the same chance of being picked. A small chance error remains (that is the margin of error) but no side is favoured. Draw new samples and watch the result hover around 35%.",
        },
        stadium: {
          kind: "bad",
          ar: "<strong>أمام الملعب:</strong> تصل إلى المشجعين الذين يسكنون قربه. العيّنة لا تشبه البلدة، فتبالغ في التأييد.",
          en: "<strong>At the stadium:</strong> you reach the fans who live nearby. The sample doesn't look like the town, so support is overstated.",
        },
        online: {
          kind: "bad",
          ar: "<strong>استطلاع إلكتروني طوعي:</strong> من يهتم أكثر يجيب أكثر. المؤيدون أكثر حماسًا للرد بنحو أربع مرات، لذلك لم تُصلح العيّنة الأكبر شيئًا. الحجم لا يعالج التحيّز.",
          en: "<strong>Voluntary online poll:</strong> the people who care most answer most. Supporters were about four times as likely to reply, so the bigger sample fixed nothing. Size doesn't cure bias.",
        },
        library: {
          kind: "bad",
          ar: "<strong>في المكتبة:</strong> تقع في الطرف الآخر من البلدة حيث يقلّ المؤيدون، فتميل العيّنة إلى الرفض.",
          en: "<strong>At the library:</strong> it sits on the far side of town, where few support the stadium, so the sample leans against it.",
        },
      };
      const tx = texts[method];
      verdict($("#sampleVerdict"), tx.kind, t(tx));
    }

    DL.seg($("#sampleMethod"), (v) => {
      method = v;
      draw();
    });
    $("#sampleAgain").addEventListener("click", draw);
    draw();
    document.addEventListener("dl:lang", render);

    // Survivorship plane
    const plane = $("#plane");
    let armorAnswer = null;
    const holes = [
      [40, 165], [58, 158], [75, 170], [112, 160], [128, 152], [140, 168], [60, 172], [222, 152], [236, 165], [250, 158],
      [292, 158], [306, 170], [318, 162], [330, 168], [176, 96], [186, 112], [174, 128], [188, 146], [178, 186], [186, 204],
      [174, 220], [184, 236], [140, 270], [150, 276], [214, 272], [226, 270], [100, 166], [264, 170],
    ];
    function drawPlane() {
      const svg = C.el("svg", { viewBox: "0 0 360 300", cls: "chart", role: "img", "aria-label": t({ ar: "قاذفة عائدة عليها ثقوب رصاص على الأجنحة والجسم والذيل، بلا ثقوب على المحركات وقمرة القيادة", en: "A returning bomber with bullet holes on wings, body and tail, and none on the engines or cockpit" }) });
      const body = "fill:var(--c4)";
      C.el("path", { d: "M180 120 L346 158 L346 178 L180 168 L14 178 L14 158 Z", style: body }, svg);
      C.el("path", { d: "M180 244 L248 266 L248 280 L180 274 L112 280 L112 266 Z", style: body }, svg);
      C.el("rect", { x: 165, y: 22, width: 30, height: 262, rx: 15, style: body }, svg);
      C.el("ellipse", { cx: 180, cy: 46, rx: 9, ry: 14, style: "fill:var(--surface-3)" }, svg);
      [90, 270].forEach((x) => C.el("ellipse", { cx: x, cy: 150, rx: 13, ry: 20, style: "fill:var(--ink-2)" }, svg));
      holes.forEach(([x, y]) => C.el("circle", { cx: x, cy: y, r: 3.4, style: "fill:var(--redpen)" }, svg));
      plane.innerHTML = "";
      plane.appendChild(svg);
      if (armorAnswer) {
        svg.__regions = {};
        C.annotate(svg, "e1", "", { box: { x: 77, y: 130, w: 26, h: 40 }, good: true, pad: 6 });
        C.annotate(svg, "e2", "", { box: { x: 257, y: 130, w: 26, h: 40 }, good: true, pad: 6 });
        C.annotate(svg, "ck", t({ ar: "الدروع هنا", en: "armour here" }), { box: { x: 168, y: 30, w: 24, h: 32 }, good: true, pad: 6, side: "right", nyFrac: 0.5 });
      }
    }
    function renderArmor() {
      drawPlane();
      const out = $("#armorResult");
      $$("#armorChoice .chip").forEach((c) => {
        c.disabled = !!armorAnswer;
        c.classList.toggle("is-active", !!armorAnswer && c.dataset.armor === "clean");
      });
      if (!armorAnswer) {
        out.innerHTML = "";
        return;
      }
      const right = armorAnswer === "clean";
      out.innerHTML =
        '<div class="explain' + (right ? "" : " explain--trick") + '"><h4>' + DL.icon(right ? "check" : "x") + (right ? t("صحيح!", "Correct!") : t("هذا ما ظنّه كثيرون.", "That's what many assumed.")) + "</h4><p>" +
        t(
          "أشار الإحصائي أبراهام والد إلى أن هذه هي الطائرات التي <strong>عادت</strong>. الطائرات التي أُصيبت في المحركات أو قمرة القيادة لم تعد في الغالب، فغابت إصاباتها عن البيانات. حين تدرس الناجين فقط، تختفي الإخفاقات.",
          "Statistician Abraham Wald pointed out that these were the planes that <strong>came back</strong>. Planes hit in the engines or cockpit mostly didn't return, so those hits were missing from the data. Study only the survivors and the failures disappear."
        ) +
        '</p><p class="ask">' + t("أمثلة اليوم: «تركوا الجامعة وصاروا مليارديرات» أو «المباني القديمة كانت أمتن».", "Today's versions: \"they dropped out and became billionaires\" or \"old buildings were built better\".") + "</p></div>";
    }
    $$("#armorChoice .chip").forEach((c) =>
      c.addEventListener("click", () => {
        armorAnswer = c.dataset.armor;
        renderArmor();
      })
    );
    DL.onLang(renderArmor);
  }

  /* =======================================================================
     3 · Simpson's paradox (Charig et al., BMJ 1986)
     ======================================================================= */
  function initSimpson() {
    const host = $("#simpsonChart");
    if (!host) return;
    const D = { A: { small: [81, 87], large: [192, 263] }, B: { small: [234, 270], large: [55, 80] } };
    const rate = (x) => (x[0] / x[1]) * 100;
    const overall = (k) => ((D[k].small[0] + D[k].large[0]) / (D[k].small[1] + D[k].large[1])) * 100;
    const series = [
      { label: { ar: "العلاج (أ)", en: "Treatment A" }, cls: "" },
      { label: { ar: "العلاج (ب)", en: "Treatment B" }, cls: "ch-bar--2" },
    ];
    let view = "overall";

    function render() {
      const text = $("#simpsonText");
      if (view === "overall") {
        C.render(host, {
          type: "bar",
          w: 560,
          h: 360,
          title: { ar: "نسبة النجاح لكل المرضى", en: "Success rate, all patients" },
          sub: { ar: "350 مريضًا لكل علاج", en: "350 patients per treatment" },
          labels: series.map((s) => s.label),
          values: [overall("A"), overall("B")],
          yMin: 0,
          yMax: 100,
          ticks: [0, 25, 50, 75, 100],
          unit: "%",
          digits: 0,
          barCls: ["", "ch-bar--2"],
          barRatio: 0.42,
          grow: true,
        });
        verdict(text, "warn", t({
          ar: "<strong>يبدو (ب) أفضل:</strong> نجح مع " + DL.fmt(overall("B"), 0) + "% من مرضاه، مقابل " + DL.fmt(overall("A"), 0) + "% للعلاج (أ). هل نختار (ب) إذن؟ قسّم المرضى حسب حجم الحصاة.",
          en: "<strong>B looks better:</strong> it worked for " + DL.fmt(overall("B"), 0) + "% of its patients, against " + DL.fmt(overall("A"), 0) + "% for A. So should we choose B? Split the patients by stone size.",
        }));
      } else if (view === "size") {
        C.render(host, {
          type: "grouped",
          w: 560,
          h: 360,
          title: { ar: "نسبة النجاح حسب حجم الحصاة", en: "Success rate by stone size" },
          sub: { ar: "العلاج (أ) يفوز في المجموعتين", en: "Treatment A wins in both groups" },
          groups: [
            { ar: "حصى صغيرة", en: "Small stones" },
            { ar: "حصى كبيرة", en: "Large stones" },
          ],
          series: [
            Object.assign({ values: [rate(D.A.small), rate(D.A.large)] }, series[0]),
            Object.assign({ values: [rate(D.B.small), rate(D.B.large)] }, series[1]),
          ],
          yMax: 100,
          ticks: [0, 25, 50, 75, 100],
          unit: "%",
          digits: 0,
          grow: true,
        });
        verdict(text, "bad", t({
          ar: "<strong>انقلبت النتيجة!</strong> العلاج (أ) أفضل مع الحصى الصغيرة (93% مقابل 87%) ومع الكبيرة (73% مقابل 69%). أفضل في كل مجموعة، وأسوأ في المجموع. كيف؟",
          en: "<strong>The result flips!</strong> Treatment A is better for small stones (93% vs 87%) and for large stones (73% vs 69%). Better in every group, worse overall. How?",
        }));
      } else {
        C.render(host, {
          type: "stacked",
          w: 560,
          h: 300,
          title: { ar: "من تلقّى أي علاج؟", en: "Who got which treatment?" },
          sub: { ar: "توزيع المرضى حسب حجم الحصاة", en: "Patients by stone size" },
          series: [
            { label: { ar: "حصى صغيرة (أسهل)", en: "Small stones (easier)" }, cls: "ch-bar--truth" },
            { label: { ar: "حصى كبيرة (أصعب)", en: "Large stones (harder)" }, cls: "ch-bar--trick" },
          ],
          rows: [
            { label: series[0].label, parts: [{ v: 87, text: "87" }, { v: 263, text: "263" }] },
            { label: series[1].label, parts: [{ v: 270, text: "270" }, { v: 80, text: "80" }] },
          ],
          grow: true,
        });
        verdict(text, "good", t({
          ar: "<strong>السر في الخليط:</strong> أُعطي العلاج (أ) غالبًا للحالات الصعبة (263 من 350 مريضًا لديهم حصى كبيرة)، مقابل 80 فقط للعلاج (ب). الحصى الكبيرة تفشل أكثر مع أي علاج، فتسحب نسبة (أ) الإجمالية إلى الأسفل. الدرس: قارن المتشابه بالمتشابه قبل أن تثق بالمجموع.",
          en: "<strong>The secret is the mix:</strong> treatment A was mostly given to hard cases (263 of its 350 patients had large stones), against only 80 for B. Large stones fail more often with any treatment, which drags A's overall rate down. The lesson: compare like with like before trusting a total.",
        }));
      }
    }
    DL.seg($("#simpsonView"), (v) => {
      view = v;
      render();
    });
    DL.onLang(render);
  }

  /* =======================================================================
     4 · Small samples
     ======================================================================= */
  function initSmall() {
    const host = $("#smallChart");
    if (!host) return;
    let n = 10;
    let results = [];
    let stop = null;

    const run = () => {
      results = Array.from({ length: 100 }, () => {
        let h = 0;
        for (let i = 0; i < n; i++) if (Math.random() < 0.5) h++;
        return (h / n) * 100;
      });
      if (stop) stop();
      stop = DL.tween(0, 100, 1000, (k) => render(Math.round(k)));
      readouts();
    };

    const isExtreme = (p) => p <= 30 || p >= 70;

    function render(count) {
      const W = 560;
      const H = 330;
      const x0 = 40;
      const x1 = 530;
      const y0 = 24;
      const y1 = 284;
      const xs = C.lin(0, 100, x0, x1);
      const svg = C.el("svg", { viewBox: "0 0 " + W + " " + H, cls: "chart", role: "img", "aria-label": t({ ar: "توزيع نسبة الصور في 100 دراسة", en: "Distribution of the share of heads across 100 studies" }) });
      C.el("rect", { x: 0, y: 0, width: W, height: H, rx: 10, cls: "ch-frame" }, svg);
      C.el("rect", { x: xs(-2.5), y: y0, width: xs(32.5) - xs(-2.5), height: y1 - y0, style: "fill:var(--redpen-soft)" }, svg);
      C.el("rect", { x: xs(67.5), y: y0, width: xs(102.5) - xs(67.5), height: y1 - y0, style: "fill:var(--redpen-soft)" }, svg);
      C.el("text", { x: xs(15), y: y0 + 18, "text-anchor": "middle", style: "fill:var(--redpen);font-weight:600;font-size:12px;paint-order:stroke;stroke:var(--ch-bg);stroke-width:4px", text: t({ ar: "«منحازة!»", en: "\"Biased!\"" }) }, svg);
      C.el("text", { x: xs(85), y: y0 + 18, "text-anchor": "middle", style: "fill:var(--redpen);font-weight:600;font-size:12px;paint-order:stroke;stroke:var(--ch-bg);stroke-width:4px", text: t({ ar: "«منحازة!»", en: "\"Biased!\"" }) }, svg);
      C.el("line", { x1: xs(50), x2: xs(50), y1: y0, y2: y1, style: "stroke:var(--truth);stroke-width:2;stroke-dasharray:5 5" }, svg);
      C.el("text", { x: xs(50), y: y0 + 18, "text-anchor": "middle", style: "fill:var(--truth);font-weight:600;font-size:12px;paint-order:stroke;stroke:var(--ch-bg);stroke-width:5px", text: t({ ar: "الحقيقة 50%", en: "truth 50%" }) }, svg);
      C.el("line", { x1: x0, x2: x1, y1: y1, y2: y1, cls: "ch-axis" }, svg);
      [0, 25, 50, 75, 100].forEach((v) => C.el("text", { x: xs(v), y: y1 + 18, "text-anchor": "middle", cls: "t-num", text: v + "%" }, svg));
      C.el("text", { x: (x0 + x1) / 2, y: y1 + 40, "text-anchor": "middle", cls: "t-axis", text: t({ ar: "نسبة الصور في كل دراسة", en: "Share of heads in each study" }) }, svg);

      const bins = {};
      const shown = results.slice(0, count);
      shown.forEach((p) => {
        const b = Math.round(p / 5) * 5;
        bins[b] = (bins[b] || 0) + 1;
      });
      const maxStack = Math.max(8, ...Object.values(bins).concat([0]));
      const d = Math.min(13, (y1 - y0 - 30) / maxStack);
      const stackPos = {};
      shown.forEach((p) => {
        const b = Math.round(p / 5) * 5;
        const j = (stackPos[b] = (stackPos[b] || 0) + 1) - 1;
        C.el("circle", { cx: xs(b), cy: y1 - d / 2 - j * d, r: d / 2 - 1, style: "fill:" + (isExtreme(p) ? "var(--redpen)" : "var(--c1)") }, svg);
      });
      host.innerHTML = "";
      host.appendChild(svg);
    }

    function readouts() {
      const extreme = results.filter(isExtreme).length;
      $("#smallExtreme").textContent = extreme + " / 100";
      $("#smallExtremeBox").className = "readout " + (extreme > 10 ? "is-bad" : "is-good");
      const moe = 1.96 * Math.sqrt(0.25 / n) * 100;
      $("#smallMoe").textContent = "±" + DL.fmt(moe, moe < 10 ? 1 : 0) + " " + t("نقطة", "pts");
      let kind;
      let msg;
      if (extreme >= 10) {
        kind = "bad";
        msg = {
          ar: "<strong>مع " + n + " رميات فقط</strong>، أعطت " + extreme + " دراسة من 100 نتيجة تكفي لعنوان «العملة منحازة!»، مع أن العملة عادلة تمامًا.",
          en: "<strong>With only " + n + " tosses</strong>, " + extreme + " of 100 studies produced a result good enough for a \"this coin is biased!\" headline, even though the coin is perfectly fair.",
        };
      } else if (extreme > 0) {
        kind = "warn";
        msg = {
          ar: "<strong>أفضل:</strong> مع " + n + " رمية تقلّ النتائج المتطرفة، لكنها لم تختفِ.",
          en: "<strong>Better:</strong> with " + n + " tosses extreme results are rarer, but they haven't vanished.",
        };
      } else {
        kind = "good";
        msg = {
          ar: "<strong>مع " + n + " رمية</strong> تتجمع النتائج قرب 50%. العيّنات الكبيرة لا تضمن الحقيقة، لكنها تقلّل حظ الصدفة كثيرًا.",
          en: "<strong>With " + n + " tosses</strong> the results cluster near 50%. Big samples don't guarantee the truth, but they shrink the role of luck a lot.",
        };
      }
      verdict($("#smallVerdict"), kind, t(msg));
    }

    DL.seg($("#smallN"), (v) => {
      n = +v;
      run();
    });
    $("#smallRun").addEventListener("click", run);
    run();
    document.addEventListener("dl:lang", () => {
      render(results.length);
      readouts();
    });

    // Hospital question
    let hosp = null;
    const out = $("#hospResult");
    function renderHosp() {
      $$("[data-hosp]").forEach((b) => {
        b.disabled = !!hosp;
        b.classList.toggle("is-active", !!hosp && b.dataset.hosp === "small");
      });
      if (!hosp) return;
      const right = hosp === "small";
      out.innerHTML =
        '<div class="explain' + (right ? "" : " explain--trick") + '"><h4>' + DL.icon(right ? "check" : "x") + (right ? t("صحيح!", "Correct!") : t("الإجابة: المستشفى الصغير", "Answer: the smaller hospital")) + "</h4><p>" +
        t(
          "مع نحو 15 ولادة يوميًا تكون تقلبات الصدفة أكبر، فتتكرر الأيام التي يتجاوز فيها الذكور 60%. حين طرح دانيال كانمان وعاموس تفيرسكي هذا السؤال عام 1972، أجاب أغلب الناس «تقريبًا متساويان».",
          "With about 15 births a day, chance swings are bigger, so days with over 60% boys come up more often. When Daniel Kahneman and Amos Tversky asked this in 1972, most people answered \"about the same\"."
        ) +
        "</p></div>";
    }
    $$("[data-hosp]").forEach((b) =>
      b.addEventListener("click", () => {
        hosp = b.dataset.hosp;
        renderHosp();
      })
    );
    DL.onLang(renderHosp);
  }

  /* =======================================================================
     5 · Relative vs absolute risk
     ======================================================================= */
  function initRisk() {
    const host = $("#riskGrid");
    if (!host) return;
    const base = $("#riskBase");
    const rel = $("#riskRel");

    function render() {
      const b = +base.value;
      const r = +rel.value;
      const after = b * (1 + r / 100);
      const extra = after - b;
      const shownAfter = Math.min(1000, Math.round(after));
      const shownExtra = shownAfter - b;
      $("#riskBaseOut").textContent = b + " / 1000";
      $("#riskRelOut").textContent = "+" + r + "%";

      const cols = 40;
      const cell = 12;
      const W = cols * cell;
      const H = 25 * cell;
      const svg = C.el("svg", { viewBox: "0 0 " + W + " " + H, cls: "chart", role: "img", "aria-label": t({ ar: "1000 شخص: " + b + " مصابون أصلًا، و" + shownExtra + " إصابات إضافية", en: "1,000 people: " + b + " affected anyway, " + shownExtra + " extra cases" }) });
      for (let i = 0; i < 1000; i++) {
        const c = i % cols;
        const rr = Math.floor(i / cols);
        const fill = i < b ? "var(--c3)" : i < shownAfter ? "var(--redpen)" : "var(--line)";
        C.el("rect", { x: c * cell + 1, y: rr * cell + 1, width: cell - 2, height: cell - 2, rx: 2, style: "fill:" + fill }, svg);
      }
      host.innerHTML = "";
      host.appendChild(svg);

      $("#riskHeadline").textContent = "“" + t({
        ar: r === 0 ? "دراسة: لا فرق في خطر الإصابة" : "تناول (س) يوميًا يرفع خطر الإصابة بنسبة " + r + "%!",
        en: r === 0 ? "Study: no change in risk" : "Eating X every day raises your risk by " + r + "%!",
      }) + "”";
      $("#riskPlain").textContent = t({
        ar: "بالأرقام البسيطة: من " + b + " إلى " + DL.fmt(after, after % 1 ? 1 : 0) + " شخص من كل 1000.",
        en: "In plain numbers: from " + b + " to " + DL.fmt(after, after % 1 ? 1 : 0) + " people in every 1,000.",
      });
      $("#riskLegend").innerHTML =
        '<span><i style="background:var(--c3)"></i>' + t("مصابون على أي حال", "Affected anyway") + " (" + b + ")</span>" +
        '<span><i style="background:var(--redpen)"></i>' + t("إصابات إضافية", "Extra cases") + " (" + shownExtra + ")</span>" +
        '<span><i style="background:var(--line)"></i>' + t("غير متأثرين", "Not affected") + "</span>";
      $("#riskRelR").textContent = "+" + r + "%";
      $("#riskAbs").textContent = "+" + DL.fmt(extra, extra % 1 ? 1 : 0) + t(" لكل 1000", " per 1,000");
      $("#riskNnh").textContent = extra > 0 ? DL.fmt(Math.round(1000 / extra), 0) : "—";

      const absPct = extra / 10;
      let kind;
      let msg;
      if (r === 0) {
        kind = "good";
        msg = { ar: "لا تغيير. حرّك المؤشرين لترى كيف تُكتب العناوين.", en: "No change. Move the sliders to see how headlines get written." };
      } else if (extra < 5) {
        kind = "warn";
        msg = {
          ar: "<strong>تغيّر نسبي كبير على أساس صغير:</strong> «+" + r + "%» تعني نحو " + DL.fmt(extra, extra % 1 ? 1 : 0) + " حالة إضافية لكل 1000 شخص، أي " + DL.fmt(absPct, 2) + " نقطة مئوية. اسأل دائمًا: كم كان الخطر في البداية؟",
          en: "<strong>A big relative change on a small base:</strong> \"+" + r + "%\" means about " + DL.fmt(extra, extra % 1 ? 1 : 0) + " extra cases per 1,000 people, or " + DL.fmt(absPct, 2) + " percentage points. Always ask: what was the risk to begin with?",
        };
      } else {
        kind = "bad";
        msg = {
          ar: "<strong>هنا الزيادة المطلقة كبيرة أيضًا:</strong> " + DL.fmt(extra, 0) + " حالة إضافية لكل 1000 شخص. حين يكون الخطر الأصلي مرتفعًا، تستحق الزيادة النسبية الاهتمام فعلًا.",
          en: "<strong>Here the absolute increase is large too:</strong> " + DL.fmt(extra, 0) + " extra cases per 1,000 people. When the starting risk is high, a relative increase really does matter.",
        };
      }
      verdict($("#riskVerdict"), kind, t(msg));
    }
    base.addEventListener("input", render);
    rel.addEventListener("input", render);
    DL.onLang(render);
  }

  initCorrelation();
  initSampling();
  initSimpson();
  initSmall();
  initRisk();
})();
