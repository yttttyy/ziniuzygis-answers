# Žinių žygis — Answer Base

Chrome extension for [ziniuzygis.lt](https://ziniuzygis.lt): it reads the question on the page,
looks it up in a local database of **700+ questions**, and highlights the correct option in green.
You can copy any question in one click and add new question/answer pairs without leaving the page.

Interface available in **Русский / English / Lietuvių**.

![icon](extension/icons/icon48.png)

---

## Install / Установка / Diegimas

1. Download this repository (**Code → Download ZIP**) and unpack it, or `git clone`.
2. Open `chrome://extensions`
3. Turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the **`extension`** folder
5. Open [ziniuzygis.lt](https://ziniuzygis.lt) — the panel appears in the bottom-right corner

> Select **`extension`**, not the repository root — otherwise Chrome will not find `manifest.json`.

---

## Русский

**На сайте викторины** панель появляется сама в правом нижнем углу:

- **ответ найден** — верный вариант обводится зелёным с галочкой, в панели текст ответа
  и процент совпадения;
- **ответа нет в базе** — кнопки «Добавить в базу» и «Копировать вопрос»;
- клик по шапке панели сворачивает её.

**Добавление нового вопроса.** Нажмите «＋ Добавить в базу»: вопрос уже подставлен со страницы,
а варианты ответов выведены списком — когда викторина покажет правильный, просто кликните по нему.
Для вопросов с несколькими верными ответами можно отметить сразу несколько.

**Иконка расширения** — вся база: поиск, редактирование, удаление, 💾 выгрузка в JSON,
⬆ загрузка из JSON и переключатель языка. Поиск не требует литовской диакритики:
`zaliosios` находит `žaliosios`.

## English

The panel shows up automatically on a quiz page:

- **answer found** — the correct option gets a green outline and a checkmark, the panel shows
  the answer text and the match confidence;
- **not in the database** — buttons to add it and to copy the question;
- click the panel header to collapse it.

**Adding a question.** Press “＋ Add to database”: the question is already filled in from the page
and the on-page options are listed as buttons — once the quiz reveals the correct one, just click it.
Multiple correct options are supported.

The **extension icon** opens the full database: search, edit, delete, export/import JSON
and a language switcher. Search ignores Lithuanian diacritics — `zaliosios` finds `žaliosios`.

## Lietuvių

Skydelis atsiranda automatiškai viktorinos puslapyje:

- **atsakymas rastas** — teisingas variantas apvedamas žaliai su varnele, skydelyje matomas
  atsakymo tekstas ir atitikmens procentas;
- **klausimo bazėje nėra** — mygtukai pridėti jį ir nukopijuoti klausimą;
- spustelėjus skydelio antraštę, jis suskleidžiamas.

**Klausimo pridėjimas.** Paspauskite „＋ Pridėti į bazę“: klausimas jau įrašytas iš puslapio,
o variantai pateikti mygtukų sąrašu — kai viktorina parodys teisingą, tiesiog jį spustelėkite.
Galimi keli teisingi atsakymai.

**Plėtinio piktograma** atveria visą bazę: paieška, redagavimas, trynimas, JSON eksportas/importas
ir kalbos perjungiklis. Paieškai lietuviškos diakritikos nereikia: `zaliosios` randa `žaliosios`.

---

## Repository layout

```
extension/        Chrome extension (MV3) — load this folder
  manifest.json
  content.js      panel + highlighting on the quiz page
  content.css
  popup.html/js   database window
  match.js        text normalisation + fuzzy matching
  i18n.js         RU / EN / LT translations
  db.js           built-in set of 700+ questions
  background.js   seeding and top-up on update
data/
  answers.json    the same database as plain JSON
web/
  index.html      standalone HTML viewer (works without the extension)
```

## How matching works

Question text on the page rarely matches the stored text character for character, so comparison
is fuzzy: Lithuanian diacritics are folded to ASCII, punctuation is stripped, and the texts are
compared as word sets (Dice coefficient plus a substring bonus). The threshold is `0.5`,
set in [`extension/match.js`](extension/match.js).

The same matcher maps the stored answer onto the on-page options, which is what makes
multi-answer questions highlight correctly.

## Notes

- Data lives in `chrome.storage.local`, shared between the panel and the database window.
- Updating the extension tops up missing questions from `db.js` **without touching**
  anything you added yourself.
- Image-based questions (`image_quiz`) have no option text, so they cannot be highlighted —
  the answer is shown in the panel only.
- Site selectors (`.challenge-question`, `.btn-challenge-answer`) come from the Challenger
  Platform build used by ziniuzygis.lt; fallback heuristics are included in case they change.

## License

[MIT](LICENSE) for the code. The question set was collected from publicly published material
and community contributions.
