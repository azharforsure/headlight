import type { Mode } from '@headlight/types'
import type { RsModeBundle } from './types'
import { fullAuditBundle } from './fullAudit.ts'
import { wqaBundle } from './wqa.ts'
import { technicalBundle } from './technical.ts'
import { contentBundle } from './content.ts'
import { linksAuthorityBundle } from './linksAuthority.ts'
import { aiBundle } from './ai.ts'
import { uxConversionBundle } from './uxConversion.ts'
import { paidBundle } from './paid.ts'
import { commerceBundle } from './commerce.ts'
import { socialBundle } from './socialBrand.ts'
import { competitorsBundle } from './competitors.ts'
import { localBundle } from './local.ts'

export const rsRegistry: Record<Mode, RsModeBundle<any>> = {
	fullAudit:      fullAuditBundle,
	wqa:            wqaBundle,
	technical:      technicalBundle,
	content:        contentBundle,
	linksAuthority: linksAuthorityBundle,
	ai:             aiBundle,
	uxConversion:   uxConversionBundle,
	paid:           paidBundle,
	commerce:       commerceBundle,
	socialBrand:    socialBundle,
	competitors:    competitorsBundle,
	local:          localBundle,
}

export function getBundle(mode: Mode): RsModeBundle<any> | null {
	return rsRegistry[mode] ?? null
}

export function listRegisteredModes(): Mode[] {
	return Object.keys(rsRegistry) as Mode[]
}
