export interface AnyangPlace {
  id: string;
  name: string;
  category: 'subway' | 'park' | 'culture' | 'shopping' | 'bike_ramp' | 'facility';
  categoryLabel: string;
  address: string;
  dong: string;
  lat: number;
  lng: number;
  keywords: string[];
  popular?: boolean;
}

// ── Korean Hangul Decomposition (초성, 중성, 종성 분해 및 실시간 자음 검색 엔진) ──
const HANGUL_BASE = 0xac00;
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];
const JUNGSUNG_LIST = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];
const JONGSUNG_LIST = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

/**
 * Disassemble a Korean string into its component Jamo characters (e.g. '안양' -> 'ㅇㅏㄴㅇㅑㅇ')
 */
export function disassembleHangul(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - HANGUL_BASE;
      const cho = Math.floor(offset / 588);
      const jung = Math.floor((offset % 588) / 28);
      const jong = offset % 28;

      result += CHOSUNG_LIST[cho] + JUNGSUNG_LIST[jung];
      if (jong > 0) {
        result += JONGSUNG_LIST[jong];
      }
    } else {
      result += text[i];
    }
  }
  return result;
}

/**
 * Extract Chosung string from Hangul text (e.g. '범계역' -> 'ㅂㄱㅇ', '안양예술공원' -> 'ㅇㅇㅇㅅㄱㅇ')
 */
export function extractChosung(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - HANGUL_BASE;
      const cho = Math.floor(offset / 588);
      result += CHOSUNG_LIST[cho];
    } else if (CHOSUNG_LIST.includes(text[i])) {
      result += text[i];
    } else {
      result += text[i];
    }
  }
  return result;
}

export const ANYANG_PLACES_DATABASE: AnyangPlace[] = [
  // 1. 지하철역 (Subway)
  {
    id: 'sub-beomgye',
    name: '범계역 (4호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 동안구 동안로 130',
    dong: '호계동',
    lat: 37.3895,
    lng: 126.9508,
    keywords: ['범계', '범계역', '4호선', '롯데백화점', '평촌1번가', '동안로', '호계동'],
    popular: true,
  },
  {
    id: 'sub-pyeongchon',
    name: '평촌역 (4호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 동안구 시민대로 242',
    dong: '관양동',
    lat: 37.3945,
    lng: 126.9635,
    keywords: ['평촌', '평촌역', '4호선', '이마트평촌', '한림대병원', '스마트스퀘어', '관양동'],
    popular: true,
  },
  {
    id: 'sub-indeokwon',
    name: '인덕원역 (4호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 동안구 관악대로 495',
    dong: '관양동',
    lat: 37.3990,
    lng: 126.9820,
    keywords: ['인덕원', '인덕원역', '4호선', '동편마을', '관악대로', '흥안대로', '관양동'],
    popular: true,
  },
  {
    id: 'sub-anyang',
    name: '안양역 (1호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 만안구 만안로 232',
    dong: '안양동',
    lat: 37.4018,
    lng: 126.9228,
    keywords: ['안양', '안양역', '1호선', '엔터식스', '안양일번가', '만안로', '안양동'],
    popular: true,
  },
  {
    id: 'sub-myeonghak',
    name: '명학역 (1호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 만안구 안양로 115',
    dong: '안양동',
    lat: 37.3840,
    lng: 126.9355,
    keywords: ['명학', '명학역', '1호선', '성결대학교', '만안구청', '안양아트센터', '안양동'],
    popular: true,
  },
  {
    id: 'sub-gwanak',
    name: '관악역 (1호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 만안구 경수대로 1273',
    dong: '석수동',
    lat: 37.4190,
    lng: 126.9090,
    keywords: ['관악', '관악역', '1호선', '안양예술공원입구', '석수동', '삼성천'],
    popular: true,
  },
  {
    id: 'sub-seoksu',
    name: '석수역 (1호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 안양시 만안구 연현로 1',
    dong: '석수동',
    lat: 37.4350,
    lng: 126.9025,
    keywords: ['석수', '석수역', '1호선', '서울시계', '연현마을', '기아대교', '석수동'],
    popular: false,
  },
  {
    id: 'sub-geumjeong',
    name: '금정역 (1·4호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    address: '경기도 군포시 군포로 750',
    dong: '호계동 인근',
    lat: 37.3725,
    lng: 126.9435,
    keywords: ['금정', '금정역', '환승역', '1호선', '4호선', '군포시계', '호계동'],
    popular: false,
  },

  // 2. 주요 공원 및 하천 명소 (Parks & Nature)
  {
    id: 'park-central',
    name: '평촌중앙공원 분수대',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 동안구 관평로 149',
    dong: '평촌동',
    lat: 37.3915,
    lng: 126.9560,
    keywords: ['평촌중앙공원', '중앙공원', '분수대', '롤러스케이트장', '시청앞', '광장', '평촌동'],
    popular: true,
  },
  {
    id: 'park-artpark',
    name: '안양예술공원 벽천분수대',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 만안구 예술공원로 131',
    dong: '석수동',
    lat: 37.4230,
    lng: 126.9280,
    keywords: ['안양예술공원', '예술공원', '벽천분수대', '파빌리온', '삼성천', '계곡', '석수동', '유원지'],
    popular: true,
  },
  {
    id: 'park-ssanggaeul',
    name: '쌍개울 문화광장 (안양천-학의천 만남의광장)',
    category: 'park',
    categoryLabel: '자전거거점',
    address: '경기도 안양시 동안구 비산동 1032-1',
    dong: '비산동',
    lat: 37.3980,
    lng: 126.9485,
    keywords: ['쌍개울', '쌍개울광장', '비산교', '합수부', '무료정비소', '만남의광장', '비산동', '하천자전거길'],
    popular: true,
  },
  {
    id: 'park-hagun',
    name: '학운공원 (학의천 오픈스페이스)',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 동안구 학의로 111',
    dong: '평촌동',
    lat: 37.3935,
    lng: 126.9615,
    keywords: ['학운공원', '학운교', '학의천', '잔디광장', '평촌체육', '평촌동'],
    popular: true,
  },
  {
    id: 'park-samdeok',
    name: '삼덕공원',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 만안구 병목안로 40',
    dong: '안양동',
    lat: 37.3980,
    lng: 126.9230,
    keywords: ['삼덕공원', '수암천', '안양역공원', '삼덕제지', '도심공원', '안양동'],
    popular: true,
  },
  {
    id: 'park-byeongmok',
    name: '병목안 시민공원',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 만안구 병목안로 215',
    dong: '안양동',
    lat: 37.3880,
    lng: 126.9080,
    keywords: ['병목안', '병목안시민공원', '수리산', '수암천', '인공폭포', '캠핑장', '안양동'],
    popular: true,
  },
  {
    id: 'park-bisan-sports',
    name: '비산체육공원',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 동안구 비산동 98-1',
    dong: '비산동',
    lat: 37.3965,
    lng: 126.9540,
    keywords: ['비산체육공원', '비산운동장', '풋살장', '학의천입구', '체육시설', '비산동'],
    popular: false,
  },
  {
    id: 'park-jayu',
    name: '자유공원 (평촌아트홀)',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 동안구 평촌대로 76',
    dong: '평촌동',
    lat: 37.3750,
    lng: 126.9580,
    keywords: ['자유공원', '평촌아트홀', '갈산동', '어린이교통공원', '평촌남부', '평촌동'],
    popular: true,
  },
  {
    id: 'park-chunghun',
    name: '충훈교 벚꽃길 및 쉼터',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 만안구 석수로 134',
    dong: '석수동',
    lat: 37.4180,
    lng: 126.9185,
    keywords: ['충훈교', '충훈부', '벚꽃길', '안양천벚꽃', '석수3동', '슬로프', '석수동'],
    popular: true,
  },
  {
    id: 'park-seoksu-sports',
    name: '석수체육공원',
    category: 'park',
    categoryLabel: '공원·명소',
    address: '경기도 안양시 만안구 안양로 595',
    dong: '석수동',
    lat: 37.4320,
    lng: 126.9080,
    keywords: ['석수체육공원', '축구장', '인라인장', '안양천북부', '삼막천합수', '석수동'],
    popular: false,
  },
  {
    id: 'park-indeokwon-shelter',
    name: '학의천 인덕원교 쉼터',
    category: 'park',
    categoryLabel: '자전거거점',
    address: '경기도 안양시 동안구 관양동 1502',
    dong: '관양동',
    lat: 37.3985,
    lng: 126.9805,
    keywords: ['인덕원교', '학의천쉼터', '공기주입기', '스마트쉼터', '백운호수방면', '관양동'],
    popular: true,
  },

  // 3. 공공기관 및 문화 체육시설 (Culture & City Facilities)
  {
    id: 'gov-cityhall',
    name: '안양시청',
    category: 'culture',
    categoryLabel: '공공기관',
    address: '경기도 안양시 동안구 시민대로 235',
    dong: '관양동',
    lat: 37.3942,
    lng: 126.9568,
    keywords: ['안양시청', '시청', '시민대로', '동안구청앞', '스마트도시통합센터', '관양동'],
    popular: true,
  },
  {
    id: 'gov-dongan',
    name: '동안구청',
    category: 'culture',
    categoryLabel: '공공기관',
    address: '경기도 안양시 동안구 동안로 163',
    dong: '비산동',
    lat: 37.3910,
    lng: 126.9545,
    keywords: ['동안구청', '구청', '동안로', '평촌중앙공원옆', '보건소', '비산동'],
    popular: false,
  },
  {
    id: 'gov-manan',
    name: '만안구청',
    category: 'culture',
    categoryLabel: '공공기관',
    address: '경기도 안양시 만안구 안양로 128',
    dong: '안양동',
    lat: 37.3855,
    lng: 126.9340,
    keywords: ['만안구청', '구청', '안양로', '명학역부근', '보건소', '안양동'],
    popular: false,
  },
  {
    id: 'sports-stadium',
    name: '안양종합운동장 (FC안양)',
    category: 'culture',
    categoryLabel: '체육문화',
    address: '경기도 안양시 동안구 비산로 156',
    dong: '비산동',
    lat: 37.4040,
    lng: 126.9490,
    keywords: ['안양종합운동장', '종합운동장', 'FC안양', '축구전용구장', '비산동운동장', '비산동'],
    popular: true,
  },
  {
    id: 'sports-arena',
    name: '안양실내체육관 / 안양빙상장',
    category: 'culture',
    categoryLabel: '체육문화',
    address: '경기도 안양시 동안구 비산로 156',
    dong: '비산동',
    lat: 37.4055,
    lng: 126.9495,
    keywords: ['안양빙상장', '실내체육관', '정관장레드부스터스', '농구장', '스케이트장', '비산동'],
    popular: false,
  },
  {
    id: 'culture-artcenter',
    name: '안양아트센터 (수리홀)',
    category: 'culture',
    categoryLabel: '체육문화',
    address: '경기도 안양시 만안구 문예로36번길 16',
    dong: '안양동',
    lat: 37.3830,
    lng: 126.9330,
    keywords: ['안양아트센터', '문예회관', '수리홀', '명학역', '공연장', '안양동'],
    popular: false,
  },

  // 4. 쇼핑 및 생활 상권 (Shopping & Commercial)
  {
    id: 'shop-lotte-dpt',
    name: '롯데백화점 평촌점',
    category: 'shopping',
    categoryLabel: '쇼핑몰',
    address: '경기도 안양시 동안구 시민대로 180',
    dong: '호계동',
    lat: 37.3905,
    lng: 126.9520,
    keywords: ['롯데백화점', '범계롯데', '평촌롯데', '시민대로', '식당가', '호계동'],
    popular: true,
  },
  {
    id: 'shop-enter6',
    name: '엔터식스 안양역점',
    category: 'shopping',
    categoryLabel: '쇼핑몰',
    address: '경기도 안양시 만안구 만안로 232',
    dong: '안양동',
    lat: 37.4015,
    lng: 126.9230,
    keywords: ['엔터식스', '안양역쇼핑', 'CGV안양', '안양역민자역사', '안양동'],
    popular: true,
  },
  {
    id: 'shop-emart-bisan',
    name: '이마트 안양비산점',
    category: 'shopping',
    categoryLabel: '대형마트',
    address: '경기도 안양시 동안구 관악대로 104',
    dong: '비산동',
    lat: 37.4035,
    lng: 126.9450,
    keywords: ['이마트비산', '비산이마트', '비산사거리', '관악대로', '비산동'],
    popular: true,
  },
  {
    id: 'shop-emart-pyeongchon',
    name: '이마트 평촌점',
    category: 'shopping',
    categoryLabel: '대형마트',
    address: '경기도 안양시 동안구 시민대로 300',
    dong: '관양동',
    lat: 37.3950,
    lng: 126.9630,
    keywords: ['이마트평촌', '평촌이마트', '평촌역마트', '시민대로', '관양동'],
    popular: true,
  },
  {
    id: 'shop-anyang-1st',
    name: '안양 1번가 상가거리',
    category: 'shopping',
    categoryLabel: '상업거리',
    address: '경기도 안양시 만안구 장내로 139',
    dong: '안양동',
    lat: 37.4005,
    lng: 126.9220,
    keywords: ['안양1번가', '안양일번가', '안양역맛집', '젊음의거리', '안양동'],
    popular: true,
  },
  {
    id: 'shop-academy-street',
    name: '평촌 학원가 먹거리촌',
    category: 'shopping',
    categoryLabel: '상업거리',
    address: '경기도 안양시 동안구 평촌대로 112',
    dong: '평촌동',
    lat: 37.3820,
    lng: 126.9540,
    keywords: ['평촌학원가', '학원가사거리', '먹자골목', '귀인동', '평촌동'],
    popular: true,
  },
  {
    id: 'shop-dongpyeon',
    name: '동편마을 카페거리',
    category: 'shopping',
    categoryLabel: '상업거리',
    address: '경기도 안양시 동안구 동편로27번길',
    dong: '관양동',
    lat: 37.4030,
    lng: 126.9810,
    keywords: ['동편마을', '동편마을카페거리', '인덕원카페', '관양동'],
    popular: true,
  },

  // 5. 교량 및 주요 자전거 램프 (Bridges & River Ramps)
  {
    id: 'ramp-bisan-bridge',
    name: '비산대교 진출입 램프',
    category: 'bike_ramp',
    categoryLabel: '자전거램프',
    address: '경기도 안양시 동안구 비산동 1030',
    dong: '비산동',
    lat: 37.3995,
    lng: 126.9490,
    keywords: ['비산대교', '비산교', '안양천램프', '슬로프', '비산동'],
    popular: false,
  },
  {
    id: 'ramp-hagun-bridge',
    name: '학운교 평촌도심 진입 램프',
    category: 'bike_ramp',
    categoryLabel: '자전거램프',
    address: '경기도 안양시 동안구 평촌동 898',
    dong: '평촌동',
    lat: 37.3948,
    lng: 126.9610,
    keywords: ['학운교', '학운교램프', '평촌진입로', '학의천슬로프', '평촌동'],
    popular: false,
  },
  {
    id: 'ramp-bakseok-bridge',
    name: '박석교 안양천 슬로프',
    category: 'bike_ramp',
    categoryLabel: '자전거램프',
    address: '경기도 안양시 만안구 박달동 11-1',
    dong: '박달동',
    lat: 37.4110,
    lng: 126.9240,
    keywords: ['박석교', '박달동', '안양천슬로프', '만안구'],
    popular: false,
  },
  {
    id: 'ramp-anyang-bridge',
    name: '안양대교 삼성천 연결로',
    category: 'bike_ramp',
    categoryLabel: '자전거램프',
    address: '경기도 안양시 만안구 석수동 250',
    dong: '석수동',
    lat: 37.4050,
    lng: 126.9320,
    keywords: ['안양대교', '삼성천분기점', '만안교', '안양천', '석수동'],
    popular: false,
  },
  {
    id: 'ramp-dongan-bridge',
    name: '동안교 백운호수 방면 램프',
    category: 'bike_ramp',
    categoryLabel: '자전거램프',
    address: '경기도 안양시 동안구 관양동 1480',
    dong: '관양동',
    lat: 37.4005,
    lng: 126.9865,
    keywords: ['동안교', '백운호수연결', '의왕시계', '학의천동단', '관양동'],
    popular: false,
  },
  {
    id: 'ramp-hogye-bridge',
    name: '호계교 의왕시계 슬로프',
    category: 'bike_ramp',
    categoryLabel: '자전거램프',
    address: '경기도 안양시 동안구 호계동 1001',
    dong: '호계동',
    lat: 37.3710,
    lng: 126.9520,
    keywords: ['호계교', '의왕고천', '안양천남단', '호계동'],
    popular: false,
  },
];

/**
 * High-accuracy Korean Hangul Search with real-time Chosung, decomposed Jamo, and substring matching
 * Matches:
 *  - Character-by-character partial typing: '아' -> matches '안양', '안' -> matches '안양'
 *  - Chosung (자음): 'ㅇㅇ' -> matches '안양', '인덕원', 'ㅂㄱ' -> matches '범계', 'ㅍㅊ' -> matches '평촌'
 *  - Substring & keyword matching
 */
export function searchAnyangPlacesLocal(query: string): AnyangPlace[] {
  if (!query || !query.trim()) return [];
  const rawQ = query.trim().toLowerCase().replace(/\s+/g, '');
  const disQ = disassembleHangul(rawQ);
  const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(rawQ);

  const matched = ANYANG_PLACES_DATABASE.map((place) => {
    const rawName = place.name.toLowerCase().replace(/\s+/g, '');
    const rawAddr = place.address.toLowerCase().replace(/\s+/g, '');
    const rawDong = place.dong.toLowerCase().replace(/\s+/g, '');

    const disName = disassembleHangul(rawName);
    const disAddr = disassembleHangul(rawAddr);
    const disDong = disassembleHangul(rawDong);

    const choName = extractChosung(rawName);
    const choDong = extractChosung(rawDong);

    let score = 0;

    // 1. Exact or prefix name match
    if (rawName.startsWith(rawQ)) {
      score += 100;
    } else if (rawName.includes(rawQ)) {
      score += 80;
    }

    // 2. Disassembled Jamo match (e.g. typing '아' [ㅇㅏ] matches '안양' [ㅇㅏㄴㅇㅑㅇ])
    if (disName.startsWith(disQ)) {
      score += 70;
    } else if (disName.includes(disQ)) {
      score += 60;
    }

    // 3. Chosung match (e.g. typing 'ㅇㅇ' matches '안양')
    if (isChosungQuery) {
      if (choName.startsWith(rawQ)) {
        score += 65;
      } else if (choName.includes(rawQ)) {
        score += 50;
      }
    }

    // 4. Keyword & Dong matches
    for (const kw of place.keywords) {
      const cleanKw = kw.toLowerCase().replace(/\s+/g, '');
      const disKw = disassembleHangul(cleanKw);
      const choKw = extractChosung(cleanKw);

      if (cleanKw.includes(rawQ) || disKw.includes(disQ) || (isChosungQuery && choKw.includes(rawQ))) {
        score += 40;
        break;
      }
    }

    if (rawDong.includes(rawQ) || disDong.includes(disQ) || (isChosungQuery && choDong.includes(rawQ))) {
      score += 30;
    }

    if (rawAddr.includes(rawQ) || disAddr.includes(disQ)) {
      score += 20;
    }

    if (place.popular) {
      score += 5;
    }

    return { place, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.place);

  return matched;
}
