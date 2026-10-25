# Sign by Sign Android APK

이 앱은 Capacitor로 기존 `ax.js` 화면을 Android WebView에 담습니다. 앱 설치와 사용에 PC 서버가 필요하지 않습니다. 간판 데이터, Tesseract OCR 언어 파일, 사진 자산을 APK에 포함합니다.

앱 아이콘은 기존 청록색 `ㅅ` 로고를 Android 적응형 아이콘으로 만든 것입니다. [512px 미리보기](assets/app-icon.png), [SVG 원본](assets/app-icon.svg)이 있으며 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-icons.ps1`로 Android 아이콘 크기별 파일을 다시 만들 수 있습니다. 적응형 아이콘은 Android의 모양과 테마에 맞춰 표시됩니다. [Android 아이콘 규격](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)

## APK 만들기

Windows PowerShell에서 Node.js 22.13 이상, Android Studio/SDK, JDK 21을 준비한 뒤 프로젝트 폴더에서 실행합니다.

```powershell
npm install
npm run assets:ocr
npm run android:apk
```

설치하기 편한 결과 파일은 프로젝트 최상위의 **`SignBySign-Android.apk`**입니다. 원래 Gradle 결과도 `android/app/build/outputs/apk/debug/app-debug.apk`에 남습니다. 처음 Android 프로젝트를 만드는 새 체크아웃에서 `android/`가 없을 때만 `npm run cap:add:android`를 먼저 실행합니다. Android Studio에서 수정하거나 에뮬레이터를 열려면 `npm run android:open`을 사용합니다.

`android:apk`는 매번 웹 자산을 다시 만들고 Android 프로젝트에 복사한 후 `assembleDebug`를 실행합니다. 현재 스크립트는 Windows의 Eclipse Temurin JDK 21을 우선 사용합니다. 다른 환경에서는 `JAVA_HOME`을 적절한 JDK로 설정하세요.

## 삼성 공기계에 설치하기

이 APK의 최소 지원 버전은 **Android 7.0(API 24)**입니다. 설치할 삼성폰의 `설정 → 휴대전화 정보 → 소프트웨어 정보`에서 Android 버전을 확인하세요.

1. 삼성폰을 USB로 PC에 연결하고 잠금을 풉니다. 폰의 USB 알림에서 **파일 전송**을 선택합니다.
2. PC의 `SignBySign-Android.apk`를 폰의 `Download` 폴더에 복사합니다.
3. 폰에서 **내 파일 → 다운로드 → SignBySign-Android.apk**를 열고 설치합니다. `내 파일`에 대해 **알 수 없는 앱 설치**를 허용하라는 화면이 뜨면 해당 앱만 허용합니다. 메뉴 이름은 삼성폰 모델과 One UI 버전에 따라 달라질 수 있습니다. [삼성 설치 안내](https://www.samsung.com/us/support/troubleshoot/TSG10001913/)
4. **자동 차단**이 설치를 막는 경우에만 `설정 → 보안 및 개인정보 보호 → 자동 차단`을 잠시 끄고 설치 후 다시 켭니다. [삼성 자동 차단 안내](https://www.samsung.com/us/support/answer/ANS10003636/)
5. 앱 목록에서 청록색 **Sign by Sign** 아이콘을 열고 언어를 고른 뒤, 상단 카메라 아이콘으로 간판을 찍어 봅니다.

USB 디버깅을 이미 켰고 Android SDK의 `adb`를 사용한다면, PC에서 바로 설치할 수도 있습니다. 폰에 뜨는 USB 디버깅 허용 창을 승인한 후 다음을 실행합니다. [Android 실기기 연결 안내](https://developer.android.com/studio/run/device)

```powershell
adb devices
adb -d install -r ".\SignBySign-Android.apk"
```

이 빌드는 개발용 디버그 서명 APK입니다. 일반 배포용 APK/AAB를 만들려면 별도 릴리스 서명 키와 배포 절차가 필요합니다. 앱을 제거하면 기기에 저장된 학습 기록과 제보 대기 목록도 사라집니다.

## 현재 동작

- 언어 버튼 옆 카메라 아이콘으로 Android 기본 카메라를 열고 촬영 후 자동으로 OCR과 간판 조회를 진행합니다. 사진 선택, 영역 지정, 텍스트 수정, 후보 직접 선택도 가능합니다.
- 결과에는 가게명/간판 문구, 업종, 쉬운 설명, 예상 경험, 바로 쓰는 한국어와 지도 검색 링크가 나옵니다. 등록된 업종·브랜드의 **일반 정보**이며 개별 점포의 주소, 영업시간, 실제 영업 여부를 확인하지 않습니다.
- OCR과 등록 문구 매칭은 기기에서 실행합니다. 신뢰도가 낮거나 문구가 충돌하면 사용자가 후보를 확인합니다.
- 사용자가 판정을 확정하면 해당 기기의 별칭 매칭을 보강합니다. `알겠어요`와 `다시 볼래요`에 따라 복습 간격을 조정합니다.
- 새 간판의 이름, 카테고리, 설명과 동의한 사진 일부를 기기 안의 제출 대기 목록에 저장할 수 있습니다. 사진은 저장 전 선택한 간판 영역을 축소합니다.
- 신고·문의 아이콘에서 오류 신고와 일반 문의를 공유 서버에 보낼 수 있습니다.

## 공동 데이터 업데이트의 범위

앱의 `AI 학습` 화면은 웹과 동일한 공동 제보·확인 로직을 포함합니다. 오프라인이면 앱에 포함된 기본 목록을 계속 사용하고, 온라인이면 새 간판을 공유 서버에 보내 다른 사용자의 공동 확인 목록에 표시할 수 있습니다. 서로 다른 2명이 확인하면 공개 카테고리 카드로 승격됩니다. 기기 안에서 재학습하는 개인 별칭·복습 기록은 계속 해당 기기에만 남습니다.

앱에는 공유 서버 주소가 비어 있지 않도록 같은 Wi-Fi 시험용 기본 주소가 포함되어 있고, `AI 학습 → 설정`에서 서버 주소를 바꿀 수 있습니다. APK를 빌드할 때 아래처럼 주소를 주입할 수도 있습니다. 운영 배포에서는 반드시 인터넷에서 접근 가능한 HTTPS 주소를 사용하세요.

```powershell
$env:SIGN_PUBLIC_API_BASE='https://api.example.com'
npm run android:apk
```

서버는 Android WebView 출처인 `http://localhost`와 `capacitor://localhost`를 허용합니다. 현재 PC의 LAN 주소는 시험에는 사용할 수 있지만 외부 사용자용 영구 서버가 아니며, PC가 꺼지거나 IP가 바뀌면 앱 설정의 주소도 새 IP로 바꿔야 합니다. 현재 Android 프로젝트는 HTTP LAN 시험을 위해 평문 통신을 허용하므로 실제 출시 빌드는 HTTPS로 전환해야 합니다.

공동 확인은 현재 심층 신경망을 즉시 재훈련하는 기능이 아니라, 검증된 간판 이름·별칭·세부 카테고리를 서버 카탈로그와 매칭 결과에 추가하는 방식입니다. 정보 공유 동의와 사진 서버 저장 동의는 분리되어 있습니다. 사진 동의를 하지 않으면 이름·분류·설명만 공유되고 사진 데이터는 전송하지 않습니다. 동의한 사진도 검토용으로만 저장하며 공개 카드에는 분류 대표 이미지를 사용합니다. 운영 배포 전에는 보관 기간·철회/삭제 절차·관리자 권한·서버 인증을 서비스 개인정보 처리방침에 맞춰 확정해야 합니다.

미등록 간판의 네이버·Google 장소 검색은 웹 서버의 `POST /api/discover`가 담당합니다. 네이버와 Google API 키는 APK에 넣지 않고 서버 환경 변수로만 보관합니다. 서버 주소가 설정되어 있고 온라인이면 앱도 같은 검색 결과를 사용하며, 오프라인이어도 범용 안내 문장과 지도 검색 링크를 보여주어 사용을 막지 않습니다.

## 확인할 사항

Android API 36 에뮬레이터에서 디버그 APK 설치·실행과 Android 기본 카메라 실행을 확인했습니다. 포함된 메가커피 예시의 간판 영역을 사용한 기기 내 OCR은 `메가커피 / MEGA MGC COFFEE`를 읽고 신뢰도 93%의 여행자 결과 카드를 표시했습니다. 전체 사진을 그대로 읽었을 때는 주변 질감 때문에 잘못된 글자가 많아 결과를 확정하지 않고 미등록 안내를 표시했습니다.

이번 헤드리스 에뮬레이터의 가상 카메라는 셔터를 누를 때 시스템 카메라 앱에서 `Can't connect to the camera` 오류가 났습니다. 따라서 **네이티브 촬영 완료부터 OCR까지의 연결은 이 환경에서 검증하지 못했습니다.** 실제 공기계의 촬영 권한과 셔터, 실제 간판 사진 OCR 정확도, 인터넷 공동 데이터 동기화 및 릴리스 서명 배포도 별도로 확인해야 합니다. OCR은 조명·기울기·복수 간판에 영향을 받으므로 영역을 좁히거나 읽은 글자를 수정할 수 있게 했습니다.
