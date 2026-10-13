"""Inject the shared head, navigation and footer into every DataLens page.

Pages carry markers <!--@head-->, <!--@nav-->, <!--@footer-->. Each marker is
replaced by a block wrapped in <!-- @x:start --> ... <!-- @x:end --> comments,
so running the script again refreshes the blocks in place.
"""
import re
import sys
from pathlib import Path

HEAD = """<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#1e4fd6">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap">
  <link rel="stylesheet" href="assets/css/datalens.css">
  <script>
    (function () {
      var d = document.documentElement, s = {};
      try { s = JSON.parse(localStorage.getItem("datalens:v1")) || {}; } catch (e) {}
      var q = /[?&]lang=(ar|en)/.exec(location.search);
      var l = q ? q[1] : s.lang || "ar";
      d.lang = l;
      d.dir = l === "ar" ? "rtl" : "ltr";
      if (s.theme === "dark" || s.theme === "light") d.setAttribute("data-theme", s.theme);
      d.classList.add("js");
    })();
  </script>
  <script src="assets/js/core.js" defer></script>
  <script src="assets/js/chart.js" defer></script>"""

BRAND_MARK = """<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="30" y="29" width="8" height="17" rx="4" transform="rotate(-45 34 37.5)" style="fill:var(--ink)"/>
          <circle cx="20" cy="20" r="17" style="fill:var(--lens)"/>
          <circle cx="20" cy="20" r="13" style="fill:var(--surface)"/>
          <rect x="11.5" y="19" width="4.5" height="9" rx="1.2" style="fill:var(--lens)"/>
          <rect x="17.8" y="12.5" width="4.5" height="15.5" rx="1.2" style="fill:var(--teal)"/>
          <rect x="24" y="16" width="4.5" height="12" rx="1.2" style="fill:var(--redpen)"/>
        </svg>"""

NAV = """<a class="skip-link" href="#main"><span lang="ar">تخطَّ إلى المحتوى</span><span lang="en">Skip to content</span></a>
  <div class="read-progress" aria-hidden="true"></div>
  <header class="nav">
    <div class="container nav__inner">
      <a class="brand" href="index.html">
        """ + BRAND_MARK + """
        <span class="brand__name">
          <span lang="ar">عدسة البيانات</span><span lang="en">DataLens</span>
          <small><span class="only-ar" lang="en" data-keep>DataLens</span><span class="only-en" lang="ar" data-keep>عدسة البيانات</span></small>
        </span>
      </a>
      <nav aria-label="Main" data-i18n-attrs="aria-label" data-aria-label-ar="القائمة الرئيسية" data-aria-label-en="Main">
        <ul class="nav__links" id="nav-links">
          <li><a class="nav__link" data-nav="home" href="index.html"><span lang="ar">الرئيسية</span><span lang="en">Home</span></a></li>
          <li><a class="nav__link" data-nav="charts" href="charts.html"><span class="nav__num">01</span><span lang="ar">الرسوم المضلِّلة</span><span lang="en">Charts</span></a></li>
          <li><a class="nav__link" data-nav="traps" href="traps.html"><span class="nav__num">02</span><span lang="ar">الفخاخ الإحصائية</span><span lang="en">Traps</span></a></li>
          <li><a class="nav__link" data-nav="ai" href="ai.html"><span class="nav__num">03</span><span lang="ar">الذكاء الاصطناعي</span><span lang="en">AI check</span></a></li>
          <li><a class="nav__link" data-nav="cases" href="cases.html"><span class="nav__num">04</span><span lang="ar">حالات واقعية</span><span lang="en">Real cases</span></a></li>
        </ul>
      </nav>
      <div class="nav__tools">
        <button class="tool-btn" type="button" data-lang-toggle>
          <svg class="ic" aria-hidden="true"><use href="#i-globe"></use></svg><span class="lang-label">EN</span>
        </button>
        <button class="tool-btn theme-btn" type="button" data-theme-toggle data-i18n-attrs="aria-label" data-aria-label-ar="الوضع الداكن" data-aria-label-en="Dark mode" aria-label="الوضع الداكن">
          <svg class="ic ic-moon" aria-hidden="true"><use href="#i-moon"></use></svg>
          <svg class="ic ic-sun" aria-hidden="true"><use href="#i-sun"></use></svg>
        </button>
        <a class="nav__cta" href="quiz.html" data-nav="quiz">
          <svg class="ic" aria-hidden="true"><use href="#i-trophy"></use></svg>
          <span><span lang="ar">التحدي</span><span lang="en">Challenge</span></span>
        </a>
        <button class="tool-btn nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-i18n-attrs="aria-label" data-aria-label-ar="القائمة" data-aria-label-en="Menu" aria-label="القائمة">
          <svg class="ic" aria-hidden="true"><use href="#i-menu"></use></svg>
        </button>
      </div>
    </div>
  </header>"""

FOOTER = """<footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div>
          <a class="brand" href="index.html">
            """ + BRAND_MARK + """
            <span class="brand__name">
              <span lang="ar">عدسة البيانات</span><span lang="en">DataLens</span>
              <small><span class="only-ar" lang="en" data-keep>DataLens</span><span class="only-en" lang="ar" data-keep>عدسة البيانات</span></small>
            </span>
          </a>
          <p lang="ar">منصة تفاعلية تعلّم غير المتخصصين كيف يكتشفون الأرقام المضلِّلة في الأخبار والإعلانات ووسائل التواصل وإجابات الذكاء الاصطناعي.</p>
          <p lang="en">An interactive platform that teaches non-specialists to spot misleading numbers in the news, ads, social media and AI answers.</p>
        </div>
        <div>
          <h4><span lang="ar">تعلّم</span><span lang="en">Learn</span></h4>
          <ul>
            <li><a href="charts.html"><span lang="ar">01 · الرسوم المضلِّلة</span><span lang="en">01 · Misleading charts</span></a></li>
            <li><a href="traps.html"><span lang="ar">02 · الفخاخ الإحصائية</span><span lang="en">02 · Statistical traps</span></a></li>
            <li><a href="ai.html"><span lang="ar">03 · الذكاء الاصطناعي مدقِّقًا</span><span lang="en">03 · AI as a fact-checker</span></a></li>
            <li><a href="cases.html"><span lang="ar">04 · حالات واقعية</span><span lang="en">04 · Real cases</span></a></li>
          </ul>
        </div>
        <div>
          <h4><span lang="ar">تدرّب</span><span lang="en">Practice</span></h4>
          <ul>
            <li><a href="quiz.html"><span lang="ar">هل هذا الرسم صادق؟</span><span lang="en">Is this chart honest?</span></a></li>
            <li><a href="charts.html#spot"><span lang="ar">اكتشف الخدعة</span><span lang="en">Spot the trick</span></a></li>
            <li><a href="ai.html#builder"><span lang="ar">مُنشئ أسئلة التحقق</span><span lang="en">Fact-check prompt builder</span></a></li>
            <li><a href="cases.html#xray"><span lang="ar">أشعة الادعاءات</span><span lang="en">Claim X-ray</span></a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© <span data-year>2026</span> <span lang="ar">عدسة البيانات</span><span lang="en">DataLens</span></span>
        <span lang="ar">الأمثلة الموسومة بـ«توضيحي» تستخدم أرقامًا مصطنعة؛ الحالات الواقعية تذكر مصادرها.</span>
        <span lang="en">Examples marked "illustrative" use made-up numbers; real cases name their sources.</span>
      </div>
    </div>
  </footer>
  <button class="to-top" type="button" data-i18n-attrs="aria-label" data-aria-label-ar="العودة إلى الأعلى" data-aria-label-en="Back to top" aria-label="العودة إلى الأعلى">
    <svg class="ring" viewBox="0 0 52 52" aria-hidden="true"><circle class="bg" cx="26" cy="26" r="23"/><circle class="fg" cx="26" cy="26" r="23"/></svg>
    <svg class="ic" aria-hidden="true"><use href="#i-up"></use></svg>
  </button>"""

BLOCKS = {"head": HEAD, "nav": NAV, "footer": FOOTER}


def inject(text: str) -> str:
    for name, html in BLOCKS.items():
        wrapped = f"<!-- @{name}:start -->\n  {html}\n  <!-- @{name}:end -->"
        text = re.sub(
            rf"<!-- @{name}:start -->.*?<!-- @{name}:end -->",
            lambda _m: wrapped,
            text,
            flags=re.S,
        )
        text = text.replace(f"<!--@{name}-->", wrapped)
    return text


if __name__ == "__main__":
    for path in sys.argv[1:]:
        p = Path(path)
        p.write_text(inject(p.read_text(encoding="utf-8")), encoding="utf-8")
        print("injected", p)
