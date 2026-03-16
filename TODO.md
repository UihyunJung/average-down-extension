# TODO — Stock Average Down Calculator

## Phase 5: Premium Subscription (Blocked)

ExtensionPay 연동 코드는 작성 완료되었으나, Stripe Connect가 한국(South Korea)을 지원하지 않아 비활성화 상태.

### 현재 상태
- `src/background.js` — ExtensionPay startBackground() 주석 처리
- `src/js/subscription.js` — checkPremium(), openPaymentPage(), onPaidStatusChange() 구현 완료
- `src/js/ui.js` — subscription import 및 premium 체크 로직 주석 처리 (TODO 마커)
- `public/ExtPay.js` — content script 파일 존재
- `vite.config.js` — background entry 주석 처리
- `public/manifest.json` — background, content_scripts 제거 상태

### 재활성화 방법 (Stripe Connect 문제 해결 후)

1. `src/background.js` — 주석 해제
2. `src/js/ui.js` — `import { checkPremium, ... }` 주석 해제, `isPremium = await checkPremium()` 주석 해제, `onPaidStatusChange(...)` 주석 해제, `openPaymentPage()` 주석 해제
3. `vite.config.js` — `background: 'src/background.js'` input에 추가
4. `public/manifest.json` — 아래 추가:
   ```json
   "background": { "service_worker": "background.js", "type": "module" },
   "content_scripts": [{ "matches": ["https://extensionpay.com/*"], "js": ["ExtPay.js"], "run_at": "document_start" }]
   ```
5. `popup.html` — currency-select의 `style="display:none"` 제거, 프리미엄 통화 옵션 복원
6. `npm run build` → 테스트 → CWS 업데이트

### 차단 사항
- **ExtensionPay Stripe Connect**: 한국 미지원. support@extensionpay.com 에 문의 (2026-03-16)
- **대안 검토 필요**: Paddle, Lemon Squeezy, 직접 Stripe Checkout (백엔드 필요)

### ExtensionPay 설정 정보
- Extension ID: `kbhacjdeljmcmapfphelhifpjhihnekg`
- Plan: $1/month (pro)
- Dashboard: https://extensionpay.com

## 기타 개선 사항
- [ ] 아이콘 개선 (현재 ChatGPT 생성 아이콘, 전문 디자인 고려)
- [ ] 한국어/일본어별 CWS 현지화 스크린샷 추가
- [ ] 프로모션 타일 이미지 제작 (440x280, 1400x560)
