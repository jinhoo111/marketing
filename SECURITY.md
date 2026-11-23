# 보안 정책 · Security Policy

단골 마케팅 스튜디오(dangoal marketing studio)는 **서버가 없는 정적 웹앱**입니다.
이 문서는 이 저장소에 무엇이 저장되지 않는지, 어떤 보호 장치가 있는지, 무엇이 한계인지 정리합니다.

## 1. 저장소에 넣지 않는 것

- 실제 전화번호, 개인 이메일, 대표자 실명 등 개인 식별 정보
- 실제 고객·리드 데이터, 상담 기록
- 비밀번호, API 키, 토큰, 인증서
- 내보내기(JSON/CSV) 결과물

연락처는 앱 실행 후 **설정(Settings)** 에서 입력하며, 브라우저 `localStorage`에만 저장됩니다.
입력값은 서버로 전송되지 않습니다.

## 2. 데이터 보호

| 항목 | 내용 |
|---|---|
| 저장 위치 | 브라우저 `localStorage` (`dangoal.mkt.v2` 또는 `dangoal.mkt.v2.enc`) |
| 잠금 꺼짐 | 평문 JSON (해당 브라우저에만 존재) |
| 잠금 켜짐 | AES-GCM 256 암호문. 평문 키는 저장하지 않음 |
| 키 유도 | PBKDF2-SHA256, 250,000회, 랜덤 16바이트 salt |
| PIN | 저장하지 않음. 분실 시 복구 불가(초기화만 가능) |
| 전송 | 없음 (fetch/XHR/외부 스크립트/웹폰트 없음) |

## 3. 웹 보호 장치

- `Content-Security-Policy` (`default-src 'self'`, 인라인 스크립트 금지, 외부 연결 차단)
- `robots.txt`: 모든 검색엔진·주요 AI 크롤러 `Disallow: /`
- `meta robots`: `noindex, nofollow, noarchive, noai, noimageai`
- 출력 이스케이프: 모든 동적 DOM은 `escapeHtml`/`escapeAttr` 경유
- 가져오기 데이터 살균: 길이 제한, 숫자 변환, 허용 ID 목록, 제어문자 제거, ID 재발급

## 4. 알려진 한계

- **Public 저장소의 소스는 누구나 열람할 수 있습니다.** 따라서 비밀은 코드가 아니라 사용자의 브라우저에만 둡니다.
- `robots.txt`·`meta robots`는 수집 요청일 뿐 접근 차단이 아닙니다.
- 정적 사이트에는 로그인 게이트가 없습니다. 페이지 자체를 제한하려면 Cloudflare Access(무료 50석) 같은 앞단 인증이 필요합니다.
- `meta` CSP는 응답 헤더보다 약합니다. Cloudflare Pages 등에서는 `_headers`로 동일 정책을 헤더에 내려주세요.
- PIN 분실 시 데이터 복구는 불가능합니다. 백업 JSON은 평문이므로 공개 저장소에 올리지 마세요.
- 브라우저 확장 프로그램, 악성 입력, 기기 자체의 침해까지 막지는 못합니다.

## 5. 신고

보안 문제를 발견하면 공개 이슈에 민감한 내용을 적지 말고, GitHub 저장소의 **Security → Report a vulnerability** 기능으로 비공개 신고해 주세요.
