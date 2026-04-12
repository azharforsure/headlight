import { CheckResult, CheckEvaluator } from '../types';

export const checkNewsArticleSchema: CheckEvaluator = (page, ctx) => {
  const newsTypes = ['NewsArticle', 'Article', 'BlogPosting'];
  const hasNewsSchema = (page.schemaTypes || []).some((t: string) => newsTypes.includes(t));
  const isContentPage = page.wordCount > 300;
  if (!isContentPage && !hasNewsSchema) return null;

  return {
    checkId: 't4-news-article-schema',
    tier: 4, category: 'news', name: 'NewsArticle Schema',
    severity: hasNewsSchema ? 'pass' : 'info',
    value: { hasNewsSchema },
    expected: 'NewsArticle, Article, or BlogPosting schema on content pages',
    message: hasNewsSchema ? 'Content schema detected.' : 'No article-related schema found on this content page.',
    auditModes: ['full', 'news_editorial'], industries: ['news', 'blog']
  };
};

export const checkNewsPubDate: CheckEvaluator = (page) => {
  const hasDate = !!page.visibleDate;
  if (page.wordCount < 300) return null;

  return {
    checkId: 't4-news-pub-date',
    tier: 4, category: 'news', name: 'Publication Date',
    severity: hasDate ? 'pass' : 'info',
    value: { date: page.visibleDate },
    expected: 'Visible publication date on articles',
    message: hasDate ? `Publication date detected: ${page.visibleDate}` : 'No visible publication date found on this article.',
    auditModes: ['full', 'news_editorial'], industries: ['news', 'blog']
  };
};

export const checkNewsAuthor: CheckEvaluator = (page) => {
  const hasAuthor = page.industrySignals?.hasAuthorByline;
  if (page.wordCount < 300) return null;

  return {
    checkId: 't4-news-author',
    tier: 4, category: 'news', name: 'Author Attribution',
    severity: hasAuthor ? 'pass' : 'info',
    value: { hasAuthor },
    expected: 'Author byline on articles',
    message: hasAuthor ? 'Author byline detected.' : 'No author attribution found. Important for E-E-A-T.',
    auditModes: ['full', 'news_editorial'], industries: ['news', 'blog']
  };
};

export const newsChecks: Record<string, CheckEvaluator> = {
  't4-news-article-schema': checkNewsArticleSchema,
  't4-news-pub-date': checkNewsPubDate,
  't4-news-author': checkNewsAuthor,
};
