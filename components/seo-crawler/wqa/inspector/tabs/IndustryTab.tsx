import React from 'react';
import { useSeoCrawler } from '../../../../../contexts/SeoCrawlerContext';
import EcommerceView from '../parts/industryViews/EcommerceView';
import NewsView from '../parts/industryViews/NewsView';
import LocalView from '../parts/industryViews/LocalView';
import SaasView from '../parts/industryViews/SaasView';
import HealthcareView from '../parts/industryViews/HealthcareView';
import FinanceView from '../parts/industryViews/FinanceView';
import RestaurantView from '../parts/industryViews/RestaurantView';
import RealEstateView from '../parts/industryViews/RealEstateView';
import JobBoardView from '../parts/industryViews/JobBoardView';
import EducationView from '../parts/industryViews/EducationView';
import BlogView from '../parts/industryViews/BlogView';
import GeneralView from '../parts/industryViews/GeneralView';
import { formatIndustryLabel } from '../../wqaUtils';

const VIEWS: Record<string, React.FC<{ page: any }>> = {
  ecommerce: EcommerceView,
  news: NewsView,
  local: LocalView,
  saas: SaasView,
  healthcare: HealthcareView,
  finance: FinanceView,
  restaurant: RestaurantView,
  real_estate: RealEstateView,
  job_board: JobBoardView,
  education: EducationView,
  blog: BlogView,
  general: GeneralView,
};

export default function IndustryTab({ page }: { page: any }) {
  const { wqaState } = useSeoCrawler();
  const industry = wqaState?.industryOverride ?? wqaState?.detectedIndustry ?? 'general';
  const View = VIEWS[industry] || GeneralView;
  return (
    <div>
      <div className="mb-4 text-[11px] uppercase tracking-widest text-[#666]">
        Overlay for: <span className="text-white font-bold">{formatIndustryLabel(industry)}</span>
        {wqaState?.industryOverride && <span className="ml-2 text-[#F5364E]">(overridden)</span>}
      </div>
      <View page={page} />
    </div>
  );
}
