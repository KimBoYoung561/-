export interface AnyangPlace {
  id: string;
  name: string;
  category: 'subway' | 'park' | 'culture' | 'shopping' | 'bike_ramp';
  categoryLabel: string;
  dong: string;
  address: string;
  lat: number;
  lng: number;
  popular?: boolean;
}

export const ANYANG_PLACES_DATABASE: AnyangPlace[] = [
  {
    id: 'place-1',
    name: '쌍개울 문화광장',
    category: 'bike_ramp',
    categoryLabel: '자전거 랜드마크',
    dong: '비산동',
    address: '경기 안양시 동안구 비산동 1115 (비산교 하부)',
    lat: 37.39557,
    lng: 126.93994,
    popular: true,
  },
  {
    id: 'place-2',
    name: '평촌중앙공원',
    category: 'park',
    categoryLabel: '공원/녹지',
    dong: '관양동',
    address: '경기 안양시 동안구 관평로 149',
    lat: 37.39120,
    lng: 126.95750,
    popular: true,
  },
  {
    id: 'place-3',
    name: '안양예술공원',
    category: 'culture',
    categoryLabel: '문화예술',
    dong: '안양동',
    address: '경기 안양시 만안구 예술공원로 131',
    lat: 37.41975,
    lng: 126.92457,
    popular: true,
  },
  {
    id: 'place-4',
    name: '범계역 (4호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    dong: '호계동',
    address: '경기 안양시 동안구 동안로 130',
    lat: 37.3895,
    lng: 126.9508,
    popular: true,
  },
  {
    id: 'place-5',
    name: '안양역 (1호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    dong: '안양동',
    address: '경기 안양시 만안구 만안로 232',
    lat: 37.4018,
    lng: 126.9228,
    popular: true,
  },
  {
    id: 'place-6',
    name: '인덕원역 (4호선)',
    category: 'subway',
    categoryLabel: '지하철역',
    dong: '관양동',
    address: '경기 안양시 동안구 과천대로 1',
    lat: 37.4015,
    lng: 126.9772,
    popular: true,
  },
  {
    id: 'place-7',
    name: '충훈교 벚꽃길',
    category: 'park',
    categoryLabel: '수변 명소',
    dong: '석수동',
    address: '경기 안양시 만안구 석수동 777',
    lat: 37.4153,
    lng: 126.9156,
    popular: true,
  },
  {
    id: 'place-8',
    name: '병목안시민공원',
    category: 'park',
    categoryLabel: '자연공원',
    dong: '안양동',
    address: '경기 안양시 만안구 병목안로 215',
    lat: 37.3882,
    lng: 126.9185,
    popular: true,
  },
  {
    id: 'place-9',
    name: '학운공원',
    category: 'park',
    categoryLabel: '하천공원',
    dong: '관양동',
    address: '경기 안양시 동안구 학운로 100',
    lat: 37.3975,
    lng: 126.9708,
    popular: false,
  },
  {
    id: 'place-10',
    name: '안양종합운동장',
    category: 'culture',
    categoryLabel: '체육시설',
    dong: '비산동',
    address: '경기 안양시 동안구 비산로 156',
    lat: 37.4035,
    lng: 126.9482,
    popular: false,
  },
];

export function searchAnyangPlacesLocal(query: string): AnyangPlace[] {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  return ANYANG_PLACES_DATABASE.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.dong.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q)
  );
}
