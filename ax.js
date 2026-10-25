(async function () {
      "use strict";
      var STORAGE_KEY = "sign-by-sign-ax-v1";
      var mobileMode = window.SIGN_BY_SIGN_MODE === "mobile";
      var catalog;
      try {
        var response = await fetch(mobileMode ? "./data/catalog.json" : "/api/catalog", { cache: "no-store" });
        if (!response.ok) throw new Error("Catalog unavailable");
        catalog = await response.json();
      } catch (_) {
        document.getElementById("app").innerHTML = '<div class="startup-error"><h1>간판 데이터를 불러오지 못했어요</h1><p>' + (mobileMode ? '앱에 포함된 데이터가 손상됐습니다. 앱을 다시 설치해 주세요.' : '이 웹페이지는 서버와 함께 실행합니다. 프로젝트 폴더에서 <code>npm start</code> 후 <code>http://localhost:4173</code>으로 접속하세요.') + '</p><p>Could not load the bundled sign catalog.</p><button class="primary-btn" id="reloadPage">다시 연결 · Retry</button></div>';
        document.getElementById("reloadPage").addEventListener("click", function () { location.reload(); });
        return;
      }
      var categories = [{ id: "all", label: { ko: "모든 간판", en: "All signs", ja: "すべての看板" } }].concat(catalog.categories);
      var subcategories = catalog.subcategories;
      function validCommunityCard(incoming) {
        return catalog.categories.some(function (category) { return category.id === incoming.category; }) &&
          catalog.subcategories.some(function (subcategory) { return subcategory.id === incoming.subcategory && subcategory.category === incoming.category; }) &&
          !catalog.cards.some(function (card) { return card.id === incoming.id; });
      }
      var publishedCards = window.SignNative ? window.SignNative.getPublishedCards() : [];
      var cards = catalog.cards.concat(publishedCards.filter(validCommunityCard));
      var languages = [
        { code: "ko", name: "한국어" },
        { code: "en", name: "English" },
        { code: "ja", name: "日本語" }
      ];
      var messages = {
        language: { ko: "언어", en: "Language", ja: "言語" },
        mainNavigation: { ko: "주 메뉴", en: "Main navigation", ja: "メインメニュー" },
        back: { ko: "뒤로", en: "Back", ja: "戻る" },
        chooseLanguage: { ko: "사용할 언어를 선택하세요", en: "Choose your language", ja: "使用する言語を選んでください" },
        languageHint: { ko: "나중에 화면 위쪽에서 언제든 바꿀 수 있어요.", en: "You can change this anytime at the top of the screen.", ja: "画面上部からいつでも変更できます。" },
        desktopEyebrow: { ko: "인터랙티브 모바일 프로토타입", en: "INTERACTIVE MOBILE PROTOTYPE", ja: "操作できるモバイル体験版" },
        desktopTitle: { ko: "간판으로<br><em>도시 읽기.</em>", en: "Read the<br><em>city in signs.</em>", ja: "看板から<br><em>街を読もう。</em>" },
        desktopBody: { ko: "거리에서 마주치는 한국어 간판을 보고 뜻을 확인한 뒤, 좌우로 넘기며 익히는 학습 앱입니다.", en: "Learn Korean from real-world signs: see one, reveal its meaning, then swipe left or right.", ja: "街で見かける韓国語の看板を見て意味を確認し、左右にスワイプして学ぶアプリです。" },
        desktopTry: { ko: "오른쪽 화면을 사용해 보세요", en: "Try the screen on the right", ja: "右側の画面をお試しください" },
        desktopSwipe: { ko: "카드를 스와이프하거나 <span class=\"kbd\">←</span> <span class=\"kbd\">→</span> 키로 넘길 수 있습니다.", en: "Swipe the card or use <span class=\"kbd\">←</span> <span class=\"kbd\">→</span> keys.", ja: "カードをスワイプするか、<span class=\"kbd\">←</span> <span class=\"kbd\">→</span> キーを使えます。" },
        desktopSpace: { ko: "<span class=\"kbd\">Space</span> 키를 누르면 뜻이 열립니다.", en: "Press <span class=\"kbd\">Space</span> to reveal the meaning.", ja: "<span class=\"kbd\">Space</span> キーで意味を表示できます。" },
        desktopSample: { ko: "예시 간판 사진 6장을 포함한 디자인 체험판입니다.", en: "This design prototype includes six illustrative sign photos.", ja: "看板のイメージ写真6枚を含むデザイン体験版です。" },
        continue: { ko: "계속", en: "Continue", ja: "次へ" },
        skip: { ko: "건너뛰기", en: "Skip", ja: "スキップ" },
        next: { ko: "다음", en: "Next", ja: "次へ" },
        startLearning: { ko: "학습 시작", en: "Start learning", ja: "学習を始める" },
        onboardFirstTitle: { ko: "거리의 한국어를<br>읽어보세요.", en: "Read Korean in<br>the real world.", ja: "街の韓国語を<br>読んでみよう。" },
        onboardFirstBody: { ko: "한국에서 마주칠 만한 간판으로 실용적인 단어를 익혀요.", en: "Learn useful words from signs you might see in Korea.", ja: "韓国で見かける看板から、役立つ言葉を学びます。" },
        onboardSecondTitle: { ko: "보고, 뜻을 열고,<br>스와이프하세요.", en: "Guess, reveal,<br>swipe.", ja: "見て、意味を確認し、<br>スワイプ。" },
        onboardSecondBody: { ko: "간판을 보고 뜻을 예상한 뒤 ‘뜻 보기’를 누르세요. 알면 오른쪽, 다시 보고 싶으면 왼쪽으로 넘기세요.", en: "Look at the sign, then tap Show meaning. Swipe right for Got it or left for Practice again.", ja: "看板を見て意味を予想し、「意味を見る」をタップ。分かったら右、復習したいなら左へスワイプします。" },
        learn: { ko: "학습", en: "Learn", ja: "学習" },
        review: { ko: "복습", en: "Review", ja: "復習" },
        settings: { ko: "설정", en: "Settings", ja: "設定" },
        viewResults: { ko: "학습 결과 보기", en: "View session results", ja: "学習結果を見る" },
        continueSession: { ko: "이어서 학습하기", en: "Continue your session", ja: "学習を再開" },
        choicesSaved: { ko: "선택 내용이 저장됐어요", en: "Your choices are saved", ja: "選択内容を保存しました" },
        of: { ko: "{a}/{b}", en: "{a} of {b}", ja: "{a} / {b}" },
        view: { ko: "보기", en: "View", ja: "見る" },
        heroLabel: { ko: "읽을 거리가 가득한 도시", en: "A CITY TO READ", ja: "街を読もう" },
        heroTitle: { ko: "간판 하나로<br>도시를 읽어요.", en: "Every sign<br>has a story.", ja: "看板から<br>街が見えてくる。" },
        heroBody: { ko: "거리에서 보고, 뜻을 알고, 실제로 써보세요.", en: "See it on the street. Understand it for real.", ja: "街で見かける言葉の意味を知ろう。" },
        chooseScene: { ko: "장면 선택", en: "Choose a scene", ja: "場面を選ぶ" },
        newSigns: { ko: "새 간판 {n}개", en: "{n} new signs", ja: "新しい看板 {n}枚" },
        newShort: { ko: "새 카드 {n}개", en: "{n} new", ja: "新着 {n}枚" },
        sessionSigns: { ko: "이번 세션의 간판 {n}개", en: "{n} signs in this session", ja: "今回の看板 {n}枚" },
        prototypeNote: { ko: "체험용 디자인 · 예시 간판 6개", en: "Interactive prototype · six sample signs", ja: "体験用デザイン · サンプル看板6枚" },
        allSeen: { ko: "모든 간판을 봤어요!", en: "You've seen every sign!", ja: "すべての看板を見ました！" },
        keepFresh: { ko: "복습으로 기억을 이어가세요.", en: "Keep them fresh with a quick review.", ja: "復習して記憶を定着させましょう。" },
        noNewCategory: { ko: "이 분류에는 새 간판이 없어요.", en: "No new signs in this category.", ja: "このカテゴリーに新しい看板はありません。" },
        chooseOther: { ko: "다른 분류를 골라 계속 학습하세요.", en: "Choose another category to keep learning.", ja: "ほかのカテゴリーを選んで学習しましょう。" },
        chooseAnother: { ko: "다른 분류 선택", en: "Choose another category", ja: "ほかのカテゴリーを選ぶ" },
        reviewSigns: { ko: "간판 복습하기", en: "Review signs", ja: "看板を復習" },
        saveClose: { ko: "저장하고 닫기", en: "Save and close", ja: "保存して閉じる" },
        undo: { ko: "되돌리기", en: "Undo", ja: "元に戻す" },
        photoCard: { ko: "사진 카드", en: "PHOTO CARD", ja: "写真カード" },
        illustrativePhoto: { ko: "예시 이미지", en: "ILLUSTRATIVE PHOTO", ja: "イメージ写真" },
        enlargePhoto: { ko: "간판 사진 확대", en: "Enlarge sign photo", ja: "看板写真を拡大" },
        photoAlt: { ko: "한국어 간판 예시 사진. 누르면 확대됩니다.", en: "Illustrative Korean sign photo; tap to enlarge", ja: "韓国語の看板イメージ。タップすると拡大します。" },
        imageUnavailable: { ko: "사진을 불러올 수 없어요", en: "Image unavailable", ja: "写真を表示できません" },
        imageStillReveal: { ko: "뜻은 계속 확인할 수 있어요.", en: "You can still reveal the meaning.", ja: "意味は引き続き確認できます。" },
        question: { ko: "이 간판은 무슨 뜻일까요?", en: "What does this sign mean?", ja: "この看板はどういう意味？" },
        showMeaning: { ko: "뜻 보기", en: "Show meaning", ja: "意味を見る" },
        practiceAgain: { ko: "다시 볼래요", en: "Practice again", ja: "もう一度練習" },
        gotIt: { ko: "알겠어요", en: "Got it", ja: "分かった" },
        stampPractice: { ko: "다시 볼래요", en: "PRACTICE", ja: "もう一度" },
        stampGotIt: { ko: "알겠어요", en: "GOT IT", ja: "分かった" },
        sessionComplete: { ko: "학습 완료!", en: "Session<br>complete.", ja: "学習完了！" },
        signsSeen: { ko: "간판 {n}개를 봤어요", en: "{n} signs seen", ja: "看板を{n}枚見ました" },
        stillPractice: { ko: "복습할 간판 {n}개", en: "{n} signs still need practice", ja: "復習する看板 {n}枚" },
        reviewAgain: { ko: "다시 복습하기", en: "Review again", ja: "もう一度復習" },
        backReview: { ko: "복습 목록으로", en: "Back to Review", ja: "復習一覧へ" },
        learnMore: { ko: "새 간판 더 보기", en: "Learn more signs", ja: "新しい看板を見る" },
        backLearn: { ko: "학습 홈으로", en: "Back to Learn", ja: "学習ホームへ" },
        undoLast: { ko: "마지막 선택 되돌리기", en: "Undo last choice", ja: "最後の選択を戻す" },
        reviewHero: { ko: "한 번 더 보면 익숙해져요.", en: "Worth a second look.", ja: "もう一度見ると覚えられる。" },
        reviewDesc: { ko: "다시 연습하고 싶다고 표시한 간판이에요.", en: "Signs you marked for more practice.", ja: "もう一度練習したいと選んだ看板です。" },
        signsCount: { ko: "간판 {n}개", en: "{n} signs", ja: "看板 {n}枚" },
        newestFirst: { ko: "최근 선택순", en: "NEWEST FIRST", ja: "新しい順" },
        tapDetails: { ko: "눌러서 자세히 보기", en: "Tap to see details", ja: "タップして詳細を見る" },
        startReviewing: { ko: "복습 시작", en: "Start reviewing", ja: "復習を始める" },
        nothingReview: { ko: "아직 복습할 간판이 없어요.", en: "Nothing to review yet.", ja: "復習する看板はまだありません。" },
        swipeLeftAppears: { ko: "왼쪽으로 넘긴 간판이 여기에 모여요.", en: "Signs you swipe left will appear here.", ja: "左にスワイプした看板がここに表示されます。" },
        signDetails: { ko: "간판 자세히 보기", en: "Sign details", ja: "看板の詳細" },
        howItWorks: { ko: "사용 방법", en: "How it works", ja: "使い方" },
        resetProgress: { ko: "학습 기록 초기화", en: "Reset learning progress", ja: "学習記録をリセット" },
        about: { ko: "앱 정보", en: "About", ja: "アプリについて" },
        settingsHint: { ko: "학습 기록은 이 브라우저에만 저장돼요. 초기화하거나 브라우저 데이터를 지우면 기록이 사라집니다. 이 체험판에는 AI로 만든 예시 간판 사진 6장을 사용했어요.", en: "Your choices are saved only in this browser. Resetting or clearing browser data removes your progress. This prototype uses six AI-generated illustrative sign photos.", ja: "学習記録はこのブラウザーにのみ保存されます。リセットやブラウザーデータの削除で記録は消えます。この体験版にはAI生成の看板イメージを6枚使用しています。" },
        resetTitle: { ko: "학습 기록을 초기화할까요?", en: "Reset your progress?", ja: "学習記録をリセットしますか？" },
        resetBody: { ko: "이 기기의 학습·복습 기록이 삭제됩니다. 되돌릴 수 없어요.", en: "This removes your learning and review history on this device. You can't undo this.", ja: "この端末の学習・復習記録を削除します。元には戻せません。" },
        cancel: { ko: "취소", en: "Cancel", ja: "キャンセル" },
        close: { ko: "닫기", en: "Close", ja: "閉じる" },
        aboutTitle: { ko: "Sign by Sign 소개", en: "About Sign by Sign", ja: "Sign by Sign について" },
        aboutBody: { ko: "PRD·SRS를 바탕으로 만든 인터랙티브 디자인 체험판입니다. AI로 만든 예시 간판 사진 6장이 들어 있으며 계정·카메라·인터넷 연결이 필요하지 않습니다.", en: "Interactive design prototype based on the PRD/SRS. Includes six AI-generated illustrative sign photos. No account, camera, or network connection is required.", ja: "PRD・SRSに基づく操作可能なデザイン体験版です。AI生成の看板イメージ6枚を収録。アカウント、カメラ、ネット接続は不要です。" },
        newSessionTitle: { ko: "새 세션을 시작할까요?", en: "Start a new session?", ja: "新しい学習を始めますか？" },
        newSessionBody: { ko: "진행 중인 세션이 교체됩니다. 이미 선택한 간판의 기록은 유지돼요.", en: "Your current session will be replaced. Your completed choices will stay saved.", ja: "進行中の学習を切り替えます。選択済みの記録は残ります。" },
        startNew: { ko: "새로 시작", en: "Start new", ja: "新しく始める" },
        signPhotoIllustrative: { ko: "간판 사진 · 예시 이미지", en: "Sign photo · illustrative", ja: "看板写真 · イメージ" },
        closePhoto: { ko: "사진 닫기", en: "Close photo", ja: "写真を閉じる" },
        enlargedPhoto: { ko: "확대한 간판 사진", en: "Enlarged sign photo", ja: "拡大した看板写真" },
        zoomOut: { ko: "축소", en: "Zoom out", ja: "縮小" },
        zoomIn: { ko: "확대", en: "Zoom in", ja: "拡大" },
        pinchHint: { ko: "손가락으로 확대하거나 버튼을 누르세요", en: "PINCH OR USE BUTTONS", ja: "ピンチまたはボタンで拡大" }
      };
      Object.assign(messages, {
  "directory": {
    "ko": "간판 둘러보기",
    "en": "Sign library",
    "ja": "看板ライブラリ"
  },
  "camera": {
    "ko": "간판 촬영",
    "en": "Scan a sign",
    "ja": "看板を撮影"
  },
  "capture": {
    "ko": "사진 찍기",
    "en": "Take photo",
    "ja": "写真を撮る"
  },
  "upload": {
    "ko": "사진 선택",
    "en": "Choose photo",
    "ja": "写真を選ぶ"
  },
  "cameraOn": {
    "ko": "카메라 켜기",
    "en": "Open camera",
    "ja": "カメラを起動"
  },
  "retake": {
    "ko": "다시 촬영",
    "en": "Retake",
    "ja": "撮り直す"
  },
  "readText": {
    "ko": "문자 읽기",
    "en": "Read text",
    "ja": "文字を読み取る"
  },
  "realPhoto": {
    "ko": "실제 사진",
    "en": "Real photo",
    "ja": "実際の写真"
  },
  "sources": {
    "ko": "사진 출처",
    "en": "Image credits",
    "ja": "画像の出典"
  },
  "allSubtypes": {
    "ko": "전체 세부 분류",
    "en": "All types",
    "ja": "すべての種類"
  },
  "allCategories": {
    "ko": "모든 분야",
    "en": "All categories",
    "ja": "すべての分野"
  },
  "heroLabel": {
    "ko": "거리에서 바로 쓰는 한국어",
    "en": "KOREAN, OUT IN THE WORLD",
    "ja": "街で使える韓国語"
  },
  "heroTitle": {
    "ko": "간판으로 읽는<br><em>나의 첫 한국.</em>",
    "en": "Read the signs.<br><em>Find your Korea.</em>",
    "ja": "看板を読んで、<br><em>韓国をもっと身近に。</em>"
  },
  "heroBody": {
    "ko": "한글을 읽을 줄 안다면, 이제 뜻을 알아갈 차례예요. 한 장씩 넘기며 거리의 한국어를 익혀보세요.",
    "en": "You can read Hangul. Now connect it to the world around you, one sign at a time.",
    "ja": "ハングルが読めたら、次は意味を知る番。看板を一枚ずつめくって街の韓国語を学ぼう。"
  },
  "chooseScene": {
    "ko": "어떤 간판부터 알아볼까요?",
    "en": "Where shall we start?",
    "ja": "どの看板から学ぶ？"
  },
  "categorySubtitle": {
    "ko": "4개 분야 · 12개 세부 분류",
    "en": "4 categories · 12 types",
    "ja": "4分野・12種類"
  },
  "featureTag": {
    "ko": "보고 · 이해하고 · 기억하기",
    "en": "SEE · UNDERSTAND · REMEMBER",
    "ja": "見て・分かって・覚える"
  },
  "startSelected": {
    "ko": "선택한 분야 학습하기",
    "en": "Learn this category",
    "ja": "選んだ分野を学ぶ"
  },
  "selectedForLearning": {
    "ko": "{name} 학습",
    "en": "Learn {name}",
    "ja": "{name}を学ぶ"
  },
  "learningHint": {
    "ko": "뜻을 열어보고, 알면 오른쪽 · 다시 보고 싶으면 왼쪽.",
    "en": "Reveal the meaning. Right for got it, left to practice again.",
    "ja": "意味を確認して、分かったら右、復習したければ左へ。"
  },
  "libraryTitle": {
    "ko": "거리의 간판을 모았어요.",
    "en": "A little library of the city.",
    "ja": "街の看板を集めました。"
  },
  "libraryBody": {
    "ko": "분야와 세부 분류로 찾고, 사진을 눌러 뜻을 확인하세요.",
    "en": "Filter by category and type, then open a photo to learn its meaning.",
    "ja": "分野や種類で探して、写真から意味を確認できます。"
  },
  "search": {
    "ko": "간판 검색",
    "en": "Search signs",
    "ja": "看板を検索"
  },
  "searchPlaceholder": {
    "ko": "간판·브랜드·뜻으로 검색",
    "en": "Search signs, brands, meanings",
    "ja": "看板・ブランド・意味で検索"
  },
  "category": {
    "ko": "분야",
    "en": "Category",
    "ja": "分野"
  },
  "subcategory": {
    "ko": "세부 분류",
    "en": "Type",
    "ja": "種類"
  },
  "noSearchResults": {
    "ko": "찾는 간판이 아직 없어요. 다른 단어로 검색해보세요.",
    "en": "No signs found. Try a different word.",
    "ja": "該当する看板がありません。別の言葉で検索してください。"
  },
  "addReview": {
    "ko": "복습에 저장",
    "en": "Save for practice",
    "ja": "復習に保存"
  },
  "savedReview": {
    "ko": "복습에 저장됐어요",
    "en": "Saved for practice",
    "ja": "復習に保存しました"
  },
  "viewSign": {
    "ko": "간판 알아보기",
    "en": "Explore sign",
    "ja": "看板を見る"
  },
  "creditLabel": {
    "ko": "작성자·라이선스",
    "en": "Author · license",
    "ja": "作者・ライセンス"
  },
  "illustrativePhoto": {
    "ko": "학습용 예시",
    "en": "Illustration",
    "ja": "学習用イメージ"
  },
  "prototypeNote": {
    "ko": "간판 12개 · 사진과 학습용 예시",
    "en": "12 signs · photos and educational illustrations",
    "ja": "看板12枚・写真と学習用イメージ"
  },
  "settingsHint": {
    "ko": "학습 기록과 AI 수정 내용은 이 기기에 저장됩니다. 사진은 기본적으로 기기 안에서 분석하며, 동의한 새 간판 제보만 검토 대기열에 저장합니다.",
    "en": "Learning history and AI corrections stay on this device. Photos are analyzed on-device by default; only consented new-sign reports enter the review queue.",
    "ja": "学習履歴とAI修正はこの端末に保存されます。写真は基本的に端末内で分析し、同意した新規看板のみ審査待ちに保存します。"
  },
  "aboutBody": {
    "ko": "한국 간판을 촬영해 업종과 여행 정보를 확인하는 Android 앱입니다. 기기 내 OCR, 사용자 수정 기반 개인화 매칭, 간격 반복 복습과 커뮤니티 제보 대기열을 제공합니다.",
    "en": "An Android app that scans Korean signs for category and travel guidance. It combines on-device OCR, correction-based personalized matching, spaced review and a community report queue.",
    "ja": "韓国の看板を撮影し、業種と旅行情報を確認するAndroidアプリです。端末内OCR、修正ベースの個人化、間隔反復、投稿待機列を備えています。"
  },
  "cameraTitle": {
    "ko": "지금 눈앞의 간판, 무슨 뜻일까요?",
    "en": "What does that sign say?",
    "ja": "目の前の看板、どんな意味？"
  },
  "cameraBody": {
    "ko": "간판을 촬영하거나 사진을 골라 업종·브랜드와 뜻을 확인해보세요.",
    "en": "Take or choose a photo to look up its type, brand and meaning.",
    "ja": "撮影した写真から、業種・ブランドと意味を確認しましょう。"
  },
  "cameraPlaceholder": {
    "ko": "간판 글자가 크고 선명하게 보이도록 촬영하세요.",
    "en": "Keep the sign text large and clear in the frame.",
    "ja": "看板の文字が大きく鮮明に写るように撮影してください。"
  },
  "cameraPrivacy": {
    "ko": "사진은 기기에서만 분석해요. 인식한 글자만 데이터베이스와 대조합니다.",
    "en": "Your photo is processed on this device. Recognized text is matched locally in the app.",
    "ja": "写真は端末内で処理し、読み取った文字だけを照合します。"
  },
  "cropHint": {
    "ko": "간판 부분을 드래그해 선택하면 더 잘 읽어요. 선택하지 않으면 사진 전체를 읽습니다.",
    "en": "Drag over the sign to crop it for better results. Otherwise the whole photo is read.",
    "ja": "看板部分をドラッグで選択すると読み取りやすくなります。未選択なら写真全体を読み取ります。"
  },
  "resetCrop": {
    "ko": "영역 선택 초기화",
    "en": "Reset crop",
    "ja": "範囲をリセット"
  },
  "recognizedText": {
    "ko": "인식한 간판 글자",
    "en": "Sign text",
    "ja": "読み取った文字"
  },
  "textHint": {
    "ko": "잘못 읽힌 글자는 수정한 뒤 확인하세요. 문구를 직접 입력해도 됩니다.",
    "en": "Correct any misread letters before looking it up. You can also type the sign text.",
    "ja": "読み間違いは修正できます。看板の文字を直接入力することもできます。"
  },
  "textPlaceholder": {
    "ko": "예: 약국, 메가커피, 버스정류장",
    "en": "e.g. 약국, 메가커피, 버스정류장",
    "ja": "例：약국、메가커피、버스정류장"
  },
  "lookup": {
    "ko": "간판 정보 확인",
    "en": "Look up sign",
    "ja": "看板情報を確認"
  },
  "scanFormTitle": {
    "ko": "사진에서 글자 읽기",
    "en": "Read the sign",
    "ja": "写真から文字を読む"
  },
  "scanScope": {
    "ko": "등록된 업종·브랜드를 안내해요. 특정 지점이나 현재 영업 여부를 확인하는 기능은 아니에요.",
    "en": "Results identify a registered type or brand, not a particular branch or live opening status.",
    "ja": "登録済みの業種・ブランドを案内します。特定の店舗や現在の営業状況は確認できません。"
  },
  "ocrLoading": {
    "ko": "문자 인식을 준비하고 있어요…",
    "en": "Preparing text recognition…",
    "ja": "文字認識を準備しています…"
  },
  "ocrReading": {
    "ko": "간판의 글자를 읽고 있어요…",
    "en": "Reading the sign…",
    "ja": "看板の文字を読み取っています…"
  },
  "ocrDone": {
    "ko": "글자를 읽었어요. 문구를 확인한 뒤 정보를 찾아보세요.",
    "en": "Text is ready. Check it, then look up the sign.",
    "ja": "文字を読み取りました。内容を確認して情報を検索してください。"
  },
  "ocrEmpty": {
    "ko": "읽을 수 있는 글자를 찾지 못했어요. 간판을 크게 찍거나 문구를 직접 입력해주세요.",
    "en": "No readable text found. Try a closer photo or type the text.",
    "ja": "読み取れる文字が見つかりません。近くから撮影するか、文字を入力してください。"
  },
  "ocrError": {
    "ko": "문자를 읽지 못했어요. 다시 시도하거나 문구를 직접 입력해주세요.",
    "en": "Could not read the text. Try again or type it manually.",
    "ja": "読み取りに失敗しました。再試行するか、文字を入力してください。"
  },
  "cameraDenied": {
    "ko": "카메라 권한을 허용하거나 사진 선택을 이용해주세요.",
    "en": "Allow camera access, or choose a photo instead.",
    "ja": "カメラを許可するか、写真を選んでください。"
  },
  "cameraUnavailable": {
    "ko": "실시간 카메라를 열 수 없어요. 스마트폰 촬영 또는 사진 선택을 이용해주세요.",
    "en": "Live camera is unavailable. Use your phone camera or choose a photo.",
    "ja": "カメラを起動できません。スマホで撮影するか写真を選んでください。"
  },
  "nativeCamera": {
    "ko": "스마트폰으로 촬영",
    "en": "Use phone camera",
    "ja": "スマホで撮影"
  },
  "sampleScan": {
    "ko": "샘플 간판 결과 보기",
    "en": "Preview a sample result",
    "ja": "サンプル結果を見る"
  },
  "invalidImage": {
    "ko": "열 수 없는 사진이에요. JPG·PNG·WebP 사진을 선택해주세요.",
    "en": "This image cannot be opened. Choose a JPG, PNG or WebP photo.",
    "ja": "画像を開けません。JPG・PNG・WebPを選んでください。"
  },
  "largeImage": {
    "ko": "사진은 16MB 이하로 선택해주세요.",
    "en": "Choose a photo smaller than 16 MB.",
    "ja": "16MB以下の写真を選んでください。"
  },
  "matching": {
    "ko": "데이터베이스에서 찾고 있어요…",
    "en": "Looking it up…",
    "ja": "データベースで検索しています…"
  },
  "emptyText": {
    "ko": "간판에 적힌 문구를 입력해주세요.",
    "en": "Enter the text on the sign.",
    "ja": "看板の文字を入力してください。"
  },
  "matchError": {
    "ko": "정보를 불러오지 못했어요. 서버 연결을 확인한 뒤 다시 시도해주세요.",
    "en": "Could not look up the sign. Check the server connection and try again.",
    "ja": "情報を取得できません。接続を確認して再試行してください。"
  },
  "matched": {
    "ko": "등록 문구 일치",
    "en": "Registered text matched",
    "ja": "登録文字と一致"
  },
  "confirmed": {
    "ko": "선택한 간판",
    "en": "Your selected sign",
    "ja": "選択した看板"
  },
  "placeName": {
    "ko": "장소·가게명",
    "en": "Place or business",
    "ja": "場所・店舗名"
  },
  "placeInformation": {
    "ko": "가게 정보",
    "en": "Place information",
    "ja": "店舗情報"
  },
  "easyExplanation": {
    "ko": "쉽게 설명하면",
    "en": "In simple terms",
    "ja": "わかりやすく言うと"
  },
  "expectedExperience": {
    "ko": "기대할 수 있는 경험",
    "en": "What to expect",
    "ja": "期待できること"
  },
  "usefulKorean": {
    "ko": "바로 쓰는 한국어",
    "en": "Useful Korean",
    "ja": "すぐ使える韓国語"
  },
  "recognizedSign": {
    "ko": "인식한 간판",
    "en": "Recognized sign",
    "ja": "認識した看板"
  },
  "recognitionConfidence": {
    "ko": "인식 신뢰도 {n}%",
    "en": "Recognition confidence {n}%",
    "ja": "認識信頼度 {n}%"
  },
  "generalExperienceNotice": {
    "ko": "이 내용은 해당 업종에서 일반적으로 기대할 수 있는 경험이며 실제 매장과 다를 수 있어요.",
    "en": "This describes a typical experience for this type of place; the actual location may differ.",
    "ja": "この内容は同じ業種で一般的に期待できるもので、実際の店舗とは異なる場合があります。"
  },
  "candidateTitle": {
    "ko": "이 간판이 맞나요?",
    "en": "Is it one of these?",
    "ja": "この看板ですか？"
  },
  "candidateBody": {
    "ko": "글자가 불확실하거나 여러 표현이 함께 보여요. 사진과 뜻을 확인해 골라주세요.",
    "en": "The text is uncertain or contains multiple signs. Choose after checking the meaning.",
    "ja": "文字が不明確、または複数の看板があります。意味を確認して選んでください。"
  },
  "noMatchTitle": {
    "ko": "아직 등록된 표현을 찾지 못했어요.",
    "en": "No registered expression found.",
    "ja": "登録された表現が見つかりません。"
  },
  "noMatchBody": {
    "ko": "문구를 고쳐 검색하거나 간판 부분만 다시 촬영해보세요.",
    "en": "Edit the text or take a closer photo of just the sign.",
    "ja": "文字を修正するか、看板だけを撮り直してください。"
  },
  "typeMatch": {
    "ko": "업종 표현 일치",
    "en": "Type expression matched",
    "ja": "業種表現と一致"
  },
  "brandMatch": {
    "ko": "브랜드 표현 일치",
    "en": "Brand expression matched",
    "ja": "ブランド表現と一致"
  },
  "contextPhoto": {
    "ko": "현장 참고 사진",
    "en": "Street context photo",
    "ja": "現地の参考写真"
  },
  "sourcesBody": {
    "ko": "실제 사진은 작성자와 라이선스를, 학습용 예시는 제작 정보를 표시합니다.",
    "en": "Photographs retain their author and license; illustrations show how they were made.",
    "ja": "写真は作者・ライセンスを、イメージは制作情報を表示します。"
  },
  "originalSource": {
    "ko": "원본 출처",
    "en": "Original source",
    "ja": "元の出典"
  },
  "license": {
    "ko": "라이선스",
    "en": "License",
    "ja": "ライセンス"
  },
  "mapsNaver": {
    "ko": "네이버 지도에서 찾기",
    "en": "Find on Naver Maps",
    "ja": "NAVERマップで検索"
  },
  "mapsGoogle": {
    "ko": "Google Maps에서 찾기",
    "en": "Find on Google Maps",
    "ja": "Google Mapsで検索"
  },
  "exampleNotice": {
    "ko": "실제 지점의 사진이 아닌 직접 제작한 학습용 예시입니다.",
    "en": "An original learning illustration, not a photograph of an actual branch.",
    "ja": "実店舗の写真ではなく、学習のために制作したイメージです。"
  },
  "photoAlt": {
    "ko": "한국어 간판 이미지. 누르면 확대됩니다.",
    "en": "Korean sign image. Tap to enlarge.",
    "ja": "韓国語の看板。タップで拡大します。"
  },
  "signPhotoIllustrative": {
    "ko": "간판 이미지",
    "en": "Sign image",
    "ja": "看板画像"
  },
  "cancelRecognition": {
    "ko": "인식 중단",
    "en": "Cancel recognition",
    "ja": "認識を中止"
  },
  "photosCount": {
    "ko": "사진 {n}개",
    "en": "{n} images",
    "ja": "画像{n}枚"
  },
  "cameraOpening": {
    "ko": "카메라를 연결하고 있어요…",
    "en": "Opening camera…",
    "ja": "カメラを接続しています…"
  }
});
      Object.assign(messages, {
        community: { ko: "AI 학습", en: "AI learning", ja: "AI学習" },
        communityTitle: { ko: "함께 똑똑해지는 간판 AI", en: "A sign AI that improves together", ja: "みんなで育てる看板AI" },
        communityBody: { ko: "수정 피드백은 이 기기의 다음 인식에 반영되고, 동의한 새 간판 제보는 검토 대기열에 저장됩니다.", en: "Corrections improve matching on this device. Consented new-sign reports enter a review queue.", ja: "修正はこの端末の次回認識に反映され、同意した新規看板は審査待ちに保存されます。" },
        learnedAliases: { ko: "학습한 표현", en: "Learned expressions", ja: "学習した表現" },
        feedbackCount: { ko: "AI 피드백", en: "AI feedback", ja: "AIフィードバック" },
        pendingReports: { ko: "검토 대기", en: "Pending review", ja: "審査待ち" },
        submittedReports: { ko: "제출됨 · 검토 중", en: "Submitted for review", ja: "送信済み・審査中" },
        publishedUpdates: { ko: "공개 업데이트", en: "Published updates", ja: "公開更新" },
        syncNow: { ko: "최신 정보 동기화", en: "Sync latest information", ja: "最新情報を同期" },
        syncing: { ko: "최신 정보를 확인하고 있어요…", en: "Checking for updates…", ja: "最新情報を確認中…" },
        syncDone: { ko: "최신 공개 정보를 확인했어요.", en: "Published information is up to date.", ja: "公開情報を更新しました。" },
        syncBundled: { ko: "공개 목록에 연결하지 못해 앱에 포함된 정보를 사용해요.", en: "Could not reach the published catalog. Using the information included in this app.", ja: "公開リストに接続できないため、アプリ内の情報を使用します。" },
        syncOffline: { ko: "오프라인이라 기기에 저장된 정보를 사용해요.", en: "Offline: using information saved on this device.", ja: "オフラインのため端末の情報を使用します。" },
        learningHowTitle: { ko: "어떻게 학습하나요?", en: "How does it learn?", ja: "どのように学習する？" },
        learningHowBody: { ko: "기기 내 OCR 모델이 글자를 읽고 등록 간판과 비교합니다. 사용자가 정답을 확인하거나 수정하면 같은 표현의 다음 후보 순위가 강화됩니다. 낮은 신뢰도 결과는 자동 확정하지 않습니다.", en: "On-device OCR reads text and compares it with registered signs. Confirmations and corrections strengthen future ranking for the same expression. Low-confidence results are never auto-confirmed.", ja: "端末内OCRが文字を読み、登録看板と比較します。確認・修正は次回の候補順位に反映され、低信頼度は自動確定しません。" },
        spacedTitle: { ko: "맞춤 반복 학습", en: "Adaptive repetition", ja: "適応型反復学習" },
        spacedBody: { ko: "알겠어요를 누른 카드는 1·3·7·14·30일 간격으로 다시 나타나고, 다시 볼래요를 누르면 즉시 복습 목록으로 돌아옵니다.", en: "Cards marked Got it return after 1, 3, 7, 14, then 30 days. Practice again returns them immediately.", ja: "「分かった」は1・3・7・14・30日後に再登場し、「もう一度」はすぐ復習に戻ります。" },
        correctAi: { ko: "다른 결과로 수정", en: "Correct this result", ja: "別の結果に修正" },
        reinforceAi: { ko: "맞아요 · AI 강화", en: "Correct · reinforce AI", ja: "正しい・AIを強化" },
        reinforced: { ko: "이 기기의 AI가 이 표현을 학습했어요.", en: "The on-device AI learned this expression.", ja: "端末のAIがこの表現を学習しました。" },
        teachAi: { ko: "새 간판을 AI에게 가르치기", en: "Teach the AI a new sign", ja: "AIに新しい看板を教える" },
        teachTitle: { ko: "새 간판 제보", en: "Report a new sign", ja: "新しい看板を投稿" },
        storeName: { ko: "가게·장소 이름", en: "Store or place name", ja: "店・場所の名前" },
        description: { ko: "어떤 곳인지 설명", en: "What kind of place is it?", ja: "どんな場所ですか？" },
        photoConsent: { ko: "이 사진과 수정 정보를 AI 개선용 검토 대기열에 저장하는 데 동의해요.", en: "I consent to saving this photo and correction in the AI improvement review queue.", ja: "写真と修正情報をAI改善の審査待ちに保存することに同意します。" },
        submitReport: { ko: "제보 저장", en: "Save report", ja: "投稿を保存" },
        reportSaved: { ko: "제보를 기기에 저장했어요. 온라인 제출 서버가 연결되면 검토용으로 동기화됩니다.", en: "Saved on this device. It will sync for review when a submission service is connected.", ja: "端末に保存しました。投稿サービス接続後に審査用として同期されます。" },
        suggestedCategory: { ko: "AI 추천 카테고리: {name} · {n}%", en: "AI category suggestion: {name} · {n}%", ja: "AI推奨カテゴリー: {name}・{n}%" },
        queueEmpty: { ko: "아직 제보 대기 항목이 없어요.", en: "No reports are waiting yet.", ja: "審査待ちの投稿はありません。" },
        privacyLearning: { ko: "사진은 동의 없이 공유되지 않으며 기본 OCR과 개인화 매칭은 기기 안에서 처리됩니다.", en: "Photos are never shared without consent. OCR and personalized matching run on the device by default.", ja: "写真は同意なく共有されません。OCRと個人化マッチングは基本的に端末内で処理されます。" }
      });
      if (!mobileMode) {
        messages.settingsHint = {
          ko: "학습·복습 기록은 이 브라우저에 저장됩니다. 촬영 사진은 기기에서 문자를 읽는 데만 사용하며 서버에는 인식한 문구만 전송합니다. 사진 출처에서 실제 사진과 학습용 예시의 정보를 확인할 수 있어요.",
          en: "Your learning history stays in this browser. Photos are processed on your device; only recognized text is sent to the server. Image credits distinguish photos from illustrations.",
          ja: "学習記録はこのブラウザーに保存されます。写真は端末で処理し、読み取った文字だけをサーバーへ送信します。画像の出典で写真とイメージを確認できます。"
        };
        messages.aboutBody = {
          ko: "한국의 간판을 사진으로 익히는 웹앱입니다. 4개 분야·12개 세부 분류를 SQLite 데이터베이스에서 불러옵니다. 촬영한 사진의 글자를 읽어 등록된 업종·브랜드 표현과 대조합니다.",
          en: "A web app for learning Korean signs. The SQLite catalog contains 4 categories and 12 types. Read text from your photo and compare it with registered industry and brand terms.",
          ja: "韓国の看板を写真で学ぶウェブアプリです。SQLiteの4分野・12種類を使い、写真の文字を登録済みの業種やブランドと照合します。"
        };
        messages.cameraPrivacy.en = "Your photo is processed on this device. Only text is sent for matching.";
      }
      var app = document.getElementById("app");
      var state = loadState();
      var screen = !state.languageChosen ? "language-setup" : (state.onboarded ? "home" : "onboarding");
      var onboardStep = 0;
      var onboardReturn = "home";
      var settingsReturn = "home";
      var languageMenuOpen = false;
      var detailId = null;
      var detailRevealed = false;
      var modal = null;
      var zoomCard = null;
      var zoomScale = 1;
      var zoomX = 0;
      var zoomY = 0;
      var suppressZoomUntil = 0;
      var choiceLocked = false;
      var detailReturn = "review";
      var libraryQuery = "";
      var libraryCategory = "all";
      var librarySubcategory = "all";
      var sourcesReturn = "home";
      var communityBusy = false;
      var communityNotice = "";

      function freshState() {
        return { language: "ko", languageChosen: false, onboarded: false, selectedCategory: "all", selectedSubcategory: "all", progress: {}, activeSession: null, orderSeed: Math.floor(Math.random() * 1000000) };
      }
      function loadState() {
        try {
          var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("sign-by-sign-prototype-v1"));
          if (!parsed || typeof parsed !== "object") return freshState();
          var base = freshState();
          base.language = languages.some(function (item) { return item.code === parsed.language; }) ? parsed.language : "ko";
          base.languageChosen = !!parsed.languageChosen;
          base.onboarded = !!parsed.onboarded;
          base.selectedCategory = categories.some(function (c) { return c.id === parsed.selectedCategory; }) ? parsed.selectedCategory : "all";
          base.selectedSubcategory = subcategories.some(function (s) { return s.id === parsed.selectedSubcategory && s.category === base.selectedCategory; }) ? parsed.selectedSubcategory : "all";
          base.progress = Object.fromEntries(Object.entries(parsed.progress || {}).filter(function (entry) { return findCard(entry[0]); }));
          base.activeSession = parsed.activeSession && Array.isArray(parsed.activeSession.cardIds) ? parsed.activeSession : null;
          if (base.activeSession && (!base.activeSession.cardIds.length || !base.activeSession.cardIds.every(findCard) || !base.activeSession.counts || !Number.isInteger(base.activeSession.index) || base.activeSession.index < 0 || base.activeSession.index > base.activeSession.cardIds.length)) base.activeSession = null;
          base.orderSeed = Number.isFinite(parsed.orderSeed) ? parsed.orderSeed : base.orderSeed;
          return base;
        } catch (e) { return freshState(); }
      }
      function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
        catch (e) { console.warn("Progress could not be saved", e); }
      }
      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
      }
      function t(key, values) {
        var entry = messages[key] || {};
        var value = entry[state.language] || entry.en || key;
        return value.replace(/\{(\w+)\}/g, function (_, name) { return values && values[name] !== undefined ? String(values[name]) : ""; });
      }
      function currentLanguageName() {
        var entry = languages.find(function (item) { return item.code === state.language; });
        return entry ? entry.name : "한국어";
      }
      function cardContent(card) {
        return card.translations[state.language] || card.translations.en;
      }
      function findCard(id) { return cards.find(function (c) { return c.id === id; }); }
      function categoryLabel(id) { var c = categories.find(function (item) { return item.id === id; }); return c ? c.label[state.language] : categories[0].label[state.language]; }
      function icon(name) {
        var paths = {
          home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
          bookmark: '<path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-5-7 5z"/>',
          settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.86 1.86-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 1.57V20h-2.6v-.03A1.7 1.7 0 0 0 11.4 18.4a1.7 1.7 0 0 0-1.88.34l-.06.06L7.6 16.94l.06-.06A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.57-1H6.4v-2.6h.03A1.7 1.7 0 0 0 8 10.4a1.7 1.7 0 0 0-.34-1.88L7.6 8.46 9.46 6.6l.06.06A1.7 1.7 0 0 0 11.4 7a1.7 1.7 0 0 0 1-1.57V5.4H15v.03A1.7 1.7 0 0 0 16 7a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.86 1.86-.06.06A1.7 1.7 0 0 0 19.4 10.4a1.7 1.7 0 0 0 1.57 1h.03V14h-.03A1.7 1.7 0 0 0 19.4 15z"/>',
          check: '<path d="m5 12 4 4L19 6"/>',
          close: '<path d="M5 5 19 19M19 5 5 19"/>',
          expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
          globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.7 5.5 3.7 9S14.5 18.5 12 21M12 3c-2.5 2.5-3.7 5.5-3.7 9S9.5 18.5 12 21"/>',
          arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
          back: '<path d="m15 18-6-6 6-6"/>',
          camera: '<path d="M4 6h4l2-3h4l2 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><circle cx="12" cy="12" r="4"/>',
          grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
          medical: '<path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5z"/>',
          coffee: '<path d="M3 8h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM17 9h2a3 3 0 0 1 0 6h-2M6 3v2M10 3v2M14 3v2"/>',
          train: '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 18l-3 4M15 18l3 4"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>',
          food: '<path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v19M19 3c-3 3-3 7 0 9v10M19 3v9"/>',
          spark: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/><path d="m19 17 .5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5z"/>'
        };
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.spark) + '</svg>';
      }
      function languageOptionsMarkup(action) {
        return '<div class="language-options" role="group" aria-label="' + escapeHtml(t("language")) + '">' +
          languages.map(function (item) {
            var selected = state.language === item.code;
            return '<button class="language-option ' + (selected ? "selected" : "") + '" data-action="' + action +
              '" data-lang="' + item.code + '" aria-pressed="' + selected + '"><span lang="' + item.code + '">' +
              item.name + '</span><span class="radio" aria-hidden="true"></span></button>';
          }).join("") + '</div>';
      }
      function renderLanguageSetup() {
        return '<div class="screen language-setup-screen"><div class="language-picker-image"><img src="assets/cafe.png" alt="' + escapeHtml(t("photoAlt")) + '"></div>' +
          '<div class="language-picker-copy"><span class="small-caps">SIGN BY SIGN</span><h1>' + t("chooseLanguage") +
          '</h1><p>' + t("languageHint") + '</p></div>' +
          languageOptionsMarkup("setup-language") +
          '<div class="language-picker-footer"><button class="primary-btn" data-action="confirm-language">' + t("continue") +
          ' ' + icon("arrow") + '</button></div></div>';
      }
function renderLanguageBar() {
        var links = [["home", "learn"], ["library", "directory"], ["camera", "camera"], ["review", "review"]];
        if (mobileMode) links.push(["community", "community"]);
        return '<header class="language-bar"><button class="brand" data-action="nav-home" aria-label="Sign by Sign"><span class="brand-mark">ㅅ</span>Sign by Sign</button>' +
          '<nav class="web-links" aria-label="' + escapeHtml(t("mainNavigation")) + '">' + links.map(function (item) {
            return '<button class="' + (screen === item[0] ? 'current' : '') + '" data-action="nav-' + item[0] + '" ' + (screen === item[0] ? 'aria-current="page"' : '') + '>' + t(item[1]) + '</button>';
          }).join("") + '</nav><div class="header-tools"><button class="icon-btn quick-camera-btn" data-action="quick-camera" aria-label="' + escapeHtml(t("camera")) + '" title="' + escapeHtml(t("camera")) + '">' + icon("camera") + '</button>' +
          '<button class="language-toggle" data-action="language-menu" aria-label="' + escapeHtml(t("language") + ": " + currentLanguageName()) + '">' + icon("globe") +
          '<span>' + currentLanguageName() + '</span><span aria-hidden="true">⌄</span></button></div></header>';
      }
      function renderLanguageMenu() {
        if (!languageMenuOpen) return "";
        return '<div class="modal-layer"><div class="language-menu" role="dialog" aria-modal="true" aria-label="' +
          escapeHtml(t("chooseLanguage")) + '"><h2>' + t("chooseLanguage") + '</h2><p>' + t("languageHint") + '</p>' +
          languageOptionsMarkup("switch-language") +
          '<button class="secondary-btn language-menu-close" data-action="language-close">' + t("close") +
          '</button></div></div>';
      }
function mainNav(active) {
        return '<nav class="main-nav" aria-label="' + escapeHtml(t("mainNavigation")) + '">' +
          [["home","home","learn"], ["library","grid","directory"], ["camera","camera","camera"], ["review","bookmark","review"]].concat(mobileMode ? [["community","spark","community"]] : []).map(function (item) {
            return '<button class="nav-item ' + (active === item[0] ? 'active' : '') + '" data-action="nav-' + item[0] + '" ' + (active === item[0] ? 'aria-current="page"' : '') + '>' + icon(item[1]) + t(item[2]) + '</button>';
          }).join("") + '</nav>';
      }
      function settingsButton() { return '<button class="icon-btn" data-action="settings" aria-label="' + escapeHtml(t("settings")) + '">' + icon("settings") + '</button>'; }
      function resumeBanner() {
        var s = state.activeSession;
        if (!s) return "";
        var isSummary = s.phase === "results_pending";
        return '<div class="resume"><div class="resume-icon">' + icon(isSummary ? "spark" : "bookmark") + '</div>' +
          '<div class="resume-info"><strong>' + t(isSummary ? "viewResults" : "continueSession") + '</strong><small>' +
          (isSummary ? t("choicesSaved") : t("of", { a: s.index + 1, b: s.cardIds.length }) + " · " + t(s.mode === "learn" ? "learn" : "review")) +
          '</small></div><button data-action="resume">' + t(isSummary ? "view" : "continue") + '</button></div>';
      }
      function unseenCount(category) {
        return cards.filter(function (c) {
          return (!category || category === "all" || c.category === category) && !state.progress[c.id];
        }).length;
      }
      function reviewCards() {
        var now = Date.now();
        return cards.filter(function (c) {
          var progress = state.progress[c.id];
          return progress && (progress.status === "practice" || (progress.dueAt && progress.dueAt <= now));
        }).sort(function (a, b) { return (state.progress[a.id].dueAt || 0) - (state.progress[b.id].dueAt || 0) || (state.progress[b.id].lastChoiceAt || 0) - (state.progress[a.id].lastChoiceAt || 0); });
      }
function photoMarkup(card, extraClass) {
        var isStudy = extraClass === "study-photo";
        var src = isStudy ? (card.portrait || card.image) : card.image;
        return '<button class="photo-btn ' + (extraClass || "") + '" style="--photo-url:url(\'' + escapeHtml(src) + '\')" data-action="zoom" data-id="' + escapeHtml(card.id) + '" aria-label="' + escapeHtml(t("enlargePhoto")) + '">' +
          '<img class="' + (src !== card.image || card.imageKind === "illustration" ? "is-portrait" : "") + '" src="' + escapeHtml(src) + '" alt="' + escapeHtml(t("photoAlt")) + '" draggable="false">' +
          '<span class="photo-label">' + t(card.imageKind === "photo" ? "realPhoto" : "illustrativePhoto") + '</span><span class="photo-expand">' + icon("expand") + '</span>' +
          '<span class="image-error"><strong>' + t("imageUnavailable") + '</strong><small>' + t("imageStillReveal") + '</small></span></button>';
      }
      function answerMarkup(card) {
        var content = cardContent(card);
        return '<div class="answer" aria-live="polite"><div class="answer-korean" lang="ko">' + escapeHtml(card.korean) + '</div>' +
          '<div class="answer-meaning" lang="' + state.language + '">' + escapeHtml(content.meaning) + '</div><p>' + escapeHtml(content.explanation) + '</p>' +
          (content.keywords.length ? '<div class="keywords">' + content.keywords.map(function (k) { return '<span><b lang="ko">' + escapeHtml(k[0]) + '</b> · ' + escapeHtml(k[1]) + '</span>'; }).join("") + '</div>' : "") +
          '</div>';
      }
      function renderOnboarding() {
        var first = onboardStep === 0;
        return '<div class="screen onboarding-web"><div class="onboard-image"><img src="' + (first ? "assets/cafe.png" : "assets/pharmacy.png") + '" alt="' + escapeHtml(t("photoAlt")) + '">' +
          '<span class="onboard-step">' + t("of", { a: first ? 1 : 2, b: 2 }) + '</span><button class="onboard-skip" data-action="onboard-skip">' + t("skip") + '</button></div>' +
          '<div class="onboard-copy"><span class="small-caps">SIGN BY SIGN</span><h1>' +
          t(first ? "onboardFirstTitle" : "onboardSecondTitle") + '</h1><p>' +
          t(first ? "onboardFirstBody" : "onboardSecondBody") +
          '</p><div class="dots"><i class="' + (first ? "active" : "") + '"></i><i class="' + (!first ? "active" : "") + '"></i></div></div>' +
          '<div class="onboard-footer"><button class="primary-btn" data-action="' + (first ? "onboard-next" : "onboard-done") + '">' +
          t(first ? "next" : "startLearning") + ' ' + icon("arrow") + '</button></div></div>';
      }
function renderHome() {
        var pool = cards.filter(function (c) { return (state.selectedCategory === "all" || c.category === state.selectedCategory) && (state.selectedSubcategory === "all" || c.subcategory === state.selectedSubcategory) && !state.progress[c.id]; });
        var count = pool.length;
        var chosenCategory = categoryLabel(state.selectedCategory);
        var categoryHtml = catalog.categories.map(function (c) {
          var cover = findCard(c.cover);
          return '<button class="category-card ' + (state.selectedCategory === c.id ? "selected" : "") + '" data-action="category" data-category="' + c.id + '" aria-pressed="' + (state.selectedCategory === c.id) + '">' +
            '<img class="category-art" src="' + escapeHtml(cover.image) + '" alt=""><span class="category-copy"><strong>' + escapeHtml(c.label[state.language]) + '<span class="category-check">' + icon("check") +
            '</span></strong><small>' + escapeHtml(c.description[state.language]) + '</small></span></button>';
        }).join("");
        var subtypes = state.selectedCategory === "all" ? [] : subcategories.filter(function (s) { return s.category === state.selectedCategory; });
        var controls = '<div class="filter-row"><button class="filter-chip ' + (state.selectedCategory === "all" ? "selected" : "") + '" data-action="category-all">' + t("allCategories") + '</button>' +
          (subtypes.length ? '<button class="filter-chip ' + (state.selectedSubcategory === "all" ? "selected" : "") + '" data-action="subcategory" data-subcategory="all">' + t("allSubtypes") + '</button>' : "") +
          subtypes.map(function (s) { return '<button class="filter-chip ' + (state.selectedSubcategory === s.id ? "selected" : "") + '" data-action="subcategory" data-subcategory="' + s.id + '">' + escapeHtml(s.label[state.language]) + '</button>'; }).join("") + '</div>';
        var footer = '<div class="learning-strip"><div><h3>' + (count ? escapeHtml(t("selectedForLearning", { name: chosenCategory })) : t(unseenCount("all") === 0 ? "allSeen" : "noNewCategory")) +
          '</h3><p>' + (count ? t("sessionSigns", { n: Math.min(10, count) }) + ' · ' + t("learningHint") : t("keepFresh")) + '</p></div>' +
          '<button class="primary-btn" data-action="' + (count ? "start-learn" : "nav-review") + '">' + t(count ? "startSelected" : "reviewSigns") + icon("arrow") + '</button></div>';
        return '<div class="screen"><div class="screen-scroll"><div class="page-wrap home-content">' +
          '<section class="home-feature"><div class="feature-copy"><span class="feature-tag">' + icon("spark") + t("featureTag") + '</span><h1>' + t("heroTitle") + '</h1><p>' + t("heroBody") + '</p>' +
          '<div class="feature-actions"><button class="primary-btn" data-action="' + (count ? 'start-learn' : 'nav-review') + '">' + t(count ? "startLearning" : "reviewSigns") + icon("arrow") + '</button><button class="secondary-btn" data-action="camera">' + icon("camera") + t("camera") + '</button></div></div>' +
          '<div class="feature-art"><img src="assets/ax/generated/mega.png" alt=""><span class="feature-caption">SIGN BY SIGN · ' + t("illustrativePhoto") + '</span></div></section>' +
          resumeBanner() + '<section class="home-section"><div class="section-head"><h2>' + t("chooseScene") + '</h2><span>' + t("categorySubtitle") + '</span></div>' +
          '<div class="category-grid">' + categoryHtml + '</div>' + controls + footer + '</section>' +
          '<footer class="home-footer"><span>' + t("prototypeNote") + '</span><button class="text-btn" data-action="sources">' + t("sources") + '</button></footer>' +
          '</div></div>' + mainNav("home") + '</div>';
      }
      function renderStudy() {
        var s = state.activeSession;
        if (!s) { screen = "home"; return renderHome(); }
        if (s.phase === "results_pending") { screen = "summary"; return renderSummary(); }
        var card = findCard(s.cardIds[s.index]);
        if (!card) { screen = "home"; return renderHome(); }
        var next = findCard(s.cardIds[s.index + 1]);
        var label = t(s.mode === "learn" ? "learn" : "review");
        return '<div class="screen study-page"><div class="study-deck-next" aria-hidden="true">' +
          (next ? '<img src="' + escapeHtml(next.portrait || next.image) + '" alt="">' :
            '<div class="next-finish">' + t("sessionComplete") + '</div>') + '</div>' +
          '<div class="study-scroll"><article class="swipe-surface" id="swipeSurface">' +
          photoMarkup(card, "study-photo") + '<div class="study-photo-credit">' + (card.imageKind === "photo" ? sourceMarkup(card) : "") + '</div>' +
          '<div class="study-category"><span>' + escapeHtml(categoryLabel(card.category)) + '</span><span>' + t(card.imageKind === "photo" ? "realPhoto" : "illustrativePhoto") + '</span></div>' +
          (s.revealed ? answerMarkup(card) : '<div class="study-reveal"><div class="question">' + t("question") +
            '</div><button class="meaning-btn" data-action="reveal">' + t("showMeaning") + '</button></div>') +
          '<div class="swipe-stamp left" id="stampLeft">↶ ' + t("stampPractice") + '</div><div class="swipe-stamp right" id="stampRight">' + t("stampGotIt") + ' ↷</div>' +
          '</article></div><header class="study-header">' +
          '<button class="icon-btn" data-action="pause" aria-label="' + escapeHtml(t("saveClose")) + '">' + icon("close") + '</button>' +
          '<span>' + label + ' · ' + t("of", { a: s.index + 1, b: s.cardIds.length }) + '</span>' +
          '<button class="undo-btn" data-action="undo" ' + (!s.undo ? "disabled" : "") + '>' + t("undo") + '</button></header>' +
          '<div class="progress-track" aria-hidden="true"><span style="width:' + ((s.index + 1) / s.cardIds.length * 100) + '%"></span></div>' +
          '<footer class="study-actions"><button class="choice-btn left" data-action="choose-left">' + icon("bookmark") + '← ' + t("practiceAgain") + '</button>' +
          '<button class="choice-btn right" data-action="choose-right">' + icon("check") + t("gotIt") + ' →</button></footer></div>';
      }
      function renderSummary() {
        var s = state.activeSession;
        if (!s) { screen = "home"; return renderHome(); }
        var isReview = s.mode === "review";
        var reviewCount = reviewCards().length;
        return '<div class="screen"><div class="screen-scroll pad"><div class="summary-badge">✓</div><h1 class="summary-title">' + t("sessionComplete") + '</h1>' +
          '<p class="summary-sub">' + t("signsSeen", { n: s.cardIds.length }) + '</p><div class="stats"><div class="stat"><strong>' + s.counts.right +
          '</strong><small>' + t("gotIt") + '</small></div><div class="stat"><strong>' + s.counts.left + '</strong><small>' + t("practiceAgain") + '</small></div></div>' +
          (isReview ? '<p class="summary-sub" style="margin-top:25px;">' + t("stillPractice", { n: reviewCount }) + '</p>' : '') +
          '<div class="summary-actions">' +
          (isReview ? (reviewCount ? '<button class="primary-btn" data-action="summary-review">' + t("reviewAgain") + ' ' + icon("arrow") + '</button>' : '') +
            '<button class="secondary-btn" data-action="summary-home">' + t("backReview") + '</button>' :
            (reviewCount ? '<button class="primary-btn" data-action="summary-review">' + t("reviewSigns") + ' ' + icon("arrow") + '</button>' : '') +
            '<button class="' + (reviewCount ? "secondary-btn" : "primary-btn") + '" data-action="summary-more">' + t("learnMore") + '</button>' +
            '<button class="text-btn" data-action="summary-home">' + t("backLearn") + '</button>') +
          '</div><div style="text-align:center;"><button class="text-btn" data-action="undo">' + t("undoLast") + '</button></div></div></div>';
      }
      function renderReview() {
        var list = reviewCards();
        var rows = list.map(function (c) {
          return '<button class="review-row" data-action="detail" data-id="' + c.id + '"><img src="' + c.image +
            '" alt=""><span style="flex:1;min-width:0;"><small>' + escapeHtml(categoryLabel(c.category)) +
            '</small><strong lang="ko">' + escapeHtml(c.korean) + '</strong><small>' + t("tapDetails") + '</small></span>' +
            '<span class="inline-icon" aria-hidden="true">' + icon("arrow") + '</span></button>';
        }).join("");
        return '<div class="screen"><header class="screen-header"><strong class="header-title">' + t("review") + '</strong>' + settingsButton() + '</header>' +
          '<div class="screen-scroll">' + resumeBanner() + '<div class="review-intro"><h1>' + t("reviewHero") + '</h1><p>' + t("reviewDesc") + '</p></div>' +
          (list.length ? '<div class="review-count"><span>' + t("signsCount", { n: list.length }) + '</span><span>' + t("newestFirst") + '</span></div>' +
            '<div class="pad" style="margin-bottom:20px;"><button class="primary-btn" data-action="start-review">' + t("startReviewing") + ' ' + icon("arrow") + '</button></div>' +
            '<div class="review-list">' + rows + '</div>' :
            '<div class="review-empty"><div class="empty-symbol">✓</div><h2>' + t("nothingReview") + '</h2><p>' + t("swipeLeftAppears") + '</p>' +
            '<button class="secondary-btn" data-action="nav-home" style="margin-top:15px;">' + t("startLearning") + '</button></div>') +
          '</div>' + mainNav("review") + '</div>';
      }
      function aiStats() {
        return window.SignNative ? window.SignNative.getLearningStats() : { learnedAliases: 0, feedbackCount: 0, pendingContributions: 0, publishedCards: 0, catalogVersion: catalog.version || 0, lastSyncAt: 0, lastSyncStatus: "offline" };
      }
      function mergePublishedCards() {
        if (!window.SignNative) return;
        window.SignNative.getPublishedCards().forEach(function (incoming) {
          if (!validCommunityCard(incoming)) return;
          var index = cards.findIndex(function (card) { return card.id === incoming.id; });
          if (index >= 0) cards[index] = incoming; else cards.push(incoming);
        });
      }
      function renderCommunity() {
        var stats = aiStats();
        var queue = window.SignNative ? window.SignNative.getContributionQueue() : [];
        var queueMarkup = queue.length ? queue.slice(0, 5).map(function (item) {
          return '<li><span><strong lang="ko">' + escapeHtml(item.storeName) + '</strong><small>' + escapeHtml(categoryLabel(item.category)) + ' · ' + new Date(item.createdAt).toLocaleDateString() + '</small></span><b>' + escapeHtml(item.status === "submitted" ? t("submittedReports") : t("pendingReports")) + '</b></li>';
        }).join("") : '<li class="queue-empty">' + t("queueEmpty") + '</li>';
        return '<div class="screen"><div class="screen-scroll"><div class="page-wrap ai-learning-page"><div class="page-heading"><div><span class="small-caps">ON-DEVICE AI + COMMUNITY</span><h1>' + t("communityTitle") + '</h1><p>' + t("communityBody") + '</p></div>' + settingsButton() + '</div>' +
          '<div class="ai-stat-grid"><article><strong>' + stats.learnedAliases + '</strong><span>' + t("learnedAliases") + '</span></article><article><strong>' + stats.feedbackCount + '</strong><span>' + t("feedbackCount") + '</span></article><article><strong>' + stats.pendingContributions + '</strong><span>' + t("pendingReports") + '</span></article><article><strong>v' + (stats.catalogVersion || catalog.version || 1) + '</strong><span>' + t("publishedUpdates") + '</span></article></div>' +
          '<section class="ai-sync-card"><div><h2>' + t("publishedUpdates") + '</h2><p>' + t("privacyLearning") + '</p></div><button class="primary-btn" data-action="sync-community" ' + (communityBusy ? 'disabled' : '') + '>' + (communityBusy ? t("syncing") : t("syncNow")) + '</button>' + (communityNotice ? '<p class="ai-sync-notice" role="status">' + escapeHtml(communityNotice) + '</p>' : '') + '</section>' +
          '<div class="ai-explain-grid"><article><span class="feature-tag">' + icon("spark") + ' AI FEEDBACK</span><h2>' + t("learningHowTitle") + '</h2><p>' + t("learningHowBody") + '</p></article><article><span class="feature-tag">' + icon("bookmark") + ' SPACED REVIEW</span><h2>' + t("spacedTitle") + '</h2><p>' + t("spacedBody") + '</p></article></div>' +
          '<section class="contribution-queue"><div class="section-head"><h2>' + t("pendingReports") + '</h2><span>' + queue.length + '</span></div><ul>' + queueMarkup + '</ul></section></div></div>' + mainNav("community") + '</div>';
      }
function renderDetail() {
        var card = findCard(detailId);
        if (!card) { screen = detailReturn; return renderLibrary(); }
        var context = card.images.find(function (i) { return i.role === "context"; });
        return '<div class="screen"><header class="screen-header"><button class="icon-btn" data-action="detail-back" aria-label="' + escapeHtml(t("back")) + '">' + icon("back") +
          '</button><strong class="header-title">' + t("signDetails") + '</strong><span></span></header><div class="screen-scroll"><div class="page-wrap"><div class="detail-layout"><div>' +
          photoMarkup(card, "") + '</div><div><div class="small-caps">' + escapeHtml(categoryLabel(card.category)) + ' / ' + escapeHtml(subcategoryLabel(card.subcategory)) + '</div>' +
          (detailRevealed ? answerMarkup(card) + '<div class="detail-actions"><button class="primary-btn" data-action="save-review" data-id="' + card.id + '">' + icon("bookmark") + t(state.progress[card.id] && state.progress[card.id].status === "practice" ? "savedReview" : "addReview") + '</button></div>' :
            '<div class="question">' + t("question") + '</div><button class="meaning-btn" data-action="detail-reveal">' + t("showMeaning") + '</button>') +
          (detailRevealed ? sourceMarkup(card) + mapLinks(card) + (context ? '<h2 class="context-title">' + t("contextPhoto") + '</h2><img class="context-image" src="' + escapeHtml(context.path) + '" alt="' + escapeHtml(t("contextPhoto")) + '">' + sourceCredit(context) : "") : "") +
          '</div></div></div></div></div>';
      }
      function renderSettings() {
        return '<div class="screen"><header class="screen-header"><button class="icon-btn" data-action="settings-back" aria-label="' + escapeHtml(t("back")) + '">' +
          icon("back") + '</button><strong class="header-title">' + t("settings") + '</strong><span style="width:42px;"></span></header>' +
          '<div class="screen-scroll"><div class="settings-list">' +
          '<button class="settings-row" data-action="how"><span>' + t("howItWorks") + '</span>' + icon("arrow") + '</button>' +
          '<button class="settings-row" data-action="reset"><span>' + t("resetProgress") + '</span>' + icon("arrow") + '</button>' +
          '<button class="settings-row" data-action="sources"><span>' + t("sources") + '</span>' + icon("arrow") + '</button>' +
          '<button class="settings-row" data-action="about"><span>' + t("about") + '</span>' + icon("arrow") + '</button></div>' +
          '<p class="settings-hint">' + t("settingsHint") + '</p>' +
          '</div></div>';
      }
      function renderModal() {
        if (!modal) return "";
        return '<div class="modal-layer" role="presentation"><div class="dialog" role="dialog" aria-modal="true" aria-label="' + escapeHtml(modal.title) +
          '"><h2>' + escapeHtml(modal.title) + '</h2><p>' + escapeHtml(modal.body) + '</p><div class="dialog-actions">' +
          '<button class="cancel" data-action="modal-cancel">' + escapeHtml(modal.cancel || t("cancel")) + '</button>' +
          '<button class="confirm ' + (modal.danger ? "danger" : "") + '" data-action="modal-confirm">' + escapeHtml(modal.confirm || t("continue")) +
          '</button></div></div></div>';
      }
      function renderZoom() {
        if (!zoomCard) return "";
        return '<div class="zoom-layer" role="dialog" aria-modal="true" aria-label="' + escapeHtml(t("enlargedPhoto")) + '">' +
          '<div class="zoom-top"><span>' + t("signPhotoIllustrative") + '</span><button data-action="zoom-close" aria-label="' + escapeHtml(t("closePhoto")) + '">×</button></div>' +
          '<div class="zoom-viewport" id="zoomViewport"><img id="zoomImage" src="' + escapeHtml(zoomCard.image) + '" alt="' + escapeHtml(t("enlargedPhoto")) + '" draggable="false"></div>' +
          '<div class="zoom-controls"><button data-action="zoom-out" aria-label="' + escapeHtml(t("zoomOut")) + '">−</button><span>' + t("pinchHint") + '</span>' +
          '<button data-action="zoom-in" aria-label="' + escapeHtml(t("zoomIn")) + '">+</button></div></div>';
      }
      function render() {
        var body = screen === "language-setup" ? renderLanguageSetup() :
          screen === "onboarding" ? renderOnboarding() :
          screen === "home" ? renderHome() :
          screen === "study" ? renderStudy() :
          screen === "summary" ? renderSummary() :
          screen === "review" ? renderReview() :
          screen === "detail" ? renderDetail() :
          screen === "library" ? renderLibrary() :
          screen === "camera" ? renderCamera() :
          screen === "community" ? renderCommunity() :
          screen === "sources" ? renderSources() : renderSettings();
        app.className = screen === "study" ? "is-immersive" : "";
        app.innerHTML = (screen === "language-setup" ? "" : renderLanguageBar()) +
          '<div class="app-content" id="pageContent" tabindex="-1">' + body + '</div>' + renderModal() + renderLanguageMenu() + renderZoom();
        ["desktopEyebrow", "desktopTitle", "desktopBody", "desktopTry", "desktopSwipe", "desktopSpace", "desktopSample"].forEach(function (id) {
          var element = document.getElementById(id);
          if (element) element.innerHTML = t(id);
        });
        attachSwipe();
        attachZoom();
        attachCamera();
        if (document.documentElement) document.documentElement.lang = state.language;
        document.title = "Sign by Sign — " + t(screen === "camera" ? "camera" : screen === "library" ? "directory" : screen === "community" ? "community" : screen === "sources" ? "sources" : screen === "review" ? "review" : screen === "settings" ? "settings" : "learn");
      }
      function choose(choice) {
        if (choiceLocked) return;
        if (!state.activeSession || state.activeSession.phase !== "in_progress") return;
        var surface = document.getElementById("swipeSurface");
        var reducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (surface && !reducedMotion) {
          applyChoice(choice, true);
          choiceLocked = true;
          surface.classList.remove("dragging");
          surface.style.transition = "transform .21s ease-in, opacity .21s ease-in";
          surface.style.transform = "translateX(" + (choice === "left" ? "-" : "") + (window.innerWidth * 1.3 + 80) + "px" + ") rotate(" + (choice === "left" ? "-14deg" : "14deg") + ")";
          surface.style.opacity = "0";
          window.setTimeout(function () { choiceLocked = false; render(); }, 210);
          return;
        }
        applyChoice(choice, false);
      }
      function applyChoice(choice, deferRender) {
        var s = state.activeSession;
        if (!s || s.phase !== "in_progress") return;
        var card = findCard(s.cardIds[s.index]);
        if (!card) return;
        var prior = state.progress[card.id] ? JSON.parse(JSON.stringify(state.progress[card.id])) : null;
        s.undo = { id: card.id, prior: prior, index: s.index, revealed: !!s.revealed, counts: { left: s.counts.left, right: s.counts.right } };
        var oldPractice = prior && prior.practiceChoiceCount || 0;
        var repetitions = choice === "right" ? ((prior && prior.repetitions || 0) + 1) : 0;
        var intervals = [1, 3, 7, 14, 30, 60];
        var intervalDays = choice === "right" ? intervals[Math.min(repetitions - 1, intervals.length - 1)] : 0;
        var now = Date.now();
        state.progress[card.id] = {
          status: choice === "left" ? "practice" : "got_it",
          lastChoiceAt: now,
          practiceChoiceCount: oldPractice + (choice === "left" ? 1 : 0),
          repetitions: repetitions,
          intervalDays: intervalDays,
          dueAt: choice === "left" ? now : now + intervalDays * 86400000,
          mastery: choice === "left" ? Math.max(0, (prior && prior.mastery || 0) - 1) : Math.min(5, (prior && prior.mastery || 0) + 1)
        };
        s.counts[choice]++;
        s.index++;
        s.revealed = false;
        if (s.index >= s.cardIds.length) { s.phase = "results_pending"; screen = "summary"; }
        save();
        if (!deferRender) render();
      }
      function undo() {
        var s = state.activeSession;
        if (!s || !s.undo) return;
        var u = s.undo;
        if (u.prior === null) delete state.progress[u.id]; else state.progress[u.id] = u.prior;
        s.index = u.index;
        s.revealed = u.revealed;
        s.counts = u.counts;
        s.phase = "in_progress";
        s.undo = null;
        screen = "study";
        save();
        render();
      }
      function startLearn(category) {
        var pool = cards.filter(function (c) { return (category === "all" || c.category === category) && (state.selectedSubcategory === "all" || c.subcategory === state.selectedSubcategory) && !state.progress[c.id]; });
        pool.sort(function (a, b) { return a.difficulty - b.difficulty || (a.id < b.id ? -1 : 1); });
        var chosen = pool.slice(0, 10);
        if (!chosen.length) { screen = "home"; render(); return; }
        state.activeSession = { sessionId: "learn-" + Date.now(), mode: "learn", category: category, phase: "in_progress", cardIds: chosen.map(function (c) { return c.id; }), index: 0, revealed: false, counts: { left: 0, right: 0 }, undo: null };
        save(); screen = "study"; render();
      }
      function startReview() {
        var chosen = reviewCards().slice(0, 10);
        if (!chosen.length) { screen = "review"; render(); return; }
        state.activeSession = { sessionId: "review-" + Date.now(), mode: "review", category: "all", phase: "in_progress", cardIds: chosen.map(function (c) { return c.id; }), index: 0, revealed: false, counts: { left: 0, right: 0 }, undo: null };
        save(); screen = "study"; render();
      }
      function askStart(mode) {
        var run = function () { if (mode === "learn") startLearn(state.selectedCategory); else startReview(); };
        if (!state.activeSession) { run(); return; }
        modal = { title: t("newSessionTitle"), body: t("newSessionBody"), confirm: t("startNew"), onConfirm: function () { state.activeSession = null; save(); run(); } };
        render();
      }
      function completeOnboarding() {
        state.onboarded = true; save();
        screen = onboardReturn; onboardStep = 0; render();
      }
      function leaveSummary(destination) {
        var selected = state.selectedCategory;
        state.activeSession = null; save();
        if (destination === "review-session") startReview();
        else if (destination === "learn-session") startLearn(selected);
        else { screen = destination; render(); }
      }
      function openZoom(id) {
        if (Date.now() < suppressZoomUntil) return;
        zoomCard = findCard(id); if (!zoomCard) return;
        zoomScale = 1; zoomX = 0; zoomY = 0; render();
      }
      function closeZoom() { zoomCard = null; render(); }
      function updateZoom() {
        var img = document.getElementById("zoomImage");
        if (img) img.style.transform = "translate(" + zoomX + "px," + zoomY + "px) scale(" + zoomScale + ")";
      }
      function attachSwipe() {
        var surface = document.getElementById("swipeSurface");
        if (!surface) return;
        var drag = null;
        surface.addEventListener("pointerdown", function (e) {
          if (e.target.closest("a,input,textarea,select") || (e.target.closest("button") && !e.target.closest(".photo-btn"))) return;
          drag = { x: e.clientX, y: e.clientY, t: performance.now(), active: false };
        });
        surface.addEventListener("pointermove", function (e) {
          if (!drag) return;
          var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (!drag.active && Math.abs(dx) > 10 && Math.abs(dx) >= Math.abs(dy) * 1.25) {
            drag.active = true; surface.classList.add("dragging");
            try { surface.setPointerCapture(e.pointerId); } catch (_) {}
          }
          if (!drag.active) return;
          surface.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 26) + "deg)";
          var strength = Math.min(1, Math.abs(dx) / 80);
          document.getElementById("stampLeft").style.opacity = dx < 0 ? strength : 0;
          document.getElementById("stampRight").style.opacity = dx > 0 ? strength : 0;
        });
        function finish(e) {
          if (!drag) return;
          var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          var elapsed = Math.max(1, performance.now() - drag.t);
          var speed = Math.abs(dx) / elapsed * 1000;
          var shouldChoose = drag.active && Math.abs(dx) >= Math.abs(dy) * 1.25 &&
            (Math.abs(dx) >= surface.clientWidth * .25 || (Math.abs(dx) >= 48 && speed >= 700));
          if (drag.active) suppressZoomUntil = Date.now() + 400;
          drag = null;
          if (shouldChoose) choose(dx < 0 ? "left" : "right");
          else {
            surface.classList.remove("dragging");
            surface.style.transform = "";
            document.getElementById("stampLeft").style.opacity = 0;
            document.getElementById("stampRight").style.opacity = 0;
          }
        }
        surface.addEventListener("pointerup", finish);
        surface.addEventListener("pointercancel", function () {
          drag = null; surface.classList.remove("dragging"); surface.style.transform = "";
        });
      }
      function attachZoom() {
        var viewport = document.getElementById("zoomViewport");
        if (!viewport) return;
        var points = new Map(), lastMid = null, lastDistance = null;
        viewport.addEventListener("pointerdown", function (e) {
          points.set(e.pointerId, { x: e.clientX, y: e.clientY });
          viewport.setPointerCapture(e.pointerId);
        });
        viewport.addEventListener("pointermove", function (e) {
          if (!points.has(e.pointerId)) return;
          var prior = points.get(e.pointerId);
          points.set(e.pointerId, { x: e.clientX, y: e.clientY });
          var arr = Array.from(points.values());
          if (arr.length === 1 && zoomScale > 1) { zoomX += e.clientX - prior.x; zoomY += e.clientY - prior.y; }
          if (arr.length >= 2) {
            var dx = arr[0].x - arr[1].x, dy = arr[0].y - arr[1].y;
            var dist = Math.hypot(dx, dy);
            var mid = { x: (arr[0].x + arr[1].x) / 2, y: (arr[0].y + arr[1].y) / 2 };
            if (lastDistance) zoomScale = Math.max(1, Math.min(4, zoomScale * dist / lastDistance));
            if (lastMid) { zoomX += mid.x - lastMid.x; zoomY += mid.y - lastMid.y; }
            lastDistance = dist; lastMid = mid;
          }
          if (zoomScale === 1) { zoomX = 0; zoomY = 0; }
          updateZoom();
        });
        function release(e) { points.delete(e.pointerId); lastDistance = null; lastMid = null; }
        viewport.addEventListener("pointerup", release);
        viewport.addEventListener("pointercancel", release);
        viewport.addEventListener("wheel", function (e) {
          e.preventDefault();
          zoomScale = Math.max(1, Math.min(4, zoomScale + (e.deltaY < 0 ? .2 : -.2)));
          if (zoomScale === 1) { zoomX = 0; zoomY = 0; }
          updateZoom();
        }, { passive: false });
        updateZoom();
      }

      function subcategoryLabel(id) {
        var item = subcategories.find(function (s) { return s.id === id; });
        return item ? item.label[state.language] : "";
      }
      function safeUrl(value) { return /^https:\/\//.test(value || "") ? value : ""; }
      function sourceCredit(image) {
        if (image.kind === "illustration") return '<p class="source-credit">' + t("exampleNotice") + '</p>';
        return '<p class="source-credit">' + escapeHtml(image.author) + ' · ' +
          (safeUrl(image.licenseUrl) ? '<a href="' + escapeHtml(image.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(image.license) + '</a>' : escapeHtml(image.license)) +
          (safeUrl(image.sourceUrl) ? ' · <a href="' + escapeHtml(image.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + t("originalSource") + '</a>' : '') + '</p>';
      }
      function sourceMarkup(card) { return sourceCredit(card.images.find(function (image) { return image.role === "primary"; })); }
      function mapSearchLinks(value) {
        var text = String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
        if (!text) return "";
        var query = encodeURIComponent(text);
        return '<div class="source-links"><a href="https://map.naver.com/p/search/' + query + '" target="_blank" rel="noopener noreferrer">' + t("mapsNaver") +
          '</a><a href="https://www.google.com/maps/search/?api=1&query=' + query + '%20Korea" target="_blank" rel="noopener noreferrer">' + t("mapsGoogle") + '</a></div>';
      }
      function mapLinks(card) { return mapSearchLinks(card.korean); }
      function filteredLibrary() {
        var query = libraryQuery.trim().toLocaleLowerCase();
        return cards.filter(function (c) {
          var text = [c.korean, c.brandName, c.meaning, c.aliases.join(" "), c.translations.ko.meaning, c.translations.ja.meaning].join(" ").toLocaleLowerCase();
          return (libraryCategory === "all" || c.category === libraryCategory) && (librarySubcategory === "all" || c.subcategory === librarySubcategory) && (!query || text.includes(query));
        });
      }
      function catalogGridMarkup() {
        var list = filteredLibrary();
        if (!list.length) return '<p class="catalog-empty" role="status">' + t("noSearchResults") + '</p>';
        return list.map(function (c) {
          var primary = c.images.find(function (i) { return i.role === "primary"; });
          return '<article class="catalog-card"><button data-action="detail" data-id="' + c.id + '"><div class="catalog-photo"><img loading="lazy" src="' + escapeHtml(c.image) + '" alt="' + escapeHtml(c.korean) + '">' +
            '<span>' + t(c.imageKind === "photo" ? "realPhoto" : "illustrativePhoto") + '</span></div><div class="catalog-card-copy"><small>' +
            escapeHtml(categoryLabel(c.category)) + ' / ' + escapeHtml(subcategoryLabel(c.subcategory)) + '</small><h2 lang="ko">' + escapeHtml(c.korean) + '</h2><p>' +
            escapeHtml(cardContent(c).meaning) + '</p></div></button>' + sourceCredit(primary) + '</article>';
        }).join("");
      }
      function renderLibrary() {
        return '<div class="screen"><div class="screen-scroll"><div class="page-wrap"><div class="page-heading"><div><span class="small-caps">SIGN LIBRARY</span><h1>' + t("libraryTitle") +
          '</h1><p>' + t("libraryBody") + '</p></div>' + settingsButton() + '</div><div class="library-controls"><label>' + t("search") +
          '<input id="librarySearch" type="search" value="' + escapeHtml(libraryQuery) + '" placeholder="' + escapeHtml(t("searchPlaceholder")) + '"></label><label>' + t("category") +
          '<select id="libraryCategory">' + categories.map(function (c) { return '<option value="' + c.id + '" ' + (libraryCategory === c.id ? 'selected' : '') + '>' + escapeHtml(c.label[state.language]) + '</option>'; }).join("") + '</select></label><label>' + t("subcategory") +
          '<select id="librarySubtype"><option value="all">' + t("allSubtypes") + '</option>' + subcategories.filter(function (s) { return libraryCategory === "all" || s.category === libraryCategory; }).map(function (s) {
            return '<option value="' + s.id + '" ' + (librarySubcategory === s.id ? 'selected' : '') + '>' + escapeHtml(s.label[state.language]) + '</option>';
          }).join("") + '</select></label></div><div class="section-head"><span id="libraryCount" role="status">' + t("signsCount", { n: filteredLibrary().length }) + '</span><button class="text-btn" data-action="sources">' + t("sources") +
          '</button></div><div class="catalog-grid" id="catalogGrid">' + catalogGridMarkup() + '</div></div></div>' + mainNav("library") + '</div>';
      }
      function renderSources() {
        return '<div class="screen"><div class="screen-scroll"><div class="page-wrap"><div class="page-heading"><div><h1>' + t("sources") + '</h1><p>' + t("sourcesBody") +
          '</p></div><button class="icon-btn" data-action="sources-back" aria-label="' + escapeHtml(t("back")) + '">' + icon("close") + '</button></div><div class="source-table">' +
          cards.map(function (card) { return card.images.map(function (i) {
            return '<article class="source-row"><img loading="lazy" src="' + escapeHtml(i.path) + '" alt=""><div><h2>' + escapeHtml(card.korean) + ' · ' + t(i.role === "context" ? "contextPhoto" : i.kind === "photo" ? "realPhoto" : "illustrativePhoto") +
              '</h2>' + sourceCredit(i) + '<p>' + escapeHtml(i.author) + '</p></div></article>';
          }).join(""); }).join("") + '</div></div></div></div>';
      }
      function navigate(destination) {
        if (screen === "camera" && destination !== "camera") { stopCamera(); cancelOcr(); }
        screen = destination;
        render();
      }
      function saveForReview(id) {
        var prior = state.progress[id] || {};
        state.progress[id] = { status: "practice", lastChoiceAt: Date.now(), practiceChoiceCount: prior.practiceChoiceCount || 0, repetitions: 0, intervalDays: 0, dueAt: Date.now(), mastery: prior.mastery || 0 };
        // Any previous session undo would otherwise erase this explicit later save.
        if (state.activeSession) state.activeSession.undo = null;
        save(); render();
      }


      var camera = { stream: null, photo: null, demo: false, ratio: 1, url: "", crop: null, busy: false, worker: null, run: 0, request: 0, text: "", edited: true, confidence: 0, result: null, selected: null, notice: "", error: false, progress: 0, opening: false, teachOpen: false, teachSaved: false, reinforced: false };
      function stopCamera() {
        camera.request++;
        camera.opening = false;
        if (camera.stream) camera.stream.getTracks().forEach(function (track) { track.stop(); });
        camera.stream = null;
      }
      function cancelOcr() {
        camera.run++;
        camera.busy = false;
        if (camera.worker) { camera.worker.terminate().catch(function () {}); camera.worker = null; }
      }
      function clearPhoto() {
        if (camera.url && !camera.demo) URL.revokeObjectURL(camera.url);
        camera.photo = null; camera.demo = false; camera.url = ""; camera.crop = null; camera.result = null; camera.selected = null; camera.text = ""; camera.confidence = 0; camera.edited = true; camera.notice = ""; camera.error = false; camera.teachOpen = false; camera.teachSaved = false; camera.reinforced = false;
      }
      function showSampleScan(id) {
        var card = findCard(id) || cards[0];
        stopCamera(); cancelOcr(); clearPhoto();
        screen = "camera";
        camera.photo = { demo: true };
        camera.demo = true;
        camera.ratio = 4 / 3;
        camera.url = card.image;
        camera.text = card.korean;
        camera.confidence = 98;
        camera.edited = false;
        camera.result = { status: "matched", matchedId: card.id, candidates: [{ id: card.id }], scope: card.brand ? "brand" : "type", requiresConfirmation: false };
        camera.selected = card.id;
        render();
      }
      async function openCamera() {
        if (window.SignNative && window.SignNative.isNative) { await openNativePhoto("camera"); return; }
        stopCamera(); cancelOcr(); clearPhoto();
        screen = "camera";
        if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          camera.notice = t("cameraUnavailable"); camera.error = true; render();
          if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) document.getElementById("captureInput").click();
          return;
        }
        var request = ++camera.request;
        camera.opening = true; camera.notice = t("cameraOpening"); render();
        try {
          var stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
          if (request !== camera.request || screen !== "camera") { stream.getTracks().forEach(function (track) { track.stop(); }); return; }
          camera.stream = stream; camera.opening = false; camera.notice = ""; camera.error = false; render();
        } catch (error) {
          if (request !== camera.request) return;
          camera.opening = false;
          camera.notice = t(error.name === "NotAllowedError" || error.name === "SecurityError" ? "cameraDenied" : "cameraUnavailable");
          camera.error = true; render();
        }
      }
      function prefersNativeCamera() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
          (navigator.maxTouchPoints > 1 && window.matchMedia && window.matchMedia("(max-width: 900px)").matches);
      }
      function openQuickCamera() {
        languageMenuOpen = false;
        if (window.SignNative && window.SignNative.isNative) { openNativePhoto("camera"); return; }
        if (!prefersNativeCamera()) { openCamera(); return; }
        stopCamera(); cancelOcr(); clearPhoto(); screen = "camera"; render();
        document.getElementById("captureInput").click();
      }
      async function openNativePhoto(source) {
        stopCamera(); cancelOcr(); clearPhoto(); screen = "camera";
        camera.opening = true; camera.notice = t("cameraOpening"); render();
        try {
          var file = await (source === "photos" ? window.SignNative.choosePhoto() : window.SignNative.takePhoto());
          camera.opening = false;
          await usePhoto(file, true);
        } catch (error) {
          camera.opening = false; camera.notice = t("cameraDenied"); camera.error = true; render();
        }
      }
      async function usePhoto(file, autoAnalyze) {
        if (!file) return;
        stopCamera(); cancelOcr(); clearPhoto(); screen = "camera";
        if (file.size > 16 * 1024 * 1024) { camera.notice = t("largeImage"); camera.error = true; render(); return; }
        if (!file.type.startsWith("image/")) { camera.notice = t("invalidImage"); camera.error = true; render(); return; }
        var request = ++camera.request;
        var url = URL.createObjectURL(file);
        try {
          var image = await loadImage(url);
          if (!image.naturalWidth || !image.naturalHeight) throw new Error("Image is empty");
          if (request !== camera.request) { URL.revokeObjectURL(url); return; }
          camera.photo = file; camera.ratio = image.naturalWidth / image.naturalHeight; camera.url = url; camera.notice = ""; camera.error = false; render();
          if (autoAnalyze) await readPhoto();
        } catch (_) {
          URL.revokeObjectURL(url);
          if (request !== camera.request) return;
          camera.notice = t("invalidImage"); camera.error = true; render();
        }
      }
      function loadImage(url) {
        return new Promise(function (resolve, reject) {
          var image = new Image();
          image.onload = function () { resolve(image); };
          image.onerror = reject;
          image.src = url;
        });
      }
      function capturePhoto() {
        var video = document.getElementById("cameraVideo");
        if (!video || !video.videoWidth) return;
        var canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob(function (blob) { if (blob) usePhoto(blob, true); }, "image/jpeg", .93);
      }
      function cameraNoticeMarkup() {
        if (!camera.notice && !camera.busy) return "";
        return '<div class="scan-status ' + (camera.error ? 'error' : '') + '" role="status"><span id="ocrStatusText">' + escapeHtml(camera.notice || t("ocrLoading")) +
          '</span>' + (camera.busy ? '<div class="scan-progress" role="progressbar" aria-label="' + escapeHtml(t("readText")) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + camera.progress + '"><span id="ocrProgress" style="width:' + camera.progress + '%"></span></div>' : '') + '</div>';
      }
      function normalizeDetected(value) {
        return String(value || "").normalize("NFKC").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]/gu, "");
      }
      function detectedPlaceName(card) {
        if (card.brandName) return card.brandName;
        var aliases = card.aliases.map(normalizeDetected);
        var lines = camera.text.split(/[\n\r|,;:]+/).map(function (line) { return line.trim(); }).filter(Boolean).sort(function (a, b) { return b.length - a.length; });
        var matchedLine = lines.find(function (line) {
          var normalized = normalizeDetected(line);
          return normalized && aliases.some(function (alias) { return alias && (normalized.includes(alias) || alias.includes(normalized)); });
        });
        return (matchedLine || card.korean).slice(0, 80);
      }
      function teachFormMarkup() {
        if (!window.SignNative) return "";
        if (camera.teachSaved) return '<div class="ai-learned-notice" role="status">' + icon("check") + '<span>' + t("reportSaved") + '</span></div>';
        if (!camera.teachOpen) return '<button class="secondary-btn teach-ai-btn" data-action="teach-sign">' + icon("spark") + t("teachAi") + '</button>';
        var suggestion = camera.result && camera.result.suggestedCategory;
        var suggestedId = suggestion && catalog.categories.some(function (category) { return category.id === suggestion.id; }) ? suggestion.id : catalog.categories[0].id;
        var firstLine = camera.text.split(/[\n\r|,;:]+/).map(function (line) { return line.trim(); }).filter(Boolean)[0] || "";
        var suggestionMarkup = suggestion ? '<p class="category-suggestion">' + t("suggestedCategory", { name: categoryLabel(suggestion.id), n: suggestion.confidence }) + '</p>' : '';
        return '<form class="teach-form" id="teachForm"><div class="teach-heading"><span class="feature-tag">' + icon("spark") + ' HUMAN-IN-THE-LOOP</span><h3>' + t("teachTitle") + '</h3></div>' + suggestionMarkup +
          '<label>' + t("storeName") + '<input id="teachStoreName" maxlength="120" required value="' + escapeHtml(firstLine) + '"></label>' +
          '<label>' + t("category") + '<select id="teachCategory" required>' + catalog.categories.map(function (category) { return '<option value="' + category.id + '" ' + (category.id === suggestedId ? 'selected' : '') + '>' + escapeHtml(category.label[state.language]) + '</option>'; }).join("") + '</select></label>' +
          '<label>' + t("description") + '<textarea id="teachDescription" maxlength="800" rows="3"></textarea></label>' +
          '<label class="consent-row"><input id="teachConsent" type="checkbox" required><span>' + t("photoConsent") + '</span></label>' +
          '<button class="primary-btn" type="submit">' + t("submitReport") + icon("arrow") + '</button></form>';
      }
      function reinforceSelection(id, corrected) {
        if (!window.SignNative || !camera.text || !id) return;
        window.SignNative.reinforce({ text: camera.text, cardId: id, corrected: !!corrected });
        camera.reinforced = true;
      }
      async function contributionThumbnail() {
        if (!camera.url || camera.demo) return "";
        var image = await loadImage(camera.url);
        var crop = camera.crop || { x: 0, y: 0, w: 1, h: 1 };
        var sourceWidth = image.naturalWidth * crop.w, sourceHeight = image.naturalHeight * crop.h;
        var scale = Math.min(1, 720 / Math.max(sourceWidth, sourceHeight));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sourceWidth * scale)); canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        canvas.getContext("2d").drawImage(image, image.naturalWidth * crop.x, image.naturalHeight * crop.y, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", .68);
      }
      async function saveContribution() {
        if (!window.SignNative) return;
        var name = document.getElementById("teachStoreName"), category = document.getElementById("teachCategory"), description = document.getElementById("teachDescription"), consent = document.getElementById("teachConsent");
        if (!name || !category || !consent || !name.value.trim() || !consent.checked) return;
        camera.busy = true; camera.notice = t("matching"); render();
        try {
          window.SignNative.queueContribution({ ocrText: camera.text, storeName: name.value, category: category.value, description: description ? description.value : "", consent: true, photoData: await contributionThumbnail() });
          camera.teachSaved = true; camera.teachOpen = false; camera.busy = false; camera.notice = ""; render();
        } catch (_) {
          camera.busy = false; camera.notice = t("matchError"); camera.error = true; render();
        }
      }
      function renderScanResult() {
        if (camera.selected) {
          var card = findCard(camera.selected);
          var content = cardContent(card);
          var guide = card.travelGuide || { experience: {}, phrases: [] };
          var experience = guide.experience[state.language] || guide.experience.en || content.explanation;
          var placeName = detectedPlaceName(card);
          var confidence = camera.confidence > 0 ? '<span class="confidence-pill">' + t("recognitionConfidence", { n: Math.round(camera.confidence) }) + '</span>' : '';
          var phrases = guide.phrases.map(function (phrase) {
            var phraseMeaning = phrase.meaning[state.language] || phrase.meaning.en;
            return '<li><strong lang="ko">' + escapeHtml(phrase.korean) + '</strong><span class="phrase-pronunciation">' + escapeHtml(phrase.romanization) + '</span><span>' + escapeHtml(phraseMeaning) + '</span></li>';
          }).join("");
          return '<article class="scan-result travel-result"><div class="travel-result-hero"><div class="result-status-row"><span class="result-badge">' + icon("check") + ' ' + t(camera.result && camera.result.matchedId === card.id ? "matched" : "confirmed") + '</span>' + confidence +
            '</div><span class="travel-kicker">' + t("placeName") + '</span><h3 lang="ko">' + escapeHtml(placeName) + '</h3><div class="result-meaning">' + escapeHtml(content.meaning) + '</div></div>' +
            '<div class="travel-info-grid"><div><span>' + t("category") + '</span><strong>' + escapeHtml(categoryLabel(card.category)) + ' · ' + escapeHtml(subcategoryLabel(card.subcategory)) + '</strong></div>' +
            '<div><span>' + t("recognizedSign") + '</span><strong lang="ko">' + escapeHtml(card.korean) + '</strong></div></div>' +
            '<div class="travel-sections"><section><h4>' + t("placeInformation") + '</h4><p>' + escapeHtml(content.meaning) + '</p></section>' +
            '<section><h4>' + t("easyExplanation") + '</h4><p>' + escapeHtml(content.explanation) + '</p></section>' +
            '<section><h4>' + t("expectedExperience") + '</h4><p>' + escapeHtml(experience) + '</p></section>' +
            (phrases ? '<section class="useful-language"><h4>' + t("usefulKorean") + '</h4><ul>' + phrases + '</ul></section>' : '') + '</div>' +
             '<p class="travel-disclaimer">' + t("generalExperienceNotice") + '</p><div class="travel-result-actions"><button class="secondary-btn" data-action="save-review" data-id="' + card.id + '">' + t(state.progress[card.id] && state.progress[card.id].status === "practice" ? "savedReview" : "addReview") + '</button>' +
             (window.SignNative ? '<div class="ai-feedback-actions"><button class="secondary-btn" data-action="reinforce-result" data-id="' + card.id + '" ' + (camera.reinforced ? 'disabled' : '') + '>' + icon("spark") + t(camera.reinforced ? "reinforced" : "reinforceAi") + '</button>' +
             ((camera.result && camera.result.candidates || []).length > 1 ? '<button class="text-btn" data-action="correct-result">' + t("correctAi") + '</button>' : '') + '</div>' : '') + mapLinks(card) + teachFormMarkup() + '</div></article>';
        }
        if (!camera.result) return "";
        if (camera.result.status === "no_match") return '<div class="scan-result"><h2>' + t("noMatchTitle") + '</h2><p>' + t("noMatchBody") + '</p>' + (camera.result.suggestedCategory ? '<p class="category-suggestion">' + t("suggestedCategory", { name: categoryLabel(camera.result.suggestedCategory.id), n: camera.result.suggestedCategory.confidence }) + '</p>' : '') + mapSearchLinks(camera.text) + teachFormMarkup() + '</div>';
        return '<div class="scan-result"><h2>' + t("candidateTitle") + '</h2><p>' + t("candidateBody") + '</p><div class="candidate-list">' +
          camera.result.candidates.map(function (candidate) {
            var c = findCard(candidate.id);
            return '<button data-action="confirm-candidate" data-id="' + c.id + '"><img src="' + escapeHtml(c.image) + '" alt=""><span><strong lang="ko">' + escapeHtml(c.korean) +
              '</strong><small>' + escapeHtml(cardContent(c).meaning) + '</small></span></button>';
          }).join("") + '</div>' + teachFormMarkup() + '</div>';
      }
      function renderCamera() {
        var viewport = camera.photo ? '<div class="crop-stage" id="cropStage" style="width:min(100%,' + (58 * camera.ratio).toFixed(2) + 'vh)"><img id="cameraPreview" src="' + camera.url + '" alt="' + escapeHtml(t("camera")) + '" draggable="false"><div class="crop-box" id="cropBox"></div></div>' :
          camera.stream ? '<video id="cameraVideo" autoplay muted playsinline aria-label="' + escapeHtml(t("camera")) + '"></video>' :
          '<div class="camera-placeholder">' + icon("camera") + '<strong>' + t("camera") + '</strong><p>' + t("cameraPlaceholder") + '</p></div>';
        var buttons = camera.photo ?
          '<button class="primary-btn" data-action="ocr" ' + (camera.busy ? 'disabled' : '') + '>' + icon("spark") + t("readText") + '</button><button class="secondary-btn" data-action="camera-open" ' + (camera.busy ? 'disabled' : '') + '>' + t("retake") + '</button>' :
          camera.stream ? '<button class="primary-btn" data-action="capture">' + icon("camera") + t("capture") + '</button>' :
          '<button class="primary-btn" data-action="camera-open" ' + (camera.opening ? 'disabled' : '') + '>' + icon("camera") + t("cameraOn") + '</button>';
        return '<div class="screen"><div class="screen-scroll"><div class="page-wrap"><div class="page-heading"><div><span class="small-caps">SIGN SCANNER</span><h1>' + t("cameraTitle") + '</h1><p>' + t("cameraBody") +
          '</p></div></div><div class="scan-layout"><section class="camera-panel"><div class="camera-viewport">' + viewport + '</div>' +
          (camera.photo ? '<p class="crop-hint">' + t("cropHint") + '</p><button class="text-btn" data-action="reset-crop">' + t("resetCrop") + '</button>' : '') +
          '<div class="camera-actions">' + buttons + '<button class="secondary-btn" data-action="upload" ' + (camera.busy ? 'disabled' : '') + '>' + t("upload") + '</button></div>' +
          '<div class="camera-text-actions"><button class="text-btn" data-action="native-camera" ' + (camera.busy ? 'disabled' : '') + '>' + t("nativeCamera") + '</button><button class="text-btn" data-action="sample-scan" ' + (camera.busy ? 'disabled' : '') + '>' + t("sampleScan") + '</button></div><div class="scan-note">' + icon("check") + '<span>' + t("cameraPrivacy") + '</span></div>' +
          '</section><section class="scan-form"><h2>' + t("scanFormTitle") + '</h2><p>' + t("textHint") + '</p><div id="cameraNotice">' + cameraNoticeMarkup() + '</div>' +
          (camera.busy ? '<button class="text-btn" data-action="cancel-ocr">' + t("cancelRecognition") + '</button>' : '') +
          '<form id="lookupForm"><label for="recognizedText">' + t("recognizedText") + '</label><textarea id="recognizedText" maxlength="2000" rows="3" placeholder="' + escapeHtml(t("textPlaceholder")) + '" ' + (camera.busy ? 'disabled' : '') + '>' +
          escapeHtml(camera.text) + '</textarea><button class="primary-btn" type="submit" ' + (camera.busy ? 'disabled' : '') + '>' + t("lookup") + icon("arrow") +
          '</button></form><p class="scan-note">' + t("scanScope") + '</p><div id="scanResult" aria-live="polite">' + renderScanResult() + '</div></section></div></div></div>' + mainNav("camera") + '</div>';
      }
      function attachCamera() {
        var video = document.getElementById("cameraVideo");
        if (video && camera.stream) { video.srcObject = camera.stream; video.play().catch(function () {}); }
        var stage = document.getElementById("cropStage");
        if (!stage || camera.busy) return;
        var drag = null;
        function point(event) { var box = stage.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)), y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) }; }
        stage.addEventListener("pointerdown", function (event) { event.preventDefault(); drag = point(event); camera.crop = null; stage.setPointerCapture(event.pointerId); });
        stage.addEventListener("pointermove", function (event) {
          if (!drag) return;
          var now = point(event);
          camera.crop = { x: Math.min(drag.x, now.x), y: Math.min(drag.y, now.y), w: Math.abs(now.x - drag.x), h: Math.abs(now.y - drag.y) };
          updateCrop();
        });
        stage.addEventListener("pointerup", function () {
          drag = null;
          if (camera.crop && (camera.crop.w < .025 || camera.crop.h < .025)) camera.crop = null;
          camera.result = null; camera.selected = null;
          updateCrop();
          var result = document.getElementById("scanResult"); if (result) result.innerHTML = "";
        });
        stage.addEventListener("pointercancel", function () { drag = null; camera.crop = null; updateCrop(); });
        updateCrop();
      }
      function updateCrop() {
        var box = document.getElementById("cropBox");
        if (!box) return;
        box.style.display = camera.crop ? "block" : "none";
        if (camera.crop) { box.style.left = camera.crop.x * 100 + "%"; box.style.top = camera.crop.y * 100 + "%"; box.style.width = camera.crop.w * 100 + "%"; box.style.height = camera.crop.h * 100 + "%"; }
      }
      async function readPhoto() {
        if (!camera.photo || camera.busy) return;
        camera.busy = true; camera.error = false; camera.notice = t("ocrLoading"); camera.progress = 0; camera.result = null; camera.selected = null;
        var run = ++camera.run;
        render();
        try {
          if (!window.Tesseract) throw new Error("OCR library unavailable");
          var image = await loadImage(camera.url);
          var crop = camera.crop || { x: 0, y: 0, w: 1, h: 1 };
          var width = image.naturalWidth * crop.w, height = image.naturalHeight * crop.h;
          var factor = Math.min(2, 1800 / Math.max(width, height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(width * factor)); canvas.height = Math.max(1, Math.round(height * factor));
          var context = canvas.getContext("2d");
          context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, image.naturalWidth * crop.x, image.naturalHeight * crop.y, width, height, 0, 0, canvas.width, canvas.height);
          var assetRoot = mobileMode ? "." : "";
          var worker = await Tesseract.createWorker("kor+eng", 1, {
            workerPath: assetRoot + "/vendor/tesseract/worker.min.js", corePath: assetRoot + "/vendor/core", langPath: assetRoot + "/ocr-data", gzip: false, workerBlobURL: false,
            logger: function (event) {
              if (run !== camera.run || screen !== "camera") return;
              camera.progress = Math.round((event.progress || 0) * 100);
              camera.notice = t(event.status === "recognizing text" ? "ocrReading" : "ocrLoading");
              var text = document.getElementById("ocrStatusText"), bar = document.getElementById("ocrProgress");
              if (text) text.textContent = camera.notice;
              if (bar) { bar.style.width = camera.progress + "%"; bar.parentElement.setAttribute("aria-valuenow", camera.progress); }
            }
          });
          if (run !== camera.run) { await worker.terminate(); return; }
          camera.worker = worker;
          await worker.setParameters({ tessedit_pageseg_mode: "11", preserve_interword_spaces: "1" });
          var result = await worker.recognize(canvas);
          if (run !== camera.run) return;
          camera.text = result.data.text.trim().slice(0, 2000);
          camera.confidence = result.data.confidence;
          camera.edited = false;
          camera.notice = t(camera.text ? "ocrDone" : "ocrEmpty");
          camera.error = !camera.text;
          camera.busy = false;
          await worker.terminate(); camera.worker = null;
          render();
          if (camera.text) await lookupSign(false);
        } catch (error) {
          if (run !== camera.run) return;
          if (camera.worker) { camera.worker.terminate().catch(function () {}); camera.worker = null; }
          camera.busy = false; camera.notice = t("ocrError"); camera.error = true; render();
        }
      }
      async function lookupSign(fromForm) {
        if (camera.busy) return;
        var field = document.getElementById("recognizedText");
        if (fromForm && field) camera.text = field.value.trim();
        if (!camera.text) { camera.notice = t("emptyText"); camera.error = true; render(); return; }
        var run = ++camera.run;
        camera.busy = true; camera.notice = t("matching"); camera.error = false; camera.result = null; camera.selected = null; render();
        try {
          var payload = { text: camera.text, confidence: camera.confidence, source: camera.edited ? "manual" : "ocr" };
          var result;
          if (mobileMode && window.SignNative) result = window.SignNative.match(cards, payload);
          else {
            var response = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("Lookup failed");
            result = await response.json();
          }
          if (run !== camera.run) return;
          camera.result = result; camera.selected = result.matchedId; camera.busy = false; camera.notice = ""; render();
        } catch (_) {
          if (run !== camera.run) return;
          camera.busy = false; camera.notice = t("matchError"); camera.error = true; render();
        }
      }
      document.getElementById("captureInput").addEventListener("change", function (event) { usePhoto(event.target.files[0], true); event.target.value = ""; });
      document.getElementById("uploadInput").addEventListener("change", function (event) { usePhoto(event.target.files[0], false); event.target.value = ""; });
      document.addEventListener("visibilitychange", function () { if (document.hidden) { stopCamera(); if (screen === "camera") render(); } });
      window.addEventListener("pagehide", function () { stopCamera(); cancelOcr(); if (camera.url) URL.revokeObjectURL(camera.url); });
      app.addEventListener("submit", function (event) {
        if (event.target.id === "lookupForm") { event.preventDefault(); lookupSign(true); }
        if (event.target.id === "teachForm") { event.preventDefault(); saveContribution(); }
      });
      app.addEventListener("input", function (event) {
        if (event.target.id === "recognizedText") { camera.text = event.target.value; camera.edited = true; camera.selected = null; camera.result = null; var result = document.getElementById("scanResult"); if (result) result.innerHTML = ""; }
        if (event.target.id === "librarySearch") { libraryQuery = event.target.value; document.getElementById("catalogGrid").innerHTML = catalogGridMarkup(); document.getElementById("libraryCount").textContent = t("signsCount", { n: filteredLibrary().length }); }
      });
      app.addEventListener("change", function (event) {
        if (event.target.id === "libraryCategory") { libraryCategory = event.target.value; librarySubcategory = "all"; render(); }
        if (event.target.id === "librarySubtype") { librarySubcategory = event.target.value; render(); }
      });

      app.addEventListener("click", async function (e) {
        if (choiceLocked) return;
        var target = e.target.closest("[data-action]");
        if (!target) return;
        var action = target.dataset.action;
        if (action === "zoom" && Date.now() < suppressZoomUntil) return;
        if (action === "setup-language") { state.language = target.dataset.lang; save(); render(); }
        else if (action === "confirm-language") { state.languageChosen = true; save(); screen = state.onboarded ? "home" : "onboarding"; render(); }
        else if (action === "language-menu") { languageMenuOpen = true; render(); }
        else if (action === "language-close") { languageMenuOpen = false; render(); }
        else if (action === "switch-language") { state.language = target.dataset.lang; languageMenuOpen = false; save(); render(); }
        else if (action === "nav-home") navigate("home");
        else if (action === "nav-review") navigate("review");
        else if (action === "settings") { settingsReturn = screen; navigate("settings"); }
        else if (action === "settings-back") { screen = settingsReturn; render(); }
        else if (action === "category") { state.selectedCategory = target.dataset.category; state.selectedSubcategory = "all"; save(); render(); }
        else if (action === "category-all") { state.selectedCategory = "all"; state.selectedSubcategory = "all"; save(); render(); }

        else if (action === "nav-library") navigate("library");
        else if (action === "nav-camera") navigate("camera");
        else if (action === "nav-community") navigate("community");
        else if (action === "quick-camera") openQuickCamera();
        else if (action === "camera" || action === "camera-open") openCamera();
        else if (action === "sample-scan") showSampleScan("mega");
        else if (action === "native-camera") { if (window.SignNative && window.SignNative.isNative) openNativePhoto("camera"); else { stopCamera(); render(); document.getElementById("captureInput").click(); } }
        else if (action === "upload") { if (window.SignNative && window.SignNative.isNative) openNativePhoto("photos"); else { stopCamera(); render(); document.getElementById("uploadInput").click(); } }
        else if (action === "capture") capturePhoto();
        else if (action === "ocr") readPhoto();
        else if (action === "cancel-ocr") { cancelOcr(); camera.notice = ""; render(); }
        else if (action === "reset-crop") { camera.crop = null; camera.result = null; camera.selected = null; updateCrop(); var result = document.getElementById("scanResult"); if (result) result.innerHTML = ""; }
        else if (action === "confirm-candidate") { camera.selected = target.dataset.id; reinforceSelection(camera.selected, true); render(); }
        else if (action === "reinforce-result") { reinforceSelection(target.dataset.id, false); render(); }
        else if (action === "correct-result") { camera.selected = null; camera.reinforced = false; render(); }
        else if (action === "teach-sign") { camera.teachOpen = true; render(); }
        else if (action === "sync-community") {
          if (!window.SignNative || communityBusy) return;
          communityBusy = true; communityNotice = t("syncing"); render();
          try { var syncStats = await window.SignNative.syncCommunity(); mergePublishedCards(); communityNotice = t(syncStats.lastSyncStatus === "ok" ? "syncDone" : "syncBundled"); }
          catch (_) { communityNotice = t("syncOffline"); }
          communityBusy = false; render();
        }
        else if (action === "save-review") saveForReview(target.dataset.id);
        else if (action === "sources") { sourcesReturn = screen; navigate("sources"); }
        else if (action === "sources-back") navigate(sourcesReturn);
        else if (action === "subcategory") { state.selectedSubcategory = target.dataset.subcategory; save(); render(); }
        else if (action === "start-learn") askStart("learn");
        else if (action === "start-review") askStart("review");
        else if (action === "resume") { screen = state.activeSession && state.activeSession.phase === "results_pending" ? "summary" : "study"; render(); }
        else if (action === "pause") { screen = state.activeSession && state.activeSession.mode === "review" ? "review" : "home"; render(); }
        else if (action === "reveal") { if (state.activeSession) { state.activeSession.revealed = true; save(); render(); } }
        else if (action === "choose-left") choose("left");
        else if (action === "choose-right") choose("right");
        else if (action === "undo") undo();
        else if (action === "detail") { detailReturn = screen; detailId = target.dataset.id; detailRevealed = false; navigate("detail"); }
        else if (action === "detail-back") navigate(detailReturn);
        else if (action === "detail-reveal") { detailRevealed = true; render(); }
        else if (action === "zoom") openZoom(target.dataset.id);
        else if (action === "zoom-close") closeZoom();
        else if (action === "zoom-in" || action === "zoom-out") {
          zoomScale = Math.max(1, Math.min(4, zoomScale + (action === "zoom-in" ? .35 : -.35)));
          if (zoomScale === 1) { zoomX = 0; zoomY = 0; }
          updateZoom();
        }
        else if (action === "onboard-next") { onboardStep = 1; render(); }
        else if (action === "onboard-skip" || action === "onboard-done") completeOnboarding();
        else if (action === "how") { onboardReturn = "settings"; onboardStep = 0; screen = "onboarding"; render(); }
        else if (action === "reset") {
          modal = { title: t("resetTitle"), body: t("resetBody"), confirm: t("resetProgress"), danger: true,
            onConfirm: function () {
              var onboarded = state.onboarded, language = state.language, languageChosen = state.languageChosen;
              state = freshState(); state.onboarded = onboarded; state.language = language; state.languageChosen = languageChosen;
              save(); screen = "home"; render();
            } };
          render();
        }
        else if (action === "about") {
          modal = { title: t("aboutTitle"), body: t("aboutBody"), cancel: t("close"), confirm: t("gotIt"), onConfirm: function () {} };
          render();
        }
        else if (action === "modal-cancel") { modal = null; render(); }
        else if (action === "modal-confirm") { var run = modal && modal.onConfirm; modal = null; if (run) run(); render(); }
        else if (action === "summary-review") leaveSummary("review-session");
        else if (action === "summary-more") leaveSummary("learn-session");
        else if (action === "summary-home") leaveSummary(state.activeSession && state.activeSession.mode === "review" ? "review" : "home");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          if (zoomCard) closeZoom();
          else if (languageMenuOpen) { languageMenuOpen = false; render(); }
          else if (modal) { modal = null; render(); }
          else if (screen === "study") { screen = state.activeSession && state.activeSession.mode === "review" ? "review" : "home"; render(); }
          else if (screen === "summary") leaveSummary(state.activeSession && state.activeSession.mode === "review" ? "review" : "home");
          else if (screen === "detail") navigate(detailReturn);
          else if (screen === "camera") navigate("home");
          else if (screen === "sources") navigate(sourcesReturn);
          else if (screen === "settings") { screen = settingsReturn; render(); }
          return;
        }
        if (modal || languageMenuOpen || zoomCard || screen !== "study") return;
        if (e.key === "ArrowLeft") { e.preventDefault(); choose("left"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); choose("right"); }
        else if (e.code === "Space" && !state.activeSession.revealed) { e.preventDefault(); state.activeSession.revealed = true; save(); render(); }
      });
      document.addEventListener("error", function (e) {
        if (e.target && e.target.tagName === "IMG") {
          var wrap = e.target.closest(".photo-btn");
          if (wrap) { wrap.classList.add("broken"); wrap.disabled = true; }
        }
      }, true);
      var previewId = new URLSearchParams(window.location.search).get("demo");
      if (previewId && findCard(previewId)) {
        state.languageChosen = true;
        state.onboarded = true;
        showSampleScan(previewId);
      } else render();
      if (mobileMode && window.SignNative) {
        window.SignNative.syncCommunity().then(function () {
          mergePublishedCards();
          if (screen === "community") render();
        }).catch(function () {});
      }
    })();
