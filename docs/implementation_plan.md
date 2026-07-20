# 📱 앱 구조 개편: 좌/우 스와이프 탭 모드 & 스마트 아이디어 적용 계획

형님! 요청해주신 **좌/우 스와이프 입력 탭 구조 개편**, **마지막 탭 상태 복원**, 그리고 앱의 손맛과 편의성을 극대화할 **재밌고 유용한 추가 아이디어** 제안 및 구현 계획입니다. 🐧⚡

---

## 💡 형님 제안 추가 아이디어 (제안 & 피드백)

요청해주신 1번, 2번 핵심 개편과 더불어, 함께 도입하면 어플 느낌이 획기적으로 살아나는 **3가지 특별 아이디어**를 준비했습니다!

1. **📱 햅틱 진동 피드백 (Capacitor Haptics)**
   - 원버튼 탭 시 묵직한 햅틱 진동, 변환 완료 시 경쾌한 2연타 햅틱 피드백을 제공하여 손맛을 극대화합니다.
2. **📂 최근 사용 폴더 퀵 프리셋 칩 (Smart Folder Chips)**
   - 마지막 폴더 1개 외에도 최근 자주 사용한 폴더 상위 3개를 원버튼 하단에 콤팩트한 칩 버튼으로 노출하여 원클릭 폴더 전환을 지원합니다.
3. **✨ 60fps 스라이딩 스와이프 뷰 (Touch Touch Gesture Container)**
   - 모바일 터치 스와이프(TouchStart / TouchMove / TouchEnd) 제스처 지원으로 손가락을 쓱 넘기면 [🎲 무작위 원버튼] ↔ [✏️ 커스텀 변환] 사이를 미끄러지듯 이동합니다. (CSS Blur 대신 H/W 가속 Transform 사용으로 60fps 보장)

---

## 🛠️ Proposed Changes (주요 변경 사항)

### [Component Name: App Navigation & Layout]

#### [NEW] [src/components/SwipeTabContainer.tsx](file:///k:/Antigravity_Projects/gitbase/renamer/src/components/SwipeTabContainer.tsx)
- 터치 제스처 스와이프(좌/우 스와이프) 처리 컴포넌트 신규 분리 (`App.tsx` 500줄 초과 방지).
- 상단 네온 탭 바 ([🎲 무작위 변환] | [✏️ 커스텀 변환]) 렌더링.
- 좌/우 스와이프 제스처 판별 (`touchStartX`, `touchEndX`, 델타 50px 이상 반응).

#### [MODIFY] [src/App.tsx](file:///k:/Antigravity_Projects/gitbase/renamer/src/App.tsx)
- `activeTab` 상태 추가 (`'random'` | `'custom'`) & `localStorage` 영구 저장을 통한 재실행 시 마지막 탭 자동 복원.
- 재실행 시 마지막 탭이 `'random'`이고 `lastJob` 이력이 있으면 최신 폴더 전량 변환 원버튼 뷰 제공.
- 햅틱 피드백 연동 및 퀵 폴더 칩 선택 연동.

#### [MODIFY] [src/components/QuickRunView.tsx](file:///k:/Antigravity_Projects/gitbase/renamer/src/components/QuickRunView.tsx)
- 하단에 최근 사용 폴더 퀵 프리셋 칩 UI 추가.
- 스와이프 안내 아이콘 및 탭 안내 레이아웃 적용.

#### [MODIFY] [APP_MAP.md](file:///k:/Antigravity_Projects/gitbase/renamer/APP_MAP.md)
- 좌/우 스와이프 탭 컨테이너 구조 및 탭 유지 로직 명시.

---

## 🧪 Verification Plan (검증 계획)

### Manual Verification
1. **좌/우 스와이프 테스트**: 화면을 좌우로 쓱 밀었을 때 [무작위 변환]과 [커스텀 변환] 모드가 매끄럽게 전환되는지 확인.
2. **마지막 탭 복원 테스트**: '무작위 변환' 탭 상태에서 앱을 종료/재실행 시 원버튼 변환 화면으로 바로 복원되는지 확인.
3. **웹 및 모바일 반응형 검증**: 터치 이벤트 및 탭 클릭 전환이 렉 없이 작동하는지 빌드 검증 (`npm run build`).

---
형님, 제시해드린 추가 아이디어와 스와이프 개편 계획을 확인하시고 아래 **[Proceed]** 버튼을 눌러주시면 멋지게 신나게 코딩을 시작하겠습니다! 🚀
