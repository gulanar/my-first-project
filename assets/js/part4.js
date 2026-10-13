/* DataLens · Part 4: real cases, claim X-ray, share checklist */
(function () {
  "use strict";
  const DL = window.DL;
  const C = DL.chart;
  const { $, $$ } = DL;
  const t = DL.t;

  const VERDICTS = {
    misleading: { ar: "مضلِّل", en: "Misleading" },
    false: { ar: "خاطئ", en: "False" },
    context: { ar: "ينقصه السياق", en: "Missing context" },
    wrong: { ar: "توقّع خاطئ", en: "Wrong call" },
  };
  const STEPS = [
    { id: "claim", ar: "الادعاء", en: "The claim" },
    { id: "flags", ar: "الإشارات الحمراء", en: "Red flags" },
    { id: "evidence", ar: "ما تقوله الأدلة", en: "The evidence" },
    { id: "lesson", ar: "الدرس", en: "The lesson" },
  ];
  const ABC = [
    { ar: "المرشح (أ)", en: "Candidate A" },
    { ar: "المرشح (ب)", en: "Candidate B" },
    { ar: "المرشح (ج)", en: "Candidate C" },
  ];
  const ILLUSTRATIVE = { ar: "إعادة إنشاء توضيحية، ليست الأرقام الأصلية", en: "Illustrative recreation, not the original figures" };
  const YEARS = ["2001", "2003", "2005", "2007", "2009", "2011"];

  const CASES = [
    {
      id: "pie193",
      tags: ["charts"],
      icon: "tv",
      verdict: "misleading",
      src: { ar: "رسم في نشرة أخبار تلفزيونية · 2009", en: "TV news graphic · 2009" },
      headline: { ar: "استطلاع: 70% و63% و60% يدعمون ثلاثة مرشحين", en: "Poll: 70%, 63% and 60% back three candidates" },
      teaser: { ar: "رسم دائري عرضته قناة إخبارية أمريكية عن مرشحين محتملين لانتخابات 2012.", en: "A pie chart a US news channel showed about potential candidates for the 2012 election." },
      claim: {
        ar: "عرضت قناة إخبارية أمريكية عام 2009 رسمًا دائريًا لنتائج استطلاع عن ثلاثة مرشحين محتملين لانتخابات 2012: 70% و63% و60%، وكل نسبة شريحة في فطيرة واحدة.",
        en: "In 2009 a US cable news channel showed a pie chart of a poll about three potential candidates for the 2012 election: 70%, 63% and 60%, each drawn as a slice of one pie.",
      },
      flags: [
        { ar: "مجموع الشرائح 193%، والفطيرة يجب أن يكون مجموعها 100% تمامًا.", en: "The slices add up to 193%; a pie must total exactly 100%." },
        { ar: "سأل الاستطلاع عن كل مرشح على حدة، فاستطاع الشخص الواحد دعم أكثر من مرشح.", en: "The poll asked about each candidate separately, so one person could back several." },
      ],
      evidence: {
        ar: "قد تكون أرقام الاستطلاع نفسها صحيحة؛ الخطأ في نوع الرسم. لأسئلة «هل تدعم…؟» المنفصلة يناسب عمود لكل مرشح، مع التنبيه إلى أن الإجابات متعددة. انتشر الرسم بعدما عرضه موقع FlowingData المتخصص مثالًا صارخًا على الخطأ.",
        en: "The poll numbers themselves may be fine; the chart type is the error. For separate \"would you back…?\" questions, one bar per candidate works, with a note that people could pick several. The graphic spread after the data-visualisation site FlowingData featured it as a glaring example.",
      },
      lesson: { ar: "قبل أن تقرأ الشرائح، اجمعها. إن لم يكن المجموع 100%، فالفطيرة خاطئة.", en: "Before you read the slices, add them up. If they don't make 100%, the pie is wrong." },
      source: { ar: "رسم قناة Fox News، 2009؛ ناقشه موقع FlowingData.", en: "Fox News graphic, 2009; discussed by FlowingData." },
      query: "Fox News pie chart 193% 2009 FlowingData",
      charts: {
        claim: { type: "pie", h: 300, title: { ar: "إعادة إنشاء الرسم", en: "The graphic, recreated" }, sub: { ar: "مجموع الشرائح: 193%", en: "Slices add up to 193%" }, values: [70, 63, 60], pctLabels: ["70%", "63%", "60%"], labels: ABC, legendValues: ["70%", "63%", "60%"] },
        evidence: { type: "bar", h: 300, title: { ar: "الرسم الصادق: عمود لكل مرشح", en: "Honest version: one bar per candidate" }, sub: { ar: "كان يمكن دعم أكثر من مرشح", en: "People could back more than one" }, labels: ABC, values: [70, 63, 60], yMin: 0, yMax: 100, ticks: [0, 25, 50, 75, 100], unit: "%", barRatio: 0.5, grow: true },
      },
    },
    {
      id: "florida",
      tags: ["charts"],
      icon: "news",
      verdict: "misleading",
      src: { ar: "رسم في وكالة أنباء · 2014", en: "News agency graphic · 2014" },
      headline: { ar: "وفيات الأسلحة في فلوريدا بعد قانون «الدفاع عن النفس»", en: "Gun deaths in Florida after \"Stand Your Ground\"" },
      teaser: { ar: "رسم بدا لكثير من القرّاء أنه يُظهر انخفاض الوفيات بعد القانون.", en: "A chart many readers took to show deaths falling after the law." },
      claim: {
        ar: "نشرت وكالة رويترز عام 2014 رسمًا لعدد جرائم القتل بالأسلحة النارية في ولاية فلوريدا الأمريكية، مع إشارة إلى عام 2005 حين صدر قانون «الدفاع عن النفس». بدا الخط وكأنه ينخفض بعد القانون.",
        en: "In 2014 Reuters published a chart of firearm murders in the US state of Florida, marking 2005, when the \"Stand Your Ground\" law was passed. The line seemed to fall after the law.",
      },
      flags: [
        { ar: "المحور الرأسي مقلوب: الصفر في الأعلى والأرقام الكبيرة في الأسفل.", en: "The vertical axis is upside down: zero at the top, bigger numbers lower down." },
        { ar: "المساحة المعبّأة من الأعلى تجعل الارتفاع يبدو انخفاضًا.", en: "The area filled from the top makes a rise look like a fall." },
        { ar: "نعتاد أن «الأعلى يعني أكثر»، فنقرأ الاتجاه معكوسًا.", en: "We expect \"higher means more\", so we read the trend backwards." },
      ],
      evidence: {
        ar: "بعد 2005 ارتفع عدد جرائم القتل بالأسلحة النارية في فلوريدا ولم ينخفض. قالت المصمّمة إن الأسلوب المقلوب كان اختيارًا بصريًا مقصودًا، لكن كثيرًا من القرّاء قرأوه بالطريقة المعتادة. الرسمان هنا إعادة إنشاء توضيحية، لا الأرقام الأصلية.",
        en: "After 2005 the number of firearm murders in Florida rose; it did not fall. The designer said the upside-down style was a deliberate visual choice, but many readers read it the usual way. The charts here are illustrative recreations, not the original figures.",
      },
      lesson: { ar: "قبل قراءة أي اتجاه، تحقّق من الاتجاه الذي تكبر فيه أرقام المحور.", en: "Before reading any trend, check which way the axis numbers grow." },
      source: { ar: "رسم وكالة رويترز، 2014؛ تناوله كثير من المتخصصين في التصوير البياني.", en: "Reuters graphic, 2014; widely discussed by data-visualisation writers." },
      query: "Reuters Florida gun deaths chart inverted axis 2014",
      charts: {
        claim: { type: "line", h: 300, title: { ar: "الأسلوب الأصلي: محور مقلوب", en: "The original style: inverted axis" }, sub: ILLUSTRATIVE, labels: YEARS, values: [500, 480, 520, 760, 700, 720], yMin: 0, yMax: 1000, ticks: [0, 250, 500, 750, 1000], invert: true, area: true, areaCls: "ch-area--trick", lineCls: "ch-line--trick" },
        evidence: { type: "line", h: 300, title: { ar: "المحور المعتاد: الارتفاع واضح", en: "The usual axis: the rise is clear" }, sub: ILLUSTRATIVE, labels: YEARS, values: [500, 480, 520, 760, 700, 720], yMin: 0, yMax: 1000, ticks: [0, 250, 500, 750, 1000], area: true, draw: true },
      },
    },
    {
      id: "colgate",
      tags: ["sampling"],
      icon: "megaphone",
      verdict: "misleading",
      src: { ar: "إعلان ملصقات في بريطانيا · 2007", en: "UK poster advert · 2007" },
      headline: { ar: "«أكثر من 80% من أطباء الأسنان يوصون بـColgate»", en: "\"More than 80% of dentists recommend Colgate\"" },
      teaser: { ar: "ادعاء إعلاني قضت هيئة الإعلانات البريطانية بأنه مضلِّل.", en: "An advertising claim the UK advertising watchdog ruled misleading." },
      claim: {
        ar: "زعم إعلان في بريطانيا أن أكثر من 80% من أطباء الأسنان يوصون بمعجون Colgate، فبدا كأن 8 من كل 10 أطباء يفضّلونه على غيره.",
        en: "A UK poster claimed that more than 80% of dentists recommend Colgate, which read as if 8 in 10 dentists prefer it over other brands.",
      },
      flags: [
        { ar: "سمح الاستطلاع للأطباء بذكر أكثر من علامة تجارية.", en: "The survey let dentists name more than one brand." },
        { ar: "علامة منافسة نالت نسبة توصية قريبة جدًا.", en: "A competitor's brand was recommended almost as often." },
        { ar: "«يوصون به» ضمن عدة خيارات ليست «يفضّلونه على غيره».", en: "\"Recommend it\" among several options is not \"prefer it over the rest\"." },
      ],
      evidence: {
        ar: "عام 2007 قضت هيئة معايير الإعلان البريطانية (ASA) بأن الادعاء مضلِّل: سيفهم القرّاء أن 80% من أطباء الأسنان يوصون بـColgate دون غيره، بينما سمح الاستطلاع بذكر عدة علامات.",
        en: "In 2007 the UK Advertising Standards Authority (ASA) ruled the claim misleading: readers would understand that 80% of dentists recommend Colgate over other brands, while the survey allowed several brands to be named.",
      },
      lesson: { ar: "اسأل: من بين أي خيارات؟ وهل كان يمكن اختيار أكثر من إجابة؟", en: "Ask: out of which options, and could people pick more than one?" },
      source: { ar: "حكم هيئة معايير الإعلان البريطانية (ASA)، 2007؛ نقلته BBC News.", en: "UK Advertising Standards Authority ruling, 2007; reported by BBC News." },
      query: "ASA Colgate 80% dentists recommend ruling 2007",
    },
    {
      id: "chocolate",
      tags: ["small"],
      icon: "flask",
      verdict: "false",
      src: { ar: "عناوين صحف في عدة دول · 2015", en: "Newspaper headlines in several countries · 2015" },
      headline: { ar: "«الشوكولاتة تساعدك على إنقاص الوزن أسرع»", en: "\"Chocolate helps you lose weight faster\"" },
      teaser: { ar: "دراسة حقيقية صُمّمت عمدًا لتنتج نتيجة زائفة، ثم انتشرت.", en: "A real study designed on purpose to produce a false result. Then it went viral." },
      claim: {
        ar: "نشرت صحف ومواقع في عدة دول أن تناول الشوكولاتة الداكنة مع حمية منخفضة الكربوهيدرات يسرّع خسارة الوزن، استنادًا إلى تجربة سريرية أُجريت في ألمانيا.",
        en: "Newspapers and websites in several countries reported that eating dark chocolate on a low-carb diet speeds up weight loss, citing a clinical trial in Germany.",
      },
      flags: [
        { ar: "عدد المشاركين صغير جدًا: نحو 15 شخصًا.", en: "A tiny trial: about 15 participants." },
        { ar: "قيس 18 أمرًا مختلفًا (الوزن والكوليسترول والنوم وغيرها)، فمن المرجّح أن «ينجح» أحدها بالصدفة.", en: "18 different things were measured (weight, cholesterol, sleep and more), so one was likely to \"work\" by chance." },
        { ar: "نُشرت في مجلة لم تراجعها مراجعة جادة، ولم يتحقق الصحفيون من التفاصيل.", en: "It appeared in a journal with little real review, and reporters didn't check the details." },
      ],
      evidence: {
        ar: "كانت خدعة مقصودة: أجراها الصحفي العلمي جون بوهانون مع فريق تلفزيوني ألماني ليُظهر كيف ينتشر العلم الرديء، ثم كشفها بنفسه. مع 18 قياسًا، يقارب احتمال ظهور نتيجة «مهمة» واحدة على الأقل بالصدفة 60%.",
        en: "It was a deliberate hoax: science journalist John Bohannon ran it with a German TV crew to show how bad science spreads, then revealed it himself. With 18 measurements, the chance of at least one \"significant\" result by luck alone is about 60%.",
      },
      lesson: { ar: "اسأل دائمًا: كم شخصًا شارك؟ وكم شيئًا قيس؟ العيّنة الصغيرة مع القياسات الكثيرة وصفة لاكتشافات زائفة.", en: "Always ask how many people took part and how many things were measured. A small sample plus many measurements is a recipe for false discoveries." },
      source: { ar: "جون بوهانون، «خدعتُ الملايين ليظنوا أن الشوكولاتة تساعد على إنقاص الوزن»، 2015.", en: "John Bohannon, \"I Fooled Millions Into Thinking Chocolate Helps Weight Loss\", 2015." },
      query: "John Bohannon chocolate weight loss hoax 2015",
      charts: {
        evidence: {
          type: "hbar",
          h: 240,
          left: 110,
          title: { ar: "فرصة نتيجة «مهمة» واحدة على الأقل بالصدفة", en: "Chance of at least one fluke \"finding\"" },
          sub: { ar: "إن كان لكل قياس احتمال 5% لإنذار كاذب", en: "If each test has a 5% false-alarm rate" },
          labels: [
            { ar: "قياس واحد", en: "1 test" },
            { ar: "5 قياسات", en: "5 tests" },
            { ar: "18 قياسًا", en: "18 tests" },
          ],
          values: [5, 22.6, 60.3],
          xMax: 75,
          unit: "%",
          digits: 0,
          barCls: ["ch-bar--4", "ch-bar--3", "ch-bar--trick"],
        },
      },
    },
    {
      id: "bacon",
      tags: ["risk"],
      icon: "pulse",
      verdict: "context",
      src: { ar: "عناوين إعلامية بعد تقرير لمنظمة الصحة العالمية · 2015", en: "Media headlines after a WHO report · 2015" },
      headline: { ar: "«اللحوم المصنّعة ترفع خطر السرطان 18%… مثل التبغ!»", en: "\"Processed meat raises cancer risk by 18%, just like tobacco!\"" },
      teaser: { ar: "رقم حقيقي ضاع معناه في العناوين.", en: "A real number whose meaning got lost in the headlines." },
      claim: {
        ar: "عام 2015 صنّفت الوكالة الدولية لأبحاث السرطان، التابعة لمنظمة الصحة العالمية، اللحوم المصنّعة ضمن «المجموعة 1» المسرطنة، وذكرت أن كل 50 غرامًا تؤكل يوميًا ترفع خطر سرطان القولون والمستقيم بنحو 18%. قارنت عناوين كثيرة ذلك بالتدخين.",
        en: "In 2015 the World Health Organization's cancer agency (IARC) classified processed meat as a \"Group 1\" carcinogen and said each 50 g eaten daily raises the risk of bowel cancer by about 18%. Many headlines compared it with smoking.",
      },
      flags: [
        { ar: "18% زيادة نسبية، لا مطلقة.", en: "18% is a relative increase, not an absolute one." },
        { ar: "«المجموعة 1» تصف قوة الدليل على أن الشيء يسبّب السرطان، لا حجم الخطر.", en: "\"Group 1\" describes how strong the evidence is that something causes cancer, not how big the risk is." },
        { ar: "وجوده في مجموعة التبغ نفسها لا يعني أنه بخطورة التبغ.", en: "Sharing a group with tobacco doesn't make it as dangerous as tobacco." },
      ],
      evidence: {
        ar: "إن كان نحو 6 من كل 100 شخص سيُصابون بسرطان الأمعاء على أي حال، فزيادة 18% ترفع ذلك إلى نحو 7 من كل 100. الخطر حقيقي ويستحق المعرفة، لكنه أصغر بكثير من خطر سرطان الرئة لدى المدخنين. ترجمت منظمة أبحاث السرطان البريطانية الأرقام بطريقة مشابهة.",
        en: "If about 6 in 100 people would get bowel cancer anyway, an 18% increase brings that to about 7 in 100. The risk is real and worth knowing, but far smaller than the lung-cancer risk for smokers. Cancer Research UK translated the numbers in a similar way.",
      },
      lesson: { ar: "ترجم النسب إلى «كذا من كل 100 شخص»، وافهم ماذا يقيس التصنيف فعلًا.", en: "Translate percentages into \"X out of 100 people\", and check what a classification actually measures." },
      source: { ar: "الوكالة الدولية لأبحاث السرطان (IARC)، أكتوبر 2015؛ شروح منظمة أبحاث السرطان البريطانية.", en: "International Agency for Research on Cancer (IARC), October 2015; explainers by Cancer Research UK." },
      query: "IARC processed meat 18% bowel cancer Cancer Research UK absolute risk",
      people: { base: 6, extra: 1 },
    },
    {
      id: "nobel",
      tags: ["causation"],
      icon: "trophy",
      verdict: "misleading",
      src: { ar: "ملاحظة في مجلة طبية · 2012", en: "Medical journal note · 2012" },
      headline: { ar: "«الدول التي تأكل شوكولاتة أكثر تفوز بجوائز نوبل أكثر»", en: "\"Countries that eat more chocolate win more Nobel Prizes\"" },
      teaser: { ar: "ارتباط قوي جدًا بين 23 دولة، وعناوين عن «شوكولاتة الذكاء».", en: "A very strong correlation across 23 countries, and headlines about \"brain chocolate\"." },
      claim: {
        ar: "نشر طبيب القلب فرانز ميسرلي عام 2012 في مجلة نيو إنجلاند الطبية ملاحظة تُظهر أن الدول الأعلى استهلاكًا للشوكولاتة للفرد لديها فائزون أكثر بجائزة نوبل لكل عشرة ملايين نسمة. تناقلت وسائل الإعلام أن الشوكولاتة قد تجعلك أذكى.",
        en: "In 2012 cardiologist Franz Messerli published a note in the New England Journal of Medicine showing that countries eating more chocolate per person had more Nobel laureates per 10 million people. Media reports suggested chocolate might make you smarter.",
      },
      flags: [
        { ar: "البيانات على مستوى الدول لا الأفراد: لا نعرف إن كان الفائزون أنفسهم يأكلون الشوكولاتة.", en: "Country-level data, not individuals: we don't know whether the laureates themselves ate chocolate." },
        { ar: "عامل خفي واضح: الدول الأغنى تأكل شوكولاتة أكثر وتنفق أكثر على التعليم والبحث.", en: "An obvious hidden factor: richer countries eat more chocolate and spend more on education and research." },
        { ar: "23 دولة فقط.", en: "Only 23 countries." },
      ],
      evidence: {
        ar: "كان الارتباط قويًا فعلًا (r ≈ 0.79)، وكتب ميسرلي ملاحظته بنبرة فيها دعابة. لكن الارتباط بين الدول لا يقول شيئًا عن الأفراد، والثروة قد تفسّر الأمرين معًا. لم تُظهر أي تجربة أن الشوكولاتة تصنع فائزين بنوبل.",
        en: "The correlation really was strong (r ≈ 0.79), and Messerli wrote his note with a light touch. But a correlation between countries says nothing about individuals, and wealth could explain both. No experiment has shown that chocolate makes Nobel laureates.",
      },
      lesson: { ar: "الارتباط القوي ليس دليلًا على السببية. ابحث عن العامل الثالث، وانتبه للفرق بين الدول والأفراد.", en: "A strong correlation is not proof of cause. Look for the third factor, and mind the gap between countries and individuals." },
      source: { ar: "F. H. Messerli، «استهلاك الشوكولاتة والوظائف الإدراكية والفائزون بنوبل»، New England Journal of Medicine، 2012.", en: "F. H. Messerli, \"Chocolate Consumption, Cognitive Function, and Nobel Laureates\", New England Journal of Medicine, 2012." },
      query: "Messerli chocolate consumption Nobel laureates NEJM 2012",
    },
    {
      id: "digest",
      tags: ["sampling"],
      icon: "users",
      verdict: "wrong",
      src: { ar: "استطلاع مجلة أمريكية · 1936", en: "US magazine poll · 1936" },
      headline: { ar: "«لاندون سيهزم روزفلت»: استطلاع شمل 2.4 مليون شخص", en: "\"Landon will beat Roosevelt\": a poll of 2.4 million people" },
      teaser: { ar: "أكبر استطلاع في عصره، وأحد أشهر الأخطاء في تاريخ الاستطلاعات.", en: "The biggest poll of its time, and one of the most famous misses in polling history." },
      claim: {
        ar: "أرسلت مجلة «ذا ليتراري دايجست» نحو 10 ملايين استمارة قبل انتخابات الرئاسة الأمريكية عام 1936، وعاد منها نحو 2.4 مليون. توقعت المجلة فوز ألف لاندون على الرئيس فرانكلين روزفلت بنحو 57% من الأصوات.",
        en: "Before the 1936 US presidential election, The Literary Digest mailed about 10 million ballots and got about 2.4 million back. It predicted Alf Landon would beat President Franklin Roosevelt with about 57% of the vote.",
      },
      flags: [
        { ar: "جاءت العناوين من أدلة الهاتف وسجلات السيارات وقوائم المشتركين، وكانت تميل إلى الأثرياء في زمن الكساد الكبير.", en: "Addresses came from phone books, car registrations and subscriber lists, which leaned towards wealthier people during the Great Depression." },
        { ar: "ردّ نحو ربع من تلقّوا الاستمارة فقط، ومن ردّوا اختلفوا عمّن لم يردّوا.", en: "Only about a quarter of recipients replied, and those who replied differed from those who didn't." },
        { ar: "الحجم الضخم أعطى ثقة زائفة.", en: "The huge size gave false confidence." },
      ],
      evidence: {
        ar: "فاز روزفلت باكتساح: نحو 61% من الأصوات و46 ولاية من 48. أما جورج غالوب فتوقّع فوز روزفلت باستخدام عيّنة أصغر بكثير لكنها أكثر تمثيلًا للناخبين.",
        en: "Roosevelt won in a landslide: about 61% of the vote and 46 of 48 states. George Gallup, using a far smaller but more representative sample, predicted Roosevelt's win.",
      },
      lesson: { ar: "العيّنة الضخمة المتحيّزة تخسر أمام عيّنة صغيرة ممثّلة. الحجم لا يعالج التحيّز.", en: "A huge biased sample loses to a small representative one. Size doesn't cure bias." },
      source: { ar: "نتائج الانتخابات الرئاسية الأمريكية 1936؛ تاريخ استطلاع The Literary Digest.", en: "1936 US presidential election results; history of The Literary Digest poll." },
      query: "Literary Digest 1936 poll Landon Roosevelt sampling bias",
      charts: {
        evidence: {
          type: "grouped",
          h: 300,
          title: { ar: "التوقّع مقابل النتيجة", en: "Forecast vs result" },
          sub: { ar: "نسبة الأصوات الشعبية (مقرّبة)", en: "Share of the popular vote (rounded)" },
          groups: [
            { ar: "توقّع المجلة", en: "Digest forecast" },
            { ar: "النتيجة الفعلية", en: "Actual result" },
          ],
          series: [
            { label: { ar: "روزفلت", en: "Roosevelt" }, values: [43, 61], cls: "" },
            { label: { ar: "لاندون", en: "Landon" }, values: [57, 37], cls: "ch-bar--3" },
          ],
          yMax: 80,
          ticks: [0, 20, 40, 60, 80],
          unit: "%",
          grow: true,
        },
      },
    },
    {
      id: "dropouts",
      tags: ["sampling", "causation"],
      icon: "cap",
      verdict: "misleading",
      src: { ar: "منشورات متداولة على وسائل التواصل", en: "Widely shared social media posts" },
      headline: { ar: "«تركوا الجامعة وصاروا مليارديرات، فلماذا تدرس؟»", en: "\"They dropped out and became billionaires. Why study?\"" },
      teaser: { ar: "قائمة بأسماء مؤسسين مشهورين تركوا الجامعة.", en: "A list of famous founders who left university." },
      claim: {
        ar: "تنتشر منشورات تعدّد مؤسسي شركات تقنية مشهورة تركوا الجامعة، وتستنتج أن الشهادة الجامعية لا تهم، أو حتى تعيق النجاح.",
        en: "Posts list famous tech founders who left university and conclude that a degree doesn't matter, or even holds you back.",
      },
      flags: [
        { ar: "تحيّز النجاة: نسمع عن القلّة الناجحة فقط، لا عن الملايين ممن تركوا الدراسة ولم يصبحوا أثرياء.", en: "Survivorship bias: we only hear about the few who succeeded, not the millions of dropouts who didn't get rich." },
        { ar: "عيّنة صغيرة مختارة بعناية لتدعم الاستنتاج.", en: "A tiny sample, hand-picked to fit the conclusion." },
        { ar: "بعضهم ترك جامعات نخبوية بعد أن دخلها، وهذه ليست الحالة المعتادة.", en: "Several left elite universities they had already got into, which is not the typical case." },
      ],
      evidence: {
        ar: "في كثير من الدول تُظهر إحصاءات العمل أن حمَلة الشهادات الجامعية يكسبون في المتوسط أكثر ويواجهون بطالة أقل. القصص الاستثنائية حقيقية، لكنها لا تصف ما يحدث عادةً.",
        en: "In many countries, labour statistics show that people with university degrees earn more on average and face less unemployment. The exceptional stories are real, but they don't describe what usually happens.",
      },
      lesson: { ar: "قبل أن تتعلّم من قصص النجاح، اسأل: أين الذين لم ينجحوا؟", en: "Before you learn from success stories, ask: where are the ones who didn't make it?" },
      source: { ar: "إحصاءات العمل والتعليم الرسمية في دول عديدة، مثل مكتب إحصاءات العمل الأمريكي.", en: "Official labour and education statistics in many countries, such as the US Bureau of Labor Statistics." },
      query: "survivorship bias college dropout billionaires earnings by education",
    },
  ];

  /* ---------------------------------------------------------------------
     Case grid + analysis modal
     --------------------------------------------------------------------- */
  function initCases() {
    const grid = $("#caseGrid");
    if (!grid) return;
    let seen = DL.store.get("casesSeen", []);
    if (!Array.isArray(seen)) seen = [];
    let current = "all";
    const filter = DL.filterChips($("#caseFilters"), () => $$(".case-card", grid), (v) => (current = v));

    function renderGrid() {
      grid.innerHTML = CASES.map((c, i) => {
        const done = seen.includes(c.id);
        return (
          '<article class="case-card" id="case-' + c.id + '" data-tags="' + c.tags.join(" ") + '" style="animation-delay:' + i * 50 + 'ms">' +
          '<div class="case-card__src"><span>' + DL.icon(c.icon) + DL.escape(t(c.src)) + "</span>" +
          (done ? '<span class="badge badge--truth">' + DL.icon("check") + t("حُلّلت", "Analysed") + "</span>" : "") +
          "</div>" +
          '<div class="case-card__head">' + DL.escape(t(c.headline)) + '<span class="stamp">' + DL.escape(t(VERDICTS[c.verdict])) + "</span></div>" +
          "<p>" + DL.escape(t(c.teaser)) + "</p>" +
          '<div class="case-card__foot"><div class="chip-row">' +
          c.tags.map((tg) => '<span class="badge">' + DL.escape(t(TAGS[tg])) + "</span>").join("") +
          '</div><button class="btn btn--sm btn--soft" type="button" data-case="' + i + '">' + DL.icon("lens") + t("حلّل تحت العدسة", "Analyse") + "</button></div>" +
          "</article>"
        );
      }).join("");
      $$("[data-case]", grid).forEach((b) => b.addEventListener("click", () => open(+b.dataset.case)));
      filter.apply(current);
    }

    const TAGS = {
      charts: { ar: "رسوم", en: "Charts" },
      sampling: { ar: "عيّنات", en: "Sampling" },
      causation: { ar: "سببية", en: "Causation" },
      risk: { ar: "مخاطر", en: "Risk" },
      small: { ar: "عيّنة صغيرة", en: "Small sample" },
    };

    // Modal
    const modal = DL.modal($("#caseModal"));
    let idx = 0;
    let step = 0;

    function peopleChart(host, base, extra) {
      const cols = 20;
      const cell = 22;
      const W = cols * cell;
      const H = 5 * cell + 34;
      const svg = C.el("svg", { viewBox: "0 0 " + W + " " + H, cls: "chart", role: "img", "aria-label": t({ ar: "100 شخص: " + base + " مصابون على أي حال وشخص إضافي واحد", en: "100 people: " + base + " affected anyway and one extra" }) });
      for (let i = 0; i < 100; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const fill = i < base ? "var(--c3)" : i < base + extra ? "var(--redpen)" : "var(--line)";
        C.el("circle", { cx: c * cell + cell / 2, cy: r * cell + cell / 2, r: cell / 2 - 3, style: "fill:" + fill }, svg);
      }
      C.el("text", { x: 0, y: H - 8, cls: "t-axis", style: "fill:var(--ink)", text: t({ ar: "من كل 100 شخص: 6 على أي حال (برتقالي) + 1 إضافي (أحمر)", en: "Out of 100 people: 6 anyway (orange) + 1 extra (red)" }) }, svg);
      host.appendChild(svg);
    }

    function renderModal() {
      const c = CASES[idx];
      $("#caseMeta").innerHTML = "<span>" + DL.icon(c.icon) + DL.escape(t(c.src)) + '</span><span class="stamp" style="position:static;transform:none">' + DL.escape(t(VERDICTS[c.verdict])) + "</span>";
      $("#caseTitle").textContent = t(c.headline);
      $("#caseSteps").innerHTML = STEPS.map(
        (s, i) =>
          '<button type="button" role="tab" data-step="' + i + '"' + (i === step ? ' aria-current="step" aria-selected="true"' : ' aria-selected="false"') + (i < step ? ' class="is-done"' : "") + "><span>" + (i + 1) + ". " + DL.escape(t(s)) + "</span></button>"
      ).join("");
      $$("#caseSteps button").forEach((b) =>
        b.addEventListener("click", () => {
          step = +b.dataset.step;
          renderModal();
        })
      );
      const s = STEPS[step].id;
      const panel = $("#casePanel");
      let html = '<div class="step-panel">';
      if (s === "claim") html += "<h3>" + t("ما الذي قيل؟", "What was said?") + "</h3><p>" + DL.escape(t(c.claim)) + "</p>";
      if (s === "flags") html += "<h3>" + t("ما الذي يجب أن يلفت انتباهك؟", "What should catch your eye?") + '</h3><ul class="flag-list">' + c.flags.map((f, i) => '<li style="--d:' + i * 90 + 'ms">' + DL.icon("alert", "txt-trick") + "<div>" + DL.escape(t(f)) + "</div></li>").join("") + "</ul>";
      if (s === "evidence") html += "<h3>" + t("ماذا تقول الأدلة؟", "What does the evidence say?") + "</h3><p>" + DL.escape(t(c.evidence)) + '</p><p class="source-line">' + DL.icon("book") + " " + DL.escape(t(c.source)) + "</p>";
      if (s === "lesson")
        html +=
          '<div class="explain"><h4>' + DL.icon("bulb") + t("الدرس", "The lesson") + "</h4><p>" + DL.escape(t(c.lesson)) + "</p></div>" +
          '<div class="verdict verdict--warn">' + DL.icon("tag") + "<div><strong>" + t("الحكم: ", "Verdict: ") + DL.escape(t(VERDICTS[c.verdict])) + "</strong></div></div>";
      html += '<div class="chart-frame" id="caseChart" hidden></div></div>';
      panel.innerHTML = html;
      const chartHost = $("#caseChart");
      const spec = c.charts && c.charts[s];
      if (spec) {
        chartHost.hidden = false;
        C.render(chartHost, Object.assign({ w: 560 }, spec));
      } else if (s === "evidence" && c.people) {
        chartHost.hidden = false;
        peopleChart(chartHost, c.people.base, c.people.extra);
      }
      $("#casePrev").disabled = step === 0;
      $("#caseNext").innerHTML = step === STEPS.length - 1 ? DL.icon("check") + t("تم", "Done") : t("التالي", "Next") + DL.icon("arrow", "ic-arrow");
      $("#caseSearch").href = "https://www.google.com/search?q=" + encodeURIComponent(c.query);
      if (step === STEPS.length - 1 && !seen.includes(c.id)) {
        seen.push(c.id);
        DL.store.set("casesSeen", seen);
        if (seen.length === CASES.length && DL.progress.get("cases") !== "done") {
          DL.progress.mark("cases", "done");
          DL.toast(t("حلّلت كل الحالات! أكملت الجزء الرابع.", "You analysed every case! Part 4 complete."), "trophy");
        }
      }
    }

    function open(i) {
      idx = i;
      step = 0;
      renderModal();
      modal.open();
      if (history.replaceState) history.replaceState(null, "", "#case-" + CASES[i].id);
    }

    $("#casePrev").addEventListener("click", () => {
      if (step > 0) {
        step--;
        renderModal();
      }
    });
    $("#caseNext").addEventListener("click", () => {
      if (step < STEPS.length - 1) {
        step++;
        renderModal();
      } else {
        modal.close();
      }
    });
    modal.el.addEventListener("close", () => {
      renderGrid();
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#cases");
    });
    modal.el.addEventListener("keydown", (e) => {
      const fwd = DL.lang() === "ar" ? "ArrowLeft" : "ArrowRight";
      const back = DL.lang() === "ar" ? "ArrowRight" : "ArrowLeft";
      if (e.target.closest("input,textarea")) return;
      if (e.key === fwd && step < STEPS.length - 1) {
        step++;
        renderModal();
      } else if (e.key === back && step > 0) {
        step--;
        renderModal();
      }
    });

    DL.onLang(() => {
      renderGrid();
      if (modal.el.open) renderModal();
    });

    // Deep link: cases.html#case-digest opens that case
    const m = /^#case-([a-z0-9]+)$/.exec(location.hash);
    if (m) {
      const i = CASES.findIndex((c) => c.id === m[1]);
      if (i >= 0) {
        const card = document.getElementById("case-" + CASES[i].id);
        if (card) card.scrollIntoView({ block: "center" });
        setTimeout(() => open(i), 350);
      }
    }
  }

  /* ---------------------------------------------------------------------
     Claim X-ray
     --------------------------------------------------------------------- */
  const RULES = [
    {
      re: /\d+(?:[.,]\d+)?\s?(?:%|٪)|\bper ?cent\b|في المئة|بالمئة|بالمائة/gi,
      label: { ar: "نسبة مئوية", en: "A percentage" },
      q: { ar: "نسبة من ماذا؟ هل هي نسبية أم مطلقة؟", en: "A percentage of what? Is it relative or absolute?" },
    },
    {
      re: /\b(?:doubles?|doubled|triples?|tripled|quadruples?|twice|times as|[0-9]+x)\b|يضاعف|تضاعف|يتضاعف|ضعف|أضعاف/gi,
      label: { ar: "مضاعفة", en: "A multiplication" },
      q: { ar: "تضاعف من أي رقم بدأ؟", en: "Doubled from what starting number?" },
    },
    {
      re: /\b(?:causes?|caused|leads? to|makes you|boosts?|cuts?|prevents?|cures?|protects?)\b|يسبّب|يسبب|تسبب|يؤدي إلى|يقي|يعالج|يحمي|يزيد من|يقلل من|يخفض/gi,
      label: { ar: "صياغة سببية", en: "Cause-and-effect wording" },
      q: { ar: "هل كانت تجربة، أم مجرد ارتباط؟", en: "Was it an experiment, or just a correlation?" },
    },
    {
      re: /\b(?:linked|link|associated|tied|connected)\b|مرتبط|مرتبطة|يرتبط|ترتبط|ارتباط/gi,
      label: { ar: "«مرتبط بـ»", en: "\"Linked to\"" },
      q: { ar: "الارتباط ليس سببًا: ما الذي قد يفسّره غير ذلك؟", en: "Linked isn't caused: what else could explain it?" },
    },
    {
      re: /\b(?:study|studies|research|researchers|scientists|experts|survey|poll|report)\b|دراسة|دراسات|بحث|باحثون|علماء|خبراء|استطلاع|تقرير/gi,
      label: { ar: "«دراسة» أو «خبراء»", en: "\"Study\" or \"experts\"" },
      q: { ar: "أي دراسة؟ من أجراها، وعلى كم شخص، وأين نُشرت؟", en: "Which study? Who ran it, on how many people, published where?" },
    },
    {
      re: /\b(?:up to|as (?:much|many) as)\b|يصل إلى|تصل إلى|ما يصل|حتى \d+/gi,
      label: { ar: "«يصل إلى»", en: "\"Up to\"" },
      q: { ar: "«يصل إلى» تعطي أفضل حالة. ما المعتاد؟", en: "\"Up to\" gives the best case. What's typical?" },
    },
    {
      re: /\b(?:fastest|biggest|largest|highest|lowest|record|worst|best|never|always)\b|الأسرع|الأكبر|الأعلى|الأدنى|قياسي|الأسوأ|الأفضل|أبدًا|أبدا|دائمًا|دائما/gi,
      label: { ar: "صيغة مبالغة", en: "A superlative" },
      q: { ar: "مقارنةً بماذا، ومنذ متى؟", en: "Compared with what, and since when?" },
    },
    {
      re: /\b\d+\s+(?:out of|in)\s+\d+\b|\d+\s+من\s+كل\s+\d+|من بين/gi,
      label: { ar: "«كذا من كل كذا»", en: "\"X out of Y\"" },
      q: { ar: "من هم الـY؟ وكيف اختيروا؟", en: "Who were the Y, and how were they chosen?" },
    },
    {
      re: /!|\b(?:shocking|alarming|explodes?|soars?|plunges?|crisis|panic|skyrockets?|terrifying)\b|صادم|صادمة|مرعب|ينفجر|يقفز|يهوي|كارثة|أزمة|يحلّق/gi,
      label: { ar: "لغة عاطفية", en: "Emotional language" },
      q: { ar: "الرقم قد يكون مُبهرَجًا. ما الرقم المجرّد؟", en: "The number may be dressed up. What's the plain figure?" },
    },
    {
      re: /\b(?:millions?|billions?|thousands)\b|ملايين|مليون|مليار|آلاف/gi,
      label: { ar: "رقم ضخم", en: "A big number" },
      q: { ar: "كم يساوي لكل شخص؟ وما المقام؟", en: "How much is it per person? What's the denominator?" },
    },
  ];
  const X_EXAMPLES = [
    { ar: "دراسة صادمة: من يتناولون الشوكولاتة يوميًا مرتبطون بانخفاض خطر أمراض القلب بنسبة 50%!", en: "Shocking study: people who eat chocolate daily are linked to a 50% lower risk of heart disease!" },
    { ar: "الجريمة تتضاعف في مدينتنا هذا العام، والخبراء يحذّرون من أزمة.", en: "Crime doubles in our city this year as experts warn of a crisis." },
    { ar: "9 من كل 10 مستخدمين يوصون بتطبيقنا، وفّر حتى 70% الآن!", en: "9 out of 10 users recommend our app. Save up to 70% today!" },
  ];

  function initXray() {
    const input = $("#xInput");
    if (!input) return;
    let touched = false;

    function analyse() {
      const text = input.value;
      const ranges = [];
      const hits = [];
      RULES.forEach((rule, ri) => {
        rule.re.lastIndex = 0;
        let m;
        let found = false;
        while ((m = rule.re.exec(text))) {
          if (!m[0].length) {
            rule.re.lastIndex++;
            continue;
          }
          ranges.push([m.index, m.index + m[0].length]);
          found = true;
        }
        if (found) hits.push(ri);
      });
      ranges.sort((a, b) => a[0] - b[0]);
      const merged = [];
      ranges.forEach((r) => {
        const last = merged[merged.length - 1];
        if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
        else merged.push(r.slice());
      });
      let html = "";
      let pos = 0;
      merged.forEach(([a, b]) => {
        html += DL.escape(text.slice(pos, a)) + "<mark>" + DL.escape(text.slice(a, b)) + "</mark>";
        pos = b;
      });
      html += DL.escape(text.slice(pos));
      $("#xMarked").innerHTML = text.trim() ? html : '<span class="txt-muted">' + t("لا يوجد نص بعد.", "No text yet.") + "</span>";

      const score = Math.min(100, hits.length * 15);
      const ring = $("#xGauge");
      ring.style.setProperty("--v", score);
      ring.style.setProperty("--gauge-c", score >= 45 ? "var(--redpen)" : score >= 15 ? "var(--amber)" : "var(--truth)");
      $("#xScore").textContent = hits.length;
      $("#xLevel").textContent =
        hits.length === 0 ? t("لا إشارات واضحة في الصياغة", "No obvious red flags in the wording") : hits.length < 3 ? t("بعض الإشارات تستحق التوقف", "A few flags worth a pause") : t("إشارات كثيرة: تمهّل قبل التصديق", "Lots of flags: slow down before believing");
      $("#xLevelNote").textContent =
        hits.length === 0
          ? t("هذا لا يعني أنه صحيح. ما زلت بحاجة إلى التحقق من المصدر.", "That doesn't make it true. You still need to check the source.")
          : t("كل إشارة سؤال تطرحه، لا حكم جاهز.", "Each flag is a question to ask, not a verdict.");
      $("#xFlags").innerHTML = hits
        .map((ri, i) => '<li style="--d:' + i * 60 + 'ms">' + DL.icon("help", "txt-lens") + "<div><b>" + DL.escape(t(RULES[ri].label)) + "</b>" + DL.escape(t(RULES[ri].q)) + "</div></li>")
        .join("");
    }

    function renderExamples() {
      $("#xExamples").innerHTML =
        '<span class="txt-muted" style="font-size:.85rem;align-self:center">' + t("جرّب:", "Try:") + "</span>" +
        X_EXAMPLES.map((e, i) => '<button class="chip" type="button" data-xe="' + i + '" style="min-height:32px;font-size:.82rem">' + DL.escape(t(e).slice(0, 30)) + "…</button>").join("");
      $$("[data-xe]").forEach((b) =>
        b.addEventListener("click", () => {
          input.value = t(X_EXAMPLES[+b.dataset.xe]);
          touched = true;
          analyse();
        })
      );
      if (!touched) input.value = t(X_EXAMPLES[0]);
    }

    input.addEventListener("input", () => {
      touched = true;
      analyse();
    });
    DL.onLang(() => {
      renderExamples();
      analyse();
    });
  }

  /* ---------------------------------------------------------------------
     Before-you-share checklist
     --------------------------------------------------------------------- */
  function initShare() {
    const list = $("#shareList");
    if (!list) return;
    const boxes = $$("input[data-share]", list);
    let saved = DL.store.get("share", {});
    if (!saved || typeof saved !== "object") saved = {};
    boxes.forEach((b) => (b.checked = !!saved[b.dataset.share]));
    let celebrated = boxes.every((b) => b.checked);

    function render() {
      const n = boxes.filter((b) => b.checked).length;
      $("#shareCount").textContent = n + "/" + boxes.length;
      $("#shareBar").style.setProperty("--w", (n / boxes.length) * 100 + "%");
      $("#shareLabel").textContent =
        n === boxes.length ? t("جاهز للمشاركة بمسؤولية", "Ready to share responsibly") : n === 0 ? t("لم تبدأ الفحص بعد", "Not checked yet") : t("استمر في الفحص", "Keep checking");
    }
    boxes.forEach((b) =>
      b.addEventListener("change", () => {
        saved[b.dataset.share] = b.checked;
        DL.store.set("share", saved);
        render();
        const all = boxes.every((x) => x.checked);
        if (all && !celebrated) {
          celebrated = true;
          DL.toast(t("ممتاز! هكذا تشارك بمسؤولية.", "Great! That's how to share responsibly."), "shield");
        }
        if (!all) celebrated = false;
      })
    );
    $("#shareReset").addEventListener("click", () => {
      boxes.forEach((b) => (b.checked = false));
      saved = {};
      DL.store.set("share", saved);
      celebrated = false;
      render();
    });
    DL.onLang(render);
  }

  initCases();
  initXray();
  initShare();
})();
