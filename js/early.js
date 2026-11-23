/* 초기 오류 수집 — CSP(script-src 'self')를 위해 인라인 스크립트를 분리했습니다. */
'use strict';

window.__dangoalErrors = [];
window.addEventListener('error', function (e) {
  window.__dangoalErrors.push(String((e && (e.message || e.error)) || 'unknown error'));
});
window.addEventListener('unhandledrejection', function (e) {
  window.__dangoalErrors.push('promise: ' + String(e && e.reason));
});
