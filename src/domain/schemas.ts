import { Schema } from '@effect/schema';

const IELTSFeedbackSchema = Schema.Struct({
  overallScore: Schema.Number.pipe(Schema.between(0, 9)),
  breakdown: Schema.Struct({
    TR: Schema.Number,
    CC: Schema.Number,
    LR: Schema.Number,
    GRA: Schema.Number,
  }),
  critique: Schema.String,
  strengths: Schema.String,
  weakness: Schema.NullOr(Schema.String),
});

const PTEFeedbackSchema = Schema.Struct({
  overallScore: Schema.Number.pipe(Schema.between(10, 90)),
  breakdown: Schema.Struct({
    Content: Schema.Number,
    Form: Schema.Number,
    Structure: Schema.Number,
    Grammar: Schema.Number,
    Linguistic: Schema.Number,
    Vocab: Schema.Number,
    Spelling: Schema.Number,
  }),
  critique: Schema.String,
  strengths: Schema.String,
  weakness: Schema.NullOr(Schema.String),
});

export const ExaminerFeedbackSchema = Schema.Union(IELTSFeedbackSchema, PTEFeedbackSchema);

export type ExaminerFeedback = Schema.Schema.Type<typeof ExaminerFeedbackSchema>;
