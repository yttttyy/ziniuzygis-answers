/* Popup: просмотр и правка базы. Хранилище — chrome.storage.local. */
(function () {
  "use strict";

  var KEY = "qa_db_v1";
  var T = function (k, v) { return window.QAI18n.t(k, v); };
  var data = [];
  var query = "";

  var $ = function (s) { return document.querySelector(s); };
  var listEl = $("#list");
  var statsEl = $("#stats");
  var emptyEl = $("#emptyState");
  var overlay = $("#overlay");

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  var savedLang = null;

  function load() {
    var LK = window.QAI18n.STORAGE_KEY;
    return new Promise(function (resolve) {
      chrome.storage.local.get([KEY, LK], function (got) {
        data = Array.isArray(got[KEY]) ? got[KEY] : [];
        savedLang = got[LK] || null;
        resolve();
      });
    });
  }

  function save() {
    var patch = {};
    patch[KEY] = data;
    return new Promise(function (resolve) {
      chrome.storage.local.set(patch, resolve);
    });
  }

  /* ---------- отрисовка ---------- */

  function esc(s) {
    return (s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function hi(text, q) {
    var e = esc(text);
    if (!q) return e;
    var safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return e.replace(new RegExp("(" + safe + ")", "gi"), "<mark>$1</mark>");
  }

  /* Поиск без учёта литовской диакритики: "zaliosios" находит "žaliosios". */
  function norm(s) {
    return (window.QAMatch && window.QAMatch.normalize)
      ? window.QAMatch.normalize(s)
      : (s || "").toLowerCase();
  }

  function render() {
    var q = query.trim().toLowerCase();
    var rows = data;
    if (q) {
      var nq = norm(q);
      rows = rows.filter(function (r) {
        if ((r.q || "").toLowerCase().indexOf(q) >= 0) return true;
        if ((r.a || "").toLowerCase().indexOf(q) >= 0) return true;
        if (!nq) return false;
        return norm(r.q).indexOf(nq) >= 0 || norm(r.a).indexOf(nq) >= 0;
      });
    }

    statsEl.innerHTML = T("stats", { n: "<b>" + rows.length + "</b>", total: "<b>" + data.length + "</b>" });

    if (!rows.length) {
      listEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    // Ограничиваем отрисовку — popup не должен тормозить на 500+ карточках
    var LIMIT = 60;
    var shown = rows.slice(0, LIMIT);

    listEl.innerHTML = shown.map(function (r, i) {
      var empty = !r.a || !r.a.trim();
      return '<div class="card">' +
        '<div class="q"><span class="num">' + (i + 1) + '.</span><span>' + hi(r.q, q) + "</span></div>" +
        '<div class="a ' + (empty ? "empty" : "") + '">' +
          (empty ? T("no_answer") : hi(r.a, q)) + "</div>" +
        '<div class="actions">' +
          '<button class="iconbtn" data-copy="' + r.id + '">⧉ ' + T("copy") + '</button>' +
          '<button class="iconbtn" data-edit="' + r.id + '">✎ ' + T("edit") + '</button>' +
          '<button class="iconbtn del" data-del="' + r.id + '">🗑 ' + T("del") + '</button>' +
        "</div></div>";
    }).join("");

    if (rows.length > LIMIT) {
      var more = document.createElement("div");
      more.className = "empty-state";
      more.style.padding = "14px";
      more.textContent = T("more_hint", { n: rows.length - LIMIT });
      listEl.appendChild(more);
    }
  }

  /* ---------- модалка ---------- */

  function openModal(item) {
    $("#modalTitle").textContent = item ? T("modal_edit") : T("modal_add");
    $("#editId").value = item ? item.id : "";
    $("#qInput").value = item ? item.q : "";
    $("#aInput").value = item ? item.a : "";
    overlay.classList.add("show");
    setTimeout(function () { $("#qInput").focus(); }, 40);
  }

  function closeModal() { overlay.classList.remove("show"); }

  function saveModal() {
    var id = $("#editId").value;
    var q = $("#qInput").value.trim();
    var a = $("#aInput").value.trim();
    if (!q) { toast(T("t_enter_q")); $("#qInput").focus(); return; }

    if (id) {
      var r = data.filter(function (x) { return x.id === id; })[0];
      if (r) { r.q = q; r.a = a; }
      toast(T("t_updated"));
    } else {
      data.unshift({ id: uid(), q: q, a: a, source: "mine" });
      toast(T("t_added"));
    }
    save().then(function () { render(); });
    closeModal();
  }

  var toastT;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("show"); }, 1700);
  }

  /* ---------- сохранение в файл ---------- */

  function saveToFile() {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ziniuzygis-atsakymai.json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast(T("t_file_saved"));
  }

  /* ---------- импорт ---------- */

  /* Добавляет из файла только те вопросы, которых ещё нет (сравнение без диакритики).
     Ничего не удаляет и не перезаписывает. */
  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var arr;
      try {
        arr = JSON.parse(e.target.result);
      } catch (err) {
        toast(T("t_bad_file"));
        return;
      }
      if (!Array.isArray(arr)) { toast(T("t_bad_format")); return; }

      var have = {};
      data.forEach(function (r) { have[norm(r.q)] = true; });

      var added = 0;
      arr.forEach(function (x) {
        if (!x) return;
        // принимаем оба формата: внутренний {q,a} и публикуемый {question,answer}
        var q = typeof x.q === "string" ? x.q : (typeof x.question === "string" ? x.question : "");
        var a = typeof x.a === "string" ? x.a : (typeof x.answer === "string" ? x.answer : "");
        q = q.trim();
        if (!q) return;
        var k = norm(q);
        if (!k || have[k]) return;
        have[k] = true;
        data.push({ id: uid(), q: q, a: a.trim(), source: x.source || "imported" });
        added++;
      });

      if (!added) { toast(T("t_no_new")); return; }
      save().then(function () {
        render();
        toast(T("t_imported", { n: added }));
      });
    };
    reader.readAsText(file);
  }

  /* ---------- язык ---------- */

  /* Проставляет переводы в статическую разметку (плейсхолдеры, подписи, кнопки). */
  function applyStaticI18n() {
    $("#appTitle").textContent = T("app_title");
    $("#search").placeholder = T("search_ph");
    $("#clearSearch").title = T("clear");
    $("#addBtn").title = T("add");
    $("#saveFileBtn").title = T("save_file");
    $("#importBtn").title = T("import");
    $("#emptyState").textContent = T("nothing_found");
    $("#qLabel").textContent = T("question");
    $("#aLabel").textContent = T("answer");
    $("#qInput").placeholder = T("q_ph");
    $("#aInput").placeholder = T("a_ph");
    $("#cancelBtn").textContent = T("cancel");
    $("#saveBtn").textContent = T("save");
    $("#langSel").title = T("lang_label");
    document.documentElement.lang = window.QAI18n.getLang();
  }

  function setLanguage(lang, persist) {
    window.QAI18n.setLang(lang);
    $("#langSel").value = window.QAI18n.getLang();
    applyStaticI18n();
    render();
    if (persist) {
      var patch = {};
      patch[window.QAI18n.STORAGE_KEY] = window.QAI18n.getLang();
      chrome.storage.local.set(patch);
    }
  }

  /* ---------- события ---------- */

  $("#langSel").addEventListener("change", function (e) {
    setLanguage(e.target.value, true);
  });

  $("#search").addEventListener("input", function (e) {
    query = e.target.value;
    $("#clearSearch").style.display = query ? "block" : "none";
    render();
  });

  $("#clearSearch").addEventListener("click", function () {
    query = "";
    $("#search").value = "";
    $("#clearSearch").style.display = "none";
    setLanguage(savedLang || window.QAI18n.detect(), !savedLang);
    $("#search").focus();
  });

  listEl.addEventListener("click", function (e) {
    var ed = e.target.closest("[data-edit]");
    var dl = e.target.closest("[data-del]");
    var cp = e.target.closest("[data-copy]");

    if (ed) {
      openModal(data.filter(function (x) { return x.id === ed.dataset.edit; })[0]);
    }
    if (cp) {
      var r = data.filter(function (x) { return x.id === cp.dataset.copy; })[0];
      if (r) navigator.clipboard.writeText(r.a || r.q).then(function () { toast(T("t_copied")); });
    }
    if (dl) {
      if (confirm(T("confirm_delete"))) {
        data = data.filter(function (x) { return x.id !== dl.dataset.del; });
        save().then(function () { render(); });
        toast(T("t_deleted"));
      }
    }
  });

  $("#addBtn").addEventListener("click", function () { openModal(null); });
  $("#cancelBtn").addEventListener("click", closeModal);
  $("#saveBtn").addEventListener("click", saveModal);
  $("#saveFileBtn").addEventListener("click", saveToFile);
  $("#importBtn").addEventListener("click", function () { $("#importFile").click(); });
  $("#importFile").addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) importFile(e.target.files[0]);
    e.target.value = "";
  });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && overlay.classList.contains("show")) saveModal();
  });

  // если content-скрипт добавил вопрос — обновляем список
  chrome.storage.onChanged.addListener(function (ch, area) {
    if (area === "local" && ch[KEY]) {
      data = Array.isArray(ch[KEY].newValue) ? ch[KEY].newValue : data;
      render();
    }
  });

  /* ---------- старт ---------- */

  load().then(function () {
    // Подстраховка: если фон не успел засеять базу — делаем это здесь
    if (!data.length) {
      var s = document.createElement("script");
      s.src = "db.js";
      s.onload = function () {
        data = (window.QA_SEED || []).map(function (x) {
          return { id: uid(), q: x.q, a: x.a || "", source: "seed" };
        });
        save().then(function(){ setLanguage(savedLang || window.QAI18n.detect(), !savedLang); });
      };
      document.head.appendChild(s);
      return;
    }
    setLanguage(savedLang || window.QAI18n.detect(), !savedLang);
    $("#search").focus();
  });
})();
