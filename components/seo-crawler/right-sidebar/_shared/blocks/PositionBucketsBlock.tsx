import React from 'react'
import { RankBucketsBlock } from '..'

export function PositionBucketsBlock({ title = 'Position buckets', buckets, onBucketClick }: {
  title?: string
  buckets: { top3: number; p4_10: number; p11_20: number; p21_50: number; p51plus: number }
  onBucketClick?: (id: string) => void
}) {
  return (
    <RankBucketsBlock
      title={title}
      buckets={[
        { label: 'Top 3', value: buckets.top3,    tone: 'good' as const,    onClick: () => onBucketClick?.('Top 3') },
        { label: '4–10',  value: buckets.p4_10,   tone: 'good' as const,    onClick: () => onBucketClick?.('4–10') },
        { label: '11–20', value: buckets.p11_20,  tone: 'warn' as const,    onClick: () => onBucketClick?.('11–20') },
        { label: '21–50', value: buckets.p21_50,  tone: 'warn' as const,    onClick: () => onBucketClick?.('21–50') },
        { label: '51+',   value: buckets.p51plus, tone: 'neutral' as const, onClick: () => onBucketClick?.('51+') },
      ]}
    />
  )
}
