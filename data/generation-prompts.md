# AX 학습용 간판 이미지 제작 기록

- 방식: built-in `image_gen` (imagegen skill), 2026-10-09.
- 저장 위치: `assets/ax/generated/`.
- 모든 결과의 한글 표기와 구도를 직접 시각 검수했다.
- 실제 지점의 사진이나 지도 캡처의 복제·트레이싱이 아니다. 실재 브랜드 표시는 학습용 예시이며 제휴를 의미하지 않는다.
- 기존 카페·약국·지하철 그림은 `prototype.html`의 원본 자산을 재사용한다.

## 공통 구도

Portrait 2:3. One educational sign image per generation. Large, sharp, precisely spelled Hangul, sign facing viewer. Believable Korean street context and natural daylight. Polished architectural illustration, not a claim of a real branch. No people, plates, addresses, phone numbers, watermark or collage. Leave space for web controls.

## 개별 프롬프트

### mega.png

A Korean Mega MGC Coffee storefront with a yellow main sign. Exact readable sign text: "메가커피" with smaller "MEGA MGC COFFEE".

### korean.png

A small Korean restaurant exterior. Main sign exact readable Korean text: "한식" and smaller "백반 · 비빔밥".

### chinese.png

A Korean Chinese restaurant exterior with a dark red sign. Main sign exact readable Korean text: "중화요리" and smaller "짜장면 · 짬뽕".

### japanese.png

A Japanese cuisine restaurant exterior in Korea with a warm wood sign. Main sign exact readable Korean text: "일식" and smaller "초밥 · 우동".

### lotteria.png

A Lotteria fast food restaurant exterior in Korea with a red main sign. Main sign exact readable Korean text: "롯데리아" and smaller "LOTTERIA".

### bus-sign.png

A Korean bus stop pole sign with a bus pictogram, exact large text "버스정류장", smaller "BUS STOP".

### taxi-sign.png

A Korean taxi stand pole sign with taxi pictogram, exact large text "택시 승강장", smaller "TAXI".
