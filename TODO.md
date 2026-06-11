# TODO — Stock Average Down Calculator

## Premium Subscription (Paddle)

Paddle Billing v2 기반 프리미엄 구독 — 프로덕션 라이브 완료.
백엔드는 `paddle-extensions-backend` (Vercel + Upstash Redis)에서 공유.

### Paddle 설정 (Production)
- Monthly Price ID: `pri_01km5ykxvxxyg3001jebdfp0pj`
- Annual Price ID: `pri_01km5ynnhtnen2j1kqdjwwkcnr`
- Product: `Average Down Calculator Pro`

### 완료된 작업
- [x] Paddle 라이브 계정 활성화 (본인인증)
- [x] Sandbox → Production 전환 (API key, webhook secret, price ID 교체)
- [x] 백엔드 Phase 1 배포 (planType/expiresAt/status + adjustment.updated 환불 처리)
- [x] Sandbox E2E 테스트 (결제 → 뱃지 확인 → 취소 → 복원)
- [x] CWS v1.1.0 제출

### 남은 작업
- [ ] CWS v1.2.3 심사 통과·게시 확인 (2026-06-12 제출 — 보안 리뷰 수정 + 메타데이터 정렬)
- [ ] Payoneer 계정 승인 확인 + Paddle payout 연결

## 기타 개선 사항
- [ ] 아이콘 개선 (현재 AI 생성 아이콘, 전문 디자인 고려)
- [ ] CWS 현지화 스크린샷 추가 (ko/ja/zh-CN/zh-TW)
- [ ] 프로모션 타일 이미지 제작 (440x280, 1400x560)
