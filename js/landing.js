/* 상세페이지(랜딩) 빌더 — 섹션 카피 생성 + 단독 배포 가능한 HTML 코드 */
'use strict';

var Landing = (function () {
  var CSS = `
:root{--cream:#F6F2EB;--cream2:#EFE7DA;--orange:#D96B27;--orange2:#E07A38;--soft:#F6E2D3;--tint:#FBF3EA;--ink:#1E1E1E;--gray:#6E6558;--line:#E4DACB;--white:#fff;--radius:26px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--cream);color:var(--ink);font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","맑은 고딕",sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;word-break:keep-all}
img{max-width:100%}
a{color:inherit}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--orange)}
.eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--orange)}
h1,h2,h3{margin:0;line-height:1.2;letter-spacing:-.02em;font-weight:800}
h1{font-size:clamp(34px,5vw,62px)}
h2{font-size:clamp(26px,3.6vw,42px)}
h3{font-size:clamp(18px,2vw,22px)}
p{margin:0}
.lead{font-size:clamp(16px,1.5vw,19px);color:var(--gray)}
.nav{position:sticky;top:0;z-index:10;background:rgba(246,242,235,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav-in{display:flex;align-items:center;justify-content:space-between;gap:16px;height:72px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;text-decoration:none;font-size:19px}
.mark{width:34px;height:34px;border-radius:11px;background:var(--orange);position:relative;flex:none}
.mark::before{content:"";position:absolute;left:7px;top:12px;width:20px;height:11px;border-radius:6px;background:var(--ink)}
.mark::after{content:"";position:absolute;right:8px;top:15px;width:5px;height:5px;border-radius:50%;background:var(--cream)}
.nav .cta{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:var(--cream);text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:999px}
.hero{padding:clamp(56px,7vw,96px) 0 clamp(40px,5vw,64px);position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-160px;top:-180px;width:520px;height:520px;border-radius:50%;background:var(--cream2);z-index:0}
.hero .wrap{position:relative;z-index:1}
.hero h1{margin:18px 0 20px;max-width:860px}
.hero h1 em{font-style:normal;color:var(--orange)}
.hero .lead{max-width:640px}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;font-weight:700;border-radius:999px;padding:15px 26px;font-size:15px;border:1.5px solid transparent;transition:transform .15s ease}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:var(--orange);color:#fff}
.btn-dark{background:var(--ink);color:var(--cream)}
.btn-ghost{border-color:var(--ink);color:var(--ink);background:transparent}
.hero-note{margin-top:16px;font-size:13px;color:var(--gray)}
.stats{background:var(--white);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:32px 0}
.stat b{display:block;font-size:clamp(24px,3vw,34px);font-weight:800;letter-spacing:-.03em}
.stat span{font-size:13px;color:var(--gray)}
.stats small{display:block;padding:0 0 18px;font-size:12px;color:var(--gray)}
section{padding:clamp(56px,7vw,96px) 0}
.sec-head{max-width:720px;margin-bottom:36px}
.sec-head .eyebrow{margin-bottom:14px}
.sec-head p{margin-top:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.card{background:var(--white);border:1.5px solid var(--line);border-radius:var(--radius);padding:28px}
.card .num{font-size:13px;font-weight:800;color:var(--orange);letter-spacing:.1em}
.card h3{margin:10px 0 8px}
.card p{font-size:15px;color:var(--gray)}
.problem .card h3{font-size:19px}
.problem-close{margin-top:26px;font-weight:700;font-size:17px;color:var(--ink)}
.mu-card{position:relative;overflow:hidden}
.mu-card .badge{width:52px;height:52px;border-radius:16px;background:var(--soft);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:var(--orange)}
.mu-card .mu{display:block;margin:16px 0 6px;font-size:13px;font-weight:800;color:var(--orange2);letter-spacing:.02em}
.mu-card p{font-size:14.5px}
.proof{margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);font-size:12px;color:var(--gray)}
.how{background:var(--cream2)}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;counter-reset:step}
.step{background:var(--white);border-radius:var(--radius);padding:26px;border:1.5px solid var(--line)}
.step .n{width:40px;height:40px;border-radius:50%;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin-bottom:16px}
.step h3{font-size:18px;margin-bottom:8px}
.step p{font-size:14.5px;color:var(--gray)}
.mission-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start}
.table-wrap{background:var(--white);border:1.5px solid var(--line);border-radius:var(--radius);overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:14.5px}
th,td{text-align:left;padding:16px 20px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;letter-spacing:.08em;color:var(--gray);background:var(--tint);font-weight:800}
tr:last-child td{border-bottom:0}
td.stamp{white-space:nowrap;color:var(--orange);font-weight:800}
.side{background:var(--ink);color:var(--cream);border-radius:var(--radius);padding:30px}
.side h3{color:var(--cream);font-size:20px;margin-bottom:14px}
.side ul{margin:0;padding-left:18px;font-size:14.5px;line-height:2}
.side .pill{display:inline-block;margin-top:18px;padding:7px 14px;border-radius:999px;background:rgba(246,242,235,.12);font-size:12.5px}
.note{margin-top:18px;font-size:12.5px;color:var(--gray)}
.quote{background:var(--white);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.quote-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.quote-card{background:var(--tint);border:1.5px solid var(--soft);border-radius:var(--radius);padding:34px}
.quote-card .big{font-size:clamp(22px,2.6vw,30px);font-weight:800;line-height:1.35;margin-bottom:10px}
.quote-card .sub{color:var(--gray);font-size:14.5px}
.checks{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:10px}
.checks li{padding-left:28px;position:relative;font-size:14.5px}
.checks li::before{content:"✓";position:absolute;left:0;top:0;color:var(--orange);font-weight:800}
.faq details{background:var(--white);border:1.5px solid var(--line);border-radius:18px;padding:18px 22px;margin-bottom:10px}
.faq summary{cursor:pointer;font-weight:700;font-size:15.5px;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";float:right;color:var(--orange);font-weight:800}
.faq details[open] summary::after{content:"–"}
.faq details p{margin-top:12px;font-size:14.5px;color:var(--gray)}
.final{background:var(--ink);color:var(--cream)}
.final .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:28px}
.final h2{max-width:620px}
.final p{margin-top:12px;color:rgba(246,242,235,.7);font-size:14.5px}
.final .btn-primary{color:#fff}
footer{background:var(--cream);padding:44px 0;border-top:1px solid var(--line)}
footer .foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:18px;font-size:13px;color:var(--gray)}
footer a{text-decoration:none;color:var(--gray)}
@media(max-width:860px){.grid3,.steps{grid-template-columns:1fr}.mission-grid,.quote-grid{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}.nav .cta span{display:none}}
@media(max-width:560px){.card{padding:22px}.hero-actions .btn{width:100%}}
`;

  function h(s) { return Utils.escapeHtml(s); }

  function targetById(id) { return TARGETS.filter(function (t) { return t.id === id; })[0] || TARGETS[0]; }
  function segmentById(t, id) { return (t.segments || []).filter(function (s) { return s.id === id; })[0] || t.segments[0]; }
  function conceptById(id) { return CHALLENGE_CONCEPTS.filter(function (c) { return c.id === id; })[0] || CHALLENGE_CONCEPTS[0]; }

  function readState() {
    var t = targetById(Utils.$('#landTarget').value);
    var s = segmentById(t, Utils.$('#landSegment').value);
    return {
      targetId: t.id,
      segmentId: s.id,
      name: Utils.$('#landName').value.trim() || (t.id === 'event' ? '우리 행사' : '우리 매장'),
      region: Utils.$('#landRegion').value.trim(),
      conceptId: Utils.$('#landConcept').value,
      tone: Utils.$('#landTone').value,
      goal: Utils.$('#landGoal').value
    };
  }

  var TONE_COPY = {
    plain: {
      lead: function (c) { return c.tagline; },
      problemLead: '지금, 이런 일이 반복되고 있습니다.',
      quoteLead: '규모를 확인한 뒤 맞춤 견적을 드립니다.'
    },
    warm: {
      lead: function (c) { return c.tagline + ' 준비는 저희가 하고, 사장님은 기간과 경품만 정하시면 됩니다.'; },
      problemLead: '사장님이 이미 알고 계신 그 문제부터 짚었습니다.',
      quoteLead: '부담 없이 시작하실 수 있게, 규모에 맞춰 안내드립니다.'
    },
    number: {
      lead: function (c) { return '가입 손님 500+, 사용 가게 10곳이 함께하는 방식입니다. ' + c.tagline; },
      problemLead: '숫자로 보면, 다시 오지 않는 손님이 가장 큰 손실입니다.',
      quoteLead: '기본료 없이 쓴 만큼만. 금액은 규모에 맞춰 별도 안내드립니다.'
    }
  };

  function applyHref(t) {
    var sep = t.applyUrl.indexOf('?') > -1 ? '&' : '?';
    return t.applyUrl + sep + 'src=landing-app';
  }

  function build(s) {
    var t = targetById(s.targetId);
    var seg = segmentById(t, s.segmentId);
    var c = conceptById(s.conceptId);
    var tone = TONE_COPY[s.tone] || TONE_COPY.plain;
    var apply = applyHref(t);
    var name = s.name;
    var phone = BRAND.contact.phone || '';
    var email = BRAND.contact.email || '';
    var sender = BRAND.contact.senderName || '';
    var company = BRAND.contact.company || '단골';
    var tel = BRAND.contact.tel || phone.replace(/[^0-9+]/g, '');
    var heroPhone = phone
      ? '<a class="btn btn-ghost" href="tel:' + h(tel) + '">전화 ' + h(phone) + '</a>'
      : '';
    var finalMail = email
      ? '<a class="btn btn-ghost" style="border-color:rgba(246,242,235,.5);color:var(--cream)" href="mailto:' + h(email) + '">이메일 문의</a>'
      : '';
    var footContact = [phone, email].filter(Boolean).join(' · ') || '문의는 2분 진단 신청으로 받습니다.';
    var regionLine = s.region ? t.id === 'event' ? s.region + '에서 열리는' : s.region + '의' : '';
    var siteTitle = name + ' · 단골 스탬프 챌린지';
    var metaDesc = name + '의 단골 스탬프 챌린지. QR 하나로 손님은 앱 설치 없이 참여하고, 사장님은 기기 없이 방문 기록을 받습니다.';

    var problems = [seg.pain].concat(t.pains.filter(function (p) { return p !== seg.pain; })).slice(0, 3);
    var missions = c.missions;
    var heroSub = tone.lead(c);

    var faq = [
      {
        q: '기기가 따로 필요한가요?',
        a: '아니요. 매장(부스)에 QR 한 장을 두면 됩니다. POS 연동이나 적립 기기, 종이 쿠폰은 필요하지 않습니다.'
      },
      {
        q: '손님이 앱을 설치해야 하나요?',
        a: '아니요. 손님은 QR을 찍고 휴대폰 번호로 시작합니다. 처음 한 번만 가입하면 이후에는 스캔만 하면 됩니다.'
      },
      {
        q: '가격은 얼마인가요?',
        a: BRAND.price.headline + '. ' + BRAND.price.body
      },
      {
        q: '기존 단골 스탬프 카드와 함께 쓸 수 있나요?',
        a: '챌린지 스탬프는 기존 단골 스탬프 카드와 별개로 쌓입니다. 두 적립은 서로 합산되지 않습니다.'
      },
      {
        q: '개인정보는 어떻게 관리하나요?',
        a: '참여 동의와 마케팅 동의를 나눠 받고, 필요한 정보만 동의 기반으로 모읍니다. 매장·부스에는 마스킹된 정보만 전달됩니다.'
      }
    ];

    var statsHtml = BRAND.stats.map(function (st) {
      return '<div class="stat"><b>' + h(st.num) + '</b><span>' + h(st.label) + '</span></div>';
    }).join('');

    var problemCards = problems.map(function (p, i) {
      return '<article class="card"><div class="num">0' + (i + 1) + '</div><h3>' + h(p) + '</h3></article>';
    }).join('');

    var muCards = t.hooks.map(function (hk) {
      return '<article class="card mu-card">' +
        '<div class="badge">無</div>' +
        '<span class="mu">' + h(hk.mu) + '</span>' +
        '<h3>' + h(hk.name) + '</h3>' +
        '<p>' + h(hk.body) + '</p>' +
        '<div class="proof">' + h(hk.proof) + '</div>' +
        '</article>';
    }).join('');

    var missionRows = missions.map(function (m) {
      return '<tr><td><strong>' + h(m.name) + '</strong></td><td>' + h(m.rule) + '</td><td class="stamp">' + h(m.stamp) + '</td></tr>';
    }).join('');

    var faqHtml = faq.map(function (f) {
      return '<details><summary>' + h(f.q) + '</summary><p>' + h(f.a) + '</p></details>';
    }).join('');

    var priceBullets = BRAND.price.bullets.map(function (b) { return '<li>' + h(b) + '</li>'; }).join('');

    var html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(siteTitle)}</title>
<meta name="description" content="${h(metaDesc)}">
<meta property="og:title" content="${h(siteTitle)}">
<meta property="og:description" content="${h(metaDesc)}">
<meta property="og:type" content="website">
<style>${CSS}</style>
</head>
<body>
<header class="nav">
  <div class="wrap nav-in">
    <a class="brand" href="https://dangoal.com/landing"><span class="mark" aria-hidden="true"></span> dangoal <span style="font-weight:600;font-size:13px;color:var(--gray)">단골</span></a>
    <a class="cta" href="${h(apply)}"><span>2분 진단 신청</span> →</a>
  </div>
</header>
<main>
  <section class="hero">
    <div class="wrap">
      <span class="eyebrow">단골 스탬프 챌린지 · ${h(t.label)}</span>
      <h1>${h(c.headline)}</h1>
      <p class="lead">${h(regionLine)} ${h(name)}에서, ${h(heroSub)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${h(apply)}">2분 진단 신청하기</a>
        ${heroPhone}
      </div>
      <p class="hero-note">${h(BRAND.price.short)}</p>
    </div>
  </section>

  <section class="stats" aria-label="단골 운영 집계">
    <div class="wrap">
      <div class="stats-grid">${statsHtml}</div>
      <small>${h(BRAND.statsNote)}</small>
    </div>
  </section>

  <section class="problem">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">WHY</span>
        <h2>${h(t.cardTitle)}</h2>
        <p class="lead">${h(tone.problemLead)}</p>
      </div>
      <div class="grid3">${problemCards}</div>
      <p class="problem-close">손님이 다시 올 이유는, 생각보다 자주 사라집니다.</p>
    </div>
  </section>

  <section class="mu">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">HOW · 3무 부담</span>
        <h2>'3무' 부담으로 시작하세요</h2>
        <p class="lead">${h(t.label)}에 맞춰 같은 '3무'를 이렇게 말합니다. 시작할 때 부담하지 않아도 되는 세 가지입니다.</p>
      </div>
      <div class="grid3">${muCards}</div>
    </div>
  </section>

  <section class="how">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">3 STEPS</span>
        <h2>이렇게 작동합니다</h2>
      </div>
      <div class="steps">
        <article class="step"><div class="n">1</div><h3>챌린지 요청</h3><p>기간·미션·목표 스탬프·선착순 인원을 정해 요청합니다.</p></article>
        <article class="step"><div class="n">2</div><h3>챌린지 생성 및 운영</h3><p>현장 QR + GPS 인증으로 챌린지 스탬프가 쌓입니다.</p></article>
        <article class="step"><div class="n">3</div><h3>결과 리포트 발행</h3><p>미션별 참여율·달성자 수를 직접 확인합니다.</p></article>
      </div>
      <p class="note">*기존 단골 스탬프 카드와 별개로 쌓입니다.</p>
    </div>
  </section>

  <section class="missions">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">CHALLENGE</span>
        <h2>${h(c.label)} 예시</h2>
        <p class="lead">${h(c.tagline)}</p>
      </div>
      <div class="mission-grid">
        <div class="table-wrap">
          <table>
            <thead><tr><th>미션</th><th>기준</th><th>스탬프</th></tr></thead>
            <tbody>${missionRows}</tbody>
          </table>
        </div>
        <aside class="side">
          <h3>기간 + 미션 + 스탬프 + 선착순</h3>
          <ul>
            <li>기간: ${t.id === 'event' ? '행사 기간에 맞춰' : '2~4주, 매장에 맞춰'} 설정</li>
            <li>목표: 스탬프 5칸 기준, 매장에 맞게 조정</li>
            <li>선착순: 남은 자리 N명, 완주 리워드 지급</li>
            <li>리워드: ${t.id === 'event' ? '행사 상품·공동 상품권' : '매장 쿠폰·사은품'}</li>
          </ul>
          <span class="pill">챌린지 구성과 오픈은 단골이 합니다</span>
        </aside>
      </div>
      <p class="note">*챌린지 서비스 내용과 효과는 사장님이 주신 요청에 맞게 변경될 수 있습니다.</p>
    </div>
  </section>

  <section class="quote">
    <div class="wrap quote-grid">
      <div>
        <span class="eyebrow">PRICE</span>
        <h2 style="margin:14px 0 16px">${h(BRAND.price.headline)}</h2>
        <p class="lead">${h(tone.quoteLead)}</p>
        <ul class="checks">${priceBullets}</ul>
      </div>
      <div class="quote-card">
        <div class="big">맞춤 견적 안내</div>
        <p class="sub">${h(BRAND.price.body)}</p>
        <a class="btn btn-dark" style="margin-top:20px" href="${h(apply)}">규모에 맞는 견적 문의하기</a>
      </div>
    </div>
  </section>

  <section class="faq">
    <div class="wrap">
      <div class="sec-head"><span class="eyebrow">FAQ</span><h2>자주 묻는 질문</h2></div>
      ${faqHtml}
    </div>
  </section>

  <section class="final">
    <div class="wrap">
      <div>
        <h2>지금 신청하고 손님을 더 모으세요</h2>
        <p>${h(BRAND.price.short)} · 문의 ${h(BRAND.contact.phone)}</p>
      </div>
      <div class="hero-actions" style="margin:0">
        <a class="btn btn-primary" href="${h(apply)}">단골 스탬프 챌린지 시작하기</a>
        ${finalMail}
      </div>
    </div>
  </section>
</main>
<footer>
  <div class="wrap foot">
    <div>
      <strong>dangoal · 단골</strong><br>
      ${h(company)} · 대표 ${h(sender || '담당자')} · ${h(BRAND.contact.companyNote)}<br>
      ${h(footContact)}
    </div>
    <div>
      <a href="https://dangoal.com/landing">회사소개</a> · <a href="${h(apply)}">2분 진단</a> · <a href="${h(BRAND.contact.terms)}">이용약관</a> · <a href="${h(BRAND.contact.privacy)}">개인정보</a><br>
      가격은 매장·행사 규모에 맞춘 맞춤 견적으로 안내합니다.
    </div>
  </div>
</footer>
</body>
</html>`;

    return {
      html: html,
      title: siteTitle,
      name: name,
      filename: 'dangoal-landing-' + Utils.safeName(name) + '.html',
      meta: {
        targetLabel: t.full,
        segmentLabel: seg.label,
        conceptLabel: c.label,
        toneLabel: { plain: '담백하게', warm: '조금 더 다정하게', number: '숫자 중심' }[s.tone] || '담백하게',
        chars: html.length
      }
    };
  }

  var last = null;

  function render() {
    var s = readState();
    var built = build(s);
    last = built;
    Utils.$('#landingFrame').srcdoc = built.html;
    Utils.$('#landingCode').textContent = built.html;
    Utils.$('#landingMeta').textContent = built.meta.targetLabel + ' · ' + built.meta.segmentLabel + ' · ' +
      built.meta.conceptLabel + ' · ' + built.meta.toneLabel + ' · ' + Utils.num(built.meta.chars) + '자';
    Utils.$('#landingDownloadName').textContent = built.filename;
    return built;
  }

  function syncSegments() {
    var t = targetById(Utils.$('#landTarget').value);
    var sel = Utils.$('#landSegment');
    sel.innerHTML = t.segments.map(function (s) {
      return '<option value="' + s.id + '">' + Utils.escapeHtml(s.label) + '</option>';
    }).join('');
    Utils.$('#landName').placeholder = t.id === 'event' ? '예: ○○축제' : (t.id === 'chain' ? '예: ○○커피' : '예: ○○카페');
  }

  function bind() {
    var form = Utils.$('#landForm');
    if (!form) return;
    Utils.$('#landConcept').innerHTML = CHALLENGE_CONCEPTS.map(function (c) {
      return '<option value="' + c.id + '">' + Utils.escapeHtml(c.label) + '</option>';
    }).join('');
    syncSegments();
    var refresh = Utils.debounce(render, 220);
    form.addEventListener('input', refresh);
    form.addEventListener('change', function (e) {
      if (e.target.id === 'landTarget') { syncSegments(); refresh(); }
      else refresh();
    });

    Utils.$$('.land-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        Utils.$$('.land-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        var showCode = btn.dataset.tab === 'code';
        Utils.$('#landingPreviewWrap').hidden = showCode;
        Utils.$('#landingCodeWrap').hidden = !showCode;
      });
    });

    Utils.$('#btnLandCopy').addEventListener('click', function () {
      if (!last) render();
      Utils.copyText(last.html).then(function (ok) {
        Utils.toast(ok ? 'HTML 코드를 복사했습니다.' : '복사에 실패했습니다.', ok ? 'ok' : 'warn');
      });
    });
    Utils.$('#btnLandDownload').addEventListener('click', function () {
      if (!last) render();
      Utils.downloadText(last.html, last.filename, 'text/html');
      Utils.toast('HTML 파일을 저장했습니다. 이 파일 하나로 배포할 수 있습니다.', 'ok');
    });
    Utils.$('#btnLandOpen').addEventListener('click', function () {
      if (!last) render();
      var blob = new Blob([last.html], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    });
    Utils.$('#btnLandRefresh').addEventListener('click', render);

    render();
  }

  return { bind: bind, render: render, build: build };
})();
