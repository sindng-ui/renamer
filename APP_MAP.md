# ⚡ Bulk Renamer APP_MAP (AI 작업 지도) 🗺️

형님! 이 지도는 Bulk Renamer 프로젝트의 전체 구조와 핵심 인터페이스 규격을 즉시 파악할 수 있도록 돕는 지도입니다. 🐧🚀
모든 경로는 **프로젝트 루트 기준 상대 경로**를 사용하였습니다.

---

## 1. Global Entry & App Layout
앱의 진입점과 전체적인 컴포넌트 조립 레이아웃입니다.

### [[Global Entry Point]]
- **ID**: `global-entry-point`
- **Keywords**: [`진입점`, `main`, `app root`, `Vite`, `React`, `Capacitor`]
- **Location**:
  - `Html`: [index.html](./index.html)
  - `Entry`: [src/main.tsx](./src/main.tsx)
  - `View`: [src/App.tsx](./src/App.tsx)
- **Core Interface**:
  - `App`: 전역 상태(파일 리스트, 리네임 규칙 설정) 관리 및 전체 레이아웃 조립 컴포넌트

---

## 2. Core Logic & Utility
리네임 변환 공식과 비동기 배치 처리를 위한 엔진 영역입니다.

### [[Rename Rule Engine]]
- **ID**: `rename-rule-engine`
- **Keywords**: [`리네임 알고리즘`, `치환`, `접두사`, `접미사`, `날짜 부착`, `랜덤화`, `중복 방지`]
- **Location**:
  - `Utility`: [src/utils/renameRules.ts](./src/utils/renameRules.ts)
- **Core Interface**:
  - `applyRenameRule`: 단일 파일명에 대해 규칙을 적용하여 새 이름을 계산하는 함수
  - `previewRenameList`: 전체 파일 목록에 대해 중복 검사 캐시를 거쳐 리네임 목록을 출력하는 함수

### [[Rename Batch Scheduler]]
- **ID**: `rename-batch-scheduler`
- **Keywords**: [`배치 처리`, `비동기 실행`, `백그라운드 지속`, `App State`, `BackgroundTasks`]
- **Location**:
  - `Hook`: [src/hooks/useRenameScheduler.ts](./src/hooks/useRenameScheduler.ts)
- **Core Interface**:
  - `executeRename`: 대용량 파일 변경 시 UI가 굳지 않도록 배치(Batching)하여 비동기로 처리하는 핵심 스케줄링 함수
  - `stopRename`: 실행 중인 작업을 중단 및 일시정지 처리하는 함수
  - `BackgroundTasks`: 앱이 백그라운드로 내려갔을 때 OS의 중단 방지 가드 등록/해제 처리

---

## 3. UI Components
프리미엄 다크-네온 스타일의 컴포넌트들입니다. (blur 필터 완전 제거로 60fps 보장)

### [[File / Folder Selector]]
- **ID**: `file-selector-ui`
- **Keywords**: [`폴더 선택`, `파일 선택`, `네이티브 연동`, `대용량 더미 데이터`, `자주 쓰는 폴더`, `즐겨찾기`, `localStorage`, `아코디언`, `접기`, `file-picker`]
- **Location**:
  - `View`: [src/components/FileSelector.tsx](./src/components/FileSelector.tsx)
- **Core Interface**:
  - `FileSelector`: 디폴트로 접혀 있는 콤팩트 뷰에서 안드로이드 시스템 파일 탐색창을 띄우는 `@capawesome/capacitor-file-picker` 플러그인을 직접 기동하고, 선택된 다중 파일들의 실제 물리 local path를 안전하게 추출하여 전달. 웹 환경 등 경로 누락 시 가상 경로 Fallback 시뮬레이션 자동 지원.

### [[Rename Rules Controller]]
- **ID**: `rename-rules-controller`
- **Keywords**: [`규칙 설정`, `옵션 제어`, `랜덤 설정`, `커스텀 팝업`, `localStorage 저장`]
- **Location**:
  - `View`: [src/components/RenameRules.tsx](./src/components/RenameRules.tsx)
- **Core Interface**:
  - `RenameRules`: 기본적으로 원클릭 랜덤 중복방지 옵션(길이, 머리말, 꼬리말)만 콤팩트하게 노출하고, 커스텀 세부 규칙은 팝업 모달 다이얼로그로 격리하여 쾌적한 최상급 원클릭 접근성 UI를 지원

### [[Virtualized Live Preview]]
- **ID**: `virtualized-live-preview`
- **Keywords**: [`실시간 미리보기`, `가상 스크롤`, `Virtual Scroll`, `60fps 스크롤`, `DOM 최소화`]
- **Location**:
  - `View`: [src/components/PreviewList.tsx](./src/components/PreviewList.tsx)
- **Core Interface**:
  - `PreviewList`: 3,000개의 대용량 파일도 렉 없이 스크롤링할 수 있는 가상 스크롤 렌더링 테이블

### [[Progress & Terminal Monitor]]
- **ID**: `progress-terminal-monitor`
- **Keywords**: [`진행률`, `그라데이션 프로그레스`, `터미널 스트림`, `files/sec`]
- **Location**:
  - `View`: [src/components/ProgressIndicator.tsx](./src/components/ProgressIndicator.tsx)

### [[Bento Grid Result Summary]]
- **ID**: `bento-grid-result-summary`
- **Keywords**: [`결과 요약`, `Bento Grid`, `실패 사유`, `아코디언`]
- **Location**:
  - `View`: [src/components/ResultSummary.tsx](./src/components/ResultSummary.tsx)

### [[Common Dialog System]]
- **ID**: `common-dialog-system`
- **Keywords**: [`ConfirmDialog`, `PromptDialog`, `모달`, `확인창`]
- **Location**:
  - `View`: [src/components/CommonDialog.tsx](./src/components/CommonDialog.tsx)

---

## 4. CI/CD & Build Pipeline
스마트폰용 APK 파일 패키징을 위한 자동 빌드 시스템입니다.

### [[GitHub Actions CI Builder]]
- **ID**: `github-actions-ci-builder`
- **Keywords**: [`CI/CD`, `자동 빌드`, `GitHub Actions`, `APK 컴파일`, `Gradle`]
- **Location**:
  - `Config`: [.github/workflows/android.yml](./.github/workflows/android.yml)
- **Core Interface**:
  - `Build Android APK`: GitHub에 코드가 푸시되면 클라우드 우분투 러너가 작동하여 Java JDK 21 및 Android SDK 환경을 세팅하고, 프론트엔드 빌드 및 Gradle 컴파일(`assembleDebug`)을 자동으로 수행하여 결과물인 `app-debug.apk`를 업로드하는 무중단 빌드 워크플로우

---

## 5. Android Native Bridges
안드로이드 OS 기능을 제어하기 위해 탑재된 자바 브릿지 플러그인입니다.

### [[Content Rename Native Bridge]]
- **ID**: `content-rename-native-bridge`
- **Keywords**: [`content:// URI`, `이름 변경`, `DocumentsContract`, `MainActivity`, `Capacitor Plugin`]
- **Location**:
  - `Java Code`: [ContentRenamePlugin.java](./android/app/src/main/java/com/happytool/renamer/ContentRenamePlugin.java)
  - `Registration`: [MainActivity.java](./android/app/src/main/java/com/happytool/renamer/MainActivity.java)
- **Core Interface**:
  - `ContentRename`: 안드로이드 스토리지 액세스 프레임워크(SAF) 내에서 파일 탐색기로부터 획득한 `content://` URI를 전달받아, 안드로이드 ContentResolver 및 DocumentsContract API를 사용해 물리 파일의 이름을 원활하게 강제 변경해주는 커스텀 Capacitor 플러그인 (Capacitor 로더 인식을 위해 public class로 별도 분리 설계됨)


