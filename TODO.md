# TODO — Stock Average Down Calculator

## Premium Subscription (Paddle)

Paddle Billing v2 기반 프리미엄 구독 구현 완료. 백엔드는 `paddle-extensions-backend` (Vercel + Upstash Redis)에서 공유.

### 현재 상태
- `src/background.js` — 30분 주기 상태 체크, 메시지 리스너 (planType/expiresAt/status 포함)
- `src/js/subscription.js` — checkPremium(), openCheckout(), restorePurchase(), refreshStatus()
- `src/js/ui.js` — 뱃지 (플랜 종류 + 갱신/만료일), Pro 패널, 업그레이드 패널
- `src/js/config.js` — API_BASE (paddle-extensions-backend)

### Paddle 설정
- Monthly Price ID: `pri_01kkwvxpx3015hrk999c2vyw5k`
- Annual Price ID: `pri_01kkww2vkec71n2qskry6qa9ax`
- 환경: Sandbox (라이브 전환 전)

### 남은 작업
- [ ] Paddle 라이브 계정 활성화 (본인인증)
- [ ] Sandbox → Production 전환 (API key, webhook secret, price ID 교체)
- [ ] 백엔드 Phase 1 배포 (planType/expiresAt/status + adjustment.updated 환불 처리)
- [ ] Sandbox에서 결제 → 취소 → 복원 E2E 테스트
- [ ] CWS 업데이트 제출

## 기타 개선 사항
- [ ] 아이콘 개선 (현재 AI 생성 아이콘, 전문 디자인 고려)
- [ ] 한국어/일본어별 CWS 현지화 스크린샷 추가
- [ ] 프로모션 타일 이미지 제작 (440x280, 1400x560)
