# ⚡ 안드로이드 폰 설치 실패 및 실행 오류 해결을 위한 구현 계획서 📱

형님! 안드로이드 폰에 넣고 설치가 실패하거나 실행되지 않는 치명적인 문제들을 분석하고, 이를 안전하게 정상화하기 위한 해결 계획서를 준비했습니다. 🐧🚀

---

## 🙋 유저 검토 사항 (User Review Required)

> [!IMPORTANT]
> 1. **대상 SDK 버전 하향 조정 (36 -> 35 또는 34)**:
>    - 현재 `variables.gradle`에 정의된 `compileSdkVersion`과 `targetSdkVersion`이 존재하지 않는 미리보기 버전인 **`36`**으로 설정되어 있어, 최신 단말기나 패키지 인스톨러에서 이를 해석하지 못하고 파싱 오류(설치 실패)를 일으킬 수 있습니다. 이를 안정적인 최신 정식 버전인 **`35` (Android 15)** 혹은 **`34` (Android 14)**로 조정하겠습니다.
> 2. **MainActivity 실행 시점 강제 권한 이동 차단**:
>    - 현재 `MainActivity.java`의 `onCreate` 생명주기에서 앱이 켜지자마자 "모든 파일 접근(MANAGE_EXTERNAL_STORAGE)" 설정 화면으로 사용자를 강제 이동(`startActivity`)시킵니다. 이 방식은 앱 초기화 완료 전에 강제로 화면이 바뀌어 크래시를 유발하거나 실행 실패를 낳을 수 있습니다.
>    - 플러그인(`ContentRenamePlugin.java`) 내부에 이미 권한을 체크하고 필요 시 설정 화면을 띄우는 브릿지 메서드(`openStorageSettings`)가 완벽하게 준비되어 있으므로, 굳이 진입 시점부터 강제로 화면을 튕기게 하지 않고 프론트엔드 UI/UX 흐름상 필요할 때 요청하도록 수정하여 실행 안정성을 100% 확보하겠습니다.
> 3. **서명 충돌 가이드**:
>    - 폰에 동일한 패키지명(`com.happytool.renamer`)의 구버전 앱이 이미 설치되어 있다면 서명 키 불일치로 인해 무조건 설치 실패가 뜹니다. 반드시 스마트폰에서 기존 renamer 또는 happytool 앱을 삭제한 뒤 새 빌드를 설치하도록 가이드하겠습니다.

---

## 🛠️ 제안하는 변경 사항 (Proposed Changes)

### 1. 안드로이드 빌드 환경 설정 수정

#### [MODIFY] [variables.gradle](file:///k:/Antigravity_Projects/gitbase/renamer/android/variables.gradle)
- `compileSdkVersion` 및 `targetSdkVersion`을 정식 릴리즈된 최신 안전 규격인 `35` (Android 15)로 수정합니다.
- 이에 맞게 관련 종속성 라이브러리(Activity, AppCompat, Core 등) 버전도 적절하게 안전한 버전으로 유지합니다.

```diff
 ext {
     minSdkVersion = 24
-    compileSdkVersion = 36
-    targetSdkVersion = 36
+    compileSdkVersion = 35
+    targetSdkVersion = 35
     androidxActivityVersion = '1.11.0'
     androidxAppCompatVersion = '1.7.1'
```

---

### 2. MainActivity 초기화 라이프사이클 안정화

#### [MODIFY] [MainActivity.java](file:///k:/Antigravity_Projects/gitbase/renamer/android/app/src/main/java/com/happytool/renamer/MainActivity.java)
- `onCreate()` 단계에서 `requestManageStoragePermission()`을 호출하여 앱 실행하자마자 시스템 설정창으로 튕겨버리던 강제 로직을 주석 처리 혹은 제거합니다.
- 권한 획득은 프론트엔드 앱 실행 후, 파일 로드가 필요할 때 "권한 승인 필요" 안내 팝업을 통해 플러그인의 `openStorageSettings`를 안전하게 타는 표준적인 흐름을 유지하게 만듭니다.

```diff
     @Override
     public void onCreate(Bundle savedInstanceState) {
         registerPlugin(ContentRenamePlugin.class);
         super.onCreate(savedInstanceState);
-
-        // Request MANAGE_EXTERNAL_STORAGE permission on Android 11+ (API 30+)
-        // This opens the system settings screen so the user can grant "All Files Access"
-        requestManageStoragePermission();
     }
```

---

### 3. 작업 지도 업데이트

#### [MODIFY] [APP_MAP.md](file:///k:/Antigravity_Projects/gitbase/renamer/APP_MAP.md)
- `Content Rename Native Bridge` 섹션의 "런타임 권한" 설명 문구를 실제 변경된 사양(MainActivity 강제 이동 제거 및 플러그인을 통한 온디맨드 권한 요청 방식)으로 현행화합니다.

---

## 🧪 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **로컬 컴파일 테스트**: WSL 환경 및 윈도우 환경에서 프론트엔드 자산을 빌드(`npm run build`)하고, `npx cap sync android`가 정상 동작하는지 검증합니다.
2. **패키지 빌드 정상 여부**: 36 SDK가 아닌 35 SDK 하에서 Gradle 빌드 프로세스가 원활히 동작하는지 확인합니다.
3. **설치 및 구동 테스트 가이드**:
   - 기존의 renamer 앱을 안드로이드 폰에서 삭제합니다.
   - 빌드 완료된 `app-debug.apk`를 설치하여 정상적으로 메인 화면이 크래시 없이 켜지는지 확인합니다.
   - 파일 선택이나 작업 실행 시 권한이 없으면 플러그인이 안내를 해 주며 안전하게 모든 파일 접근 설정 화면으로 유도되는지 확인합니다.
