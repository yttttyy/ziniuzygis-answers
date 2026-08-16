/* Content-скрипт для ziniuzygis.lt
   — следит за появлением вопроса (Vue SPA → MutationObserver),
   — ищет его в базе, подсвечивает верные варианты,
   — даёт скопировать вопрос и добавить новую пару «вопрос + ответ». */
(function () {
  "use strict";

  var KEY = "qa_db_v1";
  var HL = "qa-ext-correct";

  // Селекторы сайта (подтверждены по CSS-бандлу платформы Challenger)
  var SEL_QUESTION = ".challenge-question";
  var SEL_CONTENT = ".challenge-content";
  var SEL_OPTIONS = ".btn-challenge-answer, .answer-cell";

  var db = [];
  var T = function (k, v) { return window.QAI18n.t(k, v); };
  var lastQuestion = "";
  var highlighted = [];
  var pickedAnswers = [];
  var formOpen = false;
  var collapsed = false;
  var ui = null;

  /* ---------- утилиты ---------- */

  function txt(el) {
    if (!el) return "";
    return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallbackCopy.bind(null, text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* игнорируем */ }
    ta.remove();
  }

  /* ---------- хранилище ---------- */

  function loadDb() {
    var LK = window.QAI18n.STORAGE_KEY;
    return new Promise(function (resolve) {
      chrome.storage.local.get([KEY, LK], function (got) {
        db = Array.isArray(got[KEY]) ? got[KEY] : [];
        window.QAI18n.setLang(got[LK] || window.QAI18n.detect());
        resolve(db);
      });
    });
  }

  function addEntry(q, a) {
    return new Promise(function (resolve) {
      chrome.storage.local.get(KEY, function (got) {
        var arr = Array.isArray(got[KEY]) ? got[KEY] : [];
        arr.unshift({ id: uid(), q: q, a: a, source: "mine" });
        var patch = {};
        patch[KEY] = arr;
        chrome.storage.local.set(patch, function () { db = arr; resolve(arr); });
      });
    });
  }

  /* ---------- работа со страницей ---------- */

  function findQuestionEl() {
    var el = document.querySelector(SEL_QUESTION);
    if (el && txt(el)) return el;
    // запасной путь: первый непустой блок внутри контейнера задания
    var box = document.querySelector(SEL_CONTENT);
    if (box) {
      var cand = box.querySelector("h1, h2, h3, h4, p, div");
      if (cand && txt(cand).length > 15) return cand;
    }
    return null;
  }

  function collectOptions() {
    var scope = document.querySelector(SEL_CONTENT) || document;
    var nodes = scope.querySelectorAll(SEL_OPTIONS);
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var t = txt(nodes[i]);
      if (!t) t = (nodes[i].getAttribute("alt") || nodes[i].getAttribute("title") || "").trim();
      out.push({ el: nodes[i], text: t });
    }
    return out;
  }

  function clearHighlight() {
    highlighted.forEach(function (el) { el.classList.remove(HL); });
    highlighted = [];
  }

  /* Подсвечивает все варианты, соответствующие сохранённому ответу.
     Ответ может содержать несколько строк — тогда верных вариантов несколько. */
  function highlightAnswers(answer, options) {
    var parts = String(answer || "").split("\n")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
    if (!parts.length || !options.length) return 0;

    var used = [];
    parts.forEach(function (part) {
      var pool = options.filter(function (o) { return used.indexOf(o.el) < 0 && o.text; });
      if (!pool.length) return;
      var best = window.QAMatch.bestOption(part, pool);
      if (best) {
        used.push(best.option.el);
        if (!best.option.el.classList.contains(HL)) best.option.el.classList.add(HL);
        highlighted.push(best.option.el);
      }
    });
    return used.length;
  }

  /* ---------- панель (Shadow DOM, чтобы стили сайта не мешали) ---------- */

  var PANEL_CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}",
    ".wrap{position:fixed;right:18px;bottom:18px;width:360px;max-width:calc(100vw - 24px);",
    "background:#171c22;color:#e8edf2;border:1px solid #2a333d;border-radius:14px;",
    "box-shadow:0 10px 34px rgba(0,0,0,.45);z-index:2147483000;overflow:hidden;font-size:14px;line-height:1.45}",
    ".hd{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#11161c;border-bottom:1px solid #2a333d;cursor:pointer}",
    ".dot{width:9px;height:9px;border-radius:50%;background:#6b7683;flex:none}",
    ".dot.ok{background:#22c55e;box-shadow:0 0 8px #22c55e}",
    ".dot.no{background:#f97316;box-shadow:0 0 8px #f97316}",
    ".hd b{font-size:13px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".chev{color:#9aa7b4;font-size:12px}",
    ".bd{padding:12px}",
    ".lbl{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9aa7b4;font-weight:700;margin-bottom:5px}",
    ".q{color:#c7d2dd;font-size:13px;max-height:76px;overflow:auto;margin-bottom:10px}",
    ".ans{background:#1d242c;border-left:3px solid #22c55e;border-radius:8px;padding:9px 11px;",
    "color:#d6f5e0;font-weight:600;white-space:pre-wrap;word-break:break-word}",
    ".none{background:#1d242c;border-left:3px solid #f97316;border-radius:8px;padding:9px 11px;color:#f0a868;font-weight:600}",
    ".row{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}",
    "button{border:1px solid #2a333d;background:#1d242c;color:#e8edf2;padding:8px 11px;border-radius:9px;",
    "cursor:pointer;font-size:12.5px;font-weight:600}",
    "button:hover{border-color:#f97316}",
    "button.pri{background:#f97316;border-color:#f97316;color:#1a1206}",
    "button.pri:hover{background:#fb923c}",
    ".score{font-size:11px;color:#9aa7b4;margin-top:7px}",
    "textarea{width:100%;background:#1d242c;color:#e8edf2;border:1px solid #2a333d;border-radius:9px;",
    "padding:8px 10px;font-size:13px;font-family:inherit;resize:vertical;outline:none}",
    "textarea:focus{border-color:#f97316}",
    ".opts{display:flex;flex-direction:column;gap:5px;margin-top:6px;max-height:150px;overflow:auto}",
    ".opt{text-align:left;white-space:normal;font-weight:500;font-size:12.5px}",
    ".opt.on{background:#1f3a2a;border-color:#22c55e;color:#7fe0a5}",
    ".hint{font-size:11px;color:#6b7683;margin-top:6px}",
    ".toast{position:fixed;right:18px;bottom:calc(18px + 100%);}",
    ".mini{padding:0}"
  ].join("");

  function buildUI() {
    var host = document.createElement("div");
    host.id = "qa-ext-host";
    host.style.cssText = "all:initial";
    var root = host.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = PANEL_CSS;
    root.appendChild(style);

    var wrap = document.createElement("div");
    wrap.className = "wrap";
    wrap.innerHTML =
      '<div class="hd"><span class="dot"></span><b></b><span class="chev">▾</span></div>' +
      '<div class="bd"></div>';
    root.appendChild(wrap);
    document.documentElement.appendChild(host);

    var hd = wrap.querySelector(".hd");
    hd.addEventListener("click", function () {
      collapsed = !collapsed;
      render();
    });

    ui = {
      host: host, root: root, wrap: wrap,
      dot: wrap.querySelector(".dot"),
      title: wrap.querySelector("b"),
      chev: wrap.querySelector(".chev"),
      body: wrap.querySelector(".bd")
    };
    return ui;
  }

  function ensureUI() { return ui || buildUI(); }

  function hidePanel() { if (ui) ui.host.style.display = "none"; }
  function showPanel() { if (ui) ui.host.style.display = ""; }

  /* ---------- отрисовка панели ---------- */

  var state = { question: "", match: null, options: [], hlCount: 0 };

  function render() {
    var u = ensureUI();
    showPanel();
    u.chev.textContent = collapsed ? "▸" : "▾";
    u.body.style.display = collapsed ? "none" : "";

    // статус в шапке обновляем всегда — он виден и в свёрнутом виде
    var found = !!state.match;
    u.dot.className = "dot " + (found ? "ok" : "no");
    u.title.textContent = found ? T("panel_found") : T("panel_not_found");

    if (collapsed) return;
    if (formOpen) { renderForm(); return; }

    var parts = [];
    parts.push('<div class="lbl">' + T("panel_q_label") + '</div>');
    parts.push('<div class="q"></div>');

    if (found) {
      parts.push('<div class="lbl">' + T("panel_a_label") + '</div><div class="ans"></div>');
      parts.push('<div class="score"></div>');
      parts.push('<div class="row">' +
        '<button data-act="copyA" class="pri">' + T("btn_copy_answer") + '</button>' +
        '<button data-act="copyQ">' + T("btn_question") + '</button>' +
        '<button data-act="add">' + T("btn_fix") + '</button>' +
        "</div>");
    } else {
      parts.push('<div class="none">' + T("panel_not_in_db") + '</div>');
      parts.push('<div class="row">' +
        '<button data-act="add" class="pri">' + T("btn_add_db") + '</button>' +
        '<button data-act="copyQ">' + T("btn_copy_question") + '</button>' +
        "</div>");
    }

    u.body.innerHTML = parts.join("");
    u.body.querySelector(".q").textContent = state.question;

    if (found) {
      u.body.querySelector(".ans").textContent = state.match.entry.a || T("no_answer");
      var pct = Math.round(state.match.score * 100);
      var hl = state.hlCount
        ? T("panel_hl_count", { n: state.hlCount })
        : T("panel_hl_none");
      u.body.querySelector(".score").textContent = T("panel_match", { pct: pct, hl: hl });
    }

    bindActions();
  }

  function renderForm() {
    var u = ensureUI();
    u.body.innerHTML =
      '<div class="lbl">' + T("question") + '</div>' +
      '<textarea data-f="q" rows="3"></textarea>' +
      '<div class="lbl" style="margin-top:10px">' + T("answer") + '</div>' +
      '<textarea data-f="a" rows="2"></textarea>' +
      '<div class="hint">' + T("form_hint_click") + '</div>' +
      '<div class="opts"></div>' +
      '<div class="row">' +
      '<button data-act="save" class="pri">' + T("save") + '</button>' +
      '<button data-act="cancel">' + T("cancel") + '</button>' +
      "</div>";

    u.body.querySelector('[data-f="q"]').value = state.question;
    u.body.querySelector('[data-f="a"]').value = pickedAnswers.join("\n");

    var box = u.body.querySelector(".opts");
    if (!state.options.length) {
      box.innerHTML = '<div class="hint">' + T("form_no_options") + '</div>';
    } else {
      state.options.forEach(function (o, i) {
        if (!o.text) return;
        var b = document.createElement("button");
        b.className = "opt" + (pickedAnswers.indexOf(o.text) >= 0 ? " on" : "");
        b.textContent = o.text;
        b.dataset.opt = String(i);
        box.appendChild(b);
      });
    }
    bindActions();
  }

  function bindActions() {
    var u = ensureUI();
    u.body.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        onAction(b.dataset.act);
      });
    });
    u.body.querySelectorAll("[data-opt]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var o = state.options[Number(b.dataset.opt)];
        if (!o || !o.text) return;
        var at = pickedAnswers.indexOf(o.text);
        if (at >= 0) pickedAnswers.splice(at, 1); else pickedAnswers.push(o.text);
        // сохраняем то, что уже набрано руками
        var cur = u.body.querySelector('[data-f="a"]');
        if (cur) {
          var manual = cur.value.split("\n").filter(function (l) {
            return l.trim() && !state.options.some(function (x) { return x.text === l.trim(); });
          });
          pickedAnswers = manual.concat(pickedAnswers.filter(function (p) {
            return manual.indexOf(p) < 0;
          }));
        }
        renderForm();
      });
    });
  }

  function onAction(act) {
    var u = ensureUI();
    if (act === "copyQ") {
      copy(state.question).then(function () { flash(T("t_q_copied")); });
    } else if (act === "copyA") {
      copy(state.match ? state.match.entry.a : "").then(function () { flash(T("t_a_copied")); });
    } else if (act === "add") {
      pickedAnswers = state.match && state.match.entry.a
        ? state.match.entry.a.split("\n").filter(Boolean)
        : [];
      formOpen = true;
      render();
    } else if (act === "cancel") {
      formOpen = false;
      pickedAnswers = [];
      render();
    } else if (act === "save") {
      var q = u.body.querySelector('[data-f="q"]').value.trim();
      var a = u.body.querySelector('[data-f="a"]').value.trim();
      if (!q) { flash(T("t_enter_q")); return; }
      addEntry(q, a).then(function () {
        formOpen = false;
        pickedAnswers = [];
        lastQuestion = "";  // заставляем пересканировать и подсветить
        flash(T("t_added_db"));
        scan();
      });
    }
  }

  function flash(msg) {
    var u = ensureUI();
    u.title.textContent = msg;
    setTimeout(function () { if (!formOpen) render(); }, 1400);
  }

  /* ---------- основной цикл ---------- */

  function scan() {
    var qEl = findQuestionEl();
    if (!qEl) {
      lastQuestion = "";
      clearHighlight();
      hidePanel();
      return;
    }

    var qText = txt(qEl);
    if (!qText) return;

    var stillOk = highlighted.length && highlighted.every(function (el) { return el.isConnected; });
    if (qText === lastQuestion && (stillOk || !state.hlCount)) {
      if (!formOpen) showPanel();
      return;
    }

    lastQuestion = qText;
    clearHighlight();

    var options = collectOptions();
    var m = window.QAMatch.bestMatch(qText, db);
    var count = m ? highlightAnswers(m.entry.a, options) : 0;

    state = { question: qText, match: m, options: options, hlCount: count };
    if (!formOpen) render(); else renderForm();
  }

  /* Наблюдаем за SPA-перерисовками, игнорируя собственные изменения. */
  var timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(scan, 250);
  }

  function startObserver() {
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        if (t && t.nodeType === 1 && t.closest && t.closest("#qa-ext-host")) continue;
        schedule();
        return;
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  chrome.storage.onChanged.addListener(function (ch, area) {
    if (area !== "local") return;
    if (ch[KEY]) {
      db = Array.isArray(ch[KEY].newValue) ? ch[KEY].newValue : db;
      lastQuestion = "";
      schedule();
    }
    // смена языка в окне базы — перерисовываем панель сразу
    if (ch[window.QAI18n.STORAGE_KEY]) {
      window.QAI18n.setLang(ch[window.QAI18n.STORAGE_KEY].newValue);
      if (ui) render();
    }
  });

  loadDb().then(function () {
    startObserver();
    scan();
  });
})();
