/* 콜드메일 생성기 + 발송 파이프라인 — 규칙 기반(토큰 0원) 문구 엔진 */
'use strict';

var ColdMail = (function () {
  var TONES = [
    { id: 'formal', label: '정중한 첫 연락', desc: '맥락과 근거를 차분히 설명' },
    { id: 'brief', label: '짧고 담백', desc: '5~7문장, 바로 용건' },
    { id: 'numbers', label: '숫자·사실 중심', desc: '집계와 기간으로 먼저 말함' },
    { id: 'casual', label: '가벼운 제안', desc: '부담 없는 톤의 짧은 제안' }
  ];

  var view = { seed: 0, current: null, filter: 'all', query: '' };

  function targetById(id) {
    return TARGETS.filter(function (t) { return t.id === id; })[0] || TARGETS[0];
  }
  function segmentById(t, id) {
    return (t.segments || []).filter(function (s) { return s.id === id; })[0] || t.segments[0];
  }
  function hookById(t, id) {
    if (!id || id === 'auto') return t.hooks[0];
    return t.hooks.filter(function (h) { return h.id === id; })[0] || t.hooks[0];
  }
  function toneById(id) {
    return TONES.filter(function (t) { return t.id === id; })[0] || TONES[0];
  }

  function hashString(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function phoneText() { return BRAND.contact.phone || ''; }
  function emailText() { return BRAND.contact.email || ''; }
  function landingText() { return BRAND.contact.landing; }
  function teamName() {
    var name = BRAND.contact.senderName ? ' ' + BRAND.contact.senderName : '';
    return '단골(dangoal) 운영팀' + name;
  }

  function signature() {
    var org = '단골(dangoal)' + (BRAND.contact.company ? ' · ' + BRAND.contact.company : '');
    var contact = [BRAND.contact.senderName, phoneText(), emailText()].filter(Boolean).join(' · ');
    var lines = [org];
    if (contact) lines.push(contact);
    lines.push(landingText());
    return lines.join('\n');
  }

  function greeting(input, t) {
    if (input.contactName) {
      return input.contactName + (t.id === 'store' ? ' 사장님, 안녕하세요.' : ' 님, 안녕하세요.') +
        ' ' + teamName() + '입니다.';
    }
    return input.name + (t.id === 'store' ? ' 사장님, 안녕하세요.' : ' 담당자님, 안녕하세요.') +
      ' ' + teamName() + '입니다.';
  }

  function problemBlock(input, t, s) {
    var tail = {
      store: '매장에 온 손님은 그 자리에서 끝나고, 누가 단골인지는 남지 않습니다.',
      chain: '지점이 늘수록 손님 관리는 본사 일이 되는데, 데이터는 여전히 엑셀과 메신저에 흩어져 있습니다.',
      event: '행사가 끝나면 부스별 기록은 각자 손에 남고, 전체를 한 번에 보기는 어렵습니다.'
    }[t.id];
    return s.pain + ' ' + tail;
  }

  function proposalBlock(input, t, s, rng) {
    var challenge = (input.challenge || '').trim() || s.defaultChallenge;
    var missionLine;
    if (t.id === 'event') {
      missionLine = '부스 방문, 체험 참여, 설문을 미션으로 묶으면 참가자는 자연스럽게 여러 부스를 돌게 됩니다.';
    } else if (t.id === 'chain') {
      missionLine = '예를 들어 ' + s.missions[0] + ', ' + s.missions[1] + ' 같은 미션에 스탬프를 더 얹습니다.';
    } else {
      missionLine = '예를 들어 ' + s.missions[0] + ', ' + s.missions[1] + ' 같은 미션에 스탬프를 더 얹습니다.';
    }
    var intro = {
      store: '그래서 ' + input.name + '에는 단골 스탬프 챌린지를 제안드립니다.',
      chain: '그래서 ' + input.name + '에는 단골 스탬프 챌린지를 제안드립니다.',
      event: '그래서 ' + input.name + '에는 행사용 단골 스탬프 투어를 제안드립니다.'
    }[t.id];
    return intro + ' ' + challenge + '처럼 기간 한정 미션을 묶고, 먼저 채운 손님께 ' +
      (t.id === 'event' ? '행사 리워드' : '매장 리워드') + '를 드리는 구조입니다. ' + missionLine;
  }

  function howBlock(t) {
    if (t.id === 'event') {
      return '참가자는 부스 QR을 찍고, 처음 한 번만 가입하면 이후에는 스캔만 합니다. 현장 현황판은 실시간으로 갱신되고, 부스별 데이터는 CSV로 받으실 수 있습니다.';
    }
    if (t.id === 'chain') {
      return '손님은 현장 QR을 찍고 위치 확인을 거쳐 스탬프를 받습니다. 지점에는 기기를 두지 않아도 되고, 본사는 대시보드에서 지점별 현황을 봅니다.';
    }
    return '손님은 현장 QR을 찍고 위치 확인을 거쳐 스탬프를 받습니다. 앱 설치도, 적립 기기도 필요 없습니다.';
  }

  function muLines(t, leadHook) {
    var ordered = [leadHook].concat(t.hooks.filter(function (h) { return h.id !== leadHook.id; }));
    return ordered.map(function (h) { return '· ' + h.mu + ' — ' + h.mail; }).join('\n');
  }

  function statsLine() {
    return '지금까지 가입 손님 500+, 쿠폰 받은 손님 400+, 사용 가게 10곳(서울·경기·대구)입니다. 2026년 11월 10일 기준 집계입니다.';
  }

  function priceLine(t, tone) {
    var base = t.id === 'event'
      ? '가격은 행사 규모와 부스 수에 맞춘 1건 단위 맞춤 견적으로 안내드립니다. '
      : '가격은 매장 규모에 맞춘 맞춤 견적으로 안내드립니다. ';
    var tail = '기본료 없이 쓴 만큼만 내는 방식이고, 지금은 무료 프로모션으로 부담 없이 시작하실 수 있습니다.';
    if (tone === 'brief' || tone === 'casual') return base + tail;
    return base + tail + ' 구성과 사용량을 확인한 뒤 금액을 별도로 정리해 드리겠습니다.';
  }

  function ctaBlock(t, tone) {
    var apply = t.applyUrl;
    var phone = phoneText();
    var phoneLine = phone ? ' 전화는 ' + phone + '입니다.' : '';
    if (tone === 'brief') {
      return '여기(' + apply + ')에서 2분이면 진단이 끝납니다. 이 메일에 답장 주셔도 됩니다.' + phoneLine;
    }
    if (tone === 'numbers') {
      return '2분 진단: ' + apply + (phone ? '\n문의: ' + phone : '') + ' / 이 메일에 회신하셔도 됩니다.';
    }
    if (tone === 'casual') {
      return '괜찮으시면 이 메일에 "자료"라고만 답해 주세요. 구성과 견적을 정리해 보내드리겠습니다. 2분 진단(' + apply + ')도 있습니다.';
    }
    return '2분 진단(' + apply + ')에서 ' + (t.id === 'event' ? '행사 상황' : '매장 상황') +
      '만 골라주시면, 맞는 구성과 견적을 정리해 드리겠습니다. 이 메일에 답장 주셔도 됩니다.' +
      (phone ? ' 편하신 시간에 전화 주셔도 됩니다. (' + phone + ')' : '');
  }

  function subjectCandidates(input, t, tone, rng) {
    var vars = { name: input.name, industry: input.industry, region: input.region };
    var list = t.subjectLines.map(function (s) { return Utils.interpolate(s, vars); });
    var extras = {
      formal: '[단골] ' + input.name + '에 제안드리는 재방문 챌린지',
      brief: input.name + ', QR 한 장으로 시작하는 단골 챌린지',
      numbers: input.name + ' — 초기비용 0원, QR 하나로 재방문 확인',
      casual: input.name + ' 사장님, 잠깐 읽어봐 주실 수 있을까요?'
    };
    if (t.id === 'event' && tone === 'numbers') extras.numbers = input.name + ' — 부스별 방문 데이터, 수기 취합 없이';
    list.push(extras[tone] || extras.formal);
    var seen = {}, out = [];
    list.forEach(function (s) {
      s = s.replace(/\s+/g, ' ').trim();
      if (!seen[s] && s.length <= 70) { seen[s] = 1; out.push(s); }
    });
    while (out.length < 3) out.push(input.name + ' 제안 — ' + t.product);
    return out.slice(0, 3);
  }

  function generate(input, seed) {
    var t = targetById(input.targetId);
    var s = segmentById(t, input.segmentId);
    var tone = toneById(input.tone).id;
    var leadHook = hookById(t, input.leadHookId);
    var rng = Utils.mulberry32(hashString(JSON.stringify(input) + ':' + (seed || 0)));
    var opener = Utils.interpolate(Utils.pick(rng, t.mailOpeners), {
      region: input.region, industry: input.industry, name: input.name
    });
    var greetingText = greeting(input, t);
    var problem = problemBlock(input, t, s);
    var proposal = proposalBlock(input, t, s, rng);
    var how = howBlock(t);
    var mus = muLines(t, leadHook);
    var price = priceLine(t, tone);
    var cta = ctaBlock(t, tone);
    var sig = signature();
    var blocks;

    if (tone === 'formal') {
      blocks = [greetingText, opener, problem, proposal, how, mus, statsLine(), price, cta, sig];
    } else if (tone === 'brief') {
      blocks = [greetingText, problem + ' ' + proposal, mus, price, cta, sig];
    } else if (tone === 'numbers') {
      blocks = [greetingText, statsLine(), problem, proposal, mus, price, cta, sig];
    } else {
      blocks = [
        greetingText,
        '바쁘신 중에 메일 드려 죄송합니다. 짧게만 여쭙겠습니다.',
        opener + ' ' + proposal,
        mus,
        '괜찮으시면 10분만 통화하거나, 2분 진단으로 매장 상황만 골라주셔도 됩니다.',
        price,
        cta,
        sig
      ];
    }

    var body = blocks.filter(function (b) { return b && String(b).trim(); }).join('\n\n');
    body = body.replace(/\n{3,}/g, '\n\n');

    return {
      subjects: subjectCandidates(input, t, tone, rng),
      body: body,
      meta: {
        targetId: t.id,
        targetLabel: t.full,
        segmentId: s.id,
        segmentLabel: s.label,
        toneId: tone,
        toneLabel: toneById(tone).label,
        hookId: leadHook.id,
        hookLabel: leadHook.mu,
        challenge: (input.challenge || '').trim() || s.defaultChallenge,
        chars: body.replace(/\s/g, '').length,
        createdAt: new Date().toISOString()
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */
  var lastInput = null;

  function readForm() {
    return {
      targetId: Utils.$('#mailTarget').value,
      segmentId: Utils.$('#mailSegment').value,
      name: Utils.$('#mailName').value.trim(),
      industry: Utils.$('#mailIndustry').value.trim(),
      region: Utils.$('#mailRegion').value.trim(),
      contactName: Utils.$('#mailContact').value.trim(),
      email: Utils.$('#mailEmail').value.trim(),
      challenge: Utils.$('#mailChallenge').value.trim(),
      tone: Utils.$('#mailTone').value,
      leadHookId: Utils.$('#mailHook').value
    };
  }

  function syncSegmentOptions() {
    var t = targetById(Utils.$('#mailTarget').value);
    var segSel = Utils.$('#mailSegment');
    segSel.innerHTML = t.segments.map(function (s) {
      return '<option value="' + s.id + '">' + Utils.escapeHtml(s.label) + '</option>';
    }).join('');
    if (Store.prefs().segmentId) {
      var keep = t.segments.filter(function (s) { return s.id === Store.prefs().segmentId; })[0];
      if (keep) segSel.value = keep.id;
    }
    syncHooks();
    syncIndustry(true);
    syncLabels(t);
  }

  function syncHooks() {
    var t = targetById(Utils.$('#mailTarget').value);
    var sel = Utils.$('#mailHook');
    sel.innerHTML = '<option value="auto">자동 (타겟 기본)</option>' + t.hooks.map(function (h) {
      return '<option value="' + h.id + '">' + Utils.escapeHtml(h.mu + ' — ' + h.name) + '</option>';
    }).join('');
  }

  function syncIndustry(overwrite) {
    var t = targetById(Utils.$('#mailTarget').value);
    var s = segmentById(t, Utils.$('#mailSegment').value);
    var input = Utils.$('#mailIndustry');
    var list = Utils.$('#industryList');
    list.innerHTML = s.industries.map(function (i) { return '<option value="' + Utils.escapeHtml(i) + '"></option>'; }).join('');
    if (overwrite || !input.value.trim()) input.value = s.industries[0] || s.label;
    Utils.$('#mailChallenge').placeholder = '예: ' + s.defaultChallenge + ' (비워두면 이 값 사용)';
  }

  function syncLabels(t) {
    Utils.$('#labelName').textContent = t.id === 'event' ? '행사·기관명 *' : (t.id === 'chain' ? '브랜드·본사명 *' : '매장명 *');
    Utils.$('#labelIndustry').textContent = t.id === 'event' ? '행사 유형' : '업종';
    Utils.$('#labelRegion').textContent = t.id === 'event' ? '지역·장소' : '지역';
    Utils.$('#labelContact').textContent = t.id === 'event' ? '담당자 이름' : '사장님 이름';
    Utils.$('#mailName').placeholder = t.id === 'event' ? '예: ○○구청 축제추진위' : (t.id === 'chain' ? '예: ○○커피 본사' : '예: ○○카페');
  }

  function render() {
    var input = readForm();
    if (!input.name) {
      Utils.toast('매장·행사명을 먼저 입력해 주세요.', 'warn');
      Utils.$('#mailName').focus();
      return null;
    }
    if (!input.region) input.region = '우리 동네';
    if (!input.industry) input.industry = segmentById(targetById(input.targetId), input.segmentId).label;
    lastInput = input;
    var result = generate(input, view.seed);
    view.current = { input: input, result: result, subjectIndex: 0 };
    renderOutput();
    Store.setPref('targetId', input.targetId);
    Store.setPref('segmentId', input.segmentId);
    Store.setPref('tone', input.tone);
    return result;
  }

  function renderOutput() {
    if (!view.current) return;
    var r = view.current.result;
    var el = Utils.$('#mailOutput');
    el.hidden = false;
    Utils.$('#mailEmpty').hidden = true;

    Utils.$('#subjectList').innerHTML = r.subjects.map(function (s, i) {
      return '<label class="subject-option">' +
        '<input type="radio" name="subjectPick" value="' + i + '"' + (i === view.current.subjectIndex ? ' checked' : '') + '>' +
        '<span class="subject-text">' + Utils.escapeHtml(s) + '</span>' +
        (i === 0 ? '<span class="subject-badge">추천</span>' : '') +
        '</label>';
    }).join('');

    Utils.$('#mailBody').textContent = r.body;
    Utils.$('#mailMeta').textContent = r.meta.targetLabel + ' · ' + r.meta.segmentLabel + ' · ' +
      r.meta.toneLabel + ' · ' + r.meta.hookLabel + ' · ' + Utils.num(r.meta.chars) + '자';

    Utils.$('#mailBody').className = 'mail-body tone-' + r.meta.toneId;
  }

  function currentSubject() {
    if (!view.current) return '';
    var checked = document.querySelector('input[name="subjectPick"]:checked');
    var idx = checked ? Number(checked.value) : 0;
    return view.current.result.subjects[idx] || view.current.result.subjects[0];
  }

  function currentBody() { return view.current ? view.current.result.body : ''; }

  function copyBody() {
    if (!view.current) return;
    Utils.copyText(currentBody()).then(function (ok) {
      Utils.toast(ok ? '본문을 복사했습니다.' : '복사에 실패했습니다. 본문을 직접 선택해 주세요.', ok ? 'ok' : 'warn');
    });
  }

  function copyAll() {
    if (!view.current) return;
    var text = '제목: ' + currentSubject() + '\n\n' + currentBody();
    Utils.copyText(text).then(function (ok) {
      Utils.toast(ok ? '제목과 본문을 복사했습니다.' : '복사에 실패했습니다.', ok ? 'ok' : 'warn');
    });
  }

  function openMailto(lead) {
    var subject = lead.subject || currentSubject();
    var email = (lead.email || '').trim();
    var body = lead.body || currentBody();
    Utils.copyText(body);
    var href = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subject);
    var a = document.createElement('a');
    a.href = href;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Utils.toast('본문을 복사했습니다. 메일 앱에서 붙여넣으세요.', 'ok');
  }

  function saveLead() {
    if (!view.current) return;
    var input = view.current.input;
    var body = currentBody();
    var subject = currentSubject();
    var existing = Store.leads().filter(function (l) {
      return l.name === input.name && (l.email || '') === (input.email || '') && l.targetId === input.targetId;
    })[0];
    if (existing) {
      Store.updateLead(existing.id, {
        subject: subject, body: body, tone: input.tone, hookId: view.current.result.meta.hookId,
        challenge: view.current.result.meta.challenge, industry: input.industry, region: input.region,
        contactName: input.contactName, segmentId: input.segmentId
      });
      Utils.toast('이미 있는 리드를 최신 내용으로 업데이트했습니다.', 'ok');
    } else {
      Store.addLead({
        name: input.name, targetId: input.targetId, segmentId: input.segmentId,
        industry: input.industry, region: input.region, contactName: input.contactName,
        email: input.email, subject: subject, body: body, tone: input.tone,
        hookId: view.current.result.meta.hookId, challenge: view.current.result.meta.challenge,
        status: 'draft'
      });
      Utils.toast('리드로 저장했습니다. 아래 파이프라인에서 상태를 관리하세요.', 'ok');
    }
    renderPipeline();
  }

  function loadLead(id) {
    var lead = Store.getLead(id);
    if (!lead) return;
    var t = targetById(lead.targetId);
    Utils.$('#mailTarget').value = t.id;
    syncSegmentOptions();
    if (lead.segmentId) Utils.$('#mailSegment').value = lead.segmentId;
    syncIndustry(true);
    Utils.$('#mailName').value = lead.name || '';
    Utils.$('#mailIndustry').value = lead.industry || '';
    Utils.$('#mailRegion').value = lead.region || '';
    Utils.$('#mailContact').value = lead.contactName || '';
    Utils.$('#mailEmail').value = lead.email || '';
    Utils.$('#mailChallenge').value = lead.challenge || '';
    Utils.$('#mailTone').value = lead.tone || 'formal';
    Utils.$('#mailHook').value = lead.hookId || 'auto';

    view.current = {
      input: readForm(),
      result: {
        subjects: [lead.subject || '(저장된 제목 없음)'],
        body: lead.body || '',
        meta: {
          targetLabel: t.full,
          segmentLabel: (segmentById(t, lead.segmentId) || {}).label || '',
          toneLabel: toneById(lead.tone).label,
          hookLabel: (hookById(t, lead.hookId) || {}).mu || '',
          chars: (lead.body || '').replace(/\s/g, '').length
        }
      },
      subjectIndex: 0,
      leadId: lead.id
    };
    renderOutput();
    document.querySelector('#mailOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
    Utils.toast('저장된 리드를 불러왔습니다.', 'ok');
  }

  function markSentFromLead(lead) {
    openMailto(lead);
    if (lead.status === 'draft') {
      Store.updateLead(lead.id, { status: 'sent' });
      renderPipeline();
    }
  }

  function renderPipeline() {
    var leads = Store.leads();
    var counts = { all: leads.length, draft: 0, sent: 0, replied: 0, meeting: 0 };
    leads.forEach(function (l) { if (counts[l.status] != null) counts[l.status]++; });

    Utils.$$('#pipelineCounts .count-chip').forEach(function (btn) {
      var k = btn.dataset.filter;
      btn.classList.toggle('is-active', view.filter === k);
      var n = btn.querySelector('.count-num');
      if (n) n.textContent = counts[k] || 0;
    });

    var q = view.query.trim().toLowerCase();
    var rows = leads.filter(function (l) {
      if (view.filter !== 'all' && l.status !== view.filter) return false;
      if (!q) return true;
      return [l.name, l.region, l.industry, l.contactName, l.email, l.subject].join(' ').toLowerCase().indexOf(q) > -1;
    });

    var tbody = Utils.$('#leadRows');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">' +
        (leads.length ? '조건에 맞는 리드가 없습니다.' : '아직 저장한 리드가 없습니다. 위에서 메일을 만들고 “리드로 저장”을 눌러보세요.') +
        '</td></tr>';
    } else {
      tbody.innerHTML = rows.map(function (l) {
        var t = targetById(l.targetId);
        var st = LEAD_STATUS.filter(function (s) { return s.id === l.status; })[0] || LEAD_STATUS[0];
        var statusOptions = LEAD_STATUS.map(function (s) {
          return '<option value="' + s.id + '"' + (s.id === l.status ? ' selected' : '') + '>' + s.label + '</option>';
        }).join('');
        return '<tr data-id="' + l.id + '">' +
          '<td><div class="lead-name">' + Utils.escapeHtml(l.name) + '</div><div class="lead-sub">' +
          Utils.escapeHtml([l.industry, l.region].filter(Boolean).join(' · ')) + '</div></td>' +
          '<td><span class="tag">' + Utils.escapeHtml(t.short) + '</span></td>' +
          '<td><div>' + Utils.escapeHtml(l.contactName || '—') + '</div><div class="lead-sub">' + Utils.escapeHtml(l.email || '메일 없음') + '</div></td>' +
          '<td><select class="status-select status-' + st.id + '" data-action="status">' + statusOptions + '</select></td>' +
          '<td class="lead-sub">' + Utils.formatDateTime(l.updatedAt) + '</td>' +
          '<td class="row-actions">' +
          '<button class="btn btn-tiny" data-action="view">보기</button>' +
          '<button class="btn btn-tiny" data-action="mail">메일</button>' +
          '<button class="btn btn-tiny btn-ghost" data-action="delete">삭제</button>' +
          '</td></tr>';
      }).join('');
    }

    Utils.$('#pipelineSummary').textContent = '전체 ' + counts.all + '곳 · 초안 ' + counts.draft +
      ' · 발송 ' + counts.sent + ' · 회신 ' + counts.replied + ' · 미팅 ' + counts.meeting;
  }

  function exportLeadsCSV() {
    var leads = Store.leads();
    if (!leads.length) { Utils.toast('내보낼 리드가 없습니다.', 'warn'); return; }
    var rows = leads.map(function (l) {
      var t = targetById(l.targetId);
      var st = LEAD_STATUS.filter(function (s) { return s.id === l.status; })[0] || LEAD_STATUS[0];
      return [l.name, t.full, l.segmentId, l.industry, l.region, l.contactName, l.email, st.label,
        l.subject, l.challenge, l.createdAt, l.updatedAt, l.note];
    });
    var csv = Utils.toCSV(rows, ['이름', '타겟', '세그먼트', '업종', '지역', '담당자', '이메일', '상태', '제목', '챌린지', '생성일', '수정일', '메모']);
    Utils.downloadText(csv, 'dangoal-leads-' + Utils.todayISO() + '.csv', 'text/csv');
  }

  function bind() {
    var tsel = Utils.$('#mailTarget');
    if (!tsel) return;

    TONES.forEach(function (t) {
      Utils.$('#mailTone').insertAdjacentHTML('beforeend',
        '<option value="' + t.id + '">' + t.label + ' — ' + t.desc + '</option>');
    });

    tsel.addEventListener('change', function () { syncSegmentOptions(); });
    Utils.$('#mailSegment').addEventListener('change', function () { syncIndustry(true); });

    Utils.$('#btnGenerate').addEventListener('click', function () { view.seed = 0; render(); });
    Utils.$('#btnRegenerate').addEventListener('click', function () {
      view.seed = (view.seed + 1) % 97;
      render();
      Utils.toast('다른 버전으로 다시 만들었습니다.', 'ok');
    });
    Utils.$('#btnMailReset').addEventListener('click', function () {
      Utils.$('#mailName').value = '';
      Utils.$('#mailRegion').value = '';
      Utils.$('#mailContact').value = '';
      Utils.$('#mailEmail').value = '';
      Utils.$('#mailChallenge').value = '';
      view.current = null;
      Utils.$('#mailOutput').hidden = true;
      Utils.$('#mailEmpty').hidden = false;
      Utils.$('#mailName').focus();
    });

    Utils.$('#btnCopyBody').addEventListener('click', copyBody);
    Utils.$('#btnCopyAll').addEventListener('click', copyAll);
    Utils.$('#btnSaveLead').addEventListener('click', saveLead);
    Utils.$('#btnOpenMail').addEventListener('click', function () {
      if (!view.current) return;
      openMailto({ email: view.current.input.email || '', subject: currentSubject(), body: currentBody() });
    });

    Utils.$('#subjectList').addEventListener('change', function (e) {
      if (e.target.name === 'subjectPick') {
        view.current.subjectIndex = Number(e.target.value);
      }
    });

    Utils.$('#btnExportLeads').addEventListener('click', exportLeadsCSV);
    Utils.$('#leadSearch').addEventListener('input', Utils.debounce(function (e) {
      view.query = e.target.value;
      renderPipeline();
    }, 150));

    Utils.$$('#pipelineCounts .count-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        view.filter = btn.dataset.filter;
        renderPipeline();
      });
    });

    Utils.$('#leadRows').addEventListener('change', function (e) {
      var sel = e.target.closest('[data-action="status"]');
      if (!sel) return;
      var tr = sel.closest('tr');
      Store.updateLead(tr.dataset.id, { status: sel.value });
      renderPipeline();
      Utils.toast('상태를 ' + (LEAD_STATUS.filter(function (s) { return s.id === sel.value; })[0] || {}).label + '(으)로 바꿨습니다.', 'ok');
    });

    Utils.$('#leadRows').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var tr = btn.closest('tr');
      var id = tr.dataset.id;
      var lead = Store.getLead(id);
      if (!lead) return;
      if (btn.dataset.action === 'view') loadLead(id);
      else if (btn.dataset.action === 'mail') markSentFromLead(lead);
      else if (btn.dataset.action === 'delete') {
        if (window.confirm('“' + lead.name + '” 리드를 삭제할까요? 되돌릴 수 없습니다.')) {
          Store.deleteLead(id);
          renderPipeline();
          Utils.toast('리드를 삭제했습니다.', 'ok');
        }
      }
    });

    /* 저장된 기본값 반영 */
    var p = Store.prefs();
    Utils.$('#mailTarget').value = p.targetId || 'store';
    Utils.$('#mailTone').value = p.tone || 'formal';
    syncSegmentOptions();
    renderPipeline();
  }

  return { bind: bind, renderPipeline: renderPipeline, generate: generate, TONES: TONES };
})();
