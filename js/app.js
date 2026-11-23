/* 앱 셸 — 탭 라우팅, 전략 보드, 설정·잠금, 데이터 내보내기/가져오기 */
'use strict';

var App = (function () {
  var TABS = ['strategy', 'mail', 'card', 'landing', 'metrics'];
  var started = false;

  /* ---------------- 프로필 → 브랜드 연락처 ---------------- */
  function applyProfile() {
    var p = Store.profile();
    BRAND.contact.senderName = p.senderName || '';
    BRAND.contact.owner = p.senderName || '';
    BRAND.contact.phone = p.phone || '';
    BRAND.contact.tel = (p.phone || '').replace(/[^0-9+]/g, '');
    BRAND.contact.email = p.email || '';
    BRAND.contact.company = p.company || '다정';
  }

  function renderContact() {
    var p = Store.profile();
    var phone = p.phone || '';
    var email = p.email || '';

    var heroPhone = Utils.$('#heroPhone');
    if (heroPhone) {
      if (phone) {
        heroPhone.hidden = false;
        heroPhone.href = 'tel:' + phone.replace(/[^0-9+]/g, '');
        heroPhone.textContent = '전화 ' + phone;
      } else {
        heroPhone.hidden = true;
      }
    }

    var grid = Utils.$('#contactGrid');
    if (grid) {
      var items = [
        { label: '2분 진단 신청', value: 'dangoal.com/apply', href: BRAND.contact.apply, ext: true },
        { label: '행사 담당자 진단', value: '/apply?svc=event', href: BRAND.contact.applyEvent, ext: true }
      ];
      if (phone) items.push({ label: '문의 전화', value: phone, href: 'tel:' + phone.replace(/[^0-9+]/g, '') });
      if (email) items.push({ label: '이메일', value: email, href: 'mailto:' + email });
      if (!phone && !email) items.push({ label: '연락처·이메일', value: '설정에서 입력', href: '#', settings: true });
      grid.innerHTML = items.map(function (it) {
        return '<a class="contact-item" href="' + Utils.escapeAttr(it.href) + '"' +
          (it.ext ? ' target="_blank" rel="noopener"' : '') +
          (it.settings ? ' data-open-settings' : '') + '>' +
          '<span>' + Utils.escapeHtml(it.label) + '</span>' +
          '<strong>' + Utils.escapeHtml(it.value) + '</strong></a>';
      }).join('');
    }

    var companyLine = 'dangoal · ' + (p.company || '다정') + ' · ' + BRAND.contact.companyNote + ' · 비대면 운영';
    var foot = Utils.$('#footCompany');
    if (foot) foot.textContent = (p.company || '다정') + ' · ' + BRAND.contact.companyNote + ' · 비대면 운영';
    var contactFoot = Utils.$('#contactFoot');
    if (contactFoot) contactFoot.textContent = companyLine;

    var hint = Utils.$('#profileHint');
    if (hint) hint.hidden = Store.hasProfile();
  }

  /* ---------------- 탭 ---------------- */
  function switchTab(name) {
    if (TABS.indexOf(name) === -1) name = 'strategy';
    Utils.$$('.view').forEach(function (v) {
      v.classList.toggle('is-active', v.id === 'view-' + name);
    });
    Utils.$$('.tab').forEach(function (b) {
      var on = b.dataset.goto === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (name === 'metrics') Metrics.render();
    if (name === 'card') CardNews.render();
    if (name === 'landing' && !Utils.$('#landingCode').textContent) Landing.render();
    if (location.hash !== '#' + name && history.replaceState) {
      try { history.replaceState(null, '', '#' + name); } catch (e) { /* file:// 등에서 막히면 무시 */ }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderStrategy() {
    var stats = Utils.$('#strategyStats');
    if (stats) {
      stats.innerHTML = BRAND.stats.map(function (s) {
        return '<div class="stat"><b>' + Utils.escapeHtml(s.num) + '</b><span>' + Utils.escapeHtml(s.label) + '</span></div>';
      }).join('');
    }
    var note = Utils.$('#strategyStatsNote');
    if (note) note.textContent = BRAND.statsNote;

    var matrix = Utils.$('#muMatrix');
    if (matrix) {
      var head = '<thead><tr><th>3무의 축</th>' + TARGETS.map(function (t) {
        return '<th><span class="th-target">' + Utils.escapeHtml(t.label) + '</span></th>';
      }).join('') + '</tr></thead>';
      var body = MU_AXES.map(function (axis) {
        return '<tr><td><strong>' + Utils.escapeHtml(axis.label) + '</strong><span class="axis-desc">' +
          Utils.escapeHtml(axis.desc) + '</span></td>' + TARGETS.map(function (t) {
            var hook = t.hooks.filter(function (h) { return h.axis === axis.id; })[0] || t.hooks[0];
            return '<td><span class="matrix-mu">' + Utils.escapeHtml(hook.mu) + '</span><br>' +
              '<span class="matrix-short">' + Utils.escapeHtml(hook.short) + '</span></td>';
          }).join('') + '</tr>';
      }).join('');
      matrix.innerHTML = head + '<tbody>' + body + '</tbody>';
    }

    var boards = Utils.$('#targetBoards');
    if (boards) {
      boards.innerHTML = TARGETS.map(function (t, ti) {
        return '<article class="target-board" id="target-' + t.id + '">' +
          '<header class="target-head">' +
          '<span class="target-index">0' + (ti + 1) + '</span>' +
          '<div><h3>' + Utils.escapeHtml(t.full) + '</h3><p>' + Utils.escapeHtml(t.who) + '</p></div>' +
          '<span class="target-goal">' + Utils.escapeHtml(t.goal) + '</span>' +
          '</header>' +
          '<div class="hook-list">' + t.hooks.map(function (h) {
            return '<div class="hook">' +
              '<div class="hook-top"><span class="hook-mu">' + Utils.escapeHtml(h.mu) + '</span>' +
              '<span class="hook-axis">' + Utils.escapeHtml((MU_AXES.filter(function (a) { return a.id === h.axis; })[0] || {}).label || '') + '</span></div>' +
              '<h4>' + Utils.escapeHtml(h.name) + '</h4>' +
              '<p>' + Utils.escapeHtml(h.body) + '</p>' +
              '<p class="hook-proof">근거 · ' + Utils.escapeHtml(h.proof) + '</p>' +
              '</div>';
          }).join('') + '</div>' +
          '<footer class="target-foot">' +
          '<div class="target-pains"><strong>이런 문제에 먼저 닿습니다</strong><ul>' +
          t.pains.map(function (p) { return '<li>' + Utils.escapeHtml(p) + '</li>'; }).join('') + '</ul></div>' +
          '<button class="btn btn-dark btn-sm" data-mail-target="' + t.id + '">이 타겟으로 콜드메일 쓰기 →</button>' +
          '</footer></article>';
      }).join('');
    }

    var segBody = Utils.$('#segmentRows');
    if (segBody) {
      var rows = [];
      TARGETS.forEach(function (t) {
        t.segments.forEach(function (s) {
          rows.push('<tr><td><span class="tag">' + Utils.escapeHtml(t.short) + '</span></td>' +
            '<td><strong>' + Utils.escapeHtml(s.label) + '</strong></td>' +
            '<td>' + Utils.escapeHtml(s.pain) + '</td>' +
            '<td class="hook-line">' + Utils.escapeHtml(s.hookLine) + '</td></tr>');
        });
      });
      segBody.innerHTML = rows.join('');
    }

    var lib = Utils.$('#copyLibrary');
    if (lib) {
      lib.innerHTML = BRAND.copyLibrary.map(function (c, i) {
        return '<div class="copy-row"><div><span class="copy-label">' + Utils.escapeHtml(c.label) + '</span>' +
          '<p>' + Utils.escapeHtml(c.text) + '</p></div>' +
          '<button class="btn btn-tiny" data-copy="' + i + '">복사</button></div>';
      }).join('');
    }

    var priceBox = Utils.$('#priceBullets');
    if (priceBox) {
      priceBox.innerHTML = BRAND.price.bullets.map(function (b) { return '<li>' + Utils.escapeHtml(b) + '</li>'; }).join('');
    }
    var priceHead = Utils.$('#priceHeadline');
    if (priceHead) priceHead.textContent = BRAND.price.headline;
    var priceBody = Utils.$('#priceBody');
    if (priceBody) priceBody.textContent = BRAND.price.body;

    var toneRules = Utils.$('#toneRules');
    if (toneRules) {
      toneRules.innerHTML = BRAND.tone.rules.map(function (r) { return '<li>' + Utils.escapeHtml(r) + '</li>'; }).join('');
    }
    var keywords = Utils.$('#toneKeywords');
    if (keywords) {
      keywords.innerHTML = BRAND.tone.keywords.map(function (k) { return '<span class="chip">' + Utils.escapeHtml(k) + '</span>'; }).join('');
    }
  }

  /* ---------------- 내비게이션 ---------------- */
  function bindNav() {
    document.addEventListener('click', function (e) {
      var settingsLink = e.target.closest('[data-open-settings]');
      if (settingsLink) {
        e.preventDefault();
        openSettings();
        return;
      }
      var goto = e.target.closest('[data-goto]');
      if (goto) {
        e.preventDefault();
        switchTab(goto.dataset.goto);
        return;
      }
      var mailTarget = e.target.closest('[data-mail-target]');
      if (mailTarget) {
        var id = mailTarget.dataset.mailTarget;
        var sel = Utils.$('#mailTarget');
        if (sel) {
          sel.value = id;
          sel.dispatchEvent(new Event('change'));
          switchTab('mail');
          Utils.$('#mailName').focus();
        }
        return;
      }
      var copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        var item = BRAND.copyLibrary[Number(copyBtn.dataset.copy)];
        if (!item) return;
        Utils.copyText(item.text).then(function (ok) {
          Utils.toast(ok ? '문장을 복사했습니다.' : '복사에 실패했습니다.', ok ? 'ok' : 'warn');
        });
      }
    });

    window.addEventListener('hashchange', function () {
      switchTab(location.hash.replace('#', ''));
    });
  }

  /* ---------------- 설정 ---------------- */
  function fillProfileInputs() {
    var p = Store.profile();
    Utils.$('#setSenderName').value = p.senderName || '';
    Utils.$('#setPhone').value = p.phone || '';
    Utils.$('#setEmail').value = p.email || '';
    Utils.$('#setCompany').value = p.company || '';
  }

  function updateSecurityUI() {
    var enc = Store.isEncrypted();
    Utils.$('#lockStatus').textContent = enc ? '켜짐 · AES-GCM 256' : '꺼짐';
    Utils.$('#lockOffPanel').hidden = enc;
    Utils.$('#lockOnPanel').hidden = !enc;
    var unavailable = Utils.$('#cryptoUnavailable');
    if (unavailable) unavailable.hidden = Store.cryptoReady();
    ['newPin', 'newPin2', 'curPin', 'nextPin', 'nextPin2'].forEach(function (id) {
      var el = Utils.$('#' + id);
      if (el) el.value = '';
    });
  }

  function openSettings() {
    fillProfileInputs();
    updateSecurityUI();
    Utils.$('#profileSaved').textContent = '';
    Utils.$('#settingsModal').hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () {
      var first = Utils.$('#setSenderName');
      if (first) first.focus();
    }, 30);
  }

  function closeSettings() {
    Utils.$('#settingsModal').hidden = true;
    document.body.classList.remove('modal-open');
  }

  function bindSettings() {
    var modal = Utils.$('#settingsModal');
    if (!modal) return;
    Utils.$('#btnSettings').addEventListener('click', openSettings);
    Utils.$('#btnCloseSettings').addEventListener('click', closeSettings);
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close-settings]')) closeSettings();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeSettings();
    });

    Utils.$('#profileForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = Utils.$('#setPhone').value.trim();
      var email = Utils.$('#setEmail').value.trim();
      if (phone && !/^[0-9+\-()\s]{4,30}$/.test(phone)) {
        Utils.toast('연락처는 숫자와 - + ( ) 공백만 쓸 수 있습니다.', 'warn');
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Utils.toast('이메일 형식을 확인해 주세요.', 'warn');
        return;
      }
      Store.updateProfile({
        senderName: Utils.$('#setSenderName').value.trim(),
        phone: phone,
        email: email,
        company: Utils.$('#setCompany').value.trim()
      });
      applyProfile();
      renderContact();
      if (typeof CardNews !== 'undefined') CardNews.render();
      if (typeof Landing !== 'undefined') Landing.render();
      Utils.$('#profileSaved').textContent = '저장했습니다. 이 브라우저에만 보관됩니다.';
      setTimeout(function () { Utils.$('#profileSaved').textContent = ''; }, 3200);
      Utils.toast('발신자 정보를 저장했습니다. (localStorage)', 'ok');
    });

    Utils.$('#lockOnForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var pin = Utils.$('#newPin').value;
      var pin2 = Utils.$('#newPin2').value;
      if (pin.length < 4) { Utils.toast('PIN은 4자리 이상으로 정해 주세요.', 'warn'); return; }
      if (pin !== pin2) { Utils.toast('PIN 확인이 일치하지 않습니다.', 'warn'); return; }
      var btn = Utils.$('#lockOnForm').querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = '암호화 중…';
      try {
        await Store.enableLock(pin);
        updateSecurityUI();
        Utils.toast('잠금을 켰습니다. 이제 데이터는 암호화되어 저장됩니다.', 'ok');
      } catch (err) {
        Utils.toast(err.message || '잠금을 켜지 못했습니다.', 'warn');
      } finally {
        btn.disabled = false;
        btn.textContent = '잠금 켜기';
      }
    });

    Utils.$('#lockChangeForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var cur = Utils.$('#curPin').value;
      var next = Utils.$('#nextPin').value;
      var next2 = Utils.$('#nextPin2').value;
      if (next.length < 4) { Utils.toast('새 PIN은 4자리 이상으로 정해 주세요.', 'warn'); return; }
      if (next !== next2) { Utils.toast('새 PIN 확인이 일치하지 않습니다.', 'warn'); return; }
      var btn = this.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = '변경 중…';
      try {
        await Store.changePin(cur, next);
        updateSecurityUI();
        Utils.toast('PIN을 변경했습니다.', 'ok');
      } catch (err) {
        Utils.toast('PIN이 맞지 않거나 변경에 실패했습니다.', 'warn');
      } finally {
        btn.disabled = false;
        btn.textContent = 'PIN 변경';
      }
    });

    Utils.$('#btnDisableLock').addEventListener('click', async function () {
      var cur = Utils.$('#curPin').value;
      if (!cur) { Utils.toast('현재 PIN을 입력해 주세요.', 'warn'); return; }
      if (!window.confirm('암호화를 끄면 데이터가 평문으로 저장됩니다. 계속할까요?')) return;
      var btn = Utils.$('#btnDisableLock');
      btn.disabled = true;
      try {
        await Store.disableLock(cur);
        updateSecurityUI();
        Utils.toast('암호화를 껐습니다. 이제 데이터가 평문으로 저장됩니다.', 'warn');
      } catch (err) {
        Utils.toast('PIN이 맞지 않습니다.', 'warn');
      } finally {
        btn.disabled = false;
      }
    });

    Utils.$('#btnLockNow').addEventListener('click', function () {
      if (Store.lockNow()) {
        location.reload();
      } else {
        Utils.toast('잠금이 켜져 있지 않습니다.', 'warn');
      }
    });

    Utils.$('#btnSettingsExport').addEventListener('click', exportData);
    Utils.$('#btnSettingsImport').addEventListener('click', function () {
      Utils.$('#fileImportAll').click();
    });
  }

  /* ---------------- 잠금 화면 ---------------- */
  function showLock() {
    Utils.$('#lockScreen').hidden = false;
    document.body.classList.add('locked');
    var input = Utils.$('#unlockPin');
    if (input) setTimeout(function () { input.focus(); }, 50);
  }

  function bindLockScreen() {
    var screen = Utils.$('#lockScreen');
    if (!screen) return;
    Utils.$('#unlockForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var pin = Utils.$('#unlockPin').value;
      var err = Utils.$('#unlockError');
      var btn = Utils.$('#btnUnlock');
      err.textContent = '';
      if (!pin) { err.textContent = 'PIN을 입력해 주세요.'; return; }
      btn.disabled = true;
      btn.textContent = '여는 중…';
      try {
        await Store.unlock(pin);
        screen.hidden = true;
        document.body.classList.remove('locked');
        Utils.$('#unlockPin').value = '';
        startApp();
        Utils.toast('잠금을 열었습니다.', 'ok');
      } catch (ex) {
        err.textContent = 'PIN이 맞지 않습니다. 다시 입력해 주세요.';
        Utils.$('#unlockPin').value = '';
        Utils.$('#unlockPin').focus();
      } finally {
        btn.disabled = false;
        btn.textContent = '열기';
      }
    });

    Utils.$('#btnForgotPin').addEventListener('click', function () {
      if (!window.confirm('PIN은 복구할 수 없습니다. 초기화하면 저장된 리드·지표가 모두 삭제됩니다. 계속할까요?')) return;
      if (!window.confirm('정말 삭제하고 초기화할까요? 이 작업은 되돌릴 수 없습니다.')) return;
      Store.wipeAll();
      location.reload();
    });
  }

  /* ---------------- 데이터 ---------------- */
  function exportData() {
    if (Store.isEncrypted()) {
      if (!window.confirm('내보낸 JSON은 평문입니다. 발신자 정보와 리드가 들어 있으니 안전한 곳에 보관하세요. 계속할까요?')) return;
    }
    Utils.downloadText(Store.exportAll(), 'dangoal-marketing-data-' + Utils.todayISO() + '.json', 'application/json');
    Utils.toast('리드·지표·설정을 JSON으로 저장했습니다.', 'ok');
  }

  function bindData() {
    var exportBtn = Utils.$('#btnExportAll');
    if (exportBtn) exportBtn.addEventListener('click', exportData);

    var importBtn = Utils.$('#btnImportAll');
    var fileInput = Utils.$('#fileImportAll');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) { Utils.toast('파일이 너무 큽니다. (5MB 이하)', 'warn'); e.target.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function () {
          var res = Store.importAll(String(reader.result || ''));
          e.target.value = '';
          if (!res.ok) { Utils.toast('가져오지 못했습니다: ' + res.error, 'warn'); return; }
          applyProfile();
          renderContact();
          ColdMail.renderPipeline();
          Metrics.render();
          CardNews.render();
          Landing.render();
          Utils.toast('리드 ' + res.counts.leads + '건, 지표 ' + res.counts.metrics + '건을 가져왔습니다.', 'ok');
        };
        reader.readAsText(f, 'utf-8');
      });
    }

    var resetBtn = Utils.$('#btnResetAll');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!window.confirm('저장된 리드·지표·발신자 정보를 모두 지웁니다. 되돌릴 수 없습니다. 계속할까요?')) return;
        Store.resetAll();
        applyProfile();
        renderContact();
        ColdMail.renderPipeline();
        Metrics.render();
        CardNews.render();
        Landing.render();
        Utils.toast('모든 데이터를 초기화했습니다.', 'ok');
      });
    }
  }

  /* ---------------- 시작 ---------------- */
  function startApp() {
    if (started) return;
    started = true;
    applyProfile();
    renderContact();
    renderStrategy();
    bindNav();
    ColdMail.bind();
    CardNews.bind();
    Landing.bind();
    Metrics.bind();
    bindSettings();
    bindData();
    var hash = location.hash.replace('#', '');
    switchTab(TABS.indexOf(hash) > -1 ? hash : 'strategy');
    window.__dangoalReady = true;
  }

  async function boot() {
    bindLockScreen();
    var result = await Store.init();
    if (result.locked) { showLock(); return; }
    startApp();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return { switchTab: switchTab, renderStrategy: renderStrategy, openSettings: openSettings };
})();
