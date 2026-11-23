/* 카드뉴스 제작기 — HTML5 Canvas, 1080×1080, 5장(표지/문제/3무/작동/CTA) */
'use strict';

var CardNews = (function () {
  var FONT = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif';
  var W = 1080, H = 1080, PAD = 96;
  var C = BRAND.colors;

  var view = { slides: [], active: 0, data: null };

  function targetById(id) {
    return TARGETS.filter(function (t) { return t.id === id; })[0] || TARGETS[0];
  }
  function segmentById(t, id) {
    return (t.segments || []).filter(function (s) { return s.id === id; })[0] || t.segments[0];
  }

  function setFont(ctx, size, weight) {
    ctx.font = (weight || 500) + ' ' + size + 'px ' + FONT;
  }

  function wrapLines(ctx, text, maxWidth) {
    var out = [];
    String(text == null ? '' : text).split('\n').forEach(function (paragraph) {
      if (!paragraph) { out.push(''); return; }
      var words = paragraph.split(/\s+/);
      var line = '';
      words.forEach(function (word) {
        var test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          out.push(line);
          line = word;
        } else {
          line = test;
        }
      });
      if (line) out.push(line);
    });
    return out;
  }

  function wrapChars(ctx, text, maxWidth) {
    var out = [], line = '';
    String(text).split('').forEach(function (ch) {
      var test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = ch;
      } else line = test;
    });
    if (line) out.push(line);
    return out;
  }

  /* opts: size, weight, color, lh, maxWidth, maxLines, align, x */
  function textBlock(ctx, text, x, y, opts) {
    opts = opts || {};
    var size = opts.size || 32, weight = opts.weight || 500;
    var lh = opts.lh || Math.round(size * 1.35);
    var maxWidth = opts.maxWidth || (W - PAD * 2);
    var align = opts.align || 'left';
    var color = opts.color || C.dark;
    setFont(ctx, size, weight);
    var lines = opts.noWrap ? [String(text)] : wrapLines(ctx, text, maxWidth);
    lines = lines.reduce(function (acc, ln) {
      if (ctx.measureText(ln).width > maxWidth) return acc.concat(wrapChars(ctx, ln, maxWidth));
      acc.push(ln);
      return acc;
    }, []);
    if (opts.maxLines && lines.length > opts.maxLines) {
      lines = lines.slice(0, opts.maxLines);
      var last = lines[lines.length - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = last + '…';
    }
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    /* left/right: x가 기준선(왼쪽 끝 또는 오른쪽 끝), center: x가 왼쪽 끝 */
    var px = align === 'center' ? (x + maxWidth / 2) : x;
    lines.forEach(function (ln, i) { ctx.fillText(ln, px, y + i * lh); });
    ctx.textAlign = 'left';
    return lines.length * lh;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawLogo(ctx, y, dark) {
    var x = PAD, s = 56;
    ctx.fillStyle = C.orange;
    roundRect(ctx, x, y, s, s, 16); ctx.fill();
    ctx.fillStyle = C.dark;
    roundRect(ctx, x + 11, y + 19, 34, 19, 9.5); ctx.fill();
    ctx.fillStyle = dark ? C.dark : C.cream;
    ctx.beginPath(); ctx.arc(x + 38, y + 28.5, 5.5, 0, Math.PI * 2); ctx.fill();
    setFont(ctx, 33, 800);
    ctx.fillStyle = dark ? C.cream : C.dark;
    ctx.textBaseline = 'middle';
    ctx.fillText('dangoal', x + 72, y + 29);
    ctx.textBaseline = 'top';

    /* 우측 pill */
    var label = '단골 스탬프 챌린지';
    setFont(ctx, 21, 600);
    var tw = ctx.measureText(label).width;
    var pw = tw + 40, ph = 44;
    var px = W - PAD - pw, py = y + 6;
    ctx.fillStyle = dark ? 'rgba(246,242,235,0.10)' : C.orangeTint;
    roundRect(ctx, px, py, pw, ph, 22); ctx.fill();
    ctx.fillStyle = C.orangeLight;
    ctx.textAlign = 'center';
    ctx.fillText(label, px + pw / 2, py + ph / 2 + 1);
    ctx.textAlign = 'left';
  }

  function drawFooter(ctx, index, dark) {
    setFont(ctx, 22, 500);
    ctx.fillStyle = dark ? 'rgba(246,242,235,0.55)' : C.gray;
    ctx.textBaseline = 'top';
    ctx.fillText('dangoal.com/apply' + (BRAND.contact.phone ? '  ·  ' + BRAND.contact.phone : ''), PAD, H - 58);
    ctx.textAlign = 'right';
    ctx.fillText((index + 1) + ' / 5', W - PAD, H - 58);
    ctx.textAlign = 'left';
  }

  function background(ctx, dark) {
    ctx.fillStyle = dark ? C.dark : C.cream;
    ctx.fillRect(0, 0, W, H);
    if (!dark) {
      ctx.fillStyle = '#F1E9DC';
      ctx.beginPath(); ctx.arc(W - 40, -30, 330, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-60, H + 40, 220, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(217,107,39,0.14)';
      ctx.beginPath(); ctx.arc(W + 60, H - 40, 360, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawFlower(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52, r * 0.40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx.fill();
  }

  function card(ctx, x, y, w, h, opts) {
    opts = opts || {};
    ctx.save();
    ctx.shadowColor = 'rgba(30,30,30,0.07)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = opts.fill || C.white;
    roundRect(ctx, x, y, w, h, opts.r || 26);
    ctx.fill();
    ctx.restore();
    if (opts.stroke) {
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, w, h, opts.r || 26);
      ctx.stroke();
    }
  }

  /* ---------------- slides ---------------- */
  function slideCover(ctx, d, i) {
    background(ctx, false);
    drawLogo(ctx, 84, false);
    textBlock(ctx, '단골 스탬프 챌린지', PAD, 232, { size: 28, weight: 700, color: C.orange, lh: 36 });
    var y = 286;
    y += textBlock(ctx, d.headline1, PAD, y, { size: 74, weight: 800, color: C.dark, lh: 90, maxLines: 2, maxWidth: 888 });
    y += 4;
    y += textBlock(ctx, d.headline2, PAD, y, { size: 74, weight: 800, color: C.orange, lh: 90, maxLines: 2, maxWidth: 888 });
    y += 22;
    textBlock(ctx, d.sub, PAD, y, { size: 29, weight: 500, color: C.gray, lh: 42, maxLines: 2, maxWidth: 820 });

    var cy = Math.max(y + 84, 748);
    var ch = 172;
    if (cy + ch > H - 96) cy = H - 96 - ch;
    card(ctx, PAD, cy, W - PAD * 2, ch, { fill: C.white, r: 28, stroke: C.line });
    textBlock(ctx, '챌린지 스탬프', PAD + 36, cy + 30, { size: 23, weight: 600, color: C.gray, lh: 30 });
    textBlock(ctx, '3 / 5', PAD + 36, cy + 66, { size: 46, weight: 800, color: C.dark, lh: 54 });
    var sx = PAD + 232, sy = cy + 64, sr = 27;
    for (var k = 0; k < 5; k++) {
      if (k < 3) drawFlower(ctx, sx + k * 76, sy, sr, C.orange);
      else {
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(sx + k * 76, sy, sr * 0.82, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    textBlock(ctx, '2개 더 모으면 완주 리워드', PAD + 36, cy + 126, { size: 22, weight: 500, color: C.gray, lh: 30, maxWidth: 480 });
    textBlock(ctx, '남은 자리 7', W - PAD - 36, cy + 126, { size: 22, weight: 700, color: C.orange, lh: 30, align: 'right', maxWidth: 220 });
    drawFooter(ctx, i, false);
  }

  function slideProblem(ctx, d, i) {
    background(ctx, false);
    drawLogo(ctx, 84, false);
    textBlock(ctx, 'WHY', PAD, 232, { size: 26, weight: 800, color: C.orange, lh: 34 });
    textBlock(ctx, d.problemTitle, PAD, 276, { size: 58, weight: 800, color: C.dark, lh: 72, maxLines: 2, maxWidth: 860 });

    var y = 430, h = 156, gap = 18;
    d.problems.forEach(function (p, idx) {
      card(ctx, PAD, y, W - PAD * 2, h, { fill: C.white, r: 24, stroke: C.line });
      textBlock(ctx, '0' + (idx + 1), PAD + 34, y + 26, { size: 24, weight: 800, color: C.orange, lh: 30 });
      textBlock(ctx, p, PAD + 104, y + 24, { size: 33, weight: 600, color: C.dark, lh: 44, maxLines: 3, maxWidth: 720 });
      y += h + gap;
    });

    textBlock(ctx, '손님이 다시 올 이유는, 생각보다 자주 사라집니다.', PAD, 950, { size: 25, weight: 500, color: C.gray, lh: 34, maxWidth: 880 });
    drawFooter(ctx, i, false);
  }

  function slideHooks(ctx, d, i) {
    background(ctx, false);
    drawLogo(ctx, 84, false);
    textBlock(ctx, 'HOW · 3무 부담', PAD, 232, { size: 26, weight: 800, color: C.orange, lh: 34 });
    textBlock(ctx, "'3무' 부담으로 시작하세요", PAD, 276, { size: 56, weight: 800, color: C.dark, lh: 70, maxLines: 1, maxWidth: 880 });

    var y = 372, h = 184, gap = 14;
    d.hooks.forEach(function (hk) {
      card(ctx, PAD, y, W - PAD * 2, h, { fill: C.white, r: 26, stroke: C.line });
      ctx.fillStyle = C.orangeSoft;
      roundRect(ctx, PAD + 28, y + 46, 92, 92, 24); ctx.fill();
      setFont(ctx, 44, 800);
      ctx.fillStyle = C.orange;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('無', PAD + 74, y + 93);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      var x = PAD + 148, w = 700;
      textBlock(ctx, hk.mu, x, y + 30, { size: 23, weight: 800, color: C.orangeLight, lh: 30, maxWidth: w });
      textBlock(ctx, hk.name, x, y + 66, { size: 31, weight: 700, color: C.dark, lh: 40, maxLines: 2, maxWidth: w });
      textBlock(ctx, hk.short, x, y + 146, { size: 24, weight: 500, color: C.gray, lh: 32, maxWidth: w });
      y += h + gap;
    });
    drawFooter(ctx, i, false);
  }

  function slideHow(ctx, d, i) {
    background(ctx, false);
    drawLogo(ctx, 84, false);
    textBlock(ctx, '3 STEPS', PAD, 232, { size: 26, weight: 800, color: C.orange, lh: 34 });
    textBlock(ctx, '이렇게 작동합니다', PAD, 276, { size: 56, weight: 800, color: C.dark, lh: 70 });

    var steps = [
      { n: '1', title: '챌린지 요청', desc: '기간·미션·목표 스탬프·선착순 인원을 정해 요청합니다.' },
      { n: '2', title: '챌린지 생성 및 운영', desc: '현장 QR + GPS 인증으로 챌린지 스탬프가 쌓입니다.' },
      { n: '3', title: '결과 리포트 발행', desc: '미션별 참여율·달성자 수를 직접 확인합니다.' }
    ];
    var y = 392;
    steps.forEach(function (s) {
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(PAD + 34, y + 34, 34, 0, Math.PI * 2); ctx.fill();
      setFont(ctx, 30, 800);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.n, PAD + 34, y + 35);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      textBlock(ctx, s.title, PAD + 92, y, { size: 36, weight: 700, color: C.dark, lh: 46, maxWidth: 780 });
      textBlock(ctx, s.desc, PAD + 92, y + 50, { size: 25, weight: 500, color: C.gray, lh: 34, maxWidth: 760 });
      y += 118;
    });

    textBlock(ctx, '미션 예시', PAD, 758, { size: 23, weight: 700, color: C.orange, lh: 30 });
    drawChips(ctx, d.missions, PAD, 800, 844, 24, 48);

    textBlock(ctx, '*기존 단골 스탬프 카드와 별개로 쌓입니다.', PAD, 920, { size: 21, weight: 500, color: C.gray, lh: 28, maxWidth: 880 });
    drawFooter(ctx, i, false);
  }

  function drawChips(ctx, items, x, y, maxWidth, fontSize, h) {
    var cx = x, cy = y, gap = 10;
    items.slice(0, 6).forEach(function (item) {
      setFont(ctx, fontSize, 600);
      var tw = ctx.measureText(item).width;
      var w = Math.min(tw + 44, maxWidth);
      if (cx + w > x + maxWidth) { cx = x; cy += h + gap; }
      ctx.fillStyle = C.white;
      roundRect(ctx, cx, cy, w, h, h / 2); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
      roundRect(ctx, cx, cy, w, h, h / 2); ctx.stroke();
      ctx.fillStyle = C.dark;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item, cx + w / 2, cy + h / 2 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      cx += w + gap;
    });
    return cy + h;
  }

  function slideCTA(ctx, d, i) {
    background(ctx, true);
    drawLogo(ctx, 84, true);
    textBlock(ctx, 'START', PAD, 250, { size: 26, weight: 800, color: C.orangeLight, lh: 34 });
    var y = 300;
    y += textBlock(ctx, d.ctaTitle, PAD, y, { size: 68, weight: 800, color: C.cream, lh: 84, maxLines: 2, maxWidth: 880 });
    y += 26;
    textBlock(ctx, d.sub, PAD, y, { size: 26, weight: 500, color: 'rgba(246,242,235,0.72)', lh: 38, maxLines: 2, maxWidth: 800 });

    var by = 690;
    setFont(ctx, 32, 700);
    var label = d.ctaBody || '단골 스탬프 챌린지 시작하기';
    var bw = Math.min(ctx.measureText(label).width + 84, 880);
    ctx.fillStyle = C.orange;
    roundRect(ctx, PAD, by, bw, 92, 46); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, PAD + bw / 2, by + 47);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    textBlock(ctx, 'dangoal.com/apply', PAD, 828, { size: 42, weight: 800, color: C.cream, lh: 52 });
    var contactLine = [
      BRAND.contact.phone ? '문의 ' + BRAND.contact.phone : '',
      BRAND.contact.email || ''
    ].filter(Boolean).join('  ·  ');
    textBlock(ctx, contactLine || '2분 진단에서 신청할 수 있습니다', PAD, 892, { size: 26, weight: 500, color: 'rgba(246,242,235,0.75)', lh: 34, maxWidth: 880 });
    textBlock(ctx, BRAND.price.short, PAD, 946, { size: 21, weight: 500, color: 'rgba(246,242,235,0.55)', lh: 30, maxWidth: 880 });
    drawFooter(ctx, i, true);
  }

  /* ---------------- render ---------------- */
  function buildData() {
    var t = targetById(Utils.$('#cardTarget').value);
    var s = segmentById(t, Utils.$('#cardSegment').value);
    var lines = Utils.$('#cardProblems').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    while (lines.length < 3) lines.push(t.pains[lines.length]);
    var missions = Utils.$('#cardMissions').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!missions.length) missions = s.missions.slice();
    var hooks = t.hooks.map(function (h, idx) {
      var name = Utils.$('#cardHookName' + (idx + 1)).value.trim();
      var short = Utils.$('#cardHookShort' + (idx + 1)).value.trim();
      return { mu: h.mu, name: name || h.name, short: short || h.short };
    });
    return {
      headline1: Utils.$('#cardH1').value.trim() || t.cardDefaults.headline1,
      headline2: Utils.$('#cardH2').value.trim() || t.cardDefaults.headline2,
      sub: Utils.$('#cardSub').value.trim() || t.cardDefaults.sub,
      problemTitle: t.cardTitle,
      problems: lines.slice(0, 3),
      hooks: hooks,
      missions: missions.slice(0, 6),
      ctaTitle: Utils.$('#cardCtaTitle').value.trim() || t.cardDefaults.ctaTitle,
      ctaBody: Utils.$('#cardCtaBody').value.trim() || t.cardDefaults.ctaBody,
      targetId: t.id,
      segmentId: s.id
    };
  }

  function makeCanvas() {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    return c;
  }

  function render() {
    var d = buildData();
    view.data = d;
    var drawers = [slideCover, slideProblem, slideHooks, slideHow, slideCTA];
    view.slides = drawers.map(function (fn, i) {
      var c = makeCanvas();
      var ctx = c.getContext('2d');
      fn(ctx, d, i);
      return c;
    });
    view.active = Utils.clamp(view.active, 0, 4);
    paintPreview();
    paintThumbs();
  }

  function paintPreview() {
    var pc = Utils.$('#cardPreview');
    if (!pc) return;
    pc.width = W; pc.height = H;
    var ctx = pc.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    if (view.slides[view.active]) ctx.drawImage(view.slides[view.active], 0, 0);
    Utils.$('#cardSlideLabel').textContent = ['표지', '문제제기', '3무 해결책', '작동방식', 'CTA'][view.active] + ' · ' + (view.active + 1) + '/5';
  }

  function paintThumbs() {
    var box = Utils.$('#cardThumbs');
    if (!box) return;
    box.innerHTML = '';
    var names = ['표지', '문제', '3무', '작동', 'CTA'];
    view.slides.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'thumb' + (i === view.active ? ' is-active' : '');
      btn.type = 'button';
      var tc = document.createElement('canvas');
      tc.width = 216; tc.height = 216;
      tc.getContext('2d').drawImage(c, 0, 0, 216, 216);
      btn.appendChild(tc);
      var cap = document.createElement('span');
      cap.textContent = names[i];
      btn.appendChild(cap);
      btn.addEventListener('click', function () {
        view.active = i;
        paintPreview();
        paintThumbs();
      });
      box.appendChild(btn);
    });
  }

  function downloadSlide(idx) {
    if (!view.slides[idx]) return;
    var names = ['cover', 'problem', '3mu', 'how', 'cta'];
    view.slides[idx].toBlob(function (blob) {
      if (!blob) { Utils.toast('이미지를 만들지 못했습니다.', 'warn'); return; }
      Utils.downloadBlob(blob, 'dangoal-cardnews-' + (idx + 1) + '-' + names[idx] + '.png');
    }, 'image/png');
  }

  function downloadAllSlides() {
    if (!view.slides.length) return;
    Utils.toast('슬라이드 5장을 차례로 저장합니다.', 'ok');
    view.slides.forEach(function (c, i) {
      setTimeout(function () {
        c.toBlob(function (blob) {
          if (!blob) return;
          var names = ['cover', 'problem', '3mu', 'how', 'cta'];
          Utils.downloadBlob(blob, 'dangoal-cardnews-' + (i + 1) + '-' + names[i] + '.png');
        }, 'image/png');
      }, i * 450);
    });
  }

  function downloadCombined() {
    if (!view.slides.length) return;
    var c = document.createElement('canvas');
    c.width = W; c.height = H * view.slides.length;
    var ctx = c.getContext('2d');
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, c.width, c.height);
    view.slides.forEach(function (s, i) { ctx.drawImage(s, 0, i * H); });
    c.toBlob(function (blob) {
      if (!blob) { Utils.toast('이미지를 만들지 못했습니다.', 'warn'); return; }
      Utils.downloadBlob(blob, 'dangoal-cardnews-all-5.png');
    }, 'image/png');
  }

  function fillFromTarget() {
    var t = targetById(Utils.$('#cardTarget').value);
    var s = segmentById(t, t.segments[0].id);
    var segSel = Utils.$('#cardSegment');
    segSel.innerHTML = t.segments.map(function (x) {
      return '<option value="' + x.id + '">' + Utils.escapeHtml(x.label) + '</option>';
    }).join('');
    Utils.$('#cardH1').value = t.cardDefaults.headline1;
    Utils.$('#cardH2').value = t.cardDefaults.headline2;
    Utils.$('#cardSub').value = t.cardDefaults.sub;
    Utils.$('#cardCtaTitle').value = t.cardDefaults.ctaTitle;
    Utils.$('#cardCtaBody').value = t.cardDefaults.ctaBody;
    Utils.$('#cardProblems').value = t.pains.join('\n');
    t.hooks.forEach(function (h, i) {
      Utils.$('#cardHookName' + (i + 1)).value = h.name;
      Utils.$('#cardHookShort' + (i + 1)).value = h.short;
    });
    Utils.$('#cardMissions').value = (t.cardDefaults.missions || s.missions).join(', ');
  }

  function fillFromSegment() {
    var t = targetById(Utils.$('#cardTarget').value);
    var s = segmentById(t, Utils.$('#cardSegment').value);
    Utils.$('#cardMissions').value = s.missions.join(', ');
  }

  function bind() {
    var form = Utils.$('#cardForm');
    if (!form) return;
    fillFromTarget();
    var refresh = Utils.debounce(render, 180);
    form.addEventListener('input', refresh);
    form.addEventListener('change', function (e) {
      if (e.target.id === 'cardTarget') { fillFromTarget(); refresh(); }
      else if (e.target.id === 'cardSegment') { fillFromSegment(); refresh(); }
      else refresh();
    });
    Utils.$('#btnCardRefill').addEventListener('click', function () {
      fillFromTarget();
      render();
      Utils.toast('타겟 기본 문구로 채웠습니다.', 'ok');
    });
    Utils.$('#btnCardDownload').addEventListener('click', function () { downloadSlide(view.active); });
    Utils.$('#btnCardDownloadAll').addEventListener('click', downloadAllSlides);
    Utils.$('#btnCardDownloadCombined').addEventListener('click', downloadCombined);
    render();
  }

  return { bind: bind, render: render, downloadSlide: downloadSlide, downloadCombined: downloadCombined };
})();
