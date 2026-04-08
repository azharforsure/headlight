import React, { useMemo } from 'react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import StatusDonut from './charts/StatusDonut';
import ScoreHistogram from './charts/ScoreHistogram';
import CwvGauges from './charts/CwvGauges';
import CrawlDepthFunnel from './charts/CrawlDepthFunnel';
import ContentQualityRadar from './charts/ContentQualityRadar';
import IssueCategoryTreemap from './charts/IssueCategoryTreemap';
import PerformanceHeatmap from './charts/PerformanceHeatmap';

export default function ChartsView() {
  const { pages } = useSeoCrawler();

  // ─── Status Distribution ───
  const statusData = useMemo(() => {
    const buckets = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, 'Other': 0 };
    pages.forEach((p: any) => {
      const code = p.statusCode;
      if (code >= 200 && code < 300) buckets['2xx']++;
      else if (code >= 300 && code < 400) buckets['3xx']++;
      else if (code >= 400 && code < 500) buckets['4xx']++;
      else if (code >= 500) buckets['5xx']++;
      else buckets['Other']++;
    });
    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [pages]);

  // ─── Score Distribution ───
  const scoreData = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${i * 10 + 9}`,
      count: 0,
    }));
    pages.forEach((p: any) => {
      const score = p.healthScore ?? p.score ?? null;
      if (score == null) return;
      const idx = Math.min(Math.floor(score / 10), 9);
      buckets[idx].count++;
    });
    return buckets;
  }, [pages]);

  // ─── Core Web Vitals Averages ───
  const cwvData = useMemo(() => {
    let lcpSum = 0, clsSum = 0, inpSum = 0;
    let lcpCount = 0, clsCount = 0, inpCount = 0;
    pages.forEach((p: any) => {
      if (p.lcp > 0) { lcpSum += p.lcp; lcpCount++; }
      if (p.cls != null && p.cls >= 0) { clsSum += p.cls; clsCount++; }
      if (p.inp > 0) { inpSum += p.inp; inpCount++; }
    });
    return {
      lcp: lcpCount > 0 ? lcpSum / lcpCount : 0,
      cls: clsCount > 0 ? clsSum / clsCount : 0,
      inp: inpCount > 0 ? inpSum / inpCount : 0,
    };
  }, [pages]);

  // ─── Crawl Depth ───
  const depthData = useMemo(() => {
    const buckets: Record<string, number> = {};
    pages.forEach((p: any) => {
      const d = p.crawlDepth ?? 0;
      const key = d >= 6 ? '6+' : String(d);
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return ['0', '1', '2', '3', '4', '5', '6+'].map(k => ({
      depth: `Depth ${k}`,
      count: buckets[k] || 0,
    }));
  }, [pages]);

  // ─── Content Quality Radar ───
  const radarData = useMemo(() => {
    if (pages.length === 0) return [];
    const htmlPages = pages.filter(
      (p: any) => p.contentType?.includes('text/html') && p.statusCode === 200
    );
    if (htmlPages.length === 0) return [];
    const n = htmlPages.length;

    const avgReadability = htmlPages.reduce(
      (s: number, p: any) => s + (Number(p.readability) || 0), 0
    ) / n;
    const avgWordCount = htmlPages.reduce(
      (s: number, p: any) => s + (p.wordCount || 0), 0
    ) / n;
    const uniqueRate =
      (1 - htmlPages.filter((p: any) => p.exactDuplicate).length / n) * 100;
    const schemaRate =
      (htmlPages.filter((p: any) =>
        p.schemaTypes && p.schemaTypes.length > 0
      ).length / n) * 100;
    const headingRate =
      (htmlPages.filter((p: any) => p.h1_1).length / n) * 100;

    // Normalize to 0-100 scale
    return [
      { metric: 'Readability', value: Math.min(avgReadability, 100) },
      { metric: 'Word Count', value: Math.min((avgWordCount / 20), 100) },
      { metric: 'Uniqueness', value: uniqueRate },
      { metric: 'Schema', value: schemaRate },
      { metric: 'Headings', value: headingRate },
    ];
  }, [pages]);

  // ─── Issues by Category ───
  const issueTreemapData = useMemo(() => {
    const categories: Record<string, number> = {
      Content: 0, 'On-Page': 0, Performance: 0,
      Links: 0, Images: 0, Security: 0,
      Accessibility: 0, Technical: 0,
    };
    pages.forEach((p: any) => {
      if (!p.title) categories['On-Page']++;
      if (!p.metaDesc) categories['On-Page']++;
      if (p.wordCount > 0 && p.wordCount < 200) categories['Content']++;
      if (p.exactDuplicate) categories['Content']++;
      if (p.spellingErrors > 0) categories['Content']++;
      if (p.lcp > 2500) categories['Performance']++;
      if (p.cls > 0.1) categories['Performance']++;
      if (p.statusCode >= 400) categories['Links']++;
      if (p.missingAltImages > 0) categories['Images']++;
      if (p.mixedContent) categories['Security']++;
      if (p.insecureForms) categories['Security']++;
    });
    return Object.entries(categories)
      .filter(([, v]) => v > 0)
      .map(([name, size]) => ({ name, size }));
  }, [pages]);

  // ─── Heatmap Data (top 50 pages by traffic/score) ───
  const heatmapData = useMemo(() => {
    return pages
      .filter((p: any) => p.contentType?.includes('text/html') && p.statusCode === 200)
      .sort((a: any, b: any) => (b.gscClicks || 0) - (a.gscClicks || 0))
      .slice(0, 50)
      .map((p: any) => ({
        url: p.url,
        lcp: p.lcp || 0,
        cls: p.cls || 0,
        inp: p.inp || 0,
        ttfb: p.loadTime || 0,
        fcp: p.fcp || 0,
        size: p.sizeBytes || 0,
        score: p.healthScore ?? p.score ?? 0,
      }));
  }, [pages]);

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#666] text-sm">
        Run a crawl to see charts.
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#0a0a0a]">
      {/* Row 1: Status + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <StatusDonut data={statusData} total={pages.length} />
        <ScoreHistogram data={scoreData} />
      </div>

      {/* Row 2: CWV + Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CwvGauges data={cwvData} />
        <CrawlDepthFunnel data={depthData} />
      </div>

      {/* Row 3: Radar + Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ContentQualityRadar data={radarData} />
        <IssueCategoryTreemap data={issueTreemapData} />
      </div>

      {/* Row 4: Full-width Heatmap */}
      <PerformanceHeatmap data={heatmapData} />
    </div>
  );
}
