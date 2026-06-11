# Stock Average Down Calculator

Chrome 확장 프로그램 — 주식 물타기(평균단가 낮추기) 계산기.

## Features

- 평균 매입단가, 현재가, 보유수량 입력 → 추가 매수 시 새 평균단가/수익률 계산
- 슬라이더로 추가 매수 수량 조절
- 목표 평단가 역산 계산기 (목표 평단가 → 필요 수량/투자금)
- 포트폴리오 저장 (무료 3개 / Pro 무제한)
- 다국어 지원 (EN, KO, JA, ZH-CN, ZH-TW, DE, ES, PT)
- 다크모드 자동 지원
- Pro 구독: 추가 통화 (KRW, JPY, EUR, GBP, CNY, INR, BRL), 시나리오 시뮬레이터, 무제한 포트폴리오

## Tech Stack

- **Extension**: Chrome MV3, Vanilla JS, Vite
- **Backend**: Vercel Serverless + Upstash Redis (`paddle-extensions-backend` 저장소)
- **Payment**: Paddle Billing v2 (Merchant of Record)

## Development

```bash
npm install
npm run build       # 프로덕션 빌드 → dist/
npm run build:dev   # 개발 빌드 (sandbox 백엔드) → dist/
```

### 로컬 테스트
1. `npm run build`
2. Chrome → `chrome://extensions` → 개발자 모드 → "압축해제된 확장 프로그램 로드" → `dist/` 폴더 선택

## Project Structure

```
popup.html              # 팝업 UI
src/
  background.js         # Service worker (상태 체크, 알람)
  js/
    ui.js               # UI 로직
    calculator.js       # 계산 로직
    subscription.js     # Paddle 구독 API
    storage.js          # chrome.storage 래퍼
    i18n.js             # 다국어 처리
    config.js           # API 베이스 URL
  css/
    styles.css          # 스타일 (라이트/다크)
  i18n/
    en.json 외 8개 언어
public/
  manifest.json
  icons/
```

## Related

- Backend: [paddle-extensions-backend](https://github.com/UihyunJung/paddle-extensions-backend)
