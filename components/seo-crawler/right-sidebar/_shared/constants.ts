// components/seo-crawler/right-sidebar/_shared/constants.ts
export const TECH = {
  cwv: { lcpGood: 2500, lcpWarn: 4000, inpGood: 200, inpWarn: 500, clsGood: 0.1, clsWarn: 0.25, ttfbGood: 800, ttfbWarn: 1800 },
  dom: { warn: 1500, bad: 3000 },
  blocking: { cssWarn: 3, jsWarn: 2 },
  thirdParty: { warn: 10, bad: 20 },
  ssl: { expirySoonDays: 30 },
  redirect: { chainWarn: 2 },
  depth: { warn: 5 },
}
