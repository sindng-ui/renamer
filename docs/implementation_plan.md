# ⚡ 안드로이드 16 기기 설치 실패 해결을 위한 복구 계획서 📱

형님! 기기가 최신 **안드로이드 16(SDK 36)** 환경이었군요! 

어제 `compileSdkVersion = 36` 및 `targetSdkVersion = 36` 상태에서 완벽하게 빌드 및 설치가 잘 되었던 점, 그리고 오늘 제가 targetSdkVersion을 35로 낮춘 직후에 설치 오류가 발생한 점을 고려하면, 안드로이드 16 기기 자체의 정책(혹은 64비트 및 최신 SDK 제한 검증)에 따라 **대상 SDK 35 버전의 APK가 거부되었을 가능성**이 극히 높습니다.

따라서 오늘 수정한 안드로이드 네이티브 설정을 어제 완벽히 잘 돌아갔던 **원래 상태 (SDK 36 타겟 및 MainActivity 권한 팝업)**로 100% 원복하여 설치 문제를 즉시 해결하겠습니다! 🐧⚡

---

## 🙋 유저 검토 사항 (User Review Required)

> [!IMPORTANT]
> 1. **안드로이드 SDK 36 원복**:
>    - `compileSdkVersion = 36`, `targetSdkVersion = 36`으로 되돌립니다.
>    - `androidxActivityVersion = '1.11.0'`, `androidxCoreVersion = '1.17.0'`으로 원복합니다.
>    - 형님 기기(안드로이드 16)에 어제와 같이 완벽하게 호환되어 무사히 설치가 뚫리게 됩니다.
> 2. **MainActivity 권한 자동 요청 원복**:
>    - 앱 기동 시 첫 설정창으로 이동시켜 권한을 명시적으로 요구했던 `requestManageStoragePermission()` 호출을 원래대로 다시 작동시킵니다.
> 3. **배포 흐름**:
>    - 로컬에 자바 SDK와 안드로이드 스튜디오가 없으시므로, 제가 코드를 변경하여 깃에 커밋하면 GitHub Actions가 자동으로 컴파일하여 `app-debug.apk`를 빌드하게 됩니다. 형님께서는 Action 완료 후 해당 APK를 다운받아 폰에 넣고 다시 설치해보시면 됩니다.

---

## 🛠️ 제안하는 변경 사항 (Proposed Changes)

### 1. variables.gradle 설정 복구

#### [MODIFY] [variables.gradle](file:///k:/Antigravity_Projects/gitbase/renamer/android/variables.gradle)
- 어제 검증 완료되었던 버전 사양인 `36`으로 롤백합니다.

```diff
 ext {
     minSdkVersion = 24
-    compileSdkVersion = 35
-    targetSdkVersion = 35
-    androidxActivityVersion = '1.10.0'
+    compileSdkVersion = 36
+    targetSdkVersion = 36
+    androidxActivityVersion = '1.11.0'
     androidxAppCompatVersion = '1.7.1'
     androidxCoordinatorLayoutVersion = '1.3.0'
-    androidxCoreVersion = '1.15.0'
+    androidxCoreVersion = '1.17.0'
     androidxFragmentVersion = '1.8.9'
```

---

### 2. MainActivity 초기 권한 요청 로직 복구

#### [MODIFY] [MainActivity.java](file:///k:/Antigravity_Projects/gitbase/renamer/android/app/src/main/java/com/happytool/renamer/MainActivity.java)
- `onCreate()` 시점에 권한 요청을 띄우는 로직을 복구시킵니다.

```diff
     @Override
     public void onCreate(Bundle savedInstanceState) {
         registerPlugin(ContentRenamePlugin.class);
         super.onCreate(savedInstanceState);
+
+        // Request MANAGE_EXTERNAL_STORAGE permission on Android 11+ (API 30+)
+        // This opens the system settings screen so the user can grant "All Files Access"
+        requestManageStoragePermission();
     }
```

---

### 3. 작업 지도 정보 현행화

#### [MODIFY] [APP_MAP.md](file:///k:/Antigravity_Projects/gitbase/renamer/APP_MAP.md)
- `Content Rename Native Bridge`의 런타임 권한 획득 설명을 MainActivity 기동 시 자동 팝업 방식으로 다시 원래대로 갱신합니다.

---

## 🧪 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **웹 자원 빌드 및 싱크**: WSL 환경에서 프론트엔드를 빌드한 후 `npx cap sync android`가 정상 작동하는지 확인합니다.
2. **GitHub Actions 컴파일 대기**: 코드 변경 사항을 깃에 올린 후 GitHub Action이 정상적으로 SDK 36 기반의 APK 빌드에 성공하는지 빌드 완료 결과를 관찰합니다.
3. **사용자 설치 확인**: 빌드가 완료된 APK를 안드로이드 16 폰에 설치하여 정상 기동하는지 점검합니다.
