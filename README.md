# Žinių žygis - Answer Base

Chrome extension for [ziniuzygis.lt](https://ziniuzygis.lt): it reads the question on the page,
looks it up in a local database of **700+ questions**, and highlights the correct option in green.
You can copy any question in one click and add new question/answer pairs without leaving the page.

Interface available in **English, Russian and Lithuanian**.

---

## Install

1. Download this repository (**Code → Download ZIP**) and unpack it, or `git clone`.
2. Open `chrome://extensions`
3. Turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the **`extension`** folder
5. Open [ziniuzygis.lt](https://ziniuzygis.lt) — the panel appears in the bottom-right corner

> Select the **`extension`** folder, not the repository root — otherwise Chrome will not
> find `manifest.json`.

## Usage

The panel shows up by itself on a quiz page:

- **answer found** — the correct option gets a green outline and a checkmark, and the panel
  shows the answer text with the match confidence;
- **not in the database** — buttons to add the question and to copy it;
- click the panel header to collapse it.

Questions with several correct answers are supported — every matching option is highlighted.

### Adding a question

Press **＋ Add to database**. The question is already filled in from the page, and the on-page
options are listed as buttons — once the quiz reveals the correct one, just click it.
Click several options for multi-answer questions. Saved questions are found immediately.

### The database window

Click the extension icon to open the full list: search, edit, delete, 💾 export to JSON,
⬆ import from JSON, and the language switcher.

Search ignores Lithuanian diacritics — `zaliosios` finds `žaliosios`.
Import only **adds missing** questions; it never overwrites or deletes what you already have.

---

## Getting newer questions

Everything you add through the extension is saved in `chrome.storage` right away — you never
need to touch any file for your own use. To pull in questions other people have added since
you installed, pick either route.

**Import the published database** (no reinstall):

1. Open the [raw `data/answers.json`](https://raw.githubusercontent.com/yttttyy/ziniuzygis-answers/main/data/answers.json)
   and save it (`Ctrl+S`)
2. Click the extension icon → **⬆** → pick the file

Only missing questions are added; everything you added yourself stays untouched.

> Use the **Raw** view (or the *Download raw file* button). Saving the normal GitHub file page
> stores an HTML document, and the import will reject it as an invalid file.

**Or reinstall the extension:** download the repository again, replace your `extension` folder
and press **↻** on the extension card in `chrome://extensions`. Missing questions are topped up
automatically, again without losing your own.

---

## Updating the published question set

The steps below are only for updating the copy that ships in this repository.

The question set lives in three places that must stay in sync:

| File | Purpose |
|------|---------|
| `extension/db.js` | what a fresh install is seeded with |
| `data/answers.json` | the human-readable published copy |
| `extension/background.js` | `SEED_VERSION`, which triggers top-up on existing installs |

Dropping a file into `data/` on its own changes nothing — the extension never reads it.
Use the script instead:

```bash
# 1. In the extension window press 💾 to export a backup
# 2. Feed that backup to the script
node tools/update-db.js ~/Downloads/ziniuzygis-atsakymai.json
```

It merges the backup into the existing set, de-duplicates by question text (ignoring
diacritics), rewrites `db.js` and `answers.json`, and bumps `SEED_VERSION`. Existing answers
are never overwritten — a backup can only add questions or fill in an empty answer.
Both schemas are accepted: `{q, a}` (extension export) and `{question, answer}`.

Then commit the three changed files. Users get the new questions on the next extension update,
**without losing anything they added themselves**.

---

## Repository layout

```
extension/        Chrome extension (MV3) — load this folder
  manifest.json
  content.js      panel + highlighting on the quiz page
  content.css
  popup.html/js   database window
  match.js        text normalisation + fuzzy matching
  i18n.js         EN / RU / LT translations
  db.js           built-in set of 700+ questions
  background.js   seeding and top-up on update
data/
  answers.json    the same database as plain JSON
tools/
  update-db.js    rebuilds the database from a backup
web/
  index.html      standalone HTML viewer (works without the extension)
```

## How matching works

Question text on the page rarely matches the stored text character for character, so the
comparison is fuzzy. Lithuanian diacritics are folded to ASCII, punctuation is stripped, and
the texts are compared as word sets — the Dice coefficient, plus a bonus when one text contains
the other. The threshold is `0.5`, set in [`extension/match.js`](extension/match.js).

When two entries score the same, the one with the higher Dice coefficient wins. Without that
tie-break, short fragments such as *“Nepamiršk, kad gali rinktis net kelis atsakymus!”* are
fully contained in any longer question, score the same 1.0, and hijack other questions' answers.

The same matcher maps the stored answer onto the on-page options, which is what makes
multi-answer questions highlight correctly.

## Notes

- Data lives in `chrome.storage.local`, shared between the panel and the database window.
- Image-based questions (`image_quiz`) have no option text, so they cannot be highlighted —
  the answer is shown in the panel only.
- Site selectors (`.challenge-question`, `.btn-challenge-answer`) come from the Challenger
  Platform build used by ziniuzygis.lt; fallback heuristics are included in case they change.

## License

[MIT](LICENSE) for the code. The question set was collected from publicly published material
and community contributions.
