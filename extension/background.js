/* Service worker: заполнение базы при установке и мягкое доливание
   новых вопросов из db.js при обновлении расширения. */
importScripts("match.js", "db.js");

var KEY = "qa_db_v1";
var SEED_VER_KEY = "qa_seed_ver";
var SEED_VERSION = 2; // поднимать при изменении db.js

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function norm(s) {
  return self.QAMatch ? self.QAMatch.normalize(s) : String(s || "").toLowerCase();
}

async function syncSeed() {
  var got = await chrome.storage.local.get([KEY, SEED_VER_KEY]);
  var cur = Array.isArray(got[KEY]) ? got[KEY] : null;
  var seed = self.QA_SEED || [];

  // Первая установка — просто засеиваем
  if (!cur || !cur.length) {
    var fresh = seed.map(function (x) {
      return { id: uid(), q: x.q, a: x.a || "", source: "seed" };
    });
    var p0 = {};
    p0[KEY] = fresh;
    p0[SEED_VER_KEY] = SEED_VERSION;
    await chrome.storage.local.set(p0);
    return;
  }

  // База уже есть — доливаем только те вопросы, которых в ней нет.
  // Всё, что добавил пользователь, остаётся нетронутым.
  if (got[SEED_VER_KEY] === SEED_VERSION) return;

  var have = new Set(cur.map(function (r) { return norm(r.q); }));
  var add = [];
  seed.forEach(function (x) {
    var k = norm(x.q);
    if (k && !have.has(k)) {
      have.add(k);
      add.push({ id: uid(), q: x.q, a: x.a || "", source: "seed" });
    }
  });

  var patch = {};
  patch[KEY] = add.length ? cur.concat(add) : cur;
  patch[SEED_VER_KEY] = SEED_VERSION;
  await chrome.storage.local.set(patch);
}

chrome.runtime.onInstalled.addListener(syncSeed);
chrome.runtime.onStartup.addListener(syncSeed);
