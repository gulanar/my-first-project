/* DataLens · Part 3: AI as a fact-checker */
(function () {
  "use strict";
  const DL = window.DL;
  const { $, $$ } = DL;
  const t = DL.t;

  /* =======================================================================
     Timeline: the line fills as you scroll, steps light up
     ======================================================================= */
  function initTimeline() {
    const wrap = $("#timeline");
    if (!wrap) return;
    const fill = $(".timeline__fill", wrap);
    const items = $$(".timeline__item", wrap);
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = wrap.getBoundingClientRect();
      const mid = window.innerHeight * 0.6;
      const p = DL.clamp((mid - r.top) / r.height, 0, 1);
      fill.style.setProperty("--h", (p * 100).toFixed(1) + "%");
      items.forEach((it) => {
        const ir = it.getBoundingClientRect();
        it.classList.toggle("is-lit", ir.top + 28 < mid);
      });
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
  }

  /* =======================================================================
     Prompt builder
     ======================================================================= */
  const WHERE = {
    social: { ar: "منشور على وسائل التواصل", en: "a social media post" },
    news: { ar: "مقال إخباري", en: "a news article" },
    ad: { ar: "إعلان", en: "an advertisement" },
    friend: { ar: "رسالة من صديق", en: "a message from a friend" },
    ai: { ar: "إجابة من مساعد ذكاء اصطناعي آخر", en: "an answer from another AI chatbot" },
  };
  const CHECKS = [
    {
      id: "source",
      on: true,
      label: { ar: "المصدر والجهة", en: "Source and who's behind it" },
      text: {
        ar: "من الجهة المرجّحة وراء هذا الرقم؟ وأي مصدر أصلي (جهة إحصاء رسمية، دراسة منشورة، استطلاع) قد يحتويه؟",
        en: "Who is likely behind this number, and what original source (an official statistics office, a published study, a survey) would contain it?",
      },
    },
    {
      id: "denominator",
      on: true,
      label: { ar: "المقام ونقطة البداية", en: "Denominator and starting point" },
      text: {
        ar: "هل هذا عدد أم نسبة مئوية أم معدّل؟ ما المقام أو القيمة التي بدأنا منها؟",
        en: "Is this a count, a percentage or a rate? What is the denominator or starting value?",
      },
    },
    {
      id: "sample",
      on: true,
      label: { ar: "العيّنة وطريقة الجمع", en: "Sample and method" },
      text: {
        ar: "إن جاء من استطلاع أو دراسة: ما حجم العيّنة وطريقة اختيارها اللذان يجعلانه موثوقًا؟ وما الذي قد يجعله متحيّزًا؟",
        en: "If it comes from a survey or study, what sample size and selection method would make it trustworthy, and what would make it biased?",
      },
    },
    {
      id: "causation",
      on: true,
      label: { ar: "السببية أم الارتباط", en: "Cause or correlation" },
      text: {
        ar: "هل يوحي الادعاء بعلاقة سبب ونتيجة؟ اذكر تفسيرات أخرى: عوامل خفية، أو سببية معكوسة، أو صدفة.",
        en: "Does the claim suggest cause and effect? List other explanations: hidden factors, reverse causation or chance.",
      },
    },
    {
      id: "relative",
      on: true,
      label: { ar: "نسبي أم مطلق", en: "Relative or absolute" },
      text: {
        ar: "إن استخدم تغيّرًا نسبيًا (مثل «يضاعف» أو «+50%»)، فترجمه إلى أرقام مطلقة، مثل «كذا من كل 1000 شخص».",
        en: "If it uses a relative change (like \"doubles\" or \"+50%\"), translate it into absolute numbers, for example \"X out of every 1,000 people\".",
      },
    },
    {
      id: "chart",
      on: false,
      label: { ar: "الرسم البياني", en: "The chart" },
      text: {
        ar: "إن كان هناك رسم بياني: افحص المحاور ونقطة بدايتها، والفترة الزمنية، وأي تأثيرات ثلاثية الأبعاد أو تكبير.",
        en: "If there is a chart, check the axes and where they start, the time range, and any 3D or scaling effects.",
      },
    },
    {
      id: "timeframe",
      on: false,
      label: { ar: "الفترة الزمنية المنتقاة", en: "Cherry-picked dates" },
      text: {
        ar: "هل الفترة الزمنية منتقاة؟ ماذا قد تُظهر فترة أطول؟",
        en: "Is the time period cherry-picked? What would a longer time range show?",
      },
    },
    {
      id: "steelman",
      on: false,
      label: { ar: "الرأي والرأي الآخر", en: "Both sides" },
      text: {
        ar: "قدّم أقوى حجة على أن الادعاء دقيق، ثم أقوى حجة على أنه مضلِّل.",
        en: "Give the strongest case that the claim is accurate, then the strongest case that it is misleading.",
      },
    },
  ];
  const EXAMPLES = [
    { where: "news", ar: "دراسة جديدة: شاربو القهوة يعيشون أطول.", en: "New study: coffee drinkers live longer." },
    { where: "social", ar: "الجريمة في مدينتنا ارتفعت 200% هذا العام!", en: "Crime in our city rose 200% this year!" },
    { where: "ad", ar: "9 من كل 10 أطباء أسنان يوصون بمعجوننا.", en: "9 out of 10 dentists recommend our toothpaste." },
    { where: "ai", ar: "قال لي مساعد ذكي إن 73.4% من الطلاب يغشّون في الامتحانات.", en: "An AI chatbot told me 73.4% of students cheat in exams." },
  ];

  function initBuilder() {
    const form = $("#builderForm");
    if (!form) return;
    const claim = $("#bClaim");
    const where = $("#bWhere");
    const checksHost = $("#bChecks");
    const out = $("#bOut");
    let style = "simple";
    const state = {};
    CHECKS.forEach((c) => (state[c.id] = c.on));
    let touched = false;

    function renderControls() {
      $$("option", where).forEach((o) => (o.textContent = t(WHERE[o.value])));
      checksHost.innerHTML = CHECKS.map(
        (c) =>
          '<label class="check"><input type="checkbox" data-check="' + c.id + '"' + (state[c.id] ? " checked" : "") + "><span>" + DL.escape(t(c.label)) + "</span></label>"
      ).join("");
      $$("input[data-check]", checksHost).forEach((i) =>
        i.addEventListener("change", () => {
          state[i.dataset.check] = i.checked;
          build();
        })
      );
      $("#bExamples").innerHTML =
        '<span class="txt-muted" style="font-size:.85rem;align-self:center">' + t("أمثلة:", "Examples:") + "</span>" +
        EXAMPLES.map((e, i) => '<button class="chip" type="button" data-ex="' + i + '" style="min-height:32px;font-size:.82rem">' + DL.escape(t(e).slice(0, 34)) + (t(e).length > 34 ? "…" : "") + "</button>").join("");
      $$("[data-ex]").forEach((b) =>
        b.addEventListener("click", () => {
          const e = EXAMPLES[+b.dataset.ex];
          claim.value = t(e);
          where.value = e.where;
          touched = true;
          build();
        })
      );
      if (!touched) {
        claim.value = t(EXAMPLES[0]);
        where.value = EXAMPLES[0].where;
      }
    }

    function promptText() {
      const ar = DL.lang() === "ar";
      const c = claim.value.trim() || (ar ? "[الصق الادعاء هنا]" : "[paste the claim here]");
      const chosen = CHECKS.filter((k) => state[k.id]);
      const lines = [];
      if (ar) {
        lines.push("رأيت هذا الادعاء في " + t(WHERE[where.value]) + ":");
        lines.push("«" + c + "»");
        lines.push("");
        lines.push("ساعدني على تقييمه بعين ناقدة. لا تخبرني بعد إن كان صحيحًا أم خاطئًا، بل:");
        lines.push("1. أعد صياغة الادعاء بدقة: أي رقم، وعن ماذا، ومقارنةً بماذا، وفي أي فترة.");
        chosen.forEach((k, i) => lines.push(i + 2 + ". " + k.text.ar));
        lines.push(chosen.length + 2 + ". أخبرني بالمعلومات الناقصة للحكم عليه، ومدى ثقتك في كل نقطة.");
        lines.push("");
        lines.push("قواعد: لا تخترع أرقامًا أو دراسات أو روابط. إن ذكرت مصدرًا فاذكر اسمه الكامل لأبحث عنه بنفسي، وقل بوضوح إن لم تكن متأكدًا من وجوده.");
        lines.push(style === "simple" ? "استخدم لغة بسيطة يفهمها طالب في الخامسة عشرة، واختصر." : "كن شاملًا ونظّم إجابتك تحت عناوين.");
      } else {
        lines.push("I saw this claim in " + t(WHERE[where.value]) + ":");
        lines.push('"' + c + '"');
        lines.push("");
        lines.push("Please help me evaluate it critically. Don't tell me yet whether it is true or false. Instead:");
        lines.push("1. Restate the exact claim: what number, about what, compared with what, and over what period.");
        chosen.forEach((k, i) => lines.push(i + 2 + ". " + k.text.en));
        lines.push(chosen.length + 2 + ". Tell me what information is missing to judge it, and how confident you are in each point.");
        lines.push("");
        lines.push("Rules: don't invent numbers, studies or links. If you mention a source, give its full name so I can look it up myself, and say clearly when you're not sure it exists.");
        lines.push(style === "simple" ? "Use plain language a 15-year-old could follow, and keep it short." : "Be thorough and organise your answer under headings.");
      }
      return lines.join("\n");
    }

    function build() {
      out.textContent = promptText();
    }

    const copy = () =>
      DL.copy(promptText()).then((ok) => {
        DL.toast(ok ? t("نُسخ السؤال. الصقه في المحادثة.", "Prompt copied. Paste it into the chat.") : t("تعذّر النسخ. حدّد النص وانسخه يدويًا.", "Couldn't copy. Select the text and copy it manually."), ok ? "check" : "alert");
        if (!ok) {
          const range = document.createRange();
          range.selectNodeContents(out);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });

    claim.addEventListener("input", () => {
      touched = true;
      build();
    });
    where.addEventListener("change", build);
    form.addEventListener("submit", (e) => e.preventDefault());
    DL.seg($("#bStyle"), (v) => {
      style = v;
      build();
    });
    $("#bCopy").addEventListener("click", copy);
    $$("[data-open-ai]").forEach((a) => a.addEventListener("click", copy));
    $("#bReset").addEventListener("click", () => {
      touched = true;
      claim.value = "";
      CHECKS.forEach((c) => (state[c.id] = c.on));
      renderControls();
      build();
      claim.focus();
    });

    DL.onLang(() => {
      if (!touched) claim.value = "";
      renderControls();
      build();
    });
  }

  /* =======================================================================
     Prompt library
     ======================================================================= */
  const CATS = {
    dissect: { ar: "التشريح", en: "Dissect", icon: "lens" },
    sources: { ar: "المصادر", en: "Sources", icon: "link" },
    numbers: { ar: "الأرقام", en: "Numbers", icon: "percent" },
    charts: { ar: "الرسوم", en: "Charts", icon: "bars" },
    bias: { ar: "التحيّز", en: "Bias", icon: "users" },
    self: { ar: "مراجعة الذات", en: "Self-check", icon: "bot" },
  };
  const PROMPTS = [
    {
      cat: "dissect",
      title: { ar: "ماذا أحتاج أن أعرف؟", en: "What would I need to know?" },
      text: {
        ar: "هذا ادعاء: [الصق الادعاء]. لا تخبرني إن كان صحيحًا. اذكر المعلومات التي أحتاجها للحكم عليه، وكيف قد تغيّر كل معلومة الحكم.",
        en: "Here is a claim: [paste the claim]. Don't tell me whether it's true. List the information I would need to judge it, and how each piece could change the verdict.",
      },
    },
    {
      cat: "dissect",
      title: { ar: "إعادة صياغة محايدة", en: "A neutral rewrite" },
      text: {
        ar: "أعد كتابة هذا العنوان ليكون دقيقًا ومحايدًا، ويذكر الرقم الأساسي بعبارات بسيطة: [الصق العنوان].",
        en: "Rewrite this headline so it is accurate and neutral, and states the key number in plain terms: [paste the headline].",
      },
    },
    {
      cat: "sources",
      title: { ar: "ابحث عن الأصل", en: "Find the original" },
      text: {
        ar: "أي مصدر أصلي (جهة إحصاء رسمية، دراسة منشورة، تقرير حكومي) قد يحتوي هذا الرقم؟ أعطني أسماء كاملة أبحث عنها. إن لم تكن متأكدًا من وجود مصدر فقل ذلك بدل التخمين.",
        en: "Which original source (an official statistics office, a published study, a government report) would contain this number? Give me full names I can search for. If you're not sure a source exists, say so instead of guessing.",
      },
    },
    {
      cat: "sources",
      title: { ar: "تحقّق من مرجع", en: "Check a citation" },
      text: {
        ar: "ذكرتَ [الدراسة أو التقرير]. ماذا يقيس بالضبط؟ ومن نشره ومتى؟ إن لم تستطع تأكيد هذه التفاصيل فقل ذلك صراحة.",
        en: "You mentioned [the study or report]. What exactly does it measure, who published it and when? If you can't confirm these details, say so plainly.",
      },
    },
    {
      cat: "numbers",
      title: { ar: "من النسبي إلى المطلق", en: "Relative to absolute" },
      text: {
        ar: "يقول الخبر إن الخطر يرتفع بنسبة [X%]. اشرح هل هذا تغيّر نسبي أم مطلق، وماذا يعني لكل 1000 شخص بافتراض خطر بداية معتاد. أظهر خطوات الحساب.",
        en: "This says the risk rises by [X%]. Explain whether that is a relative or an absolute change, and show what it means per 1,000 people using a typical starting risk. Show your working.",
      },
    },
    {
      cat: "numbers",
      title: { ar: "أعد الحساب", en: "Redo the maths" },
      text: {
        ar: "هذه هي الأرقام: [الصق الأرقام]. احسب نسبة التغيّر خطوة بخطوة، وأخبرني هل يطابق رقم الادعاء حسابك.",
        en: "Here are the numbers: [paste them]. Calculate the percentage change step by step, and tell me whether the claim's figure matches.",
      },
    },
    {
      cat: "charts",
      title: { ar: "اقرأ الرسم", en: "Read the chart" },
      text: {
        ar: "أرفقت رسمًا بيانيًا. صِف محاوره، ومن أين يبدأ كل محور، والفترة الزمنية، والوحدات. وأشر إلى أي شيء قد يضخّم التغيّر أو يخفيه.",
        en: "I've attached a chart. Describe its axes, where each axis starts, the time range and the units. Point out anything that could exaggerate or hide a change.",
      },
    },
    {
      cat: "charts",
      title: { ar: "أعد الرسم بإنصاف", en: "Redraw it honestly" },
      text: {
        ar: "كيف تعيد رسم هذا الرسم البياني ليمثّل البيانات بإنصاف؟ اشرح ما ستغيّره ولماذا.",
        en: "How would you redraw this chart so it represents the data fairly? Explain what you would change and why.",
      },
    },
    {
      cat: "bias",
      title: { ar: "من الذين سُئلوا؟", en: "Who was asked?" },
      text: {
        ar: "هذا الرقم من استطلاع. ما الأسئلة التي يجب أن أطرحها عن المشاركين، وطريقة اختيارهم، وصياغة السؤال؟",
        en: "This figure comes from a survey. What should I ask about who took part, how they were chosen and how the question was worded?",
      },
    },
    {
      cat: "bias",
      title: { ar: "تفسيرات أخرى", en: "Other explanations" },
      text: {
        ar: "يربط هذا الادعاء بين [أ] و[ب]. أعطني ثلاثة تفسيرات على الأقل غير أن [أ] يسبّب [ب]، منها العوامل الخفية والسببية المعكوسة.",
        en: "This claim links [A] and [B]. Give me at least three explanations other than A causing B, including hidden factors and reverse causation.",
      },
    },
    {
      cat: "self",
      title: { ar: "علّم على تخميناتك", en: "Mark your guesses" },
      text: {
        ar: "راجع إجابتك. علّم كل رقم أو معلومة لم تأخذها من مصدر تستطيع تسميته، وقيّم ثقتك في كل منها.",
        en: "Go back over your answer. Mark every number or fact you didn't take from a source you can name, and rate your confidence in each.",
      },
    },
    {
      cat: "self",
      title: { ar: "دافع عن الرأي الآخر", en: "Argue the other side" },
      text: {
        ar: "الآن دافع عن الرأي المعاكس: قدّم أقوى حجة على أن هذه الإحصائية دقيقة ومعروضة بإنصاف.",
        en: "Now argue the opposite: make the strongest case that this statistic is accurate and fairly presented.",
      },
    },
  ];

  function initLibrary() {
    const grid = $("#libGrid");
    if (!grid) return;
    let current = "all";
    const filter = DL.filterChips($("#libFilters"), () => $$(".prompt-card", grid), (v) => (current = v));
    function render() {
      grid.innerHTML = PROMPTS.map((p, i) => {
        const cat = CATS[p.cat];
        return (
          '<article class="prompt-card" data-tags="' + p.cat + '">' +
          '<span class="badge">' + DL.icon(cat.icon) + DL.escape(t(cat)) + "</span>" +
          "<h3>" + DL.escape(t(p.title)) + "</h3>" +
          '<p class="prompt-card__text">' + DL.escape(t(p.text)) + "</p>" +
          '<button class="copy-btn" type="button" data-copy="' + i + '">' + DL.icon("copy") + "<span>" + t("نسخ", "Copy") + "</span></button>" +
          "</article>"
        );
      }).join("");
      $$("[data-copy]", grid).forEach((b) =>
        b.addEventListener("click", () => {
          DL.copy(t(PROMPTS[+b.dataset.copy].text)).then((ok) => {
            if (!ok) return DL.toast(t("تعذّر النسخ.", "Couldn't copy."), "alert");
            b.classList.add("is-copied");
            b.innerHTML = DL.icon("check") + "<span>" + t("تم النسخ", "Copied") + "</span>";
            setTimeout(() => {
              b.classList.remove("is-copied");
              b.innerHTML = DL.icon("copy") + "<span>" + t("نسخ", "Copy") + "</span>";
            }, 1800);
          });
        })
      );
      filter.apply(current);
    }
    DL.onLang(render);
  }

  /* =======================================================================
     Spot the hallucination
     ======================================================================= */
  const QUESTION = {
    ar: "أليس صحيحًا أن لا أحد تقريبًا يتحقق من الأخبار قبل مشاركتها على الإنترنت؟",
    en: "Isn't it true that almost nobody checks the news before sharing it online?",
  };
  const KIND = {
    sycophancy: { ar: "مجاملة", en: "Agreeing with the user" },
    fabricated: { ar: "مصدر ورقم مختلَقان", en: "Made-up source and number" },
    math: { ar: "خطأ حسابي", en: "Arithmetic slip" },
    link: { ar: "رابط لا يمكن التحقق منه", en: "Unverifiable link" },
  };
  const SENTENCES = [
    {
      bad: "sycophancy",
      ar: "أنت محق تمامًا، لا أحد تقريبًا يفعل ذلك.",
      en: "You're absolutely right, almost nobody does.",
      why: {
        ar: "وافق على السؤال كما صيغ. الصياغة «أليس صحيحًا…» قادت الإجابة، والمساعد الجيد يختبر الفرضية ولا يردّدها.",
        en: "It agreed with the question as worded. \"Isn't it true…\" led the answer; a good assistant tests the premise instead of echoing it.",
      },
    },
    {
      bad: "fabricated",
      ar: "وجدت دراسة أجراها المعهد العالمي لمحو الأمية الإعلامية عام 2021 أن 23.7% بالضبط من المستخدمين يتحققون من الخبر قبل مشاركته.",
      en: "A 2021 study by the Global Institute for Media Literacy found that exactly 23.7% of users verify a story before sharing it.",
      why: {
        ar: "رقم دقيق جدًا منسوب إلى جهة ذات اسم رسمي، بلا أي طريقة للتحقق. هذا هو الشكل المعتاد للإحصائية المهلوَسة. (المعهد في هذا المثال خيالي.)",
        en: "A very precise number credited to an official-sounding body, with no way to check it. This is the classic shape of a hallucinated statistic. (The institute in this example is fictional.)",
      },
    },
    {
      bad: "math",
      ar: "أي إن شخصًا من كل ثلاثة تقريبًا يتحقق من معلوماته.",
      en: "That means roughly one in three people check their facts.",
      why: { ar: "خطأ حسابي: 23.7% أقرب إلى شخص من كل أربعة، لا من كل ثلاثة.", en: "Arithmetic slip: 23.7% is closer to one in four than one in three." },
    },
    {
      bad: null,
      ar: "تختلف النتائج كثيرًا بين الدول والفئات العمرية، وبحسب تعريف الاستطلاع لكلمة «التحقق».",
      en: "Results vary a lot between countries and age groups, and with how a survey defines \"checking\".",
      why: { ar: "تحفّظ معقول ومفيد. لا شيء يستحق الإشارة هنا.", en: "A sensible, useful caveat. Nothing to flag here." },
    },
    {
      bad: "link",
      ar: "وأكّد استطلاع شمل 50 ألف شخص في 40 دولة الرقم نفسه عام 2024 (المصدر: www.media-literacy-stats.example/report2024).",
      en: "A 2024 survey of 50,000 people in 40 countries confirmed the same figure (source: www.media-literacy-stats.example/report2024).",
      why: {
        ar: "رابط لا يمكن التحقق منه، وتأكيد دقيق بشكل مريب: نادرًا ما تصل دراستان حقيقيتان إلى الكسر العشري نفسه. افتح الرابط قبل أن تثق به؛ الروابط المخترعة شائعة.",
        en: "An unverifiable link and a suspiciously exact confirmation: two real studies rarely land on the same decimal. Open a link before you trust it; invented URLs are common.",
      },
    },
    {
      bad: null,
      ar: "إن كنت تحتاج إلى رقم موثوق، فابحث عن استطلاعات حديثة من مؤسسات بحثية معروفة، واقرأ كيف صاغت السؤال.",
      en: "If you need a reliable figure, look for recent surveys from established research organisations and read how they worded the question.",
      why: { ar: "نصيحة جيدة: توجّهك إلى المصادر الأصلية بدل إعطائك رقمًا.", en: "Good advice: it points you to primary sources instead of handing you a number." },
    },
  ];

  function initChat() {
    const answer = $("#chatA");
    if (!answer) return;
    const flags = new Set();
    let checked = false;
    let typed = false;

    function render() {
      $("#chatQ").textContent = t(QUESTION);
      if (!typed) return;
      answer.innerHTML = SENTENCES.map((s, i) => {
        let cls = "sent";
        if (checked) {
          if (flags.has(i) && s.bad) cls += " is-right";
          else if (flags.has(i) && !s.bad) cls += " is-wrong";
          else if (!flags.has(i) && s.bad) cls += " is-missed";
        } else if (flags.has(i)) cls += " is-flagged";
        return '<span class="' + cls + '" role="button" tabindex="0" aria-pressed="' + flags.has(i) + '" data-s="' + i + '">' + DL.escape(t(s)) + "</span>";
      }).join(" ");
      $$(".sent", answer).forEach((el) => {
        const toggle = () => {
          if (checked) return;
          const i = +el.dataset.s;
          if (flags.has(i)) flags.delete(i);
          else flags.add(i);
          render();
          const again = answer.querySelector('[data-s="' + i + '"]');
          if (again) again.focus();
        };
        el.addEventListener("click", toggle);
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        });
      });
      $("#chatCount").textContent = checked ? "" : t("جمل مُعلَّمة: ", "Flagged sentences: ") + flags.size;
      renderResult();
    }

    function renderResult() {
      const list = $("#chatResult");
      if (!checked) {
        list.innerHTML = "";
        return;
      }
      const bad = SENTENCES.filter((s) => s.bad).length;
      const caught = SENTENCES.filter((s, i) => s.bad && flags.has(i)).length;
      const falseAlarms = SENTENCES.filter((s, i) => !s.bad && flags.has(i)).length;
      $("#chatCount").innerHTML =
        "<strong>" + t("كشفت ", "You caught ") + caught + " / " + bad + "</strong>" + t(" من المشكلات", " problems") +
        (falseAlarms ? " · " + falseAlarms + t(" إنذار خاطئ", " false alarm" + (falseAlarms > 1 ? "s" : "")) : "");
      list.innerHTML = SENTENCES.map((s, i) => {
        const ok = !!s.bad === flags.has(i);
        return (
          '<li style="--d:' + i * 90 + 'ms">' +
          DL.icon(s.bad ? "alert" : "check", s.bad ? "txt-trick" : "txt-truth") +
          "<div><b>" + (s.bad ? DL.escape(t(KIND[s.bad])) : t("جملة سليمة", "A fine sentence")) +
          (ok ? "" : ' <span class="badge ' + (s.bad ? "badge--trick" : "badge--warn") + '">' + (s.bad ? t("فاتتك", "missed") : t("إنذار خاطئ", "false alarm")) + "</span>") +
          '</b><span class="txt-muted">«' + DL.escape(t(s).slice(0, 70)) + (t(s).length > 70 ? "…" : "") + "»</span><br>" + DL.escape(t(s.why)) + "</div></li>"
        );
      }).join("");
      if (caught === bad && !falseAlarms) DL.confetti();
    }

    $("#chatCheck").addEventListener("click", () => {
      if (!typed) return;
      checked = true;
      render();
    });
    $("#chatReset").addEventListener("click", () => {
      flags.clear();
      checked = false;
      render();
    });

    const type = () => {
      if (typed) return;
      setTimeout(
        () => {
          typed = true;
          render();
        },
        DL.reduced() ? 0 : 1100
      );
    };
    if ("IntersectionObserver" in window && !DL.reduced()) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          type();
          io.disconnect();
        }
      }, { threshold: 0.4 });
      io.observe(answer);
    } else type();
    DL.onLang(render);
  }

  initTimeline();
  initBuilder();
  initLibrary();
  initChat();
})();
