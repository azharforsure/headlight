export interface Deduction { id: string; label: string; points: number }

export function computeDeductions({ tech, issues, perf }: {
  tech: any
  issues: any
  perf: any
}): { items: Deduction[]; totalLost: number } {
  const items: Deduction[] = []
  const push = (id: string, label: string, points: number) => {
    if (points > 0) items.push({ id, label, points })
  }

  push('errors-5xx', `${issues.errors5xx} pages return 5xx`, issues.errors5xx * 1.2)
  push('errors-4xx', `${issues.errors4xx} pages return 4xx`, issues.errors4xx * 0.5)
  push('not-indexable', `${issues.notIndexable} pages not indexable`, issues.notIndexable * 0.4)
  push('cwv-fail',
    `${(perf.lcpFail ?? 0) + (perf.inpFail ?? 0) + (perf.clsFail ?? 0)} pages fail Core Web Vitals`,
    ((perf.lcpFail ?? 0) + (perf.inpFail ?? 0) + (perf.clsFail ?? 0)) * 0.3
  )
  push('schema-errors', `${tech?.schema?.errors ?? 0} schema validation errors`, (tech?.schema?.errors ?? 0) * 0.2)
  push('orphans', `${issues.orphans} orphan pages`, issues.orphans * 0.4)
  push('canonical-mismatch', `${issues.canonicalMismatch} canonical mismatches`, issues.canonicalMismatch * 0.2)
  push('missing-alt', `${issues.missingAlt} images missing alt`, Math.min(issues.missingAlt * 0.05, 8))
  push('mixed-content', `${tech?.securityIssues?.mixedContent ?? 0} pages with mixed content`, (tech?.securityIssues?.mixedContent ?? 0) * 0.6)
  push('exposed-keys', `${tech?.securityIssues?.exposedKeys ?? 0} pages with exposed keys`, (tech?.securityIssues?.exposedKeys ?? 0) * 1.0)

  items.sort((a, b) => b.points - a.points)
  const totalLost = items.reduce((a, b) => a + b.points, 0)
  return { items: items.slice(0, 6), totalLost }
}
