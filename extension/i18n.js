/* Переводы интерфейса: RU / EN / LT.
   Используется и popup, и панелью на странице викторины. */
(function (root) {
  "use strict";

  var STRINGS = {
    ru: {
      app_title: "База ответов",
      search_ph: "Поиск по вопросу или ответу…",
      clear: "Очистить",
      add: "Добавить вопрос",
      save_file: "Сохранить базу в файл",
      import: "Загрузить вопросы из JSON-файла",
      stats: "Показано {n} из {total} вопросов",
      nothing_found: "Ничего не найдено 🤷",
      no_answer: "— ответ не заполнен —",
      copy: "Копировать",
      edit: "Изменить",
      del: "Удалить",
      more_hint: "…ещё {n}. Уточните поиск.",
      modal_add: "Добавить вопрос",
      modal_edit: "Изменить вопрос",
      question: "Вопрос",
      answer: "Ответ",
      q_ph: "Введите вопрос…",
      a_ph: "Введите правильный ответ…",
      cancel: "Отмена",
      save: "Сохранить",
      confirm_delete: "Удалить этот вопрос?",
      t_enter_q: "Введите вопрос",
      t_updated: "Обновлено ✓",
      t_added: "Добавлено ✓",
      t_copied: "Скопировано ✓",
      t_deleted: "Удалено",
      t_file_saved: "Файл сохранён ✓",
      t_bad_file: "Неверный файл",
      t_bad_format: "Неверный формат",
      t_no_new: "Новых вопросов нет",
      t_imported: "Добавлено: {n} ✓",
      panel_found: "Ответ найден",
      panel_not_found: "Вопроса нет в базе",
      panel_q_label: "Вопрос на странице",
      panel_a_label: "Ответ",
      panel_not_in_db: "Ответ не найден в базе",
      panel_match: "совпадение {pct}% · {hl}",
      panel_hl_count: "подсвечено вариантов: {n}",
      panel_hl_none: "вариант на странице не распознан",
      btn_copy_answer: "⧉ Копировать ответ",
      btn_question: "⧉ Вопрос",
      btn_fix: "✎ Исправить",
      btn_add_db: "＋ Добавить в базу",
      btn_copy_question: "⧉ Копировать вопрос",
      form_hint_click: "Кликните по варианту со страницы — он попадёт в ответ.",
      form_no_options: "Вариантов на странице не найдено — впишите ответ вручную.",
      t_q_copied: "Вопрос скопирован",
      t_a_copied: "Ответ скопирован",
      t_added_db: "Добавлено в базу ✓",
      lang_label: "Язык"
    },

    en: {
      app_title: "Answer base",
      search_ph: "Search by question or answer…",
      clear: "Clear",
      add: "Add question",
      save_file: "Save database to file",
      import: "Load questions from a JSON file",
      stats: "Showing {n} of {total} questions",
      nothing_found: "Nothing found 🤷",
      no_answer: "— no answer saved —",
      copy: "Copy",
      edit: "Edit",
      del: "Delete",
      more_hint: "…{n} more. Refine your search.",
      modal_add: "Add question",
      modal_edit: "Edit question",
      question: "Question",
      answer: "Answer",
      q_ph: "Enter the question…",
      a_ph: "Enter the correct answer…",
      cancel: "Cancel",
      save: "Save",
      confirm_delete: "Delete this question?",
      t_enter_q: "Enter a question",
      t_updated: "Updated ✓",
      t_added: "Added ✓",
      t_copied: "Copied ✓",
      t_deleted: "Deleted",
      t_file_saved: "File saved ✓",
      t_bad_file: "Invalid file",
      t_bad_format: "Invalid format",
      t_no_new: "No new questions",
      t_imported: "Added: {n} ✓",
      panel_found: "Answer found",
      panel_not_found: "Not in the database",
      panel_q_label: "Question on the page",
      panel_a_label: "Answer",
      panel_not_in_db: "No answer found in the database",
      panel_match: "match {pct}% · {hl}",
      panel_hl_count: "options highlighted: {n}",
      panel_hl_none: "option not recognised on the page",
      btn_copy_answer: "⧉ Copy answer",
      btn_question: "⧉ Question",
      btn_fix: "✎ Fix",
      btn_add_db: "＋ Add to database",
      btn_copy_question: "⧉ Copy question",
      form_hint_click: "Click an option on the page — it goes into the answer.",
      form_no_options: "No options found on the page — type the answer manually.",
      t_q_copied: "Question copied",
      t_a_copied: "Answer copied",
      t_added_db: "Added to the database ✓",
      lang_label: "Language"
    },

    lt: {
      app_title: "Atsakymų bazė",
      search_ph: "Ieškoti pagal klausimą ar atsakymą…",
      clear: "Išvalyti",
      add: "Pridėti klausimą",
      save_file: "Išsaugoti bazę į failą",
      import: "Įkelti klausimus iš JSON failo",
      stats: "Rodoma {n} iš {total} klausimų",
      nothing_found: "Nieko nerasta 🤷",
      no_answer: "— atsakymas neįrašytas —",
      copy: "Kopijuoti",
      edit: "Redaguoti",
      del: "Ištrinti",
      more_hint: "…dar {n}. Patikslinkite paiešką.",
      modal_add: "Pridėti klausimą",
      modal_edit: "Redaguoti klausimą",
      question: "Klausimas",
      answer: "Atsakymas",
      q_ph: "Įrašykite klausimą…",
      a_ph: "Įrašykite teisingą atsakymą…",
      cancel: "Atšaukti",
      save: "Išsaugoti",
      confirm_delete: "Ištrinti šį klausimą?",
      t_enter_q: "Įrašykite klausimą",
      t_updated: "Atnaujinta ✓",
      t_added: "Pridėta ✓",
      t_copied: "Nukopijuota ✓",
      t_deleted: "Ištrinta",
      t_file_saved: "Failas išsaugotas ✓",
      t_bad_file: "Netinkamas failas",
      t_bad_format: "Netinkamas formatas",
      t_no_new: "Naujų klausimų nėra",
      t_imported: "Pridėta: {n} ✓",
      panel_found: "Atsakymas rastas",
      panel_not_found: "Klausimo bazėje nėra",
      panel_q_label: "Klausimas puslapyje",
      panel_a_label: "Atsakymas",
      panel_not_in_db: "Atsakymo bazėje nerasta",
      panel_match: "atitikmuo {pct}% · {hl}",
      panel_hl_count: "pažymėta variantų: {n}",
      panel_hl_none: "variantas puslapyje neatpažintas",
      btn_copy_answer: "⧉ Kopijuoti atsakymą",
      btn_question: "⧉ Klausimas",
      btn_fix: "✎ Taisyti",
      btn_add_db: "＋ Pridėti į bazę",
      btn_copy_question: "⧉ Kopijuoti klausimą",
      form_hint_click: "Spustelėkite variantą puslapyje — jis pateks į atsakymą.",
      form_no_options: "Puslapyje variantų nerasta — įrašykite atsakymą ranka.",
      t_q_copied: "Klausimas nukopijuotas",
      t_a_copied: "Atsakymas nukopijuotas",
      t_added_db: "Pridėta į bazę ✓",
      lang_label: "Kalba"
    }
  };

  var LANGS = ["ru", "en", "lt"];
  var LANG_NAMES = { ru: "Русский", en: "English", lt: "Lietuvių" };
  var current = "ru";

  function detect() {
    var l = String((typeof navigator !== "undefined" && navigator.language) || "en").toLowerCase();
    if (l.indexOf("lt") === 0) return "lt";
    if (l.indexOf("ru") === 0) return "ru";
    return "en";
  }

  function setLang(l) {
    current = STRINGS[l] ? l : "en";
    return current;
  }

  function getLang() { return current; }

  function t(key, vars) {
    var s = (STRINGS[current] && STRINGS[current][key]) || STRINGS.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  root.QAI18n = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    detect: detect,
    langs: LANGS,
    names: LANG_NAMES,
    STORAGE_KEY: "qa_lang"
  };
})(typeof window !== "undefined" ? window : self);
