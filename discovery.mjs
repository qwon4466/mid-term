const PROFILE_DATA = {
  cafe: {
    match: /카페|커피|coffee|cafe|tea_house|bakery_cafe|dessert/iu,
    label: { ko: '카페·음료점', en: 'Cafe or drink shop', ja: 'カフェ・ドリンク店' },
    explanation: {
      ko: '커피, 차, 주스 같은 음료와 간단한 디저트를 주문하는 곳으로 보여요.',
      en: 'This appears to be a place for coffee, tea, juice, and light desserts.',
      ja: 'コーヒー、お茶、ジュース、簡単なデザートを注文する店のようです。'
    },
    experience: {
      ko: '카운터나 키오스크에서 메뉴를 고르고 매장 이용 또는 포장을 요청할 수 있어요.',
      en: 'Choose from the menu at a counter or kiosk and ask to dine in or take away.',
      ja: 'カウンターやキオスクで注文し、店内利用または持ち帰りを選べます。'
    },
    phrases: [
      ['아이스 아메리카노 한 잔 주세요.', 'Aiseu amerikano han jan juseyo.', { ko: '아이스 아메리카노 한 잔을 주문하는 말', en: 'One iced Americano, please.', ja: 'アイスアメリカーノを1杯ください。' }],
      ['포장해 주세요.', 'Pojanghae juseyo.', { ko: '포장을 요청하는 말', en: 'To go, please.', ja: '持ち帰りでお願いします。' }]
    ]
  },
  bar: {
    match: /술집|맥주|주점|호프|펍|pub|beer|taproom|izakaya/iu,
    label: { ko: '맥주 전문점·주점', en: 'Beer pub or bar', ja: 'ビアパブ・居酒屋' },
    explanation: {
      ko: '맥주와 소주 같은 주류를 안주와 함께 주문하는 주점으로 보여요.',
      en: 'This appears to be a pub serving beer, soju, and food to share.',
      ja: 'ビールや焼酎などのお酒と、おつまみを注文する居酒屋のようです。'
    },
    experience: {
      ko: '자리에 앉아 술과 안주를 주문하는 곳이에요. 인기 안주, 맥주 종류, 마지막 주문 시간을 확인할 수 있어요.',
      en: 'Take a seat and order drinks with shared dishes. You can ask about popular food, beer choices, and last order time.',
      ja: '席に座り、お酒と料理を注文します。人気のおつまみ、ビールの種類、ラストオーダーを確認できます。'
    },
    phrases: [
      ['생맥주 두 잔 주세요.', 'Saengmaekju du jan juseyo.', { ko: '생맥주 두 잔을 주문하는 말', en: 'Two draft beers, please.', ja: '生ビールを2杯ください。' }],
      ['인기 있는 안주가 뭐예요?', 'Ingi inneun anjuga mwoyeyo?', { ko: '인기 안주를 묻는 말', en: 'What is the popular dish to have with drinks?', ja: '人気のおつまみは何ですか？' }],
      ['마지막 주문은 몇 시예요?', 'Majimak jumuneun myeot siyeyo?', { ko: '마지막 주문 시간을 묻는 말', en: 'What time is last order?', ja: 'ラストオーダーは何時ですか？' }]
    ]
  },
  restaurant: {
    match: /음식|식당|한식|중식|일식|분식|restaurant|food|meal|barbecue|pizza|chicken/iu,
    label: { ko: '음식점', en: 'Restaurant', ja: '飲食店' },
    explanation: { ko: '식사나 간단한 음식을 주문하는 음식점으로 보여요.', en: 'This appears to be a restaurant or food shop.', ja: '食事や軽食を注文する飲食店のようです。' },
    experience: { ko: '메뉴를 고른 뒤 직원이나 키오스크에 주문하고 매장 식사 또는 포장 여부를 확인할 수 있어요.', en: 'Choose a menu item, order with staff or a kiosk, and check whether dine-in or takeaway is available.', ja: 'メニューを選び、店員またはキオスクで注文し、店内利用や持ち帰りを確認できます。' },
    phrases: [
      ['인기 메뉴가 뭐예요?', 'Ingi menyuga mwoyeyo?', { ko: '인기 있는 메뉴를 묻는 말', en: 'What is the popular menu item?', ja: '人気メニューは何ですか？' }],
      ['맵지 않게 해 주세요.', 'Maepji anke hae juseyo.', { ko: '덜 맵게 요청하는 말', en: 'Please make it not spicy.', ja: '辛くしないでください。' }]
    ]
  },
  convenience: {
    match: /편의점|convenience_store|convenience store|세븐일레븐|gs25|씨유|\bcu\b/iu,
    label: { ko: '편의점', en: 'Convenience store', ja: 'コンビニ' },
    explanation: { ko: '음료, 간식, 생활용품을 사고 간단한 서비스를 이용하는 편의점으로 보여요.', en: 'This appears to be a convenience store for drinks, snacks, daily goods, and simple services.', ja: '飲み物、軽食、日用品などを買えるコンビニのようです。' },
    experience: { ko: '상품을 직접 고른 뒤 계산대에서 결제합니다. 일부 음식은 데우거나 매장 안에서 먹을 수 있어요.', en: 'Pick items from the shelves and pay at the counter. Some food can be heated or eaten inside.', ja: '商品を選んでレジで支払います。一部の食品は温めたり店内で食べたりできます。' },
    phrases: [
      ['이거 데워 주세요.', 'Igeo dewo juseyo.', { ko: '음식을 데워 달라고 요청하는 말', en: 'Please heat this up.', ja: 'これを温めてください。' }],
      ['봉투 주세요.', 'Bongtu juseyo.', { ko: '봉투를 요청하는 말', en: 'A bag, please.', ja: '袋をください。' }]
    ]
  },
  bakery: {
    match: /빵|베이커리|제과|bakery|bread|파리바게뜨|뚜레쥬르/iu,
    label: { ko: '빵집·베이커리', en: 'Bakery', ja: 'ベーカリー' },
    explanation: { ko: '빵, 케이크, 샌드위치 같은 제품을 고르는 베이커리로 보여요.', en: 'This appears to be a bakery selling bread, cakes, and sandwiches.', ja: 'パン、ケーキ、サンドイッチなどを販売するベーカリーのようです。' },
    experience: { ko: '진열된 제품을 골라 계산대에서 결제합니다. 음료나 포장 서비스를 함께 제공할 수 있어요.', en: 'Choose displayed items and pay at the counter. Drinks and gift packaging may also be available.', ja: '陳列された商品を選び、レジで支払います。飲み物や包装サービスがある場合もあります。' },
    phrases: [
      ['이 빵 하나 주세요.', 'I ppang hana juseyo.', { ko: '빵 하나를 주문하는 말', en: 'One of this bread, please.', ja: 'このパンを一つください。' }],
      ['추천하는 빵이 뭐예요?', 'Chucheonhaneun ppangi mwoyeyo?', { ko: '추천 상품을 묻는 말', en: 'Which bread do you recommend?', ja: 'おすすめのパンは何ですか？' }]
    ]
  },
  retail: {
    match: /쇼핑|소매|마트|잡화|화장품|의류|store|shop|retail|supermarket|clothing|cosmetic|다이소|올리브영/iu,
    label: { ko: '상점·소매점', en: 'Retail shop', ja: '小売店' },
    explanation: { ko: '상품을 둘러보고 필요한 물건을 구매하는 상점으로 보여요.', en: 'This appears to be a retail shop where you can browse and buy products.', ja: '商品を見て必要な物を購入する小売店のようです。' },
    experience: { ko: '매장에서 상품과 가격을 확인한 뒤 계산대나 셀프 계산대에서 결제할 수 있어요.', en: 'Check products and prices, then pay at a staffed or self-checkout counter.', ja: '商品と価格を確認し、レジまたはセルフレジで支払えます。' },
    phrases: [
      ['이거 얼마예요?', 'Igeo eolmayeyo?', { ko: '가격을 묻는 말', en: 'How much is this?', ja: 'これはいくらですか？' }],
      ['카드로 결제할게요.', 'Kadeuro gyeoljehalgeyo.', { ko: '카드 결제를 알리는 말', en: 'I will pay by card.', ja: 'カードで払います。' }]
    ]
  },
  pharmacy: {
    match: /약국|pharmacy|drugstore/iu,
    label: { ko: '약국', en: 'Pharmacy', ja: '薬局' },
    explanation: { ko: '약을 구입하고 복용 방법을 안내받는 약국으로 보여요.', en: 'This appears to be a pharmacy where you can buy medicine and ask how to take it.', ja: '薬を購入し、服用方法を相談できる薬局のようです。' },
    experience: { ko: '증상을 설명하고 약사에게 일반의약품과 복용 방법을 문의할 수 있어요.', en: 'Describe your symptoms and ask the pharmacist about over-the-counter medicine and dosage.', ja: '症状を説明し、薬剤師に市販薬や服用方法を相談できます。' },
    phrases: [
      ['감기약 있어요?', 'Gamgiyak isseoyo?', { ko: '감기약이 있는지 묻는 말', en: 'Do you have cold medicine?', ja: '風邪薬はありますか？' }],
      ['하루에 몇 번 먹어요?', 'Harue myeot beon meogeoyo?', { ko: '복용 횟수를 묻는 말', en: 'How many times a day should I take it?', ja: '一日に何回飲みますか？' }]
    ]
  },
  hospital: {
    match: /병원|의원|클리닉|치과|hospital|clinic|dentist|medical/iu,
    label: { ko: '병원·의원', en: 'Clinic or hospital', ja: '病院・クリニック' },
    explanation: { ko: '증상을 상담하고 진료를 받는 병원이나 의원으로 보여요.', en: 'This appears to be a clinic or hospital for consultation and treatment.', ja: '症状を相談して診察を受ける病院・クリニックのようです。' },
    experience: { ko: '접수 후 대기하고 의료진에게 증상을 설명합니다. 신분증이나 보험 관련 확인이 필요할 수 있어요.', en: 'Register, wait, and describe your symptoms to medical staff. Identification or insurance details may be requested.', ja: '受付後に待ち、医療スタッフに症状を説明します。身分証や保険情報が必要な場合があります。' },
    phrases: [
      ['진료받고 싶어요.', 'Jillyobatgo sipeoyo.', { ko: '진료를 요청하는 말', en: 'I would like to see a doctor.', ja: '診察を受けたいです。' }],
      ['예약해야 해요?', 'Yeyakhaeya haeyo?', { ko: '예약이 필요한지 묻는 말', en: 'Do I need an appointment?', ja: '予約が必要ですか？' }]
    ]
  },
  beauty: {
    match: /미용|헤어|네일|이발|beauty|hair|salon|barber|nail/iu,
    label: { ko: '미용·뷰티숍', en: 'Beauty or hair salon', ja: '美容・ヘアサロン' },
    explanation: { ko: '머리, 네일 또는 미용 서비스를 받는 곳으로 보여요.', en: 'This appears to be a place for hair, nail, or beauty services.', ja: 'ヘア、ネイルなどの美容サービスを受ける店のようです。' },
    experience: { ko: '원하는 서비스와 가격, 소요 시간을 확인하고 시술을 받을 수 있어요. 예약이 필요한 곳도 있습니다.', en: 'Confirm the service, price, and duration before treatment. Some shops require reservations.', ja: '希望するサービス、価格、所要時間を確認して施術を受けます。予約が必要な店もあります。' },
    phrases: [
      ['조금만 다듬어 주세요.', 'Jogeumman dadeumeo juseyo.', { ko: '머리를 조금만 정리해 달라는 말', en: 'Please trim it just a little.', ja: '少しだけ整えてください。' }],
      ['가격이 얼마예요?', 'Gagyeogi eolmayeyo?', { ko: '가격을 묻는 말', en: 'How much does it cost?', ja: '料金はいくらですか？' }]
    ]
  },
  laundry: {
    match: /세탁|빨래|laundry|cleaning/iu,
    label: { ko: '세탁소·빨래방', en: 'Laundry or dry cleaner', ja: 'クリーニング・コインランドリー' },
    explanation: { ko: '옷이나 침구를 세탁하거나 건조하는 곳으로 보여요.', en: 'This appears to be a place for washing, drying, or dry-cleaning clothes and bedding.', ja: '衣類や寝具を洗濯・乾燥・クリーニングする店のようです。' },
    experience: { ko: '직원에게 세탁물을 맡기거나 무인 세탁기와 건조기를 직접 사용할 수 있어요.', en: 'Leave items with staff or use self-service washers and dryers.', ja: '店員に預けるか、セルフサービスの洗濯機・乾燥機を利用できます。' },
    phrases: [
      ['세탁은 얼마나 걸려요?', 'Setageun eolmana geollyeoyo?', { ko: '소요 시간을 묻는 말', en: 'How long does the laundry take?', ja: '洗濯にはどのくらいかかりますか？' }],
      ['건조기도 사용할 수 있어요?', 'Geonjogido sayonghal su isseoyo?', { ko: '건조기 사용 가능 여부를 묻는 말', en: 'Can I use a dryer too?', ja: '乾燥機も使えますか？' }]
    ]
  },
  unknown: {
    match: /$a/,
    label: { ko: '가게·장소', en: 'Shop or place', ja: '店・場所' },
    explanation: { ko: '간판의 이름은 읽었지만 정확한 업종을 자동으로 확정하지는 못했어요.', en: 'The sign name was read, but the exact business type could not be confirmed automatically.', ja: '看板の名前は読み取れましたが、正確な業種は自動確認できませんでした。' },
    experience: { ko: '아래 문장으로 직원에게 어떤 곳인지, 무엇을 이용할 수 있는지 바로 물어볼 수 있어요.', en: 'Use the phrases below to ask staff what the place offers.', ja: '下の表現で、この店が何を提供しているか店員に確認できます。' },
    phrases: [
      ['여기는 뭐 하는 곳이에요?', 'Yeogineun mwo haneun gosieyo?', { ko: '어떤 서비스를 제공하는지 묻는 말', en: 'What kind of place is this?', ja: 'ここは何をする所ですか？' }],
      ['가장 인기 있는 게 뭐예요?', 'Gajang ingi inneun ge mwoyeyo?', { ko: '가장 인기 있는 상품이나 서비스를 묻는 말', en: 'What is the most popular item or service?', ja: '一番人気のものは何ですか？' }],
      ['카드로 결제할 수 있어요?', 'Kadeuro gyeoljehal su isseoyo?', { ko: '카드 결제가 가능한지 묻는 말', en: 'Can I pay by card?', ja: 'カードで支払えますか？' }]
    ]
  }
};

const COMMON_BRANDS = [
  { aliases: ['빽다방', "paik'scoffee", 'paikscoffee'], name: '빽다방', profile: 'cafe' },
  { aliases: ['컴포즈커피', 'composecoffee'], name: '컴포즈커피', profile: 'cafe' },
  { aliases: ['이디야', '이디야커피', 'ediyacoffee'], name: '이디야커피', profile: 'cafe' },
  { aliases: ['투썸플레이스', 'atwosomeplace'], name: '투썸플레이스', profile: 'cafe' },
  { aliases: ['할리스', 'hollys'], name: '할리스', profile: 'cafe' },
  { aliases: ['공차', 'gongcha'], name: '공차', profile: 'cafe' },
  { aliases: ['파리바게뜨', '파리바게트', 'parisbaguette'], name: '파리바게뜨', profile: 'bakery' },
  { aliases: ['뚜레쥬르', 'touslesjours'], name: '뚜레쥬르', profile: 'bakery' },
  { aliases: ['다이소', 'daiso'], name: '다이소', profile: 'retail' },
  { aliases: ['올리브영', 'oliveyoung'], name: '올리브영', profile: 'retail' },
  { aliases: ['gs25'], name: 'GS25', profile: 'convenience' },
  { aliases: ['세븐일레븐', '7eleven'], name: '세븐일레븐', profile: 'convenience' },
  { aliases: ['씨유'], name: 'CU', profile: 'convenience' },
  { aliases: ['역전할머니맥주', '역전할맥', '할맥', 'yeokjeonhalmeonibeer'], name: '역전할머니맥주', profile: 'bar' },
  { aliases: ['인쌩맥주', '인생맥주', 'inssaengbeer'], name: '인쌩맥주', profile: 'bar' },
  { aliases: ['생활맥주', 'dailybeer'], name: '생활맥주', profile: 'bar' },
  { aliases: ['크라운호프', 'crownhop'], name: '크라운호프', profile: 'bar' }
];

function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('en').replace(/[<>&"']/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}

function cleanText(value) {
  return String(value || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim().slice(0, 200);
}

function safeUrl(value, fallback) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function localized(value, language) {
  return value[language] || value.en || value.ko;
}

function queryLinks(query) {
  const encoded = encodeURIComponent(query);
  return [
    { provider: 'naver-search', title: '네이버 지도 검색', url: `https://map.naver.com/p/search/${encoded}` },
    { provider: 'google-search', title: 'Google Maps 검색', url: `https://www.google.com/maps/search/?api=1&query=${encoded}%20Korea` }
  ];
}

function commonBrand(query) {
  const normalized = normalize(query);
  return COMMON_BRANDS.find(brand => brand.aliases.some(alias => {
    const needle = normalize(alias);
    return needle.length <= 2 ? normalized === needle : normalized.includes(needle);
  })) || null;
}

function profileFor(text, preferred) {
  if (preferred && PROFILE_DATA[preferred]) return { id: preferred, ...PROFILE_DATA[preferred] };
  const combined = String(text || '');
  const found = Object.entries(PROFILE_DATA).find(([id, profile]) => id !== 'unknown' && profile.match.test(combined));
  return found ? { id: found[0], ...found[1] } : { id: 'unknown', ...PROFILE_DATA.unknown };
}

function phraseList(profile, language) {
  return profile.phrases.map(([korean, romanization, meaning]) => ({ korean, romanization, meaning: localized(meaning, language) }));
}

async function fetchNaver(query, env, fetchImpl) {
  if (!env.NAVER_SEARCH_CLIENT_ID || !env.NAVER_SEARCH_CLIENT_SECRET) return [];
  const url = new URL('https://openapi.naver.com/v1/search/local.json');
  url.searchParams.set('query', query);
  url.searchParams.set('display', '5');
  url.searchParams.set('sort', 'random');
  const response = await fetchImpl(url, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_SEARCH_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_SEARCH_CLIENT_SECRET,
      'User-Agent': 'SignBySign/1.0'
    },
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) throw new Error(`Naver search failed: ${response.status}`);
  const payload = await response.json();
  return (payload.items || []).slice(0, 5).map(item => {
    const title = cleanText(item.title);
    const fallback = queryLinks(title || query)[0].url;
    return {
      provider: 'naver',
      name: title || query,
      category: cleanText(item.category),
      address: cleanText(item.roadAddress || item.address),
      url: safeUrl(item.link, fallback)
    };
  });
}

async function fetchGoogle(query, language, env, fetchImpl) {
  if (!env.GOOGLE_PLACES_API_KEY) return [];
  const response = await fetchImpl('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.primaryTypeDisplayName,places.googleMapsUri'
    },
    body: JSON.stringify({ textQuery: `${query} 대한민국`, languageCode: language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'ko', regionCode: 'KR', pageSize: 5 }),
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) throw new Error(`Google Places search failed: ${response.status}`);
  const payload = await response.json();
  return (payload.places || []).slice(0, 5).map(place => ({
    provider: 'google',
    name: cleanText(place.displayName && place.displayName.text) || query,
    category: cleanText((place.primaryTypeDisplayName && place.primaryTypeDisplayName.text) || place.primaryType),
    address: cleanText(place.formattedAddress),
    url: safeUrl(place.googleMapsUri, queryLinks(query)[1].url)
  }));
}

function evidenceScore(item, query) {
  const target = normalize(item.name);
  const source = normalize(query);
  if (target === source) return 100;
  if (target.includes(source) || source.includes(target)) return 85;
  return 45;
}

export function providerStatus(env = process.env) {
  return {
    naver: Boolean(env.NAVER_SEARCH_CLIENT_ID && env.NAVER_SEARCH_CLIENT_SECRET),
    google: Boolean(env.GOOGLE_PLACES_API_KEY)
  };
}

export async function discoverSign({ text, language = 'ko' }, env = process.env, fetchImpl = fetch) {
  const query = String(text || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 120);
  if (!query) throw new TypeError('A sign name is required.');
  const providers = providerStatus(env);
  const tasks = [];
  if (providers.naver) tasks.push(fetchNaver(query, env, fetchImpl));
  if (providers.google) tasks.push(fetchGoogle(query, language, env, fetchImpl));
  const settled = await Promise.allSettled(tasks);
  const evidence = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  evidence.sort((a, b) => evidenceScore(b, query) - evidenceScore(a, query));

  const known = commonBrand(query);
  const best = evidence[0] || null;
  const categoryText = evidence.map(item => item.category).join(' ');
  const profile = profileFor(`${query} ${categoryText}`, known && known.profile);
  const displayName = cleanText((best && best.name) || (known && known.name) || query);
  const liveMatch = Boolean(best);
  const configured = providers.naver || providers.google;
  const confidence = liveMatch ? Math.min(96, evidenceScore(best, query)) : known ? 76 : profile.id !== 'unknown' ? 58 : 30;
  const searchLinks = queryLinks(displayName || query);
  const sources = evidence.length ? evidence.slice(0, 3) : searchLinks;

  const prefix = language === 'en'
    ? (liveMatch ? 'Search results indicate that' : known ? 'Based on common brand information,' : 'Based on the readable sign name,')
    : language === 'ja'
      ? (liveMatch ? '検索結果によると、' : known ? '一般的なブランド情報によると、' : '読み取れた看板名をもとにすると、')
      : (liveMatch ? '검색 결과상' : known ? '일반적인 브랜드 정보상' : '읽힌 간판 문구를 기준으로');
  const description = language === 'en'
    ? `${prefix} ${displayName} is a ${localized(profile.label, language)}. ${localized(profile.explanation, language)}`
    : language === 'ja'
      ? `${prefix}${displayName}は${localized(profile.label, language)}です。${localized(profile.explanation, language)}`
      : `${prefix} '${displayName}' 간판의 예상 업종은 '${localized(profile.label, language)}'입니다. ${localized(profile.explanation, language)}`;

  return {
    status: liveMatch ? 'discovered' : known || profile.id !== 'unknown' ? 'guided' : 'guidance',
    query,
    name: displayName,
    category: profile.id,
    categoryLabel: localized(profile.label, language),
    description,
    experience: localized(profile.experience, language),
    phrases: phraseList(profile, language),
    confidence,
    searched: liveMatch,
    configured,
    providers,
    sources,
    searchLinks,
    disclaimer: language === 'en'
      ? `This is a best-effort guide based on the sign name${liveMatch ? ' and place-search results' : ' and general business information'}. Confirm the exact branch, hours, menu, and services in the map result.`
      : language === 'ja'
        ? `看板名${liveMatch ? 'と場所検索結果' : 'と一般的な業種情報'}に基づく参考情報です。正確な店舗、営業時間、メニュー、サービスは地図の検索結果で確認してください。`
        : `간판 문구와 ${liveMatch ? '장소 검색 결과' : '일반 업종 정보'}를 바탕으로 만든 참고 안내예요. 정확한 지점·영업시간·메뉴·서비스는 지도 검색 결과에서 다시 확인해 주세요.`
  };
}
