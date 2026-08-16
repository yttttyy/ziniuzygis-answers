/* Нечёткое сопоставление текста.
   Используется и content-скриптом (вопрос на странице ↔ база),
   и popup (поиск). Общий файл, чтобы логика не разъезжалась. */
(function (root) {
  "use strict";

  // U+0300..U+036F — комбинируемые диакритические знаки
  var COMBINING = new RegExp("[\\u0300-\\u036f]", "g");

  var LT_MAP = {
    "ą": "a", "č": "c", "ę": "e", "ė": "e", "į": "i",
    "š": "s", "ų": "u", "ū": "u", "ž": "z"
  };

  // Служебные слова викторины — не несут смысла при сравнении
  var STOP = new Set([
    "kas", "kaip", "kur", "kada", "kodel", "kiek", "koks", "kokia", "kokie", "kokios",
    "kuris", "kuri", "kurie", "kurios", "yra", "buti", "tai", "bet", "arba", "kad",
    "the", "and", "for", "atsakyk", "pagalvok", "ir", "apie", "savo", "tavo", "gali",
    "nezinai", "atsakyma", "rasi", "cia", "pasirink", "irasyk", "pazymek"
  ]);

  function normalize(s) {
    if (!s) return "";
    var out = String(s).toLowerCase();
    out = out.replace(/[ąčęėįšųūž]/g, function (c) { return LT_MAP[c] || c; });
    // диакритика прочих языков
    out = out.normalize("NFD").replace(COMBINING, "");
    out = out.replace(/[«»„“”"'`’‘]/g, " ");
    out = out.replace(/[^a-z0-9%]+/g, " ");
    return out.replace(/\s+/g, " ").trim();
  }

  function tokens(s) {
    var n = normalize(s);
    if (!n) return [];
    return n.split(" ").filter(function (t) {
      if (!t) return false;
      if (/^\d+%?$/.test(t)) return true;   // числа значимы: "15", "2035", "44%"
      return t.length >= 3 && !STOP.has(t);
    });
  }

  /* Коэффициент Дайса по множествам токенов + бонус за вхождение подстроки.
     Возвращает 0..1 */
  function score(a, b) {
    var na = normalize(a), nb = normalize(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;

    var ta = new Set(tokens(a));
    var tb = new Set(tokens(b));
    if (!ta.size || !tb.size) return 0;

    var inter = 0;
    ta.forEach(function (t) { if (tb.has(t)) inter++; });
    var dice = (2 * inter) / (ta.size + tb.size);

    // Вопрос на странице может быть длиннее/короче записи в базе —
    // учитываем, насколько полно меньшее множество покрыто большим.
    var coverage = inter / Math.min(ta.size, tb.size);

    var bonus = 0;
    if (na.length > 12 && (na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0)) bonus = 0.25;

    return Math.min(1, Math.max(dice, coverage * 0.85) + bonus);
  }

  /* Лучшее совпадение из списка записей базы.
     items: [{q, a, ...}]  → {entry, score, index} | null */
  function bestMatch(text, items, threshold) {
    var th = typeof threshold === "number" ? threshold : 0.5;
    var best = null;
    for (var i = 0; i < items.length; i++) {
      var s = score(text, items[i].q);
      if (!best || s > best.score) best = { entry: items[i], score: s, index: i };
    }
    if (best && best.score >= th) return best;
    return null;
  }

  /* Лучший из вариантов на странице для сохранённого ответа.
     options: [{el, text}] → {option, score} | null */
  function bestOption(answerText, options, threshold) {
    var th = typeof threshold === "number" ? threshold : 0.45;
    var best = null;
    for (var i = 0; i < options.length; i++) {
      var s = score(answerText, options[i].text);
      if (!best || s > best.score) best = { option: options[i], score: s };
    }
    if (best && best.score >= th) return best;
    return null;
  }

  root.QAMatch = {
    normalize: normalize,
    tokens: tokens,
    score: score,
    bestMatch: bestMatch,
    bestOption: bestOption
  };
})(typeof window !== "undefined" ? window : self);
