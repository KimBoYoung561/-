import { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Zap,
  TreePine,
  Clock,
  Navigation,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { ANYANG_THEME_COURSES } from '../data/courses';
import { Course } from '../types';

interface AllCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
}

const CATEGORY_TABS = [
  '전체 코스',
  '수변 힐링',
  '평지 무장애',
  '숲길·경치',
  '도심 생활',
  '장거리 쾌속',
];

export default function AllCoursesModal({
  isOpen,
  onClose,
  onSelectCourse,
}: AllCoursesModalProps) {
  const [activeTab, setActiveTab] = useState('전체 코스');

  if (!isOpen) return null;

  const filteredCourses = ANYANG_THEME_COURSES.filter((course) => {
    if (activeTab === '전체 코스') return true;
    if (activeTab === '수변 힐링')
      return (
        course.categoryTitle.includes('수변') ||
        course.categoryTitle.includes('하천') ||
        course.categoryTitle.includes('호수')
      );
    if (activeTab === '평지 무장애')
      return (
        course.categoryTitle.includes('무장애') ||
        course.categoryTitle.includes('평지') ||
        course.categoryTitle.includes('슬로프')
      );
    if (activeTab === '숲길·경치')
      return (
        course.categoryTitle.includes('숲') ||
        course.categoryTitle.includes('예술') ||
        course.categoryTitle.includes('생태') ||
        course.categoryTitle.includes('역사')
      );
    if (activeTab === '도심 생활')
      return course.categoryTitle.includes('도심') || course.categoryTitle.includes('생활');
    if (activeTab === '장거리 쾌속')
      return course.distanceKm >= 6.0 || course.categoryTitle.includes('종단');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="mt-auto md:my-auto md:mx-auto flex h-[92vh] md:h-[85vh] w-full max-w-2xl flex-col rounded-t-3xl md:rounded-3xl bg-slate-50 text-slate-900 shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0055FF] text-white shadow-md">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-[#0055FF]">
                  안양시 공식 & 명소
                </span>
                <span className="text-[11px] font-bold text-slate-500">총 12개 테마</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                안양시 추천 자전거 테마 코스
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-6 py-3 bg-white border-b border-slate-200 hide-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-xl px-3.5 py-2 min-h-[38px] text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#0055FF] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Course Cards Scrollable List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>선택 시 해당 코스 경로와 횡단보도 안전 데이터가 지도에 표시됩니다.</span>
            <span className="font-bold text-[#0055FF]">{filteredCourses.length}개 코스</span>
          </div>

          {filteredCourses.map((course, idx) => (
            <div
              key={course.id || idx}
              onClick={() => {
                onSelectCourse(course);
                onClose();
              }}
              className="group flex flex-col rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-400 hover:shadow-md active:scale-[0.99] cursor-pointer transition-all"
            >
              {/* Top Row: Badge & Category */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0055FF]">
                    {course.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {course.categoryTitle}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="text-[#0055FF]">{course.distance}</span>
                  <span className="text-slate-300">·</span>
                  <span>{course.time}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0055FF] transition-colors leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-[#0055FF] group-hover:text-white transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 mb-2 text-center">
                <div>
                  <span className="block text-[10px] font-medium text-slate-400">거리 / 시간</span>
                  <span className="text-xs font-bold text-slate-800">
                    {course.distance} · {course.time}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-slate-400">경사도</span>
                  <span className="text-xs font-bold text-slate-700">{course.slope}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-medium text-slate-400">예상 소모</span>
                  <span className="text-xs font-bold text-amber-600">{course.calories} kcal</span>
                </div>
              </div>

              {/* Anyang Official Road Type Breakdown Badge Strip */}
              <div className="flex items-center gap-1.5 mb-2.5 bg-slate-50 border border-slate-200/70 rounded-xl p-1.5 text-[10px] font-bold">
                <span className="text-slate-400 shrink-0 text-[9px] font-semibold pl-0.5">도로구성:</span>
                <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  하천변 {course.riverPathRatio ?? 85}%
                </span>
                <span className="flex items-center gap-1 bg-blue-50 text-[#1E3A8A] border border-blue-900/20 px-1.5 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]" />
                  분리 {course.segregatedRatio ?? 10}%
                </span>
                <span className="flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                  비분리 {course.unsegregatedRatio ?? 5}%
                </span>
              </div>

              {/* Keywords / Highlights */}
              <div className="flex flex-wrap items-center gap-1.5">
                {course.themeKeywords?.map((kw, kIdx) => (
                  <span
                    key={kIdx}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>안양시 시민 자전거 보험 자동 적용 코스</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#0055FF] hover:underline"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
