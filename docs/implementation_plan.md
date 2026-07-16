# ⚡ 서명 충돌 우회를 위한 패키지명(applicationId) 변경 구현 계획서 📱

형님! 3단계 보안 설정을 해제하셨음에도 불구하고 "앱이 설치되지 않음"이 뜨는 현상은, 폰 내부에 이전에 깔린 구버전 앱의 찌꺼기 패키지(동일 패키지명 `com.happytool.renamer`)가 완벽하게 지워지지 않아 **안드로이드 OS 레벨에서 서명 키 충돌로 강제 차단**하는 현상입니다.

형님 환경에 개발 도구가 없으시므로 컴퓨터에 폰을 연결해 강제 언인스톨(ADB)을 수행하는 것보다, **앱의 고유 패키지명(applicationId)을 다른 이름으로 변경하여 새로운 독립 앱으로 폰에 100% 안전하게 설치되도록 우회하는 묘수**를 제안합니다! 🐧⚡

---

## 🙋 유저 검토 사항 (User Review Required)

> [!IMPORTANT]
> - **고유 패키지명 변경**:
>   - 기존: `com.happytool.renamer`
>   - 변경: **`com.happytool.bulkrenamer`**
>   - 패키지명이 변경되면 안드로이드 OS는 이 앱을 기존에 깔려있던 앱과 완전히 무관한 새 앱으로 인식하므로, 서명 충돌 필터를 가볍게 우회하여 **한 방에 즉시 설치 완료**됩니다.

---

## 🛠️ 제안하는 변경 사항 (Proposed Changes)

### 1. Capacitor 구성 파일 수정

#### [MODIFY] [capacitor.config.ts](file:///k:/Antigravity_Projects/gitbase/renamer/capacitor.config.ts)
- `appId` 식별자를 `com.happytool.bulkrenamer`로 수정합니다.

```diff
 const config: CapacitorConfig = {
-  appId: 'com.happytool.renamer',
+  appId: 'com.happytool.bulkrenamer',
   appName: 'renamer',
   webDir: 'dist'
 };
```

---

### 2. 안드로이드 build.gradle 수정

#### [MODIFY] [build.gradle](file:///k:/Antigravity_Projects/gitbase/renamer/android/app/build.gradle)
- `applicationId`를 `com.happytool.bulkrenamer`로 수정합니다.
- (참고: 자바 파일 및 폴더 구조의 복잡한 패키지 변경을 피하기 위해, 코드 내부 참조용 `namespace`는 기존 `com.happytool.renamer`로 안전하게 유지하고 오직 폰 설치 식별자인 `applicationId`만 변경하여 안전성과 편리성을 모두 챙깁니다.)

```diff
     defaultConfig {
-        applicationId "com.happytool.renamer"
+        applicationId "com.happytool.bulkrenamer"
         minSdkVersion rootProject.ext.minSdkVersion
         targetSdkVersion rootProject.ext.targetSdkVersion
```

---

## 🧪 검증 계획 (Verification Plan)

### 수동 검증 (Manual Verification)
1. **웹 자원 빌드 및 싱크**: WSL 환경에서 `npm run build && npx cap sync android`가 정상 작동하는지 확인합니다.
2. **GitHub Actions 컴파일 관찰**: 코드를 깃에 푸시하고, 새 패키지명이 반영된 디버그 APK가 깃허브에서 정상 패키징되는지 지켜봅니다.
3. **최종 폰 설치 확인**: 빌드된 새 APK를 안드로이드 16 폰에 설치하여 한 번에 안전하게 인스톨되는지 확인합니다.
