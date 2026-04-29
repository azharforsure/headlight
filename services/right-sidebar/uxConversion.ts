import { countWhere, pct, score100 } from './_helpers'
import { UxOverviewTab, UxVitalsTab, UxConversionTab, UxA11yTab, UxFrictionTab } from '../../components/seo-crawler/right-sidebar/modes/uxConversion'
import type { RsDataDeps, RsModeBundle } from './types'

export interface UxStats {
	overallScore: number
	vitals: { lcpGood: number; lcpPoor: number; clsGood: number; clsPoor: number; inpGood: number; inpPoor: number; total: number }
	conversion: { ctaPresent: number; formPresent: number; gatedPages: number; checkoutPages: number; total: number }
	a11y: { altMissing: number; emptyButtons: number; lowContrast: number | null; total: number }
	friction: { popupHeavy: number; intrusiveAds: number | null; longForms: number | null }
}

export function computeUxStats(deps: RsDataDeps): UxStats {
	const pages = deps.pages
	const n = pages.length
	let lcpGood = 0, lcpPoor = 0, clsGood = 0, clsPoor = 0, inpGood = 0, inpPoor = 0
	let ctaPresent = 0, formPresent = 0, gatedPages = 0, checkoutPages = 0
	let altMissing = 0, emptyButtons = 0, popupHeavy = 0

	for (const p of pages) {
		if (typeof p.fieldLcp === 'number') p.fieldLcp <= 2500 ? lcpGood++ : p.fieldLcp >= 4000 ? lcpPoor++ : 0
		if (typeof p.fieldCls === 'number') p.fieldCls <= 0.1  ? clsGood++ : p.fieldCls >= 0.25 ? clsPoor++ : 0
		if (typeof p.fieldInp === 'number') p.fieldInp <= 200  ? inpGood++ : p.fieldInp >= 500  ? inpPoor++ : 0
		if (p['hasCta']) ctaPresent++
		if (Array.isArray(p['forms']) && p['forms'].length > 0) formPresent++
		if (p['isGated']) gatedPages++
		if ((p.url || '').match(/\/(cart|checkout)\b/)) checkoutPages++
		if (Array.isArray(p['images'])) altMissing += (p['images'] as any[]).filter(i => !i?.alt || i.alt.trim() === '').length
		if (Array.isArray(p['buttons'])) emptyButtons += (p['buttons'] as any[]).filter(b => !b?.text || b.text.trim() === '').length
		if ((p['popupCount'] ?? 0) >= 2) popupHeavy++
	}

	const vitalScore = score100([
		{ weight: 1, value: pct(lcpGood, Math.max(1, lcpGood + lcpPoor)) },
		{ weight: 1, value: pct(clsGood, Math.max(1, clsGood + clsPoor)) },
		{ weight: 1, value: pct(inpGood, Math.max(1, inpGood + inpPoor)) },
	])
	const overallScore = score100([
		{ weight: 2, value: vitalScore },
		{ weight: 1, value: pct(ctaPresent, n) },
		{ weight: 1, value: 100 - pct(altMissing, Math.max(1, n * 5)) * 4 },
	])

	return {
		overallScore,
		vitals: { lcpGood, lcpPoor, clsGood, clsPoor, inpGood, inpPoor, total: n },
		conversion: { ctaPresent, formPresent, gatedPages, checkoutPages, total: n },
		a11y: { altMissing, emptyButtons, lowContrast: null, total: n },
		friction: { popupHeavy, intrusiveAds: null, longForms: null },
	}
}

export const uxConversionBundle: RsModeBundle<UxStats> = {
	mode: 'uxConversion',
	accent: 'rose',
	defaultTabId: 'ux_overview',
	tabs: [
		{ id: 'ux_overview',   label: 'Overview',   Component: UxOverviewTab },
		{ id: 'ux_vitals',     label: 'Vitals',     Component: UxVitalsTab },
		{ id: 'ux_conversion', label: 'Conversion', Component: UxConversionTab },
		{ id: 'ux_a11y',       label: 'A11y',       Component: UxA11yTab },
		{ id: 'ux_friction',   label: 'Friction',   Component: UxFrictionTab },
	],
	computeStats: computeUxStats,
}
