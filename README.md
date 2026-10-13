# DataLens · عدسة البيانات

An interactive, bilingual (Arabic / English) website that teaches non-specialists to recognise when numbers mislead: in the news, in ads, on social media and in AI answers.

Its design takes cues from the [StatVision](https://fayzta307-cell.github.io/Fainly/) learning site: Arabic-first RTL layout, a multi-page learning journey, floating hero cards, scroll reveals, quizzes and a "next part" band. It has its own identity built around a fact-checker's desk: graph-paper chart stages, red-pen annotations and highlighter marks.

## What's inside

| Page | What you can do |
| --- | --- |
| `index.html` · Home | Move a magnifying lens over a misleading chart to reveal the honest one, compare two charts of the same vote, flip Darrell Huff's five questions, and track your progress through the four parts. |
| `charts.html` · Part 1, Misleading charts | Cut a bar chart's axis and watch Tufte's lie factor climb; drag a time window to cherry-pick a share price's story; tilt and rotate a 3D pie and measure each slice's "share of ink"; find the trick in six charts by clicking on them; read the 10-trick field guide. |
| `traps.html` · Part 2, Statistical traps | Reveal the hidden factor behind ice cream and drownings; sample a town of 400 four different ways; flip Simpson's paradox with real kidney-stone data (BMJ, 1986); run 100 coin-toss studies at different sample sizes; translate relative risk into people per 1,000; decide where to armour a WWII bomber. |
| `ai.html` · Part 3, AI as a fact-checker | Learn where AI helps and where it fails, follow a 5-step workflow, build a fact-check prompt and copy it into ChatGPT, Claude or Gemini, browse 12 filterable prompts, and flag the hallucinations in a fictional chat. |
| `cases.html` · Part 4, Real cases | Open eight real cases (the 193% pie, the inverted Florida chart, Colgate's "80% of dentists", the chocolate weight-loss hoax, the processed-meat headlines, chocolate and Nobel prizes, the 1936 Literary Digest poll, dropout billionaires) and step through each analysis. X-ray any headline for red-flag wording and work through a before-you-share checklist. |
| `quiz.html` · The challenge | Swipe, click or use the arrow keys on 12 "Is this chart honest?" cards, then take a 10-question trap quiz. Ranks, best scores and a list of what to review. |

### Site-wide features

- Arabic (RTL) by default, with a one-click switch to English. `?lang=en` in the URL opens the English version.
- Light and dark themes that follow the system setting, with a manual toggle.
- Progress tracking per part, best quiz scores and completed exercises, all saved in the browser (`localStorage`); nothing is sent anywhere.
- Scroll-triggered reveals, page transitions, a reading-progress bar and a back-to-top button with a progress ring.
- Responsive from phone to desktop, keyboard accessible, and respectful of `prefers-reduced-motion`.
- No frameworks or chart libraries. Every chart is hand-built SVG (`assets/js/chart.js`), so each trick can be changed live and circled with a red pen.

## Run it locally

It's a static site, so any web server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from disk also works.

### Publish with GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, pick the branch and the `/ (root)` folder, and save.

## Project structure

```
index.html  charts.html  traps.html  ai.html  cases.html  quiz.html
assets/
  css/datalens.css      design tokens (light + dark), layout and components
  js/core.js            language, theme, navigation, reveals, progress, icons, toasts
  js/chart.js           SVG chart engine: bar, line, pie, 3D pie, pictogram, scatter, grouped, stacked
  js/home.js            Home page interactions
  js/part1.js … part4.js, quiz.js   one script per page
  img/favicon.svg
tools/sync_partials.py  keeps the shared <head>, navigation and footer identical on every page
```

The shared head, navigation and footer live in `tools/sync_partials.py`. After editing them there, run:

```bash
python3 tools/sync_partials.py *.html
```

Bilingual text sits side by side in the HTML as `<span lang="ar">…</span><span lang="en">…</span>`; CSS shows only the active language. Text generated in JavaScript uses `{ ar: "…", en: "…" }` objects and the `DL.t()` helper.

## About the data

Examples labelled **illustrative** use made-up numbers to demonstrate a technique. Real cases name their sources, and each one has a "Verify it yourself" button that searches for the original. Ideas credited on the site: Darrell Huff (*How to Lie with Statistics*, 1954), Edward Tufte's lie factor, Mike Caulfield's SIFT method, Kahneman and Tversky's hospital problem, Howard Wainer's "most dangerous equation", and Charig et al. (BMJ, 1986) for the Simpson's paradox data.
