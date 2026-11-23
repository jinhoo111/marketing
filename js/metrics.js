/* SNS 지표 트래킹 + 룰 기반 자동 진단 대시보드 */
'use strict';

var Metrics = (function () {
  var view = { range: '4', editId: null };

  var BENCH = { ctr: 0.015, inquiryRate: 0.08, closeRate: 0.35, exposure: 1000 };

  function channelById(id) {
    return CHANNELS.filter(function (c) { return c.id === id; })[0] || CHANNELS[CHANNELS.length - 1];
  }
  function channelFromInput(v) {
    var s = String(v || '').trim().toLowerCase();
    var byId = CHANNELS.filter(function (c) { return c.id === s; })[0];
    if (byId) return byId;
    var byLabel = CHANNELS.filter(function (c) { return c.label === String(v).trim() || c.short === String(v).trim(); })[0];
    return byLabel || null;
  }

  function filtered() {
    var all = Store.metrics();
    if (view.range === 'all') return all;
    var n = parseInt(view.range, 10) || 4;
    var threshold = Utils.addDaysISO(Utils.mondayOf(), -7 * (n - 1));
    return all.filter(function (m) { return m.week >= threshold; });
  }

  function aggregate(list) {
    var agg = { impressions: 0, clicks: 0, inquiries: 0, conversions: 0, count: list.length };
    list.forEach(function (m) {
      agg.impressions += Number(m.impressions) || 0;
      agg.clicks += Number(m.clicks) || 0;
      agg.inquiries += Number(m.inquiries) || 0;
      agg.conversions += Number(m.conversions) || 0;
    });
    agg.ctr = agg.impressions ? agg.clicks / agg.impressions : 0;
    agg.inquiryRate = agg.clicks ? agg.inquiries / agg.clicks : 0;
    agg.closeRate = agg.inquiries ? agg.conversions / agg.inquiries : 0;
    agg.convRate = agg.clicks ? agg.conversions / agg.clicks : 0;
    return agg;
  }

  function weeksOf(list) {
    var set = {};
    list.forEach(function (m) { set[m.week] = 1; });
    return Object.keys(set).sort();
  }

  function perWeek(list) {
    return weeksOf(list).map(function (w) {
      var rows = list.filter(function (m) { return m.week === w; });
      return { week: w, agg: aggregate(rows) };
    });
  }

  function perChannel(list) {
    return CHANNELS.map(function (c) {
      var rows = list.filter(function (m) { return m.channel === c.id; });
      return { channel: c, agg: aggregate(rows), rows: rows.length };
    });
  }

  /* ---------------- 진단 ---------------- */
  function diagnose(agg, byChannel, weekRows, list) {
    if (!list.length) {
      return {
        level: 'empty',
        title: '아직 지표가 없습니다',
        detail: '채널별 주간 지표를 2주 이상 입력하면 병목과 다음 액션을 계산합니다. 아래 “예시 데이터”로 화면을 먼저 확인해 볼 수 있습니다.',
        actions: [{ label: '콜드메일 만들기', tab: 'mail' }, { label: '카드뉴스 만들기', tab: 'card' }]
      };
    }

    var stages = [];
    stages.push({
      key: 'exposure', label: '노출', value: agg.impressions, bench: BENCH.exposure,
      score: agg.impressions / BENCH.exposure,
      detail: '기간 전체 노출이 ' + Utils.num(agg.impressions) + '회입니다. 주 1,000회를 기준으로 봅니다.'
    });
    if (agg.impressions >= 100) {
      stages.push({
        key: 'hook', label: '클릭 반응', value: agg.ctr, bench: BENCH.ctr, score: agg.ctr / BENCH.ctr,
        detail: '노출 ' + Utils.num(agg.impressions) + '회 중 클릭 ' + Utils.num(agg.clicks) + '회로 클릭률 ' +
          Utils.pct(agg.ctr) + '입니다. 기준은 1.5%입니다.'
      });
    }
    if (agg.clicks >= 15) {
      stages.push({
        key: 'landing', label: '문의 전환', value: agg.inquiryRate, bench: BENCH.inquiryRate, score: agg.inquiryRate / BENCH.inquiryRate,
        detail: '클릭 ' + Utils.num(agg.clicks) + '회 중 문의 ' + Utils.num(agg.inquiries) + '건으로 문의율 ' +
          Utils.pct(agg.inquiryRate) + '입니다. 기준은 8%입니다.'
      });
    }
    if (agg.inquiries >= 5) {
      stages.push({
        key: 'close', label: '상담·계약 전환', value: agg.closeRate, bench: BENCH.closeRate, score: agg.closeRate / BENCH.closeRate,
        detail: '문의 ' + Utils.num(agg.inquiries) + '건 중 전환 ' + Utils.num(agg.conversions) + '건으로 전환율 ' +
          Utils.pct(agg.closeRate) + '입니다. 기준은 35%입니다.'
      });
    }

    var ACTIONS = {
      exposure: {
        title: '지금 병목은 ‘노출’입니다',
        detail: '반응은 나오는데 보는 사람이 적습니다. 발행 횟수와 채널을 늘리는 쪽이 먼저입니다.',
        actions: [
          { label: '카드뉴스 5장 만들기', tab: 'card', why: '같은 내용도 카드뉴스로 묶으면 저장·공유가 늘어납니다. 주 3회 발행을 목표로 하세요.' },
          { label: '콜드메일 10곳 보내기', tab: 'mail', why: '인스타·블로그만으로 부족하면 지역 매장에 직접 제안하는 편이 빠릅니다.' },
          { label: '상세페이지 링크 점검', tab: 'landing', why: '프로필 링크를 2분 진단으로 연결해 유입을 한 곳으로 모으세요.' }
        ]
      },
      hook: {
        title: '지금 병목은 ‘클릭 반응’입니다',
        detail: '노출은 있는데 누르지 않습니다. 제목과 표지 문구가 원인일 가능성이 큽니다.',
        actions: [
          { label: '메일 제목 3안 비교', tab: 'mail', why: '제목 후보를 3개 만들고, 3무 부담을 앞세운 문구로 바꿔 보세요.' },
          { label: '카드뉴스 표지 교체', tab: 'card', why: '표지는 첫 장에서 결정됩니다. “3무”와 숫자를 표지에 넣어 보세요.' },
          { label: '첫 문장에 문제 먼저', tab: 'mail', why: '서비스 소개가 아니라 손님이 겪는 문제를 첫 문장에 두면 반응이 달라집니다.' }
        ]
      },
      landing: {
        title: '지금 병목은 ‘문의 전환’입니다',
        detail: '클릭은 오는데 문의로 이어지지 않습니다. 상세페이지의 CTA와 가격 안내를 점검하세요.',
        actions: [
          { label: '상세페이지 다시 만들기', tab: 'landing', why: '가격은 “맞춤 견적”으로 두되, 무료 프로모션과 2분 진단 링크를 첫 화면에 두세요.' },
          { label: '증거 숫자 추가', tab: 'landing', why: '가입 손님 500+, 사용 가게 10곳 같은 집계를 히어로 아래에 넣으세요.' },
          { label: 'CTA 문구 바꾸기', tab: 'landing', why: '“문의하기”보다 “2분 진단 신청”이 부담이 낮습니다.' }
        ]
      },
      close: {
        title: '지금 병목은 ‘상담·계약 전환’입니다',
        detail: '문의는 오는데 확정이 안 됩니다. 응답 속도와 견적 안내 방식이 원인일 수 있습니다.',
        actions: [
          { label: '리드 파이프라인 확인', tab: 'mail', why: '회신온 리드에 1~2영업일 안에 답하는지 확인하고, 상태를 미팅확정까지 관리하세요.' },
          { label: '맞춤 견적 문구 정리', tab: 'landing', why: '금액 대신 포함 항목(온보딩·QR 제작·리포트)을 먼저 보여주면 비교가 쉬워집니다.' },
          { label: '무료 프로모션 안내', tab: 'mail', why: '첫 달 부담을 숫자로 보여주세요. “기본료 없이 쓴 만큼만”이 결정을 앞당깁니다.' }
        ]
      },
      good: {
        title: '지금 구조는 잘 돌고 있습니다',
        detail: '모든 단계가 기준을 넘었습니다. 무리하게 바꾸기보다 잘 되는 채널에 집중하세요.',
        actions: [
          { label: '잘 되는 채널에 집중', tab: 'metrics', why: '가장 반응이 좋은 채널의 발행 빈도를 유지하고, 나머지는 줄이세요.' },
          { label: '카드뉴스 시리즈 만들기', tab: 'card', why: '잘 먹힌 주제를 5장 시리즈로 반복하면 제작 비용이 거의 들지 않습니다.' },
          { label: '리드 재접촉', tab: 'mail', why: '회신이 끊긴 리드에 새 챌린지 사례로 다시 연락해 보세요.' }
        ]
      }
    };

    var weak = stages.slice().sort(function (a, b) { return a.score - b.score; })[0];
    var good = stages.every(function (s) { return s.score >= 1; });
    var key = good ? 'good' : weak.key;
    var pack = ACTIONS[key];
    var level = good ? 'good' : (weak.score < 0.6 ? 'bad' : 'warn');
    var detail = good
      ? '노출 ' + Utils.num(agg.impressions) + '회 · 클릭률 ' + Utils.pct(agg.ctr) + ' · 문의율 ' +
        Utils.pct(agg.inquiryRate) + ' · 전환율 ' + Utils.pct(agg.closeRate) + '. 모두 기준 이상입니다.'
      : weak.detail;

    /* 채널·추세 인사이트 */
    var insights = [];
    var ranked = byChannel.filter(function (c) { return c.rows > 0; }).sort(function (a, b) {
      if (b.agg.inquiries === a.agg.inquiries) return b.agg.clicks - a.agg.clicks;
      return b.agg.inquiries - a.agg.inquiries;
    });
    if (ranked.length) {
      var best = ranked[0];
      insights.push({
        kind: 'channel',
        title: '가장 반응이 좋은 채널: ' + best.channel.label,
        body: '문의 ' + Utils.num(best.agg.inquiries) + '건 · 클릭 ' + Utils.num(best.agg.clicks) +
          '회 · 문의율 ' + Utils.pct(best.agg.inquiryRate) + '. 이 채널의 형식을 다른 채널에 옮겨 보세요.'
      });
      if (ranked.length > 1) {
        var worst = ranked[ranked.length - 1];
        if (worst.agg.impressions > 0 && worst.agg.inquiries === 0) {
          insights.push({
            kind: 'channel',
            title: '점검할 채널: ' + worst.channel.label,
            body: '노출 ' + Utils.num(worst.agg.impressions) + '회에 문의 0건입니다. 문구를 바꾸거나 이번 주는 비중을 줄이세요.'
          });
        }
      }
    }

    if (weekRows.length >= 2) {
      var sorted = weekRows.slice().sort(function (a, b) { return a.week < b.week ? -1 : 1; });
      var recent = sorted.slice(-2);
      var prev = sorted.slice(-4, -2);
      var recentSum = recent.reduce(function (s, r) { return s + r.agg.inquiries; }, 0);
      var prevSum = prev.length ? prev.reduce(function (s, r) { return s + r.agg.inquiries; }, 0) : 0;
      if (prev.length && prevSum > 0) {
        var diff = (recentSum - prevSum) / prevSum;
        insights.push({
          kind: 'trend',
          title: (diff >= 0 ? '문의가 늘고 있습니다' : '문의가 줄고 있습니다') + ' (' + (diff >= 0 ? '+' : '') + Math.round(diff * 100) + '%)',
          body: '최근 2주 문의 ' + Utils.num(recentSum) + '건, 직전 2주 ' + Utils.num(prevSum) +
            '건입니다. ' + (diff >= 0 ? '지금 콘텐츠 형식을 유지하세요.' : '제목과 CTA를 먼저 바꿔 보세요.')
        });
      } else if (recentSum > 0) {
        insights.push({
          kind: 'trend',
          title: '최근 2주 문의 ' + Utils.num(recentSum) + '건',
          body: '비교할 이전 기간이 아직 없습니다. 2주 더 기록하면 추세를 계산합니다.'
        });
      }
    }

    var withData = byChannel.filter(function (c) { return c.rows > 0; });
    if (withData.length === 1) {
      insights.push({
        kind: 'channel',
        title: '채널이 하나뿐입니다',
        body: '한 채널에만 의존하면 변동이 큽니다. 인스타·블로그·콜드메일 중 하나를 이번 주에 추가해 비교해 보세요.'
      });
    }

    return { level: level, title: pack.title, detail: detail, actions: pack.actions, insights: insights, stages: stages };
  }

  /* ---------------- charts ---------------- */
  function svgFunnel(agg) {
    var rows = [
      { label: '노출', v: agg.impressions, color: '#E9C3A6' },
      { label: '클릭', v: agg.clicks, color: '#E3A26F' },
      { label: '문의', v: agg.inquiries, color: '#D9803F' },
      { label: '전환', v: agg.conversions, color: '#D96B27' }
    ];
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
    var parts = [];
    rows.forEach(function (r, i) {
      var y = 22 + i * 56;
      var w = r.v > 0 ? Math.max(10, Math.round(Math.sqrt(r.v / max) * 300)) : 4;
      parts.push('<text x="0" y="' + (y + 18) + '" class="chart-label">' + r.label + '</text>');
      parts.push('<rect x="62" y="' + y + '" width="' + w + '" height="28" rx="9" fill="' + r.color + '"></rect>');
      parts.push('<text x="' + (62 + w + 10) + '" y="' + (y + 19) + '" class="chart-value">' + Utils.num(r.v) + '</text>');
      if (i > 0) {
        var prev = rows[i - 1].v;
        var rate = prev ? r.v / prev : 0;
        parts.push('<text x="62" y="' + (y - 6) + '" class="chart-sub">' + Utils.pct(rate, 0) + ' 전환</text>');
      }
    });
    return '<svg viewBox="0 0 520 260" class="chart" role="img" aria-label="유입 퍼널">' + parts.join('') + '</svg>';
  }

  function svgChannels(byChannel) {
    var max = Math.max.apply(null, byChannel.map(function (c) { return Math.max(c.agg.inquiries, c.agg.conversions); }).concat([1]));
    var parts = ['<line x1="0" y1="214" x2="520" y2="214" stroke="#E4DACB" stroke-width="1"></line>'];
    byChannel.forEach(function (c, i) {
      var gx = 10 + i * 128;
      var hi = c.agg.inquiries ? Math.max(6, Math.round(c.agg.inquiries / max * 150)) : 0;
      var hc = c.agg.conversions ? Math.max(6, Math.round(c.agg.conversions / max * 150)) : 0;
      parts.push('<rect x="' + (gx + 22) + '" y="' + (214 - hi) + '" width="28" height="' + hi + '" rx="7" fill="#D96B27"></rect>');
      parts.push('<rect x="' + (gx + 58) + '" y="' + (214 - hc) + '" width="28" height="' + hc + '" rx="7" fill="#1E1E1E"></rect>');
      if (c.agg.inquiries) parts.push('<text x="' + (gx + 36) + '" y="' + (206 - hi) + '" class="chart-value" text-anchor="middle">' + Utils.num(c.agg.inquiries) + '</text>');
      if (c.agg.conversions) parts.push('<text x="' + (gx + 72) + '" y="' + (206 - hc) + '" class="chart-value" text-anchor="middle">' + Utils.num(c.agg.conversions) + '</text>');
      parts.push('<text x="' + (gx + 54) + '" y="238" class="chart-label" text-anchor="middle">' + Utils.escapeHtml(c.channel.short) + '</text>');
    });
    parts.push('<rect x="352" y="8" width="10" height="10" rx="3" fill="#D96B27"></rect><text x="368" y="17" class="chart-sub">문의</text>');
    parts.push('<rect x="410" y="8" width="10" height="10" rx="3" fill="#1E1E1E"></rect><text x="426" y="17" class="chart-sub">전환</text>');
    return '<svg viewBox="0 0 520 260" class="chart" role="img" aria-label="채널별 문의와 전환">' + parts.join('') + '</svg>';
  }

  function svgTrend(weekRows) {
    var rows = weekRows.slice().sort(function (a, b) { return a.week < b.week ? -1 : 1; }).slice(-8);
    if (!rows.length) return '';
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max(r.agg.inquiries, r.agg.conversions); }).concat([1]));
    var innerW = 460, x0 = 30, top = 30, bottom = 200;
    var step = rows.length > 1 ? innerW / (rows.length - 1) : 0;
    var parts = [];
    for (var g = 0; g <= 2; g++) {
      var gy = top + (bottom - top) * g / 2;
      parts.push('<line x1="' + x0 + '" y1="' + gy + '" x2="' + (x0 + innerW) + '" y2="' + gy + '" stroke="#EFE7DA" stroke-width="1"></line>');
      parts.push('<text x="0" y="' + (gy + 4) + '" class="chart-sub">' + Utils.num(Math.round(max * (1 - g / 2))) + '</text>');
    }
    function point(r, i, key) {
      var x = x0 + (rows.length > 1 ? step * i : innerW / 2);
      var y = bottom - (r.agg[key] / max) * (bottom - top);
      return { x: x, y: y, v: r.agg[key] };
    }
    var ptsInq = rows.map(function (r, i) { return point(r, i, 'inquiries'); });
    var ptsConv = rows.map(function (r, i) { return point(r, i, 'conversions'); });
    parts.push('<polyline fill="none" stroke="#D96B27" stroke-width="3" stroke-linejoin="round" points="' + ptsInq.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '"></polyline>');
    parts.push('<polyline fill="none" stroke="#1E1E1E" stroke-width="2.5" stroke-dasharray="5 5" points="' + ptsConv.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '"></polyline>');
    ptsInq.forEach(function (p, i) {
      parts.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="4.5" fill="#D96B27"></circle>');
      if (p.v) parts.push('<text x="' + p.x + '" y="' + (p.y - 10) + '" class="chart-value" text-anchor="middle">' + Utils.num(p.v) + '</text>');
      var w = rows[i].week;
      var d = new Date(w + 'T00:00:00');
      parts.push('<text x="' + p.x + '" y="226" class="chart-sub" text-anchor="middle">' + (d.getMonth() + 1) + '/' + d.getDate() + '</text>');
    });
    parts.push('<circle cx="336" cy="12" r="4" fill="#D96B27"></circle><text x="346" y="17" class="chart-sub">문의</text>');
    parts.push('<line x1="392" y1="12" x2="412" y2="12" stroke="#1E1E1E" stroke-width="2.5" stroke-dasharray="5 5"></line><text x="418" y="17" class="chart-sub">전환</text>');
    return '<svg viewBox="0 0 520 260" class="chart" role="img" aria-label="주간 문의·전환 추이">' + parts.join('') + '</svg>';
  }

  /* ---------------- render ---------------- */
  function render() {
    var list = filtered();
    var agg = aggregate(list);
    var byChannel = perChannel(list);
    var weeks = perWeek(list);
    var diag = diagnose(agg, byChannel, weeks, list);

    Utils.$('#sumImpressions').textContent = Utils.num(agg.impressions);
    Utils.$('#sumClicks').textContent = Utils.num(agg.clicks);
    Utils.$('#sumInquiries').textContent = Utils.num(agg.inquiries);
    Utils.$('#sumConversions').textContent = Utils.num(agg.conversions);
    Utils.$('#sumRates').textContent = '클릭률 ' + Utils.pct(agg.ctr) + ' · 문의율 ' + Utils.pct(agg.inquiryRate) + ' · 전환율 ' + Utils.pct(agg.closeRate);
    Utils.$('#sumRange').textContent = view.range === 'all' ? '전체 기간' : '최근 ' + view.range + '주';

    var d = Utils.$('#diagnosis');
    d.className = 'diagnosis level-' + diag.level;
    d.innerHTML =
      '<div class="diagnosis-head"><span class="diagnosis-badge">' +
      ({ good: '양호', warn: '주의', bad: '병목', empty: '대기' }[diag.level]) + '</span><h3>' +
      Utils.escapeHtml(diag.title) + '</h3></div>' +
      '<p class="diagnosis-detail">' + Utils.escapeHtml(diag.detail) + '</p>' +
      (diag.actions && diag.actions.length ? '<div class="diagnosis-actions">' + diag.actions.map(function (a) {
        return '<button class="action-card" data-goto="' + a.tab + '"><strong>' + Utils.escapeHtml(a.label) + '</strong>' +
          (a.why ? '<span>' + Utils.escapeHtml(a.why) + '</span>' : '') + '</button>';
      }).join('') + '</div>' : '');

    var insightsBox = Utils.$('#insights');
    if (diag.insights && diag.insights.length) {
      insightsBox.innerHTML = diag.insights.map(function (it) {
        return '<div class="insight"><span class="insight-kind">' + (it.kind === 'trend' ? '추세' : '채널') + '</span>' +
          '<strong>' + Utils.escapeHtml(it.title) + '</strong><p>' + Utils.escapeHtml(it.body) + '</p></div>';
      }).join('');
    } else {
      insightsBox.innerHTML = '<div class="insight"><p>데이터가 2주 이상 쌓이면 채널 비교와 추세 인사이트가 표시됩니다.</p></div>';
    }

    Utils.$('#chartFunnel').innerHTML = list.length ? svgFunnel(agg) : '<p class="chart-empty">데이터 없음</p>';
    Utils.$('#chartChannels').innerHTML = list.length ? svgChannels(byChannel) : '<p class="chart-empty">데이터 없음</p>';
    Utils.$('#chartTrend').innerHTML = list.length ? (svgTrend(weeks) || '<p class="chart-empty">2주 이상 입력하면 추이가 표시됩니다.</p>') : '<p class="chart-empty">데이터 없음</p>';

    renderTable();
    Utils.$('#metricRangeLabel').textContent = view.range === 'all' ? '전체' : '최근 ' + view.range + '주';
  }

  function renderTable() {
    var rows = Store.metricsSorted();
    var tbody = Utils.$('#metricRows');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-cell">아직 입력한 지표가 없습니다. 위에서 주간 지표를 추가해 보세요.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (m) {
      var c = channelById(m.channel);
      var imp = Number(m.impressions) || 0, clk = Number(m.clicks) || 0, inq = Number(m.inquiries) || 0, cnv = Number(m.conversions) || 0;
      return '<tr data-id="' + m.id + '">' +
        '<td><strong>' + Utils.formatWeek(m.week) + '</strong></td>' +
        '<td><span class="tag" style="border-color:' + c.color + ';color:' + c.color + '">' + Utils.escapeHtml(c.label) + '</span></td>' +
        '<td class="num-cell">' + Utils.num(imp) + '</td>' +
        '<td class="num-cell">' + Utils.num(clk) + '</td>' +
        '<td class="num-cell">' + Utils.num(inq) + '</td>' +
        '<td class="num-cell">' + Utils.num(cnv) + '</td>' +
        '<td class="num-cell">' + (imp ? Utils.pct(clk / imp) : '—') + '</td>' +
        '<td class="num-cell">' + (clk ? Utils.pct(inq / clk) : '—') + '</td>' +
        '<td class="row-actions"><button class="btn btn-tiny" data-metric-action="edit">수정</button>' +
        '<button class="btn btn-tiny btn-ghost" data-metric-action="delete">삭제</button></td>' +
        '</tr>';
    }).join('');
  }

  function readForm() {
    return {
      week: Utils.$('#metricWeek').value || Utils.mondayOf(),
      channel: Utils.$('#metricChannel').value,
      impressions: Math.max(0, parseInt(Utils.$('#metricImpressions').value, 10) || 0),
      clicks: Math.max(0, parseInt(Utils.$('#metricClicks').value, 10) || 0),
      inquiries: Math.max(0, parseInt(Utils.$('#metricInquiries').value, 10) || 0),
      conversions: Math.max(0, parseInt(Utils.$('#metricConversions').value, 10) || 0),
      note: Utils.$('#metricNote').value.trim()
    };
  }

  function resetForm() {
    view.editId = null;
    Utils.$('#metricWeek').value = Utils.mondayOf();
    Utils.$('#metricImpressions').value = '';
    Utils.$('#metricClicks').value = '';
    Utils.$('#metricInquiries').value = '';
    Utils.$('#metricConversions').value = '';
    Utils.$('#metricNote').value = '';
    Utils.$('#btnMetricSave').textContent = '지표 저장';
    Utils.$('#metricEditHint').hidden = true;
  }

  function save() {
    var data = readForm();
    if (data.week && new Date(data.week + 'T00:00:00').getDay() !== 1) {
      /* 월요일이 아니어도 저장은 하되, 주 시작일로 맞춰 안내 */
      Utils.toast('주 시작일은 월요일을 권장합니다. 입력한 날짜로 저장합니다.', 'warn');
    }
    if (view.editId) {
      Store.deleteMetric(view.editId);
    }
    var res = Store.upsertMetric(data);
    Utils.toast(res.updated ? '같은 주·채널 기록을 업데이트했습니다.' : '지표를 저장했습니다.', 'ok');
    resetForm();
    render();
  }

  function editRow(id) {
    var m = Store.metrics().filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    view.editId = id;
    Utils.$('#metricWeek').value = m.week;
    Utils.$('#metricChannel').value = m.channel;
    Utils.$('#metricImpressions').value = m.impressions;
    Utils.$('#metricClicks').value = m.clicks;
    Utils.$('#metricInquiries').value = m.inquiries;
    Utils.$('#metricConversions').value = m.conversions;
    Utils.$('#metricNote').value = m.note || '';
    Utils.$('#btnMetricSave').textContent = '수정 저장';
    Utils.$('#metricEditHint').hidden = false;
    Utils.$('#metricWeek').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function exportCSV() {
    var rows = Store.metricsSorted().map(function (m) {
      return [m.week, channelById(m.channel).label, m.impressions, m.clicks, m.inquiries, m.conversions, m.note];
    });
    if (!rows.length) { Utils.toast('내보낼 지표가 없습니다.', 'warn'); return; }
    var csv = Utils.toCSV(rows, ['week', 'channel', 'impressions', 'clicks', 'inquiries', 'conversions', 'note']);
    Utils.downloadText(csv, 'dangoal-metrics-' + Utils.todayISO() + '.csv', 'text/csv');
  }

  function importCSV(text) {
    var rows = Utils.parseCSV(text);
    if (!rows.length) { Utils.toast('CSV에 데이터가 없습니다.', 'warn'); return; }
    var header = rows[0].map(function (x) { return String(x).trim().toLowerCase(); });
    var idx = {
      week: header.indexOf('week'), channel: header.indexOf('channel'),
      impressions: header.indexOf('impressions'), clicks: header.indexOf('clicks'),
      inquiries: header.indexOf('inquiries'), conversions: header.indexOf('conversions'),
      note: header.indexOf('note')
    };
    var hasHeader = idx.week > -1 && idx.channel > -1;
    var dataRows = hasHeader ? rows.slice(1) : rows;
    if (!hasHeader) {
      idx = { week: 0, channel: 1, impressions: 2, clicks: 3, inquiries: 4, conversions: 5, note: 6 };
    }
    var ok = 0, fail = 0;
    dataRows.forEach(function (r) {
      var week = String(r[idx.week] || '').trim();
      var ch = channelFromInput(r[idx.channel]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !ch) { fail++; return; }
      Store.upsertMetric({
        week: Utils.mondayOf(week), channel: ch.id,
        impressions: parseInt(r[idx.impressions], 10) || 0,
        clicks: parseInt(r[idx.clicks], 10) || 0,
        inquiries: parseInt(r[idx.inquiries], 10) || 0,
        conversions: parseInt(r[idx.conversions], 10) || 0,
        note: idx.note > -1 ? String(r[idx.note] || '').trim() : ''
      });
      ok++;
    });
    render();
    Utils.toast(ok + '건을 가져왔습니다.' + (fail ? ' ' + fail + '건은 형식이 맞지 않아 건너뛰었습니다.' : ''), fail ? 'warn' : 'ok');
  }

  function fillSample() {
    if (Store.metrics().length) {
      if (!window.confirm('이미 입력된 지표가 있습니다. 같은 주·채널 항목은 예시 값으로 덮어씁니다. 계속할까요?')) return;
    }
    Store.sampleMetrics().forEach(function (m) { Store.upsertMetric(m); });
    render();
    Utils.toast('예시 지표 18건을 채웠습니다. 실제 수치가 아니니 확인 후 수정하세요.', 'warn');
  }

  function bind() {
    var form = Utils.$('#metricForm');
    if (!form) return;
    Utils.$('#metricWeek').value = Utils.mondayOf();
    Utils.$('#metricChannel').value = Store.prefs().metricChannel || 'instagram';

    form.addEventListener('submit', function (e) { e.preventDefault(); save(); });
    Utils.$('#btnMetricReset').addEventListener('click', resetForm);
    Utils.$('#btnMetricSample').addEventListener('click', fillSample);
    Utils.$('#btnMetricExport').addEventListener('click', exportCSV);
    Utils.$('#btnMetricImport').addEventListener('click', function () { Utils.$('#metricFile').click(); });
    Utils.$('#metricFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { importCSV(String(reader.result || '')); };
      reader.readAsText(f, 'utf-8');
      e.target.value = '';
    });
    Utils.$('#metricRange').addEventListener('change', function (e) {
      view.range = e.target.value;
      render();
    });
    Utils.$('#metricRows').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-metric-action]');
      if (!btn) return;
      var tr = btn.closest('tr');
      var id = tr.dataset.id;
      if (btn.dataset.metricAction === 'edit') editRow(id);
      else {
        if (window.confirm('이 지표를 삭제할까요?')) {
          Store.deleteMetric(id);
          render();
          Utils.toast('지표를 삭제했습니다.', 'ok');
        }
      }
    });
    render();
  }

  return { bind: bind, render: render, diagnose: diagnose, aggregate: aggregate };
})();
