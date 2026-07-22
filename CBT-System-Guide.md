# CBT Technical Library — System Guide

This is the complete reference for how your quiz system works and how to add
new quizzes to it. Written so you (or anyone) can do this without needing an
AI's help — everything you need is here.

---

## 1. How the system is built

Three kinds of files live in your GitHub repo (`DGCA_CBT`):

```
DGCA_CBT/
├── index.html            ← the dashboard (module picker, categories, cards)
├── CBT_Player.html        ← ONE shared quiz engine — every quiz uses this
├── hero-aircraft.jpg
├── footer-aircraft.jpg
└── data/
    ├── module8-2017-s1.js     ← one small file per quiz — just the questions
    ├── module8-2017-s2.js
    └── ... (one file per quiz, forever)
```

**The key idea:** `CBT_Player.html` has zero quiz content in it — it's pure
design + logic. Each quiz is just a tiny data file. This means: if you ever
want to change how quizzes *look or behave*, you edit `CBT_Player.html`
**once**, and every quiz — past and future — picks up the change
automatically, because they all point at the same engine.

The dashboard (`index.html`) never touches your questions directly either —
it just stores a list of cards (title, module, category, and a **link** that
tells the browser which player + which data file to open).

---

## 2. The data file format (write this by hand for any new quiz)

Every quiz data file is a `.js` file with exactly this shape:

```js
window.CBT_QUIZ = {
  config: {
    pageTitle: 'DGCA Module 08 | 2017 – 1st Session CBT',
    headerLeft: 'DGCA',
    headerRight: 'Module 08 – 2017 Session 1',
    resultsTitle: '✈ QUIZ COMPLETE',
    resultsSubtitle: 'DGCA Module 08 — 1st Session of 2017'
  },
  questions: [
    {
      topic: '08.1 Aerodynamics',
      q: 'Directional control is provided by',
      opts: ['Aileron', 'Elevator', 'Rudder'],
      ans: 2,
      exp: ''
    },
    {
      topic: '08.1 Aerodynamics',
      q: 'Density of air at sea level is',
      opts: ['1.225 kg/m³', '1.025 kg/m³', '1.205 kg/m³'],
      ans: 0,
      exp: ''
    }
    // ...one { } block per question, comma-separated, any number of them
  ]
};
```

**Field-by-field:**

| Field | What it is |
|---|---|
| `pageTitle` | Shows in the browser tab |
| `headerLeft` / `headerRight` | The two halves of the top bar text |
| `resultsTitle` / `resultsSubtitle` | Shown on the results screen at the end |
| `topic` | Groups questions for colored badges — any text, first 7 distinct topics get 7 different colors automatically |
| `q` | The question text |
| `opts` | The answer options — **any number works** (2, 3, 4, 5, 6...), not fixed to 4. They're auto-labeled A, B, C, D, E... |
| `ans` | Index of the correct option — **0 = first option**, 1 = second, 2 = third, etc. |
| `exp` | Optional explanation shown after answering. Use `''` (empty) if you don't want one |

That's the entire format. No other syntax is needed.

---

## 3. Step-by-step: adding one new quiz

1. **Get your questions into the format above.** If you're doing this
   without AI help, you're typing/pasting each question into that
   `{topic:..., q:..., opts:[...], ans:..., exp:...}` shape by hand. This is
   the only genuinely manual part.
2. **Save it as a `.js` file.** Name it something identifiable, e.g.
   `module17-practiceq-set3.js`. No spaces in the filename.
3. **Upload it to GitHub**, inside the `data/` folder.
   - GitHub → your repo → `data` folder → **Add file → Upload files**
4. **Wait for Netlify to redeploy** (usually under a minute — check the
   Deploys tab on netlify.com if you want to confirm).
5. **Add a card in the dashboard:**
   - Open your live dashboard → go into the right Module → **+ Add CBT**
   - **Title:** whatever you want shown
   - **Module:** e.g. "Module 17"
   - **Category:** e.g. "PYQ" or "Practice Q" — reuse the same word every
     time for the same type, so quizzes group together correctly
   - **Set/Year/Session** *(optional)*: e.g. "2024 Session 1" — only fill
     this in if you want this category further split (like PYQ by year)
   - **Link:** exactly —
     ```
     CBT_Player.html?quiz=data/module17-practiceq-set3.js
     ```
     (swap in your actual data filename — must match **exactly**, including
     capital/lowercase letters)
6. **Save**, then click **Open ▶** on the new card to confirm it loads with
   real questions.

---

## 4. Adding many quizzes at once (bulk import)

If you have a big batch (say, migrating 16 old quizzes at once), typing 16
cards by hand is slow. Instead, the dashboard's **Import Library** button
(in the Tools panel) accepts a `.json` file that pre-fills many cards in one
click.

The format is:
```json
{
  "library": [
    {
      "id": "unique-id-1",
      "title": "Module 8 PYQ – 2017 Session 1",
      "module": "Module 8",
      "subtopic": "PYQ",
      "subcategory": "2017 Session 1",
      "link": "CBT_Player.html?quiz=data/module8-2017-s1.js",
      "count": 20,
      "color": 0,
      "tags": [],
      "notes": "",
      "pinned": false,
      "dateAdded": "2026-07-22T12:00:00.000Z",
      "lastOpened": null,
      "progress": null,
      "linkStatus": null
    }
  ],
  "customModules": ["Module 8"]
}
```
One object per quiz inside `library`. Re-importing the same file twice is
safe — the dashboard skips any entry whose Link already exists, so you won't
get duplicates.

---

## 5. Known gotchas (read this before assuming something's "broken")

These are real issues that came up while building this system — if
something breaks again, check this list first.

- **Filenames are case-sensitive.** `M8_2017_S1.js` and `m8_2017_s1.js` are
  two different files as far as the server is concerned. The Link field's
  spelling must match the uploaded filename exactly, capital letters
  included.

- **No trailing spaces.** If you copy-paste a filename into the Link field
  and accidentally include a trailing space, the browser will silently try
  to load a file that doesn't exist (you'll see it as `%20` at the end of
  the URL if you inspect it). Click into the field, press **End**, and
  make sure the cursor lands immediately after the last real character.

- **`CBT_Player.html`'s two `<script>` tags must stay separate.** The file
  is deliberately split into two `<script>` blocks — one that loads your
  quiz's data file, and a second one (below it) that reads that data and
  runs the quiz. If these ever get merged back into one block, every quiz
  will silently fail with "No Quiz Data Loaded," because the engine would
  try to read the data before the browser finished loading it. Never
  combine them.

- **Netlify's "Pretty URLs" setting** may show your address bar as
  `/cbt_player` (lowercase, no `.html`) instead of `/CBT_Player.html`. This
  is purely cosmetic — it's a Netlify feature (Site settings → Build &
  deploy → Post processing) and doesn't affect whether quizzes load.

- **Options aren't fixed to 4.** Any number of options works (2 through
  Z-many). Don't pad out 3-option questions with a fake 4th option.

- **`index.html` filename must stay exactly lowercase.** If you ever see
  two files like `Index.html` and `index.html` both sitting in your repo,
  delete the capitalized duplicate — only the lowercase one is recognized
  as your site's homepage.

---

## 6. Troubleshooting "No Quiz Data Loaded"

If a quiz shows this error, check in this order:

1. Open the data file's raw URL directly in a browser tab — e.g.
   `https://yoursite.netlify.app/data/module17-practiceq-set3.js` — you
   should see the raw `window.CBT_QUIZ = {...}` code. If you get a 404 or
   blank page, the file either isn't uploaded, or the filename doesn't
   match exactly (check capitalization and spaces).
2. If the raw file loads fine but the quiz still won't open through the
   dashboard, re-check the Link field for a typo or trailing space (see
   gotcha above).
3. If both of those check out and it's *still* broken, something in
   `CBT_Player.html` itself may have been edited by accident (see the
   two-script-tag gotcha above).

---

*Keep this file somewhere safe — in the repo itself (e.g. as
`GUIDE.md` alongside `index.html`) is a good spot, so it travels with the
project.*
