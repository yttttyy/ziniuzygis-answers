/* Сохраняет оригинальный (литовский) текст вопроса и вариантов ответа.

   Зачем: если включить переводчик страницы, он переписывает текст прямо в DOM,
   и расширение начинает видеть перевод - вопрос перестаёт совпадать с базой,
   а варианты с сохранённым ответом.

   Как: запускаемся на document_start и при каждой перерисовке складываем текст
   в data-qa-orig. Атрибуты data-* переводчик не трогает, поэтому оригинал
   переживает перевод.

   Ключевая деталь - когда обновлять сохранённое. Vue переиспользует узлы под
   новые вопросы, поэтому просто «записать один раз» нельзя: на следующем
   вопросе останется старый текст. Но и перезаписывать вслепую нельзя - затрём
   оригинал переводом. Поэтому обновляем только пока элемент ещё не переведён.
   Google Translate оборачивает переведённый текст в <font>, это и есть признак. */
(function () {
  "use strict";

  var SEL = ".challenge-question, .btn-challenge-answer, .answer-cell, .checkbox, .radio";
  var ATTR = "data-qa-orig";

  function isTranslated(el) {
    return !!el.querySelector("font");
  }

  function textOf(el) {
    return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function stashAll() {
    var nodes;
    try { nodes = document.querySelectorAll(SEL); }
    catch (e) { return; }

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // уже переведён - оставляем то, что успели сохранить раньше
      if (isTranslated(el)) continue;
      var t = textOf(el);
      if (t && el.getAttribute(ATTR) !== t) el.setAttribute(ATTR, t);
    }
  }

  // Без задержки: надо успеть раньше переводчика, он работает асинхронно.
  // Наблюдаем только за содержимым; собственные записи идут в атрибуты,
  // которые мы не слушаем, так что зацикливания нет.
  function start() {
    stashAll();
    new MutationObserver(stashAll).observe(document.documentElement, {
      childList: true, subtree: true, characterData: true
    });
  }

  if (document.documentElement) start();
  else document.addEventListener("readystatechange", start, { once: true });
})();
