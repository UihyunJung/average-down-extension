# CLAUDE.md — average-down-extension

## Project Overview

Chrome 확장 프로그램: 주식 물타기 계산기. MV3 + Vanilla JS + Vite 빌드.
프리미엄 구독은 Paddle Billing v2, 백엔드는 별도 저장소 `paddle-extensions-backend`.

## Commands

```bash
npm run build     # Vite 프로덕션 빌드 → dist/
npm run dev       # Vite 개발 서버 (확장 테스트에는 build 사용)
```

## Architecture

- `popup.html` → `src/js/ui.js` (메인 진입점)
- `src/background.js` → Service worker (30분 주기 상태 체크, chrome.alarms)
- `src/js/subscription.js` → Paddle 백엔드 API 통신
- `src/js/calculator.js` → 순수 계산 로직 (DOM 무관)
- `src/js/i18n.js` → `data-i18n` 속성 기반 다국어 8개 언어 (en/ko/ja/zh-CN/zh-TW/de/es/pt, fallback: en)
- `src/js/storage.js` → chrome.storage.local 래퍼 (debounce + flush)

## Key Patterns

- **Installation ID**: `crypto.randomUUID()` — 사용자 식별. 이메일 대신 UUID 사용 (보안)
- **Premium 판정**: 백엔드 `isPremium()` 단일 함수. 프론트는 캐시된 boolean 사용
- **Storage keys**: `avgdown_` 접두사 (avgdown_premium, avgdown_plan_type, avgdown_expires_at, avgdown_sub_status, avgdown_install_id, avgdown_sync_failed)
- **refreshStatus()**: 반환값은 `{ premium, planType, expiresAt, status }` 객체
- **i18n**: `t('key')` 함수. `{date}` 같은 placeholder는 JS에서 replace
- **MV3 CSP**: 외부 스크립트 로드 불가 → Paddle 체크아웃은 새 탭에서 URL로 열기

## Backend

별도 저장소: `/Users/jung-euihyun/projects/paddle-extensions-backend`
- API: `/api/status`, `/api/create-checkout`, `/api/restore`, `/api/webhook`
- 범용 백엔드 — 여러 확장에서 공유. 확장별 로직 넣지 말 것
- Base URL: `src/js/config.js`의 `API_BASE`

## Conventions

- 통화별 설정: `calculator.js`의 `currencyConfig`
- CSS 변수: `:root`에 정의, `prefers-color-scheme: dark`로 다크모드
- 뱃지 상태: 무료→upgrade-panel 토글, 프리미엄→pro-panel 토글
