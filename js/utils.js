/* 공통 유틸 — 외부 라이브러리 없이 동작 */
'use strict';

var Utils = (function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
        else if (k === 'dataset') Object.keys(attrs[k]).forEach(function (d) { node.dataset[d] = attrs[k][d]; });
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) node.innerHTML = html;
    return node;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(s) { return escapeHtml(s).replace(/\n/g, '&#10;'); }

  function num(n) {
    if (n == null || n === '' || isNaN(n)) return '0';
    return Number(n).toLocaleString('ko-KR');
  }

  function pct(v, digits) {
    if (!isFinite(v)) return '—';
    return (v * 100).toFixed(digits == null ? 1 : digits) + '%';
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
    };
  }

  function copyText(text) {
    var done = function (ok) { return ok; };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return fallback(text); });
    }
    return Promise.resolve(fallback(text));

    function fallback(t) {
      try {
        var ta = document.createElement('textarea');
        ta.value = t;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, t.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    }
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1500);
  }

  function downloadText(text, filename, mime) {
    downloadBlob(new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' }), filename);
  }

  function safeName(s) {
    return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'dangoal';
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function todayISO() { return isoDate(new Date()); }

  /* 해당 주의 월요일 (월요일 시작 주간) */
  function mondayOf(dateLike) {
    var d = dateLike ? new Date(dateLike + 'T00:00:00') : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var day = d.getDay(); // 0=일
    var diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return isoDate(d);
  }

  function addDaysISO(iso, days) {
    var d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return isoDate(d);
  }

  function formatWeek(iso) {
    if (!iso) return '—';
    var start = new Date(iso + 'T00:00:00');
    var end = new Date(addDaysISO(iso, 6) + 'T00:00:00');
    return (start.getMonth() + 1) + '/' + start.getDate() + '~' + (end.getMonth() + 1) + '/' + end.getDate();
  }

  function formatDateKo(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  function formatDateTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /* CSV */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCSV(rows, headers) {
    var lines = [];
    if (headers) lines.push(headers.map(csvCell).join(','));
    rows.forEach(function (r) { lines.push(r.map(csvCell).join(',')); });
    return '\ufeff' + lines.join('\r\n');
  }

  function parseCSV(text) {
    var rows = [], row = [], cur = '', inQ = false;
    text = String(text).replace(/^\ufeff/, '');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; }
          else inQ = false;
        } else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (c === '\r') { /* skip */ }
        else cur += c;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }

  function interpolate(tpl, vars) {
    return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null && vars[k] !== '' ? vars[k] : m; });
  }

  function toast(message, kind) {
    var box = document.getElementById('toast');
    if (!box) return;
    box.textContent = message;
    box.className = 'toast is-visible' + (kind ? ' toast-' + kind : '');
    clearTimeout(box._timer);
    box._timer = setTimeout(function () { box.className = 'toast'; }, 2600);
  }

  return {
    $: $, $$: $$, el: el, escapeHtml: escapeHtml, escapeAttr: escapeAttr,
    num: num, pct: pct, clamp: clamp, uid: uid, debounce: debounce,
    copyText: copyText, downloadBlob: downloadBlob, downloadText: downloadText,
    safeName: safeName, isoDate: isoDate, todayISO: todayISO, mondayOf: mondayOf,
    addDaysISO: addDaysISO, formatWeek: formatWeek, formatDateKo: formatDateKo,
    formatDateTime: formatDateTime, toCSV: toCSV, parseCSV: parseCSV,
    mulberry32: mulberry32, pick: pick, interpolate: interpolate, toast: toast
  };
})();
