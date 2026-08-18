/* Глушит звук викторины.
   Работает в MAIN-мире страницы: из изолированного мира content-скрипта
   пропатчить window.Audio / AudioContext нельзя — у страницы свои глобалы.
   Запускается на document_start, до кода сайта.

   Выключатель — атрибут data-qa-mute на <html>, его выставляет content.js
   (DOM у миров общий, в отличие от JS-глобалов). */
(function () {
  "use strict";

  function muteOn() {
    return document.documentElement.getAttribute("data-qa-mute") !== "0";
  }

  function silence(el) {
    if (!el || !muteOn()) return;
    try { el.muted = true; el.volume = 0; } catch (e) { /* не наше дело */ }
  }

  /* 1. <audio>/<video> — в том числе не вставленные в DOM */
  var proto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
  if (proto) {
    var origPlay = proto.play;
    proto.play = function () {
      silence(this);
      return origPlay.apply(this, arguments);
    };

    // сайт может выставлять volume уже после play — перехватываем и это
    var volDesc = Object.getOwnPropertyDescriptor(proto, "volume");
    if (volDesc && volDesc.set) {
      Object.defineProperty(proto, "volume", {
        get: volDesc.get,
        set: function (v) { volDesc.set.call(this, muteOn() ? 0 : v); },
        configurable: true
      });
    }
  }

  /* 2. new Audio(...) — типичный способ проиграть короткий звук */
  if (window.Audio) {
    var OrigAudio = window.Audio;
    function PatchedAudio() {
      var a = new (Function.prototype.bind.apply(OrigAudio, [null].concat([].slice.call(arguments))))();
      silence(a);
      return a;
    }
    PatchedAudio.prototype = OrigAudio.prototype;
    window.Audio = PatchedAudio;
  }

  /* 3. WebAudio — звук мимо media-элементов */
  ["AudioContext", "webkitAudioContext"].forEach(function (name) {
    var Ctx = window[name];
    if (!Ctx) return;
    function PatchedCtx() {
      var ctx = new (Function.prototype.bind.apply(Ctx, [null].concat([].slice.call(arguments))))();
      if (muteOn() && ctx.suspend) { try { ctx.suspend(); } catch (e) { /* ignore */ } }
      return ctx;
    }
    PatchedCtx.prototype = Ctx.prototype;
    window[name] = PatchedCtx;
  });

  /* 4. Подчищаем уже созданные элементы и всё, что появится позже */
  function sweep() {
    if (!muteOn()) return;
    var nodes = document.querySelectorAll("audio, video");
    for (var i = 0; i < nodes.length; i++) silence(nodes[i]);
  }

  if (document.documentElement) {
    new MutationObserver(sweep).observe(document.documentElement, {
      childList: true, subtree: true
    });
  }
  document.addEventListener("DOMContentLoaded", sweep);
  sweep();
})();
