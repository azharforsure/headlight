import { CheckEvaluator } from '../types';

export const checkEduCourseSchema: CheckEvaluator = (page, ctx) => {
  if (ctx?.industry !== 'education') return null;
  const hasCourseSchema = page.industrySignals?.hasCourseSchema;
  const isCourseLike = /course|program|degree|lesson|curriculum|training/i.test(
    `${page.title || ''} ${page.h1_1 || ''} ${page.url || ''}`
  );
  if (!isCourseLike && !hasCourseSchema) return null;

  return {
    checkId: 't4-edu-course-schema',
    tier: 4, category: 'education', name: 'Course Schema',
    severity: hasCourseSchema ? 'pass' : 'info',
    value: { hasCourseSchema },
    expected: 'Course or educational program schema on course-related pages',
    message: hasCourseSchema ? 'Education/course schema detected.' : 'No course-related structured data detected.',
    auditModes: ['full'], industries: ['education']
  };
};

export const checkEduAccreditation: CheckEvaluator = (page, ctx) => {
  if (ctx?.industry !== 'education') return null;
  if (page.crawlDepth !== 0 && !page.industrySignals?.hasAccreditation) return null;
  const hasAccreditation = page.industrySignals?.hasAccreditation;

  return {
    checkId: 't4-edu-accreditation',
    tier: 4, category: 'education', name: 'Accreditation Signals',
    severity: hasAccreditation ? 'pass' : 'info',
    value: { hasAccreditation },
    expected: 'Visible accreditation language or accrediting-body references',
    message: hasAccreditation ? 'Accreditation signal detected.' : 'No clear accreditation signal detected.',
    auditModes: ['full'], industries: ['education']
  };
};

export const checkEduSyllabus: CheckEvaluator = (page, ctx) => {
  if (ctx?.industry !== 'education') return null;
  const hasSyllabus = page.industrySignals?.hasSyllabus;
  const isCourseLike = /course|program|degree|lesson|curriculum|training/i.test(
    `${page.title || ''} ${page.h1_1 || ''} ${page.url || ''}`
  );
  if (!isCourseLike && !hasSyllabus) return null;

  return {
    checkId: 't4-edu-syllabus',
    tier: 4, category: 'education', name: 'Syllabus Structure',
    severity: hasSyllabus ? 'pass' : 'info',
    value: { hasSyllabus },
    expected: 'Structured syllabus, curriculum, or learning-outcome content',
    message: hasSyllabus ? 'Syllabus or curriculum structure detected.' : 'No syllabus-style structure detected.',
    auditModes: ['full', 'content'], industries: ['education']
  };
};

export const educationChecks: Record<string, CheckEvaluator> = {
  't4-edu-course-schema': checkEduCourseSchema,
  't4-edu-accreditation': checkEduAccreditation,
  't4-edu-syllabus': checkEduSyllabus,
};
