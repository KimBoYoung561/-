import { CommunityReport } from '../types';

export const INITIAL_COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: 'rep-1',
    category: 'closure',
    categoryName: '길 통제/공사',
    title: '학의천 내손교 하부 수변 데크 보수 공사 (서행 우회 필요)',
    location: '학의천 내손교 하부 북단 자전거도로',
    content: '데크 바닥 교체 공사로 약 100m 구간 임시 우회로 운영 중입니다. 보행자와 자전거가 함께 통행하니 10km/h 이하로 서행하세요.',
    timestamp: '15분 전',
    status: 'active',
    likes: 12,
    isLiked: false,
  },
  {
    id: 'rep-2',
    category: 'hazard',
    categoryName: '장애물/토사',
    title: '비산교 남단 램프 코너 모래 쏠림 주의',
    location: '비산교 남단 자전거 진입 램프 커브길',
    content: '어제 비로 인해 경사로 커브 바닥에 고운 모래가 약간 깔려 있어 급제동 시 슬립 낙차 위험이 있습니다. 서행 진입하세요.',
    timestamp: '1시간 전',
    status: 'active',
    likes: 8,
    isLiked: false,
  },
  {
    id: 'rep-3',
    category: 'damage',
    categoryName: '도로 파손/요철',
    title: '안양천 충훈교 인근 자전거도로 포장 단차 보수 완료',
    location: '안양천 충훈교 동편 300m 지점',
    content: '기존 아스콘 균열 및 요철 구간 말끔하게 평탄화 포장 완료되었습니다. 쾌적하게 통행 가능합니다.',
    timestamp: '3시간 전',
    status: 'resolved',
    likes: 24,
    isLiked: true,
  },
];

export const ANYANG_COMMUNITY_REPORTS = INITIAL_COMMUNITY_REPORTS;
