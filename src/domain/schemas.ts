import { z } from 'zod';

const IELTSFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(9),
  breakdown: z.object({
    TR: z.number(),
    CC: z.number(),
    LR: z.number(),
    GRA: z.number(),
  }),
  critique: z.string(),
  strengths: z.string(),
  weakness: z.string().nullable(),
});

const PTEFeedbackSchema = z.object({
  overallScore: z.number().min(10).max(90),
  breakdown: z.object({
    Content: z.number(),
    Form: z.number(),
    Structure: z.number(),
    Grammar: z.number(),
    Linguistic: z.number(),
    Vocab: z.number(),
    Spelling: z.number(),
  }),
  critique: z.string(),
  strengths: z.string(),
  weakness: z.string().nullable(),
});

export const ExaminerFeedbackSchema = z.union([IELTSFeedbackSchema, PTEFeedbackSchema]);

export type ExaminerFeedback = z.infer<typeof ExaminerFeedbackSchema>;
