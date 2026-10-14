/* DataLens · The challenge: "Is this chart honest?" + trap quiz */
(function () {
  "use strict";
  const DL = window.DL;
  const C = DL.chart;
  const { $, $$ } = DL;
  const t = DL.t;

  const M = (i) => ({
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"][i],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
  });

  /* =======================================================================
     Chart rounds
     ======================================================================= */
  const ROUNDS = [
    {
      id: "rain",
      honest: true,
      ctx: { ar: "من نشرة طقس محلية", en: "From a local weather bulletin" },
      spec: {
        type: "bar",
        title: { ar: "الأمطار الشهرية", en: "Monthly rainfall" },
        sub: { ar: "بالمليمتر، يناير–يونيو (توضيحي)", en: "Millimetres, January–June (illustrative)" },
        labels: [0, 1, 2, 3, 4, 5].map(M),
        values: [64, 52, 41, 30, 18, 6],
        yMin: 0,
        yMax: 80,
        ticks: [0, 20, 40, 60, 80],
      },
      explain: {
        ar: "الأعمدة تبدأ من الصفر، والأشهر متباعدة بانتظام، والوحدات واضحة. لا شيء هنا يلوي الأرقام.",
        en: "The bars start at zero, the months are evenly spaced and the units are labelled. Nothing here bends the numbers.",
      },
      link: "charts.html#guide",
    },
    {
      id: "school",
      honest: false,
      trickName: { ar: "محور مقطوع", en: "Truncated axis" },
      region: "yaxis",
      note: { ar: "يبدأ من 70", en: "starts at 70" },
      ctx: { ar: "من منشور ترويجي لمدرسة", en: "From a school's promotional post" },
      spec: {
        type: "bar",
        title: { ar: "مدرستنا تتفوّق بفارق كبير!", en: "Our school is far ahead!" },
        sub: { ar: "متوسط درجات الاختبار (توضيحي)", en: "Average test score (illustrative)" },
        labels: [
          { ar: "مدرسة أخرى", en: "Other school" },
          { ar: "مدرستنا", en: "Our school" },
        ],
        values: [71, 74],
        yMin: 70,
        yMax: 75,
        ticks: [70, 71, 72, 73, 74, 75],
        barCls: ["ch-bar--4", ""],
        barRatio: 0.46,
      },
      explain: {
        ar: "المحور يبدأ من 70، فيبدو فارق 3 نقاط (نحو 4%) وكأن مدرستنا حصلت على أربعة أضعاف الدرجات.",
        en: "The axis starts at 70, so a 3-point gap (about 4%) makes our school look as if it scored four times as much.",
      },
      link: "charts.html#truncated",
    },
    {
      id: "temp",
      honest: true,
      ctx: { ar: "من تقرير هيئة أرصاد جوية", en: "From a weather service report" },
      spec: {
        type: "line",
        title: { ar: "متوسط حرارة أغسطس يرتفع", en: "August temperatures are rising" },
        sub: { ar: "متوسط درجة الحرارة بالدرجات المئوية، 1990–2020 (توضيحي)", en: "Average temperature, °C, 1990–2020 (illustrative)" },
        labels: ["1990", "1995", "2000", "2005", "2010", "2015", "2020"],
        values: [30.1, 30.3, 30.2, 30.6, 30.8, 31.1, 31.4],
        yMin: 29.5,
        yMax: 32,
        ticks: [29.5, 30, 30.5, 31, 31.5, 32],
        digits: 1,
        unit: "°",
      },
      explain: {
        ar: "المحور لا يبدأ من الصفر، لكن هذا رسم خطي يعرض التغيّر، وأرقام محوره واضحة. الصفر المئوي لا معنى له هنا. الارتفاع البالغ نحو 1.3 درجة معروض بإنصاف.",
        en: "The axis doesn't start at zero, but this is a line chart about change and its axis is clearly labelled. Zero °C would mean nothing here. The rise of about 1.3 °C is shown fairly.",
      },
      link: "charts.html#truncated",
    },
    {
      id: "pie3d",
      honest: false,
      trickName: { ar: "فطيرة ثلاثية الأبعاد", en: "3D pie" },
      region: "plot",
      note: { ar: "الأصغر في المقدمة", en: "smallest slice, in front" },
      ctx: { ar: "من إعلان للعلامة (د)", en: "From an ad by brand D" },
      spec: {
        type: "pie3d",
        title: { ar: "العلامة (د) تتصدّر السوق!", en: "Brand D leads the market!" },
        sub: { ar: "حصة سوق الهواتف (توضيحي)", en: "Phone market share (illustrative)" },
        values: [28, 26, 24, 22],
        labels: [
          { ar: "العلامة (أ)", en: "Brand A" },
          { ar: "العلامة (ب)", en: "Brand B" },
          { ar: "العلامة (ج)", en: "Brand C" },
          { ar: "العلامة (د)", en: "Brand D" },
        ],
        tilt: 0.48,
        rotation: 220,
        depth: 48,
      },
      explain: {
        ar: "للعلامة (د) أصغر حصة فعليًا (22%)، لكن الإمالة تضعها في المقدمة، فيجعلها المنظور والجدار الجانبي تبدو الأكبر.",
        en: "Brand D actually has the smallest share (22%), but the tilt puts it at the front, where perspective and the side wall make it look the biggest.",
      },
      link: "charts.html#pie3d",
    },
    {
      id: "roads",
      honest: false,
      trickName: { ar: "محور مقلوب", en: "Inverted axis" },
      region: "yaxis",
      note: { ar: "الصفر في الأعلى", en: "zero at the top" },
      ctx: { ar: "من منشور على وسائل التواصل", en: "From a social media post" },
      spec: {
        type: "line",
        title: { ar: "حوادث الطرق في تراجع", en: "Road accidents are going down" },
        sub: { ar: "عدد الحوادث شهريًا (توضيحي)", en: "Accidents per month (illustrative)" },
        labels: [0, 1, 2, 3, 4, 5].map(M),
        values: [210, 225, 240, 262, 280, 301],
        yMin: 0,
        yMax: 350,
        ticks: [0, 100, 200, 300],
        invert: true,
        area: true,
      },
      explain: {
        ar: "المحور مقلوب. ارتفعت الحوادث فعليًا من 210 إلى 301 حادث شهريًا.",
        en: "The axis is upside down. Accidents actually rose from 210 to 301 a month.",
      },
      link: "charts.html#spot",
    },
    {
      id: "pie",
      honest: true,
      ctx: { ar: "من تقرير مدرسي", en: "From a school report" },
      spec: {
        type: "pie",
        title: { ar: "كيف يصل الطلاب إلى المدرسة", en: "How students get to school" },
        sub: { ar: "استطلاع لـ600 طالب، إجابة واحدة لكل طالب (توضيحي)", en: "Survey of 600 students, one answer each (illustrative)" },
        values: [45, 35, 20],
        labels: [
          { ar: "مشيًا", en: "Walk" },
          { ar: "بالحافلة", en: "Bus" },
          { ar: "بالسيارة", en: "Car" },
        ],
        legendValues: ["45%", "35%", "20%"],
      },
      explain: {
        ar: "سؤال واحد وإجابة واحدة لكل طالب، وثلاثة أجزاء مجموعها 100% مع تسميات واضحة. الفطيرة المسطّحة مناسبة حين تكون الشرائح قليلة.",
        en: "One question, one answer per student, three parts that add up to 100% and clear labels. A flat pie works when there are only a few slices.",
      },
      link: "charts.html#pie3d",
    },
    {
      id: "museum",
      honest: false,
      trickName: { ar: "فترة منتقاة", en: "Cherry-picked range" },
      region: "xaxis",
      note: { ar: "3 أشهر فقط", en: "only 3 months" },
      ctx: { ar: "من منشور يطالب بإغلاق المتحف", en: "From a post calling for the museum to close" },
      spec: {
        type: "line",
        title: { ar: "زوار المتحف ينهارون!", en: "Museum visitors collapse!" },
        sub: { ar: "الزوار بالآلاف، فبراير–أبريل 2025 (توضيحي)", en: "Visitors in thousands, Feb–Apr 2025 (illustrative)" },
        labels: [1, 2, 3].map(M),
        values: [48, 44, 39],
        yMin: 38,
        yMax: 50,
        ticks: [38, 42, 46, 50],
        lineCls: "ch-line--trick",
        showValues: true,
      },
      explain: {
        ar: "يعرض الرسم ثلاثة أشهر فقط، ومحوره مكبّر ليبدو الهبوط حادًا. الزيارات تنخفض عادة بعد عطلة الشتاء؛ عام كامل أو عدة أعوام ستُظهر إن كان هذا اتجاهًا حقيقيًا.",
        en: "Only three months are shown, and the axis is zoomed in to make the drop look steep. Visits often dip after the winter holidays; a full year, or several, would show whether this is a real trend.",
      },
      link: "charts.html#cherry",
    },
    {
      id: "uneven",
      honest: false,
      trickName: { ar: "فواصل غير متساوية", en: "Uneven intervals" },
      region: "xaxis",
      note: { ar: "فجوات غير متساوية", en: "uneven gaps" },
      ctx: { ar: "من عرض تقديمي لشركة", en: "From a company presentation" },
      spec: {
        type: "line",
        title: { ar: "المبيعات تنمو بالوتيرة نفسها", en: "Sales grow at the same steady pace" },
        sub: { ar: "المبيعات السنوية بالآلاف (توضيحي)", en: "Annual sales, thousands (illustrative)" },
        labels: ["2000", "2005", "2015", "2020", "2023", "2024"],
        values: [10, 20, 30, 40, 50, 60],
        yMin: 0,
        yMax: 70,
        ticks: [0, 20, 40, 60],
      },
      explain: {
        ar: "التواريخ متباعدة بالتساوي على الورق، لكن الفجوات تتراوح بين سنة وعشر سنوات. الخط «الثابت» يخفي أن النمو قفز من ألف في السنة إلى عشرة آلاف في السنة.",
        en: "The dates are evenly spaced on the page, but the gaps range from 1 to 10 years. The \"steady\" line hides that growth jumped from 1,000 a year to 10,000 a year.",
      },
      link: "charts.html#spot",
    },
    {
      id: "rates",
      honest: true,
      ctx: { ar: "من تقرير إحصائي رسمي", en: "From an official statistics report" },
      spec: {
        type: "hbar",
        title: { ar: "السرقات لكل 100 ألف ساكن", en: "Burglaries per 100,000 residents" },
        sub: { ar: "2024 (توضيحي)", en: "2024 (illustrative)" },
        labels: [
          { ar: "المدينة (ج)", en: "City C" },
          { ar: "المدينة (أ)", en: "City A" },
          { ar: "المدينة (ب)", en: "City B" },
        ],
        values: [450, 410, 380],
        xMax: 520,
        left: 100,
        barCls: ["", "ch-bar--2", "ch-bar--4"],
      },
      explain: {
        ar: "المعدّل لكل 100 ألف ساكن يسمح بمقارنة مدن مختلفة الحجم. الأعمدة تبدأ من الصفر ومرتّبة.",
        en: "Rates per 100,000 residents let you compare cities of different sizes. The bars start at zero and are sorted.",
      },
      link: "charts.html#guide",
    },
    {
      id: "counts",
      honest: false,
      trickName: { ar: "المقام الغائب", en: "Missing denominator" },
      region: "yaxis",
      note: { ar: "أعداد لا معدّلات", en: "counts, not rates" },
      ctx: { ar: "من موقع إخباري محلي", en: "From a local news site" },
      spec: {
        type: "bar",
        title: { ar: "المدينة الكبرى أخطر 14 مرة!", en: "Big City is 14 times more dangerous!" },
        sub: { ar: "عدد الجرائم المسجّلة، 2024 (توضيحي)", en: "Recorded crimes, 2024 (illustrative)" },
        labels: [
          { ar: "البلدة الصغيرة", en: "Small Town" },
          { ar: "المدينة الكبرى", en: "Big City" },
        ],
        values: [900, 12400],
        yMin: 0,
        yMax: 14000,
        ticks: [0, 3500, 7000, 10500, 14000],
        yTitle: { ar: "عدد الجرائم", en: "Number of crimes" },
        barCls: ["ch-bar--4", "ch-bar--trick"],
        barRatio: 0.46,
        left: 74,
      },
      explain: {
        ar: "هذه أعداد خام. يسكن المدينة الكبرى نحو مليوني شخص والبلدة الصغيرة 60 ألفًا، فيصبح المعدّل لكل 100 ألف ساكن نحو 620 في المدينة و1500 في البلدة: البلدة الصغيرة صاحبة المعدّل الأعلى فعليًا.",
        en: "These are raw counts. Big City has about 2 million people and Small Town 60,000, so per 100,000 residents the rates are about 620 and 1,500: the small town actually has the higher rate.",
      },
      link: "charts.html#guide",
    },
    {
      id: "ads",
      honest: false,
      trickName: { ar: "محوران بمقياسين مختلفين", en: "Mismatched dual axes" },
      region: "yaxis2",
      note: { ar: "980 إلى 1010 فقط", en: "only 980 to 1010" },
      noteOpts: { nyFrac: 0.8 },
      ctx: { ar: "من تقرير تسويقي", en: "From a marketing report" },
      spec: {
        type: "line",
        title: { ar: "الإنفاق الإعلاني يرفع المبيعات!", en: "Ad spending is lifting sales!" },
        sub: { ar: "الإنفاق الإعلاني (يسار) والمبيعات (يمين)، بالآلاف، توضيحي", en: "Ad spend (left) and sales (right), thousands, illustrative" },
        labels: [0, 1, 2, 3, 4, 5].map(M),
        values: [20, 30, 40, 50, 60, 70],
        yMin: 0,
        yMax: 80,
        ticks: [0, 20, 40, 60, 80],
        y2: { values: [985, 990, 994, 998, 1003, 1007], yMin: 980, yMax: 1010, ticks: [980, 990, 1000, 1010] },
        legend: [{ label: { ar: "الإعلانات", en: "Ad spend" } }, { label: { ar: "المبيعات", en: "Sales" } }],
      },
      explain: {
        ar: "اختير المحوران ليصعد الخطان معًا. تضاعف الإنفاق الإعلاني أكثر من ثلاث مرات بينما نمت المبيعات نحو 2% فقط؛ المحور الأيمن يبدأ من 980 ليبدو هذا الارتفاع الصغير حادًا.",
        en: "The two axes were chosen so the lines rise together. Ad spending more than tripled while sales grew only about 2%; the right axis starts at 980 to make that small rise look steep.",
      },
      link: "charts.html#spot",
    },
    {
      id: "subjects",
      honest: true,
      ctx: { ar: "من نشرة تعليمية", en: "From an education newsletter" },
      spec: {
        type: "hbar",
        title: { ar: "المادة المفضّلة لدى الطلاب", en: "Students' favourite subject" },
        sub: { ar: "استطلاع لـ1200 طالب، إجابة واحدة لكل طالب", en: "Survey of 1,200 students, one answer each" },
        source: { ar: "المصدر: استطلاع مدرسي، 2025 (توضيحي)", en: "Source: school survey, 2025 (illustrative)" },
        labels: [
          { ar: "الرياضيات", en: "Maths" },
          { ar: "العلوم", en: "Science" },
          { ar: "الفنون", en: "Art" },
          { ar: "اللغات", en: "Languages" },
          { ar: "الرياضة", en: "Sport" },
        ],
        values: [31, 24, 19, 14, 12],
        xMax: 38,
        unit: "%",
        left: 100,
      },
      explain: {
        ar: "أعمدة مرتّبة تبدأ من الصفر، وحجم عيّنة واضح، وإجابة واحدة لكل طالب، وسطر مصدر. هكذا يبدو الرسم المنصف.",
        en: "Sorted bars from zero, a clear sample size, one answer per student and a source line. This is what a fair chart looks like.",
      },
      link: "charts.html#guide",
    },
  ];

  /* =======================================================================
     Trap quiz
     ======================================================================= */
  const QUESTIONS = [
    {
      q: { ar: "عنوان يقول إن دواءً «يخفض خطر النوبة القلبية بنسبة 50%». ينخفض الخطر من 2 إلى 1 من كل 1000 شخص. ما الانخفاض المطلق؟", en: "A headline says a drug \"cuts heart-attack risk by 50%\". Risk falls from 2 to 1 in every 1,000 people. What is the absolute reduction?" },
      opts: [
        { ar: "شخص واحد من كل 1000", en: "1 in every 1,000 people" },
        { ar: "50%", en: "50%" },
        { ar: "شخص من كل اثنين", en: "1 in every 2 people" },
        { ar: "شخصان من كل 1000", en: "2 in every 1,000 people" },
      ],
      a: 0,
      why: { ar: "الـ50% نسبية. بالأرقام المطلقة يمنع الدواء حالة واحدة لكل 1000 شخص، أي 0.1 نقطة مئوية.", en: "The 50% is relative. In absolute terms the drug prevents one case per 1,000 people, or 0.1 percentage points." },
      link: "traps.html#risk",
    },
    {
      q: { ar: "في رسم بالأعمدة، ما أهم قاعدة لتكون المقارنة صادقة؟", en: "In a bar chart, which rule matters most for an honest comparison?" },
      opts: [
        { ar: "أن يبدأ محور القيم من الصفر", en: "The value axis starts at zero" },
        { ar: "أن تكون الأعمدة ثلاثية الأبعاد", en: "The bars are 3D" },
        { ar: "أن تُرتّب الأعمدة أبجديًا", en: "The bars are sorted alphabetically" },
        { ar: "أن تُستخدم ألوان زاهية", en: "The colours are bright" },
      ],
      a: 0,
      why: { ar: "نقارن الأعمدة بأطوالها، فإن لم تبدأ من الصفر لم تعد الأطوال تطابق الأرقام.", en: "We compare bars by length, so if they don't start at zero the lengths no longer match the numbers." },
      link: "charts.html#truncated",
    },
    {
      q: { ar: "استطلاع على موقع إخباري يجد أن 78% من القرّاء يعارضون ضريبة جديدة. ما المشكلة الأكبر؟", en: "A poll on a news website finds 78% of readers oppose a new tax. What is the biggest problem?" },
      opts: [
        { ar: "الاستجابة الطوعية: أصحاب الآراء القوية يجيبون أكثر", en: "Voluntary response: people with strong views reply most" },
        { ar: "النسبة مرتفعة جدًا لتكون صحيحة", en: "The percentage is too high to be true" },
        { ar: "كان يجب عرضها في فطيرة", en: "It should have been shown as a pie chart" },
        { ar: "لا مشكلة إن شارك آلاف القرّاء", en: "No problem if thousands of readers took part" },
      ],
      a: 0,
      why: { ar: "قرّاء الموقع ليسوا كل السكان، ومن يختار الإجابة ليس عيّنة عشوائية. الحجم الكبير لا يعالج هذا التحيّز.", en: "The site's readers aren't the whole population, and people who choose to answer aren't a random sample. A large size doesn't fix that bias." },
      link: "traps.html#sampling",
    },
    {
      q: { ar: "المدن التي فيها محلات مثلجات أكثر تشهد جرائم أكثر. ما التفسير الأرجح؟", en: "Cities with more ice-cream shops have more crime. What is the most likely explanation?" },
      opts: [
        { ar: "المثلجات تسبّب الجريمة", en: "Ice cream causes crime" },
        { ar: "الجريمة تسبّب افتتاح محلات مثلجات", en: "Crime causes ice-cream shops to open" },
        { ar: "عدد السكان يزيد الأمرين معًا", en: "Population size drives both" },
        { ar: "لا يمكن أن يكون هناك تفسير", en: "There can be no explanation" },
      ],
      a: 2,
      why: { ar: "المدن الأكبر فيها محلات أكثر من كل نوع، وجرائم أكثر بالعدد. السكان عامل ثالث خفي.", en: "Bigger cities have more shops of every kind and more crimes in total. Population is a hidden third factor." },
      link: "traps.html#correlation",
    },
    {
      q: { ar: "العلاج (أ) أنجح من (ب) لدى الرجال ولدى النساء، لكنه أسوأ عند جمع الفئتين. ما اسم هذه الظاهرة؟", en: "Treatment A beats B among men and among women, but loses when both groups are combined. What is this called?" },
      opts: [
        { ar: "تحيّز النجاة", en: "Survivorship bias" },
        { ar: "مفارقة سيمبسون", en: "Simpson's paradox" },
        { ar: "الانحدار نحو المتوسط", en: "Regression to the mean" },
        { ar: "الخطر النسبي", en: "Relative risk" },
      ],
      a: 1,
      why: { ar: "تنقلب النتيجة لأن الفئتين مختلفتان في الحجم أو الصعوبة. قارن المتشابه بالمتشابه.", en: "The result flips because the groups differ in size or difficulty. Compare like with like." },
      link: "traps.html#simpson",
    },
    {
      q: { ar: "دراسة على 12 شخصًا تجد أن مكمّلًا غذائيًا يقوّي الذاكرة. ما أول سؤال تطرحه؟", en: "A study of 12 people finds a supplement boosts memory. What should you ask first?" },
      opts: [
        { ar: "هل كانت هناك مجموعة مقارنة، وهل 12 شخصًا كافون؟", en: "Was there a comparison group, and are 12 people enough?" },
        { ar: "كم سعر المكمّل؟", en: "How much does the supplement cost?" },
        { ar: "هل المكمّل مشهور على وسائل التواصل؟", en: "Is the supplement popular on social media?" },
        { ar: "كم صفحة في الدراسة؟", en: "How many pages is the study?" },
      ],
      a: 0,
      why: { ar: "مع 12 شخصًا تظهر النتائج المتطرفة بالصدفة كثيرًا، وبلا مجموعة مقارنة لا نعرف ماذا كان سيحدث دون المكمّل.", en: "With 12 people, extreme results often appear by chance, and without a comparison group we can't know what would have happened anyway." },
      link: "traps.html#small",
    },
    {
      q: { ar: "أعطاك مساعد ذكي إحصائية ومعها اسم دراسة ورابط. ماذا تفعل؟", en: "An AI chatbot gives you a statistic with a named study and a link. What should you do?" },
      opts: [
        { ar: "أثق بها، فالرابط دليل كافٍ", en: "Trust it: the link is proof enough" },
        { ar: "أفتح الرابط وأتأكد أنه موجود ويقول الشيء نفسه", en: "Open the link and check it exists and says the same thing" },
        { ar: "أسأله «هل أنت متأكد؟» ثم أثق به", en: "Ask \"Are you sure?\" and then trust it" },
        { ar: "أشاركها مع الرابط ليتحقق غيري", en: "Share it with the link so others can check" },
      ],
      a: 1,
      why: { ar: "قد يختلق الذكاء الاصطناعي دراسات وروابط تبدو حقيقية. المصدر الأصلي، لا ملخص المساعد، له الكلمة الأخيرة.", en: "AI can invent studies and links that look real. The original source, not the assistant's summary of it, gets the last word." },
      link: "ai.html#hallucination",
    },
    {
      q: { ar: "أي سؤال أفضل لتطلب من الذكاء الاصطناعي فحص ادعاء؟", en: "Which prompt is best for asking AI to check a claim?" },
      opts: [
        { ar: "«أليس صحيحًا أن…؟»", en: "\"Isn't it true that…?\"" },
        { ar: "«أكّد لي هذه الإحصائية.»", en: "\"Confirm this statistic for me.\"" },
        { ar: "«ماذا أحتاج أن أعرف لأحكم على هذا الادعاء؟ لا تخبرني بعد إن كان صحيحًا.»", en: "\"What would I need to know to judge this claim? Don't tell me yet whether it's true.\"" },
        { ar: "«اكتب منشورًا يدعم هذا الادعاء.»", en: "\"Write a post supporting this claim.\"" },
      ],
      a: 2,
      why: { ar: "الصياغة المحايدة تتجنّب أن يجاملك المساعد، وتجعله يفكك الادعاء بدل أن يردّده.", en: "Neutral wording avoids an assistant that simply agrees with you, and makes it take the claim apart instead of repeating it." },
      link: "ai.html#builder",
    },
    {
      q: { ar: "شرائح فطيرة مكتوب عليها 45% و40% و35%. ما الخطأ؟", en: "A pie chart's slices are labelled 45%, 40% and 35%. What's wrong?" },
      opts: [
        { ar: "الألوان متقاربة", en: "The colours are too similar" },
        { ar: "مجموعها 120%، فلا يمكن أن تكون أجزاء كلٍّ واحد", en: "They add up to 120%, so they can't be parts of one whole" },
        { ar: "يجب أن تكون ثلاثية الأبعاد", en: "It should be 3D" },
        { ar: "لا خطأ", en: "Nothing is wrong" },
      ],
      a: 1,
      why: { ar: "الفطيرة تعرض أجزاء كلٍّ واحد، فمجموعها 100% دائمًا. على الأرجح سُمح باختيار أكثر من إجابة، فالأعمدة أنسب.", en: "A pie shows parts of one whole, so it always adds up to 100%. People could probably pick more than one answer, so bars would fit better." },
      link: "cases.html#case-pie193",
    },
    {
      q: { ar: "رسم لسهم يعرض آخر 3 أشهر فقط وهبوطًا بنسبة 15%. ما السؤال الأهم؟", en: "A share-price chart shows only the last 3 months and a 15% fall. What's the key question?" },
      opts: [
        { ar: "ماذا تُظهر فترة زمنية أطول؟", en: "What does a longer time range show?" },
        { ar: "ما لون الخط؟", en: "What colour is the line?" },
        { ar: "هل العنوان بخط عريض؟", en: "Is the headline in bold?" },
        { ar: "كم عدد نقاط البيانات بالضبط؟", en: "Exactly how many data points are there?" },
      ],
      a: 0,
      why: { ar: "اختيار البداية والنهاية قد يصنع أي قصة. قد يكون الهبوط جزءًا صغيرًا من صعود طويل.", en: "Choosing the start and end dates can tell any story. The fall may be a small part of a long rise." },
      link: "charts.html#cherry",
    },
  ];

  const RANKS = [
    { min: 1, ar: "سيد العدسة", en: "Master of the lens", icon: "trophy" },
    { min: 0.75, ar: "محقّق بيانات", en: "Data detective", icon: "lens" },
    { min: 0.45, ar: "عين ثاقبة", en: "Sharp eye", icon: "eye" },
    { min: 0, ar: "مبتدئ فضولي", en: "Curious rookie", icon: "sparkle" },
  ];

  /* =======================================================================
     State & shared bits
     ======================================================================= */
  const best = Object.assign({ chart: null, quiz: null }, DL.store.get("best", {}) || {});
  let mode = "chart";
  const views = { chart: $("#gameChart"), quiz: $("#gameQuiz"), results: $("#results") };

  function renderBest() {
    $$("[data-best]").forEach((el) => {
      const k = el.dataset.best;
      const total = k === "chart" ? ROUNDS.length : QUESTIONS.length;
      el.hidden = best[k] === null || best[k] === undefined;
      el.innerHTML = DL.icon("trophy") + t("أفضل نتيجة: ", "Best: ") + best[k] + "/" + total;
    });
  }

  function show(view) {
    Object.keys(views).forEach((k) => (views[k].hidden = k !== view));
  }

  function setMode(m) {
    mode = m;
    $$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === m ? "true" : "false"));
    if (m === "chart") {
      if (chart.done) chart.reset();
      show("chart");
      chart.render();
    } else {
      if (quiz.done) quiz.reset();
      show("quiz");
      quiz.render();
    }
  }

  let lastResult = null;
  const missLabel = (kind, m) =>
    kind === "chart"
      ? t(m.spec.title) + " · " + (m.honest ? t("كان صادقًا", "was honest") : t(m.trickName))
      : t(m.q).slice(0, 80) + (t(m.q).length > 80 ? "…" : "");

  function finish(kind, score, total, missedItems) {
    if (best[kind] === null || best[kind] === undefined || score > best[kind]) best[kind] = score;
    DL.store.set("best", best);
    DL.progress.mark("quiz", "done");
    renderBest();
    lastResult = [kind, score, total, missedItems];
    renderResult(kind, score, total, missedItems, true);
  }

  function renderResult(kind, score, total, missedItems, fresh) {
    const missed = missedItems.map((m) => ({ label: missLabel(kind, m), link: m.link }));
    const pct = score / total;
    const rank = RANKS.find((r) => pct >= r.min);
    const res = views.results;
    res.innerHTML =
      '<div class="result">' +
      '<p class="eyebrow" style="justify-content:center;margin:0">' + (kind === "chart" ? t("صادق أم مضلِّل؟", "Honest or misleading?") : t("اختبار الفخاخ", "The trap quiz")) + "</p>" +
      '<div class="result__score">' + score + '<span class="txt-muted" style="font-size:.45em">/' + total + "</span></div>" +
      '<span class="result__rank">' + DL.icon(rank.icon) + DL.escape(t(rank)) + "</span>" +
      "<p>" +
      (pct === 1
        ? t("علامة كاملة! لن تخدعك الأرقام بسهولة.", "A perfect score! Numbers won't fool you easily.")
        : missed.length
        ? t("راجع ما فاتك أدناه، ثم حاول مجددًا.", "Review what you missed below, then try again.")
        : "") +
      "</p>" +
      (missed.length
        ? '<ul class="result__list">' +
          missed.map((m) => "<li><span>" + DL.icon("x", "txt-trick") + " " + DL.escape(m.label) + '</span><a class="txt-lens" style="font-weight:600" href="' + m.link + '">' + t("راجع الدرس ←", "Review the lesson →") + "</a></li>").join("") +
          "</ul>"
        : "") +
      '<div class="result__actions">' +
      '<button class="btn btn--primary" type="button" id="rAgain">' + DL.icon("restart") + t("العب مجددًا", "Play again") + "</button>" +
      '<button class="btn btn--ghost" type="button" id="rOther">' + DL.icon(kind === "chart" ? "list" : "bars") + (kind === "chart" ? t("جرّب اختبار الفخاخ", "Try the trap quiz") : t("جرّب تحدي الرسوم", "Try the chart challenge")) + "</button>" +
      '<button class="btn btn--soft" type="button" id="rCopy">' + DL.icon("copy") + t("انسخ نتيجتك", "Copy your result") + "</button>" +
      "</div></div>";
    show("results");
    if (fresh && pct >= 0.75) DL.confetti();
    $("#rAgain").addEventListener("click", () => {
      (kind === "chart" ? chart : quiz).reset();
      setMode(kind);
    });
    $("#rOther").addEventListener("click", () => setMode(kind === "chart" ? "quiz" : "chart"));
    $("#rCopy").addEventListener("click", () => {
      const url = new URL("quiz.html", location.href).href;
      const text = t(
        "حصلت على " + score + "/" + total + " في تحدي «" + (kind === "chart" ? "هل هذا الرسم صادق؟" : "اختبار الفخاخ") + "» على منصة عدسة البيانات. هل تتفوّق عليّ؟ " + url,
        "I scored " + score + "/" + total + " on DataLens' \"" + (kind === "chart" ? "Is this chart honest?" : "trap quiz") + "\" challenge. Can you beat me? " + url
      );
      DL.copy(text).then((ok) => DL.toast(ok ? t("نُسخت النتيجة.", "Result copied.") : t("تعذّر النسخ.", "Couldn't copy."), ok ? "check" : "alert"));
    });
    if (fresh) views.results.scrollIntoView({ behavior: DL.reduced() ? "auto" : "smooth", block: "start" });
  }

  /* =======================================================================
     Chart challenge
     ======================================================================= */
  const chart = {
    order: [],
    i: 0,
    score: 0,
    streak: 0,
    answered: null,
    missed: [],
    done: false,
    reset() {
      this.order = DL.shuffle(ROUNDS.map((_, k) => k));
      this.i = 0;
      this.score = 0;
      this.streak = 0;
      this.answered = null;
      this.missed = [];
      this.done = false;
    },
    round() {
      return ROUNDS[this.order[this.i]];
    },
    render() {
      const r = this.round();
      $("#cRound").textContent = t("الرسم ", "Chart ") + (this.i + 1) + t(" من ", " of ") + ROUNDS.length;
      $("#cScore").textContent = this.score;
      $("#cStreak").textContent = this.streak;
      $("#cStreakPill").classList.toggle("is-hot", this.streak >= 3);
      const bar = $("#cBar");
      bar.setAttribute("aria-valuenow", this.i + (this.answered ? 1 : 0));
      bar.querySelector("span").style.setProperty("--w", ((this.i + (this.answered ? 1 : 0)) / ROUNDS.length) * 100 + "%");
      $("#cCtx").innerHTML = DL.icon("info") + " " + DL.escape(t(r.ctx));
      const svg = C.render($("#cStage"), Object.assign({ w: 600, h: 370 }, r.spec));
      const stampH = $("#cStampH");
      const stampM = $("#cStampM");
      stampH.style.setProperty("--o", 0);
      stampM.style.setProperty("--o", 0);
      $("#cCard").classList.toggle("is-answered", !!this.answered);
      $("#cMis").disabled = !!this.answered;
      $("#cHon").disabled = !!this.answered;
      const box = $("#cReveal");
      if (!this.answered) {
        box.innerHTML = "";
        return;
      }
      (r.honest ? stampH : stampM).style.setProperty("--o", 1);
      if (!r.honest) C.annotate(svg, r.region, t(r.note), r.noteOpts);
      const right = this.answered === (r.honest ? "honest" : "misleading");
      const last = this.i === ROUNDS.length - 1;
      box.innerHTML =
        '<div class="reveal-box ' + (right ? "is-right" : "is-wrong") + '">' +
        '<div class="reveal-box__head"><h3>' + DL.icon(right ? "check" : "x") + (right ? t("صحيح!", "Correct!") : t("ليس تمامًا", "Not quite")) + "</h3>" +
        '<span class="badge ' + (r.honest ? "badge--truth" : "badge--trick") + '">' + (r.honest ? t("رسم صادق", "Honest chart") : DL.escape(t(r.trickName))) + "</span></div>" +
        "<p>" + DL.escape(t(r.explain)) + "</p>" +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;justify-content:space-between;align-items:center">' +
        '<a class="txt-lens" style="font-weight:600" href="' + r.link + '">' + t("تعلّم المزيد ←", "Learn more →") + "</a>" +
        '<button class="btn btn--primary btn--sm" type="button" id="cNext">' + (last ? DL.icon("trophy") + t("اعرض النتيجة", "See your result") : t("الرسم التالي", "Next chart") + DL.icon("arrow", "ic-arrow")) + "</button>" +
        "</div></div>";
      $("#cNext").addEventListener("click", () => this.next());
    },
    answer(choice, fly) {
      if (this.answered || this.done) return;
      const r = this.round();
      const right = choice === (r.honest ? "honest" : "misleading");
      this.answered = choice;
      if (right) {
        this.score++;
        this.streak++;
      } else {
        this.streak = 0;
        this.missed.push(r);
      }
      const card = $("#cCard");
      const after = () => {
        this.render();
        const nxt = $("#cNext");
        if (nxt) nxt.focus({ preventScroll: true });
      };
      if (fly && !DL.reduced()) {
        card.style.transform = "translateX(" + (fly > 0 ? 130 : -130) + "%) rotate(" + (fly > 0 ? 18 : -18) + "deg)";
        card.style.opacity = "0";
        setTimeout(() => {
          card.style.transition = "none";
          card.style.transform = "";
          card.style.opacity = "";
          void card.offsetWidth;
          card.style.transition = "";
          if (card.animate) card.animate([{ transform: "scale(.94)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "ease-out" });
          after();
        }, 300);
      } else {
        after();
      }
    },
    next() {
      if (this.i < ROUNDS.length - 1) {
        this.i++;
        this.answered = null;
        this.render();
        const card = $("#cCard");
        if (card.animate && !DL.reduced()) card.animate([{ transform: "translateY(16px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
        card.focus({ preventScroll: true });
      } else {
        this.done = true;
        finish("chart", this.score, ROUNDS.length, this.missed);
      }
    },
  };

  function initSwipe() {
    const card = $("#cCard");
    const stampH = $("#cStampH");
    const stampM = $("#cStampM");
    let drag = null;
    const THRESH = 110;
    card.addEventListener("pointerdown", (e) => {
      if (chart.answered || e.button !== 0 || e.target.closest("a,button")) return;
      drag = { x: e.clientX, y: e.clientY, dx: 0, active: false, id: e.pointerId };
    });
    card.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          drag = null;
          return;
        }
        drag.active = true;
        card.setPointerCapture(drag.id);
        card.classList.add("is-dragging");
      }
      drag.dx = dx;
      card.style.transform = "translateX(" + dx + "px) rotate(" + dx / 24 + "deg)";
      stampH.style.setProperty("--o", DL.clamp(dx / THRESH, 0, 1));
      stampM.style.setProperty("--o", DL.clamp(-dx / THRESH, 0, 1));
    });
    const end = () => {
      if (!drag) return;
      const { dx, active } = drag;
      drag = null;
      if (!active) return;
      card.classList.remove("is-dragging");
      if (dx > THRESH) chart.answer("honest", 1);
      else if (dx < -THRESH) chart.answer("misleading", -1);
      else {
        card.style.transform = "";
        stampH.style.setProperty("--o", 0);
        stampM.style.setProperty("--o", 0);
      }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);

    $("#cMis").addEventListener("click", () => chart.answer("misleading", -1));
    $("#cHon").addEventListener("click", () => chart.answer("honest", 1));
    document.addEventListener("keydown", (e) => {
      if (mode !== "chart" || views.chart.hidden || chart.answered) return;
      if (e.target.closest && e.target.closest("input,textarea,select")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        chart.answer("misleading", -1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        chart.answer("honest", 1);
      }
    });
  }

  /* =======================================================================
     Trap quiz
     ======================================================================= */
  const quiz = {
    i: 0,
    score: 0,
    picked: null,
    order: [],
    missed: [],
    done: false,
    reset() {
      this.i = 0;
      this.score = 0;
      this.picked = null;
      this.missed = [];
      this.done = false;
      this.order = QUESTIONS.map((q) => DL.shuffle(q.opts.map((_, k) => k)));
    },
    render() {
      const q = QUESTIONS[this.i];
      const order = this.order[this.i];
      $("#qRound").textContent = t("السؤال ", "Question ") + (this.i + 1) + t(" من ", " of ") + QUESTIONS.length;
      $("#qScore").textContent = this.score;
      const done = this.i + (this.picked !== null ? 1 : 0);
      $("#qBar").setAttribute("aria-valuenow", done);
      $("#qBar span").style.setProperty("--w", (done / QUESTIONS.length) * 100 + "%");
      const letters = DL.lang() === "ar" ? ["أ", "ب", "ج", "د"] : ["A", "B", "C", "D"];
      let html = '<div class="mcq"><p class="mcq__q">' + DL.escape(t(q.q)) + '</p><div class="mcq__opts" role="group">';
      order.forEach((k, pos) => {
        let cls = "opt";
        if (this.picked !== null) {
          if (k === q.a) cls += " is-correct";
          else if (k === this.picked) cls += " is-wrong";
        }
        html +=
          '<button class="' + cls + '" type="button" data-k="' + k + '"' + (this.picked !== null ? " disabled" : "") + '><span class="opt__k">' + letters[pos] + "</span><span>" + DL.escape(t(q.opts[k])) + "</span>" +
          DL.icon(k === q.a ? "check" : "x") + "</button>";
      });
      html += "</div>";
      if (this.picked !== null) {
        const right = this.picked === q.a;
        const last = this.i === QUESTIONS.length - 1;
        html +=
          '<div class="explain' + (right ? "" : " explain--trick") + '"><h4>' + DL.icon(right ? "check" : "x") + (right ? t("صحيح!", "Correct!") : t("ليس تمامًا", "Not quite")) + "</h4><p>" + DL.escape(t(q.why)) + "</p></div>" +
          '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center"><a class="txt-lens" style="font-weight:600" href="' + q.link + '">' + t("راجع الدرس ←", "Review the lesson →") + "</a>" +
          '<button class="btn btn--primary btn--sm" type="button" id="qNext">' + (last ? DL.icon("trophy") + t("اعرض النتيجة", "See your result") : t("السؤال التالي", "Next question") + DL.icon("arrow", "ic-arrow")) + "</button></div>";
      } else {
        html += '<p class="lab__note">' + t("اختر إجابة، أو اضغط 1–4 على لوحة المفاتيح.", "Pick an answer, or press 1–4 on your keyboard.") + "</p>";
      }
      html += "</div>";
      $("#qCard").innerHTML = html;
      $$("#qCard .opt").forEach((b) => b.addEventListener("click", () => this.pick(+b.dataset.k)));
      const nxt = $("#qNext");
      if (nxt) nxt.addEventListener("click", () => this.next());
    },
    pick(k) {
      if (this.picked !== null) return;
      const q = QUESTIONS[this.i];
      this.picked = k;
      if (k === q.a) this.score++;
      else this.missed.push(q);
      this.render();
      const nxt = $("#qNext");
      if (nxt) nxt.focus({ preventScroll: true });
    },
    next() {
      if (this.i < QUESTIONS.length - 1) {
        this.i++;
        this.picked = null;
        this.render();
        const first = $("#qCard .opt");
        if (first) first.focus({ preventScroll: true });
      } else {
        this.done = true;
        finish("quiz", this.score, QUESTIONS.length, this.missed);
      }
    },
  };

  document.addEventListener("keydown", (e) => {
    if (mode !== "quiz" || views.quiz.hidden || quiz.picked !== null) return;
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) {
      const btn = $$("#qCard .opt")[n - 1];
      if (btn) btn.click();
    }
  });

  /* =======================================================================
     Boot
     ======================================================================= */
  chart.reset();
  quiz.reset();
  initSwipe();
  $$("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  const share = $("#shareSite");
  if (share)
    share.addEventListener("click", () => {
      const url = new URL("index.html", location.href).href;
      DL.copy(url).then((ok) => DL.toast(ok ? t("نُسخ رابط المنصة.", "Site link copied.") : t("تعذّر النسخ.", "Couldn't copy."), ok ? "link" : "alert"));
    });
  DL.onLang(() => {
    renderBest();
    if (!views.results.hidden) {
      if (lastResult) renderResult(lastResult[0], lastResult[1], lastResult[2], lastResult[3], false);
      return;
    }
    if (mode === "chart") chart.render();
    else quiz.render();
  });
})();
