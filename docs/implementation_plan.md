# ⚡ QuickRunView.tsx 로딩 및 변환 진행 UI 개선 계획서 ⚡

형님! 이전 리네임 성공 이력을 즉시 실행하는 퀵 러너 화면(`QuickRunView.tsx`)에서, 단순 스캔을 넘어 실질적인 **변환 준비 및 실행 작업**임을 시각적으로 웅장하게 보여줄 수 있도록 UI 문구와 진행률 표시를 세련된 영어 단어와 다크 네온 감성으로 업그레이드하고자 합니다! 🐧⚡

---

## 🙋 유저 검토 사항 (User Review Required)

> [!IMPORTANT]
> - **세련된 영문 상태 표시 도입**:
>   - 기존의 한국어 단조로운 '파일 목록 스캔 중...' 문구를 대문자 네온 색상 영단어인 `PREPARING...` 과 `TRANSFORMING...` 으로 변환하여 훨씬 프리미엄한 감성을 연출합니다.
> - **진행률 % 상시 표시**:
>   - 변환 전 파일 조회(준비) 단계와 변환 실행 단계 모두에서 중앙 원형 버튼 내부에 진행률 `%`가 직관적인 크기로 실시간 노출되도록 디자인을 통일합니다.

---

## 🛠️ 제안하는 변경 사항 (Proposed Changes)

### 1. UI 컴포넌트 수정

#### [MODIFY] [QuickRunView.tsx](file:///k:/Antigravity_Projects/gitbase/renamer/src/components/QuickRunView.tsx)
- `loadingFiles`와 `running` 분기 처리 영역을 개선하여 멋진 대문자 단어 및 진행률 %를 일관되게 출력합니다.
- 준비 상태(`loadingFiles`): `PREPARING...` 표시, `{percent}%` 노출, 하단에 `Readying files` 표시.
- 진행 상태(`running`): `TRANSFORMING...` 표시, `{percent}%` 노출, 하단에 `{progress.processed} / {progress.total}` 표시.

```diff
               {loadingFiles ? (
                 <>
                   <div className="quick-run-spinner"></div>
-                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>파일 목록 스캔 중...</span>
+                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-neon-cyan)' }}>
+                    PREPARING...
+                  </span>
+                  <span style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{percent}%</span>
+                  <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '0.1rem' }}>
+                    Readying files
+                  </span>
                 </>
               ) : running ? (
                 <>
                   <div className="quick-run-spinner" style={{ borderTopColor: 'var(--color-neon-emerald)' }}></div>
+                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--color-neon-pink)' }}>
+                    TRANSFORMING...
+                  </span>
                   <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{percent}%</span>
                   <span style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.2rem' }}>
                     {progress.processed} / {progress.total}
                   </span>
                 </>
```

---

### 2. AI 작업 지도(APP_MAP) 업데이트

#### [MODIFY] [APP_MAP.md](file:///k:/Antigravity_Projects/gitbase/renamer/APP_MAP.md)
- `QuickRunView` 설명 블록에 UI 개선 내용(영문 변환 문구, 상시 백분율 표시 적용)에 대한 최신 사양을 명기합니다.

---

## 🧪 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **퀵 실행 진입**: 이전 실행 기록이 있는 상태에서 퀵 모드로 전환한 뒤 즉시 실행하기 버튼 클릭.
2. **준비 단계 관찰**: `PREPARING...` 문구와 `0%` 백분율이 정상적으로 렌더링되는지 확인.
3. **진행 단계 관찰**: 파일 변경이 수행되면서 `TRANSFORMING...` 문구와 `%` 숫자가 100%까지 매끄럽게 상승하는지 시각적으로 체크.

---

## 🚀 승인 및 진행 (Proceed)

형님! 계획서 검토 후 진행하시려면 아래의 **Proceed** 버튼을 클릭하시거나 대화창에 **Proceed**라고 한 말씀 남겨주십시오! 바로 신나게 개발에 착수하겠습니다! 🐧🔥

[Proceed](sandbox:/execute/proceed)
