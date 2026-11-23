/* 저장소 — localStorage + 선택적 PIN 암호화(AES-GCM) + JSON 내보내기/가져오기
   - 잠금을 켜면 모든 데이터(리드·지표·발신자 정보)는 암호문으로만 저장됩니다.
   - PIN은 저장되지 않으며, PBKDF2 키 유도에만 쓰입니다.
   - 데이터는 이 브라우저 밖으로 전송되지 않습니다. */
'use strict';

var Store = (function () {
  var KEY = 'dangoal.mkt.v2';
  var ENC_KEY = 'dangoal.mkt.v2.enc';
  var LEGACY_KEY = 'dangoal.mkt.v1';
  var VERSION = 2;

  var memoryFallback = null;
  var queue = Promise.resolve();
  var session = { key: null, salt: null, iterations: null };
  var locked = false;
  var encrypted = false;

  function defaults() {
    return {
      version: VERSION,
      leads: [],
      metrics: [],
      prefs: {
        targetId: 'store',
        segmentId: 'cafe',
        tone: 'formal',
        cardTargetId: 'store',
        landingTargetId: 'store',
        landingConcept: 'newmenu',
        metricChannel: 'instagram',
        profile: {
          senderName: '',
          phone: '',
          email: '',
          company: '다정',
          applyUrl: 'https://dangoal.com/apply'
        }
      }
    };
  }

  var state = defaults();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function storageAvailable() {
    try {
      var t = '__dangoal_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- 정규화·살균 (가져오기/저장 데이터를 신뢰하지 않음) ---------------- */
  function text(v, max) {
    if (v == null) return '';
    return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
  }
  function num(v) {
    var n = parseInt(v, 10);
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(n, 1000000000);
  }
  function dateOrNow(v) {
    if (v && !isNaN(new Date(v).getTime())) return new Date(v).toISOString();
    return new Date().toISOString();
  }
  function isoDay(v) {
    var s = text(v, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  }
  function oneOf(v, list, fallback) {
    return list.indexOf(v) > -1 ? v : fallback;
  }

  var TARGET_IDS = ['store', 'chain', 'event'];
  var TONE_IDS = ['formal', 'brief', 'numbers', 'casual'];
  var STATUS_IDS = ['draft', 'sent', 'replied', 'meeting'];
  var CHANNEL_IDS = ['instagram', 'blog', 'coldmail', 'other'];

  function sanitizeLead(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = text(raw.name, 200).trim();
    if (!name) return null;
    return {
      id: Utils.uid('lead'),
      name: name,
      targetId: oneOf(raw.targetId, TARGET_IDS, 'store'),
      segmentId: text(raw.segmentId, 60),
      industry: text(raw.industry, 80),
      region: text(raw.region, 80),
      contactName: text(raw.contactName, 80),
      email: text(raw.email, 200),
      subject: text(raw.subject, 300),
      body: text(raw.body, 20000),
      tone: oneOf(raw.tone, TONE_IDS, 'formal'),
      hookId: text(raw.hookId, 60),
      challenge: text(raw.challenge, 200),
      status: oneOf(raw.status, STATUS_IDS, 'draft'),
      note: text(raw.note, 1000),
      createdAt: dateOrNow(raw.createdAt),
      updatedAt: dateOrNow(raw.updatedAt)
    };
  }

  function sanitizeMetric(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var week = isoDay(raw.week);
    if (!week) return null;
    return {
      id: Utils.uid('m'),
      week: week,
      channel: oneOf(raw.channel, CHANNEL_IDS, 'other'),
      impressions: num(raw.impressions),
      clicks: num(raw.clicks),
      inquiries: num(raw.inquiries),
      conversions: num(raw.conversions),
      note: text(raw.note, 500),
      updatedAt: dateOrNow(raw.updatedAt)
    };
  }

  function sanitizeProfile(raw) {
    var p = defaults().prefs.profile;
    if (!raw || typeof raw !== 'object') return p;
    return {
      senderName: text(raw.senderName, 60),
      phone: text(raw.phone, 30),
      email: text(raw.email, 200),
      company: text(raw.company, 80) || p.company,
      applyUrl: /^https:\/\/[^\s"'<>]+$/.test(text(raw.applyUrl, 300)) ? text(raw.applyUrl, 300) : p.applyUrl
    };
  }

  function sanitizePrefs(raw, base) {
    var out = base || defaults().prefs;
    if (!raw || typeof raw !== 'object') return out;
    return {
      targetId: oneOf(raw.targetId, TARGET_IDS, out.targetId),
      segmentId: text(raw.segmentId, 60) || out.segmentId,
      tone: oneOf(raw.tone, TONE_IDS, out.tone),
      cardTargetId: oneOf(raw.cardTargetId, TARGET_IDS, out.cardTargetId),
      landingTargetId: oneOf(raw.landingTargetId, TARGET_IDS, out.landingTargetId),
      landingConcept: text(raw.landingConcept, 40) || out.landingConcept,
      metricChannel: oneOf(raw.metricChannel, CHANNEL_IDS, out.metricChannel),
      profile: sanitizeProfile(raw.profile)
    };
  }

  function normalize(raw) {
    var out = defaults();
    if (!raw || typeof raw !== 'object') return out;
    if (Array.isArray(raw.leads)) {
      out.leads = raw.leads.slice(0, 2000).map(sanitizeLead).filter(Boolean);
    }
    if (Array.isArray(raw.metrics)) {
      out.metrics = raw.metrics.slice(0, 5000).map(sanitizeMetric).filter(Boolean);
    }
    out.prefs = sanitizePrefs(raw.prefs, out.prefs);
    return out;
  }

  /* ---------------- init / load ---------------- */
  function readLS(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeLS(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function removeLS(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  async function init() {
    if (!storageAvailable()) {
      memoryFallback = clone(state);
      return { locked: false, encrypted: false, storage: false };
    }
    var encRaw = readLS(ENC_KEY);
    if (encRaw) {
      locked = true;
      encrypted = true;
      return { locked: true, encrypted: true, storage: true };
    }
    var legacy = readLS(LEGACY_KEY);
    if (legacy && !readLS(KEY)) {
      writeLS(KEY, legacy);
      removeLS(LEGACY_KEY);
    }
    try {
      var raw = readLS(KEY);
      if (raw) state = normalize(JSON.parse(raw));
    } catch (e) {
      console.warn('저장된 데이터를 읽지 못했습니다.', e);
    }
    locked = false;
    encrypted = false;
    return { locked: false, encrypted: false, storage: true };
  }

  /* ---------------- persist ---------------- */
  async function persist() {
    if (locked) return false;
    if (!storageAvailable()) { memoryFallback = clone(state); return true; }
    var snapshot = clone(state);
    if (session.key) {
      var envelope = await CryptoBox.encryptWithKey(snapshot, session.key, {
        salt: session.salt, iterations: session.iterations
      });
      writeLS(ENC_KEY, JSON.stringify(envelope));
      removeLS(KEY);
    } else {
      writeLS(KEY, JSON.stringify(snapshot));
    }
    return true;
  }

  function save() {
    queue = queue.then(function () { return persist(); }).catch(function (err) {
      console.warn('저장에 실패했습니다.', err);
      return false;
    });
    return queue;
  }

  /* ---------------- 잠금 ---------------- */
  function isLocked() { return locked; }
  function isEncrypted() { return encrypted || !!readLS(ENC_KEY); }
  function cryptoReady() { return CryptoBox.available(); }

  function checkPin(pin) {
    var s = String(pin == null ? '' : pin);
    if (s.length < 4) throw new Error('PIN은 4자리 이상이어야 합니다.');
    if (s.length > 64) throw new Error('PIN이 너무 깁니다.');
    return s;
  }

  async function unlock(pin) {
    if (!storageAvailable()) throw new Error('이 브라우저에서는 저장소를 쓸 수 없습니다.');
    var raw = readLS(ENC_KEY);
    if (!raw) throw new Error('암호화된 데이터가 없습니다.');
    await queue.catch(function () {});
    var envelope;
    try { envelope = JSON.parse(raw); } catch (e) { throw new Error('암호화 데이터가 손상되었습니다.'); }
    var res = await CryptoBox.decrypt(envelope, String(pin || ''));
    state = normalize(res.data);
    session = { key: res.key, salt: res.salt, iterations: res.iterations };
    locked = false;
    encrypted = true;
    await save();
    return true;
  }

  async function enableLock(pin) {
    if (!CryptoBox.available()) throw new Error('이 브라우저에서는 암호화를 지원하지 않습니다. HTTPS에서 사용해 주세요.');
    var clean = checkPin(pin);
    await queue.catch(function () {});
    var res = await CryptoBox.encryptNew(state, clean);
    session = { key: res.key, salt: res.salt, iterations: res.iterations };
    encrypted = true;
    locked = false;
    writeLS(ENC_KEY, JSON.stringify(res.envelope));
    removeLS(KEY);
    return true;
  }

  async function changePin(currentPin, nextPin) {
    if (!CryptoBox.available()) throw new Error('이 브라우저에서는 암호화를 지원하지 않습니다.');
    var next = checkPin(nextPin);
    await queue.catch(function () {});
    var raw = readLS(ENC_KEY);
    if (!raw) throw new Error('암호화된 데이터가 없습니다.');
    var res = await CryptoBox.decrypt(JSON.parse(raw), String(currentPin || ''));
    state = normalize(res.data);
    var out = await CryptoBox.encryptNew(state, next);
    session = { key: out.key, salt: out.salt, iterations: out.iterations };
    encrypted = true;
    locked = false;
    writeLS(ENC_KEY, JSON.stringify(out.envelope));
    removeLS(KEY);
    return true;
  }

  async function disableLock(currentPin) {
    await queue.catch(function () {});
    var raw = readLS(ENC_KEY);
    if (!raw) throw new Error('암호화된 데이터가 없습니다.');
    var res = await CryptoBox.decrypt(JSON.parse(raw), String(currentPin || ''));
    state = normalize(res.data);
    session = { key: null, salt: null, iterations: null };
    encrypted = false;
    locked = false;
    writeLS(KEY, JSON.stringify(state));
    removeLS(ENC_KEY);
    return true;
  }

  function lockNow() {
    if (!encrypted) return false;
    locked = true;
    state = defaults();
    session = { key: null, salt: null, iterations: null };
    return true;
  }

  function wipeAll() {
    removeLS(KEY);
    removeLS(ENC_KEY);
    removeLS(LEGACY_KEY);
    memoryFallback = null;
    state = defaults();
    session = { key: null, salt: null, iterations: null };
    locked = false;
    encrypted = false;
  }

  /* ---------------- 리드 ---------------- */
  function get() { return state; }
  function prefs() { return state.prefs; }
  function profile() { return state.prefs.profile; }
  function setPref(key, value) {
    if (Object.prototype.hasOwnProperty.call(state.prefs, key) && key !== 'profile') {
      state.prefs[key] = value;
      save();
    }
  }
  function updateProfile(patch) {
    state.prefs.profile = sanitizeProfile(Object.assign({}, state.prefs.profile, patch));
    save();
    return state.prefs.profile;
  }
  function hasProfile() {
    var p = state.prefs.profile;
    return !!(p.senderName || p.phone || p.email);
  }

  function leads() { return state.leads.slice(); }

  function addLead(data) {
    var now = new Date().toISOString();
    var lead = sanitizeLead(Object.assign({
      name: '', targetId: 'store', segmentId: '', industry: '', region: '',
      contactName: '', email: '', subject: '', body: '', tone: 'formal',
      hookId: '', challenge: '', status: 'draft', note: '',
      createdAt: now, updatedAt: now
    }, data));
    if (!lead) return null;
    state.leads.unshift(lead);
    save();
    return lead;
  }

  function getLead(id) {
    return state.leads.filter(function (l) { return l.id === id; })[0] || null;
  }

  function updateLead(id, patch) {
    var lead = getLead(id);
    if (!lead) return null;
    var merged = sanitizeLead(Object.assign({}, lead, patch, { id: undefined, createdAt: lead.createdAt }));
    if (!merged) return null;
    merged.id = lead.id;
    merged.createdAt = lead.createdAt;
    merged.updatedAt = new Date().toISOString();
    Object.assign(lead, merged);
    save();
    return lead;
  }

  function deleteLead(id) {
    state.leads = state.leads.filter(function (l) { return l.id !== id; });
    save();
  }

  /* ---------------- 지표 ---------------- */
  function metrics() { return state.metrics.slice(); }

  function metricsSorted() {
    return state.metrics.slice().sort(function (a, b) {
      if (a.week === b.week) return String(a.channel).localeCompare(String(b.channel));
      return a.week < b.week ? 1 : -1;
    });
  }

  function upsertMetric(data) {
    var clean = sanitizeMetric(Object.assign({}, data, { id: undefined }));
    if (!clean) return { metric: null, updated: false };
    var existing = state.metrics.filter(function (m) {
      return m.week === clean.week && m.channel === clean.channel;
    })[0];
    if (existing) {
      Object.assign(existing, clean, { id: existing.id, updatedAt: new Date().toISOString() });
      save();
      return { metric: existing, updated: true };
    }
    state.metrics.push(clean);
    save();
    return { metric: clean, updated: false };
  }

  function deleteMetric(id) {
    state.metrics = state.metrics.filter(function (m) { return m.id !== id; });
    save();
  }

  /* ---------------- 전체 데이터 ---------------- */
  function exportAll() {
    return JSON.stringify({
      app: 'dangoal-marketing-studio',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      encrypted: false,
      warning: '이 파일에는 발신자 정보와 리드가 평문으로 들어 있습니다. 안전한 곳에 보관하세요.',
      leads: state.leads,
      metrics: state.metrics,
      prefs: state.prefs
    }, null, 2);
  }

  function importAll(rawText) {
    var data;
    try { data = JSON.parse(rawText); } catch (e) { return { ok: false, error: 'JSON 형식이 아닙니다.' }; }
    if (!data || typeof data !== 'object') return { ok: false, error: '데이터 형식이 아닙니다.' };
    if (!Array.isArray(data.leads) && !Array.isArray(data.metrics) && !data.prefs) {
      return { ok: false, error: '가져올 리드·지표 데이터가 없습니다.' };
    }
    if (Array.isArray(data.leads)) state.leads = data.leads.slice(0, 2000).map(sanitizeLead).filter(Boolean);
    if (Array.isArray(data.metrics)) state.metrics = data.metrics.slice(0, 5000).map(sanitizeMetric).filter(Boolean);
    if (data.prefs && typeof data.prefs === 'object') state.prefs = sanitizePrefs(data.prefs, state.prefs);
    save();
    return { ok: true, counts: { leads: state.leads.length, metrics: state.metrics.length } };
  }

  function resetAll() {
    state = defaults();
    save();
  }

  /* 예시 지표 — 실제 실적이 아니라 화면 확인용입니다. */
  function sampleMetrics() {
    var base = Utils.mondayOf();
    var weeks = [0, 1, 2, 3, 4, 5].map(function (n) { return Utils.addDaysISO(base, -7 * n); });
    var rows = [];
    weeks.forEach(function (w, i) {
      var k = 5 - i;
      rows.push({ week: w, channel: 'instagram', impressions: 1800 + k * 260, clicks: 26 + k * 6, inquiries: 3 + Math.floor(k * 0.8), conversions: 1 + Math.floor(k * 0.4), note: '예시' });
      rows.push({ week: w, channel: 'blog', impressions: 900 + k * 120, clicks: 18 + k * 4, inquiries: 2 + Math.floor(k * 0.6), conversions: 1 + Math.floor(k * 0.2), note: '예시' });
      rows.push({ week: w, channel: 'coldmail', impressions: 40 + k * 4, clicks: 9 + k * 2, inquiries: 2 + Math.floor(k * 0.5), conversions: 1, note: '예시' });
    });
    return rows;
  }

  return {
    init: init, save: save, get: get, prefs: prefs, profile: profile, setPref: setPref,
    updateProfile: updateProfile, hasProfile: hasProfile,
    isLocked: isLocked, isEncrypted: isEncrypted, cryptoReady: cryptoReady,
    unlock: unlock, enableLock: enableLock, changePin: changePin, disableLock: disableLock,
    lockNow: lockNow, wipeAll: wipeAll,
    leads: leads, addLead: addLead, getLead: getLead, updateLead: updateLead, deleteLead: deleteLead,
    metrics: metrics, metricsSorted: metricsSorted, upsertMetric: upsertMetric, deleteMetric: deleteMetric,
    exportAll: exportAll, importAll: importAll, resetAll: resetAll, sampleMetrics: sampleMetrics,
    storageAvailable: storageAvailable
  };
})();
