# CLAUDE.md — average-down-extension

## Project Overview

Chrome 확장 프로그램: 주식 물타기 계산기. MV3 + Vanilla JS + Vite 빌드.
프리미엄 구독은 Paddle Billing v2, 백엔드는 별도 저장소 `paddle-extensions-backend`.

## Commands

```bash
npm run build       # 프로덕션 빌드 → dist/ (production 백엔드)
npm run build:dev   # 개발 빌드 → dist/ (sandbox 백엔드)
npm run dev         # Vite 개발 서버 (확장 테스트에는 build 사용)
```

## Architecture

- `popup.html` → `src/js/ui.js` (메인 진입점)
- `src/background.js` → Service worker (30분 주기 상태 체크, chrome.alarms)
- `src/js/subscription.js` → Paddle 백엔드 API 통신
- `src/js/calculator.js` → 순수 계산 로직 (DOM 무관, calculateWater/calculateReverse/scenarioPresets)
- `src/js/i18n.js` → `data-i18n` 속성 기반 다국어 8개 언어 (en/ko/ja/zh-CN/zh-TW/de/es/pt, fallback: en)
- `src/js/storage.js` → chrome.storage.local 래퍼 (debounce + flush + 포트폴리오 CRUD)

## Key Patterns

- **Installation ID**: `crypto.randomUUID()` — 사용자 식별. 이메일 대신 UUID 사용 (보안)
- **Premium 판정**: 백엔드 `isPremium()` 단일 함수. 프론트는 캐시된 boolean 사용
- **Storage keys**: `avgdown_` 접두사 (avgdown_premium, avgdown_plan_type, avgdown_expires_at, avgdown_sub_status, avgdown_install_id, avgdown_sync_failed, avgdown_state, avgdown_portfolio)
- **refreshStatus(force)**: 반환값은 `{ premium, planType, expiresAt, status }` 객체. `force=true`는 백그라운드 5분 캐시 우회 — Verify/복원 등 사용자 명시 요청에만 사용
- **i18n**: `t('key')` 함수. `{date}` 같은 placeholder는 JS에서 replace
- **MV3 CSP**: 외부 스크립트 로드 불가 → Paddle 체크아웃은 새 탭에서 URL로 열기
- **host_permissions**: production 백엔드 한 줄만 선언. sandbox/preview 백엔드는 CORS(`ACAO: *`)로 동작하므로 와일드카드(`*.vercel.app`)로 다시 넓히지 말 것

## Backend

별도 저장소: `paddle-extensions-backend` (Windows: `D:\frontend\paddle-extensions-backend`, macOS: `/Users/jung-euihyun/projects/paddle-extensions-backend`)
- API: `/api/status`, `/api/create-checkout`, `/api/restore`, `/api/webhook`
- 범용 백엔드 — 여러 확장에서 공유. 확장별 로직 넣지 말 것
- Base URL: `src/js/config.js`의 `API_BASE` (`VITE_API_BASE` 환경변수로 오버라이드 가능)
- 환경 분리: `.env.dev` (sandbox 백엔드) / 기본값 (production 백엔드)

## Conventions

- 통화별 설정: `calculator.js`의 `currencyConfig`
- CSS 변수: `:root`에 정의, `prefers-color-scheme: dark`로 다크모드
- 뱃지 상태: 무료→upgrade-panel 토글, 프리미엄→pro-panel 토글
- DOM 조작: innerHTML 사용 금지 → createElement + textContent만 사용
- 가시성 제어: classList.toggle('visible') 패턴 (style.display 사용 금지)
- 이벤트 위임: 동적 리스트는 부모에 단일 리스너 + e.target.closest()
- 포트폴리오: 무료 3개 / 프리미엄 무제한. 다운그레이드 시 기존 항목 유지, 새 저장만 차단
- 프리미엄 기능: 추가 통화, 시나리오 시뮬레이터, 무제한 포트폴리오

## CWS Release

- 새 패키지 업로드는 manifest 버전 증가 필수. 패키징: `npm run build` 후 dist/ 내용물을 zip (manifest.json이 zip 루트)
- `_locales`의 extDescription은 en의 충실한 번역 유지 (CWS 메타데이터 일치 자동검사, 132자 한도)
- 대시보드 스토어 등록정보의 언어별 설명 필드는 비워둠(영어 폴백) — 채우려면 기본 언어 설명과 내용이 일치해야 함
