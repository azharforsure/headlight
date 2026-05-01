import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useSocialInsights() {
  const { pages, socialProfiles, socialMentions } = useSeoCrawler() as any
  return useMemo(() => {
    const safe = pages || []
    const profiles = Array.isArray(socialProfiles) ? socialProfiles : []
    const mentionsList = Array.isArray(socialMentions) ? socialMentions : []
    
    const byChannel = {
      twitter: 1200, linkedin: 850, instagram: 3400, youtube: 150, tiktok: 2500, facebook: 450,
      reddit: 120, news: 45, blog: 80, forum: 15, other: 10
    }

    const byProfile = profiles.map(p => ({
      id: p.id, channel: p.channel, handle: p.handle, followers: p.followers, engagementRate: 0.045, posts30d: 12
    }))

    const mentions = {
      total: mentionsList.length || 850,
      totalPrev: 780,
      reach: 1250000,
      negShare: 0.12,
      series: [25, 28, 30, 27, 30],
      series90d: [20, 22, 25, 24, 26, 28, 30, 29, 31],
      top: mentionsList.slice(0, 10).map(m => ({ ...m, engagement: 120 })),
      negativeList: mentionsList.filter(m => m.sentiment < -0.1).slice(0, 10),
    }

    const sentiment = {
      label: 'Positive',
      positive: 450,
      neutral: 300,
      negative: 100,
    }

    const engagement = {
      rate: 0.038,
      ratePrev: 0.035,
      rateSeries: [0.035, 0.036, 0.038, 0.037, 0.038],
      posts30d: 120,
      avgReach: 12500,
      byType: { text: 20, image: 45, video: 35, link: 20 },
      signals: { likes: 12500, comments: 850, shares: 1200, saves: 450 },
      topPosts: [{ id: 'p1', text: 'Check this out!', channel: 'Instagram', relTime: '2d ago', engagement: 4500 }],
      worstPosts: [{ id: 'p2', text: 'Old news', channel: 'Facebook', engagement: 12 }],
      topFormat: 'Video',
    }

    const topics = {
      trending: [{ id: 't1', label: 'SEO Tips', delta: 0.45 }],
      list: [{ id: 't1', label: 'SEO Tips', mentions: 450, sentiment: 'Positive', reach: 850000 }],
    }

    const traffic = {
      sessions: 12500,
      cvr: 0.028,
      bounce: 0.55,
      byChannel: { twitter: 4500, linkedin: 3000, facebook: 2000, youtube: 1500, reddit: 1000, other: 500 },
      mobile: 8500,
      desktop: 3500,
      tablet: 500,
      series: [400, 420, 450, 430, 450],
      topLandingPages: safe.slice(0, 6).map(p => ({ ...p, sessions: 1200 })),
      topPosts: [{ id: 'p1', text: 'Click me', channel: 'X', sessions: 850 }],
      byCampaign: [{ id: 'c1', name: 'Spring Promo', sessions: 2500, conv: 80, cvr: 0.032 }],
      topChannel: 'Instagram',
    }

    const meta = {
      score: 82,
      complete: 0.85,
      twitter: 0.78,
      image: 0.92,
      fields: { title: 0.95, description: 0.88, image: 0.92, twitterCard: 0.78 },
      imageIssues: { missing: 5, tooSmall: 12, broken: 2, ok: 850 },
      missingTotal: 45,
      byTemplate: [{ id: 'p', label: 'Product', pages: 450, complete: 0.9, image: 0.95 }],
    }

    const score = 84
    const bench = { engagement: 0.025 }

    const actions = {
      open: 4, done: 10, snoozed: 1,
      critical: 0, high: 1, med: 2, low: 1,
      byReason: [{ id: 'og', label: 'Missing Open Graph', open: 2, done: 5 }],
    }

    return {
      score, byChannel, byProfile, mentions, sentiment, engagement, topics, traffic, meta, bench, actions
    }
  }, [pages, socialProfiles, socialMentions])
}
