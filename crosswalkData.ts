export interface CrosswalkInfo {
  dong: string;
  widthM: number;
  lengthM: number;
  roadName?: string;
}

export const ANYANG_CROSSWALKS: Record<string, CrosswalkInfo> = {
  'cw-bisan-1': {
    dong: '비산동',
    widthM: 6.0,
    lengthM: 24.5,
    roadName: '관악대로 비산교 사거리',
  },
  'cw-pyeongchon-1': {
    dong: '관양동',
    widthM: 8.0,
    lengthM: 32.0,
    roadName: '시민대로 평촌중앙공원 앞',
  },
  'cw-beomgye-1': {
    dong: '호계동',
    widthM: 7.5,
    lengthM: 28.0,
    roadName: '평촌대로 범계역 로데오 교차로',
  },
  'cw-anyang-1': {
    dong: '안양동',
    widthM: 6.5,
    lengthM: 22.0,
    roadName: '안양로 안양역 광장 교차로',
  },
  'cw-indeokwon-1': {
    dong: '관양동',
    widthM: 8.5,
    lengthM: 35.0,
    roadName: '흥안대로 인덕원역 사거리',
  },
  'cw-chunghun-1': {
    dong: '석수동',
    widthM: 5.5,
    lengthM: 18.5,
    roadName: '충훈로 벚꽃길 진입 교차로',
  },
};
