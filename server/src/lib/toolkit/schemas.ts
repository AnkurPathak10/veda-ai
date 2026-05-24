import { z } from "zod";

export const TOOLKIT_TOOLS = [
  "lesson-plan",
  "worksheet",
  "differentiated-papers",
  "chapter-summary",
] as const;

export type ToolkitToolId = (typeof TOOLKIT_TOOLS)[number];

const uploadedFileSchema = z.object({
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
});

const baseRequestSchema = z.object({
  uploadedFile: uploadedFileSchema,
  additionalInfo: z.string().max(4000).optional(),
});

export const lessonPlanRequestSchema = baseRequestSchema.extend({
  tool: z.literal("lesson-plan"),
  durationMinutes: z.number().int().min(20).max(120).optional(),
  className: z.string().max(100).optional(),
});

export const lessonPlanSchema = z.object({
  introMessage: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  learningObjectives: z.array(z.string().min(1)).min(1),
  materials: z.array(z.string().min(1)),
  introduction: z.object({
    activity: z.string().min(1),
    durationMinutes: z.number().int().positive(),
  }),
  mainActivities: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        durationMinutes: z.number().int().positive(),
      }),
    )
    .min(1),
  assessment: z.string().min(1),
  homework: z.string().min(1),
  closingNotes: z.string().min(1),
});

export const worksheetRequestSchema = baseRequestSchema.extend({
  tool: z.literal("worksheet"),
  questionCount: z.number().int().min(3).max(25).optional(),
});

export const worksheetSchema = z.object({
  introMessage: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  instructions: z.string().min(1),
  questions: z
    .array(
      z.object({
        number: z.number().int().positive(),
        text: z.string().min(1),
        type: z.enum(["mcq", "short", "fill", "match"]),
        options: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1),
  answerKey: z
    .array(
      z.object({
        number: z.number().int().positive(),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

export const differentiatedPapersRequestSchema = baseRequestSchema.extend({
  tool: z.literal("differentiated-papers"),
  questionCount: z.number().int().min(3).max(20).optional(),
});

const differentiatedVariantSchema = z.object({
  level: z.enum(["Easy", "Moderate", "Challenging"]),
  header: z.object({
    subject: z.string().min(1),
    className: z.string().min(1),
    timeAllowedMinutes: z.number().int().positive(),
    maximumMarks: z.number().int().positive(),
    generalInstructions: z.string().min(1),
  }),
  questions: z
    .array(
      z.object({
        number: z.number().int().positive(),
        text: z.string().min(1),
        marks: z.number().int().positive(),
        type: z.string().min(1),
        options: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1),
  answerKey: z
    .array(
      z.object({
        number: z.number().int().positive(),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

export const differentiatedPapersSchema = z.object({
  introMessage: z.string().min(1),
  variants: z.array(differentiatedVariantSchema).length(3),
});

export const chapterSummaryRequestSchema = baseRequestSchema.extend({
  tool: z.literal("chapter-summary"),
  summaryLength: z.enum(["short", "medium", "detailed"]).optional(),
});

export const chapterSummarySchema = z.object({
  introMessage: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  importantTerms: z
    .array(
      z.object({
        term: z.string().min(1),
        definition: z.string().min(1),
      }),
    )
    .min(1),
  revisionQuestions: z.array(z.string().min(1)).min(1),
});

export const toolkitRequestSchema = z.discriminatedUnion("tool", [
  lessonPlanRequestSchema,
  worksheetRequestSchema,
  differentiatedPapersRequestSchema,
  chapterSummaryRequestSchema,
]);

export type ToolkitRequest = z.infer<typeof toolkitRequestSchema>;

export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type Worksheet = z.infer<typeof worksheetSchema>;
export type DifferentiatedPapers = z.infer<typeof differentiatedPapersSchema>;
export type ChapterSummary = z.infer<typeof chapterSummarySchema>;

export type ToolkitResult =
  | { tool: "lesson-plan"; result: LessonPlan }
  | { tool: "worksheet"; result: Worksheet }
  | { tool: "differentiated-papers"; result: DifferentiatedPapers }
  | { tool: "chapter-summary"; result: ChapterSummary };

export type ToolkitGenerationResult = {
  tool: ToolkitToolId;
  result: LessonPlan | Worksheet | DifferentiatedPapers | ChapterSummary;
  model: string;
};

const resultSchemas: Record<ToolkitToolId, z.ZodType> = {
  "lesson-plan": lessonPlanSchema,
  worksheet: worksheetSchema,
  "differentiated-papers": differentiatedPapersSchema,
  "chapter-summary": chapterSummarySchema,
};

export function validateToolkitResult(
  tool: ToolkitToolId,
  json: unknown,
): LessonPlan | Worksheet | DifferentiatedPapers | ChapterSummary {
  const schema = resultSchemas[tool];
  const validated = schema.safeParse(json);

  if (!validated.success) {
    console.error(`Toolkit ${tool} validation failed:`, validated.error);
    throw new Error(
      "AI generated an invalid response structure. Please try again.",
    );
  }

  return validated.data as
    | LessonPlan
    | Worksheet
    | DifferentiatedPapers
    | ChapterSummary;
}
