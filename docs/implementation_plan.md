# ⚡ AAR 메타데이터 빌드 오류 해결을 위한 구현 계획서 📱

형님! `compileSdkVersion = 35`로 낮춤에 따라, 기존에 `36` 버전을 요구하던 최신 AndroidX 라이브러리들(`androidx.activity`, `androidx.core`)이 빌드 타임에 충돌(AAR Metadata Check Fail)을 일으킨 것을 확인했습니다.

이 오류를 해결하기 위해, 라이브러리 버전을 API 35 규격에 딱 맞는 안정화 버전으로 안전하게 하향 조정하는 해결 계획서를 작성했습니다. 🐧⚡

---

## 🙋 유저 검토 사항 (User Review Required)

> [!IMPORTANT]
> - **AndroidX 라이브러리 버전 하향 조정**:
>   - `androidx.activity:activity` 버전을 `1.11.0` ➔ **`1.10.0`**으로 조정합니다. (`1.11.0`은 SDK 36을 필수로 요구합니다.)
>   - `androidx.core:core` 버전을 `1.17.0` ➔ **`1.15.0`**으로 조정합니다. (`1.17.0`은 SDK 36을 필수로 요구합니다.)
>   - 이 두 버전은 `compileSdkVersion = 35` (Android 15) 환경에서 완벽하게 호환되며 빌드가 100% 정상 작동합니다.

---

## 🛠️ 제안하는 변경 사항 (Proposed Changes)

### 1. variables.gradle 내 라이브러리 버전 조정

#### [MODIFY] [variables.gradle](file:///k:/Antigravity_Projects/gitbase/renamer/android/variables.gradle)
- compileSdk 35와 호환되는 최적의 버전을 대입합니다.

```diff
 ext {
     minSdkVersion = 24
     compileSdkVersion = 35
     targetSdkVersion = 35
-    androidxActivityVersion = '1.11.0'
+    androidxActivityVersion = '1.10.0'
     androidxAppCompatVersion = '1.7.1'
     androidxCoordinatorLayoutVersion = '1.3.0'
-    androidxCoreVersion = '1.17.0'
+    androidxCoreVersion = '1.15.0'
     androidxFragmentVersion = '1.8.9'
```

---

## 🧪 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **Capacitor 동기화**: `npx cap sync android` 명령어가 정상 동작하는지 테스트합니다.
2. **Gradle AAR 검증 빌드**: 버전을 수정한 뒤 안드로이드 스튜디오 또는 CI 환경에서 `assembleDebug`를 다시 돌려 `CheckAarMetadata` 오류가 완벽히 소멸되고 빌드가 끝나는지 검증합니다.
