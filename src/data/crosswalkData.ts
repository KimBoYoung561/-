// 안양시 공식 횡단보도 실측 데이터셋 (안양시 관리번호, 횡단보도 폭, 횡단보도 길이, 법정동)
export interface CrosswalkInfo {
  id: string;
  widthM: number;
  lengthM: number;
  dong: string;
  roadName?: string;
  safetyTip?: string;
}

export const ANYANG_CROSSWALKS: CrosswalkInfo[] = [
  // 호계동 권역
  { id: '2022120116', widthM: 4.75, lengthM: 5.69, dong: '호계3동', roadName: '경수대로 호계사거리 부근' },
  { id: '2022120117', widthM: 6.99, lengthM: 8.55, dong: '호계3동', roadName: '엘에스로 호계공원 앞' },
  { id: '2022120118', widthM: 18.01, lengthM: 18.51, dong: '호계3동', roadName: '경수대로 대형 교차로 횡단보도' },
  { id: '2022120123', widthM: 3.51, lengthM: 4.21, dong: '호계1동', roadName: '호계시장 앞 이면도로' },
  { id: '2022120125', widthM: 24.14, lengthM: 24.78, dong: '호계3동', roadName: '호계삼거리 광폭 횡단보도' },
  { id: '2022120135', widthM: 11.58, lengthM: 17.98, dong: '호계1동', roadName: '흥안대로 호계1동 주민센터 앞' },
  { id: '2022120136', widthM: 16.49, lengthM: 18.10, dong: '호계1동', roadName: '유통단지사거리 횡단보도' },
  { id: '2022120145', widthM: 22.20, lengthM: 30.88, dong: '호계1동', roadName: '경수대로 무궁화마을 입구 대형 횡단보도' },
  { id: '2022120204', widthM: 4.61, lengthM: 7.47, dong: '호계2동', roadName: '평촌더샵 아이파크 앞' },
  { id: '2022120280', widthM: 22.31, lengthM: 37.93, dong: '호계2동', roadName: '안양천 호계교 진입로 횡단보도' },

  // 비산동 권역
  { id: '2022120292', widthM: 4.47, lengthM: 7.01, dong: '비산동', roadName: '관악대로 비산사거리 연결로' },
  { id: '2022120293', widthM: 6.02, lengthM: 6.37, dong: '비산동', roadName: '비산체육공원 앞 횡단보도' },
  { id: '2022120295', widthM: 19.66, lengthM: 30.57, dong: '비산동', roadName: '비산교 남단 대형 교차로 횡단보도' },
  { id: '2022120207', widthM: 10.03, lengthM: 16.69, dong: '비산동', roadName: '비산이마트 앞 평촌대로' },
  { id: '2022120233', widthM: 7.72, lengthM: 12.84, dong: '비산동', roadName: '학의천 비산교 하부 진출입로' },
  { id: '2022120250', widthM: 16.85, lengthM: 34.80, dong: '비산동', roadName: '관악대로 비산동 행정복지센터 앞' },

  // 관양동 권역
  { id: '2022120296', widthM: 18.54, lengthM: 39.40, dong: '관양동', roadName: '관악대로 수촌마을 사거리 광폭 횡단보도' },
  { id: '2022120297', widthM: 6.02, lengthM: 9.48, dong: '관양동', roadName: '관양중학교 앞 횡단보도' },
  { id: '2022120298', widthM: 20.28, lengthM: 32.64, dong: '관양동', roadName: '동편마을 입구 사거리 횡단보도' },
  { id: '2022120304', widthM: 14.11, lengthM: 21.12, dong: '관양동', roadName: '관양교 북단 횡단보도' },
  { id: '2022120339', widthM: 20.05, lengthM: 34.83, dong: '관양동', roadName: '인덕원역 4호선 사거리 횡단보도' },

  // 부림동 권역 (시청, 평촌중앙공원)
  { id: '2022120026', widthM: 12.33, lengthM: 22.46, dong: '부림동', roadName: '시민대로 안양시청 앞 횡단보도' },
  { id: '2022120027', widthM: 13.86, lengthM: 20.31, dong: '부림동', roadName: '평촌스마트스퀘어 입구' },
  { id: '2022120672', widthM: 16.88, lengthM: 25.44, dong: '부림동', roadName: '평촌역 광장 앞 횡단보도' },
  { id: '2022120674', widthM: 16.76, lengthM: 25.31, dong: '부림동', roadName: '부림동 행정복지센터 사거리' },

  // 평안동 권역 (평촌 도심)
  { id: '2022120028', widthM: 18.80, lengthM: 29.93, dong: '평안동', roadName: '평촌대로 현대홈타운 앞 횡단보도' },
  { id: '2022120029', widthM: 18.77, lengthM: 30.02, dong: '평안동', roadName: '귀인로 평촌학원가 입구' },
  { id: '2022120681', widthM: 19.78, lengthM: 30.80, dong: '평안동', roadName: '평안동 행정복지센터 앞 횡단보도' },

  // 안양동 권역 (안양 1~9동)
  { id: '2022120001', widthM: 24.00, lengthM: 24.88, dong: '안양7동', roadName: '안양천 메가트리아 진입 횡단보도' },
  { id: '2022120008', widthM: 20.47, lengthM: 21.80, dong: '안양8동', roadName: '명학역 사거리 횡단보도' },
  { id: '2022120017', widthM: 19.52, lengthM: 25.06, dong: '안양6동', roadName: '만안구청 앞 안양로 횡단보도' },
  { id: '2022120035', widthM: 18.36, lengthM: 22.73, dong: '안양1동', roadName: '안양역 1번출구 앞 교차로' },
  { id: '2022120040', widthM: 9.82, lengthM: 10.88, dong: '안양4동', roadName: '중앙시장 입구 횡단보도' },
  { id: '2022120056', widthM: 19.64, lengthM: 24.11, dong: '안양4동', roadName: '벽산사거리 대형 횡단보도' },
  { id: '2022121040', widthM: 6.34, lengthM: 7.69, dong: '안양9동', roadName: '수암천로 병목안 입구 횡단보도' },
  { id: '2022120036', widthM: 14.56, lengthM: 17.38, dong: '안양5동', roadName: '안양아트센터 앞 횡단보도' },

  // 석수동 권역 (석수 1~3동)
  { id: '2022120042', widthM: 2.51, lengthM: 7.80, dong: '석수2동', roadName: '충훈교 서단 횡단보도' },
  { id: '2022120043', widthM: 6.21, lengthM: 45.38, dong: '석수2동', roadName: '안양로 석수역 앞 광폭 횡단보도' },
  { id: '2022120046', widthM: 20.02, lengthM: 34.87, dong: '석수2동', roadName: '연현마을 입구 교차로' },
  { id: '2022120054', widthM: 8.57, lengthM: 8.97, dong: '석수1동', roadName: '안양예술공원 사거리 횡단보도' },
  { id: '2022120057', widthM: 32.58, lengthM: 38.54, dong: '석수1동', roadName: '관악역 1번출구 경수대로 광폭 횡단보도' },
  { id: '2022120047', widthM: 10.31, lengthM: 13.77, dong: '석수3동', roadName: '충훈부 아파트단지 앞 횡단보도' },

  // 박달동 권역 (박달 1~2동)
  { id: '2022120063', widthM: 8.01, lengthM: 9.49, dong: '박달2동', roadName: '박석교 서단 박달로 횡단보도' },
  { id: '2022120067', widthM: 13.48, lengthM: 18.57, dong: '박달2동', roadName: '한일유앤아이 앞 사거리' },
  { id: '2022120079', widthM: 7.94, lengthM: 33.48, dong: '박달2동', roadName: '박달삼거리 횡단보도' },
  { id: '2022121946', widthM: 7.22, lengthM: 13.49, dong: '박달1동', roadName: '안양여고사거리 방면 박달1동' },

  // 평촌동 / 귀인동 권역
  { id: '2022121044', widthM: 11.63, lengthM: 11.84, dong: '평촌동', roadName: '흥안대로 평촌동 주민센터 앞' },
  { id: '2022121052', widthM: 17.60, lengthM: 17.64, dong: '평촌동', roadName: '귀인중학교 사거리 횡단보도' },
  { id: '2022121063', widthM: 6.46, lengthM: 9.42, dong: '귀인동', roadName: '평촌먹자골목 입구 횡단보도' },
  { id: '2022121064', widthM: 14.40, lengthM: 17.59, dong: '귀인동', roadName: '평촌공고 사거리 횡단보도' },

  // 범계동 권역
  { id: '2022120011', widthM: 13.29, lengthM: 19.07, dong: '범계동', roadName: '시민대로 범계역 롯데백화점 앞' },
  { id: '2022120023', widthM: 27.49, lengthM: 27.90, dong: '범계동', roadName: '범계사거리 대형 광폭 횡단보도' },
  { id: '2022120877', widthM: 21.97, lengthM: 22.25, dong: '범계동', roadName: '동안경찰서 앞 횡단보도' },

  // 갈산동 / 신촌동 권역
  { id: '2022120203', widthM: 5.88, lengthM: 8.85, dong: '갈산동', roadName: '자유공원 입구 횡단보도' },
  { id: '2022120286', widthM: 8.47, lengthM: 8.74, dong: '갈산동', roadName: '갈산동 행정복지센터 앞' },
  { id: '2022120234', widthM: 6.11, lengthM: 9.05, dong: '신촌동', roadName: '평촌학원가 남단 신촌동 횡단보도' },
];

/**
 * 횡단보도 ID 또는 동 이름으로 정보 조회
 */
export function getCrosswalkById(id: string): CrosswalkInfo | undefined {
  return ANYANG_CROSSWALKS.find((c) => c.id === id);
}

/**
 * 특정 동에 위치한 횡단보도 목록 조회
 */
export function getCrosswalksByDong(dong: string): CrosswalkInfo[] {
  return ANYANG_CROSSWALKS.filter((c) => c.dong.includes(dong) || dong.includes(c.dong));
}

/**
 * 횡단보도 정보 포맷팅 텍스트
 */
export function formatCrosswalkText(cw: CrosswalkInfo): string {
  return `${cw.dong} 횡단보도 (폭 ${cw.widthM}m · 길이 ${cw.lengthM}m)`;
}
